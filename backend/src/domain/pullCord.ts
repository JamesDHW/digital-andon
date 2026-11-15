import type { Colour } from "./colour.js";
import type { Light } from "./light.js";

export type PullRequest = {
  readonly colour: Colour;
  /** Omitted keeps the current status; null clears it. */
  readonly status: string | null | undefined;
  readonly at: number;
};

/** A different colour starts a new period. Your status stays with you through amber, red and off,
 * and clears whenever you go back to green. */
export const pullCord = (light: Light, request: PullRequest): Light => {
  const status = request.status === undefined ? light.status : request.status;
  const isSameColour = request.colour === light.colour;
  if (isSameColour) return { ...light, status };

  const isBackToGreen = request.colour === "green";
  return { memberId: light.memberId, colour: request.colour, status: isBackToGreen ? null : status, since: request.at };
};
