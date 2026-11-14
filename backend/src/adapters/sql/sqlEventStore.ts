import { z } from "zod";

import type { EventStore } from "../../application/ports/eventStore.js";
import type { AndonEvent, RecordedEvent } from "../../domain/andonEvent.js";
import { colourSchema, memberIdSchema } from "../../protocol/fieldSchemas.js";
import { runStatement, selectRows, type SqlExecutor, type SqlValue } from "./sqlExecutor.js";

const eventRowBase = { id: z.number(), member_id: memberIdSchema, at: z.number() };

const eventRowSchema = z.union([
  z.object({ ...eventRowBase, kind: z.literal("pull"), colour: colourSchema, topic: z.string().nullable(), source: z.enum(["app", "api"]) })
    .transform((row): RecordedEvent => ({ id: row.id, kind: "pull", memberId: row.member_id, colour: row.colour, topic: row.topic, source: row.source, at: row.at })),
  z.object({ ...eventRowBase, kind: z.literal("topic"), topic: z.string().nullable() })
    .transform((row): RecordedEvent => ({ id: row.id, kind: "topic", memberId: row.member_id, topic: row.topic, at: row.at })),
  z.object({ ...eventRowBase, kind: z.literal("note"), note: z.string() })
    .transform((row): RecordedEvent => ({ id: row.id, kind: "note", memberId: row.member_id, note: row.note, at: row.at })),
]);

type EventColumns = readonly [kind: string, memberId: string, colour: SqlValue, topic: SqlValue, source: SqlValue, note: SqlValue, at: number];

export const createSqlEventStore = (sql: SqlExecutor): EventStore => ({
  append: (event) =>
    runStatement(sql, "INSERT INTO events (kind, member_id, colour, topic, source, note, at) VALUES (?, ?, ?, ?, ?, ?, ?)", ...toEventColumns(event)),
  list: (query) =>
    selectRows(
      sql,
      eventRowSchema,
      "SELECT id, kind, member_id, colour, topic, source, note, at FROM events WHERE id > ? AND kind IN ('pull', 'topic', 'note') ORDER BY id LIMIT ?",
      query.afterId,
      query.limit,
    ),
});

const toEventColumns = (event: AndonEvent): EventColumns => {
  switch (event.kind) {
    case "pull":
      return [event.kind, event.memberId, event.colour, event.topic, event.source, null, event.at];
    case "topic":
      return [event.kind, event.memberId, null, event.topic, null, null, event.at];
    case "note":
      return [event.kind, event.memberId, null, null, null, event.note, event.at];
    default:
      return event satisfies never;
  }
};
