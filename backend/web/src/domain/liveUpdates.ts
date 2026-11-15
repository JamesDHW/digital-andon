import type { Light } from "@backend/domain/light.js";
import type { Member } from "@backend/domain/member.js";
import type { MemberId } from "@backend/domain/memberId.js";
import type { TeamSnapshot } from "./board.js";

/** The socket messages the web app uses: the same ones the Mac app gets. */
export type LiveMessage =
  | {
      readonly type: "hello";
      readonly you: MemberId;
      readonly members: readonly Member[];
      readonly lights: readonly Light[];
      readonly follows: readonly MemberId[];
      readonly online: readonly MemberId[];
    }
  | { readonly type: "light"; readonly light: Light }
  | { readonly type: "presence"; readonly memberId: MemberId; readonly isOnline: boolean }
  | { readonly type: "member"; readonly member: Member }
  | { readonly type: "memberRemoved"; readonly memberId: MemberId }
  | { readonly type: "follows"; readonly memberIds: readonly MemberId[] };

/** Folds one socket message into the team, the same way the Mac app does. */
export const applyLiveMessage = (snapshot: TeamSnapshot, message: LiveMessage): TeamSnapshot => {
  switch (message.type) {
    case "hello":
      return { teamName: snapshot.teamName, you: message.you, members: message.members, lights: message.lights, follows: message.follows, online: message.online };
    case "light":
      return { ...snapshot, lights: [...snapshot.lights.filter((light) => light.memberId !== message.light.memberId), message.light] };
    case "presence":
      return { ...snapshot, online: withPresence(snapshot.online, message.memberId, message.isOnline) };
    case "member":
      return { ...snapshot, members: [...snapshot.members.filter((member) => member.id !== message.member.id), message.member] };
    case "memberRemoved":
      return {
        ...snapshot,
        members: snapshot.members.filter((member) => member.id !== message.memberId),
        lights: snapshot.lights.filter((light) => light.memberId !== message.memberId),
        follows: snapshot.follows.filter((id) => id !== message.memberId),
      };
    case "follows":
      return { ...snapshot, follows: message.memberIds };
    default:
      return message satisfies never;
  }
};

const withPresence = (online: readonly MemberId[], memberId: MemberId, isOnline: boolean): readonly MemberId[] => {
  const others = online.filter((id) => id !== memberId);
  if (!isOnline) return others;
  return [...others, memberId];
};
