import { describe, expect, it } from "vitest";

import { createInitialLight } from "../src/domain/light.js";
import { pullCord } from "../src/domain/pullCord.js";
import { normaliseStatus } from "../src/domain/status.js";
import { memberIdOf } from "./support/testTeam.js";

const priya = memberIdOf("priya");
const green = createInitialLight(priya, 0);

describe("pullCord", () => {
  it("starts a new andon when the colour changes", () => {
    const red = pullCord(green, { colour: "red", status: "Deploy blocked", at: 100 });
    expect(red).toEqual({ memberId: priya, colour: "red", status: "Deploy blocked", since: 100 });
  });

  it("keeps the status and start time when the same colour is pulled without a status", () => {
    const red = pullCord(green, { colour: "red", status: "Deploy blocked", at: 100 });
    expect(pullCord(red, { colour: "red", status: undefined, at: 200 })).toEqual(red);
  });

  it("replaces only the status when the same colour is pulled with one", () => {
    const red = pullCord(green, { colour: "red", status: null, at: 100 });
    expect(pullCord(red, { colour: "red", status: "Now with a status", at: 200 })).toEqual({ ...red, status: "Now with a status" });
  });

  it("starts a new period when escalating from amber to red", () => {
    const amber = pullCord(green, { colour: "amber", status: null, at: 100 });
    const red = pullCord(amber, { colour: "red", status: undefined, at: 200 });
    expect(red.since).toBe(200);
  });

  it("keeps the status through amber, red and off", () => {
    const amber = pullCord(green, { colour: "amber", status: "Pairing on the migration", at: 100 });
    const red = pullCord(amber, { colour: "red", status: undefined, at: 200 });
    const off = pullCord(red, { colour: "off", status: undefined, at: 300 });
    expect(off).toEqual({ memberId: priya, colour: "off", status: "Pairing on the migration", since: 300 });
    expect(pullCord(off, { colour: "off", status: undefined, at: 350 })).toEqual(off);
  });

  it("clears the status whenever you go back to green, even if one is sent", () => {
    const off = pullCord(green, { colour: "off", status: "On holiday", at: 100 });
    expect(pullCord(off, { colour: "green", status: undefined, at: 200 })).toEqual({ memberId: priya, colour: "green", status: null, since: 200 });

    const red = pullCord(green, { colour: "red", status: "Help", at: 300 });
    expect(pullCord(red, { colour: "green", status: "ignored", at: 400 })).toEqual({ memberId: priya, colour: "green", status: null, since: 400 });
  });

  it("lets you set a status while green, and green again keeps it", () => {
    const focused = pullCord(green, { colour: "green", status: "Deep work until 3", at: 100 });
    expect(focused).toEqual({ ...green, status: "Deep work until 3" });
    expect(pullCord(focused, { colour: "green", status: undefined, at: 200 })).toEqual(focused);
  });

  it("clears the status when sent null", () => {
    const amber = pullCord(green, { colour: "amber", status: "Stuck", at: 100 });
    expect(pullCord(amber, { colour: "amber", status: null, at: 200 })).toEqual({ ...amber, status: null });
  });
});

describe("normaliseStatus", () => {
  it("collapses whitespace, treats blank as no status and caps the length", () => {
    expect(normaliseStatus("  build\n  broken  ")).toBe("build broken");
    expect(normaliseStatus("   ")).toBeNull();
    expect(normaliseStatus("x".repeat(500))).toHaveLength(140);
  });
});
