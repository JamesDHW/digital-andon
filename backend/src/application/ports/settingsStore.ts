import type { AndonError } from "../../errors/andonError.js";

export type TeamSettings = {
  readonly teamName: string;
  readonly allowedDomains: readonly string[];
  readonly apiKeyHash: string | null;
};

export type SettingsStore = {
  readonly load: () => TeamSettings | AndonError;
  readonly save: (settings: TeamSettings) => undefined | AndonError;
};
