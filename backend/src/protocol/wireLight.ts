import type { Light } from "../domain/light.js";

/** The shape clients decode; identical to the domain light today, kept separate so the wire can stay stable. */
export type WireLight = Light;

export const toWireLight = (light: Light): WireLight => ({
  memberId: light.memberId,
  colour: light.colour,
  topic: light.topic,
  since: light.since,
});
