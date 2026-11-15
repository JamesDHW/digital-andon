import type { Colour } from "./colour.js";
import type { MemberId } from "./memberId.js";

export type Light = {
  readonly memberId: MemberId;
  readonly colour: Colour;
  readonly status: string | null;
  readonly since: number;
};

export const createInitialLight = (memberId: MemberId, at: number): Light => ({
  memberId,
  colour: "green",
  status: null,
  since: at,
});
