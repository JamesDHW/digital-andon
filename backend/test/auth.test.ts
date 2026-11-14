import { describe, expect, it } from "vitest";

import { authenticateDevice } from "../src/application/auth/authenticate.js";
import { inviteMember } from "../src/application/auth/inviteMember.js";
import { redeemInvite } from "../src/application/auth/redeemInvite.js";
import { requestLoginCode } from "../src/application/auth/requestLoginCode.js";
import { verifyLoginCode } from "../src/application/auth/verifyLoginCode.js";
import { EmailNotAllowedError, ForbiddenError, InvalidCodeError, RateLimitedError, UnauthorisedError } from "../src/errors/andonError.js";
import { addMember, createTestTeam, expectSuccess, type TestTeam } from "./support/testTeam.js";
import { MINUTE_MS, TEST_ORIGIN } from "./support/testTeam.constants.js";

const inviteCodeFrom = (joinLink: string): string => {
  const code = new URL(joinLink).searchParams.get("code");
  return code ?? "";
};

const lastEmailText = (team: TestTeam): string => team.mailer.sentEmails().at(-1)?.text ?? "";

describe("invites", () => {
  it("emails a join link, and redeeming it creates the member who the inviter then follows", async () => {
    const team = createTestTeam({ allowedDomains: ["example.com"] });
    const james = addMember(team, "james", "admin");

    const invite = expectSuccess(await inviteMember(team.dependencies, { inviter: james, email: "Priya@Example.com ", name: "Priya" }));
    expect(invite.joinLink.startsWith(`${TEST_ORIGIN}/join/?code=`)).toBe(true);
    expect(invite.isEmailSent).toBe(true);
    expect(lastEmailText(team)).toContain(invite.joinLink);

    const redeemed = expectSuccess(await redeemInvite(team.dependencies, { code: inviteCodeFrom(invite.joinLink), deviceName: "Priya's MacBook" }));
    const priya = expectSuccess(await authenticateDevice(team.dependencies, redeemed.deviceToken));
    expect(priya).toMatchObject({ name: "Priya", email: "priya@example.com", role: "member" });
    expect(expectSuccess(team.dependencies.follows.listFollowing(james.id))).toEqual([priya.id]);
    expect(redeemed.deliveries).toMatchObject([
      { audience: { kind: "everyone" }, message: { type: "member", member: { id: priya.id } } },
      { audience: { kind: "member", memberId: james.id }, message: { type: "follows", memberIds: [priya.id] } },
    ]);
  });

  it("works once, and not after 48 hours", async () => {
    const team = createTestTeam();
    const james = addMember(team, "james", "admin");
    const first = expectSuccess(await inviteMember(team.dependencies, { inviter: james, email: "a@example.com", name: "A" }));
    const second = expectSuccess(await inviteMember(team.dependencies, { inviter: james, email: "b@example.com", name: "B" }));

    expectSuccess(await redeemInvite(team.dependencies, { code: inviteCodeFrom(first.joinLink), deviceName: "Mac" }));
    expect(await redeemInvite(team.dependencies, { code: inviteCodeFrom(first.joinLink), deviceName: "Mac" })).toBeInstanceOf(InvalidCodeError);

    team.clock.advance(49 * 60 * MINUTE_MS);
    expect(await redeemInvite(team.dependencies, { code: inviteCodeFrom(second.joinLink), deviceName: "Mac" })).toBeInstanceOf(InvalidCodeError);
  });

  it("is admin-only and limited to allowed domains", async () => {
    const team = createTestTeam({ allowedDomains: ["theodo.co.uk"] });
    const james = addMember(team, "james", "admin");
    const priya = addMember(team, "priya");

    expect(await inviteMember(team.dependencies, { inviter: priya, email: "x@theodo.co.uk", name: "X" })).toBeInstanceOf(ForbiddenError);
    expect(await inviteMember(team.dependencies, { inviter: james, email: "x@gmail.com", name: "X" })).toBeInstanceOf(EmailNotAllowedError);
  });
});

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
