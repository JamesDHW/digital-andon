import { z } from "zod";

import type { AndonError } from "../../errors/andonError.js";
import type { FollowStore } from "../../application/ports/followStore.js";
import type { MemberId } from "../../domain/memberId.js";
import { memberIdSchema } from "../../protocol/fieldSchemas.js";
import { runStatement, selectRows, type SqlExecutor } from "./sqlExecutor.js";

const followeeRowSchema = z.object({ followee_id: memberIdSchema }).transform((row) => row.followee_id);

export const createSqlFollowStore = (sql: SqlExecutor): FollowStore => ({
  listFollowing: (followerId) =>
    selectRows(sql, followeeRowSchema, "SELECT followee_id FROM follows WHERE follower_id = ? ORDER BY created_at", followerId),
  isFollowing: (followerId, followeeId) => {
    const rows = selectRows(sql, followeeRowSchema, "SELECT followee_id FROM follows WHERE follower_id = ? AND followee_id = ?", followerId, followeeId);
    if (rows instanceof Error) return rows;
    return rows.length > 0;
  },
  follow: (followerId, followeeId, at) =>
    runStatement(sql, "INSERT OR IGNORE INTO follows (follower_id, followee_id, created_at) VALUES (?, ?, ?)", followerId, followeeId, at),
  unfollow: (followerId, followeeId) =>
    runStatement(sql, "DELETE FROM follows WHERE follower_id = ? AND followee_id = ?", followerId, followeeId),
  replaceFollowing: (followerId, followeeIds, at) => replaceFollowRows(sql, followerId, followeeIds, at),
});

const replaceFollowRows = (sql: SqlExecutor, followerId: MemberId, followeeIds: readonly MemberId[], at: number): undefined | AndonError => {
  const cleared = runStatement(sql, "DELETE FROM follows WHERE follower_id = ?", followerId);
  if (cleared instanceof Error) return cleared;

  for (const [position, followeeId] of followeeIds.entries()) {
    const inserted = runStatement(sql, "INSERT INTO follows (follower_id, followee_id, created_at) VALUES (?, ?, ?)", followerId, followeeId, at + position);
    if (inserted instanceof Error) return inserted;
  }
  return undefined;
};
