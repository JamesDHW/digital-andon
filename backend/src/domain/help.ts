import type { Colour } from "./colour.js";
import type { MemberId } from "./memberId.js";
import { normaliseStatus } from "./status.js";

/** Someone working with a teammate who is Disrupted or Blocked. Their light before joining is kept, so leaving
 * puts it back, whatever it was changed to in the meantime. */
export type Help = {
  readonly helperId: MemberId;
  readonly targetId: MemberId;
  readonly returnColour: Colour;
  readonly returnStatus: string | null;
  readonly joinedAt: number;
};

/** Changing to Clear or Off ends a join, from either side. Someone joined while Clear stays joined until they change. */
export const endsJoin = (from: Colour, to: Colour): boolean => from !== to && (to === "green" || to === "off");

/** Anyone working can be joined, Clear included: time spent with people who barely use Digital Andon still counts. */
export const isJoinable = (colour: Colour): boolean => colour !== "off";

/** The status a helper shows while they're with someone. */
export const helpingStatus = (targetName: string): string | null => normaliseStatus(`with ${targetName}`);
