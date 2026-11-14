import { ForbiddenError } from "../../errors/andonError.js";
import { isAdmin, type Member } from "../../domain/member.js";

export const requireAdmin = (member: Member): undefined | ForbiddenError => {
  if (isAdmin(member)) return undefined;
  return new ForbiddenError("Only admins can do that.");
};
