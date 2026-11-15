import { useEffect, useState } from "react";

import { AndonError, UnauthorisedError } from "@backend/errors/andonError.js";
import { fetchSnapshot } from "../api/teamApi.js";
import type { TeamSnapshot } from "../domain/board.js";
import { SNAPSHOT_POLL_MS } from "../domain/web.constants.js";

export type SnapshotState = {
  readonly snapshot: TeamSnapshot | null;
  readonly problem: string | null;
};

/** Everyone's lights, refreshed every few seconds, so the Team page works as a live board. */
export const useSnapshot = (token: string, onSignedOut: () => void): SnapshotState => {
  const [state, setState] = useState<SnapshotState>({ snapshot: null, problem: null });

  useEffect(() => {
    const cancellation = new AbortController();
    const load = async (): Promise<void> => {
      const snapshot = await fetchSnapshot(token);
      if (cancellation.signal.aborted) return;
      if (snapshot instanceof UnauthorisedError) return onSignedOut();
      if (snapshot instanceof AndonError) return setState((previous) => ({ snapshot: previous.snapshot, problem: snapshot.message }));
      setState({ snapshot, problem: null });
    };
    void load();
    const timer = window.setInterval(() => void load(), SNAPSHOT_POLL_MS);
    return () => {
      cancellation.abort();
      window.clearInterval(timer);
    };
  }, [token, onSignedOut]);

  return state;
};
