import { InvalidRequestError, NotFoundError, type AndonError } from "../../errors/andonError.js";
import { allOrFirstError, firstFailure } from "../../errors/firstError.js";
import { helpingStatus, isJoinable, type Help } from "../../domain/help.js";
import type { MemberId } from "../../domain/memberId.js";
import type { Delivery } from "../../protocol/serverMessage.js";
import { broadcastCurrentLight, changeLight } from "../changeLight.js";
import { currentLight } from "../currentLight.js";
import type { TeamDependencies } from "../teamDependencies.js";

/** Join someone who is working: you go Disrupted, "with" them, until either of you changes to Clear or Off.
 * Joining a helper joins the person they're with, so there are never chains; joining someone new leaves the last. */
export const joinMember = (dependencies: TeamDependencies, helperId: MemberId, requestedId: MemberId): readonly Delivery[] | AndonError => {
  const targetId = personBeingHelped(dependencies, requestedId);
  if (targetId instanceof Error) return targetId;
  const invalid = joinProblem(dependencies, helperId, targetId);
  if (invalid !== undefined) return invalid;

  const target = dependencies.members.find(targetId);
  if (target instanceof Error) return target;
  if (target === null) return new NotFoundError("That person isn't on this team.");

  const existing = dependencies.helps.findByHelper(helperId);
  if (existing instanceof Error) return existing;
  if (existing?.targetId === targetId) return [];

  const released = releaseHelpersOf(dependencies, helperId);
  if (released instanceof Error) return released;
  const helperLight = currentLight(dependencies, helperId);
  if (helperLight instanceof Error) return helperLight;

  const at = dependencies.now();
  const help: Help = {
    helperId,
    targetId,
    returnColour: existing?.returnColour ?? helperLight.colour,
    returnStatus: existing === null ? helperLight.status : existing.returnStatus,
    joinedAt: at,
  };
  const recorded = firstFailure([
    () => (existing === null ? undefined : dependencies.events.append({ kind: "leave", memberId: helperId, targetId: existing.targetId, at })),
    () => dependencies.helps.save(help),
    () => dependencies.events.append({ kind: "join", memberId: helperId, targetId, at }),
  ]);
  if (recorded !== undefined) return recorded;

  const changed = changeLight(dependencies, { memberId: helperId, colour: "amber", rawStatus: helpingStatus(target.name), source: "join" });
  if (changed instanceof Error) return changed;
  const helperUpdate = changed.length > 0 ? changed : broadcastCurrentLight(dependencies, helperId);
  if (helperUpdate instanceof Error) return helperUpdate;
  return [...released, ...helperUpdate];
};

/** Leave the person you're with: your light goes back to what it was before you joined. */
export const leaveMember = (dependencies: TeamDependencies, helperId: MemberId): readonly Delivery[] | AndonError => {
  const help = dependencies.helps.findByHelper(helperId);
  if (help instanceof Error) return help;
  if (help === null) return [];

  const ended = endHelp(dependencies, help);
  if (ended !== undefined) return ended;

  const restored = changeLight(dependencies, { memberId: helperId, colour: help.returnColour, rawStatus: help.returnStatus, source: "join" });
  if (restored instanceof Error) return restored;
  return restored.length > 0 ? restored : broadcastCurrentLight(dependencies, helperId);
};

/** Someone going Clear or Off: they stop being with anyone, and everyone with them goes back to their own light.
 * Returns whether they were with someone, so the caller can still send their light if nothing else changed. */
export const endJoinsOf = (dependencies: TeamDependencies, memberId: MemberId): JoinsEnded | AndonError => {
  const ownHelp = dependencies.helps.findByHelper(memberId);
  if (ownHelp instanceof Error) return ownHelp;
  const ended = ownHelp === null ? undefined : endHelp(dependencies, ownHelp);
  if (ended !== undefined) return ended;

  const released = releaseHelpersOf(dependencies, memberId);
  if (released instanceof Error) return released;
  return { deliveries: released, wasHelping: ownHelp !== null };
};

export type JoinsEnded = {
  readonly deliveries: readonly Delivery[];
  readonly wasHelping: boolean;
};

const releaseHelpersOf = (dependencies: TeamDependencies, memberId: MemberId): readonly Delivery[] | AndonError => {
  const helpers = dependencies.helps.listByTarget(memberId);
  if (helpers instanceof Error) return helpers;
  const released = allOrFirstError(helpers.map((help) => leaveMember(dependencies, help.helperId)));
  if (released instanceof Error) return released;
  return released.flat();
};

const endHelp = (dependencies: TeamDependencies, help: Help): AndonError | undefined =>
  firstFailure([
    () => dependencies.helps.remove(help.helperId),
    () => dependencies.events.append({ kind: "leave", memberId: help.helperId, targetId: help.targetId, at: dependencies.now() }),
  ]);

const personBeingHelped = (dependencies: TeamDependencies, memberId: MemberId): MemberId | AndonError => {
  const help = dependencies.helps.findByHelper(memberId);
  if (help instanceof Error) return help;
  return help?.targetId ?? memberId;
};

const joinProblem = (dependencies: TeamDependencies, helperId: MemberId, targetId: MemberId): AndonError | undefined => {
  if (targetId === helperId) return new InvalidRequestError("You can't join yourself, or someone who is with you.");
  const targetLight = currentLight(dependencies, targetId);
  if (targetLight instanceof Error) return targetLight;
  if (!isJoinable(targetLight.colour)) return new InvalidRequestError("Someone who is Off can't be joined.");
  return undefined;
};
