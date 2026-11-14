import type { MemberId } from "./memberId.js";

export type MemberRole = "member" | "admin";

export type Member = {
  readonly id: MemberId;
  readonly name: string;
  readonly email: string;
  readonly avatarUrl: string | null;
  readonly role: MemberRole;
  readonly joinedAt: number;
};

export const isAdmin = (member: Member): boolean => member.role === "admin";
