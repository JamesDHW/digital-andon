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

/** A helper's face is this much of the person's, and this much of it shows past the one in front. */
export const HELPER_SCALE = 0.78;
export const HELPER_OVERLAP = 0.7;

/** A helper's face on someone's timeline line, where they joined or left. */
export const JOIN_MARK_SIZE = 18;
