import type { ReactElement } from "react";

import { isMemberId, type MemberId } from "@backend/domain/memberId.js";
import { useElementWidth } from "../hooks/useElementWidth.js";
import { useHistory } from "../hooks/useHistory.js";
import { useNow } from "../hooks/useNow.js";
import type { Route } from "../hooks/useRoute.js";
import { memberById, type TeamSnapshot } from "../domain/board.js";
import { blockStats } from "../domain/stats.js";
import { buildTimeline, type PersonTimeline } from "../domain/timeline.js";
import { resolveWindow, windowFromQuery, windowToQuery, type TimeWindow } from "../domain/timeRange.js";
import { LIVE_WINDOW_REFRESH_MS } from "../domain/web.constants.js";
import { PeoplePicker } from "../ui/PeoplePicker.js";
import { StatTiles } from "../ui/StatTiles.js";
import { TimelineChart } from "../ui/TimelineChart.js";
import { TimeRangePicker } from "../ui/TimeRangePicker.js";

type TimelinePageProps = {
  readonly token: string;
  readonly route: Route;
  readonly snapshot: TeamSnapshot;
  readonly onSignedOut: () => void;
};

/** Where people's lights have been. People and window live in the address, so a view can be shared as a link. */
export const TimelinePage = ({ token, route, snapshot, onSignedOut }: TimelinePageProps): ReactElement => {
  const now = useNow(LIVE_WINDOW_REFRESH_MS);
  const window = windowFromQuery(route.query);
  const range = resolveWindow(window, now);
  const people = selectedPeople(route.query, snapshot);
  const lightsKey = snapshot.lights
    .filter((light) => people.includes(light.memberId))
    .map((light) => `${light.memberId}:${light.colour}:${light.since}:${light.status ?? ""}`)
    .join("|");
  const { history, isLoading, problem } = useHistory(token, range, people, lightsKey, onSignedOut);
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const timelines = (history?.members ?? []).flatMap((memberHistory): PersonTimeline[] => {
    const member = memberById(snapshot.members, memberHistory.memberId);
    return member === null ? [] : [buildTimeline(member, memberHistory, range, Date.now())];
  });
  const update = (changedPeople: readonly MemberId[], changedWindow: TimeWindow): void =>
    route.replaceQuery({ people: changedPeople.join(","), ...windowToQuery(changedWindow) });
  const handlePeople = (changed: readonly MemberId[]): void => update(changed, window);
  const handleWindow = (changed: TimeWindow): void => update(people, changed);
  const canDraw = width > 0 && people.length > 0;
  return (
    <div className="p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Timeline</h1>
        <div className="flex flex-wrap gap-2">
          <PeoplePicker members={snapshot.members} selected={people} follows={snapshot.follows} onChange={handlePeople} />
          <TimeRangePicker window={window} range={range} onChange={handleWindow} />
        </div>
      </header>
      <div className="mb-6">
        <StatTiles stats={blockStats(timelines)} />
      </div>
      <div ref={ref} className="rounded-lg border border-border bg-surface-raised p-4">
        {problem !== null && <p className="text-sm text-ink-secondary">{problem}</p>}
        {people.length === 0 && <p className="py-16 text-center text-sm text-ink-muted">Pick people to see their lights over time.</p>}
        {canDraw && <TimelineChart timelines={timelines} range={range} width={width - 32} />}
        {history?.isTruncated === true && <p className="mt-2 text-xs text-ink-muted">This window has more changes than can be shown. Choose a shorter one to see them all.</p>}
        {isLoading && <p className="mt-2 text-xs text-ink-muted">Loading…</p>}
      </div>
    </div>
  );
};

/** ?people=a,b if given; otherwise the people you follow; otherwise everyone. */
const selectedPeople = (query: URLSearchParams, snapshot: TeamSnapshot): readonly MemberId[] => {
  const listed = query.get("people");
  if (listed !== null) return listed.split(",").filter(isMemberId);
  if (snapshot.follows.length > 0) return snapshot.follows;
  return snapshot.members.map((member) => member.id);
};
