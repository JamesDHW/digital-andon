import { z } from "zod";

import type { GoogleClientConfiguration } from "../adapters/googleOpenIdConnect.js";
import type { TeamSettings } from "../application/ports/settingsStore.js";
import { DEFAULT_EMAIL_FROM, DEFAULT_TEAM_NAME } from "./runtime.constants.js";

/** Bindings and variables declared in wrangler.toml and secrets. */
export type AndonEnvironment = {
  readonly TEAM: DurableObjectNamespace;
  readonly RESEND_API_KEY?: string;
  readonly EMAIL_FROM?: string;
  readonly BOOTSTRAP_ADMIN_EMAIL?: string;
  readonly ALLOWED_EMAIL_DOMAINS?: string;
  readonly TEAM_NAME?: string;
  readonly PUBLIC_ORIGIN?: string;
  readonly DOWNLOAD_URL?: string;
  readonly DEV_MODE?: string;
  readonly GOOGLE_CLIENT_ID?: string;
  readonly GOOGLE_CLIENT_SECRET?: string;
};

export type DeploymentConfiguration = {
  readonly resendApiKey: string | null;
  readonly emailFrom: string;
  readonly bootstrapAdminEmail: string | null;
  readonly publicOrigin: string | null;
  readonly downloadUrl: string | null;
  readonly isDevelopmentMode: boolean;
  readonly defaultSettings: TeamSettings;
  /** Null unless both the client ID and its secret are set. */
  readonly google: GoogleClientConfiguration | null;
};

const blankAsNull = (rawValue: string | undefined): string | null => {
  const trimmedValue = rawValue?.trim() ?? "";
  if (trimmedValue.length === 0) return null;
  return trimmedValue;
};

const variablesSchema = z.object({
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  BOOTSTRAP_ADMIN_EMAIL: z.string().optional(),
  ALLOWED_EMAIL_DOMAINS: z.string().optional(),
  TEAM_NAME: z.string().optional(),
  PUBLIC_ORIGIN: z.url().optional().or(z.literal("")),
  DOWNLOAD_URL: z.url().optional().or(z.literal("")),
  DEV_MODE: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

/** Environment variables are untrusted input; misconfiguration falls back to safe defaults. */
export const readDeploymentConfiguration = (environment: AndonEnvironment): DeploymentConfiguration => {
  const parsed = variablesSchema.safeParse(environment);
  const variables = parsed.success ? parsed.data : {};
  const allowedDomains = (variables.ALLOWED_EMAIL_DOMAINS ?? "").split(",").map((domain) => domain.trim().toLowerCase()).filter((domain) => domain.length > 0);

  return {
    resendApiKey: blankAsNull(variables.RESEND_API_KEY),
    emailFrom: blankAsNull(variables.EMAIL_FROM) ?? DEFAULT_EMAIL_FROM,
    bootstrapAdminEmail: blankAsNull(variables.BOOTSTRAP_ADMIN_EMAIL)?.toLowerCase() ?? null,
    publicOrigin: blankAsNull(variables.PUBLIC_ORIGIN),
    downloadUrl: blankAsNull(variables.DOWNLOAD_URL),
    isDevelopmentMode: variables.DEV_MODE === "true",
    defaultSettings: { teamName: blankAsNull(variables.TEAM_NAME) ?? DEFAULT_TEAM_NAME, allowedDomains, apiKeyHash: null },
    google: readGoogleClient(variables.GOOGLE_CLIENT_ID, variables.GOOGLE_CLIENT_SECRET),
  };
};

const readGoogleClient = (rawClientId: string | undefined, rawClientSecret: string | undefined): GoogleClientConfiguration | null => {
  const clientId = blankAsNull(rawClientId);
  const clientSecret = blankAsNull(rawClientSecret);
  if (clientId === null) return null;
  if (clientSecret === null) return null;
  return { clientId, clientSecret };
};
