import type { AndonError } from "../../errors/andonError.js";
import type { MemberId } from "../../domain/memberId.js";

export type Device = {
  readonly tokenHash: string;
  readonly memberId: MemberId;
  readonly name: string;
  readonly createdAt: number;
  readonly lastSeenAt: number;
};

export type Invite = {
  readonly codeHash: string;
  readonly email: string;
  readonly name: string;
  readonly invitedBy: MemberId;
  readonly expiresAt: number;
  readonly usedAt: number | null;
};

export type LoginCode = {
  readonly email: string;
  readonly codeHash: string;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly attempts: number;
};

export type CredentialStore = {
  readonly saveDevice: (device: Device) => undefined | AndonError;
  readonly findDevice: (tokenHash: string) => Device | null | AndonError;
  readonly removeDevicesOf: (memberId: MemberId) => undefined | AndonError;
  readonly saveInvite: (invite: Invite) => undefined | AndonError;
  readonly findInvite: (codeHash: string) => Invite | null | AndonError;
  readonly saveLoginCode: (loginCode: LoginCode) => undefined | AndonError;
  readonly findLoginCode: (email: string) => LoginCode | null | AndonError;
  readonly removeLoginCode: (email: string) => undefined | AndonError;
};
