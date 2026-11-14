import type { AndonError } from "../errors/andonError.js";
import type { AndonEvent, PullSource } from "../domain/andonEvent.js";
import { changeTopic } from "../domain/changeTopic.js";
import type { Colour } from "../domain/colour.js";
import type { Light } from "../domain/light.js";
import type { MemberId } from "../domain/memberId.js";
import { pullCord } from "../domain/pullCord.js";
import { normaliseTopic } from "../domain/topic.js";
import { toEveryone, type Delivery } from "../protocol/serverMessage.js";
import { toWireLight } from "../protocol/wireLight.js";
import { currentLight } from "./currentLight.js";
import type { TeamDependencies } from "./teamDependencies.js";

export type PullCommand = {
  readonly memberId: MemberId;
  readonly colour: Colour;
  readonly rawTopic: string | null | undefined;
  readonly source: PullSource;
};

export const pullLight = (dependencies: TeamDependencies, command: PullCommand): readonly Delivery[] | AndonError => {
  const light = currentLight(dependencies, command.memberId);
  if (light instanceof Error) return light;

  const at = dependencies.now();
  const topic = normaliseOptionalTopic(command.rawTopic);
  const pulledLight = pullCord(light, { colour: command.colour, topic, at });
  if (isSameLight(light, pulledLight)) return [];

  const event: AndonEvent = light.colour === pulledLight.colour
    ? { kind: "topic", memberId: command.memberId, topic: pulledLight.topic, at }
    : { kind: "pull", memberId: command.memberId, colour: pulledLight.colour, topic: pulledLight.topic, source: command.source, at };
  return publishLight(dependencies, pulledLight, event);
};

export const setLightTopic = (dependencies: TeamDependencies, memberId: MemberId, rawTopic: string): readonly Delivery[] | AndonError => {
  const light = currentLight(dependencies, memberId);
  if (light instanceof Error) return light;

  const topic = normaliseTopic(rawTopic);
  const updatedLight = changeTopic(light, topic);
  if (updatedLight instanceof Error) return updatedLight;

  return publishLight(dependencies, updatedLight, { kind: "topic", memberId, topic, at: dependencies.now() });
};

export const recordResolutionNote = (dependencies: TeamDependencies, memberId: MemberId, note: string): readonly Delivery[] | AndonError => {
  const appended = dependencies.events.append({ kind: "note", memberId, note: note.trim(), at: dependencies.now() });
  if (appended instanceof Error) return appended;
  return [];
};

const publishLight = (dependencies: TeamDependencies, light: Light, event: AndonEvent): readonly Delivery[] | AndonError => {
  const saved = dependencies.lights.save(light);
  if (saved instanceof Error) return saved;

  const appended = dependencies.events.append(event);
  if (appended instanceof Error) return appended;

  return [toEveryone({ type: "light", light: toWireLight(light) })];
};

const normaliseOptionalTopic = (rawTopic: string | null | undefined): string | null | undefined => {
  const isTopicAbsent = rawTopic === undefined || rawTopic === null;
  if (isTopicAbsent) return rawTopic;
  return normaliseTopic(rawTopic);
};

const isSameLight = (previous: Light, next: Light): boolean =>
  previous.colour === next.colour
  && previous.topic === next.topic
  && previous.since === next.since;
