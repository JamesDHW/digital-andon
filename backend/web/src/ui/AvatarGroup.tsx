import type { ReactElement } from "react";

import type { Colour } from "@backend/domain/colour.js";
import type { Member } from "@backend/domain/member.js";
import type { Companion } from "../domain/board.js";
import { Avatar } from "./Avatar.js";
import { HELPER_OVERLAP, HELPER_SCALE } from "./ui.constants.js";

type AvatarGroupProps = {
  readonly member: Member;
  readonly colour: Colour | null;
  readonly size: number;
  readonly isBreathing: boolean;
  readonly isFaded: boolean;
  /** Everyone who has joined them: drawn a little smaller, tucked behind to the right. */
  readonly helpers: readonly Companion[];
};

/** A person's face, with whoever has joined them behind it, so everyone can see the problem is being looked at. */
export const AvatarGroup = ({ member, colour, size, isBreathing, isFaded, helpers }: AvatarGroupProps): ReactElement => {
  const helperSize = Math.round(size * HELPER_SCALE);
  const step = Math.round(helperSize * HELPER_OVERLAP);
  const width = helpers.length === 0 ? size : size - helperSize + step * helpers.length + helperSize;
  return (
    <span className="relative inline-block shrink-0" style={{ width, height: size }}>
      {helpers.map((helper, index) => (
        <span
          key={helper.member.id}
          className="absolute rounded-full"
          style={{ left: size - helperSize + step * (index + 1), top: (size - helperSize) / 2, zIndex: helpers.length - index, boxShadow: "0 0 0 2px var(--surface-raised)" }}
        >
          <Avatar member={helper.member} colour={helper.colour} size={helperSize} isBreathing={false} isFaded={isFaded} />
        </span>
      ))}
      <span className="absolute top-0 left-0 rounded-full" style={{ zIndex: helpers.length + 1, boxShadow: helpers.length === 0 ? "none" : "0 0 0 2px var(--surface-raised)" }}>
        <Avatar member={member} colour={colour} size={size} isBreathing={isBreathing} isFaded={isFaded} />
      </span>
    </span>
  );
};
