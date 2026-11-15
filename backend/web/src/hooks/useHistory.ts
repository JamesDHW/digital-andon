import { useEffect, useState } from "react";

import { AndonError, UnauthorisedError } from "@backend/errors/andonError.js";
import { isMemberId, type MemberId } from "@backend/domain/memberId.js";
import type { History } from "../api/schemas.js";
import { fetchHistory } from "../api/teamApi.js";
import type { TimeRange } from "../domain/timeRange.js";

export type HistoryState = {
  readonly history: History | null;
  readonly isLoading: boolean;
  readonly problem: string | null;
};

/** Reloads whenever the window or the people change. */
export const useHistory = (token: string, range: TimeRange, memberIds: readonly MemberId[], onSignedOut: () => void): HistoryState => {
  const [state, setState] = useState<HistoryState>({ history: null, isLoading: true, problem: null });
  // Plain values, so a new array or range object with the same contents doesn't reload.
  const memberKey = memberIds.join(",");
  const { from, to } = range;

  useEffect(() => {
    const cancellation = new AbortController();
    const load = async (): Promise<void> => {
      setState((previous) => ({ ...previous, isLoading: true }));
      const history = await fetchHistory(token, { from, to }, memberKey.split(",").filter(isMemberId));
      if (cancellation.signal.aborted) return;
      if (history instanceof UnauthorisedError) return onSignedOut();
      if (history instanceof AndonError) return setState({ history: null, isLoading: false, problem: history.message });
      setState({ history, isLoading: false, problem: null });
    };
    void load();
    return () => {
      cancellation.abort();
    };
  }, [token, from, to, memberKey, onSignedOut]);

  return state;
};
