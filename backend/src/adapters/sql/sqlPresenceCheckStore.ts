import { z } from "zod";

import type { PresenceCheckStore } from "../../application/ports/presenceCheckStore.js";
import { memberIdSchema } from "../../protocol/fieldSchemas.js";
import { runStatement, selectFirstRow, selectRows, type SqlExecutor } from "./sqlExecutor.js";

const dueRowSchema = z.object({ member_id: memberIdSchema });
const nextRowSchema = z.object({ due_at: z.number().nullable() });

export const createSqlPresenceCheckStore = (sql: SqlExecutor): PresenceCheckStore => ({
  schedule: (memberId, dueAt) => runStatement(sql, "INSERT OR REPLACE INTO presence_checks (member_id, due_at) VALUES (?, ?)", memberId, dueAt),
  cancel: (memberId) => runStatement(sql, "DELETE FROM presence_checks WHERE member_id = ?", memberId),
  takeDue: (now) => {
    const rows = selectRows(sql, dueRowSchema, "SELECT member_id FROM presence_checks WHERE due_at <= ?", now);
    if (rows instanceof Error) return rows;
    const removed = runStatement(sql, "DELETE FROM presence_checks WHERE due_at <= ?", now);
    if (removed instanceof Error) return removed;
    return rows.map((row) => row.member_id);
  },
  nextDueAt: () => {
    const row = selectFirstRow(sql, nextRowSchema, "SELECT MIN(due_at) AS due_at FROM presence_checks");
    if (row instanceof Error) return row;
    return row?.due_at ?? null;
  },
});
