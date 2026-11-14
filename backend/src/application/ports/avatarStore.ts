import type { AndonError } from "../../errors/andonError.js";

export type AvatarStore = {
  readonly put: (key: string, image: ArrayBuffer, contentType: string) => Promise<undefined | AndonError>;
};
