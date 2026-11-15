import type { Colour } from "@backend/domain/colour.js";

export const SIGNAL_COLOUR: Readonly<Record<Colour, string>> = {
  green: "var(--signal-green)",
  amber: "var(--signal-amber)",
  red: "var(--signal-red)",
  off: "var(--signal-off)",
};

export const BAND_FILL: Readonly<Record<Colour, string>> = {
  green: "var(--band-green)",
  amber: "var(--band-amber)",
  red: "var(--band-red)",
  off: "transparent",
};

/** Behind someone's initial when they have no photo; the same colours as the Mac app, picked from their id. */
export const AVATAR_BACKGROUNDS: readonly string[] = ["#5c4ad6", "#2e7d8c", "#a8572e", "#4a6b2e", "#8c4073", "#385c9e"];

export const FADED_OPACITY = 0.45;
