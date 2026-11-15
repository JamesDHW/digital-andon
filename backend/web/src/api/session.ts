import { tryCatch } from "@backend/errors/tryCatch.js";
import { TOKEN_STORAGE_KEY } from "./api.constants.js";

/** Local storage can be unavailable (private windows): then the sign-in lasts for this tab only. */
export const readStoredToken = (): string | null => {
  const token = tryCatch(() => window.localStorage.getItem(TOKEN_STORAGE_KEY));
  if (token instanceof Error) return null;
  return token;
};

export const storeToken = (token: string | null): void => {
  tryCatch(() => {
    if (token === null) return window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    return window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  });
};

export type GoogleResult = {
  readonly token: string | null;
  readonly error: string | null;
};

/** Google sign-in comes back as /#token=… or /#error=…. The fragment never reaches a server; it's cleared at once. */
export const takeGoogleResult = (): GoogleResult => {
  const result = new URLSearchParams(window.location.hash.slice(1));
  const token = result.get("token");
  const error = result.get("error");
  const hasResult = token !== null || error !== null;
  if (hasResult) {
    window.history.replaceState(null, "", window.location.pathname);
  }
  return { token, error };
};
