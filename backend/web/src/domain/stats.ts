import { BREATHING_AFTER_MS } from "./web.constants.js";
import type { PersonTimeline, TimelineSegment } from "./timeline.js";

export type BlockStats = {
  readonly blocks: number;
  readonly medianMs: number | null;
  readonly longestMs: number | null;
  /** Blocks that waited long enough to breathe: nobody came within ten minutes. */
  readonly waitedLong: number;
};

/** How long each block lasted. A status change mid-block splits a segment, so touching red segments are one block. */
export const blockDurations = (segments: readonly TimelineSegment[]): readonly number[] =>
  segments.flatMap((segment, index) => {
    const isBlockStart = segment.colour === "red" && segments[index - 1]?.colour !== "red";
    if (!isBlockStart) return [];
    const rest = segments.slice(index);
    const endOffset = rest.findIndex((next) => next.colour !== "red");
    const last = rest[endOffset === -1 ? rest.length - 1 : endOffset - 1] ?? segment;
    return [last.to - segment.from];
  });

export const blockStats = (timelines: readonly PersonTimeline[]): BlockStats => {
  const durations = timelines.flatMap((timeline) => blockDurations(timeline.segments)).toSorted((first, second) => first - second);
  return {
    blocks: durations.length,
    medianMs: median(durations),
    longestMs: durations.at(-1) ?? null,
    waitedLong: durations.filter((duration) => duration >= BREATHING_AFTER_MS).length,
  };
};

const median = (sorted: readonly number[]): number | null => {
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  const isEven = sorted.length % 2 === 0;
  if (isEven) return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
  return sorted[middle] ?? null;
};
