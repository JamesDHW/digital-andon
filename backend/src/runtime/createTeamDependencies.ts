import type { AuthDependencies } from "../application/auth/authDependencies.js";
import type { MemberId } from "../domain/memberId.js";
import { createConsoleMailer } from "../adapters/consoleMailer.js";
import { createGoogleIdentity } from "../adapters/googleOpenIdConnect.js";
import { createResendMailer } from "../adapters/resendMailer.js";
import { createSqlCredentialStore } from "../adapters/sql/sqlCredentialStore.js";
import { createSqlEventStore } from "../adapters/sql/sqlEventStore.js";
import { createSqlFollowStore } from "../adapters/sql/sqlFollowStore.js";
import { createSqlLightStore } from "../adapters/sql/sqlLightStore.js";
import { createSqlMemberStore } from "../adapters/sql/sqlMemberStore.js";
import { createSqlSettingsStore } from "../adapters/sql/sqlSettingsStore.js";
import type { SqlExecutor } from "../adapters/sql/sqlExecutor.js";
import { createWebCryptoSecrets } from "../adapters/webCryptoSecrets.js";
import type { DeploymentConfiguration } from "./andonEnvironment.js";

export type TeamRuntime = {
  readonly sql: SqlExecutor;
  readonly configuration: DeploymentConfiguration;
  readonly publicOrigin: string;
  readonly onlineMembers: () => readonly MemberId[];
};

/** The composition root: every effectful capability is chosen here. */
export const createTeamDependencies = (runtime: TeamRuntime): AuthDependencies => ({
  members: createSqlMemberStore(runtime.sql),
  lights: createSqlLightStore(runtime.sql),
  follows: createSqlFollowStore(runtime.sql),
  events: createSqlEventStore(runtime.sql),
  credentials: createSqlCredentialStore(runtime.sql),
  settings: createSqlSettingsStore(runtime.sql, runtime.configuration.defaultSettings),
  secrets: createWebCryptoSecrets(),
  mailer: chooseMailer(runtime.configuration),
  now: () => Date.now(),
  onlineMembers: runtime.onlineMembers,
  publicOrigin: runtime.publicOrigin,
  bootstrapAdminEmail: runtime.configuration.bootstrapAdminEmail,
  google: runtime.configuration.google === null ? null : createGoogleIdentity(runtime.configuration.google),
});

const chooseMailer = (configuration: DeploymentConfiguration) => {
  if (configuration.resendApiKey === null) return createConsoleMailer();
  return createResendMailer({ apiKey: configuration.resendApiKey, fromAddress: configuration.emailFrom });
};
