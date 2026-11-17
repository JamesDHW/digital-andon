import { LINK_PATTERN, TRAILING_PUNCTUATION } from "./links.constants.js";

/** A piece of someone's context: plain text, or a link to open. */
export type ContextPiece =
  | { readonly kind: "text"; readonly text: string }
  | { readonly kind: "link"; readonly text: string; readonly href: string };

/** The context split into text and http(s) links, in order, so the links can be made clickable. */
export const splitLinks = (text: string): readonly ContextPiece[] => {
  const matches = [...text.matchAll(LINK_PATTERN)].map((match) => {
    const href = match[0].replace(TRAILING_PUNCTUATION, "");
    return { start: match.index, end: match.index + href.length, href };
  });
  const starts = [0, ...matches.map((match) => match.end)];
  return matches
    .flatMap((match, index): ContextPiece[] => [
      { kind: "text", text: text.slice(starts[index] ?? 0, match.start) },
      { kind: "link", text: match.href, href: match.href },
    ])
    .concat([{ kind: "text", text: text.slice(starts.at(-1) ?? 0) }])
    .filter((piece) => piece.text.length > 0);
};
