import type { AndonError } from "../../errors/andonError.js";
import type { MemberId } from "../../domain/memberId.js";

/** Randomness and hashing, injected so tests are deterministic. */
export type Secrets = {
  readonly createToken: () => string;
  readonly createDigits: (count: number) => string;
  readonly createMemberId: () => MemberId | AndonError;
  readonly hash: (secret: string) => Promise<string>;
};
