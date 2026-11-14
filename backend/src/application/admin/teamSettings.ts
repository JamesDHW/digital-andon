import type { AndonError } from "../../errors/andonError.js";
import type { Member } from "../../domain/member.js";
import type { AuthDependencies } from "../auth/authDependencies.js";
import type { TeamSettings } from "../ports/settingsStore.js";
import { requireAdmin } from "./requireAdmin.js";

export type VisibleTeamSettings = {
  readonly teamName: string;
  readonly allowedDomains: readonly string[];
  readonly hasApiKey: boolean;
};

export type TeamSettingsChange = {
  readonly teamName?: string | undefined;
  readonly allowedDomains?: readonly string[] | undefined;
};

export const readTeamSettings = (dependencies: AuthDependencies, admin: Member): VisibleTeamSettings | AndonError => {
  const forbidden = requireAdmin(admin);
  if (forbidden !== undefined) return forbidden;

  const settings = dependencies.settings.load();
  if (settings instanceof Error) return settings;

  return toVisibleSettings(settings);
};

export const changeTeamSettings = (dependencies: AuthDependencies, admin: Member, change: TeamSettingsChange): VisibleTeamSettings | AndonError => {
  const forbidden = requireAdmin(admin);
  if (forbidden !== undefined) return forbidden;

  const settings = dependencies.settings.load();
  if (settings instanceof Error) return settings;

  const changedSettings: TeamSettings = {
    teamName: change.teamName?.trim() ?? settings.teamName,
    allowedDomains: change.allowedDomains?.map((domain) => domain.trim().toLowerCase()) ?? settings.allowedDomains,
    apiKeyHash: settings.apiKeyHash,
  };
  const saved = dependencies.settings.save(changedSettings);
  if (saved instanceof Error) return saved;

  return toVisibleSettings(changedSettings);
};

/** Returns the new key once; only its hash is kept. */
export const rotateApiKey = async (dependencies: AuthDependencies, admin: Member): Promise<string | AndonError> => {
  const forbidden = requireAdmin(admin);
  if (forbidden !== undefined) return forbidden;

  const settings = dependencies.settings.load();
  if (settings instanceof Error) return settings;

  const apiKey = dependencies.secrets.createToken();
  const saved = dependencies.settings.save({ ...settings, apiKeyHash: await dependencies.secrets.hash(apiKey) });
  if (saved instanceof Error) return saved;

  return apiKey;
};

const toVisibleSettings = (settings: TeamSettings): VisibleTeamSettings => ({
  teamName: settings.teamName,
  allowedDomains: settings.allowedDomains,
  hasApiKey: settings.apiKeyHash !== null,
});
