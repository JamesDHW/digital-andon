import { DatabaseSync } from "node:sqlite";

import type { SqlExecutor } from "../../src/adapters/sql/sqlExecutor.js";

/** The same SQLite dialect Durable Objects use, in memory. */
export const createMemorySql = (): SqlExecutor => {
  const database = new DatabaseSync(":memory:");
  return {
    exec: (query, ...bindings) => {
      const rows = database.prepare(query).all(...bindings);
      return { toArray: () => rows };
    },
  };
};
