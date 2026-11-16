export const SETTINGS_KEY = "team";
export const MEMBER_COLUMNS = "id, name, email, avatar_url, role, joined_at";
/** A light's status is stored in the column "topic", its name before it became status. */
export const LIGHT_COLUMNS = "member_id, colour, topic, since";
export const EVENT_COLUMNS = "id, kind, member_id, colour, topic, source, note, at";
export const HELP_COLUMNS = "helper_id, target_id, return_colour, return_status, joined_at";
/** Status events were called "topic" before; both kinds are read as status. */
export const STATUS_EVENT_KINDS = "('status', 'topic')";
/** Every kind a listing returns: light changes, and joining or leaving someone. */
export const LISTED_EVENT_KINDS = "('pull', 'status', 'topic', 'join', 'leave')";
