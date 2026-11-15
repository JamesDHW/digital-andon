/** Off means not working right now: hidden from everyone's menu bar. */
export type Colour = "green" | "amber" | "red" | "off";

/** Amber and red are the lights that ask for attention. */
export const isRaised = (colour: Colour): boolean => colour === "amber" || colour === "red";
