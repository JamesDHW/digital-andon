import type { AndonError } from "../../errors/andonError.js";
import type { MemberId } from "../../domain/memberId.js";
import type { Delivery } from "../../protocol/serverMessage.js";
import { currentLight } from "../currentLight.js";
import { pullLight } from "../lightCommands.js";
import type { TeamDependencies } from "../teamDependencies.js";
import { OFFLINE_GRACE_MS } from "./presence.constants.js";

export type OfflineSweep = {
  readonly deliveries: readonly Delivery[];
  /** When to sweep again, if anyone else is still waiting to be checked. */
  readonly nextCheckAt: number | null;
};

/** Their last Mac went away (lid closed, gone home). Returns when the sweep that may switch them off should run. */
export const noteDisconnected = (dependencies: TeamDependencies, memberId: MemberId): number | AndonError => {
  const scheduled = dependencies.presenceChecks.schedule(memberId, dependencies.now() + OFFLINE_GRACE_MS);
  if (scheduled instanceof Error) return scheduled;
  const nextCheckAt = dependencies.presenceChecks.nextDueAt();
  if (nextCheckAt instanceof Error) return nextCheckAt;
  return nextCheckAt ?? dependencies.now() + OFFLINE_GRACE_MS;
};

export const noteConnected = (dependencies: TeamDependencies, memberId: MemberId): undefined | AndonError =>
  dependencies.presenceChecks.cancel(memberId);

/** Anyone still gone after the grace period is switched off, so nobody shows Clear (or Blocked) with their laptop shut.
 * It's logged as an ordinary change with the source "offline". */
export const switchOffAbsentMembers = (dependencies: TeamDependencies): OfflineSweep | AndonError => {
  const due = dependencies.presenceChecks.takeDue(dependencies.now());
  if (due instanceof Error) return due;

  const online = dependencies.onlineMembers();
  const switchedOff = due.filter((memberId) => !online.includes(memberId)).map((memberId) => switchOff(dependencies, memberId));
  const failure = switchedOff.find((result): result is AndonError => result instanceof Error);
  if (failure !== undefined) return failure;

  const nextCheckAt = dependencies.presenceChecks.nextDueAt();
  if (nextCheckAt instanceof Error) return nextCheckAt;
  const deliveries = switchedOff.flatMap((result) => (result instanceof Error ? [] : result));
  return { deliveries, nextCheckAt };
};

const switchOff = (dependencies: TeamDependencies, memberId: MemberId): readonly Delivery[] | AndonError => {
  const light = currentLight(dependencies, memberId);
  if (light instanceof Error) return light;
  if (light.colour === "off") return [];
  return pullLight(dependencies, { memberId, colour: "off", rawStatus: undefined, source: "offline" });
};
