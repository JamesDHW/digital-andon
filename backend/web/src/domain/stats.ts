import { totalDuration, uncovered } from "./joins.js";
import type { PersonTimeline, TimelineSegment } from "./timeline.js";
import type { TimeRange } from "./timeRange.js";
import { BREATHING_AFTER_MS } from "./web.constants.js";

export type BlockStats = {
  readonly blocks: number;
  /** Time spent Blocked, helped or not. */
  readonly blockedMs: number;
  /** Time spent Blocked with nobody with them. */
  readonly aloneMs: number;
  /** From going Blocked to the first person joining (or to the end, if nobody did). */
  readonly medianWaitMs: number | null;
  /** Blocks that waited alone long enough to breathe. */
  readonly waitedLong: number;
};

/** Each block, start to end. A context change mid-block splits a segment, so touching red segments are one block. */
export const blockSpans = (segments: readonly TimelineSegment[]): readonly TimeRange[] =>
  segments.flatMap((segment, index) => {
    const isBlockStart = segment.colour === "red" && segments[index - 1]?.colour !== "red";
    if (!isBlockStart) return [];
    const rest = segments.slice(index);
    const endOffset = rest.findIndex((next) => next.colour !== "red");
    const last = rest[endOffset === -1 ? rest.length - 1 : endOffset - 1] ?? segment;
    return [{ from: segment.from, to: last.to }];
  });

export const blockStats = (timelines: readonly PersonTimeline[]): BlockStats => {
  const waits = timelines.flatMap((timeline) => blockSpans(timeline.segments).map((block) => waitForHelp(block, timeline))).toSorted((first, second) => first - second);
  return {
    blocks: waits.length,
    blockedMs: totalDuration(timelines.flatMap((timeline) => blockSpans(timeline.segments))),
    aloneMs: totalDuration(timelines.flatMap((timeline) => timeline.blockedAlone)),
    medianWaitMs: median(waits),
    waitedLong: waits.filter((wait) => wait >= BREATHING_AFTER_MS).length,
  };
};

/** How long the block went before anyone was with them: up to the end of the first stretch nobody covered. */
const waitForHelp = (block: TimeRange, timeline: PersonTimeline): number => {
  const firstAlone = uncovered(block, timeline.helpedBy).at(0);
  if (!isAloneFromTheStart(firstAlone, block)) return 0;
  return firstAlone.to - firstAlone.from;
};

/** Nobody was with them when the block began; otherwise help was already there and the wait is nil. */
const isAloneFromTheStart = (firstAlone: TimeRange | undefined, block: TimeRange): firstAlone is TimeRange =>
  firstAlone !== undefined && firstAlone.from <= block.from;

const median = (sorted: readonly number[]): number | null => {
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  const isEven = sorted.length % 2 === 0;
  if (isEven) return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
  return sorted[middle] ?? null;
};
