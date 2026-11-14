import type { AndonError } from "../../errors/andonError.js";
import { SCHEMA_STATEMENTS } from "./migrateSchema.constants.js";
import { runStatement, type SqlExecutor } from "./sqlExecutor.js";

/** Idempotent: runs on every Durable Object start. */
export const migrateSchema = (sql: SqlExecutor): undefined | AndonError => {
  for (const statement of SCHEMA_STATEMENTS) {
    const migrated = runStatement(sql, statement);
    if (migrated instanceof Error) return migrated;
  }
  return undefined;
};
