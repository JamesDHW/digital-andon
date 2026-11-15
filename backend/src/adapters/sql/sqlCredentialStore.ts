import { z } from "zod";

import type { CredentialStore, Device, LoginCode, SignInAttempt } from "../../application/ports/credentialStore.js";
import { memberIdSchema } from "../../protocol/fieldSchemas.js";
import { runStatement, selectFirstRow, type SqlExecutor } from "./sqlExecutor.js";

const deviceRowSchema = z
  .object({ token_hash: z.string(), member_id: memberIdSchema, name: z.string(), created_at: z.number(), last_seen_at: z.number() })
  .transform((row): Device => ({ tokenHash: row.token_hash, memberId: row.member_id, name: row.name, createdAt: row.created_at, lastSeenAt: row.last_seen_at }));

const loginCodeRowSchema = z
  .object({ email: z.string(), code_hash: z.string(), created_at: z.number(), expires_at: z.number(), attempts: z.number() })
  .transform((row): LoginCode => ({ email: row.email, codeHash: row.code_hash, createdAt: row.created_at, expiresAt: row.expires_at, attempts: row.attempts }));

const signInAttemptRowSchema = z
  .object({ state_hash: z.string(), code_verifier: z.string(), client: z.enum(["app", "web"]), device_name: z.string(), expires_at: z.number() })
  .transform((row): SignInAttempt => ({ stateHash: row.state_hash, codeVerifier: row.code_verifier, client: row.client, deviceName: row.device_name, expiresAt: row.expires_at }));

export const createSqlCredentialStore = (sql: SqlExecutor): CredentialStore => ({
  saveDevice: (device) =>
    runStatement(
      sql,
      "INSERT OR REPLACE INTO devices (token_hash, member_id, name, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?)",
      device.tokenHash, device.memberId, device.name, device.createdAt, device.lastSeenAt,
    ),
  findDevice: (tokenHash) =>
    selectFirstRow(sql, deviceRowSchema, "SELECT token_hash, member_id, name, created_at, last_seen_at FROM devices WHERE token_hash = ?", tokenHash),
  removeDevicesOf: (memberId) => runStatement(sql, "DELETE FROM devices WHERE member_id = ?", memberId),
  saveLoginCode: (loginCode) =>
    runStatement(
      sql,
      "INSERT OR REPLACE INTO login_codes (email, code_hash, created_at, expires_at, attempts) VALUES (?, ?, ?, ?, ?)",
      loginCode.email, loginCode.codeHash, loginCode.createdAt, loginCode.expiresAt, loginCode.attempts,
    ),
  findLoginCode: (email) =>
    selectFirstRow(sql, loginCodeRowSchema, "SELECT email, code_hash, created_at, expires_at, attempts FROM login_codes WHERE email = ?", email),
  removeLoginCode: (email) => runStatement(sql, "DELETE FROM login_codes WHERE email = ?", email),
  saveSignInAttempt: (attempt) =>
    runStatement(
      sql,
      "INSERT OR REPLACE INTO sign_in_attempts (state_hash, code_verifier, client, device_name, expires_at) VALUES (?, ?, ?, ?, ?)",
      attempt.stateHash, attempt.codeVerifier, attempt.client, attempt.deviceName, attempt.expiresAt,
    ),
  takeSignInAttempt: (stateHash) => {
    const attempt = selectFirstRow(
      sql,
      signInAttemptRowSchema,
      "SELECT state_hash, code_verifier, client, device_name, expires_at FROM sign_in_attempts WHERE state_hash = ?",
      stateHash,
    );
    if (attempt instanceof Error) return attempt;
    if (attempt === null) return null;
    const removed = runStatement(sql, "DELETE FROM sign_in_attempts WHERE state_hash = ?", stateHash);
    if (removed instanceof Error) return removed;
    return attempt;
  },
  removeExpiredSignInAttempts: (now) => runStatement(sql, "DELETE FROM sign_in_attempts WHERE expires_at < ?", now),
});
