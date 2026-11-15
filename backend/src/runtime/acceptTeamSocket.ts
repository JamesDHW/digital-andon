import { authenticateDevice } from "../application/auth/authenticate.js";
import type { AuthDependencies } from "../application/auth/authDependencies.js";
import { greetMember } from "../application/greetMember.js";
import { noteConnected } from "../application/presence/offlineLights.js";
import type { MemberId } from "../domain/memberId.js";
import { toEveryone } from "../protocol/serverMessage.js";
import { errorResponse } from "../http/httpResponses.js";
import { bearerToken } from "../http/requestBody.js";
import { UnauthorisedError } from "../errors/andonError.js";
import { SWITCHING_PROTOCOLS_STATUS, UPGRADE_REQUIRED_STATUS, VIEWER_PROTOCOL, VIEWER_SOCKET_TAG } from "./runtime.constants.js";
import { deliverToSockets, onlineMemberIds, sendError, sendMessage } from "./teamSockets.js";

/** Hibernatable sockets: the object can sleep between messages without dropping connections. */
export const acceptTeamSocket = async (state: DurableObjectState, dependencies: AuthDependencies, request: Request): Promise<Response> => {
  const isUpgrade = request.headers.get("upgrade")?.toLowerCase() === "websocket";
  if (!isUpgrade) return new Response("Expected a WebSocket upgrade.", { status: UPGRADE_REQUIRED_STATUS });

  const appToken = bearerToken(request);
  const viewerToken = viewerProtocolToken(request);
  const deviceToken = appToken ?? viewerToken;
  if (deviceToken === null) return errorResponse(new UnauthorisedError());

  const member = await authenticateDevice(dependencies, deviceToken);
  if (member instanceof Error) return errorResponse(member);

  const socketPair = new WebSocketPair();
  if (appToken === null) return acceptViewer(state, dependencies, socketPair[0], socketPair[1], member.id);

  const wasOnline = onlineMemberIds(state).includes(member.id);
  const cancelled = noteConnected(dependencies, member.id);
  if (cancelled instanceof Error) return errorResponse(cancelled);
  state.acceptWebSocket(socketPair[1], [member.id]);

  greetSocket(dependencies, socketPair[1], member.id);
  if (!wasOnline) {
    deliverToSockets(state, [toEveryone({ type: "presence", memberId: member.id, isOnline: true })]);
  }

  return new Response(null, { status: SWITCHING_PROTOCOLS_STATUS, webSocket: socketPair[0] });
};

/** The web app only watches: it gets every update, but doesn't make anyone online or keep anyone's light on. */
const acceptViewer = (state: DurableObjectState, dependencies: AuthDependencies, client: WebSocket, server: WebSocket, memberId: MemberId): Response => {
  state.acceptWebSocket(server, [memberId, VIEWER_SOCKET_TAG]);
  greetSocket(dependencies, server, memberId);
  return new Response(null, { status: SWITCHING_PROTOCOLS_STATUS, webSocket: client, headers: { "sec-websocket-protocol": VIEWER_PROTOCOL } });
};

/** "digital-andon-viewer, <token>" from new WebSocket(url, ["digital-andon-viewer", token]). */
const viewerProtocolToken = (request: Request): string | null => {
  const [protocol, token] = (request.headers.get("sec-websocket-protocol") ?? "").split(",").map((part) => part.trim());
  const isViewer = protocol === VIEWER_PROTOCOL && token !== undefined && token.length > 0;
  if (!isViewer) return null;
  return token;
};

const greetSocket = (dependencies: AuthDependencies, socket: WebSocket, memberId: MemberId): void => {
  const hello = greetMember(dependencies, memberId);
  if (hello instanceof Error) return sendError(socket, hello);
  return sendMessage(socket, hello);
};
