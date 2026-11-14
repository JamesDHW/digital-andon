import type { AndonError } from "../../errors/andonError.js";
import type { Member } from "../../domain/member.js";
import { toEveryone, type Delivery } from "../../protocol/serverMessage.js";
import type { TeamDependencies } from "../teamDependencies.js";

export type ProfileChange = {
  readonly name?: string | undefined;
  readonly avatarUrl?: string | null | undefined;
};

export type UpdatedProfile = {
  readonly member: Member;
  readonly deliveries: readonly Delivery[];
};

export const updateProfile = (dependencies: TeamDependencies, member: Member, change: ProfileChange): UpdatedProfile | AndonError => {
  const updatedMember: Member = {
    ...member,
    name: change.name?.trim() ?? member.name,
    avatarUrl: change.avatarUrl === undefined ? member.avatarUrl : change.avatarUrl,
  };
  const saved = dependencies.members.save(updatedMember);
  if (saved instanceof Error) return saved;

  return { member: updatedMember, deliveries: [toEveryone({ type: "member", member: updatedMember })] };
};
