export const TOKEN_STORAGE_KEY = "digitalAndon.token";
export const GOOGLE_SIGN_IN_PATH = "/auth/google/start?client=web";
export const UNAUTHORISED_STATUS = 401;
export const NO_CONTENT_STATUS = 204;
/** Matches VIEWER_PROTOCOL on the server: the token travels as the second subprotocol. */
export const VIEWER_PROTOCOL = "digital-andon-viewer";
export const SOCKET_PATH = "/ws";
/** Match EVENT_PAGE_NEXT_HEADER and EVENT_PAGE_COUNT_HEADER on the server. */
export const EVENT_PAGE_NEXT_HEADER = "x-next-after-id";
export const EVENT_PAGE_COUNT_HEADER = "x-event-count";
/** The most events the server sends per page. */
export const EVENT_PAGE_LIMIT = 5000;
