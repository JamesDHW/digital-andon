import type { MemberId } from "../../domain/memberId.js";
import type { CredentialStore } from "../ports/credentialStore.js";
import type { GoogleIdentity } from "../ports/googleIdentity.js";
import type { Mailer } from "../ports/mailer.js";
import type { Secrets } from "../ports/secrets.js";
import type { SettingsStore } from "../ports/settingsStore.js";
import type { TeamDependencies } from "../teamDependencies.js";

export type AuthDependencies = TeamDependencies & {
  readonly credentials: CredentialStore;
  readonly settings: SettingsStore;
  readonly secrets: Secrets;
  readonly mailer: Mailer;
  /** The https origin people's invite links and avatar URLs point at. */
  readonly publicOrigin: string;
  /** The one address allowed to create the first admin on an empty team. */
  readonly bootstrapAdminEmail: string | null;
  /** Null when this deployment has no Google OAuth client configured. */
  readonly google: GoogleIdentity | null;
};

export type SignedInDevice = {
  readonly deviceToken: string;
  readonly memberId: MemberId;
};
