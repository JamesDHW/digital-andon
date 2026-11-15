import { z } from "zod";

import type { EventStore } from "../../application/ports/eventStore.js";
import type { AndonEvent, RecordedEvent } from "../../domain/andonEvent.js";
import { colourSchema, memberIdSchema } from "../../protocol/fieldSchemas.js";
import { runStatement, selectRows, type SqlExecutor, type SqlValue } from "./sqlExecutor.js";

const eventRowBase = { id: z.number(), member_id: memberIdSchema, at: z.number() };

/** Statuses are stored in the column "topic", and older status events have the kind "topic": both are read as status. */
const eventRowSchema = z.union([
  z.object({ ...eventRowBase, kind: z.literal("pull"), colour: colourSchema, topic: z.string().nullable(), source: z.enum(["app", "api"]) })
    .transform((row): RecordedEvent => ({ id: row.id, kind: "pull", memberId: row.member_id, colour: row.colour, status: row.topic, source: row.source, at: row.at })),
  z.object({ ...eventRowBase, kind: z.enum(["status", "topic"]), topic: z.string().nullable() })
    .transform((row): RecordedEvent => ({ id: row.id, kind: "status", memberId: row.member_id, status: row.topic, at: row.at })),
]);

type EventColumns = readonly [kind: string, memberId: string, colour: SqlValue, status: SqlValue, source: SqlValue, at: number];

export const createSqlEventStore = (sql: SqlExecutor): EventStore => ({
  append: (event) => runStatement(sql, "INSERT INTO events (kind, member_id, colour, topic, source, at) VALUES (?, ?, ?, ?, ?, ?)", ...toEventColumns(event)),
  list: (query) =>
    selectRows(
      sql,
      eventRowSchema,
      "SELECT id, kind, member_id, colour, topic, source, at FROM events WHERE id > ? AND kind IN ('pull', 'status', 'topic') ORDER BY id LIMIT ?",
      query.afterId,
      query.limit,
    ),
});

const toEventColumns = (event: AndonEvent): EventColumns => {
  switch (event.kind) {
    case "pull":
      return [event.kind, event.memberId, event.colour, event.status, event.source, event.at];
    case "status":
      return [event.kind, event.memberId, null, event.status, null, event.at];
    default:
      return event satisfies never;
  }
};
