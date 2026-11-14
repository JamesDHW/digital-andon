import { isAndonError, type AndonError } from "./andonError.js";

/** Every value, or the first error among them. */
export const allOrFirstError = <Value>(results: readonly (Value | AndonError)[]): readonly Value[] | AndonError => {
  const failure = results.find(isAndonError);
  if (failure !== undefined) return failure;
  return results.filter((result): result is Value => !isAndonError(result));
};
