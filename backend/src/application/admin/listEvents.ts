import type { AndonError } from "../../errors/andonError.js";
import type { RecordedEvent } from "../../domain/andonEvent.js";
import type { Member } from "../../domain/member.js";
import type { AuthDependencies } from "../auth/authDependencies.js";
import type { EventQuery } from "../ports/eventStore.js";
import { requireAdmin } from "./requireAdmin.js";

export const listEvents = (dependencies: AuthDependencies, admin: Member, query: EventQuery): readonly RecordedEvent[] | AndonError => {
  const forbidden = requireAdmin(admin);
  if (forbidden !== undefined) return forbidden;

  return dependencies.events.list(query);
};
