import { AndonError } from "../errors/andonError.js";
import { tryCatch } from "../errors/tryCatch.js";
import { isMemberId, type MemberId } from "../domain/memberId.js";
import type { Delivery, ServerMessage } from "../protocol/serverMessage.js";
import { VIEWER_SOCKET_TAG } from "./runtime.constants.js";

/** Open sockets are tagged with their member id when accepted. */
export const socketMemberId = (state: DurableObjectState, socket: WebSocket): MemberId | null => {
  const memberId = state.getTags(socket).at(0);
  const isTaggedMember = memberId !== undefined && isMemberId(memberId);
  if (!isTaggedMember) return null;
  return memberId;
};

/** The web app watches over a socket too, but only the Mac app counts as being online. */
export const isViewerSocket = (state: DurableObjectState, socket: WebSocket): boolean => state.getTags(socket).includes(VIEWER_SOCKET_TAG);

export const onlineMemberIds = (state: DurableObjectState): readonly MemberId[] => {
  const memberIds = state
    .getWebSockets()
    .filter((socket) => !isViewerSocket(state, socket))
    .map((socket) => socketMemberId(state, socket))
    .filter((memberId) => memberId !== null);
  return [...new Set(memberIds)];
};

export const hasOtherOpenSocket = (state: DurableObjectState, memberId: MemberId, closingSocket: WebSocket): boolean =>
  state.getWebSockets(memberId).some((socket) => isOtherOpenAppSocket(state, socket, closingSocket));

const isOtherOpenAppSocket = (state: DurableObjectState, socket: WebSocket, closingSocket: WebSocket): boolean =>
  socket !== closingSocket && socket.readyState === WebSocket.OPEN && !isViewerSocket(state, socket);

export const deliverToSockets = (state: DurableObjectState, deliveries: readonly Delivery[]): void => {
  for (const delivery of deliveries) {
    const sockets = audienceSockets(state, delivery);
    for (const socket of sockets) {
      sendMessage(socket, delivery.message);
    }
  }
};

/** A socket that closed mid-send is cleaned up by its close handler; the send failure itself is not actionable. */
export const sendMessage = (socket: WebSocket, message: ServerMessage): void => {
  tryCatch(() => socket.send(JSON.stringify(message)));
};

export const sendError = (socket: WebSocket, error: AndonError): void => {
  sendMessage(socket, { type: "error", code: error.code, message: error.message });
};

const audienceSockets = (state: DurableObjectState, delivery: Delivery): readonly WebSocket[] => {
  switch (delivery.audience.kind) {
    case "everyone":
      return state.getWebSockets();
    case "member":
      return state.getWebSockets(delivery.audience.memberId);
    default:
      return delivery.audience satisfies never;
  }
};
