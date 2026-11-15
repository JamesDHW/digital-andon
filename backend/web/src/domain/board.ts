import type { Light } from "@backend/domain/light.js";
import type { Member } from "@backend/domain/member.js";
import type { MemberId } from "@backend/domain/memberId.js";
import { BREATHING_AFTER_MS } from "./web.constants.js";

export type TeamSnapshot = {
  readonly teamName: string;
  readonly you: MemberId;
  readonly members: readonly Member[];
  readonly lights: readonly Light[];
  readonly follows: readonly MemberId[];
  readonly online: readonly MemberId[];
};

export type BoardTile = {
  readonly member: Member;
  readonly light: Light;
  readonly isOnline: boolean;
  readonly isBreathing: boolean;
};

export type Board = {
  readonly blocked: readonly BoardTile[];
  readonly assisting: readonly BoardTile[];
  readonly clear: readonly BoardTile[];
  readonly off: readonly BoardTile[];
};

/** Everyone on the team, grouped by light: the longest block first, then the freshest change first. */
export const buildBoard = (snapshot: TeamSnapshot, now: number): Board => {
  const lights = new Map(snapshot.lights.map((light) => [light.memberId, light]));
  const tiles = snapshot.members.map((member): BoardTile => {
    const light = lights.get(member.id) ?? { memberId: member.id, colour: "green", status: null, since: member.joinedAt };
    const isBreathing = light.colour === "red" && now - light.since >= BREATHING_AFTER_MS;
    return { member, light, isOnline: snapshot.online.includes(member.id), isBreathing };
  });
  const longestFirst = (first: BoardTile, second: BoardTile): number => first.light.since - second.light.since;
  const newestFirst = (first: BoardTile, second: BoardTile): number => second.light.since - first.light.since;
  return {
    blocked: tiles.filter((tile) => tile.light.colour === "red").toSorted(longestFirst),
    assisting: tiles.filter((tile) => tile.light.colour === "amber").toSorted(longestFirst),
    clear: tiles.filter((tile) => tile.light.colour === "green").toSorted(newestFirst),
    off: tiles.filter((tile) => tile.light.colour === "off").toSorted(newestFirst),
  };
};

export const memberById = (members: readonly Member[], memberId: MemberId): Member | null => members.find((member) => member.id === memberId) ?? null;
