const DAY_MS = 24 * 60 * 60 * 1000;

export const HISTORY_MAX_SPAN_MS = 400 * DAY_MS;
export const HISTORY_MAX_MEMBERS = 200;
export const HISTORY_EVENT_LIMIT = 20_000;
/** How far before a window joins are read, to know who was with whom when it opens. A join ends when either person
 * goes Clear or Off, and a Mac that goes away is switched Off, so none stays open anywhere near this long. */
export const HISTORY_JOIN_LOOKBACK_MS = 7 * DAY_MS;
