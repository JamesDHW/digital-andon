import { AndonError } from "./andonError.js";

const describeCaught = (caught: unknown): string => {
  if (caught instanceof Error) return caught.message;
  return String(caught);
};

const toAndonError = (caught: unknown): AndonError => {
  if (caught instanceof AndonError) return caught;
  return new AndonError("unexpected", describeCaught(caught), { cause: caught });
};

/** The error adapter: the only place that catches. Callers branch on the returned error. */
export const tryCatch = <Value>(operation: () => Value): Value | AndonError => {
  try {
    return operation();
  } catch (caught) {
    return toAndonError(caught);
  }
};

export const tryCatchAsync = async <Value>(operation: () => Promise<Value>): Promise<Value | AndonError> => {
  try {
    return await operation();
  } catch (caught) {
    return toAndonError(caught);
  }
};
