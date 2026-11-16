import type { RecordedEvent } from "../domain/andonEvent.js";
import type { Member } from "../domain/member.js";
import { CSV_HEADER } from "./http.constants.js";

/** One row per change, with people's current names beside their ids so the file reads on its own.
 * Joins and leaves name the person joined in the "with" columns: a red's first join gives the response time. */
export const toEventsCsv = (events: readonly RecordedEvent[], members: readonly Member[]): string => {
  const names = new Map(members.map((member): readonly [string, string] => [member.id, member.name]));
  const nameOf = (memberId: string): string => names.get(memberId) ?? "";
  return [CSV_HEADER, ...events.map((event) => toCsvRow(event, nameOf).map(escapeCsvField).join(","))].join("\n");
};

const toCsvRow = (event: RecordedEvent, nameOf: (memberId: string) => string): readonly string[] => {
  const at = new Date(event.at).toISOString();
  const person = [String(event.id), at, event.kind, event.memberId, nameOf(event.memberId)];
  switch (event.kind) {
    case "pull":
      return [...person, event.colour, event.status ?? "", event.source, "", ""];
    case "status":
      return [...person, "", event.status ?? "", "", "", ""];
    case "join":
    case "leave":
      return [...person, "", "", "", event.targetId, nameOf(event.targetId)];
    default:
      return event satisfies never;
  }
};
const escapeCsvField = (field: string): string => {
  const needsQuoting = /[",\n]/.test(field);
  if (!needsQuoting) return field;
  return `"${field.replaceAll('"', '""')}"`;
};
