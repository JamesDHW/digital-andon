import { scaleTime } from "d3-scale";
import { timeDay } from "d3-time";

import type { Colour } from "@backend/domain/colour.js";
import { formatTick } from "./format.js";
import type { PersonTimeline, TimelineSegment } from "./timeline.js";
import type { TimeRange } from "./timeRange.js";
import { CHART_BAND_ORDER, CHART_HEIGHT, CHART_MARGIN, CHART_TICK_SPACING } from "./chart.constants.js";

export type ChartBand = {
  readonly colour: Colour;
  readonly top: number;
  readonly height: number;
};

export type ChartTick = {
  readonly x: number;
  readonly label: string;
};

export type ChartSpan = {
  readonly left: number;
  readonly width: number;
};

export type ChartLayout = {
  readonly width: number;
  readonly height: number;
  readonly plotLeft: number;
  readonly plotRight: number;
  readonly plotTop: number;
  readonly plotBottom: number;
  readonly bands: readonly ChartBand[];
  readonly ticks: readonly ChartTick[];
  readonly weekends: readonly ChartSpan[];
  readonly x: (milliseconds: number) => number;
  readonly timeAt: (pixel: number) => number;
};

/** Red on top, amber in the middle, green at the bottom; the time axis picks hours, days or months to fit the width. */
export const layoutChart = (range: TimeRange, width: number): ChartLayout => {
  const plotLeft = CHART_MARGIN.left;
  const plotRight = Math.max(plotLeft + 1, width - CHART_MARGIN.right);
  const plotTop = CHART_MARGIN.top;
  const plotBottom = CHART_HEIGHT - CHART_MARGIN.bottom;
  const scale = scaleTime().domain([new Date(range.from), new Date(range.to)]).range([plotLeft, plotRight]);
  const bandHeight = (plotBottom - plotTop) / CHART_BAND_ORDER.length;
  const x = (milliseconds: number): number => scale(new Date(milliseconds));
  return {
    width,
    height: CHART_HEIGHT,
    plotLeft,
    plotRight,
    plotTop,
    plotBottom,
    bands: CHART_BAND_ORDER.map((colour, index) => ({ colour, top: plotTop + index * bandHeight, height: bandHeight })),
    ticks: scale.ticks(Math.max(2, Math.floor((plotRight - plotLeft) / CHART_TICK_SPACING))).map((date) => ({ x: scale(date), label: formatTick(date) })),
    weekends: weekendSpans(range).map((span) => ({ left: x(span.from), width: x(span.to) - x(span.from) })),
    x,
    timeAt: (pixel: number) => scale.invert(Math.min(Math.max(pixel, plotLeft), plotRight)).getTime(),
  };
};

/** Saturdays and Sundays inside the window, clipped to it. */
const weekendSpans = (range: TimeRange): readonly TimeRange[] =>
  timeDay
    .range(timeDay.floor(new Date(range.from)), new Date(range.to))
    .filter((day) => day.getDay() === 0 || day.getDay() === 6)
    .map((day) => ({ from: Math.max(day.getTime(), range.from), to: Math.min(timeDay.offset(day, 1).getTime(), range.to) }));

/** Each person gets their own lane inside every band, so lines in the same colour sit side by side instead of on top of each other. */
export const laneY = (layout: ChartLayout, colour: Colour, lane: number, laneCount: number): number => {
  const band = layout.bands.find((candidate) => candidate.colour === colour) ?? layout.bands[0];
  const top = band?.top ?? layout.plotTop;
  const height = band?.height ?? 0;
  return top + (height * (lane + 1)) / (laneCount + 1);
};

/** A step line through someone's lights. Off breaks the line: they weren't working. */
export const linePath = (layout: ChartLayout, timeline: PersonTimeline, lane: number, laneCount: number): string =>
  timeline.segments
    .map((segment, index) => {
      if (segment.colour === "off") return "";
      const y = laneY(layout, segment.colour, lane, laneCount);
      const isContinuation = continuesFrom(timeline.segments[index - 1], segment);
      const start = isContinuation ? `V ${y.toFixed(1)}` : `M ${layout.x(segment.from).toFixed(1)} ${y.toFixed(1)}`;
      return `${start} H ${layout.x(segment.to).toFixed(1)}`;
    })
    .filter((command) => command.length > 0)
    .join(" ");

const continuesFrom = (previous: TimelineSegment | undefined, segment: TimelineSegment): boolean =>
  previous !== undefined && previous.colour !== "off" && previous.to === segment.from;
