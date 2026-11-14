import type { AndonError } from "../../errors/andonError.js";
import type { AndonEvent, RecordedEvent } from "../../domain/andonEvent.js";

export type EventQuery = {
  readonly afterId: number;
  readonly limit: number;
};

export type EventStore = {
  readonly append: (event: AndonEvent) => undefined | AndonError;
  readonly list: (query: EventQuery) => readonly RecordedEvent[] | AndonError;
};
