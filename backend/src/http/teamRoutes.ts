import { InvalidRequestError } from "../errors/andonError.js";
import { listEvents } from "../application/admin/listEvents.js";
import { removeMember } from "../application/admin/removeMember.js";
import { changeTeamSettings, readTeamSettings } from "../application/admin/teamSettings.js";
import { isMemberId } from "../domain/memberId.js";
import { authenticatedMember } from "./authenticatedMember.js";
import { toEventsCsv } from "./eventsCsv.js";
import { EVENT_PAGE_DEFAULT_LIMIT, EVENT_PAGE_MAX_LIMIT } from "./http.constants.js";
import { respondOnly, type HttpContext, type HttpOutcome } from "./httpOutcome.js";
import { errorResponse, jsonResponse } from "./httpResponses.js";
import { parseJsonBody } from "./requestBody.js";
import { settingsBodySchema } from "./requestSchemas.js";

export const handleListMembers = async (context: HttpContext): Promise<HttpOutcome> => {
  const member = await authenticatedMember(context);
  if (member instanceof Error) return respondOnly(errorResponse(member));

  const members = context.dependencies.members.list();
  if (members instanceof Error) return respondOnly(errorResponse(members));
  return respondOnly(jsonResponse({ members }));
};

export const handleRemoveMember = async (context: HttpContext, rawMemberId: string): Promise<HttpOutcome> => {
  const admin = await authenticatedMember(context);
  if (admin instanceof Error) return respondOnly(errorResponse(admin));
  if (!isMemberId(rawMemberId)) return respondOnly(errorResponse(new InvalidRequestError("Expected a member id.")));

  const deliveries = removeMember(context.dependencies, admin, rawMemberId);
  if (deliveries instanceof Error) return respondOnly(errorResponse(deliveries));
  return { response: jsonResponse({ removed: rawMemberId }), deliveries };
};

export const handleGetSettings = async (context: HttpContext): Promise<HttpOutcome> => {
  const admin = await authenticatedMember(context);
  if (admin instanceof Error) return respondOnly(errorResponse(admin));

  const settings = readTeamSettings(context.dependencies, admin);
  if (settings instanceof Error) return respondOnly(errorResponse(settings));
  return respondOnly(jsonResponse(settings));
};

export const handlePatchSettings = async (context: HttpContext): Promise<HttpOutcome> => {
  const admin = await authenticatedMember(context);
  if (admin instanceof Error) return respondOnly(errorResponse(admin));

  const body = await parseJsonBody(context.request, settingsBodySchema);
  if (body instanceof Error) return respondOnly(errorResponse(body));

  const settings = changeTeamSettings(context.dependencies, admin, body);
  if (settings instanceof Error) return respondOnly(errorResponse(settings));
  return respondOnly(jsonResponse(settings));
};

export const handleListEvents = async (context: HttpContext): Promise<HttpOutcome> => {
  const admin = await authenticatedMember(context);
  if (admin instanceof Error) return respondOnly(errorResponse(admin));

  const events = listEvents(context.dependencies, admin, readEventQuery(context.url));
  if (events instanceof Error) return respondOnly(errorResponse(events));

  const isCsvRequested = context.url.searchParams.get("format") === "csv";
  if (isCsvRequested) return respondOnly(new Response(toEventsCsv(events), { headers: { "content-type": "text/csv; charset=utf-8" } }));
  return respondOnly(jsonResponse({ events }));
};

const readEventQuery = (url: URL): { readonly afterId: number; readonly limit: number } => {
  const afterId = Number(url.searchParams.get("afterId") ?? "0");
  const limit = Number(url.searchParams.get("limit") ?? String(EVENT_PAGE_DEFAULT_LIMIT));
  return {
    afterId: Number.isSafeInteger(afterId) ? afterId : 0,
    limit: Math.min(Math.max(Number.isSafeInteger(limit) ? limit : EVENT_PAGE_DEFAULT_LIMIT, 1), EVENT_PAGE_MAX_LIMIT),
  };
};
