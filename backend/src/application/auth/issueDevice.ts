import type { AndonError } from "../../errors/andonError.js";
import type { Member } from "../../domain/member.js";
import type { AuthDependencies, SignedInDevice } from "./authDependencies.js";

/** A new long-lived device token; only its hash is stored. */
export const issueDevice = async (dependencies: AuthDependencies, member: Member, deviceName: string): Promise<SignedInDevice | AndonError> => {
  const deviceToken = dependencies.secrets.createToken();
  const at = dependencies.now();
  const saved = dependencies.credentials.saveDevice({
    tokenHash: await dependencies.secrets.hash(deviceToken),
    memberId: member.id,
    name: deviceName,
    createdAt: at,
    lastSeenAt: at,
  });
  if (saved instanceof Error) return saved;

  return { deviceToken, memberId: member.id };
};
