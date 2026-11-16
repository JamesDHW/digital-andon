import type { ReactElement } from "react";

import { formatDuration } from "../domain/format.js";
import type { BlockStats } from "../domain/stats.js";

type StatTilesProps = {
  readonly stats: BlockStats;
};

/** The blocks in the chart below, as numbers: how many, how long, how much of it nobody was there, and how fast help came. */
export const StatTiles = ({ stats }: StatTilesProps): ReactElement => (
  <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
    <Tile label="Times blocked" value={String(stats.blocks)} />
    <Tile label="Time blocked" value={stats.blocks === 0 ? "–" : formatDuration(stats.blockedMs)} />
    <Tile label="Time waiting alone" value={stats.blocks === 0 ? "–" : formatDuration(stats.aloneMs)} />
    <Tile label="Median wait for help" value={stats.medianWaitMs === null ? "–" : formatDuration(stats.medianWaitMs)} />
    <Tile label="Waited alone over 10 min" value={stats.blocks === 0 ? "–" : `${stats.waitedLong} of ${stats.blocks}`} />
  </div>
);

type TileProps = {
  readonly label: string;
  readonly value: string;
};

const Tile = ({ label, value }: TileProps): ReactElement => (
  <div className="rounded-lg border border-border bg-surface-raised px-4 py-3">
    <p className="text-xs text-ink-muted">{label}</p>
    <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
  </div>
);
