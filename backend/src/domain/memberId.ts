import { MEMBER_ID_PATTERN } from "./member.constants.js";

export type MemberId = string & { readonly __brand: "MemberId" };

export const isMemberId = (candidate: string): candidate is MemberId => MEMBER_ID_PATTERN.test(candidate);
