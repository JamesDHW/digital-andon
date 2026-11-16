import { InvalidRequestError, NotFoundError, type AndonError } from "../../errors/andonError.js";
import type { Member } from "../../domain/member.js";
import type { MemberId } from "../../domain/memberId.js";
import { toEveryone, toMember, type Delivery } from "../../protocol/serverMessage.js";
import type { AuthDependencies } from "../auth/authDependencies.js";
import { endJoinsOf } from "../joins/joinCommands.js";
import { requireAdmin } from "./requireAdmin.js";

/** Removing someone signs out all their Macs and drops their light and follows; anyone with them goes back to their own light. */
export const removeMember = (dependencies: AuthDependencies, admin: Member, memberId: MemberId): readonly Delivery[] | AndonError => {
  const forbidden = requireAdmin(admin);
  if (forbidden !== undefined) return forbidden;
  if (admin.id === memberId) return new InvalidRequestError("You can't remove yourself.");

  const member = dependencies.members.find(memberId);
  if (member instanceof Error) return member;
  if (member === null) return new NotFoundError("That person isn't on this team.");

  const joinsEnded = endJoinsOf(dependencies, memberId);
  if (joinsEnded instanceof Error) return joinsEnded;

  const devicesRemoved = dependencies.credentials.removeDevicesOf(memberId);
  if (devicesRemoved instanceof Error) return devicesRemoved;

  const removed = dependencies.members.remove(memberId);
  if (removed instanceof Error) return removed;

  return [
    ...joinsEnded.deliveries,
    toMember(memberId, { type: "error", code: "unauthorised", message: "You were removed from the team." }),
    toEveryone({ type: "memberRemoved", memberId }),
  ];
};
