import type { ReactElement } from "react";

import type { MemberId } from "@backend/domain/memberId.js";
import { SWITCHING_AXIS_HEIGHT, SWITCHING_FACE_SIZE, SWITCHING_LANE_HEIGHT } from "../domain/chart.constants.js";
import { layoutChart, type ChartLayout } from "../domain/chartLayout.js";
import { formatMoment } from "../domain/format.js";
import { lightName } from "../domain/lightNames.js";
import type { WithSpan } from "../domain/switching.js";
import type { PersonTimeline, TimelineSegment } from "../domain/timeline.js";
import type { TimeRange } from "../domain/timeRange.js";
import { Avatar } from "./Avatar.js";
import { Hint } from "./Hint.js";
import { LinkedText } from "./LinkedText.js";
import { BAND_FILL, SIGNAL_COLOUR } from "./ui.constants.js";

type SwitchingChartProps = {
  readonly person: PersonTimeline;
  /** Everyone they joined, in the order they first joined them: the first sits just above them. */
  readonly joined: readonly PersonTimeline[];
  readonly spans: readonly WithSpan[];
  readonly range: TimeRange;
  readonly width: number;
};

/** One swim lane per person, showing the context they had over time; the person is at the bottom. The line runs
 * through whoever they were with at each moment, so every switch is a jump between lanes. */
export const SwitchingChart = ({ person, joined, spans, range, width }: SwitchingChartProps): ReactElement => {
  const layout = layoutChart(range, width);
  const lanes = [...joined.toReversed(), person];
  const height = lanes.length * SWITCHING_LANE_HEIGHT + SWITCHING_AXIS_HEIGHT;
  const laneCentre = (memberId: MemberId | null): number => {
    const index = lanes.findIndex((lane) => lane.member.id === (memberId ?? person.member.id));
    return index * SWITCHING_LANE_HEIGHT + SWITCHING_LANE_HEIGHT / 2;
  };
  const path = spans
    .map((span, index) => {
      const previous = spans[index - 1];
      const isContinuous = previous !== undefined && previous.to === span.from;
      return `${isContinuous ? "L" : "M"}${String(layout.x(span.from))},${String(laneCentre(span.with))}H${String(layout.x(span.to))}`;
    })
    .join("");
  return (
    <div className="relative" style={{ width: layout.width, height }}>
      {lanes.map((lane, index) => (
        <Lane key={lane.member.id} lane={lane} index={index} layout={layout} />
      ))}
      <svg className="pointer-events-none absolute inset-0" width={layout.width} height={height} role="img" aria-label="Who they were with over time">
        <path d={path} fill="none" stroke="var(--ink)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        <Axis layout={layout} top={lanes.length * SWITCHING_LANE_HEIGHT} />
      </svg>
    </div>
  );
};

type LaneProps = {
  readonly lane: PersonTimeline;
  readonly index: number;
  readonly layout: ChartLayout;
};

/** Their face on the left, then a bar per stretch of context, tinted by their light. */
const Lane = ({ lane, index, layout }: LaneProps): ReactElement => {
  const top = index * SWITCHING_LANE_HEIGHT;
  return (
    <div className="absolute left-0 border-b border-border" style={{ top, height: SWITCHING_LANE_HEIGHT, width: layout.width }}>
      <Hint content={lane.member.name}>
        <span className="absolute rounded-full" style={{ left: (layout.plotLeft - SWITCHING_FACE_SIZE) / 2, top: (SWITCHING_LANE_HEIGHT - SWITCHING_FACE_SIZE) / 2 }}>
          <Avatar member={lane.member} colour={null} size={SWITCHING_FACE_SIZE} isBreathing={false} isFaded={false} />
        </span>
      </Hint>
      {lane.segments
        .filter((segment) => segment.colour !== "off")
        .map((segment) => (
          <ContextBar key={segment.from} segment={segment} layout={layout} />
        ))}
    </div>
  );
};

type ContextBarProps = {
  readonly segment: TimelineSegment;
  readonly layout: ChartLayout;
};

const ContextBar = ({ segment, layout }: ContextBarProps): ReactElement => {
  const left = layout.x(segment.from);
  const width = Math.max(1, layout.x(segment.to) - left);
  return (
    <Hint content={<ContextDetails segment={segment} />}>
      <span
        className="absolute truncate rounded-sm px-1.5 text-xs leading-6 text-ink-secondary"
        style={{ left, width, top: 14, height: SWITCHING_LANE_HEIGHT - 28, background: BAND_FILL[segment.colour], borderLeft: `3px solid ${SIGNAL_COLOUR[segment.colour]}` }}
      >
        {segment.status ?? ""}
      </span>
    </Hint>
  );
};

type ContextDetailsProps = {
  readonly segment: TimelineSegment;
};

const ContextDetails = ({ segment }: ContextDetailsProps): ReactElement => (
  <span className="block">
    <span className="block font-medium break-words">{segment.status === null ? "No context" : <LinkedText text={segment.status} />}</span>
    <span className="block text-ink-secondary">
      {lightName(segment.colour)} · {formatMoment(segment.from)} – {formatMoment(segment.to)}
    </span>
  </span>
);

type AxisProps = {
  readonly layout: ChartLayout;
  readonly top: number;
};

const Axis = ({ layout, top }: AxisProps): ReactElement => (
  <g>
    {layout.ticks.map((tick) => (
      <text key={tick.x} x={tick.x} y={top + 18} textAnchor="middle" fontSize={11} fill="var(--ink-muted)">
        {tick.label}
      </text>
    ))}
  </g>
);
