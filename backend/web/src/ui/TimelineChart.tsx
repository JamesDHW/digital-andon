import { useState, type MouseEvent, type ReactElement } from "react";

import type { MemberId } from "@backend/domain/memberId.js";
import { CHART_FACE_SIZE } from "../domain/chart.constants.js";
import { laneY, layoutChart, linePath, type ChartLayout } from "../domain/chartLayout.js";
import { lightName } from "../domain/lightNames.js";
import { lastWorkingSegment, type PersonTimeline } from "../domain/timeline.js";
import type { TimeRange } from "../domain/timeRange.js";
import { Avatar } from "./Avatar.js";
import { Hint } from "./Hint.js";
import { Readout } from "./TimelineReadout.js";
import { BAND_FILL, SIGNAL_COLOUR } from "./ui.constants.js";

type TimelineChartProps = {
  readonly timelines: readonly PersonTimeline[];
  readonly range: TimeRange;
  readonly width: number;
};

/** Blocked on top, Assist in the middle, Clear at the bottom. Each line runs back in time from the person's face. */
export const TimelineChart = ({ timelines, range, width }: TimelineChartProps): ReactElement => {
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [focusedId, setFocusedId] = useState<MemberId | null>(null);
  const layout = layoutChart(range, width);
  const laneCount = timelines.length;
  const track = (event: MouseEvent<SVGRectElement>): void => {
    const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    setHoverTime(layout.timeAt(event.clientX - (bounds?.left ?? 0)));
  };
  const stopTracking = (): void => setHoverTime(null);
  return (
    <div className="relative" style={{ width: layout.width, height: layout.height }}>
      <svg width={layout.width} height={layout.height} role="img" aria-label="Lights over time">
        <Backdrop layout={layout} />
        {timelines.map((timeline, lane) => (
          <path
            key={timeline.member.id}
            d={linePath(layout, timeline, lane, laneCount)}
            fill="none"
            stroke="var(--line)"
            strokeWidth={focusedId === timeline.member.id ? 3 : 2}
            strokeLinejoin="round"
            opacity={isDimmed(focusedId, timeline.member.id) ? 0.2 : 1}
          />
        ))}
        {hoverTime !== null && (
          <line x1={layout.x(hoverTime)} x2={layout.x(hoverTime)} y1={layout.plotTop} y2={layout.plotBottom} stroke="var(--ink-muted)" strokeDasharray="3 3" />
        )}
        <rect
          x={layout.plotLeft}
          y={layout.plotTop}
          width={layout.plotRight - layout.plotLeft}
          height={layout.plotBottom - layout.plotTop}
          fill="transparent"
          onMouseMove={track}
          onMouseLeave={stopTracking}
        />
      </svg>
      {timelines.map((timeline, lane) => (
        <Face key={timeline.member.id} timeline={timeline} layout={layout} lane={lane} laneCount={laneCount} isFocused={focusedId === timeline.member.id} onFocus={setFocusedId} />
      ))}
      {hoverTime !== null && <Readout timelines={timelines} at={hoverTime} left={layout.x(hoverTime)} width={layout.width} />}
    </div>
  );
};

type BackdropProps = {
  readonly layout: ChartLayout;
};

/** Coloured bands, greyed weekends, and the time axis. */
const Backdrop = ({ layout }: BackdropProps): ReactElement => (
  <g>
    {layout.bands.map((band) => (
      <g key={band.colour}>
        <rect x={layout.plotLeft} y={band.top} width={layout.plotRight - layout.plotLeft} height={band.height} fill={BAND_FILL[band.colour]} />
        <text x={layout.plotLeft - 12} y={band.top + band.height / 2} textAnchor="end" dominantBaseline="middle" fontSize={12} fill="var(--ink-secondary)">
          {lightName(band.colour)}
        </text>
        <rect x={layout.plotLeft - 6} y={band.top + 6} width={3} height={band.height - 12} rx={1.5} style={{ fill: SIGNAL_COLOUR[band.colour] }} />
      </g>
    ))}
    {layout.weekends.map((weekend) => (
      <rect key={weekend.left} x={weekend.left} y={layout.plotTop} width={weekend.width} height={layout.plotBottom - layout.plotTop} fill="var(--weekend)" />
    ))}
    <line x1={layout.plotLeft} x2={layout.plotRight} y1={layout.plotBottom} y2={layout.plotBottom} stroke="var(--border)" />
    {layout.ticks.map((tick) => (
      <g key={tick.x}>
        <line x1={tick.x} x2={tick.x} y1={layout.plotBottom} y2={layout.plotBottom + 4} stroke="var(--border)" />
        <text x={tick.x} y={layout.plotBottom + 18} textAnchor="middle" fontSize={11} fill="var(--ink-muted)">
          {tick.label}
        </text>
      </g>
    ))}
  </g>
);

type FaceProps = {
  readonly timeline: PersonTimeline;
  readonly layout: ChartLayout;
  readonly lane: number;
  readonly laneCount: number;
  readonly isFocused: boolean;
  readonly onFocus: (memberId: MemberId | null) => void;
};

/** Their face at the end of their line, ringed in the colour they ended on. Hover to pick out their line. */
const Face = ({ timeline, layout, lane, laneCount, isFocused, onFocus }: FaceProps): ReactElement | null => {
  const last = lastWorkingSegment(timeline);
  if (last === null) return null;
  const handleEnter = (): void => onFocus(timeline.member.id);
  const handleLeave = (): void => onFocus(null);
  const left = layout.x(last.to) - CHART_FACE_SIZE / 2;
  const top = laneY(layout, last.colour, lane, laneCount) - CHART_FACE_SIZE / 2;
  return (
    <Hint content={<span className="font-medium">{timeline.member.name}</span>}>
      <span
        className="absolute rounded-full"
        style={{ left, top, zIndex: isFocused ? 2 : 1 }}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <Avatar member={timeline.member} colour={last.colour} size={CHART_FACE_SIZE} isBreathing={false} isFaded={false} />
      </span>
    </Hint>
  );
};

/** Another person's line fades while you hover someone's face. */
const isDimmed = (focusedId: MemberId | null, memberId: MemberId): boolean => focusedId !== null && focusedId !== memberId;
