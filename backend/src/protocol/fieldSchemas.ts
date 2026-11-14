import { z } from "zod";

import { isMemberId, type MemberId } from "../domain/memberId.js";

const isMemberIdCandidate = (candidate: unknown): boolean => typeof candidate === "string" && isMemberId(candidate);

export const memberIdSchema = z.custom<MemberId>(isMemberIdCandidate, "Expected a member id.");

export const colourSchema = z.enum(["green", "amber", "red", "off"]);
