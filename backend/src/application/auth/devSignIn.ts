import { ForbiddenError, type AndonError } from "../../errors/andonError.js";
import { normaliseEmail } from "../../domain/emailAddress.js";
import type { Member } from "../../domain/member.js";
import { toEveryone, type Delivery } from "../../protocol/serverMessage.js";
import type { AuthDependencies, SignedInDevice } from "./authDependencies.js";
import { issueDevice } from "./issueDevice.js";

export type DevSignInRequest = {
  readonly email: string;
  readonly name: string;
};

export type DevSignedIn = SignedInDevice & {
  readonly deliveries: readonly Delivery[];
};

/** Local development only: signs in by email alone, creating the member (the first one as admin). */
export const devSignIn = async (dependencies: AuthDependencies, isDevelopmentMode: boolean, request: DevSignInRequest): Promise<DevSignedIn | AndonError> => {
  if (!isDevelopmentMode) return new ForbiddenError("Development sign-in is switched off.");

  const email = normaliseEmail(request.email);
  const existingMember = dependencies.members.findByEmail(email);
  if (existingMember instanceof Error) return existingMember;
  if (existingMember !== null) return withoutDeliveries(await issueDevice(dependencies, existingMember, "Development"));

  const member = createDevMember(dependencies, email, request.name);
  if (member instanceof Error) return member;

  const device = await issueDevice(dependencies, member, "Development");
  if (device instanceof Error) return device;
  return { ...device, deliveries: [toEveryone({ type: "member", member })] };
};

const withoutDeliveries = (device: SignedInDevice | AndonError): DevSignedIn | AndonError => {
  if (device instanceof Error) return device;
  return { ...device, deliveries: [] };
};

const createDevMember = (dependencies: AuthDependencies, email: string, name: string): Member | AndonError => {
  const members = dependencies.members.list();
  if (members instanceof Error) return members;

  const memberId = dependencies.secrets.createMemberId();
  if (memberId instanceof Error) return memberId;

  const member: Member = { id: memberId, name, email, avatarUrl: null, role: members.length === 0 ? "admin" : "member", joinedAt: dependencies.now() };
  const saved = dependencies.members.save(member);
  if (saved instanceof Error) return saved;
  return member;
};
