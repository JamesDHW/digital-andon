/** Off means not working right now: hidden from everyone's menu bar. */
export type Colour = "green" | "amber" | "red" | "off";

/** Only amber and red carry a topic: they are the lights that ask for attention. */
export const isRaised = (colour: Colour): boolean => colour === "amber" || colour === "red";
