import { describe, expect, it } from "vitest";

import { followMember } from "../src/application/followCommands.js";
import { greetMember } from "../src/application/greetMember.js";
import { handleClientMessage } from "../src/application/handleClientMessage.js";
import { InvalidRequestError } from "../src/errors/andonError.js";
import { addMember, createTestTeam, expectSuccess } from "./support/testTeam.js";

const createTeamWithLead = () => {
  const team = createTestTeam();
  const james = addMember(team, "james", "admin");
  const priya = addMember(team, "priya");
  expectSuccess(followMember(team.dependencies, james.id, priya.id));
  return { team, james, priya };
};

describe("pulling the cord", () => {
  it("broadcasts the new light to everyone and logs a pull event", () => {
    const { team, priya } = createTeamWithLead();
    const deliveries = expectSuccess(handleClientMessage(team.dependencies, priya.id, { type: "pull", colour: "red", topic: "  Deploy blocked " }));

    expect(deliveries).toEqual([
      {
        audience: { kind: "everyone" },
        message: {
          type: "light",
          light: { memberId: priya.id, colour: "red", topic: "Deploy blocked", since: team.clock.now() },
        },
      },
    ]);
    expect(expectSuccess(team.dependencies.events.list({ afterId: 0, limit: 10 }))).toMatchObject([
      { kind: "pull", memberId: priya.id, colour: "red", topic: "Deploy blocked", source: "app" },
    ]);
  });

  it("sends nothing when a green member pulls green", () => {
    const { team, priya } = createTeamWithLead();
    expect(expectSuccess(handleClientMessage(team.dependencies, priya.id, { type: "pull", colour: "green" }))).toEqual([]);
  });

  it("logs a topic event when the same colour is pulled with a new topic", () => {
    const { team, priya } = createTeamWithLead();
    expectSuccess(handleClientMessage(team.dependencies, priya.id, { type: "pull", colour: "amber" }));
    expectSuccess(handleClientMessage(team.dependencies, priya.id, { type: "pull", colour: "amber", topic: "Unsure about API shape" }));

    const events = expectSuccess(team.dependencies.events.list({ afterId: 0, limit: 10 }));
    expect(events.map((event) => event.kind)).toEqual(["pull", "topic"]);
  });

  it("refuses a topic while green", () => {
    const { team, priya } = createTeamWithLead();
    expect(handleClientMessage(team.dependencies, priya.id, { type: "topic", topic: "Hello" })).toBeInstanceOf(InvalidRequestError);
  });
});

describe("going off", () => {
  it("broadcasts the off light and refuses a topic while off", () => {
    const { team, priya } = createTeamWithLead();
    const deliveries = expectSuccess(handleClientMessage(team.dependencies, priya.id, { type: "pull", colour: "off" }));

    expect(deliveries).toMatchObject([{ message: { type: "light", light: { memberId: priya.id, colour: "off", topic: null } } }]);
    expect(handleClientMessage(team.dependencies, priya.id, { type: "topic", topic: "Hello" })).toBeInstanceOf(InvalidRequestError);
  });
});

describe("greeting", () => {
  it("returns every member's light, defaulting to green, and the member's own follows", () => {
    const { team, james, priya } = createTeamWithLead();
    expectSuccess(handleClientMessage(team.dependencies, priya.id, { type: "pull", colour: "amber" }));

    const hello = expectSuccess(greetMember(team.dependencies, james.id));
    expect(hello).toMatchObject({
      type: "hello",
      you: james.id,
      follows: [priya.id],
      lights: [
        { memberId: james.id, colour: "green" },
        { memberId: priya.id, colour: "amber" },
      ],
    });
  });
});
