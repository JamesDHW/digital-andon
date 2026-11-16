import { AndonError, InvalidRequestError } from "../../errors/andonError.js";
import { isLightEvent, type JoinEvent, type LightEvent } from "../../domain/andonEvent.js";
import { replayChanges, startingLight, type LightChange } from "../../domain/history.js";
import type { MemberId } from "../../domain/memberId.js";
import type { TeamDependencies } from "../teamDependencies.js";
import { HISTORY_EVENT_LIMIT, HISTORY_MAX_MEMBERS, HISTORY_MAX_SPAN_MS } from "./history.constants.js";

export type HistoryQuery = {
  readonly from: number;
  readonly to: number;
  readonly memberIds: readonly MemberId[];
};

/** Someone joining or leaving someone, from either side. */
export type JoinChange = {
  readonly at: number;
  readonly kind: "join" | "leave";
  readonly helperId: MemberId;
  readonly targetId: MemberId;
};

export type MemberHistory = {
  readonly memberId: MemberId;
  /** The light at `from`. */
  readonly start: LightChange;
  /** Every change after `from` and before `to`, oldest first. */
  readonly changes: readonly LightChange[];
  /** Every join and leave they were part of before `to`, oldest first, including those before `from`, so who was
   * with whom at the start of the window is known. */
  readonly joins: readonly JoinChange[];
};

export type History = {
  readonly from: number;
  readonly to: number;
  readonly members: readonly MemberHistory[];
  /** True if the window held more changes than are returned; narrow it to see them all. */
  readonly isTruncated: boolean;
};

/** Anyone on the team can see anyone's history: the board is shared, like the lights themselves. */
export const readHistory = (dependencies: TeamDependencies, query: HistoryQuery): History | AndonError => {
  const invalid = validate(query);
  if (invalid !== undefined) return invalid;

  const events = dependencies.events.list({ afterId: 0, limit: HISTORY_EVENT_LIMIT, from: query.from, to: query.to, memberIds: query.memberIds });
  if (events instanceof Error) return events;

  const joins = dependencies.events.listJoins(query.memberIds, query.to, HISTORY_EVENT_LIMIT);
  if (joins instanceof Error) return joins;

  const lightEvents = events.filter(isLightEvent);
  const histories = query.memberIds.map((memberId) => readMemberHistory(dependencies, query.from, memberId, lightEvents, joins));
  const failure = histories.find((history): history is AndonError => history instanceof AndonError);
  if (failure !== undefined) return failure;

  const members = histories.filter((history): history is MemberHistory => !(history instanceof AndonError));
  return { from: query.from, to: query.to, members, isTruncated: events.length >= HISTORY_EVENT_LIMIT };
};

const readMemberHistory = (
  dependencies: TeamDependencies,
  from: number,
  memberId: MemberId,
  events: readonly LightEvent[],
  joins: readonly JoinEvent[],
): MemberHistory | AndonError => {
  const lastPull = dependencies.events.findLatestBefore(memberId, from, "pull");
  if (lastPull instanceof Error) return lastPull;
  const lastStatus = dependencies.events.findLatestBefore(memberId, from, "status");
  if (lastStatus instanceof Error) return lastStatus;

  const start = startingLight(from, lastPull, lastStatus);
  return {
    memberId,
    start,
    changes: replayChanges(start, events.filter((event) => event.memberId === memberId)),
    joins: joins.filter((join) => join.memberId === memberId || join.targetId === memberId).map(toJoinChange),
  };
};

const toJoinChange = (join: JoinEvent): JoinChange => ({ at: join.at, kind: join.kind, helperId: join.memberId, targetId: join.targetId });

const validate = (query: HistoryQuery): InvalidRequestError | undefined => {
  if (query.to <= query.from) return new InvalidRequestError("The end of the window must be after its start.");
  if (query.to - query.from > HISTORY_MAX_SPAN_MS) return new InvalidRequestError("Choose a window of a year or less.");
  if (query.memberIds.length > HISTORY_MAX_MEMBERS) return new InvalidRequestError(`Choose at most ${HISTORY_MAX_MEMBERS} people.`);
  return undefined;
};
