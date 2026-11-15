import { STATUS_MAX_LENGTH } from "./status.constants.js";

/** A status is one short line saying what you're doing; blank means none. */
export const normaliseStatus = (rawStatus: string): string | null => {
  const singleLineStatus = rawStatus.replace(/\s+/g, " ").trim();
  if (singleLineStatus.length === 0) return null;
  return singleLineStatus.slice(0, STATUS_MAX_LENGTH);
};
