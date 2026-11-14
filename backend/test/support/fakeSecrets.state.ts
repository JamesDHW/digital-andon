import type { Secrets } from "../../src/application/ports/secrets.js";
import { isMemberId } from "../../src/domain/memberId.js";
import { AndonError } from "../../src/errors/andonError.js";

/** Predictable tokens and ids; hashing is a visible prefix so tests can see what was stored. */
export const createFakeSecrets = (): Secrets => {
  const counter = { issued: 0 };
  const nextNumber = (): number => {
    counter.issued += 1;
    return counter.issued;
  };

  return {
    createToken: () => `token-${nextNumber()}`,
    createDigits: (count) => String(nextNumber()).padStart(count, "0"),
    createMemberId: () => {
      const memberId = `member-${nextNumber()}`;
      if (isMemberId(memberId)) return memberId;
      return new AndonError("unexpected", "Fake member id is invalid.");
    },
    hash: async (secret) => `hashed:${secret}`,
  };
};
