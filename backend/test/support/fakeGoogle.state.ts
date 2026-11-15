import type { GoogleAuthorisation, GoogleCodeExchange, GoogleIdentity, GoogleProfile } from "../../src/application/ports/googleIdentity.js";
import { InvalidCodeError } from "../../src/errors/andonError.js";
import { ACCEPTED_GOOGLE_CODE } from "./testTeam.constants.js";

export type FakeGoogle = GoogleIdentity & {
  /** Who Google will say signed in, for the next exchanged code. */
  readonly signInAs: (profile: GoogleProfile) => void;
  readonly lastAuthorisation: () => GoogleAuthorisation | undefined;
  readonly lastExchange: () => GoogleCodeExchange | undefined;
};

/** Stands in for Google: the authorisation URL carries the state, and only ACCEPTED_GOOGLE_CODE is exchanged. */
export const createFakeGoogle = (): FakeGoogle => {
  const profiles: GoogleProfile[] = [];
  const authorisations: GoogleAuthorisation[] = [];
  const exchanges: GoogleCodeExchange[] = [];
  return {
    authorisationUrl: async (authorisation) => {
      authorisations.push(authorisation);
      return `https://accounts.google.test/auth?state=${encodeURIComponent(authorisation.state)}`;
    },
    exchangeCode: async (exchange) => {
      exchanges.push(exchange);
      const profile = profiles.at(-1);
      const isAccepted = exchange.code === ACCEPTED_GOOGLE_CODE && profile !== undefined;
      if (!isAccepted) return new InvalidCodeError();
      return profile;
    },
    signInAs: (profile) => {
      profiles.push(profile);
    },
    lastAuthorisation: () => authorisations.at(-1),
    lastExchange: () => exchanges.at(-1),
  };
};
