import { UnauthorisedError } from "../errors/andonError.js";
import { isValidApiKey } from "../application/auth/authenticate.js";
import { pullLight } from "../application/lightCommands.js";
import { respondOnly, type HttpContext, type HttpOutcome } from "./httpOutcome.js";
import { errorResponse, jsonResponse } from "./httpResponses.js";
import { bearerToken, parseJsonBody } from "./requestBody.js";
import { apiPullBodySchema } from "./requestSchemas.js";

/** CI and alerting pull a member's light with the team API key. */
export const handleApiPull = async (context: HttpContext): Promise<HttpOutcome> => {
  const apiKey = bearerToken(context.request);
  if (apiKey === null) return respondOnly(errorResponse(new UnauthorisedError()));

  const isValidKey = await isValidApiKey(context.dependencies, apiKey);
  if (isValidKey instanceof Error) return respondOnly(errorResponse(isValidKey));
  if (!isValidKey) return respondOnly(errorResponse(new UnauthorisedError()));

  const body = await parseJsonBody(context.request, apiPullBodySchema);
  if (body instanceof Error) return respondOnly(errorResponse(body));

  const deliveries = pullLight(context.dependencies, { memberId: body.memberId, colour: body.colour, rawTopic: body.topic, source: "api" });
  if (deliveries instanceof Error) return respondOnly(errorResponse(deliveries));
  return { response: jsonResponse({ pulled: body.colour }), deliveries };
};
