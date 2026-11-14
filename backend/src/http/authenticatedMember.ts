import { UnauthorisedError, type AndonError } from "../errors/andonError.js";
import { authenticateDevice } from "../application/auth/authenticate.js";
import type { Member } from "../domain/member.js";
import type { HttpContext } from "./httpOutcome.js";
import { bearerToken } from "./requestBody.js";

export const authenticatedMember = async (context: HttpContext): Promise<Member | AndonError> => {
  const deviceToken = bearerToken(context.request);
  if (deviceToken === null) return new UnauthorisedError();
  return authenticateDevice(context.dependencies, deviceToken);
};
