import { InvalidRequestError, type AndonError } from "../errors/andonError.js";
import { isRaised } from "./colour.js";
import type { Light } from "./light.js";

export const changeTopic = (light: Light, topic: string | null): Light | AndonError => {
  if (!isRaised(light.colour)) return new InvalidRequestError("Turn your light amber or red before adding a topic.");
  return { ...light, topic };
};
