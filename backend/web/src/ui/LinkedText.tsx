import type { ReactElement } from "react";

import { splitLinks, type ContextPiece } from "../domain/links.js";

type LinkedTextProps = {
  readonly text: string;
};

/** Someone's context with any links clickable, opening in a new tab. */
export const LinkedText = ({ text }: LinkedTextProps): ReactElement => (
  <>
    {splitLinks(text).map((piece, index) => (
      <Piece key={`${String(index)}-${piece.text}`} piece={piece} />
    ))}
  </>
);

type PieceProps = {
  readonly piece: ContextPiece;
};

const Piece = ({ piece }: PieceProps): ReactElement => {
  if (piece.kind === "text") return <>{piece.text}</>;
  return (
    <a href={piece.href} target="_blank" rel="noopener noreferrer" className="break-all text-ink underline decoration-ink-muted underline-offset-2 hover:decoration-ink">
      {piece.text}
    </a>
  );
};
