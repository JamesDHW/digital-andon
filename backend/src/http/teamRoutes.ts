import { InvalidRequestError } from "../errors/andonError.js";
import { listEvents } from "../application/admin/listEvents.js";
import { removeMember } from "../application/admin/removeMember.js";
import { greetMember } from "../application/greetMember.js";
import { readHistory } from "../application/history/readHistory.js";
import { changeTeamSettings, readTeamSettings } from "../application/admin/teamSettings.js";
import { isMemberId } from "../domain/memberId.js";
import { authenticatedMember } from "./authenticatedMember.js";
import { toEventsCsv } from "./eventsCsv.js";
import { respondOnly, type HttpContext, type HttpOutcome } from "./httpOutcome.js";
import { errorResponse, jsonResponse } from "./httpResponses.js";
import { parseJsonBody, parseQuery } from "./requestBody.js";
import { eventsQuerySchema, historyQuerySchema, settingsBodySchema } from "./requestSchemas.js";

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

  const query = parseQuery(context.url, eventsQuerySchema);
  if (query instanceof Error) return respondOnly(errorResponse(query));

  const events = listEvents(context.dependencies, admin, {
    afterId: query.afterId,
    limit: query.limit,
    from: query.from ?? null,
    to: query.to ?? null,
    memberIds: query.memberIds ?? null,
  });
  if (events instanceof Error) return respondOnly(errorResponse(events));
  if (query.format === "json") return respondOnly(jsonResponse({ events }));

  const members = context.dependencies.members.list();
  if (members instanceof Error) return respondOnly(errorResponse(members));
  return respondOnly(new Response(toEventsCsv(events, members), { headers: { "content-type": "text/csv; charset=utf-8" } }));
};

/** Everything the web app shows: the greeting the Mac app gets when it connects, plus the team's name. */
export const handleSnapshot = async (context: HttpContext): Promise<HttpOutcome> => {
  const member = await authenticatedMember(context);
  if (member instanceof Error) return respondOnly(errorResponse(member));

  const snapshot = greetMember(context.dependencies, member.id);
  if (snapshot instanceof Error) return respondOnly(errorResponse(snapshot));
  const settings = context.dependencies.settings.load();
  if (settings instanceof Error) return respondOnly(errorResponse(settings));
  return respondOnly(jsonResponse({ ...snapshot, teamName: settings.teamName }));
};

export const handleHistory = async (context: HttpContext): Promise<HttpOutcome> => {
  const member = await authenticatedMember(context);
  if (member instanceof Error) return respondOnly(errorResponse(member));

  const query = parseQuery(context.url, historyQuerySchema);
  if (query instanceof Error) return respondOnly(errorResponse(query));

  const history = readHistory(context.dependencies, query);
  if (history instanceof Error) return respondOnly(errorResponse(history));
  return respondOnly(jsonResponse(history));
};
