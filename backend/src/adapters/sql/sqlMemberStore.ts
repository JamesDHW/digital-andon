import { z } from "zod";

import type { MemberStore } from "../../application/ports/memberStore.js";
import type { AndonError } from "../../errors/andonError.js";
import type { Member } from "../../domain/member.js";
import type { MemberId } from "../../domain/memberId.js";
import { memberIdSchema } from "../../protocol/fieldSchemas.js";
import { runStatement, selectFirstRow, selectRows, type SqlExecutor } from "./sqlExecutor.js";
import { MEMBER_COLUMNS } from "./sql.constants.js";

const memberRowSchema = z
  .object({
    id: memberIdSchema,
    name: z.string(),
    email: z.string(),
    avatar_url: z.string().nullable(),
    role: z.enum(["member", "admin"]),
    joined_at: z.number(),
  })
  .transform((row): Member => ({ id: row.id, name: row.name, email: row.email, avatarUrl: row.avatar_url, role: row.role, joinedAt: row.joined_at }));

export const createSqlMemberStore = (sql: SqlExecutor): MemberStore => ({
  list: () => selectRows(sql, memberRowSchema, `SELECT ${MEMBER_COLUMNS} FROM members ORDER BY name COLLATE NOCASE`),
  find: (memberId) => selectFirstRow(sql, memberRowSchema, `SELECT ${MEMBER_COLUMNS} FROM members WHERE id = ?`, memberId),
  findByEmail: (email) => selectFirstRow(sql, memberRowSchema, `SELECT ${MEMBER_COLUMNS} FROM members WHERE email = ?`, email),
  save: (member) =>
    runStatement(
      sql,
      `INSERT INTO members (${MEMBER_COLUMNS}) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET name = excluded.name, email = excluded.email, avatar_url = excluded.avatar_url, role = excluded.role`,
      member.id,
      member.name,
      member.email,
      member.avatarUrl,
      member.role,
      member.joinedAt,
    ),
  remove: (memberId) => removeMemberRows(sql, memberId),
});

const removeMemberRows = (sql: SqlExecutor, memberId: MemberId): undefined | AndonError => {
  const followsRemoved = runStatement(sql, "DELETE FROM follows WHERE follower_id = ? OR followee_id = ?", memberId, memberId);
  if (followsRemoved instanceof Error) return followsRemoved;

  const lightRemoved = runStatement(sql, "DELETE FROM lights WHERE member_id = ?", memberId);
  if (lightRemoved instanceof Error) return lightRemoved;

  return runStatement(sql, "DELETE FROM members WHERE id = ?", memberId);
};
