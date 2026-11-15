import { useCallback, useEffect, useState } from "react";

import { AndonError, UnauthorisedError } from "@backend/errors/andonError.js";
import type { MemberId } from "@backend/domain/memberId.js";
import type { TeamSettings } from "../api/schemas.js";
import { fetchSettings, removeMember, saveSettings } from "../api/teamApi.js";

export type TeamSettingsState = {
  readonly settings: TeamSettings | null;
  readonly message: string | null;
  readonly save: (settings: TeamSettings) => void;
  readonly remove: (memberId: MemberId) => void;
};

export const useTeamSettings = (token: string, onSignedOut: () => void): TeamSettingsState => {
  const [settings, setSettings] = useState<TeamSettings | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const report = useCallback(
    (failure: AndonError): void => {
      if (failure instanceof UnauthorisedError) return onSignedOut();
      setMessage(failure.message);
    },
    [onSignedOut],
  );

  useEffect(() => {
    void (async () => {
      const loaded = await fetchSettings(token);
      if (loaded instanceof AndonError) return report(loaded);
      setSettings(loaded);
    })();
  }, [token, report]);

  const save = useCallback(
    (changed: TeamSettings) => {
      void (async () => {
        const saved = await saveSettings(token, changed);
        if (saved instanceof AndonError) return report(saved);
        setSettings(saved);
        setMessage("Settings saved.");
      })();
    },
    [token, report],
  );

  const remove = useCallback(
    (memberId: MemberId) => {
      void (async () => {
        const removed = await removeMember(token, memberId);
        if (removed instanceof AndonError) return report(removed);
        setMessage("Removed. Their Macs are signed out.");
      })();
    },
    [token, report],
  );

  return { settings, message, save, remove };
};
