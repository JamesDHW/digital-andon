import { InvalidCodeError, RateLimitedError, type AndonError } from "../../errors/andonError.js";
import { normaliseEmail } from "../../domain/emailAddress.js";
import type { LoginCode } from "../ports/credentialStore.js";
import { LOGIN_CODE_MAX_ATTEMPTS } from "./auth.constants.js";
import type { AuthDependencies, SignedInDevice } from "./authDependencies.js";
import { issueDevice } from "./issueDevice.js";

export type VerifyRequest = {
  readonly email: string;
  readonly code: string;
  readonly deviceName: string;
};

/** Hashes before reading, so the read, the attempt count and its write happen without an await between them. */
export const verifyLoginCode = async (dependencies: AuthDependencies, request: VerifyRequest): Promise<SignedInDevice | AndonError> => {
  const email = normaliseEmail(request.email);
  const submittedCodeHash = await dependencies.secrets.hash(request.code.trim());
  const loginCode = findLiveLoginCode(dependencies, email);
  if (loginCode instanceof Error) return loginCode;

  const isMatch = loginCode.codeHash === submittedCodeHash;
  if (!isMatch) return recordFailedAttempt(dependencies, loginCode);

  const removed = dependencies.credentials.removeLoginCode(email);
  if (removed instanceof Error) return removed;

  const member = dependencies.members.findByEmail(email);
  if (member instanceof Error) return member;
  if (member === null) return new InvalidCodeError();

  return issueDevice(dependencies, member, request.deviceName);
};

const findLiveLoginCode = (dependencies: AuthDependencies, email: string): LoginCode | AndonError => {
  const loginCode = dependencies.credentials.findLoginCode(email);
  if (loginCode instanceof Error) return loginCode;
  const isUnexpired = loginCode !== null && loginCode.expiresAt >= dependencies.now();
  if (!isUnexpired) return new InvalidCodeError();
  if (loginCode.attempts >= LOGIN_CODE_MAX_ATTEMPTS) return new RateLimitedError();

  return loginCode;
};

const recordFailedAttempt = (dependencies: AuthDependencies, loginCode: LoginCode): AndonError => {
  const saved = dependencies.credentials.saveLoginCode({ ...loginCode, attempts: loginCode.attempts + 1 });
  if (saved instanceof Error) return saved;
  return new InvalidCodeError();
};
