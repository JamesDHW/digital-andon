import type { RecordedEvent } from "../domain/andonEvent.js";
import { CSV_HEADER } from "./http.constants.js";

export const toEventsCsv = (events: readonly RecordedEvent[]): string =>
  [CSV_HEADER, ...events.map((event) => toCsvRow(event).map(escapeCsvField).join(","))].join("\n");

const toCsvRow = (event: RecordedEvent): readonly string[] => {
  const at = new Date(event.at).toISOString();
  switch (event.kind) {
    case "pull":
      return [String(event.id), at, event.kind, event.memberId, event.colour, event.topic ?? "", event.source, ""];
    case "topic":
      return [String(event.id), at, event.kind, event.memberId, "", event.topic ?? "", "", ""];
    case "note":
      return [String(event.id), at, event.kind, event.memberId, "", "", "", event.note];
    default:
      return event satisfies never;
  }
};

const escapeCsvField = (field: string): string => {
  const needsQuoting = /[",\n]/.test(field);
  if (!needsQuoting) return field;
  return `"${field.replaceAll('"', '""')}"`;
};
