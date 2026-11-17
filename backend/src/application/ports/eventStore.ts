import type { AndonError } from "../../errors/andonError.js";
import type { AndonEvent, JoinEvent, RecordedEvent } from "../../domain/andonEvent.js";
import type { MemberId } from "../../domain/memberId.js";

/** Null means no limit on that dimension. Times are milliseconds since 1970; `to` is exclusive. */
export type EventQuery = {
  readonly afterId: number;
  readonly limit: number;
  readonly from: number | null;
  readonly to: number | null;
  readonly memberIds: readonly MemberId[] | null;
};

export type EventStore = {
  readonly append: (event: AndonEvent) => undefined | AndonError;
  readonly list: (query: EventQuery) => readonly RecordedEvent[] | AndonError;
  /** Every join and leave involving these people, as helper or as the person joined, in a stretch of time, oldest first.
   * If there are more than the limit, the oldest are dropped. `to` is exclusive. */
  readonly listJoins: (memberIds: readonly MemberId[], during: { readonly from: number; readonly to: number }, limit: number) => readonly JoinEvent[] | AndonError;
  /** The member's most recent event of this kind before a moment: where a history starts. */
  readonly findLatestBefore: (memberId: MemberId, at: number, kind: AndonEvent["kind"]) => RecordedEvent | null | AndonError;
};
