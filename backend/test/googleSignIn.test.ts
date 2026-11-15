import { describe, expect, it } from "vitest";

import { authenticateDevice } from "../src/application/auth/authenticate.js";
import { completeGoogleSignIn, startGoogleSignIn, takeSignInAttempt } from "../src/application/auth/googleSignIn.js";
import type { GoogleProfile } from "../src/application/ports/googleIdentity.js";
import { EmailNotAllowedError, InvalidCodeError, NotFoundError } from "../src/errors/andonError.js";
import { addMember, createTestTeam, expectSuccess, type TestTeam } from "./support/testTeam.js";
import { MINUTE_MS, TEST_ORIGIN } from "./support/testTeam.constants.js";

const priyaAtTheodo: GoogleProfile = {
  email: "Priya@Theodo.com",
  isEmailVerified: true,
  name: "Priya Shah",
  pictureUrl: "https://lh3.googleusercontent.com/a/priya=s256-c",
};

const stateFrom = (authorisationUrl: string): string => {
  const state = new URL(authorisationUrl).searchParams.get("state");
  return state ?? "";
};

/** Leaves for Google, comes back with Google's code, and returns what the app or admin page receives. */
const signInWithGoogle = async (team: TestTeam, profile: GoogleProfile) => {
  team.google.signInAs(profile);
  const authorisationUrl = expectSuccess(await startGoogleSignIn(team.dependencies, { client: "app", deviceName: "Priya's MacBook" }));
  const attempt = expectSuccess(await takeSignInAttempt(team.dependencies, stateFrom(authorisationUrl)));
  return completeGoogleSignIn(team.dependencies, attempt, "google-code");
};

describe("Google sign-in", () => {
  it("lets someone on an allowed domain join on their own, with their Google name and photo", async () => {
    const team = createTestTeam({ allowedDomains: ["theodo.com"] });

    const signedIn = expectSuccess(await signInWithGoogle(team, priyaAtTheodo));
    const priya = expectSuccess(await authenticateDevice(team.dependencies, signedIn.deviceToken));

    expect(priya).toMatchObject({ name: "Priya Shah", email: "priya@theodo.com", role: "member", avatarUrl: priyaAtTheodo.pictureUrl });
    expect(signedIn.deliveries).toMatchObject([{ audience: { kind: "everyone" }, message: { type: "member", member: { id: priya.id } } }]);
  });

  it("refuses domains that aren't listed, and lets nobody join on their own while the list is empty", async () => {
    const listed = createTestTeam({ allowedDomains: ["theodo.com"] });
    expect(await signInWithGoogle(listed, { ...priyaAtTheodo, email: "priya@gmail.com" })).toBeInstanceOf(EmailNotAllowedError);

    const unlisted = createTestTeam();
    expect(await signInWithGoogle(unlisted, priyaAtTheodo)).toBeInstanceOf(EmailNotAllowedError);
  });

  it("makes the bootstrap address an admin even before any domain is allowed", async () => {
    const team = createTestTeam({ bootstrapAdminEmail: "james@theodo.com" });

    const signedIn = expectSuccess(await signInWithGoogle(team, { ...priyaAtTheodo, email: "James@theodo.com", name: "James" }));

    expect(expectSuccess(await authenticateDevice(team.dependencies, signedIn.deviceToken))).toMatchObject({ role: "admin" });
  });

  it("signs in an existing member, adding their Google photo only if they have none", async () => {
    const team = createTestTeam({ allowedDomains: ["example.com"] });
    const tom = addMember(team, "tom");
    const aisha = { ...addMember(team, "aisha"), avatarUrl: `${TEST_ORIGIN}/avatars/aisha.png` };
    team.dependencies.members.save(aisha);

    const tomSignedIn = expectSuccess(await signInWithGoogle(team, { ...priyaAtTheodo, email: tom.email, name: "Thomas" }));
    expect(expectSuccess(await authenticateDevice(team.dependencies, tomSignedIn.deviceToken))).toMatchObject({
      id: tom.id,
      name: "tom",
      avatarUrl: priyaAtTheodo.pictureUrl,
    });

    const aishaSignedIn = expectSuccess(await signInWithGoogle(team, { ...priyaAtTheodo, email: aisha.email }));
    expect(expectSuccess(await authenticateDevice(team.dependencies, aishaSignedIn.deviceToken))).toMatchObject({ avatarUrl: aisha.avatarUrl });
    expect(aishaSignedIn.deliveries).toEqual([]);
  });

  it("refuses an email Google hasn't verified", async () => {
    const team = createTestTeam({ allowedDomains: ["theodo.com"] });
    expect(await signInWithGoogle(team, { ...priyaAtTheodo, isEmailVerified: false })).toBeInstanceOf(EmailNotAllowedError);
  });

  it("keeps the PKCE verifier on the server, hints at the only allowed domain, and returns to the callback", async () => {
    const team = createTestTeam({ allowedDomains: ["theodo.com"] });
    team.google.signInAs(priyaAtTheodo);

    const authorisationUrl = expectSuccess(await startGoogleSignIn(team.dependencies, { client: "web", deviceName: "Admin page" }));
    expect(authorisationUrl).not.toContain(team.google.lastAuthorisation()?.codeVerifier ?? "missing");
    expect(team.google.lastAuthorisation()).toMatchObject({ domainHint: "theodo.com", redirectUri: `${TEST_ORIGIN}/auth/google/callback` });

    const attempt = expectSuccess(await takeSignInAttempt(team.dependencies, stateFrom(authorisationUrl)));
    expect(attempt).toMatchObject({ client: "web", deviceName: "Admin page" });
    expectSuccess(await completeGoogleSignIn(team.dependencies, attempt, "google-code"));
    expect(team.google.lastExchange()?.codeVerifier).toBe(team.google.lastAuthorisation()?.codeVerifier);
  });

  it("accepts each return from Google once, within ten minutes", async () => {
    const team = createTestTeam({ allowedDomains: ["theodo.com"] });
    const first = expectSuccess(await startGoogleSignIn(team.dependencies, { client: "app", deviceName: "Mac" }));
    const second = expectSuccess(await startGoogleSignIn(team.dependencies, { client: "app", deviceName: "Mac" }));

    expectSuccess(await takeSignInAttempt(team.dependencies, stateFrom(first)));
    expect(await takeSignInAttempt(team.dependencies, stateFrom(first))).toBeInstanceOf(InvalidCodeError);
    expect(await takeSignInAttempt(team.dependencies, "made-up-state")).toBeInstanceOf(InvalidCodeError);

    team.clock.advance(11 * MINUTE_MS);
    expect(await takeSignInAttempt(team.dependencies, stateFrom(second))).toBeInstanceOf(InvalidCodeError);
  });

  it("says so when Google isn't set up", async () => {
    const team = createTestTeam();
    const withoutGoogle = { ...team.dependencies, google: null };
    expect(await startGoogleSignIn(withoutGoogle, { client: "app", deviceName: "Mac" })).toBeInstanceOf(NotFoundError);
  });
});
