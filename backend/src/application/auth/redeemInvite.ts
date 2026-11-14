import { InvalidCodeError, type AndonError } from "../../errors/andonError.js";
import type { Member } from "../../domain/member.js";
import { toEveryone, type Delivery } from "../../protocol/serverMessage.js";
import type { Invite } from "../ports/credentialStore.js";
import { announceFollowing } from "../followCommands.js";
import type { AuthDependencies, SignedInDevice } from "./authDependencies.js";
import { issueDevice } from "./issueDevice.js";

export type RedeemRequest = {
  readonly code: string;
  readonly deviceName: string;
};

export type RedeemedInvite = SignedInDevice & {
  readonly deliveries: readonly Delivery[];
};

/** Joining creates the member, and whoever invited them starts following them. */
export const redeemInvite = async (dependencies: AuthDependencies, request: RedeemRequest): Promise<RedeemedInvite | AndonError> => {
  const invite = await findUsableInvite(dependencies, request.code);
  if (invite instanceof Error) return invite;

  const member = createMemberFromInvite(dependencies, invite);
  if (member instanceof Error) return member;

  const usedInvite = dependencies.credentials.saveInvite({ ...invite, usedAt: dependencies.now() });
  if (usedInvite instanceof Error) return usedInvite;

  const followed = dependencies.follows.follow(invite.invitedBy, member.id, dependencies.now());
  if (followed instanceof Error) return followed;

  const inviterFollowing = announceFollowing(dependencies, invite.invitedBy);
  if (inviterFollowing instanceof Error) return inviterFollowing;

  const device = await issueDevice(dependencies, member, request.deviceName);
  if (device instanceof Error) return device;

  return { ...device, deliveries: [toEveryone({ type: "member", member }), ...inviterFollowing] };
};

const findUsableInvite = async (dependencies: AuthDependencies, code: string): Promise<Invite | AndonError> => {
  const invite = dependencies.credentials.findInvite(await dependencies.secrets.hash(code));
  if (invite instanceof Error) return invite;
  const isUsable = invite !== null && invite.usedAt === null && invite.expiresAt >= dependencies.now();
  if (!isUsable) return new InvalidCodeError();

  return invite;
};

const createMemberFromInvite = (dependencies: AuthDependencies, invite: Invite): Member | AndonError => {
  const memberId = dependencies.secrets.createMemberId();
  if (memberId instanceof Error) return memberId;

  const member: Member = { id: memberId, name: invite.name, email: invite.email, avatarUrl: null, role: "member", joinedAt: dependencies.now() };
  const saved = dependencies.members.save(member);
  if (saved instanceof Error) return saved;

  return member;
};
