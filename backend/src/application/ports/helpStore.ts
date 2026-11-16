import type { AndonError } from "../../errors/andonError.js";
import type { Help } from "../../domain/help.js";
import type { MemberId } from "../../domain/memberId.js";

/** Who is with whom. A helper is with one person at a time, so the helper is the key. */
export type HelpStore = {
  readonly list: () => readonly Help[] | AndonError;
  readonly findByHelper: (helperId: MemberId) => Help | null | AndonError;
  readonly listByTarget: (targetId: MemberId) => readonly Help[] | AndonError;
  readonly save: (help: Help) => undefined | AndonError;
  readonly remove: (helperId: MemberId) => undefined | AndonError;
};
