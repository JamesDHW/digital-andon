import type { AndonError } from "../../errors/andonError.js";

/** What Google tells us about the person who signed in. */
export type GoogleProfile = {
  readonly email: string;
  readonly isEmailVerified: boolean;
  readonly name: string | null;
  readonly pictureUrl: string | null;
};

export type GoogleAuthorisation = {
  readonly state: string;
  readonly codeVerifier: string;
  readonly redirectUri: string;
  /** Pre-selects accounts on this domain in Google's account chooser. A convenience only; never trusted. */
  readonly domainHint: string | null;
};

export type GoogleCodeExchange = {
  readonly code: string;
  readonly codeVerifier: string;
  readonly redirectUri: string;
};

/** Google sign-in (OAuth 2.0 with PKCE, OpenID Connect). */
export type GoogleIdentity = {
  readonly authorisationUrl: (authorisation: GoogleAuthorisation) => Promise<string>;
  readonly exchangeCode: (exchange: GoogleCodeExchange) => Promise<GoogleProfile | AndonError>;
};
