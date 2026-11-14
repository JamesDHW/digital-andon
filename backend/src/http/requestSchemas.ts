import { z } from "zod";

import { MEMBER_NAME_MAX_LENGTH } from "../domain/member.constants.js";
import { TOPIC_MAX_LENGTH } from "../domain/topic.constants.js";
import { DEVICE_NAME_MAX_LENGTH, URL_MAX_LENGTH } from "./http.constants.js";
import { colourSchema, memberIdSchema } from "../protocol/fieldSchemas.js";


const nameSchema = z.string().trim().min(1).max(MEMBER_NAME_MAX_LENGTH);
const deviceNameSchema = z.string().trim().min(1).max(DEVICE_NAME_MAX_LENGTH);

export const inviteBodySchema = z.object({ email: z.email(), name: nameSchema });
export const redeemBodySchema = z.object({ code: z.string().min(1), deviceName: deviceNameSchema });
export const codeRequestBodySchema = z.object({ email: z.email() });
export const codeVerifyBodySchema = z.object({ email: z.email(), code: z.string().min(1), deviceName: deviceNameSchema });

export const profileBodySchema = z.object({
  name: nameSchema.optional(),
  avatarUrl: z.url({ protocol: /^https$/ }).max(URL_MAX_LENGTH).nullable().optional(),
});

export const followsBodySchema = z.object({ memberIds: z.array(memberIdSchema) });

export const settingsBodySchema = z.object({
  teamName: nameSchema.optional(),
  allowedDomains: z.array(z.string().trim().min(1)).optional(),
});

export const apiPullBodySchema = z.object({
  memberId: memberIdSchema,
  colour: colourSchema,
  topic: z.string().max(TOPIC_MAX_LENGTH * 2).nullable().optional(),
});

export const devSignInBodySchema = z.object({ email: z.email(), name: nameSchema });
