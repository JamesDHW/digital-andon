import { isRaised, type Colour } from "./colour.js";
import type { Light } from "./light.js";

export type PullRequest = {
  readonly colour: Colour;
  /** Omitted keeps the current topic when the colour is unchanged. */
  readonly topic: string | null | undefined;
  readonly at: number;
};

/** A different colour starts a new period; the same colour only updates its topic. Green and off never carry a topic. */
export const pullCord = (light: Light, request: PullRequest): Light => {
  const isSameColour = request.colour === light.colour;
  if (!isRaised(request.colour)) return isSameColour ? light : { memberId: light.memberId, colour: request.colour, topic: null, since: request.at };
  if (isSameColour) return { ...light, topic: request.topic ?? light.topic };

  return { memberId: light.memberId, colour: request.colour, topic: request.topic ?? null, since: request.at };
};
