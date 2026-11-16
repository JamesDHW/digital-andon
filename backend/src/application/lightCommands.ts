import type { AndonError } from "../errors/andonError.js";
import { changeStatus } from "../domain/changeStatus.js";
import { endsJoin } from "../domain/help.js";
import type { MemberId } from "../domain/memberId.js";
import { normaliseStatus } from "../domain/status.js";
import type { Delivery } from "../protocol/serverMessage.js";
import { broadcastCurrentLight, changeLight, publishLight, type PullCommand } from "./changeLight.js";
import { currentLight } from "./currentLight.js";
import { endJoinsOf } from "./joins/joinCommands.js";
import type { TeamDependencies } from "./teamDependencies.js";

export type { PullCommand } from "./changeLight.js";

/** A person (or the offline sweep) changing a light. Changing to Clear or Off also ends any join, from either side. */
export const pullLight = (dependencies: TeamDependencies, command: PullCommand): readonly Delivery[] | AndonError => {
  const light = currentLight(dependencies, command.memberId);
  if (light instanceof Error) return light;
  if (!endsJoin(light.colour, command.colour)) return changeLight(dependencies, command);

  const ended = endJoinsOf(dependencies, command.memberId);
  if (ended instanceof Error) return ended;
  const changed = changeLight(dependencies, command);
  if (changed instanceof Error) return changed;
  const isOnlyTheJoinThatChanged = changed.length === 0 && ended.wasHelping;
  const ownUpdate = isOnlyTheJoinThatChanged ? broadcastCurrentLight(dependencies, command.memberId) : changed;
  if (ownUpdate instanceof Error) return ownUpdate;
  return [...ended.deliveries, ...ownUpdate];
};

export const setLightStatus = (dependencies: TeamDependencies, memberId: MemberId, rawStatus: string): readonly Delivery[] | AndonError => {
  const light = currentLight(dependencies, memberId);
  if (light instanceof Error) return light;

  const status = normaliseStatus(rawStatus);
  const updatedLight = changeStatus(light, status);
  if (updatedLight.status === light.status) return [];

  return publishLight(dependencies, updatedLight, { kind: "status", memberId, status, at: dependencies.now() });
};
