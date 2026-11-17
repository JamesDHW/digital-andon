import { useEffect, useState } from "react";

import { AndonError, UnauthorisedError } from "@backend/errors/andonError.js";
import { openLiveSocket, readLiveMessage } from "../api/liveSocket.js";
import { fetchSnapshot } from "../api/teamApi.js";
import type { TeamSnapshot } from "../domain/board.js";
import { applyLiveMessage } from "../domain/liveUpdates.js";
import { SOCKET_PING_MS, SOCKET_RETRY_MS } from "../domain/web.constants.js";

export type SnapshotState = {
  readonly snapshot: TeamSnapshot | null;
  readonly problem: string | null;
  /** When the socket last connected, so changes arrive the moment they happen; null while it's down. Changes during a
   * gap aren't replayed, so anything built from them should reload when this changes. */
  readonly liveSince: number | null;
};

/** Loads the team, then keeps it live over a socket. If the socket drops, it reloads and reconnects. */
export const useSnapshot = (token: string, onSignedOut: () => void): SnapshotState => {
  const [state, setState] = useState<SnapshotState>({ snapshot: null, problem: null, liveSince: null });

  useEffect(() => {
    const cancellation = new AbortController();
    // A function, so each check reads the signal afresh after an await.
    const isCancelled = (): boolean => cancellation.signal.aborted;
    const retryLater = (): void => {
      setState((previous) => ({ ...previous, liveSince: null }));
      window.setTimeout(() => void connect(), SOCKET_RETRY_MS);
    };
    const listen = (): void => {
      const socket = openLiveSocket(token);
      const pinger = window.setInterval(() => socket.send("ping"), SOCKET_PING_MS);
      cancellation.signal.addEventListener("abort", () => socket.close());
      socket.addEventListener("open", () => setState((previous) => ({ ...previous, liveSince: Date.now(), problem: null })));
      socket.addEventListener("message", (event: MessageEvent<unknown>) => {
        const message = readLiveMessage(event.data);
        if (message === null) return;
        setState((previous) => ({ ...previous, snapshot: previous.snapshot === null ? null : applyLiveMessage(previous.snapshot, message) }));
      });
      socket.addEventListener("close", () => {
        window.clearInterval(pinger);
        if (isCancelled()) return;
        retryLater();
      });
    };
    const connect = async (): Promise<void> => {
      if (isCancelled()) return;
      const snapshot = await fetchSnapshot(token);
      if (isCancelled()) return;
      if (snapshot instanceof UnauthorisedError) return onSignedOut();
      if (snapshot instanceof AndonError) {
        setState((previous) => ({ ...previous, problem: snapshot.message }));
        return retryLater();
      }
      setState((previous) => ({ ...previous, snapshot }));
      listen();
    };
    void connect();
    return () => cancellation.abort();
  }, [token, onSignedOut]);

  return state;
};
