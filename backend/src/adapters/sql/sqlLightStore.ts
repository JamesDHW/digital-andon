import { z } from "zod";

import type { LightStore } from "../../application/ports/lightStore.js";
import type { Light } from "../../domain/light.js";
import { colourSchema, memberIdSchema } from "../../protocol/fieldSchemas.js";
import { runStatement, selectFirstRow, selectRows, type SqlExecutor } from "./sqlExecutor.js";
import { LIGHT_COLUMNS } from "./sql.constants.js";

const lightRowSchema = z
  .object({ member_id: memberIdSchema, colour: colourSchema, topic: z.string().nullable(), since: z.number() })
  .transform((row): Light => ({
    memberId: row.member_id,
    colour: row.colour,
    status: row.topic,
    since: row.since,
  }));

export const createSqlLightStore = (sql: SqlExecutor): LightStore => ({
  list: () => selectRows(sql, lightRowSchema, `SELECT ${LIGHT_COLUMNS} FROM lights`),
  find: (memberId) => selectFirstRow(sql, lightRowSchema, `SELECT ${LIGHT_COLUMNS} FROM lights WHERE member_id = ?`, memberId),
  save: (light) =>
    runStatement(
      sql,
      `INSERT OR REPLACE INTO lights (${LIGHT_COLUMNS}) VALUES (?, ?, ?, ?)`,
      light.memberId,
      light.colour,
      light.status,
      light.since,
    ),
});
