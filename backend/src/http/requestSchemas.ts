import { z } from "zod";

import { MEMBER_NAME_MAX_LENGTH } from "../domain/member.constants.js";
import { DEVICE_NAME_MAX_LENGTH, EVENT_PAGE_DEFAULT_LIMIT, EVENT_PAGE_MAX_LIMIT } from "./http.constants.js";
import { memberIdSchema } from "../protocol/fieldSchemas.js";


const nameSchema = z.string().trim().min(1).max(MEMBER_NAME_MAX_LENGTH);
const deviceNameSchema = z.string().trim().min(1).max(DEVICE_NAME_MAX_LENGTH);

export const codeRequestBodySchema = z.object({ email: z.email() });
export const codeVerifyBodySchema = z.object({ email: z.email(), code: z.string().min(1), deviceName: deviceNameSchema });

export const profileBodySchema = z.object({ name: nameSchema });

export const followsBodySchema = z.object({ memberIds: z.array(memberIdSchema) });

export const settingsBodySchema = z.object({
  teamName: nameSchema.optional(),
  allowedDomains: z.array(z.string().trim().min(1)).optional(),
});

export const devSignInBodySchema = z.object({ email: z.email(), name: nameSchema });

const millisecondsSchema = z.coerce.number().int().nonnegative();
const memberIdListSchema = z
  .string()
  .transform((list) => list.split(",").map((memberId) => memberId.trim()).filter((memberId) => memberId.length > 0))
  .pipe(z.array(memberIdSchema));

/** Query string of GET /team/events: paging, plus optional filters by time and by person. */
export const eventsQuerySchema = z.object({
  afterId: z.coerce.number().int().nonnegative().default(0),
  limit: z.coerce.number().int().min(1).max(EVENT_PAGE_MAX_LIMIT).default(EVENT_PAGE_DEFAULT_LIMIT),
  from: millisecondsSchema.optional(),
  to: millisecondsSchema.optional(),
  memberIds: memberIdListSchema.optional(),
  format: z.enum(["json", "csv"]).default("json"),
});

/** Query string of GET /team/history. */
export const historyQuerySchema = z.object({
  from: millisecondsSchema,
  to: millisecondsSchema,
  memberIds: memberIdListSchema,
});
