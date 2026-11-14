import type { AndonError } from "../../errors/andonError.js";
import type { MemberId } from "../../domain/memberId.js";

export type FollowStore = {
  readonly listFollowing: (followerId: MemberId) => readonly MemberId[] | AndonError;
  readonly isFollowing: (followerId: MemberId, followeeId: MemberId) => boolean | AndonError;
  readonly follow: (followerId: MemberId, followeeId: MemberId, at: number) => undefined | AndonError;
  readonly unfollow: (followerId: MemberId, followeeId: MemberId) => undefined | AndonError;
  readonly replaceFollowing: (followerId: MemberId, followeeIds: readonly MemberId[], at: number) => undefined | AndonError;
};
