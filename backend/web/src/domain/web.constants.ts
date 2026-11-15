export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;
/** A red that has waited this long breathes, as in the Mac app. */
export const BREATHING_AFTER_MS = 10 * MINUTE_MS;

/** How often a "last N days" window slides forward to now. */
export const LIVE_WINDOW_REFRESH_MS = 60_000;
/** Keeps the live socket from being closed as idle. */
export const SOCKET_PING_MS = 25_000;
/** How long to wait before reconnecting a dropped live socket. */
export const SOCKET_RETRY_MS = 3_000;
