import { authenticateDevice } from "../application/auth/authenticate.js";
import type { AuthDependencies } from "../application/auth/authDependencies.js";
import { greetMember } from "../application/greetMember.js";
import { noteConnected } from "../application/presence/offlineLights.js";
import type { MemberId } from "../domain/memberId.js";
import { toEveryone } from "../protocol/serverMessage.js";
import { errorResponse } from "../http/httpResponses.js";
import { bearerToken } from "../http/requestBody.js";
import { UnauthorisedError } from "../errors/andonError.js";
import { SWITCHING_PROTOCOLS_STATUS, UPGRADE_REQUIRED_STATUS } from "./runtime.constants.js";
import { deliverToSockets, onlineMemberIds, sendError, sendMessage } from "./teamSockets.js";

/** Hibernatable sockets: the object can sleep between messages without dropping connections. */
export const acceptTeamSocket = async (state: DurableObjectState, dependencies: AuthDependencies, request: Request): Promise<Response> => {
  const isUpgrade = request.headers.get("upgrade")?.toLowerCase() === "websocket";
  if (!isUpgrade) return new Response("Expected a WebSocket upgrade.", { status: UPGRADE_REQUIRED_STATUS });

  const deviceToken = bearerToken(request);
  if (deviceToken === null) return errorResponse(new UnauthorisedError());

  const member = await authenticateDevice(dependencies, deviceToken);
  if (member instanceof Error) return errorResponse(member);

  const wasOnline = onlineMemberIds(state).includes(member.id);
  const cancelled = noteConnected(dependencies, member.id);
  if (cancelled instanceof Error) return errorResponse(cancelled);
  const socketPair = new WebSocketPair();
  state.acceptWebSocket(socketPair[1], [member.id]);

  greetSocket(dependencies, socketPair[1], member.id);
  if (!wasOnline) {
    deliverToSockets(state, [toEveryone({ type: "presence", memberId: member.id, isOnline: true })]);
  }

  return new Response(null, { status: SWITCHING_PROTOCOLS_STATUS, webSocket: socketPair[0] });
};

const greetSocket = (dependencies: AuthDependencies, socket: WebSocket, memberId: MemberId): void => {
  const hello = greetMember(dependencies, memberId);
  if (hello instanceof Error) return sendError(socket, hello);
  return sendMessage(socket, hello);
};
