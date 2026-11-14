export const SCHEMA_STATEMENTS = [
  "CREATE TABLE IF NOT EXISTS members (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, avatar_url TEXT, role TEXT NOT NULL, joined_at INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS lights (member_id TEXT PRIMARY KEY, colour TEXT NOT NULL, topic TEXT, since INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS follows (follower_id TEXT NOT NULL, followee_id TEXT NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY (follower_id, followee_id))",
  "CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, member_id TEXT NOT NULL, colour TEXT, topic TEXT, source TEXT, note TEXT, at INTEGER NOT NULL)",
  "CREATE INDEX IF NOT EXISTS events_by_member ON events (member_id, at)",
  "CREATE TABLE IF NOT EXISTS devices (token_hash TEXT PRIMARY KEY, member_id TEXT NOT NULL, name TEXT NOT NULL, created_at INTEGER NOT NULL, last_seen_at INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS invites (code_hash TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT NOT NULL, invited_by TEXT NOT NULL, expires_at INTEGER NOT NULL, used_at INTEGER)",
  "CREATE TABLE IF NOT EXISTS login_codes (email TEXT PRIMARY KEY, code_hash TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, attempts INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
] as const;
