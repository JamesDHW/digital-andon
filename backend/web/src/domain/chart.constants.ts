import type { Colour } from "@backend/domain/colour.js";

export const CHART_HEIGHT = 380;
export const CHART_MARGIN = { top: 12, right: 32, bottom: 30, left: 64 } as const;
/** Roughly one axis label per this many pixels. */
export const CHART_TICK_SPACING = 96;
export const CHART_BAND_ORDER: readonly Colour[] = ["red", "amber", "green"];
export const CHART_FACE_SIZE = 26;
/** Context switching: one swim lane per person, and room for the time axis under them. */
export const SWITCHING_LANE_HEIGHT = 56;
export const SWITCHING_AXIS_HEIGHT = 28;
export const SWITCHING_FACE_SIZE = 32;
