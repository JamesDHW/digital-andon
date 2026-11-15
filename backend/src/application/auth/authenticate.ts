import { UnauthorisedError, type AndonError } from "../../errors/andonError.js";
import type { Member } from "../../domain/member.js";
import type { AuthDependencies } from "./authDependencies.js";

export const authenticateDevice = async (dependencies: AuthDependencies, deviceToken: string): Promise<Member | AndonError> => {
  const device = dependencies.credentials.findDevice(await dependencies.secrets.hash(deviceToken));
  if (device instanceof Error) return device;
  if (device === null) return new UnauthorisedError();

  const member = dependencies.members.find(device.memberId);
  if (member instanceof Error) return member;
  if (member === null) return new UnauthorisedError();

  const touched = dependencies.credentials.saveDevice({ ...device, lastSeenAt: dependencies.now() });
  if (touched instanceof Error) return touched;

  return member;
};
