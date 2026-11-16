import type { LightEvent, RecordedEvent } from "./andonEvent.js";
import type { Colour } from "./colour.js";

/** What a light was from a moment on. */
export type LightChange = {
  readonly at: number;
  readonly colour: Colour;
  readonly status: string | null;
};

/** The light where a history starts: the last colour pulled, with the last status set since. */
export const startingLight = (at: number, lastPull: RecordedEvent | null, lastStatus: RecordedEvent | null): LightChange => {
  const colour = lastPull?.kind === "pull" ? lastPull.colour : "green";
  const pullStatus = lastPull?.kind === "pull" ? lastPull.status : null;
  const isStatusNewer = lastStatus?.kind === "status" && lastStatus.at >= (lastPull?.at ?? 0);
  const status = isStatusNewer ? lastStatus.status : pullStatus;
  return { at, colour, status };
};

/** Replays one member's events in order: each pull changes the colour and status; a status change keeps
 * the colour of the latest pull before it (found by binary search, so long histories stay fast). */
export const replayChanges = (start: LightChange, events: readonly LightEvent[]): readonly LightChange[] => {
  const pullPositions = events.flatMap((event, position) => (event.kind === "pull" ? [position] : []));
  return events.map((event, position) => {
    const pull = events[lastPositionAtOrBefore(pullPositions, position, 0, pullPositions.length) ?? -1];
    const colour = pull?.kind === "pull" ? pull.colour : start.colour;
    return { at: event.at, colour, status: event.status };
  });
};

const lastPositionAtOrBefore = (positions: readonly number[], position: number, low: number, high: number): number | null => {
  if (low >= high) return positions[low - 1] ?? null;
  const middle = Math.floor((low + high) / 2);
  const candidate = positions[middle] ?? Number.POSITIVE_INFINITY;
  if (candidate <= position) return lastPositionAtOrBefore(positions, position, middle + 1, high);
  return lastPositionAtOrBefore(positions, position, low, middle);
};
