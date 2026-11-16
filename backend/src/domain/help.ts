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

/** Going Clear or Off ends a join, from either side. */
export const endsJoin = (colour: Colour): boolean => colour === "green" || colour === "off";

/** Only someone who needs attention can be joined. */
export const isJoinable = (colour: Colour): boolean => colour === "amber" || colour === "red";

/** The status a helper shows while they're with someone. */
export const helpingStatus = (targetName: string): string | null => normaliseStatus(`with ${targetName}`);
