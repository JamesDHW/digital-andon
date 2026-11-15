import type { AndonError } from "../errors/andonError.js";
import type { AndonEvent, PullSource } from "../domain/andonEvent.js";
import { changeStatus } from "../domain/changeStatus.js";
import type { Colour } from "../domain/colour.js";
import type { Light } from "../domain/light.js";
import type { MemberId } from "../domain/memberId.js";
import { pullCord } from "../domain/pullCord.js";
import { normaliseStatus } from "../domain/status.js";
import { toEveryone, type Delivery } from "../protocol/serverMessage.js";
import { toWireLight } from "../protocol/wireLight.js";
import { currentLight } from "./currentLight.js";
import type { TeamDependencies } from "./teamDependencies.js";

export type PullCommand = {
  readonly memberId: MemberId;
  readonly colour: Colour;
  readonly rawStatus: string | null | undefined;
  readonly source: PullSource;
};

export const pullLight = (dependencies: TeamDependencies, command: PullCommand): readonly Delivery[] | AndonError => {
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

export const setLightStatus = (dependencies: TeamDependencies, memberId: MemberId, rawStatus: string): readonly Delivery[] | AndonError => {
  const light = currentLight(dependencies, memberId);
  if (light instanceof Error) return light;

  const status = normaliseStatus(rawStatus);
  const updatedLight = changeStatus(light, status);
  if (updatedLight.status === light.status) return [];

  return publishLight(dependencies, updatedLight, { kind: "status", memberId, status, at: dependencies.now() });
};

const publishLight = (dependencies: TeamDependencies, light: Light, event: AndonEvent): readonly Delivery[] | AndonError => {
  const saved = dependencies.lights.save(light);
  if (saved instanceof Error) return saved;

  const appended = dependencies.events.append(event);
  if (appended instanceof Error) return appended;

  return [toEveryone({ type: "light", light: toWireLight(light) })];
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
