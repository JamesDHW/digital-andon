import type { AndonError } from "../../errors/andonError.js";
import type { Member } from "../../domain/member.js";
import type { MemberId } from "../../domain/memberId.js";

export type MemberStore = {
  readonly list: () => readonly Member[] | AndonError;
  readonly find: (memberId: MemberId) => Member | null | AndonError;
  readonly findByEmail: (email: string) => Member | null | AndonError;
  readonly save: (member: Member) => undefined | AndonError;
  readonly remove: (memberId: MemberId) => undefined | AndonError;
};
