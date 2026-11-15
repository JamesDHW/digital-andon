import type { AndonError } from "../errors/andonError.js";
import type { MemberId } from "../domain/memberId.js";
import type { ClientMessage } from "../protocol/clientMessage.js";
import type { Delivery } from "../protocol/serverMessage.js";
import { followMember, unfollowMember } from "./followCommands.js";
import { pullLight, setLightStatus } from "./lightCommands.js";
import type { TeamDependencies } from "./teamDependencies.js";

export const handleClientMessage = (
  dependencies: TeamDependencies,
  senderId: MemberId,
  message: ClientMessage,
): readonly Delivery[] | AndonError => {
  switch (message.type) {
    case "pull":
      return pullLight(dependencies, { memberId: senderId, colour: message.colour, rawStatus: message.status, source: "app" });
    case "status":
      return setLightStatus(dependencies, senderId, message.status);
    case "follow":
      return followMember(dependencies, senderId, message.memberId);
    case "unfollow":
      return unfollowMember(dependencies, senderId, message.memberId);
    default:
      return message satisfies never;
  }
};
