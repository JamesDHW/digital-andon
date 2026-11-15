import { describe, expect, it } from "vitest";

import { handleClientMessage } from "../src/application/handleClientMessage.js";
import { noteConnected, noteDisconnected, switchOffAbsentMembers } from "../src/application/presence/offlineLights.js";
import { OFFLINE_GRACE_MS } from "../src/application/presence/presence.constants.js";
import { addMember, createTestTeam, expectSuccess } from "./support/testTeam.js";
import { MINUTE_MS, TEST_START_TIME } from "./support/testTeam.constants.js";

describe("going offline", () => {
  it("switches someone off once their Mac has been gone for the grace period, keeping their status", () => {
    const team = createTestTeam();
    const priya = addMember(team, "priya");
    expectSuccess(handleClientMessage(team.dependencies, priya.id, { type: "pull", colour: "red", status: "Deploy blocked" }));

    expect(expectSuccess(noteDisconnected(team.dependencies, priya.id))).toBe(TEST_START_TIME + OFFLINE_GRACE_MS);
    team.clock.advance(MINUTE_MS);
    expect(expectSuccess(switchOffAbsentMembers(team.dependencies))).toEqual({ deliveries: [], nextCheckAt: TEST_START_TIME + OFFLINE_GRACE_MS });

    team.clock.advance(OFFLINE_GRACE_MS);
    const sweep = expectSuccess(switchOffAbsentMembers(team.dependencies));
    expect(sweep.deliveries).toMatchObject([{ message: { type: "light", light: { memberId: priya.id, colour: "off", status: "Deploy blocked" } } }]);
    expect(sweep.nextCheckAt).toBeNull();
    const events = expectSuccess(team.dependencies.events.list({ afterId: 0, limit: 10, from: null, to: null, memberIds: null }));
    expect(events.at(-1)).toMatchObject({ kind: "pull", colour: "off", source: "offline" });
  });

  it("leaves someone alone if they come back in time, or are already off", () => {
    const team = createTestTeam();
    const priya = addMember(team, "priya");
    const tom = addMember(team, "tom");
    expectSuccess(handleClientMessage(team.dependencies, tom.id, { type: "pull", colour: "off" }));

    expectSuccess(noteDisconnected(team.dependencies, priya.id));
    expectSuccess(noteDisconnected(team.dependencies, tom.id));
    expectSuccess(noteConnected(team.dependencies, priya.id));
    team.clock.advance(OFFLINE_GRACE_MS);

    expect(expectSuccess(switchOffAbsentMembers(team.dependencies)).deliveries).toEqual([]);
  });

  it("doesn't switch off someone who reconnected on another Mac", () => {
    const team = createTestTeam();
    const priya = addMember(team, "priya");
    expectSuccess(noteDisconnected(team.dependencies, priya.id));
    team.clock.advance(OFFLINE_GRACE_MS);

    const withPriyaOnline = { ...team.dependencies, onlineMembers: () => [priya.id] };
    expect(expectSuccess(switchOffAbsentMembers(withPriyaOnline)).deliveries).toEqual([]);
  });
});
