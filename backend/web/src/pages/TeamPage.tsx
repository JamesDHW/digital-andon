import type { ReactElement } from "react";

import type { MemberId } from "@backend/domain/memberId.js";
import { buildBoard, type TeamSnapshot } from "../domain/board.js";
import { BoardSection } from "../ui/BoardSection.js";

type TeamPageProps = {
  readonly snapshot: TeamSnapshot;
  readonly now: number;
  readonly navigate: (href: string) => void;
};

/** The control centre: everyone's light at once, whoever is blocked first. */
export const TeamPage = ({ snapshot, now, navigate }: TeamPageProps): ReactElement => {
  const board = buildBoard(snapshot, now);
  const open = (memberId: MemberId): void => navigate(`/timeline?people=${encodeURIComponent(memberId)}`);
  const isEveryoneClear = board.blocked.length === 0 && board.assisting.length === 0;
  return (
    <div className="p-8">
      <header className="mb-8 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="text-sm text-ink-muted">
          {isEveryoneClear ? "Nobody is blocked" : `${board.blocked.length} blocked · ${board.assisting.length} asking for help`} · live
        </p>
      </header>
      <BoardSection title="Blocked" tiles={board.blocked} now={now} onOpen={open} />
      <BoardSection title="Assist" tiles={board.assisting} now={now} onOpen={open} />
      <BoardSection title="Clear" tiles={board.clear} now={now} onOpen={open} />
      <BoardSection title="Off" tiles={board.off} now={now} onOpen={open} />
    </div>
  );
};
