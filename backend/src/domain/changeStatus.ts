import type { Light } from "./light.js";

/** A status can be set on any light: it says what you're doing, whatever the colour. */
export const changeStatus = (light: Light, status: string | null): Light => ({ ...light, status });
