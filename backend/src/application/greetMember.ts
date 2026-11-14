import type { AndonError } from "../errors/andonError.js";
import type { MemberId } from "../domain/memberId.js";
import type { ServerMessage } from "../protocol/serverMessage.js";
import { toWireLight } from "../protocol/wireLight.js";
import { currentLights } from "./currentLight.js";
import type { TeamDependencies } from "./teamDependencies.js";

/** The full team state a client replaces its own with on every (re)connect. */
export const greetMember = (dependencies: TeamDependencies, memberId: MemberId): ServerMessage | AndonError => {
  const members = dependencies.members.list();
  if (members instanceof Error) return members;

  const lights = currentLights(dependencies, members);
  if (lights instanceof Error) return lights;

  const follows = dependencies.follows.listFollowing(memberId);
  if (follows instanceof Error) return follows;

  return {
    type: "hello",
    you: memberId,
    members,
    lights: lights.map(toWireLight),
    follows,
    online: dependencies.onlineMembers(),
    serverTime: dependencies.now(),
  };
};
