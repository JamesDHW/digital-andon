import { InvalidRequestError, type AndonError } from "../../errors/andonError.js";
import type { Member } from "../../domain/member.js";
import type { AuthDependencies } from "../auth/authDependencies.js";
import type { AvatarStore } from "../ports/avatarStore.js";
import { AVATAR_EXTENSIONS, AVATAR_MAX_BYTES } from "./avatar.constants.js";
import { updateProfile, type UpdatedProfile } from "./updateProfile.js";

export type AvatarUpload = {
  readonly image: ArrayBuffer;
  readonly contentType: string;
};

/** Each upload gets a new key, so clients never show a cached old photo. */
export const uploadAvatar = async (
  dependencies: AuthDependencies,
  avatars: AvatarStore,
  member: Member,
  upload: AvatarUpload,
): Promise<UpdatedProfile | AndonError> => {
  const extension = avatarExtension(upload.contentType);
  if (extension === undefined) return new InvalidRequestError("Use a PNG, JPEG, GIF or WebP image.");
  if (upload.image.byteLength > AVATAR_MAX_BYTES) return new InvalidRequestError("Use an image smaller than 1 MB.");

  const key = `${member.id}-${dependencies.now()}.${extension}`;
  const stored = await avatars.put(key, upload.image, upload.contentType);
  if (stored instanceof Error) return stored;

  return updateProfile(dependencies, member, { avatarUrl: `${dependencies.publicOrigin}/avatars/${key}` });
};

const isAvatarContentType = (contentType: string): contentType is keyof typeof AVATAR_EXTENSIONS => Object.hasOwn(AVATAR_EXTENSIONS, contentType);

const avatarExtension = (contentType: string): string | undefined => {
  if (!isAvatarContentType(contentType)) return undefined;
  return AVATAR_EXTENSIONS[contentType];
};
