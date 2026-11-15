import type { Colour } from "./colour.js";
import type { MemberId } from "./memberId.js";

/** "app" is a person; "offline" is the server switching off someone whose Mac has been gone a while.
 * "api" only appears on older events, from when CI could pull lights. */
export type PullSource = "app" | "offline" | "api";

export type AndonEvent =
  | { readonly kind: "pull"; readonly memberId: MemberId; readonly colour: Colour; readonly status: string | null; readonly source: PullSource; readonly at: number }
  | { readonly kind: "status"; readonly memberId: MemberId; readonly status: string | null; readonly at: number };

export type RecordedEvent = AndonEvent & { readonly id: number };
