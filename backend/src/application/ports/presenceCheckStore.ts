import type { AndonError } from "../../errors/andonError.js";
import type { MemberId } from "../../domain/memberId.js";

/** Who disconnected, and when to check whether they came back. */
export type PresenceCheckStore = {
  readonly schedule: (memberId: MemberId, dueAt: number) => undefined | AndonError;
  readonly cancel: (memberId: MemberId) => undefined | AndonError;
  /** Removes and returns every check due by this moment. */
  readonly takeDue: (now: number) => readonly MemberId[] | AndonError;
  readonly nextDueAt: () => number | null | AndonError;
};
