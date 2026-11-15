import type { AndonError } from "../../errors/andonError.js";
import type { Member } from "../../domain/member.js";
import { toEveryone, type Delivery } from "../../protocol/serverMessage.js";
import type { TeamDependencies } from "../teamDependencies.js";

/** Only the name can be changed: photos always come from Google. */
export type ProfileChange = {
  readonly name: string;
};

export type UpdatedProfile = {
  readonly member: Member;
  readonly deliveries: readonly Delivery[];
};

export const updateProfile = (dependencies: TeamDependencies, member: Member, change: ProfileChange): UpdatedProfile | AndonError => {
  const updatedMember: Member = {
    ...member,
    name: change.name.trim(),
  };
  const saved = dependencies.members.save(updatedMember);
  if (saved instanceof Error) return saved;

  return { member: updatedMember, deliveries: [toEveryone({ type: "member", member: updatedMember })] };
};
