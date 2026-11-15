import { describe, expect, it } from "vitest";

import { authenticateDevice } from "../src/application/auth/authenticate.js";
import { requestLoginCode } from "../src/application/auth/requestLoginCode.js";
import { verifyLoginCode } from "../src/application/auth/verifyLoginCode.js";
import { EmailNotAllowedError, ForbiddenError, InvalidCodeError, RateLimitedError, UnauthorisedError } from "../src/errors/andonError.js";
import { addMember, createTestTeam, expectSuccess, type TestTeam } from "./support/testTeam.js";
import { MINUTE_MS, TEST_ORIGIN } from "./support/testTeam.constants.js";

const lastEmailText = (team: TestTeam): string => team.mailer.sentEmails().at(-1)?.text ?? "";

describe("email codes", () => {
  it("signs an existing member in on a new Mac", async () => {
    const team = createTestTeam();
    const priya = addMember(team, "priya");

    expectSuccess(await requestLoginCode(team.dependencies, "priya@example.com"));
    const code = /^\d{6}$/m.exec(lastEmailText(team))?.[0] ?? "";
    const device = expectSuccess(await verifyLoginCode(team.dependencies, { email: "priya@example.com", code, deviceName: "Mac mini" }));

    expect(expectSuccess(await authenticateDevice(team.dependencies, device.deviceToken)).id).toBe(priya.id);
    expect(await verifyLoginCode(team.dependencies, { email: "priya@example.com", code, deviceName: "Mac mini" })).toBeInstanceOf(InvalidCodeError);
  });

  it("stays silent for unknown addresses and rate-limits resends", async () => {
    const team = createTestTeam();
    addMember(team, "priya");

    expect(await requestLoginCode(team.dependencies, "stranger@example.com")).toBeUndefined();
    expect(team.mailer.sentEmails()).toHaveLength(0);

    expectSuccess(await requestLoginCode(team.dependencies, "priya@example.com"));
    expect(await requestLoginCode(team.dependencies, "priya@example.com")).toBeInstanceOf(RateLimitedError);
    team.clock.advance(MINUTE_MS + 1);
    expectSuccess(await requestLoginCode(team.dependencies, "priya@example.com"));
  });

  it("locks the code after five wrong attempts", async () => {
    const team = createTestTeam();
    addMember(team, "priya");
    expectSuccess(await requestLoginCode(team.dependencies, "priya@example.com"));

    const attempts = await Promise.all([1, 2, 3, 4, 5].map(() => verifyLoginCode(team.dependencies, { email: "priya@example.com", code: "999999", deviceName: "Mac" })));
    expect(attempts.every((attempt) => attempt instanceof InvalidCodeError)).toBe(true);

    const code = /^\d{6}$/m.exec(lastEmailText(team))?.[0] ?? "";
    expect(await verifyLoginCode(team.dependencies, { email: "priya@example.com", code, deviceName: "Mac" })).toBeInstanceOf(RateLimitedError);
  });

  it("creates the first admin from the bootstrap address on an empty team only", async () => {
    const team = createTestTeam({ bootstrapAdminEmail: "james@example.com" });

    expectSuccess(await requestLoginCode(team.dependencies, "James@Example.com"));
    expect(expectSuccess(team.dependencies.members.findByEmail("james@example.com"))).toMatchObject({ role: "admin", name: "james" });
  });

  it("rejects unknown device tokens", async () => {
    const team = createTestTeam();
    expect(await authenticateDevice(team.dependencies, "not-a-token")).toBeInstanceOf(UnauthorisedError);
  });
});
