import { describe, expect, it } from "vitest";

import { createInitialLight } from "../src/domain/light.js";
import { pullCord } from "../src/domain/pullCord.js";
import { normaliseTopic } from "../src/domain/topic.js";
import { memberIdOf } from "./support/testTeam.js";

const priya = memberIdOf("priya");
const green = createInitialLight(priya, 0);

describe("pullCord", () => {
  it("starts a new andon when the colour changes", () => {
    const red = pullCord(green, { colour: "red", topic: "Deploy blocked", at: 100 });
    expect(red).toEqual({ memberId: priya, colour: "red", topic: "Deploy blocked", since: 100 });
  });

  it("keeps the topic and start time when the same colour is pulled without a topic", () => {
    const red = pullCord(green, { colour: "red", topic: "Deploy blocked", at: 100 });
    expect(pullCord(red, { colour: "red", topic: undefined, at: 200 })).toEqual(red);
  });

  it("replaces only the topic when the same colour is pulled with one", () => {
    const red = pullCord(green, { colour: "red", topic: null, at: 100 });
    expect(pullCord(red, { colour: "red", topic: "Now with a topic", at: 200 })).toEqual({ ...red, topic: "Now with a topic" });
  });

  it("starts a new period when escalating from amber to red", () => {
    const amber = pullCord(green, { colour: "amber", topic: null, at: 100 });
    const red = pullCord(amber, { colour: "red", topic: undefined, at: 200 });
    expect(red.since).toBe(200);
  });

  it("switches off without a topic, and back on as a fresh green", () => {
    const red = pullCord(green, { colour: "red", topic: "Help", at: 100 });
    const off = pullCord(red, { colour: "off", topic: "ignored", at: 200 });
    expect(off).toEqual({ memberId: priya, colour: "off", topic: null, since: 200 });
    expect(pullCord(off, { colour: "off", topic: undefined, at: 250 })).toBe(off);
    expect(pullCord(off, { colour: "green", topic: undefined, at: 300 })).toEqual({ memberId: priya, colour: "green", topic: null, since: 300 });
  });

  it("resolves to green without a topic, and green again is a no-op", () => {
    const red = pullCord(green, { colour: "red", topic: "Help", at: 100 });
    const resolved = pullCord(red, { colour: "green", topic: "ignored", at: 300 });
    expect(resolved).toEqual({ memberId: priya, colour: "green", topic: null, since: 300 });
    expect(pullCord(resolved, { colour: "green", topic: undefined, at: 400 })).toBe(resolved);
  });
});

describe("normaliseTopic", () => {
  it("collapses whitespace, treats blank as no topic and caps the length", () => {
    expect(normaliseTopic("  build\n  broken  ")).toBe("build broken");
    expect(normaliseTopic("   ")).toBeNull();
    expect(normaliseTopic("x".repeat(500))).toHaveLength(140);
  });
});
