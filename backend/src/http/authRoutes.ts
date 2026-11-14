import { devSignIn } from "../application/auth/devSignIn.js";
import { inviteMember } from "../application/auth/inviteMember.js";
import { redeemInvite } from "../application/auth/redeemInvite.js";
import { requestLoginCode } from "../application/auth/requestLoginCode.js";
import { verifyLoginCode } from "../application/auth/verifyLoginCode.js";
import { authenticatedMember } from "./authenticatedMember.js";
import { respondOnly, type HttpContext, type HttpOutcome } from "./httpOutcome.js";
import { errorResponse, jsonResponse, noContentResponse } from "./httpResponses.js";
import { parseJsonBody } from "./requestBody.js";
import { codeRequestBodySchema, codeVerifyBodySchema, devSignInBodySchema, inviteBodySchema, redeemBodySchema } from "./requestSchemas.js";

export const handleInvite = async (context: HttpContext): Promise<HttpOutcome> => {
  const inviter = await authenticatedMember(context);
  if (inviter instanceof Error) return respondOnly(errorResponse(inviter));

  const body = await parseJsonBody(context.request, inviteBodySchema);
  if (body instanceof Error) return respondOnly(errorResponse(body));

  const invite = await inviteMember(context.dependencies, { inviter, email: body.email, name: body.name });
  if (invite instanceof Error) return respondOnly(errorResponse(invite));
  return respondOnly(jsonResponse(invite, 201));
};

export const handleRedeem = async (context: HttpContext): Promise<HttpOutcome> => {
  const body = await parseJsonBody(context.request, redeemBodySchema);
  if (body instanceof Error) return respondOnly(errorResponse(body));

  const redeemed = await redeemInvite(context.dependencies, body);
  if (redeemed instanceof Error) return respondOnly(errorResponse(redeemed));
  return { response: jsonResponse({ deviceToken: redeemed.deviceToken, memberId: redeemed.memberId }), deliveries: redeemed.deliveries };
};

export const handleCodeRequest = async (context: HttpContext): Promise<HttpOutcome> => {
  const body = await parseJsonBody(context.request, codeRequestBodySchema);
  if (body instanceof Error) return respondOnly(errorResponse(body));

  const requested = await requestLoginCode(context.dependencies, body.email);
  if (requested instanceof Error) return respondOnly(errorResponse(requested));
  return respondOnly(noContentResponse());
};

export const handleCodeVerify = async (context: HttpContext): Promise<HttpOutcome> => {
  const body = await parseJsonBody(context.request, codeVerifyBodySchema);
  if (body instanceof Error) return respondOnly(errorResponse(body));

  const device = await verifyLoginCode(context.dependencies, body);
  if (device instanceof Error) return respondOnly(errorResponse(device));
  return respondOnly(jsonResponse(device));
};

export const handleDevSignIn = async (context: HttpContext): Promise<HttpOutcome> => {
  const body = await parseJsonBody(context.request, devSignInBodySchema);
  if (body instanceof Error) return respondOnly(errorResponse(body));

  const signedIn = await devSignIn(context.dependencies, context.isDevelopmentMode, body);
  if (signedIn instanceof Error) return respondOnly(errorResponse(signedIn));
  return { response: jsonResponse({ deviceToken: signedIn.deviceToken, memberId: signedIn.memberId }), deliveries: signedIn.deliveries };
};
