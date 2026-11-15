import type { ReactElement } from "react";

import { formatDuration } from "../domain/format.js";
import type { BlockStats } from "../domain/stats.js";

type StatTilesProps = {
  readonly stats: BlockStats;
};

/** The blocks in the chart below, as numbers: how many, how long they lasted, and how many waited over ten minutes. */
export const StatTiles = ({ stats }: StatTilesProps): ReactElement => (
  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
    <Tile label="Times blocked" value={String(stats.blocks)} />
    <Tile label="Median time blocked" value={stats.medianMs === null ? "–" : formatDuration(stats.medianMs)} />
    <Tile label="Longest block" value={stats.longestMs === null ? "–" : formatDuration(stats.longestMs)} />
    <Tile label="Waited over 10 min" value={stats.blocks === 0 ? "–" : `${stats.waitedLong} of ${stats.blocks}`} />
  </div>
);

type TileProps = {
  readonly label: string;
  readonly value: string;
};

const Tile = ({ label, value }: TileProps) => (
  <div className="rounded-lg border border-border bg-surface-raised px-4 py-3">
    <p className="text-xs text-ink-muted">{label}</p>
    <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
  </div>
);
