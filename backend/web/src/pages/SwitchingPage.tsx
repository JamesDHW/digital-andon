import type { ReactElement } from "react";

import { isMemberId, type MemberId } from "@backend/domain/memberId.js";
import { useElementWidth } from "../hooks/useElementWidth.js";
import { useHistory } from "../hooks/useHistory.js";
import { useNow } from "../hooks/useNow.js";
import type { Route } from "../hooks/useRoute.js";
import { memberById, type TeamSnapshot } from "../domain/board.js";
import { joinedInWindow, switchingView } from "../domain/switching.js";
import { resolveWindow, windowFromQuery, windowToQuery, type TimeWindow } from "../domain/timeRange.js";
import { LIVE_WINDOW_REFRESH_MS } from "../domain/web.constants.js";
import { PersonSelect } from "../ui/PersonSelect.js";
import { SwitchingChart } from "../ui/SwitchingChart.js";
import { SwitchingTiles } from "../ui/SwitchingTiles.js";
import { TimeRangePicker } from "../ui/TimeRangePicker.js";

type SwitchingPageProps = {
  readonly token: string;
  readonly route: Route;
  readonly snapshot: TeamSnapshot;
  readonly liveSince: number | null;
  readonly onSignedOut: () => void;
};

/** One person's context switching: who they joined, when, and what each of those people was working on. */
export const SwitchingPage = ({ token, route, snapshot, liveSince, onSignedOut }: SwitchingPageProps): ReactElement => {
  const now = useNow(LIVE_WINDOW_REFRESH_MS);
  const window = windowFromQuery(route.query);
  const range = resolveWindow(window, now);
  const personId = selectedPerson(route.query, snapshot);
  const person = memberById(snapshot.members, personId);
  const own = useHistory(token, window, [personId], snapshot.lights, liveSince, onSignedOut);
  const ownHistory = own.history?.members.find((history) => history.memberId === personId) ?? null;
  const joinedIds = joinedInWindow(person, ownHistory, range, now);
  const others = useHistory(token, window, joinedIds, snapshot.lights, liveSince, onSignedOut);
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const view = ownHistory === null ? null : switchingView(person, ownHistory, others.history?.members ?? [], snapshot.members, range, Date.now());

  const update = (changedPerson: MemberId, changedWindow: TimeWindow): void => route.replaceQuery({ person: changedPerson, ...windowToQuery(changedWindow) });
  const handlePerson = (changed: MemberId): void => update(changed, window);
  const handleWindow = (changed: TimeWindow): void => update(personId, changed);
  const problem = own.problem ?? others.problem;
  return (
    <div className="p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Context switching</h1>
        <div className="flex flex-wrap gap-2">
          <PersonSelect members={snapshot.members} selected={personId} onChange={handlePerson} />
          <TimeRangePicker window={window} range={range} onChange={handleWindow} />
        </div>
      </header>
      {view !== null && (
        <div className="mb-6">
          <SwitchingTiles summary={view.summary} />
        </div>
      )}
      <div ref={ref} className="rounded-lg border border-border bg-surface-raised p-4">
        {problem !== null && <p className="text-sm text-ink-secondary">{problem}</p>}
        {view !== null && <SwitchingChart person={view.person} joined={view.joined} spans={view.spans} range={range} width={Math.max(width - 32, 0)} />}
        {view?.joined.length === 0 && <p className="mt-3 text-sm text-ink-muted">They didn't join anyone in this window.</p>}
        {own.isLoading && <p className="mt-2 text-xs text-ink-muted">Loading…</p>}
      </div>
    </div>
  );
};

/** ?person=… if given; otherwise you. */
const selectedPerson = (query: URLSearchParams, snapshot: TeamSnapshot): MemberId => {
  const listed = query.get("person") ?? "";
  return isMemberId(listed) ? listed : snapshot.you;
};
