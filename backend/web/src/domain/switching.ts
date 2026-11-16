import type { Member } from "@backend/domain/member.js";
import type { MemberId } from "@backend/domain/memberId.js";
import { clipSpans, helpSpans, totalDuration, uncovered, type HelpSpan, type JoinChange } from "./joins.js";
import { buildTimeline, type MemberHistoryData, type PersonTimeline } from "./timeline.js";
import type { TimeRange } from "./timeRange.js";

/** Who one person was with over a stretch of time: null is their own work. */
export type WithSpan = TimeRange & {
  readonly with: MemberId | null;
};

export type SwitchingSummary = {
  readonly people: number;
  readonly switches: number;
  readonly withOthersMs: number;
  readonly ownWorkMs: number;
};

/** Everyone the person joined in the window, in the order they first joined them. */
export const peopleJoined = (person: Member, joins: readonly JoinChange[], range: TimeRange, now: number): readonly MemberId[] => {
  const spans = ownSpans(person, joins, range, now);
  return [...new Set(spans.toSorted((first, second) => first.from - second.from).map((span) => span.targetId))];
};

/** While working, they're either on their own work or with whoever they joined; Off breaks the line. */
export const withSpans = (person: Member, timeline: PersonTimeline, joins: readonly JoinChange[], range: TimeRange, now: number): readonly WithSpan[] => {
  const spans = ownSpans(person, joins, range, now);
  return timeline.segments
    .filter((segment) => segment.colour !== "off")
    .flatMap((segment): WithSpan[] => [
      ...clipSpans(spans, segment).map((span): WithSpan => ({ from: span.from, to: span.to, with: span.targetId })),
      ...uncovered(segment, spans).map((span): WithSpan => ({ ...span, with: null })),
    ])
    .toSorted((first, second) => first.from - second.from);
};

export const summarise = (spans: readonly WithSpan[], joins: readonly JoinChange[], person: Member, range: TimeRange): SwitchingSummary => ({
  people: new Set(spans.flatMap((span) => (span.with === null ? [] : [span.with]))).size,
  switches: joins.filter((join) => join.kind === "join" && join.helperId === person.id && join.at >= range.from && join.at < range.to).length,
  withOthersMs: totalDuration(spans.filter((span) => span.with !== null)),
  ownWorkMs: totalDuration(spans.filter((span) => span.with === null)),
});

const ownSpans = (person: Member, joins: readonly JoinChange[], range: TimeRange, now: number): readonly HelpSpan[] =>
  clipSpans(helpSpans(joins.filter((join) => join.helperId === person.id), Math.min(range.to, now)), range);

/** A person's history, as the history endpoint returns it. */
export type SwitchingHistory = MemberHistoryData & {
  readonly memberId: MemberId;
};

export type SwitchingView = {
  readonly person: PersonTimeline;
  readonly joined: readonly PersonTimeline[];
  readonly spans: readonly WithSpan[];
  readonly summary: SwitchingSummary;
};

/** Who to load the lanes for, once the person's own history has arrived. */
export const joinedInWindow = (person: Member | null, history: SwitchingHistory | null, range: TimeRange, now: number): readonly MemberId[] => {
  if (person === null) return [];
  return peopleJoined(person, history?.joins ?? [], range, now);
};

/** Everything the chart and tiles show. */
export const switchingView = (
  person: Member | null,
  history: SwitchingHistory,
  joinedHistories: readonly SwitchingHistory[],
  members: readonly Member[],
  range: TimeRange,
  now: number,
): SwitchingView | null => {
  if (person === null) return null;
  const timeline = buildTimeline(person, history, range, now);
  const joined = joinedInWindow(person, history, range, now).flatMap((memberId): PersonTimeline[] => {
    const member = members.find((candidate) => candidate.id === memberId);
    if (member === undefined) return [];
    const memberHistory = joinedHistories.find((candidate) => candidate.memberId === memberId);
    if (memberHistory === undefined) return [];
    return [buildTimeline(member, memberHistory, range, now)];
  });
  const spans = withSpans(person, timeline, history.joins, range, now);
  return { person: timeline, joined, spans, summary: summarise(spans, history.joins, person, range) };
};
