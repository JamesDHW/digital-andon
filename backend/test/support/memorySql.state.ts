import { DatabaseSync } from "node:sqlite";

import type { SqlExecutor } from "../../src/adapters/sql/sqlExecutor.js";

export type MemorySql = SqlExecutor & {
  /** The most parameters any one query has bound: Durable Objects refuse more than 100, and node:sqlite doesn't. */
  readonly mostBoundParameters: () => number;
};

/** The same SQLite dialect Durable Objects use, in memory. */
export const createMemorySql = (): MemorySql => {
  const database = new DatabaseSync(":memory:");
  const bound = { most: 0 };
  return {
    exec: (query, ...bindings) => {
      bound.most = Math.max(bound.most, bindings.length);
      const rows = database.prepare(query).all(...bindings);
      return { toArray: () => rows };
    },
    mostBoundParameters: () => bound.most,
  };
};
