import { describe, expect, it } from "vitest";

import { handleClientMessage } from "../src/application/handleClientMessage.js";
import { issueDevice } from "../src/application/auth/issueDevice.js";
import { readHistory } from "../src/application/history/readHistory.js";
import type { Member } from "../src/domain/member.js";
import { InvalidRequestError } from "../src/errors/andonError.js";
import { routeRequest } from "../src/http/routeRequest.js";
import { addMember, createTestTeam, expectSuccess, type TestTeam } from "./support/testTeam.js";
import { DAY_MS, DURABLE_OBJECT_MAX_BOUND_PARAMETERS, MINUTE_MS, TEST_ORIGIN, TEST_START_TIME } from "./support/testTeam.constants.js";

/** Priya: red with a status at +10 min, a new status at +20, amber at +30, green at +40. Tom: off at +15. */
const createBusyMorning = (): { readonly team: TestTeam; readonly priya: Member; readonly tom: Member } => {
  const team = createTestTeam();
  const priya = addMember(team, "priya");
  const tom = addMember(team, "tom");
  const at = (minutes: number): void => team.clock.advance(minutes * MINUTE_MS);
  at(10);
  expectSuccess(handleClientMessage(team.dependencies, priya.id, { type: "pull", colour: "red", status: "Deploy blocked" }));
  at(5);
  expectSuccess(handleClientMessage(team.dependencies, tom.id, { type: "pull", colour: "off" }));
  at(5);
  expectSuccess(handleClientMessage(team.dependencies, priya.id, { type: "status", status: "Waiting on infra" }));
  at(10);
  expectSuccess(handleClientMessage(team.dependencies, priya.id, { type: "pull", colour: "amber" }));
  at(10);
  expectSuccess(handleClientMessage(team.dependencies, priya.id, { type: "pull", colour: "green" }));
  return { team, priya, tom };
};

const minutesIn = (minutes: number): number => TEST_START_TIME + minutes * MINUTE_MS;

describe("team history", () => {
  it("starts each person at their light when the window opens, then lists every change inside it", () => {
    const { team, priya, tom } = createBusyMorning();

    const history = expectSuccess(readHistory(team.dependencies, { from: minutesIn(18), to: minutesIn(35), memberIds: [priya.id, tom.id] }));

    expect(history.members).toEqual([
      {
        memberId: priya.id,
        start: { at: minutesIn(18), colour: "red", status: "Deploy blocked" },
        changes: [
          { at: minutesIn(20), colour: "red", status: "Waiting on infra" },
          { at: minutesIn(30), colour: "amber", status: "Waiting on infra" },
        ],
        joins: [],
      },
      { memberId: tom.id, start: { at: minutesIn(18), colour: "off", status: null }, changes: [], joins: [] },
    ]);
    expect(history.isTruncated).toBe(false);
  });

  it("starts someone who never changed their light at Clear", () => {
    const team = createTestTeam();
    const aisha = addMember(team, "aisha");
    const history = expectSuccess(readHistory(team.dependencies, { from: minutesIn(0), to: minutesIn(60), memberIds: [aisha.id] }));
    expect(history.members[0]?.start).toEqual({ at: minutesIn(0), colour: "green", status: null });
  });

  it("reads the history of more people than a query may bind parameters for", () => {
    const team = createTestTeam();
    const priya = addMember(team, "priya");
    const tom = addMember(team, "tom");
    const everyone = [priya, tom, ...Array.from({ length: 148 }, (_, index) => addMember(team, `person${index}`))];
    team.clock.advance(5 * MINUTE_MS);
    expectSuccess(handleClientMessage(team.dependencies, priya.id, { type: "pull", colour: "red", status: "Flaky test" }));
    team.clock.advance(5 * MINUTE_MS);
    expectSuccess(handleClientMessage(team.dependencies, tom.id, { type: "join", memberId: priya.id }));

    const history = expectSuccess(readHistory(team.dependencies, { from: minutesIn(0), to: minutesIn(60), memberIds: everyone.map((member) => member.id) }));

    expect(history.members).toHaveLength(150);
    expect(history.members[0]?.changes).toEqual([{ at: minutesIn(5), colour: "red", status: "Flaky test" }]);
    expect(history.members[0]?.joins).toEqual([{ at: minutesIn(10), kind: "join", helperId: tom.id, targetId: priya.id }]);
    expect(team.mostBoundParameters()).toBeLessThanOrEqual(DURABLE_OBJECT_MAX_BOUND_PARAMETERS);
  });

  it("knows who was with whom when a window opens, from joins in the week before it", () => {
    const team = createTestTeam();
    const priya = addMember(team, "priya");
    const tom = addMember(team, "tom");
    const aisha = addMember(team, "aisha");
    expectSuccess(handleClientMessage(team.dependencies, priya.id, { type: "pull", colour: "red" }));
    expectSuccess(handleClientMessage(team.dependencies, tom.id, { type: "join", memberId: priya.id }));
    team.clock.advance(2 * DAY_MS);
    expectSuccess(handleClientMessage(team.dependencies, aisha.id, { type: "join", memberId: priya.id }));
    team.clock.advance(6 * DAY_MS);
    const opens = team.clock.now();

    const history = expectSuccess(readHistory(team.dependencies, { from: opens, to: opens + MINUTE_MS, memberIds: [priya.id] }));

    expect(history.members[0]?.joins).toEqual([{ at: opens - 6 * DAY_MS, kind: "join", helperId: aisha.id, targetId: priya.id }]);
  });

  it("refuses a window that ends before it starts", () => {
    const team = createTestTeam();
    expect(readHistory(team.dependencies, { from: minutesIn(10), to: minutesIn(5), memberIds: [] })).toBeInstanceOf(InvalidRequestError);
  });
});

