import type { Light } from "../domain/light.js";
import type { MemberId } from "../domain/memberId.js";

/** The shape clients decode: the light, plus who its owner is with, if anyone. */
export type WireLight = Light & {
  readonly helping: MemberId | null;
};

export const toWireLight = (light: Light, helping: MemberId | null): WireLight => ({
  memberId: light.memberId,
  colour: light.colour,
  status: light.status,
  since: light.since,
  helping,
});
