import type { MemberId } from "@backend/domain/memberId.js";
import type { TimeRange } from "./timeRange.js";

/** Someone joining or leaving someone, as the history endpoint sends it. */
export type JoinChange = {
  readonly at: number;
  readonly kind: "join" | "leave";
  readonly helperId: MemberId;
  readonly targetId: MemberId;
};

/** A stretch of time one person spent with another. */
export type HelpSpan = TimeRange & {
  readonly helperId: MemberId;
  readonly targetId: MemberId;
};

/** Each join lasts until that helper's next join or leave; one still open runs to `end`. */
export const helpSpans = (joins: readonly JoinChange[], end: number): readonly HelpSpan[] =>
  joins
    .flatMap((join, index): HelpSpan[] => {
      if (join.kind !== "join") return [];
      const next = joins.slice(index + 1).find((later) => later.helperId === join.helperId);
      return [{ helperId: join.helperId, targetId: join.targetId, from: join.at, to: Math.min(next?.at ?? end, end) }];
    })
    .filter((span) => span.to > span.from);

/** The spans, cut to a window; those wholly outside it are dropped. */
export const clipSpans = <Span extends TimeRange>(spans: readonly Span[], window: TimeRange): readonly Span[] =>
  spans
    .filter((span) => span.to > window.from && span.from < window.to)
    .map((span) => ({ ...span, from: Math.max(span.from, window.from), to: Math.min(span.to, window.to) }));

/** The parts of a window that none of the spans cover. */
export const uncovered = (window: TimeRange, covers: readonly TimeRange[]): readonly TimeRange[] =>
  gaps(window.from, window.to, clipSpans(covers, window).toSorted((first, second) => first.from - second.from));

const gaps = (from: number, to: number, covers: readonly TimeRange[]): readonly TimeRange[] => {
  const [first, ...rest] = covers;
  if (first === undefined) return from < to ? [{ from, to }] : [];
  const gap = first.from > from ? [{ from, to: first.from }] : [];
  return [...gap, ...gaps(Math.max(from, first.to), to, rest)];
};

export const totalDuration = (spans: readonly TimeRange[]): number => {
  const [first, ...rest] = spans;
  if (first === undefined) return 0;
  return first.to - first.from + totalDuration(rest);
};