describe("web endpoints", () => {
  const get = async (team: TestTeam, path: string, token: string) => {
    const request = new Request(`${TEST_ORIGIN}${path}`, { headers: { authorization: `Bearer ${token}` } });
    return routeRequest({ request, url: new URL(request.url), dependencies: team.dependencies, isDevelopmentMode: false });
  };

  const signIn = async (team: TestTeam, member: Member): Promise<string> => {
    const device = expectSuccess(await issueDevice(team.dependencies, member, "Test"));
    return device.deviceToken;
  };

  it("gives any member the snapshot and history, and filters the admin CSV by person and time", async () => {
    const { team, priya } = createBusyMorning();
    const james = addMember(team, "james", "admin");
    const priyaToken = await signIn(team, priya);
    const adminToken = await signIn(team, james);

    const snapshot = await get(team, "/team/snapshot", priyaToken);
    expect(await snapshot.response.json()).toMatchObject({ type: "hello", you: priya.id });

    const history = await get(team, `/team/history?from=${minutesIn(0)}&to=${minutesIn(60)}&memberIds=${priya.id}`, priyaToken);
    expect(history.response.status).toBe(200);

    const csv = await get(team, `/team/events?format=csv&from=${minutesIn(25)}&to=${minutesIn(60)}&memberIds=${priya.id}`, adminToken);
    const lines = (await csv.response.text()).split("\n");
    expect(lines[0]).toBe("id,at,kind,memberId,name,colour,context,source,withMemberId,withName");
    expect(lines.slice(1).map((line) => line.split(",")[5])).toEqual(["amber", "green"]);
    expect(lines[1]).toContain(",priya,");

    expect((await get(team, "/team/events?format=csv", priyaToken)).response.status).toBe(403);
  });

  it("pages the admin CSV: a full page says where the next starts, and the last says nothing", async () => {
    const { team } = createBusyMorning();
    const adminToken = await signIn(team, addMember(team, "james", "admin"));

    const first = await get(team, "/team/events?format=csv&limit=3", adminToken);
    const nextAfterId = first.response.headers.get("x-next-after-id");
    expect(first.response.headers.get("x-event-count")).toBe("3");
    expect(nextAfterId).toBe((await first.response.text()).split("\n")[3]?.split(",")[0]);

    const last = await get(team, `/team/events?format=csv&limit=3&afterId=${nextAfterId ?? ""}`, adminToken);
    expect(last.response.headers.get("x-event-count")).toBe("2");
    expect(last.response.headers.get("x-next-after-id")).toBeNull();
  });
});
