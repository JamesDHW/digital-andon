export const SCHEMA_STATEMENTS = [
  "CREATE TABLE IF NOT EXISTS members (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, avatar_url TEXT, role TEXT NOT NULL, joined_at INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS lights (member_id TEXT PRIMARY KEY, colour TEXT NOT NULL, topic TEXT, since INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS follows (follower_id TEXT NOT NULL, followee_id TEXT NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY (follower_id, followee_id))",
  "CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, member_id TEXT NOT NULL, colour TEXT, topic TEXT, source TEXT, note TEXT, at INTEGER NOT NULL)",
  "CREATE INDEX IF NOT EXISTS events_by_member ON events (member_id, at)",
  "CREATE TABLE IF NOT EXISTS devices (token_hash TEXT PRIMARY KEY, member_id TEXT NOT NULL, name TEXT NOT NULL, created_at INTEGER NOT NULL, last_seen_at INTEGER NOT NULL)",
  "DROP TABLE IF EXISTS invites",
  "CREATE TABLE IF NOT EXISTS login_codes (email TEXT PRIMARY KEY, code_hash TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, attempts INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
  // Photos only ever come from Google now; any other photo link is dropped until the person next signs in with Google.
  "UPDATE members SET avatar_url = NULL WHERE avatar_url NOT LIKE 'https://%.googleusercontent.com/%'",
  "CREATE TABLE IF NOT EXISTS presence_checks (member_id TEXT PRIMARY KEY, due_at INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS sign_in_attempts (state_hash TEXT PRIMARY KEY, code_verifier TEXT NOT NULL, client TEXT NOT NULL, device_name TEXT NOT NULL, expires_at INTEGER NOT NULL)",
  // Joins are a small share of events: this lets a history read them newest first without scanning every light change.
  // Its WHERE must match JOIN_EVENT_KINDS as written, or SQLite won't use it.
  // Finds someone's last pull or status before a window without walking back through all of their other events:
  // without it, someone who never sets a status costs a scan of their whole history on every timeline.
  "CREATE INDEX IF NOT EXISTS events_by_member_kind ON events (member_id, kind, at)",
  "CREATE INDEX IF NOT EXISTS events_joins ON events (at) WHERE kind IN ('join', 'leave')",
  "CREATE TABLE IF NOT EXISTS helps (helper_id TEXT PRIMARY KEY, target_id TEXT NOT NULL, return_colour TEXT NOT NULL, return_status TEXT, joined_at INTEGER NOT NULL)",
] as const;
