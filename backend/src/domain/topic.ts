import { TOPIC_MAX_LENGTH } from "./topic.constants.js";

/** A topic is one short line; blank means no topic. */
export const normaliseTopic = (rawTopic: string): string | null => {
  const singleLineTopic = rawTopic.replace(/\s+/g, " ").trim();
  if (singleLineTopic.length === 0) return null;
  return singleLineTopic.slice(0, TOPIC_MAX_LENGTH);
};
