import { useState, type ReactElement } from "react";

import type { Colour } from "@backend/domain/colour.js";
import type { Member } from "@backend/domain/member.js";
import { AVATAR_BACKGROUNDS, FADED_OPACITY, SIGNAL_COLOUR } from "./ui.constants.js";

type AvatarProps = {
  readonly member: Member;
  /** Null draws the face alone; off draws no ring. */
  readonly colour: Colour | null;
  readonly size: number;
  readonly isBreathing: boolean;
  readonly isFaded: boolean;
};

/** Their Google photo (or initial) inside a thick ring in their light's colour, as in the menu bar. */
export const Avatar = ({ member, colour, size, isBreathing, isFaded }: AvatarProps): ReactElement => {
  const ringWidth = Math.max(2, Math.round(size * 0.085));
  const ringColour = colour === "off" ? null : colour;
  const faceSize = ringColour === null ? size : size - (ringWidth + Math.max(1, Math.round(size * 0.03))) * 2;
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center rounded-full" style={{ width: size, height: size, opacity: isFaded ? FADED_OPACITY : 1 }}>
      {ringColour !== null && (
        <span
          className={`absolute inset-0 rounded-full ${ringColour === "red" ? "hdr-red" : ""} ${isBreathing ? "breathing" : ""}`}
          style={{ boxShadow: `inset 0 0 0 ${ringWidth}px ${SIGNAL_COLOUR[ringColour]}` }}
        />
      )}
      <Face member={member} size={faceSize} />
    </span>
  );
};

type FaceProps = {
  readonly member: Member;
  readonly size: number;
};

const Face = ({ member, size }: FaceProps): ReactElement => {
  const [hasFailed, setHasFailed] = useState(false);
  const photo = hasFailed ? null : member.avatarUrl;
  const handlePhotoError = (): void => setHasFailed(true);
  if (photo !== null) {
    return <img src={photo} alt="" referrerPolicy="no-referrer" onError={handlePhotoError} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.4, background: backgroundFor(member.id) }}
    >
      {initials(member.name)}
    </span>
  );
};

/** The same pick as the Mac app: the sum of the id's character codes. */
const backgroundFor = (memberId: string): string => {
  const total = sum([...memberId].map((character) => character.codePointAt(0) ?? 0));
  return AVATAR_BACKGROUNDS[total % AVATAR_BACKGROUNDS.length] ?? AVATAR_BACKGROUNDS[0] ?? "";
};

const sum = (values: readonly number[]): number => {
  if (values.length === 0) return 0;
  return (values[0] ?? 0) + sum(values.slice(1));
};

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .slice(0, 2)
    .map((word) => word.slice(0, 1).toUpperCase())
    .join("");
