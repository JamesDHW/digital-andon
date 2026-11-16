import type { ReactElement } from "react";

import { formatDuration } from "../domain/format.js";
import type { SwitchingSummary } from "../domain/switching.js";

type SwitchingTilesProps = {
  readonly summary: SwitchingSummary;
};

/** How much of the window went on other people's problems, and how often they switched. */
export const SwitchingTiles = ({ summary }: SwitchingTilesProps): ReactElement => (
  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
    <Tile label="People joined" value={String(summary.people)} />
    <Tile label="Times joined someone" value={String(summary.switches)} />
    <Tile label="Time with others" value={formatDuration(summary.withOthersMs)} />
    <Tile label="Time on own work" value={formatDuration(summary.ownWorkMs)} />
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
