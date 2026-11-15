import { z } from "zod";

import { colourSchema, memberIdSchema } from "@backend/protocol/fieldSchemas.js";

const memberSchema = z.object({
  id: memberIdSchema,
  name: z.string(),
  email: z.string(),
  avatarUrl: z.string().nullable(),
  role: z.enum(["member", "admin"]),
  joinedAt: z.number(),
});

const lightSchema = z.object({ memberId: memberIdSchema, colour: colourSchema, status: z.string().nullable(), since: z.number() });

const lightChangeSchema = z.object({ at: z.number(), colour: colourSchema, status: z.string().nullable() });

export const snapshotSchema = z.object({
  teamName: z.string(),
  you: memberIdSchema,
  members: z.array(memberSchema),
  lights: z.array(lightSchema),
  follows: z.array(memberIdSchema),
  online: z.array(memberIdSchema),
});

export const historySchema = z.object({
  from: z.number(),
  to: z.number(),
  members: z.array(z.object({ memberId: memberIdSchema, start: lightChangeSchema, changes: z.array(lightChangeSchema) })),
  isTruncated: z.boolean(),
});

export const settingsSchema = z.object({ teamName: z.string(), allowedDomains: z.array(z.string()) });

export const errorBodySchema = z.object({ message: z.string() });

export type History = z.infer<typeof historySchema>;
export type TeamSettings = z.infer<typeof settingsSchema>;
