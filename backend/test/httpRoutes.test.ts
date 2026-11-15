import { describe, expect, it } from "vitest";
import { z } from "zod";

import { routeRequest } from "../src/http/routeRequest.js";
import { addMember, createTestTeam, expectSuccess, type TestTeam } from "./support/testTeam.js";
import { TEST_ORIGIN } from "./support/testTeam.constants.js";

const deviceResponseSchema = z.object({ deviceToken: z.string() });
const followsResponseSchema = z.object({ memberIds: z.array(z.string()) });

const send = async (team: TestTeam, method: string, path: string, options: { readonly token?: string; readonly body?: unknown } = {}) => {
  const headers = new Headers({ "content-type": "application/json" });
  if (options.token !== undefined) {
    headers.set("authorization", `Bearer ${options.token}`);
  }
  const request = new Request(`${TEST_ORIGIN}${path}`, { method, headers, body: options.body === undefined ? null : JSON.stringify(options.body) });
  return routeRequest({ request, url: new URL(request.url), dependencies: team.dependencies, isDevelopmentMode: false });
};

const signInAs = async (team: TestTeam, email: string): Promise<string> => {
  await send(team, "POST", "/auth/code/request", { body: { email } });
  const code = /^\d{6}$/m.exec(team.mailer.sentEmails().at(-1)?.text ?? "")?.[0] ?? "";
  const outcome = await send(team, "POST", "/auth/code/verify", { body: { email, code, deviceName: "Test Mac" } });
  return deviceResponseSchema.parse(await outcome.response.json()).deviceToken;
};

describe("HTTP endpoints", () => {
  it("runs the admin journey: sign in, follow someone and export the event log", async () => {
    const team = createTestTeam({ bootstrapAdminEmail: "james@example.com" });
    const adminToken = await signInAs(team, "james@example.com");
    const priya = addMember(team, "priya");

    const followed = await send(team, "PUT", "/me/follows", { token: adminToken, body: { memberIds: [priya.id] } });
    expect(followsResponseSchema.parse(await followed.response.json()).memberIds).toEqual([priya.id]);

    const csv = await send(team, "GET", "/team/events?format=csv", { token: adminToken });
    expect(csv.response.headers.get("content-type")).toContain("text/csv");
  });

  it("answers 401 without a token, 403 for admin endpoints and 404 for unknown paths", async () => {
    const team = createTestTeam();
    addMember(team, "priya");
    const priyaToken = await signInAs(team, "priya@example.com");

    expect((await send(team, "GET", "/me")).response.status).toBe(401);
    expect((await send(team, "GET", "/team/settings", { token: priyaToken })).response.status).toBe(403);
    expect((await send(team, "GET", "/nowhere", { token: priyaToken })).response.status).toBe(404);
  });

  it("signs in with Google: the app gets an andon:// redirect, the web app a URL fragment, and a cancel says so", async () => {
    const team = createTestTeam({ allowedDomains: ["theodo.com"] });
    team.google.signInAs({ email: "priya@theodo.com", isEmailVerified: true, name: "Priya", pictureUrl: null });
    const returnFromGoogle = async (client: string, query: string): Promise<string> => {
      const start = await send(team, "GET", `/auth/google/start?client=${client}&device=Priya%27s%20Mac`);
      expect(start.response.status).toBe(302);
      const googleAddress = start.response.headers.get("location");
      const state = new URL(googleAddress ?? "").searchParams.get("state");
      const callback = await send(team, "GET", `/auth/google/callback?state=${encodeURIComponent(state ?? "")}${query}`);
      expect(callback.response.status).toBe(302);
      const returnAddress = callback.response.headers.get("location");
      return returnAddress ?? "";
    };

    const appAddress = new URL(await returnFromGoogle("app", "&code=google-code"));
    expect(`${appAddress.protocol}//${appAddress.host}`).toBe("andon://signed-in");
    const appToken = appAddress.searchParams.get("token") ?? "";
    expect((await send(team, "GET", "/me", { token: appToken })).response.status).toBe(200);

    const webAddress = await returnFromGoogle("web", "&code=google-code");
    expect(webAddress.startsWith(`${TEST_ORIGIN}/#token=`)).toBe(true);

    const cancelled = new URL(await returnFromGoogle("app", "&error=access_denied"));
    expect(cancelled.searchParams.get("error")).toBe("Google sign-in was cancelled.");

    const replayed = await send(team, "GET", "/auth/google/callback?state=made-up&code=google-code");
    expect(replayed.response.status).toBe(400);
  });

  it("refuses development sign-in unless DEV_MODE is on", async () => {
    const team = createTestTeam();
    const outcome = await send(team, "POST", "/dev/sign-in", { body: { email: "x@example.com", name: "X" } });
    expect(outcome.response.status).toBe(403);
  });

  it("lets people change only their name: photos come from Google", async () => {
    const team = createTestTeam();
    addMember(team, "priya");
    const priyaToken = await signInAs(team, "priya@example.com");

    expect((await send(team, "PATCH", "/me", { token: priyaToken, body: { name: "" } })).response.status).toBe(400);
    const updated = await send(team, "PATCH", "/me", { token: priyaToken, body: { name: "Priya S", avatarUrl: "https://example.com/me.png" } });
    expect(await updated.response.json()).toMatchObject({ name: "Priya S", avatarUrl: null });
    expect((await send(team, "PUT", "/me/avatar", { token: priyaToken })).response.status).toBe(404);
  });
});
