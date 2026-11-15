import type { RecordedEvent } from "../domain/andonEvent.js";
import type { Member } from "../domain/member.js";
import { CSV_HEADER } from "./http.constants.js";

/** One row per change, with the person's current name beside their id so the file reads on its own. */
export const toEventsCsv = (events: readonly RecordedEvent[], members: readonly Member[]): string => {
  const names = new Map(members.map((member) => [member.id, member.name]));
  return [CSV_HEADER, ...events.map((event) => toCsvRow(event, names.get(event.memberId) ?? "").map(escapeCsvField).join(","))].join("\n");
};

const toCsvRow = (event: RecordedEvent, name: string): readonly string[] => {
  const at = new Date(event.at).toISOString();
  switch (event.kind) {
    case "pull":
      return [String(event.id), at, event.kind, event.memberId, name, event.colour, event.status ?? "", event.source];
    case "status":
      return [String(event.id), at, event.kind, event.memberId, name, "", event.status ?? "", ""];
    default:
      return event satisfies never;
  }
};
const escapeCsvField = (field: string): string => {
  const needsQuoting = /[",\n]/.test(field);
  if (!needsQuoting) return field;
  return `"${field.replaceAll('"', '""')}"`;
};
