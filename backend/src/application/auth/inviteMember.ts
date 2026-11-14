import { EmailNotAllowedError, ForbiddenError, InvalidRequestError, type AndonError } from "../../errors/andonError.js";
import { isEmailAllowed, normaliseEmail } from "../../domain/emailAddress.js";
import { isAdmin, type Member } from "../../domain/member.js";
import { INVITE_LIFETIME_MS } from "./auth.constants.js";
import type { AuthDependencies } from "./authDependencies.js";
import { createInviteEmail } from "./authEmails.js";

export type InviteRequest = {
  readonly inviter: Member;
  readonly email: string;
  readonly name: string;
};

export type IssuedInvite = {
  readonly joinLink: string;
  readonly isEmailSent: boolean;
};

/** The link is always returned, so an admin can paste it into chat if the email doesn't arrive. */
export const inviteMember = async (dependencies: AuthDependencies, request: InviteRequest): Promise<IssuedInvite | AndonError> => {
  if (!isAdmin(request.inviter)) return new ForbiddenError("Only admins can invite people.");

  const email = normaliseEmail(request.email);
  const isInvitable = checkInvitable(dependencies, email);
  if (isInvitable instanceof Error) return isInvitable;

  const code = dependencies.secrets.createToken();
  const saved = dependencies.credentials.saveInvite({
    codeHash: await dependencies.secrets.hash(code),
    email,
    name: request.name.trim(),
    invitedBy: request.inviter.id,
    expiresAt: dependencies.now() + INVITE_LIFETIME_MS,
    usedAt: null,
  });
  if (saved instanceof Error) return saved;

  const joinLink = `${dependencies.publicOrigin}/join/?code=${encodeURIComponent(code)}`;
  const sent = await dependencies.mailer.send(createInviteEmail(email, request.inviter.name, joinLink));
  return { joinLink, isEmailSent: !(sent instanceof Error) };
};

const checkInvitable = (dependencies: AuthDependencies, email: string): true | AndonError => {
  const settings = dependencies.settings.load();
  if (settings instanceof Error) return settings;
  if (!isEmailAllowed(email, settings.allowedDomains)) return new EmailNotAllowedError();

  const existingMember = dependencies.members.findByEmail(email);
  if (existingMember instanceof Error) return existingMember;
  if (existingMember !== null) return new InvalidRequestError(`${existingMember.name} is already on the team.`);

  return true;
};
