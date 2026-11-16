import type { Colour } from "@backend/domain/colour.js";
import type { LightChange } from "@backend/domain/history.js";
import type { Member } from "@backend/domain/member.js";
import type { MemberId } from "@backend/domain/memberId.js";
import { clipSpans, helpSpans, uncovered, type HelpSpan, type JoinChange } from "./joins.js";
import type { TimeRange } from "./timeRange.js";

export type TimelineSegment = {
  readonly from: number;
  readonly to: number;
  readonly colour: Colour;
  readonly status: string | null;
};

/** Someone joining or leaving this person, drawn as the helper's face on their line. */
export type JoinMark = {
  readonly at: number;
  readonly kind: "join" | "leave";
  readonly helperId: MemberId;
};

export type PersonTimeline = {
  readonly member: Member;
  /** Oldest first, clipped to the window, to when they joined, and to now. */
  readonly segments: readonly TimelineSegment[];
  /** When others were with them, clipped the same way. */
  readonly helpedBy: readonly HelpSpan[];
  /** Their time Blocked with nobody with them: the wait for help. */
  readonly blockedAlone: readonly TimeRange[];
  readonly marks: readonly JoinMark[];
};

export type MemberHistoryData = {
  readonly start: LightChange;
  readonly changes: readonly LightChange[];
  readonly joins: readonly JoinChange[];
};

export const buildTimeline = (member: Member, history: MemberHistoryData, range: TimeRange, now: number): PersonTimeline => {
  const visibleFrom = Math.max(range.from, member.joinedAt);
  const visibleTo = Math.min(range.to, now);
  const points = [history.start, ...history.changes];
  const segments = points
    .map((point, index) => ({ from: point.at, to: points[index + 1]?.at ?? visibleTo, colour: point.colour, status: point.status }))
    .filter((segment) => segment.to > visibleFrom && segment.from < visibleTo)
    .map((segment) => ({ ...segment, from: Math.max(segment.from, visibleFrom), to: Math.min(segment.to, visibleTo) }));
  const visible = { from: visibleFrom, to: visibleTo };
  const joinsWithThem = history.joins.filter((join) => join.targetId === member.id);
  const helpedBy = clipSpans(helpSpans(joinsWithThem, visibleTo), visible);
  const blockedAlone = segments.filter((segment) => segment.colour === "red").flatMap((segment) => uncovered(segment, helpedBy));
  const marks = joinsWithThem
    .filter((join) => join.at >= visibleFrom && join.at <= visibleTo)
    .map((join): JoinMark => ({ at: join.at, kind: join.kind, helperId: join.helperId }));
  return { member, segments, helpedBy, blockedAlone, marks };
};

/** What someone's light was at a moment, or null before they joined or after the window. */
export const segmentAt = (timeline: PersonTimeline, at: number): TimelineSegment | null =>
  timeline.segments.find((segment) => segment.from <= at && at < segment.to) ?? null;

/** Where the line ends: the last moment they were working (not off), which is where their face is drawn. */
export const lastWorkingSegment = (timeline: PersonTimeline): TimelineSegment | null =>
  timeline.segments.findLast((segment) => segment.colour !== "off") ?? null;
