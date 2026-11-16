import type { Colour } from "@backend/domain/colour.js";
import type { Member } from "@backend/domain/member.js";
import type { MemberId } from "@backend/domain/memberId.js";
import type { WireLight } from "@backend/protocol/wireLight.js";
import { BREATHING_AFTER_MS } from "./web.constants.js";

export type TeamSnapshot = {
  readonly teamName: string;
  readonly you: MemberId;
  readonly members: readonly Member[];
  readonly lights: readonly WireLight[];
  readonly follows: readonly MemberId[];
  readonly online: readonly MemberId[];
};

/** Someone shown with a person: a helper who has joined them, drawn behind their face. */
export type Companion = {
  readonly member: Member;
  readonly colour: Colour;
};

export type BoardTile = {
  readonly member: Member;
  readonly light: WireLight;
  readonly isOnline: boolean;
  readonly isBreathing: boolean;
  readonly helpers: readonly Companion[];
};

export type Board = {
  readonly blocked: readonly BoardTile[];
  readonly disrupted: readonly BoardTile[];
  readonly clear: readonly BoardTile[];
  readonly off: readonly BoardTile[];
};

/** Everyone on the team, grouped by light: reds nobody has joined first, then the longest block, then the freshest change. */
export const buildBoard = (snapshot: TeamSnapshot, now: number): Board => {
  const tiles = snapshot.members.map((member): BoardTile => {
    const light = lightOf(snapshot, member);
    const helpers = helpersOf(snapshot, member.id);
    const isBreathing = light.colour === "red" && helpers.length === 0 && now - light.since >= BREATHING_AFTER_MS;
    return { member, light, isOnline: snapshot.online.includes(member.id), isBreathing, helpers };
  });
  const longestFirst = (first: BoardTile, second: BoardTile): number => first.light.since - second.light.since;
  const newestFirst = (first: BoardTile, second: BoardTile): number => second.light.since - first.light.since;
  return {
    blocked: tiles.filter((tile) => tile.light.colour === "red").toSorted(unhelpedThenLongestFirst),
    disrupted: tiles.filter((tile) => tile.light.colour === "amber").toSorted(longestFirst),
    clear: tiles.filter((tile) => tile.light.colour === "green").toSorted(newestFirst),
    off: tiles.filter((tile) => tile.light.colour === "off").toSorted(newestFirst),
  };
};

/** Everyone who has joined this person, with their own lights. */
export const helpersOf = (snapshot: TeamSnapshot, memberId: MemberId): readonly Companion[] =>
  snapshot.lights
    .filter((light) => light.helping === memberId)
    .flatMap((light) => {
      const helper = memberById(snapshot.members, light.memberId);
      return helper === null ? [] : [{ member: helper, colour: light.colour }];
    });

export const memberById = (members: readonly Member[], memberId: MemberId): Member | null => members.find((member) => member.id === memberId) ?? null;

const lightOf = (snapshot: TeamSnapshot, member: Member): WireLight =>
  snapshot.lights.find((light) => light.memberId === member.id) ?? { memberId: member.id, colour: "green", status: null, since: member.joinedAt, helping: null };

/** Someone already being helped can wait behind someone nobody has reached yet. */
const unhelpedThenLongestFirst = (first: BoardTile, second: BoardTile): number => {
  const helpedOrder = Number(first.helpers.length > 0) - Number(second.helpers.length > 0);
  if (helpedOrder !== 0) return helpedOrder;
  return first.light.since - second.light.since;
};
