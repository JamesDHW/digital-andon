import { z } from "zod";

import { AndonError } from "../../errors/andonError.js";
import { tryCatch } from "../../errors/tryCatch.js";
import type { SettingsStore, TeamSettings } from "../../application/ports/settingsStore.js";
import { runStatement, selectFirstRow, type SqlExecutor } from "./sqlExecutor.js";
import { SETTINGS_KEY } from "./sql.constants.js";

const settingsRowSchema = z.object({ value: z.string() });

const teamSettingsSchema = z.object({
  teamName: z.string(),
  allowedDomains: z.array(z.string()).readonly(),
});

/** Settings never saved yet read as the deployment's defaults. */
export const createSqlSettingsStore = (sql: SqlExecutor, defaultSettings: TeamSettings): SettingsStore => ({
  load: () => {
    const row = selectFirstRow(sql, settingsRowSchema, "SELECT value FROM settings WHERE key = ?", SETTINGS_KEY);
    if (row instanceof Error) return row;
    if (row === null) return defaultSettings;
    return parseSettings(row.value);
  },
  save: (settings) => runStatement(sql, "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", SETTINGS_KEY, JSON.stringify(settings)),
});

const parseSettings = (serialisedSettings: string): TeamSettings | AndonError => {
  const decoded = tryCatch((): unknown => JSON.parse(serialisedSettings));
  if (decoded instanceof Error) return new AndonError("storage-failed", decoded.message);

  const parsed = teamSettingsSchema.safeParse(decoded);
  if (!parsed.success) return new AndonError("storage-failed", z.prettifyError(parsed.error));
  return parsed.data;
};
