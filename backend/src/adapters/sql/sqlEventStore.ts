import { z } from "zod";

import { AndonError } from "../../errors/andonError.js";
import type { EventStore } from "../../application/ports/eventStore.js";
import { isJoinEvent, type AndonEvent, type RecordedEvent } from "../../domain/andonEvent.js";
import { colourSchema, memberIdSchema } from "../../protocol/fieldSchemas.js";
import type { EventQuery } from "../../application/ports/eventStore.js";
import { EVENT_COLUMNS, JOIN_EVENT_KINDS, LISTED_EVENT_KINDS, MEMBER_ID_LIST, STATUS_STORED_KINDS } from "./sql.constants.js";
import { runStatement, selectFirstRow, selectRows, type SqlExecutor, type SqlValue } from "./sqlExecutor.js";

const eventRowBase = { id: z.number(), member_id: memberIdSchema, at: z.number() };

/** Statuses are stored in the column "topic", and older status events have the kind "topic": both are read as status.
 * A join or leave keeps the person joined in the column "note". */
const eventRowSchema = z.union([
  z.object({ ...eventRowBase, kind: z.literal("pull"), colour: colourSchema, topic: z.string().nullable(), source: z.enum(["app", "offline", "join", "api"]) })
    .transform((row): RecordedEvent => ({ id: row.id, kind: "pull", memberId: row.member_id, colour: row.colour, status: row.topic, source: row.source, at: row.at })),
  z.object({ ...eventRowBase, kind: z.enum(["status", "topic"]), topic: z.string().nullable() })
    .transform((row): RecordedEvent => ({ id: row.id, kind: "status", memberId: row.member_id, status: row.topic, at: row.at })),
  z.object({ ...eventRowBase, kind: z.enum(["join", "leave"]), note: memberIdSchema })
    .transform((row): RecordedEvent => ({ id: row.id, kind: row.kind, memberId: row.member_id, targetId: row.note, at: row.at })),
]);

type EventColumns = readonly [kind: string, memberId: string, colour: SqlValue, status: SqlValue, source: SqlValue, note: SqlValue, at: number];

export const createSqlEventStore = (sql: SqlExecutor): EventStore => ({
  append: (event) => runStatement(sql, "INSERT INTO events (kind, member_id, colour, topic, source, note, at) VALUES (?, ?, ?, ?, ?, ?, ?)", ...toEventColumns(event)),
  list: (query) => {
    const filters = queryFilters(query);
    return selectRows(
      sql,
      eventRowSchema,
      `SELECT ${EVENT_COLUMNS} FROM events WHERE id > ? AND kind IN ${LISTED_EVENT_KINDS}${filters.clause} ORDER BY id LIMIT ?`,
      query.afterId,
      ...filters.bindings,
      query.limit,
    );
  },
  /** Read newest first, so if there are more than the limit, the ones dropped are the oldest, furthest from the window. */
  listJoins: (memberIds, during, limit) => {
    const memberList = JSON.stringify(memberIds);
    const rows = selectRows(
      sql,
      eventRowSchema,
      `SELECT ${EVENT_COLUMNS} FROM events WHERE kind IN ${JOIN_EVENT_KINDS} AND at >= ? AND at < ? AND (member_id IN ${MEMBER_ID_LIST} OR note IN ${MEMBER_ID_LIST}) ORDER BY at DESC, id DESC LIMIT ?`,
      during.from,
      during.to,
      memberList,
      memberList,
      limit,
    );
    if (rows instanceof Error) return rows;
    return rows.filter(isJoinEvent).toReversed();
  },
  /** One indexed lookup per stored kind, newest wins: asked for both kinds at once, SQLite walks back through all of
   * the person's events instead. */
  findLatestBefore: (memberId, at, kind) => {
    const candidates = storedKindsOf(kind).map((storedKind) =>
      selectFirstRow(
        sql,
        eventRowSchema,
        `SELECT ${EVENT_COLUMNS} FROM events WHERE member_id = ? AND kind = ? AND at < ? ORDER BY at DESC, id DESC LIMIT 1`,
        memberId,
        storedKind,
        at,
      ),
    );
    const failure = candidates.find((candidate) => candidate instanceof AndonError);
    if (failure !== undefined) return failure;
    return newest(candidates.filter((candidate): candidate is RecordedEvent => candidate !== null && !(candidate instanceof AndonError)));
  },
});

/** Statuses were stored with the kind "topic" before; both are read as status. */
const storedKindsOf = (kind: AndonEvent["kind"]): readonly string[] => (kind === "status" ? STATUS_STORED_KINDS : [kind]);

/** Latest first; ids break ties between events in the same millisecond. */
const newest = (events: readonly RecordedEvent[]): RecordedEvent | null =>
  events.toSorted((first, second) => (second.at === first.at ? second.id - first.id : second.at - first.at)).at(0) ?? null;

type QueryFilters = {
  readonly clause: string;
  readonly bindings: readonly SqlValue[];
};

/** Only the filters asked for; each adds its own placeholders, so values never enter the SQL text. */
const queryFilters = (query: EventQuery): QueryFilters => {
  const filters: readonly (QueryFilters | null)[] = [
    query.from === null ? null : { clause: " AND at >= ?", bindings: [query.from] },
    query.to === null ? null : { clause: " AND at < ?", bindings: [query.to] },
    query.memberIds === null ? null : { clause: ` AND member_id IN ${MEMBER_ID_LIST}`, bindings: [JSON.stringify(query.memberIds)] },
  ];
  const chosen = filters.filter((filter): filter is QueryFilters => filter !== null);
  return { clause: chosen.map((filter) => filter.clause).join(""), bindings: chosen.flatMap((filter) => filter.bindings) };
};

const toEventColumns = (event: AndonEvent): EventColumns => {
  switch (event.kind) {
    case "pull":
      return [event.kind, event.memberId, event.colour, event.status, event.source, null, event.at];
    case "status":
      return [event.kind, event.memberId, null, event.status, null, null, event.at];
    case "join":
    case "leave":
      return [event.kind, event.memberId, null, null, null, event.targetId, event.at];
    default:
      return event satisfies never;
  }
};
