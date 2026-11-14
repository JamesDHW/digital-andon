import type { MemberId } from "../domain/memberId.js";
import type { EventStore } from "./ports/eventStore.js";
import type { FollowStore } from "./ports/followStore.js";
import type { LightStore } from "./ports/lightStore.js";
import type { MemberStore } from "./ports/memberStore.js";

export type TeamDependencies = {
  readonly members: MemberStore;
  readonly lights: LightStore;
  readonly follows: FollowStore;
  readonly events: EventStore;
  readonly now: () => number;
  readonly onlineMembers: () => readonly MemberId[];
};
