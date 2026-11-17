import type { LightChange } from "@backend/domain/history.js";
import type { MemberId } from "@backend/domain/memberId.js";
import type { WireLight } from "@backend/protocol/wireLight.js";
import type { JoinChange } from "./joins.js";

/** One person's history, as the history endpoint returns it. */
export type LiveMemberHistory = {
  readonly memberId: MemberId;
  readonly start: LightChange;
  readonly changes: readonly LightChange[];
  readonly joins: readonly JoinChange[];
};

export type LiveHistory = {
  readonly members: readonly LiveMemberHistory[];
};

/** Folds the team's lights as they are now into a history loaded earlier, so a timeline follows live without asking
 * the server again. A new colour starts at the light's `since`. A new status or a new join keeps `since`, so it
 * starts when it was seen. Folding the same lights twice changes nothing. */
export const foldLiveLights = <History extends LiveHistory>(history: History, lights: readonly WireLight[], seenAt: number): History => ({
  ...history,
  members: history.members.map((member) => foldMember(member, lights, seenAt)),
});

const foldMember = <Member extends LiveMemberHistory>(member: Member, lights: readonly WireLight[], seenAt: number): Member => {
  const ownLight = lights.find((light) => light.memberId === member.memberId);
  const changes = ownLight === undefined ? member.changes : withLight(member, ownLight, seenAt);
  const at = Math.max(seenAt, member.joins.at(-1)?.at ?? seenAt);
  // One light per person, so each describes a different helper and can be compared with the history on its own.
  const added = lights.flatMap((light) => companyChanges(member.memberId, member.joins, light, at));
  const joins = added.length === 0 ? member.joins : [...member.joins, ...added];
  return { ...member, changes, joins };
};

const withLight = (member: LiveMemberHistory, light: WireLight, seenAt: number): readonly LightChange[] => {
  const last = member.changes.at(-1) ?? member.start;
  const isUnchanged = light.colour === last.colour && light.status === last.status;
  if (isUnchanged) return member.changes;

  const startedAt = light.colour === last.colour ? seenAt : light.since;
  return [...member.changes, { at: Math.max(startedAt, last.at), colour: light.colour, status: light.status }];
};

/** A light says who its owner is with; when that differs from the history, the leave and join between them, if they
 * involve this person. */
const companyChanges = (memberId: MemberId, joins: readonly JoinChange[], light: WireLight, at: number): readonly JoinChange[] => {
  const helperId = light.memberId;
  const lastOfHelper = joins.findLast((join) => join.helperId === helperId);
  const withWhom = lastOfHelper?.kind === "join" ? lastOfHelper.targetId : null;
  if (withWhom === light.helping) return [];
  return [...companyChange(memberId, { at, kind: "leave", helperId }, withWhom), ...companyChange(memberId, { at, kind: "join", helperId }, light.helping)];
};

const companyChange = (memberId: MemberId, change: Omit<JoinChange, "targetId">, targetId: MemberId | null): readonly JoinChange[] => {
  if (!involves(memberId, change.helperId, targetId)) return [];
  return [{ ...change, targetId }];
};

/** Whether there is someone on the other side, and this person is either side. */
const involves = (memberId: MemberId, helperId: MemberId, targetId: MemberId | null): targetId is MemberId =>
  targetId !== null && (helperId === memberId || targetId === memberId);
