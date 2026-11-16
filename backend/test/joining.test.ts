import { assert, describe, expect, it } from "vitest";

import { removeMember } from "../src/application/admin/removeMember.js";
import { greetMember } from "../src/application/greetMember.js";
import { handleClientMessage } from "../src/application/handleClientMessage.js";
import { switchOffAbsentMembers, noteDisconnected } from "../src/application/presence/offlineLights.js";
import { OFFLINE_GRACE_MS } from "../src/application/presence/presence.constants.js";
import type { ClientMessage } from "../src/protocol/clientMessage.js";
import type { MemberId } from "../src/domain/memberId.js";
import { toEventsCsv } from "../src/http/eventsCsv.js";
import { InvalidRequestError } from "../src/errors/andonError.js";
import { addMember, createTestTeam, expectSuccess, type TestTeam } from "./support/testTeam.js";
import { MINUTE_MS } from "./support/testTeam.constants.js";

const createTeam = () => {
  const team = createTestTeam();
  const james = addMember(team, "james", "admin");
  const priya = addMember(team, "priya");
  const tom = addMember(team, "tom");
  const aisha = addMember(team, "aisha");
  return { team, james, priya, tom, aisha };
};

const send = (team: TestTeam, memberId: MemberId, message: ClientMessage) => expectSuccess(handleClientMessage(team.dependencies, memberId, message));

const lightOf = (team: TestTeam, memberId: MemberId) => {
  const hello = expectSuccess(greetMember(team.dependencies, memberId));
  if (hello.type !== "hello") return assert.fail("Expected a hello.");
  return hello.lights.find((light) => light.memberId === memberId);
};

const allEvents = (team: TestTeam) => expectSuccess(team.dependencies.events.list({ afterId: 0, limit: 100, from: null, to: null, memberIds: null }));

describe("joining someone", () => {
  it("makes the helper Disrupted, with the person, and records when they joined", () => {
    const { team, priya, tom } = createTeam();
    send(team, priya.id, { type: "pull", colour: "red", status: "Deploy blocked" });
    team.clock.advance(3 * MINUTE_MS);

    const deliveries = send(team, tom.id, { type: "join", memberId: priya.id });

    expect(deliveries).toMatchObject([{ message: { type: "light", light: { memberId: tom.id, colour: "amber", status: "with priya", helping: priya.id } } }]);
    expect(lightOf(team, priya.id)).toMatchObject({ colour: "red", helping: null });
    expect(allEvents(team).map((event) => event.kind)).toEqual(["pull", "join", "pull"]);
    expect(allEvents(team)[1]).toMatchObject({ kind: "join", memberId: tom.id, targetId: priya.id });
  });

  it("only joins someone Disrupted or Blocked, and never yourself", () => {
    const { team, priya, tom } = createTeam();
    expect(handleClientMessage(team.dependencies, tom.id, { type: "join", memberId: priya.id })).toBeInstanceOf(InvalidRequestError);
    send(team, tom.id, { type: "pull", colour: "red" });
    expect(handleClientMessage(team.dependencies, tom.id, { type: "join", memberId: tom.id })).toBeInstanceOf(InvalidRequestError);
  });

  it("joins the person a helper is with, rather than making a chain", () => {
    const { team, priya, tom, aisha } = createTeam();
    send(team, priya.id, { type: "pull", colour: "red" });
    send(team, tom.id, { type: "join", memberId: priya.id });

    send(team, aisha.id, { type: "join", memberId: tom.id });

    expect(lightOf(team, aisha.id)).toMatchObject({ colour: "amber", helping: priya.id });
  });

  it("puts the helper's light back as it was before joining when the person goes Clear", () => {
    const { team, priya, tom } = createTeam();
    send(team, tom.id, { type: "pull", colour: "amber", status: "Unsure about the schema" });
    send(team, priya.id, { type: "pull", colour: "red" });
    send(team, tom.id, { type: "join", memberId: priya.id });
    send(team, tom.id, { type: "pull", colour: "red" });

    const deliveries = send(team, priya.id, { type: "pull", colour: "green" });

    expect(deliveries).toMatchObject([
      { message: { light: { memberId: tom.id, colour: "amber", status: "Unsure about the schema", helping: null } } },
      { message: { light: { memberId: priya.id, colour: "green" } } },
    ]);
  });

  it("lets the helper leave, or go Clear or Off themselves, without affecting the person", () => {
    const { team, priya, tom, aisha } = createTeam();
    send(team, priya.id, { type: "pull", colour: "red" });
    send(team, tom.id, { type: "join", memberId: priya.id });
    send(team, aisha.id, { type: "join", memberId: priya.id });

    expect(send(team, tom.id, { type: "leave" })).toMatchObject([{ message: { light: { memberId: tom.id, colour: "green", status: null, helping: null } } }]);
    expect(send(team, aisha.id, { type: "pull", colour: "off" })).toMatchObject([{ message: { light: { memberId: aisha.id, colour: "off", helping: null } } }]);
    expect(lightOf(team, priya.id)).toMatchObject({ colour: "red" });
  });

  it("moves you to the new person when you join someone else, keeping your light from before the first", () => {
    const { team, priya, tom, aisha } = createTeam();
    send(team, priya.id, { type: "pull", colour: "red" });
    send(team, aisha.id, { type: "pull", colour: "amber" });
    send(team, tom.id, { type: "join", memberId: priya.id });

    send(team, tom.id, { type: "join", memberId: aisha.id });
    expect(lightOf(team, tom.id)).toMatchObject({ status: "with aisha", helping: aisha.id });

    send(team, aisha.id, { type: "pull", colour: "green" });
    expect(lightOf(team, tom.id)).toMatchObject({ colour: "green", helping: null });
  });

  it("ends the join when someone's Mac has been offline long enough to switch them off", () => {
    const { team, priya, tom } = createTeam();
    send(team, priya.id, { type: "pull", colour: "red" });
    send(team, tom.id, { type: "join", memberId: priya.id });

    expectSuccess(noteDisconnected(team.dependencies, priya.id));
    team.clock.advance(OFFLINE_GRACE_MS);
    expectSuccess(switchOffAbsentMembers(team.dependencies));

    expect(lightOf(team, tom.id)).toMatchObject({ colour: "green", helping: null });
  });

  it("puts helpers back when the person they're with is removed from the team", () => {
    const { team, james, priya, tom } = createTeam();
    send(team, priya.id, { type: "pull", colour: "red" });
    send(team, tom.id, { type: "join", memberId: priya.id });

    expectSuccess(removeMember(team.dependencies, james, priya.id));
    expect(lightOf(team, tom.id)).toMatchObject({ colour: "green", helping: null });
  });

  it("exports joins with the person joined, and keeps them out of the light history", () => {
    const { team, priya, tom } = createTeam();
    send(team, priya.id, { type: "pull", colour: "red" });
    send(team, tom.id, { type: "join", memberId: priya.id });
    const members = expectSuccess(team.dependencies.members.list());

    const csv = toEventsCsv(allEvents(team), members).split("\n");
    expect(csv[0]).toBe("id,at,kind,memberId,name,colour,context,source,withMemberId,withName");
    expect(csv[2]).toContain(`,join,${tom.id},tom,,,,${priya.id},priya`);
  });
});
