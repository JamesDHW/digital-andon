import { completeGoogleSignIn, startGoogleSignIn, takeSignInAttempt, type GoogleSignInStart } from "../application/auth/googleSignIn.js";
import type { SignInClient } from "../application/ports/credentialStore.js";
import type { AndonError } from "../errors/andonError.js";
import { ADMIN_PAGE_PATH, APP_SIGNED_IN_URL, DEFAULT_APP_DEVICE_NAME, DEFAULT_WEB_DEVICE_NAME, DEVICE_NAME_MAX_LENGTH, FOUND_STATUS } from "./http.constants.js";
import { respondOnly, type HttpContext, type HttpOutcome } from "./httpOutcome.js";
import { ERROR_STATUSES } from "./httpResponses.constants.js";

/** GET /auth/google/start?client=app|web&device=… sends the browser to Google. */
export const handleGoogleStart = async (context: HttpContext): Promise<HttpOutcome> => {
  const authorisationUrl = await startGoogleSignIn(context.dependencies, readStart(context.url));
  if (authorisationUrl instanceof Error) return respondOnly(plainErrorResponse(authorisationUrl));
  return respondOnly(redirectTo(authorisationUrl));
};

/** GET /auth/google/callback: Google sends the browser back here. The Mac app gets its token through
 * an andon:// redirect its sign-in window is waiting for; the admin page gets it in the URL fragment,
 * which never reaches a server. */
export const handleGoogleCallback = async (context: HttpContext): Promise<HttpOutcome> => {
  const attempt = await takeSignInAttempt(context.dependencies, context.url.searchParams.get("state") ?? "");
  if (attempt instanceof Error) return respondOnly(plainErrorResponse(attempt));

  const code = context.url.searchParams.get("code");
  if (code === null) return respondOnly(finishWithError(context, attempt.client, "Google sign-in was cancelled."));

  const signedIn = await completeGoogleSignIn(context.dependencies, attempt, code);
  if (signedIn instanceof Error) return respondOnly(finishWithError(context, attempt.client, signedIn.message));

  const session = new URLSearchParams({ token: signedIn.deviceToken });
  return { response: redirectTo(signedInAddress(context, attempt.client, session)), deliveries: signedIn.deliveries };
};

const readStart = (url: URL): GoogleSignInStart => {
  const client: SignInClient = url.searchParams.get("client") === "app" ? "app" : "web";
  const defaultName = client === "app" ? DEFAULT_APP_DEVICE_NAME : DEFAULT_WEB_DEVICE_NAME;
  const deviceName = (url.searchParams.get("device") ?? "").trim().slice(0, DEVICE_NAME_MAX_LENGTH);
  return { client, deviceName: deviceName.length > 0 ? deviceName : defaultName };
};

const finishWithError = (context: HttpContext, client: SignInClient, message: string): Response =>
  redirectTo(signedInAddress(context, client, new URLSearchParams({ error: message })));

const signedInAddress = (context: HttpContext, client: SignInClient, parameters: URLSearchParams): string => {
  if (client === "app") return `${APP_SIGNED_IN_URL}?${parameters.toString()}`;
  return `${context.dependencies.publicOrigin}${ADMIN_PAGE_PATH}#${parameters.toString()}`;
};

/** Built by hand: Response.redirect only accepts http(s) addresses in some runtimes, and andon:// is not one. */
const redirectTo = (location: string): Response => new Response(null, { status: FOUND_STATUS, headers: { location } });

const plainErrorResponse = (error: AndonError): Response =>
  new Response(`${error.message}\n\nClose this window and try signing in again.`, {
    status: ERROR_STATUSES[error.code],
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
