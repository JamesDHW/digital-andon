import { EmailNotAllowedError, InvalidCodeError, NotFoundError, type AndonError } from "../../errors/andonError.js";
import { canJoinWithoutInvite, normaliseEmail } from "../../domain/emailAddress.js";
import { MEMBER_NAME_MAX_LENGTH } from "../../domain/member.constants.js";
import type { Member, MemberRole } from "../../domain/member.js";
import { toEveryone, type Delivery } from "../../protocol/serverMessage.js";
import type { SignInAttempt, SignInClient } from "../ports/credentialStore.js";
import type { GoogleIdentity, GoogleProfile } from "../ports/googleIdentity.js";
import { GOOGLE_CALLBACK_PATH, SIGN_IN_ATTEMPT_LIFETIME_MS } from "./auth.constants.js";
import type { AuthDependencies, SignedInDevice } from "./authDependencies.js";
import { issueDevice } from "./issueDevice.js";

export type GoogleSignInStart = {
  readonly client: SignInClient;
  readonly deviceName: string;
};

export type GoogleSignedIn = SignedInDevice & {
  readonly deliveries: readonly Delivery[];
};

type JoinedMember = {
  readonly member: Member;
  readonly deliveries: readonly Delivery[];
};

/** Returns the Google URL to send the browser to. The state and PKCE verifier stay here, never in the browser. */
export const startGoogleSignIn = async (dependencies: AuthDependencies, start: GoogleSignInStart): Promise<string | AndonError> => {
  const google = requireGoogle(dependencies);
  if (google instanceof Error) return google;

  const state = dependencies.secrets.createToken();
  const codeVerifier = dependencies.secrets.createToken();
  const stateHash = await dependencies.secrets.hash(state);
  const settings = dependencies.settings.load();
  if (settings instanceof Error) return settings;

  const at = dependencies.now();
  const cleared = dependencies.credentials.removeExpiredSignInAttempts(at);
  if (cleared instanceof Error) return cleared;

  const saved = dependencies.credentials.saveSignInAttempt({
    stateHash,
    codeVerifier,
    client: start.client,
    deviceName: start.deviceName,
    expiresAt: at + SIGN_IN_ATTEMPT_LIFETIME_MS,
  });
  if (saved instanceof Error) return saved;

  return google.authorisationUrl({ state, codeVerifier, redirectUri: googleRedirectUri(dependencies), domainHint: onlyDomain(settings.allowedDomains) });
};

/** The attempt Google's redirect belongs to. Each works once, within ten minutes. */
export const takeSignInAttempt = async (dependencies: AuthDependencies, state: string): Promise<SignInAttempt | AndonError> => {
  const attempt = dependencies.credentials.takeSignInAttempt(await dependencies.secrets.hash(state));
  if (attempt instanceof Error) return attempt;
  const isLive = attempt !== null && attempt.expiresAt >= dependencies.now();
  if (!isLive) return new InvalidCodeError();

  return attempt;
};

/** Signs in an existing member, or lets someone on an allowed domain join on their own, with their Google photo. */
export const completeGoogleSignIn = async (dependencies: AuthDependencies, attempt: SignInAttempt, code: string): Promise<GoogleSignedIn | AndonError> => {
  const google = requireGoogle(dependencies);
  if (google instanceof Error) return google;

  const profile = await google.exchangeCode({ code, codeVerifier: attempt.codeVerifier, redirectUri: googleRedirectUri(dependencies) });
  if (profile instanceof Error) return profile;
  if (!profile.isEmailVerified) return new EmailNotAllowedError();

  const joined = findOrJoin(dependencies, profile);
  if (joined instanceof Error) return joined;

  const device = await issueDevice(dependencies, joined.member, attempt.deviceName);
  if (device instanceof Error) return device;

  return { ...device, deliveries: joined.deliveries };
};

const requireGoogle = (dependencies: AuthDependencies): GoogleIdentity | AndonError => {
  if (dependencies.google === null) return new NotFoundError("Google sign-in isn't set up on this server.");
  return dependencies.google;
};

const googleRedirectUri = (dependencies: AuthDependencies): string => `${dependencies.publicOrigin}${GOOGLE_CALLBACK_PATH}`;

const onlyDomain = (allowedDomains: readonly string[]): string | null => {
  if (allowedDomains.length !== 1) return null;
  return allowedDomains[0] ?? null;
};

const findOrJoin = (dependencies: AuthDependencies, profile: GoogleProfile): JoinedMember | AndonError => {
  const email = normaliseEmail(profile.email);
  const existingMember = dependencies.members.findByEmail(email);
  if (existingMember instanceof Error) return existingMember;
  if (existingMember !== null) return withGooglePhoto(dependencies, existingMember, profile.pictureUrl);

  const role = newcomerRole(dependencies, email);
  if (role instanceof Error) return role;

  const memberId = dependencies.secrets.createMemberId();
  if (memberId instanceof Error) return memberId;

  const member: Member = {
    id: memberId,
    name: displayName(profile, email),
    email,
    avatarUrl: profile.pictureUrl,
    role,
    joinedAt: dependencies.now(),
  };
  const saved = dependencies.members.save(member);
  if (saved instanceof Error) return saved;

  return { member, deliveries: [toEveryone({ type: "member", member })] };
};

/** The configured bootstrap address joins as admin; anyone else needs an allowed domain. */
const newcomerRole = (dependencies: AuthDependencies, email: string): MemberRole | AndonError => {
  if (email === dependencies.bootstrapAdminEmail) return "admin";

  const settings = dependencies.settings.load();
  if (settings instanceof Error) return settings;
  if (!canJoinWithoutInvite(email, settings.allowedDomains)) return new EmailNotAllowedError();

  return "member";
};

/** Someone who never added a photo gets their Google one; a photo they chose is never replaced. */
const withGooglePhoto = (dependencies: AuthDependencies, member: Member, pictureUrl: string | null): JoinedMember | AndonError => {
  const keepsCurrentPhoto = member.avatarUrl !== null || pictureUrl === null;
  if (keepsCurrentPhoto) return { member, deliveries: [] };

  const updatedMember: Member = { ...member, avatarUrl: pictureUrl };
  const saved = dependencies.members.save(updatedMember);
  if (saved instanceof Error) return saved;

  return { member: updatedMember, deliveries: [toEveryone({ type: "member", member: updatedMember })] };
};

const displayName = (profile: GoogleProfile, email: string): string => {
  const googleName = profile.name?.trim() ?? "";
  const name = googleName.length > 0 ? googleName : email.slice(0, email.indexOf("@"));
  return name.slice(0, MEMBER_NAME_MAX_LENGTH);
};
