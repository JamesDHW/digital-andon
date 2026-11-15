import type { ReactElement } from "react";

import { formatMoment } from "../domain/format.js";
import { lightName } from "../domain/lightNames.js";
import { segmentAt, type PersonTimeline } from "../domain/timeline.js";
import { SIGNAL_COLOUR } from "./ui.constants.js";

type ReadoutProps = {
  readonly timelines: readonly PersonTimeline[];
  readonly at: number;
  readonly left: number;
  readonly width: number;
};

/** Where everyone was at the moment under the pointer. */
export const Readout = ({ timelines, at, left, width }: ReadoutProps): ReactElement => {
  const isRightHalf = left > width / 2;
  return (
    <div
      className="pointer-events-none absolute top-2 z-10 w-64 rounded-lg border border-border bg-surface-raised p-3 text-sm shadow-lg"
      style={isRightHalf ? { right: width - left + 12 } : { left: left + 12 }}
    >
      <p className="mb-2 text-xs font-medium text-ink-muted">{formatMoment(at)}</p>
      <ul className="space-y-1.5">
        {timelines.map((timeline) => {
          const segment = segmentAt(timeline, at);
          return (
            <li key={timeline.member.id} className="flex items-start gap-2">
              <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: segment === null ? "transparent" : SIGNAL_COLOUR[segment.colour] }} />
              <span className="min-w-0">
                <span className="font-medium">{timeline.member.name}</span>
                <span className="text-ink-secondary"> · {segment === null ? "not here yet" : lightName(segment.colour)}</span>
                <Status text={segment?.status ?? null} />
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

type StatusProps = {
  readonly text: string | null;
};

const Status = ({ text }: StatusProps): ReactElement | null => {
  if (text === null) return null;
  return <span className="block truncate text-xs text-ink-muted">{text}</span>;
};
