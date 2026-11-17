import { z } from "zod";

import { AndonError, UnauthorisedError } from "@backend/errors/andonError.js";
import { tryCatchAsync } from "@backend/errors/tryCatch.js";
import { NO_CONTENT_STATUS, UNAUTHORISED_STATUS } from "./api.constants.js";
import { errorBodySchema } from "./schemas.js";

export type ApiRequest = {
  readonly method: "GET" | "PATCH" | "DELETE";
  readonly path: string;
  readonly token: string;
  readonly body: unknown;
};

export const get = (path: string, token: string): ApiRequest => ({ method: "GET", path, token, body: undefined });

/** Every call answers a value or an AndonError; an expired sign-in is an UnauthorisedError the app reacts to. */
export const requestJson = async <Value>(request: ApiRequest, schema: z.ZodType<Value>): Promise<Value | AndonError> => {
  const response = await send(request);
  if (response instanceof AndonError) return response;
  const body = await tryCatchAsync((): Promise<unknown> => response.json());
  if (body instanceof AndonError) return body;

  const parsed = schema.safeParse(body);
  if (!parsed.success) return new AndonError("unexpected", "The server answered in an unexpected shape.");
  return parsed.data;
};

export type TextResponse = {
  readonly text: string;
  readonly headers: Headers;
};

/** The body as text, with the headers that describe it, such as where the next page starts. */
export const requestTextResponse = async (request: ApiRequest): Promise<TextResponse | AndonError> => {
  const response = await send(request);
  if (response instanceof AndonError) return response;
  const text = await tryCatchAsync(() => response.text());
  if (text instanceof AndonError) return text;
  return { text, headers: response.headers };
};

export const requestNothing = async (request: ApiRequest): Promise<undefined | AndonError> => {
  const response = await send(request);
  if (response instanceof AndonError) return response;
  return undefined;
};

const send = async (request: ApiRequest): Promise<Response | AndonError> => {
  const headers: Record<string, string> = { authorization: `Bearer ${request.token}` };
  const hasBody = request.body !== undefined;
  if (hasBody) {
    headers["content-type"] = "application/json";
  }
  const response = await tryCatchAsync(() =>
    fetch(request.path, { method: request.method, headers, body: hasBody ? JSON.stringify(request.body) : null }),
  );
  if (response instanceof AndonError) return new AndonError("unexpected", "Couldn't reach Digital Andon. Check your connection.");
  if (response.status === UNAUTHORISED_STATUS) return new UnauthorisedError();
  if (response.ok) return response;
  return failureFrom(response);
};

const failureFrom = async (response: Response): Promise<AndonError> => {
  const isEmpty = response.status === NO_CONTENT_STATUS;
  if (isEmpty) return new AndonError("unexpected", `The server answered ${response.status}.`);
  const body = await tryCatchAsync((): Promise<unknown> => response.json());
  const parsed = errorBodySchema.safeParse(body);
  if (!parsed.success) return new AndonError("unexpected", `The server answered ${response.status}.`);
  return new AndonError("unexpected", parsed.data.message);
};
