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

/** Query strings are flat text, so schemas coerce numbers and split lists themselves. */
export const parseQuery = <Query>(url: URL, querySchema: z.ZodType<Query>): Query | AndonError => {
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return new InvalidRequestError(z.prettifyError(parsed.error));
  return parsed.data;
};

/** Accepts the device token as a bearer header. */
export const bearerToken = (request: Request): string | null => {
  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer (.+)$/i.exec(authorization);
  return match?.[1] ?? null;
};
