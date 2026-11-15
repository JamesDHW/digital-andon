import { DAY_MS, HOUR_MS } from "./web.constants.js";

export type TimeRangePresetId = "today" | "24h" | "7d" | "30d" | "90d";

export type TimeRangePreset = {
  readonly id: TimeRangePresetId;
  readonly label: string;
  /** Null for Today, which starts at local midnight. */
  readonly durationMs: number | null;
};

export const TIME_RANGE_PRESETS: readonly TimeRangePreset[] = [
  { id: "today", label: "Today", durationMs: null },
  { id: "24h", label: "Last 24 hours", durationMs: 24 * HOUR_MS },
  { id: "7d", label: "Last 7 days", durationMs: 7 * DAY_MS },
  { id: "30d", label: "Last 30 days", durationMs: 30 * DAY_MS },
  { id: "90d", label: "Last 90 days", durationMs: 90 * DAY_MS },
];

export const DEFAULT_PRESET: TimeRangePresetId = "7d";
