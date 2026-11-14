import { handleApiPull } from "./apiRoutes.js";
import { handleCodeRequest, handleCodeVerify, handleDevSignIn, handleInvite, handleRedeem } from "./authRoutes.js";
import { MEMBER_PATH_PATTERN } from "./http.constants.js";
import { respondOnly, type HttpContext, type HttpOutcome } from "./httpOutcome.js";
import { notFoundResponse } from "./httpResponses.js";
import { handleGetFollows, handleGetMe, handlePatchMe, handlePutAvatar, handlePutFollows } from "./meRoutes.js";
import {
  handleGetSettings,
  handleListEvents,
  handleListMembers,
  handlePatchSettings,
  handleRemoveMember,
  handleRotateApiKey,
} from "./teamRoutes.js";

/** Every JSON endpoint the team Durable Object serves; WebSocket upgrades are handled by the runtime. */
export const routeRequest = async (context: HttpContext): Promise<HttpOutcome> => {
  const route = `${context.request.method} ${context.url.pathname}`;
  switch (route) {
    case "POST /auth/invite":
      return handleInvite(context);
    case "POST /auth/redeem":
      return handleRedeem(context);
    case "POST /auth/code/request":
      return handleCodeRequest(context);
    case "POST /auth/code/verify":
      return handleCodeVerify(context);
    case "GET /me":
      return handleGetMe(context);
    case "PATCH /me":
      return handlePatchMe(context);
    case "PUT /me/avatar":
      return handlePutAvatar(context);
    case "GET /me/follows":
      return handleGetFollows(context);
    case "PUT /me/follows":
      return handlePutFollows(context);
    case "GET /team/members":
      return handleListMembers(context);
    case "GET /team/settings":
      return handleGetSettings(context);
    case "PATCH /team/settings":
      return handlePatchSettings(context);
    case "POST /team/api-key":
      return handleRotateApiKey(context);
    case "GET /team/events":
      return handleListEvents(context);
    case "POST /api/pull":
      return handleApiPull(context);
    case "POST /dev/sign-in":
      return handleDevSignIn(context);
    default:
      return routeParameterisedRequest(context);
  }
};

const routeParameterisedRequest = async (context: HttpContext): Promise<HttpOutcome> => {
  const memberPath = MEMBER_PATH_PATTERN.exec(context.url.pathname);
  const memberId = memberPath?.[1];
  const isMemberRemoval = context.request.method === "DELETE" && memberId !== undefined;
  if (isMemberRemoval) return handleRemoveMember(context, decodeURIComponent(memberId));
  return respondOnly(notFoundResponse());
};
