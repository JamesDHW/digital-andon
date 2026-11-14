import type { AuthDependencies } from "../application/auth/authDependencies.js";
import type { AvatarStore } from "../application/ports/avatarStore.js";
import type { Delivery } from "../protocol/serverMessage.js";

export type HttpContext = {
  readonly request: Request;
  readonly url: URL;
  readonly dependencies: AuthDependencies;
  readonly avatars: AvatarStore;
  /** Enables /dev/sign-in; set only by DEV_MODE=true in local .dev.vars. */
  readonly isDevelopmentMode: boolean;
};

/** The response, plus any socket messages the change must fan out. */
export type HttpOutcome = {
  readonly response: Response;
  readonly deliveries: readonly Delivery[];
};

export const respondOnly = (response: Response): HttpOutcome => ({ response, deliveries: [] });
