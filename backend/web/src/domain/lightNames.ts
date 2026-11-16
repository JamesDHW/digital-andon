import type { Colour } from "@backend/domain/colour.js";

/** The same words as the Mac app. */
export const lightName = (colour: Colour): string => {
  switch (colour) {
    case "green":
      return "Clear";
    case "amber":
      return "Disrupted";
    case "red":
      return "Blocked";
    case "off":
      return "Off";
    default:
      return colour satisfies never;
  }
};

/** What each light means, shown on hover; the same sentences as the Mac app. */
export const lightDescription = (colour: Colour): string => {
  switch (colour) {
    case "green":
      return "Work is progressing as expected.";
    case "amber":
      return "Work is progressing slower due to an unexpected complication.";
    case "red":
      return "Work cannot continue without external attention.";
    case "off":
      return "Not working right now, or their Mac is closed.";
    default:
      return colour satisfies never;
  }
};
