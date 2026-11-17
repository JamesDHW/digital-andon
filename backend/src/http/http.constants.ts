export const EVENT_PAGE_DEFAULT_LIMIT = 500;
export const EVENT_PAGE_MAX_LIMIT = 5000;
/** On a full page of events: the afterId that fetches the next page. Absent on the last page. */
export const EVENT_PAGE_NEXT_HEADER = "x-next-after-id";
/** How many events a page holds, since a CSV row count can't be read from its lines alone. */
export const EVENT_PAGE_COUNT_HEADER = "x-event-count";
export const DEVICE_NAME_MAX_LENGTH = 80;
export const MEMBER_PATH_PATTERN = /^\/team\/members\/([^/]+)$/;
export const CSV_HEADER = "id,at,kind,memberId,name,colour,context,source,withMemberId,withName";
export const NO_CONTENT_STATUS = 204;
export const FOUND_STATUS = 302;
/** The Mac app's sign-in window waits for a redirect to this address. */
export const APP_SIGNED_IN_URL = "andon://signed-in";
/** The web app reads a Google sign-in from the fragment of this page. */
export const WEB_HOME_PATH = "/";
export const DEFAULT_APP_DEVICE_NAME = "Mac";
export const DEFAULT_WEB_DEVICE_NAME = "Web";
