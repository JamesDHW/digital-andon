import { replaceFollowing } from "../application/followCommands.js";
import { updateProfile } from "../application/profile/updateProfile.js";
import { authenticatedMember } from "./authenticatedMember.js";
import { respondOnly, type HttpContext, type HttpOutcome } from "./httpOutcome.js";
import { errorResponse, jsonResponse } from "./httpResponses.js";
import { parseJsonBody } from "./requestBody.js";
import { followsBodySchema, profileBodySchema } from "./requestSchemas.js";

export const handleGetMe = async (context: HttpContext): Promise<HttpOutcome> => {
  const member = await authenticatedMember(context);
  if (member instanceof Error) return respondOnly(errorResponse(member));
  return respondOnly(jsonResponse(member));
};

export const handlePatchMe = async (context: HttpContext): Promise<HttpOutcome> => {
  const member = await authenticatedMember(context);
  if (member instanceof Error) return respondOnly(errorResponse(member));

  const body = await parseJsonBody(context.request, profileBodySchema);
  if (body instanceof Error) return respondOnly(errorResponse(body));

  const updated = updateProfile(context.dependencies, member, body);
  if (updated instanceof Error) return respondOnly(errorResponse(updated));
  return { response: jsonResponse(updated.member), deliveries: updated.deliveries };
};

export const handleGetFollows = async (context: HttpContext): Promise<HttpOutcome> => {
  const member = await authenticatedMember(context);
  if (member instanceof Error) return respondOnly(errorResponse(member));

  const memberIds = context.dependencies.follows.listFollowing(member.id);
  if (memberIds instanceof Error) return respondOnly(errorResponse(memberIds));
  return respondOnly(jsonResponse({ memberIds }));
};

export const handlePutFollows = async (context: HttpContext): Promise<HttpOutcome> => {
  const member = await authenticatedMember(context);
  if (member instanceof Error) return respondOnly(errorResponse(member));

  const body = await parseJsonBody(context.request, followsBodySchema);
  if (body instanceof Error) return respondOnly(errorResponse(body));

  const deliveries = replaceFollowing(context.dependencies, member.id, body.memberIds);
  if (deliveries instanceof Error) return respondOnly(errorResponse(deliveries));

  const memberIds = context.dependencies.follows.listFollowing(member.id);
  if (memberIds instanceof Error) return respondOnly(errorResponse(memberIds));
  return { response: jsonResponse({ memberIds }), deliveries };
};
