import { z } from "zod";

import { InvalidRequestError, type AndonError } from "../errors/andonError.js";
import { tryCatchAsync } from "../errors/tryCatch.js";

export const parseJsonBody = async <Body>(request: Request, bodySchema: z.ZodType<Body>): Promise<Body | AndonError> => {
  const decoded = await tryCatchAsync((): Promise<unknown> => request.json());
  if (decoded instanceof Error) return new InvalidRequestError("Send a JSON body.");

  const parsed = bodySchema.safeParse(decoded);
  if (!parsed.success) return new InvalidRequestError(z.prettifyError(parsed.error));
  return parsed.data;
};

/** Accepts the device token as a bearer header. */
export const bearerToken = (request: Request): string | null => {
  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer (.+)$/i.exec(authorization);
  return match?.[1] ?? null;
};
