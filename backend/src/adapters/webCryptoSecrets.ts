import { AndonError } from "../errors/andonError.js";
import type { Secrets } from "../application/ports/secrets.js";
import { isMemberId } from "../domain/memberId.js";
import { DECIMAL_BASE, TOKEN_BYTES } from "./adapters.constants.js";

/** crypto.getRandomValues and SHA-256; available in Workers and Node alike. */
export const createWebCryptoSecrets = (): Secrets => ({
  createToken: () => toBase64Url(crypto.getRandomValues(new Uint8Array(TOKEN_BYTES))),
  createDigits: (count) => [...crypto.getRandomValues(new Uint32Array(count))].map((randomNumber) => String(randomNumber % DECIMAL_BASE)).join(""),
  createMemberId: () => {
    const memberId = crypto.randomUUID();
    if (isMemberId(memberId)) return memberId;
    return new AndonError("unexpected", "Generated member id has an unexpected shape.");
  },
  hash: async (secret) => toBase64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret)))),
});

const toBase64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
