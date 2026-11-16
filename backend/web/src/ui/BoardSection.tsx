import type { ReactElement } from "react";

import type { MemberId } from "@backend/domain/memberId.js";
import type { BoardTile } from "../domain/board.js";
import { formatDuration } from "../domain/format.js";
import { lightName } from "../domain/lightNames.js";
import { AvatarGroup } from "./AvatarGroup.js";
import { Hint } from "./Hint.js";
import { SIGNAL_COLOUR } from "./ui.constants.js";

type BoardSectionProps = {
  readonly title: string;
  /** What the light means, on hover over the title. */
  readonly description: string;
  readonly tiles: readonly BoardTile[];
  readonly now: number;
  readonly onOpen: (memberId: MemberId) => void;
};

/** One group of faces on the Team page. Hover for the name and context; click for their timeline. */
export const BoardSection = ({ title, description, tiles, now, onOpen }: BoardSectionProps): ReactElement | null => {
  if (tiles.length === 0) return null;
  const colour = tiles[0]?.light.colour ?? "off";
  return (
    <section className="mb-8">
      <Hint content={description}>
        <h2 className="mb-3 flex w-fit items-center gap-2 text-sm font-semibold tracking-wide text-ink-secondary uppercase">
          <span className={`size-2.5 rounded-full ${colour === "red" ? "hdr-red" : ""}`} style={{ background: SIGNAL_COLOUR[colour] }} />
          {title}
          <span className="font-normal text-ink-muted">{tiles.length}</span>
        </h2>
      </Hint>
      <div className="flex flex-wrap gap-4">
        {tiles.map((tile) => (
          <Tile key={tile.member.id} tile={tile} now={now} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
};

type TileProps = {
  readonly tile: BoardTile;
  readonly now: number;
  readonly onOpen: (memberId: MemberId) => void;
};

const Tile = ({ tile, now, onOpen }: TileProps): ReactElement => {
  const handleOpen = (): void => onOpen(tile.member.id);
  const isAway = !tile.isOnline || tile.light.colour === "off";
  return (
    <Hint content={<TileDetails tile={tile} now={now} />}>
      <button type="button" onClick={handleOpen} aria-label={`${tile.member.name}: ${lightName(tile.light.colour)}`} className="rounded-full">
        <AvatarGroup member={tile.member} colour={tile.light.colour} size={84} isBreathing={tile.isBreathing} isFaded={isAway} helpers={tile.helpers} />
      </button>
    </Hint>
  );
};

type TileDetailsProps = {
  readonly tile: BoardTile;
  readonly now: number;
};

const TileDetails = ({ tile, now }: TileDetailsProps): ReactElement => (
  <span className="block">
    <span className="block font-medium">{tile.member.name}</span>
    <span className="block text-ink-secondary">
      {lightName(tile.light.colour)} for {formatDuration(now - tile.light.since)}
      {tile.isOnline ? "" : " · offline"}
    </span>
    {tile.light.status !== null && <span className="mt-1 block text-ink">{tile.light.status}</span>}
    {tile.helpers.length > 0 && <span className="mt-1 block text-ink-secondary">Joined by {tile.helpers.map((helper) => helper.member.name).join(", ")}</span>}
  </span>
);
