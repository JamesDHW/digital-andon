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

/** Older servers don't send who someone is with; that reads as nobody. */
const lightSchema = z.object({ memberId: memberIdSchema, colour: colourSchema, status: z.string().nullable(), since: z.number(), helping: memberIdSchema.nullable().default(null) });

const lightChangeSchema = z.object({ at: z.number(), colour: colourSchema, status: z.string().nullable() });

const joinChangeSchema = z.object({ at: z.number(), kind: z.enum(["join", "leave"]), helperId: memberIdSchema, targetId: memberIdSchema });

export const snapshotSchema = z.object({
  teamName: z.string(),
  you: memberIdSchema,
  members: z.array(memberSchema),
  lights: z.array(lightSchema),
  follows: z.array(memberIdSchema),
  online: z.array(memberIdSchema),
});

/** The socket messages the web app uses; anything else (errors, newer kinds) is ignored. */
export const liveMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hello"), you: memberIdSchema, members: z.array(memberSchema), lights: z.array(lightSchema), follows: z.array(memberIdSchema), online: z.array(memberIdSchema) }),
  z.object({ type: z.literal("light"), light: lightSchema }),
  z.object({ type: z.literal("presence"), memberId: memberIdSchema, isOnline: z.boolean() }),
  z.object({ type: z.literal("member"), member: memberSchema }),
  z.object({ type: z.literal("memberRemoved"), memberId: memberIdSchema }),
  z.object({ type: z.literal("follows"), memberIds: z.array(memberIdSchema) }),
]);

export const historySchema = z.object({
  from: z.number(),
  to: z.number(),
  members: z.array(z.object({ memberId: memberIdSchema, start: lightChangeSchema, changes: z.array(lightChangeSchema), joins: z.array(joinChangeSchema) })),
  isTruncated: z.boolean(),
});

export const settingsSchema = z.object({ teamName: z.string(), allowedDomains: z.array(z.string()) });

export const errorBodySchema = z.object({ message: z.string() });

export type History = z.infer<typeof historySchema>;
export type JoinChange = z.infer<typeof joinChangeSchema>;
export type TeamSettings = z.infer<typeof settingsSchema>;
