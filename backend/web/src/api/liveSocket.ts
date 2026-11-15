import { tryCatch } from "@backend/errors/tryCatch.js";
import { SOCKET_PATH, VIEWER_PROTOCOL } from "./api.constants.js";
import type { LiveMessage } from "../domain/liveUpdates.js";
import { liveMessageSchema } from "./schemas.js";

/** A read-only socket to the team: the same updates the Mac app gets, the moment they happen. */
export const openLiveSocket = (token: string): WebSocket => {
  const address = new URL(SOCKET_PATH, window.location.href);
  address.protocol = address.protocol === "https:" ? "wss:" : "ws:";
  return new WebSocket(address, [VIEWER_PROTOCOL, token]);
};

/** Null for anything this app doesn't use, or can't read. */
export const readLiveMessage = (payload: unknown): LiveMessage | null => {
  if (typeof payload !== "string") return null;
  const decoded = tryCatch((): unknown => JSON.parse(payload));
  const parsed = liveMessageSchema.safeParse(decoded);
  if (!parsed.success) return null;
  return parsed.data;
};
