import { useEffect, useRef, useState } from "react";

import { AndonError, UnauthorisedError } from "@backend/errors/andonError.js";
import { isMemberId, type MemberId } from "@backend/domain/memberId.js";
import type { WireLight } from "@backend/protocol/wireLight.js";
import type { History } from "../api/schemas.js";
import { fetchHistory } from "../api/teamApi.js";
import { foldLiveLights } from "../domain/liveHistory.js";
import { resolveWindow, windowFromQuery, windowToQuery, type TimeWindow } from "../domain/timeRange.js";

export type HistoryState = {
  readonly history: History | null;
  readonly isLoading: boolean;
  readonly problem: string | null;
};

/** Loads a window once, then follows live: lights from the socket are folded in instead of asking the server again,
 * and a sliding window slides over what's already loaded. It reloads only when the window or the people change, or
 * the socket reconnects, since changes during a gap aren't replayed. Nothing loads while the socket is down
 * (`liveSince` is null). */
export const useHistory = (
  token: string,
  window: TimeWindow,
  memberIds: readonly MemberId[],
  lights: readonly WireLight[],
  liveSince: number | null,
  onSignedOut: () => void,
): HistoryState => {
  const [state, setState] = useState<HistoryState>({ history: null, isLoading: true, problem: null });
  const latestLights = useRef(lights);
  // Plain values, so a new array or window object with the same contents doesn't reload.
  const memberKey = memberIds.join(",");
  const windowKey = new URLSearchParams(windowToQuery(window)).toString();

  useEffect(() => {
    latestLights.current = lights;
    setState((previous) => (previous.history === null ? previous : { ...previous, history: foldLiveLights(previous.history, lights, Date.now()) }));
  }, [lights]);

  useEffect(() => {
    if (liveSince === null) return undefined;
    const cancellation = new AbortController();
    const load = async (): Promise<void> => {
      setState((previous) => ({ ...previous, isLoading: previous.history === null }));
      const range = resolveWindow(windowFromQuery(new URLSearchParams(windowKey)), Date.now());
      const history = await fetchHistory(token, range, memberKey.split(",").filter(isMemberId));
      if (cancellation.signal.aborted) return;
      if (history instanceof UnauthorisedError) return onSignedOut();
      if (history instanceof AndonError) return setState({ history: null, isLoading: false, problem: history.message });
      // Folded straight away: a light that changed while the request was out isn't in the answer.
      setState({ history: foldLiveLights(history, latestLights.current, Date.now()), isLoading: false, problem: null });
    };
    void load();
    return () => {
      cancellation.abort();
    };
  }, [token, windowKey, memberKey, liveSince, onSignedOut]);

  return state;
};
