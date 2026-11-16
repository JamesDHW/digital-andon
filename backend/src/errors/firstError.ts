import { isAndonError, type AndonError } from "./andonError.js";

/** Every value, or the first error among them. */
export const allOrFirstError = <Value>(results: readonly (Value | AndonError)[]): readonly Value[] | AndonError => {
  const failure = results.find(isAndonError);
  if (failure !== undefined) return failure;
  return results.filter((result): result is Value => !isAndonError(result));
};

/** Runs each step in turn, stopping at the first that fails. */
export const firstFailure = (steps: readonly (() => undefined | AndonError)[]): AndonError | undefined => {
  for (const step of steps) {
    const result = step();
    if (result !== undefined) return result;
  }
  return undefined;
};
