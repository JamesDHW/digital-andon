import { z } from "zod";

import type { HelpStore } from "../../application/ports/helpStore.js";
import type { Help } from "../../domain/help.js";
import { colourSchema, memberIdSchema } from "../../protocol/fieldSchemas.js";
import { HELP_COLUMNS } from "./sql.constants.js";
import { runStatement, selectFirstRow, selectRows, type SqlExecutor } from "./sqlExecutor.js";

const helpRowSchema = z
  .object({ helper_id: memberIdSchema, target_id: memberIdSchema, return_colour: colourSchema, return_status: z.string().nullable(), joined_at: z.number() })
  .transform((row): Help => ({
    helperId: row.helper_id,
    targetId: row.target_id,
    returnColour: row.return_colour,
    returnStatus: row.return_status,
    joinedAt: row.joined_at,
  }));

export const createSqlHelpStore = (sql: SqlExecutor): HelpStore => ({
  list: () => selectRows(sql, helpRowSchema, `SELECT ${HELP_COLUMNS} FROM helps ORDER BY joined_at`),
  findByHelper: (helperId) => selectFirstRow(sql, helpRowSchema, `SELECT ${HELP_COLUMNS} FROM helps WHERE helper_id = ?`, helperId),
  listByTarget: (targetId) => selectRows(sql, helpRowSchema, `SELECT ${HELP_COLUMNS} FROM helps WHERE target_id = ? ORDER BY joined_at`, targetId),
  save: (help) =>
    runStatement(
      sql,
      `INSERT OR REPLACE INTO helps (${HELP_COLUMNS}) VALUES (?, ?, ?, ?, ?)`,
      help.helperId,
      help.targetId,
      help.returnColour,
      help.returnStatus,
      help.joinedAt,
    ),
  remove: (helperId) => runStatement(sql, "DELETE FROM helps WHERE helper_id = ?", helperId),
});
