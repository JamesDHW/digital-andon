import type { AndonError } from "../errors/andonError.js";
import { ERROR_STATUSES } from "./httpResponses.constants.js";
import { NO_CONTENT_STATUS } from "./http.constants.js";

export const jsonResponse = (body: unknown, status = 200): Response => Response.json(body, { status });

export const noContentResponse = (): Response => new Response(null, { status: NO_CONTENT_STATUS });

export const errorResponse = (error: AndonError): Response =>
  Response.json({ code: error.code, message: error.message }, { status: ERROR_STATUSES[error.code] });

export const notFoundResponse = (): Response => Response.json({ code: "not-found", message: "No such endpoint." }, { status: 404 });
