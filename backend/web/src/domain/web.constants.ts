export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;
/** A red that has waited this long breathes, as in the Mac app. */
export const BREATHING_AFTER_MS = 10 * MINUTE_MS;
/** How often the Team page asks for fresh lights. */
export const SNAPSHOT_POLL_MS = 5_000;
/** How often a "last N days" window slides forward to now. */
export const LIVE_WINDOW_REFRESH_MS = 60_000;
