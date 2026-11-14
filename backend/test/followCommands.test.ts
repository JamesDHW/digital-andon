import { describe, expect, it } from "vitest";

import { followMember, replaceFollowing, unfollowMember } from "../src/application/followCommands.js";
import { InvalidRequestError, NotFoundError } from "../src/errors/andonError.js";
import { addMember, createTestTeam, expectSuccess, memberIdOf } from "./support/testTeam.js";

describe("following", () => {
  it("sends the follower's whole list back to all their sockets", () => {
    const team = createTestTeam();
    const james = addMember(team, "james");
    const priya = addMember(team, "priya");

    expect(expectSuccess(followMember(team.dependencies, james.id, priya.id))).toEqual([
      { audience: { kind: "member", memberId: james.id }, message: { type: "follows", memberIds: [priya.id] } },
    ]);
    expect(expectSuccess(unfollowMember(team.dependencies, james.id, priya.id))).toMatchObject([{ message: { memberIds: [] } }]);
  });

  it("refuses following yourself or someone who isn't on the team", () => {
    const team = createTestTeam();
    const james = addMember(team, "james");

    expect(followMember(team.dependencies, james.id, james.id)).toBeInstanceOf(InvalidRequestError);
    expect(followMember(team.dependencies, james.id, memberIdOf("nobody"))).toBeInstanceOf(NotFoundError);
  });

  it("replaces the list, dropping unknown ids, duplicates and yourself", () => {
    const team = createTestTeam();
    const james = addMember(team, "james");
    const priya = addMember(team, "priya");
    const tom = addMember(team, "tom");
    expectSuccess(followMember(team.dependencies, james.id, priya.id));

    expectSuccess(replaceFollowing(team.dependencies, james.id, [tom.id, tom.id, james.id, memberIdOf("nobody"), priya.id]));
    expect(expectSuccess(team.dependencies.follows.listFollowing(james.id))).toEqual([tom.id, priya.id]);
  });
});
