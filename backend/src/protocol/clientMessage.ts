import { z } from "zod";

import { InvalidRequestError, type AndonError } from "../errors/andonError.js";
import { tryCatch } from "../errors/tryCatch.js";
import { STATUS_MAX_LENGTH } from "../domain/status.constants.js";
import { colourSchema, memberIdSchema } from "./fieldSchemas.js";

const clientMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("pull"), colour: colourSchema, status: z.string().max(STATUS_MAX_LENGTH * 2).nullable().optional() }),
  z.object({ type: z.literal("status"), status: z.string().max(STATUS_MAX_LENGTH * 2) }),
  z.object({ type: z.literal("follow"), memberId: memberIdSchema }),
  z.object({ type: z.literal("unfollow"), memberId: memberIdSchema }),
  z.object({ type: z.literal("join"), memberId: memberIdSchema }),
  z.object({ type: z.literal("leave") }),
]);

export type ClientMessage = z.infer<typeof clientMessageSchema>;

export const parseClientMessage = (rawMessage: string): ClientMessage | AndonError => {
  const decoded = tryCatch((): unknown => JSON.parse(rawMessage));
  if (decoded instanceof Error) return new InvalidRequestError("Messages must be JSON.");

  const parsed = clientMessageSchema.safeParse(decoded);
  if (!parsed.success) return new InvalidRequestError(z.prettifyError(parsed.error));
  return parsed.data;
};
