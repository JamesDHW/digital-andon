import type { Colour } from "./colour.js";
import type { MemberId } from "./memberId.js";

/** "app" is a person; "offline" is the server switching off someone whose Mac has been gone a while; "join" is a
 * light changed by joining or leaving someone. "api" only appears on older events, from when CI could pull lights. */
export type PullSource = "app" | "offline" | "join" | "api";

export type AndonEvent =
  | { readonly kind: "pull"; readonly memberId: MemberId; readonly colour: Colour; readonly status: string | null; readonly source: PullSource; readonly at: number }
  | { readonly kind: "status"; readonly memberId: MemberId; readonly status: string | null; readonly at: number }
  /** The time from someone's red to their first join is the team's response time. */
  | { readonly kind: "join"; readonly memberId: MemberId; readonly targetId: MemberId; readonly at: number }
  | { readonly kind: "leave"; readonly memberId: MemberId; readonly targetId: MemberId; readonly at: number };

export type RecordedEvent = AndonEvent & { readonly id: number };

/** The events that change a light, as opposed to who is with whom. */
export type LightEvent = Extract<RecordedEvent, { readonly kind: "pull" | "status" }>;

export const isLightEvent = (event: RecordedEvent): event is LightEvent => event.kind === "pull" || event.kind === "status";
