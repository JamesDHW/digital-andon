import { timeDay } from "d3-time";
import { timeFormat } from "d3-time-format";

import { DEFAULT_PRESET, TIME_RANGE_PRESETS, type TimeRangePreset, type TimeRangePresetId } from "./timeRange.constants.js";

export type TimeRange = {
  readonly from: number;
  readonly to: number;
};

/** A preset slides with the clock; a custom window is fixed. */
export type TimeWindow =
  | { readonly kind: "preset"; readonly preset: TimeRangePresetId }
  | { readonly kind: "custom"; readonly range: TimeRange };

export const defaultWindow: TimeWindow = { kind: "preset", preset: DEFAULT_PRESET };

export const presetFor = (id: TimeRangePresetId): TimeRangePreset => TIME_RANGE_PRESETS.find((preset) => preset.id === id) ?? { id, label: id, durationMs: null };

export const resolveWindow = (window: TimeWindow, now: number): TimeRange => {
  if (window.kind === "custom") return window.range;
  const preset = presetFor(window.preset);
  if (preset.durationMs === null) return { from: timeDay.floor(new Date(now)).getTime(), to: now };
  return { from: now - preset.durationMs, to: now };
};

export const describeWindow = (window: TimeWindow): string => {
  if (window.kind === "preset") return presetFor(window.preset).label;
  const format = timeFormat("%-d %b %H:%M");
  return `${format(new Date(window.range.from))} – ${format(new Date(window.range.to))}`;
};

const isPresetId = (candidate: string): candidate is TimeRangePresetId => TIME_RANGE_PRESETS.some((preset) => preset.id === candidate);

/** ?window=7d, or ?from=…&to=… in milliseconds; anything else falls back to the default. */
export const windowFromQuery = (query: URLSearchParams): TimeWindow => {
  const from = Number(query.get("from"));
  const to = Number(query.get("to"));
  const isCustom = Number.isSafeInteger(from) && Number.isSafeInteger(to) && from > 0 && to > from;
  if (isCustom) return { kind: "custom", range: { from, to } };
  const preset = query.get("window") ?? "";
  if (isPresetId(preset)) return { kind: "preset", preset };
  return defaultWindow;
};

export const windowToQuery = (window: TimeWindow): Readonly<Record<string, string>> => {
  if (window.kind === "preset") return { window: window.preset };
  return { from: String(window.range.from), to: String(window.range.to) };
};

/** For <input type="datetime-local">, which works in local time without a zone. */
export const toDateTimeInput = (milliseconds: number): string => timeFormat("%Y-%m-%dT%H:%M")(new Date(milliseconds));

export const fromDateTimeInput = (value: string): number | null => {
  const milliseconds = new Date(value).getTime();
  if (Number.isNaN(milliseconds)) return null;
  return milliseconds;
};
