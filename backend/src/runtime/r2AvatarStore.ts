import { tryCatchAsync } from "../errors/tryCatch.js";
import type { AvatarStore } from "../application/ports/avatarStore.js";

export const createR2AvatarStore = (bucket: R2Bucket): AvatarStore => ({
  put: async (key, image, contentType) => {
    const stored = await tryCatchAsync(() => bucket.put(key, image, { httpMetadata: { contentType } }));
    if (stored instanceof Error) return stored;
    return undefined;
  },
});
