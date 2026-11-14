import type { Colour } from "./colour.js";
import type { MemberId } from "./memberId.js";

export type PullSource = "app" | "api";

export type AndonEvent =
  | { readonly kind: "pull"; readonly memberId: MemberId; readonly colour: Colour; readonly topic: string | null; readonly source: PullSource; readonly at: number }
  | { readonly kind: "topic"; readonly memberId: MemberId; readonly topic: string | null; readonly at: number }
  | { readonly kind: "note"; readonly memberId: MemberId; readonly note: string; readonly at: number };

export type RecordedEvent = AndonEvent & { readonly id: number };
