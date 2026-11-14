import { RateLimitedError, type AndonError } from "../../errors/andonError.js";
import { normaliseEmail } from "../../domain/emailAddress.js";
import type { Member } from "../../domain/member.js";
import { LOGIN_CODE_DIGITS, LOGIN_CODE_LIFETIME_MS, LOGIN_CODE_RESEND_INTERVAL_MS } from "./auth.constants.js";
import type { AuthDependencies } from "./authDependencies.js";
import { createLoginCodeEmail } from "./authEmails.js";

/** Hashes first so the resend check and the save happen without an await between them.
 * Succeeds silently for unknown addresses, so the endpoint can't be used to discover who is on the team. */
export const requestLoginCode = async (dependencies: AuthDependencies, rawEmail: string): Promise<undefined | AndonError> => {
  const email = normaliseEmail(rawEmail);
  const code = dependencies.secrets.createDigits(LOGIN_CODE_DIGITS);
  const codeHash = await dependencies.secrets.hash(code);
  const member = findOrBootstrapMember(dependencies, email);
  if (member instanceof Error) return member;
  if (member === null) return undefined;

  const isTooSoon = isResendTooSoon(dependencies, email);
  if (isTooSoon instanceof Error) return isTooSoon;
  if (isTooSoon) return new RateLimitedError();

  const at = dependencies.now();
  const saved = dependencies.credentials.saveLoginCode({
    email,
    codeHash,
    createdAt: at,
    expiresAt: at + LOGIN_CODE_LIFETIME_MS,
    attempts: 0,
  });
  if (saved instanceof Error) return saved;

  return dependencies.mailer.send(createLoginCodeEmail(email, code));
};

const isResendTooSoon = (dependencies: AuthDependencies, email: string): boolean | AndonError => {
  const previousCode = dependencies.credentials.findLoginCode(email);
  if (previousCode instanceof Error) return previousCode;
  if (previousCode === null) return false;

  return previousCode.createdAt + LOGIN_CODE_RESEND_INTERVAL_MS > dependencies.now();
};

const findOrBootstrapMember = (dependencies: AuthDependencies, email: string): Member | null | AndonError => {
  const member = dependencies.members.findByEmail(email);
  if (member !== null) return member;
  if (email !== dependencies.bootstrapAdminEmail) return null;

  return bootstrapFirstAdmin(dependencies, email);
};

/** The very first sign-in on an empty team, by the configured address, creates its admin. */
const bootstrapFirstAdmin = (dependencies: AuthDependencies, email: string): Member | null | AndonError => {
  const members = dependencies.members.list();
  if (members instanceof Error) return members;
  if (members.length > 0) return null;

  const memberId = dependencies.secrets.createMemberId();
  if (memberId instanceof Error) return memberId;

  const name = email.slice(0, email.indexOf("@"));
  const admin: Member = { id: memberId, name, email, avatarUrl: null, role: "admin", joinedAt: dependencies.now() };
  const saved = dependencies.members.save(admin);
  if (saved instanceof Error) return saved;

  return admin;
};
