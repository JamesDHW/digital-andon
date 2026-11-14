import { DurableObject } from "cloudflare:workers";

import { InvalidRequestError } from "../errors/andonError.js";
import { tryCatch, tryCatchAsync } from "../errors/tryCatch.js";
import type { AuthDependencies } from "../application/auth/authDependencies.js";
import { handleClientMessage } from "../application/handleClientMessage.js";
import { migrateSchema } from "../adapters/sql/migrateSchema.js";
import { routeRequest } from "../http/routeRequest.js";
import { parseClientMessage } from "../protocol/clientMessage.js";
import { toEveryone } from "../protocol/serverMessage.js";
import { acceptTeamSocket } from "./acceptTeamSocket.js";
import { readDeploymentConfiguration, type AndonEnvironment } from "./andonEnvironment.js";
import { createTeamDependencies } from "./createTeamDependencies.js";
import { createR2AvatarStore } from "./r2AvatarStore.js";
import { LOCAL_ORIGIN, NORMAL_CLOSURE_CODE, RESERVED_CLOSE_CODES, SOCKET_PING, SOCKET_PONG } from "./runtime.constants.js";
import { deliverToSockets, hasOtherOpenSocket, onlineMemberIds, sendError, socketMemberId } from "./teamSockets.js";

/** One instance holds a whole team: members, lights, follows, the event log and every open socket. */
export class TeamObject extends DurableObject<AndonEnvironment> {
  constructor(state: DurableObjectState, environment: AndonEnvironment) {
    super(state, environment);
    state.setWebSocketAutoResponse(new WebSocketRequestResponsePair(SOCKET_PING, SOCKET_PONG));
    const migrated = migrateSchema(state.storage.sql);
    if (migrated instanceof Error) {
      console.error(`[andon] schema migration failed: ${migrated.message}`);
    }
  }

  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const dependencies = this.dependencies(url.origin);
    if (url.pathname === "/ws") return acceptTeamSocket(this.ctx, dependencies, request);

    const isDevelopmentMode = readDeploymentConfiguration(this.env).isDevelopmentMode;
    const outcome = await routeRequest({ request, url, dependencies, avatars: createR2AvatarStore(this.env.AVATARS), isDevelopmentMode });
    await discardUnreadBody(request);
    deliverToSockets(this.ctx, outcome.deliveries);
    return outcome.response;
  }

  override async webSocketMessage(socket: WebSocket, rawMessage: string | ArrayBuffer): Promise<void> {
    const memberId = socketMemberId(this.ctx, socket);
    if (memberId === null) return;
    if (typeof rawMessage !== "string") return sendError(socket, new InvalidRequestError("Send text messages."));

    const message = parseClientMessage(rawMessage);
    if (message instanceof Error) return sendError(socket, message);

    const deliveries = handleClientMessage(this.dependencies(LOCAL_ORIGIN), memberId, message);
    if (deliveries instanceof Error) return sendError(socket, deliveries);
    deliverToSockets(this.ctx, deliveries);
  }

  override async webSocketClose(socket: WebSocket, code: number, reason: string): Promise<void> {
    tryCatch(() => socket.close(sendableCloseCode(code), reason));
    const memberId = socketMemberId(this.ctx, socket);
    const isPresenceUnchanged = memberId === null || hasOtherOpenSocket(this.ctx, memberId, socket);
    if (isPresenceUnchanged) return;

    deliverToSockets(this.ctx, [toEveryone({ type: "presence", memberId, isOnline: false })]);
  }

  private dependencies(requestOrigin: string): AuthDependencies {
    const configuration = readDeploymentConfiguration(this.env);
    return createTeamDependencies({
      sql: this.ctx.storage.sql,
      configuration,
      publicOrigin: configuration.publicOrigin ?? requestOrigin,
      onlineMembers: () => onlineMemberIds(this.ctx),
    });
  }
}

const isReservedCloseCode = (code: number): boolean => RESERVED_CLOSE_CODES.some((reservedCode) => reservedCode === code);

const sendableCloseCode = (code: number): number => {
  if (isReservedCloseCode(code)) return NORMAL_CLOSURE_CODE;
  return code;
};

/** A request refused before its body was read (e.g. 401) must still drain it, or the runtime reports an uncaught stream error. */
const discardUnreadBody = async (request: Request): Promise<void> => {
  const isBodyUnread = request.body !== null && !request.bodyUsed;
  if (!isBodyUnread) return;
  await tryCatchAsync(() => request.arrayBuffer());
};
