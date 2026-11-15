import type { Colour } from "@backend/domain/colour.js";

/** The same words as the Mac app. */
export const lightName = (colour: Colour): string => {
  switch (colour) {
    case "green":
      return "Clear";
    case "amber":
      return "Assist";
    case "red":
      return "Blocked";
    case "off":
      return "Off";
    default:
      return colour satisfies never;
  }
};
