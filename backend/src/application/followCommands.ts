import { InvalidRequestError, NotFoundError, type AndonError } from "../errors/andonError.js";
import type { MemberId } from "../domain/memberId.js";
import { toMember, type Delivery } from "../protocol/serverMessage.js";
import type { TeamDependencies } from "./teamDependencies.js";

export const followMember = (dependencies: TeamDependencies, followerId: MemberId, followeeId: MemberId): readonly Delivery[] | AndonError => {
  const followee = findOtherMember(dependencies, followerId, followeeId);
  if (followee instanceof Error) return followee;

  const followed = dependencies.follows.follow(followerId, followeeId, dependencies.now());
  if (followed instanceof Error) return followed;

  return announceFollowing(dependencies, followerId);
};

export const unfollowMember = (dependencies: TeamDependencies, followerId: MemberId, followeeId: MemberId): readonly Delivery[] | AndonError => {
  const unfollowed = dependencies.follows.unfollow(followerId, followeeId);
  if (unfollowed instanceof Error) return unfollowed;

  return announceFollowing(dependencies, followerId);
};

/** Replaces the whole list, ignoring ids that are not other members of the team. */
export const replaceFollowing = (
  dependencies: TeamDependencies,
  followerId: MemberId,
  followeeIds: readonly MemberId[],
): readonly Delivery[] | AndonError => {
  const members = dependencies.members.list();
  if (members instanceof Error) return members;

  const knownFolloweeIds = followeeIds.filter(
    (followeeId) => followeeId !== followerId && members.some((member) => member.id === followeeId),
  );
  const replaced = dependencies.follows.replaceFollowing(followerId, [...new Set(knownFolloweeIds)], dependencies.now());
  if (replaced instanceof Error) return replaced;

  return announceFollowing(dependencies, followerId);
};

/** Every open socket of the follower learns the new list, so their other Macs stay in sync. */
export const announceFollowing = (dependencies: TeamDependencies, followerId: MemberId): readonly Delivery[] | AndonError => {
  const memberIds = dependencies.follows.listFollowing(followerId);
  if (memberIds instanceof Error) return memberIds;

  return [toMember(followerId, { type: "follows", memberIds })];
};

const findOtherMember = (dependencies: TeamDependencies, followerId: MemberId, followeeId: MemberId): MemberId | AndonError => {
  if (followerId === followeeId) return new InvalidRequestError("You can't follow yourself.");

  const followee = dependencies.members.find(followeeId);
  if (followee instanceof Error) return followee;
  if (followee === null) return new NotFoundError("That person isn't on this team.");

  return followee.id;
};
