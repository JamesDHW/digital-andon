import type { AndonError } from "../errors/andonError.js";
import type { AndonEvent, PullSource } from "../domain/andonEvent.js";
import type { Colour } from "../domain/colour.js";
import type { Light } from "../domain/light.js";
import type { MemberId } from "../domain/memberId.js";
import { pullCord } from "../domain/pullCord.js";
import { normaliseStatus } from "../domain/status.js";
import { toEveryone, type Delivery } from "../protocol/serverMessage.js";
import { toWireLight, type WireLight } from "../protocol/wireLight.js";
import { currentLight } from "./currentLight.js";
import type { TeamDependencies } from "./teamDependencies.js";

export type PullCommand = {
  readonly memberId: MemberId;
  readonly colour: Colour;
  /** Undefined keeps the current status; null clears it. */
  readonly rawStatus: string | null | undefined;
  readonly source: PullSource;
};

/** Changes one light and tells everyone, with no effect on who is with whom: pullLight handles that. */
export const changeLight = (dependencies: TeamDependencies, command: PullCommand): readonly Delivery[] | AndonError => {
  const light = currentLight(dependencies, command.memberId);
  if (light instanceof Error) return light;

  const at = dependencies.now();
  const status = normaliseOptionalStatus(command.rawStatus);
  const pulledLight = pullCord(light, { colour: command.colour, status, at });
  if (isSameLight(light, pulledLight)) return [];

  const event: AndonEvent = light.colour === pulledLight.colour
    ? { kind: "status", memberId: command.memberId, status: pulledLight.status, at }
    : { kind: "pull", memberId: command.memberId, colour: pulledLight.colour, status: pulledLight.status, source: command.source, at };
  return publishLight(dependencies, pulledLight, event);
};

export const publishLight = (dependencies: TeamDependencies, light: Light, event: AndonEvent): readonly Delivery[] | AndonError => {
  const saved = dependencies.lights.save(light);
  if (saved instanceof Error) return saved;

  const appended = dependencies.events.append(event);
  if (appended instanceof Error) return appended;

  return broadcastLight(dependencies, light);
};

/** Sends a light as it stands, e.g. when only who its owner is with has changed. */
export const broadcastLight = (dependencies: TeamDependencies, light: Light): readonly Delivery[] | AndonError => {
  const wireLight = wireLightFor(dependencies, light);
  if (wireLight instanceof Error) return wireLight;
  return [toEveryone({ type: "light", light: wireLight })];
};

export const broadcastCurrentLight = (dependencies: TeamDependencies, memberId: MemberId): readonly Delivery[] | AndonError => {
  const light = currentLight(dependencies, memberId);
  if (light instanceof Error) return light;
  return broadcastLight(dependencies, light);
};

const wireLightFor = (dependencies: TeamDependencies, light: Light): WireLight | AndonError => {
  const help = dependencies.helps.findByHelper(light.memberId);
  if (help instanceof Error) return help;
  return toWireLight(light, help?.targetId ?? null);
};

const normaliseOptionalStatus = (rawStatus: string | null | undefined): string | null | undefined => {
  const isStatusAbsent = rawStatus === undefined || rawStatus === null;
  if (isStatusAbsent) return rawStatus;
  return normaliseStatus(rawStatus);
};

const isSameLight = (previous: Light, next: Light): boolean =>
  previous.colour === next.colour
  && previous.status === next.status
  && previous.since === next.since;
