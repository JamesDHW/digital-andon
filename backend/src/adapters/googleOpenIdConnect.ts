import { z } from "zod";

import { AndonError, InvalidCodeError } from "../errors/andonError.js";
import { tryCatch, tryCatchAsync } from "../errors/tryCatch.js";
import type { GoogleIdentity, GoogleProfile } from "../application/ports/googleIdentity.js";
import {
  GOOGLE_AUTHORISE_URL,
  GOOGLE_ISSUERS,
  GOOGLE_PHOTO_SIZE,
  GOOGLE_PHOTO_SIZE_PATTERN,
  GOOGLE_SCOPES,
  GOOGLE_TOKEN_URL,
  SECONDS_TO_MS,
} from "./adapters.constants.js";

export type GoogleClientConfiguration = {
  readonly clientId: string;
  readonly clientSecret: string;
};

const tokenResponseSchema = z.object({ id_token: z.string() });

const idTokenClaimsSchema = z.object({
  iss: z.string(),
  aud: z.string(),
  exp: z.number(),
  email: z.string(),
  email_verified: z.union([z.boolean(), z.literal("true"), z.literal("false")]),
  name: z.string().optional(),
  picture: z.string().optional(),
});

type IdTokenClaims = z.infer<typeof idTokenClaimsSchema>;

/** Google sign-in on the server: the authorisation code is exchanged here, with the client secret and the PKCE verifier. */
export const createGoogleIdentity = (configuration: GoogleClientConfiguration): GoogleIdentity => ({
  authorisationUrl: async (authorisation) => {
    const url = new URL(GOOGLE_AUTHORISE_URL);
    url.searchParams.set("client_id", configuration.clientId);
    url.searchParams.set("redirect_uri", authorisation.redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", GOOGLE_SCOPES);
    url.searchParams.set("state", authorisation.state);
    url.searchParams.set("code_challenge", await sha256Base64Url(authorisation.codeVerifier));
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("prompt", "select_account");
    if (authorisation.domainHint !== null) {
      url.searchParams.set("hd", authorisation.domainHint);
    }
    return url.toString();
  },
  exchangeCode: async (exchange) => {
    const response = await tryCatchAsync(() =>
      fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: exchange.code,
          client_id: configuration.clientId,
          client_secret: configuration.clientSecret,
          redirect_uri: exchange.redirectUri,
          grant_type: "authorization_code",
          code_verifier: exchange.codeVerifier,
        }),
      }),
    );
    if (response instanceof Error) return new AndonError("unexpected", `Couldn't reach Google: ${response.message}`);
    if (!response.ok) return new InvalidCodeError();

    const body = await tryCatchAsync((): Promise<unknown> => response.json());
    if (body instanceof AndonError) return body;
    const tokens = tokenResponseSchema.safeParse(body);
    if (!tokens.success) return new AndonError("unexpected", "Google's answer had no ID token.");

    const claims = readIdTokenClaims(tokens.data.id_token);
    if (claims instanceof Error) return claims;
    return toProfile(claims, configuration.clientId);
  },
});

/** The ID token came straight from Google's token endpoint over TLS, so OpenID Connect Core §3.1.3.7 lets
 * TLS stand in for checking its signature. The audience, issuer and expiry are still checked. */
const readIdTokenClaims = (idToken: string): IdTokenClaims | AndonError => {
  const payload = idToken.split(".")[1];
  if (payload === undefined) return new AndonError("unexpected", "Google's ID token is malformed.");

  const decoded = tryCatch((): unknown => JSON.parse(decodeBase64Url(payload)));
  if (decoded instanceof AndonError) return decoded;

  const claims = idTokenClaimsSchema.safeParse(decoded);
  if (!claims.success) return new AndonError("unexpected", z.prettifyError(claims.error));
  return claims.data;
};

const toProfile = (claims: IdTokenClaims, clientId: string): GoogleProfile | AndonError => {
  const isIssuedByGoogle = GOOGLE_ISSUERS.some((issuer) => issuer === claims.iss);
  const isForUs = claims.aud === clientId;
  const isUnexpired = claims.exp * SECONDS_TO_MS > Date.now();
  const isTrustworthy = isIssuedByGoogle && isForUs && isUnexpired;
  if (!isTrustworthy) return new InvalidCodeError();

  return {
    email: claims.email,
    isEmailVerified: claims.email_verified === true || claims.email_verified === "true",
    name: claims.name ?? null,
    pictureUrl: claims.picture?.replace(GOOGLE_PHOTO_SIZE_PATTERN, GOOGLE_PHOTO_SIZE) ?? null,
  };
};

const sha256Base64Url = async (text: string): Promise<string> =>
  toBase64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))));

const toBase64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");

/** Names can be any language, so the bytes are decoded as UTF-8 rather than read as Latin-1. */
const decodeBase64Url = (encoded: string): string => {
  const base64 = encoded.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "="));
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
};
