import type { AndonErrorCode } from "../errors/andonError.js";
import type { Member } from "../domain/member.js";
import type { MemberId } from "../domain/memberId.js";
import type { WireLight } from "./wireLight.js";

export type ServerMessage =
  | {
      readonly type: "hello";
      readonly you: MemberId;
      readonly members: readonly Member[];
      readonly lights: readonly WireLight[];
      readonly follows: readonly MemberId[];
      readonly online: readonly MemberId[];
      readonly serverTime: number;
    }
  | { readonly type: "light"; readonly light: WireLight }
  | { readonly type: "presence"; readonly memberId: MemberId; readonly isOnline: boolean }
  | { readonly type: "member"; readonly member: Member }
  | { readonly type: "memberRemoved"; readonly memberId: MemberId }
  | { readonly type: "follows"; readonly memberIds: readonly MemberId[] }
  | { readonly type: "error"; readonly code: AndonErrorCode; readonly message: string };

export type Audience = { readonly kind: "everyone" } | { readonly kind: "member"; readonly memberId: MemberId };

/** A message the runtime must send to every open socket in its audience. */
export type Delivery = {
  readonly audience: Audience;
  readonly message: ServerMessage;
};

export const toEveryone = (message: ServerMessage): Delivery => ({ audience: { kind: "everyone" }, message });

export const toMember = (memberId: MemberId, message: ServerMessage): Delivery => ({
  audience: { kind: "member", memberId },
  message,
});
