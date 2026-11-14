import { z } from "zod";

import { AndonError } from "../../errors/andonError.js";
import { tryCatch } from "../../errors/tryCatch.js";

export type SqlValue = string | number | null;

/** The slice of Durable Object SqlStorage these adapters use; tests back it with node:sqlite. */
export type SqlExecutor = {
  readonly exec: (query: string, ...bindings: SqlValue[]) => { readonly toArray: () => unknown[] };
};

export const selectRows = <Row>(sql: SqlExecutor, rowSchema: z.ZodType<Row>, query: string, ...bindings: SqlValue[]): readonly Row[] | AndonError => {
  const rows = tryCatch(() => sql.exec(query, ...bindings).toArray());
  if (rows instanceof Error) return toStorageError(rows);

  const parsedRows = z.array(rowSchema).safeParse(rows);
  if (!parsedRows.success) return new AndonError("storage-failed", z.prettifyError(parsedRows.error));
  return parsedRows.data;
};

export const selectFirstRow = <Row>(sql: SqlExecutor, rowSchema: z.ZodType<Row>, query: string, ...bindings: SqlValue[]): Row | null | AndonError => {
  const rows = selectRows(sql, rowSchema, query, ...bindings);
  if (rows instanceof Error) return rows;
  return rows.at(0) ?? null;
};

export const runStatement = (sql: SqlExecutor, query: string, ...bindings: SqlValue[]): undefined | AndonError => {
  const result = tryCatch(() => sql.exec(query, ...bindings).toArray());
  if (result instanceof Error) return toStorageError(result);
  return undefined;
};

const toStorageError = (failure: AndonError): AndonError => new AndonError("storage-failed", failure.message, { cause: failure });
