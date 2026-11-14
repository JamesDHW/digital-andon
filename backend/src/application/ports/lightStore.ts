import type { AndonError } from "../../errors/andonError.js";
import type { Light } from "../../domain/light.js";
import type { MemberId } from "../../domain/memberId.js";

export type LightStore = {
  readonly list: () => readonly Light[] | AndonError;
  readonly find: (memberId: MemberId) => Light | null | AndonError;
  readonly save: (light: Light) => undefined | AndonError;
};
