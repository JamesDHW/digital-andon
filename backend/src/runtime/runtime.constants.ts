export const TEAM_OBJECT_NAME = "team";
export const SOCKET_PING = "ping";
export const SOCKET_PONG = "pong";
export const SWITCHING_PROTOCOLS_STATUS = 101;
export const NORMAL_CLOSURE_CODE = 1000;
/** Close codes that only describe a close and may not be sent back (RFC 6455 §7.4.1). */
export const RESERVED_CLOSE_CODES = [1005, 1006, 1015] as const;
export const UPGRADE_REQUIRED_STATUS = 426;
export const LOCAL_ORIGIN = "http://localhost:8787";
export const DEFAULT_TEAM_NAME = "Team";
export const DEFAULT_EMAIL_FROM = "Digital Andon <andon@example.com>";
export const TEAM_PATH_PREFIXES = ["/auth/", "/me", "/team/", "/ws", "/dev/"] as const;
export const NOT_FOUND_STATUS = 404;
export const FOUND_REDIRECT_STATUS = 302;
export const MOVED_PERMANENTLY_STATUS = 301;
/** Pages of the single-page web app: each serves its index.html, and the app shows the right page. */
export const WEB_APP_PAGES = ["/team", "/timeline", "/export", "/settings"] as const;
/** The admin page before the web app replaced it. */
export const OLD_ADMIN_PATHS = ["/admin", "/admin/", "/join", "/join/"] as const;
