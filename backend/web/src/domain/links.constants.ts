/** An http(s) link in someone's context: up to the next space or quote. */
export const LINK_PATTERN = /https?:\/\/[^\s<>"]+/gu;

/** Punctuation that usually ends a sentence rather than a link. */
export const TRAILING_PUNCTUATION = /[.,;:!?)\]}'"]+$/u;
