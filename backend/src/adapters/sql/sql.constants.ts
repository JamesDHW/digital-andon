export const SETTINGS_KEY = "team";
export const MEMBER_COLUMNS = "id, name, email, avatar_url, role, joined_at";
/** A light's status is stored in the column "topic", its name before it became status. */
export const LIGHT_COLUMNS = "member_id, colour, topic, since";
export const EVENT_COLUMNS = "id, kind, member_id, colour, topic, source, note, at";
export const HELP_COLUMNS = "helper_id, target_id, return_colour, return_status, joined_at";
/** Status events were called "topic" before; both kinds are read as status. */
export const STATUS_STORED_KINDS = ["status", "topic"] as const;
export const JOIN_EVENT_KINDS = "('join', 'leave')";
/** A list of member ids bound as one JSON array: Durable Objects allow at most 100 bound parameters per query,
 * so one placeholder per person would fail for larger teams. An empty array matches nobody. */
export const MEMBER_ID_LIST = "(SELECT value FROM json_each(?))";
/** Every kind a listing returns: light changes, and joining or leaving someone. */
export const LISTED_EVENT_KINDS = "('pull', 'status', 'topic', 'join', 'leave')";
