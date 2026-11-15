import { timeDay, timeMonth } from "d3-time";
import { timeFormat } from "d3-time-format";

import { DAY_MS, HOUR_MS, MINUTE_MS } from "./web.constants.js";

/** "45 s", "12 min", "1 h 5 min", "2 d 3 h". */
export const formatDuration = (milliseconds: number): string => {
  if (milliseconds < MINUTE_MS) return `${Math.max(0, Math.round(milliseconds / 1000))} s`;
  if (milliseconds < HOUR_MS) return `${Math.round(milliseconds / MINUTE_MS)} min`;
  if (milliseconds < DAY_MS) return withRemainder(Math.floor(milliseconds / HOUR_MS), "h", Math.round((milliseconds % HOUR_MS) / MINUTE_MS), "min");
  return withRemainder(Math.floor(milliseconds / DAY_MS), "d", Math.round((milliseconds % DAY_MS) / HOUR_MS), "h");
};

const withRemainder = (whole: number, wholeUnit: string, remainder: number, remainderUnit: string): string => {
  if (remainder === 0) return `${whole} ${wholeUnit}`;
  return `${whole} ${wholeUnit} ${remainder} ${remainderUnit}`;
};

/** Axis labels that follow the zoom: hours within a day, weekdays across days, months at month starts. */
export const formatTick = (date: Date): string => {
  const isMidnight = timeDay.floor(date).getTime() === date.getTime();
  if (!isMidnight) return timeFormat("%H:%M")(date);
  const isMonthStart = timeMonth.floor(date).getTime() === date.getTime();
  if (isMonthStart) return timeFormat("%-d %b")(date);
  return timeFormat("%a %-d")(date);
};

export const formatMoment = (milliseconds: number): string => timeFormat("%a %-d %b, %H:%M")(new Date(milliseconds));
