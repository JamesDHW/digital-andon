import { NotFoundError, type AndonError } from "../errors/andonError.js";
import { createInitialLight, type Light } from "../domain/light.js";
import type { Member } from "../domain/member.js";
import type { MemberId } from "../domain/memberId.js";
import type { TeamDependencies } from "./teamDependencies.js";

/** A member who has never pulled the cord is green since they joined. */
export const currentLight = (dependencies: TeamDependencies, memberId: MemberId): Light | AndonError => {
  const member = dependencies.members.find(memberId);
  if (member instanceof Error) return member;
  if (member === null) return new NotFoundError("That person isn't on this team.");

  return storedLightOrInitial(dependencies, member);
};

export const currentLights = (dependencies: TeamDependencies, members: readonly Member[]): readonly Light[] | AndonError => {
  const storedLights = dependencies.lights.list();
  if (storedLights instanceof Error) return storedLights;

  return members.map(
    (member) => storedLights.find((light) => light.memberId === member.id) ?? createInitialLight(member.id, member.joinedAt),
  );
};

const storedLightOrInitial = (dependencies: TeamDependencies, member: Member): Light | AndonError => {
  const storedLight = dependencies.lights.find(member.id);
  if (storedLight instanceof Error) return storedLight;
  return storedLight ?? createInitialLight(member.id, member.joinedAt);
};
