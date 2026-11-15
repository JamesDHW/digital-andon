import type { Colour } from "./colour.js";
import type { MemberId } from "./memberId.js";

/** Every pull comes from the app now; "api" only appears on older events, from when CI could pull lights. */
export type PullSource = "app" | "api";

export type AndonEvent =
  | { readonly kind: "pull"; readonly memberId: MemberId; readonly colour: Colour; readonly status: string | null; readonly source: PullSource; readonly at: number }
  | { readonly kind: "status"; readonly memberId: MemberId; readonly status: string | null; readonly at: number };

export type RecordedEvent = AndonEvent & { readonly id: number };
