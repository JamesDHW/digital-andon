import { exit } from "node:process";

import { DEV_EMAIL_DOMAIN, FORBIDDEN_STATUS } from "./scripts.constants.ts";

export type DevMember = {
  readonly id: string;
  readonly name: string;
};

export type DevSession = {
  readonly server: string;
  readonly deviceToken: string;
  readonly memberId: string;
};

/** Signs in through the development-only endpoint (DEV_MODE=true), creating the member if needed. */
export const signInAs = async (server: string, name: string): Promise<DevSession> => {
  const response = await fetch(`${server}/dev/sign-in`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: `${name.toLowerCase()}@${DEV_EMAIL_DOMAIN}`, name }),
  });
  const body: unknown = await response.json();
  const deviceToken = readString(body, "deviceToken");
  if (deviceToken.length === 0) return exitWithMessage(signInFailureMessage(server, response.status, readString(body, "message")));
  return { server, deviceToken, memberId: readString(body, "memberId") };
};

const signInFailureMessage = (server: string, status: number, message: string): string => {
  const isDevModeOff = status === FORBIDDEN_STATUS;
  if (isDevModeOff) return `Development sign-in is off on ${server}. Start the backend with \`pnpm dev\` (it sets DEV_MODE=true), or add DEV_MODE=true to backend/.dev.vars, then try again.`;
  return `Couldn't sign in on ${server} (HTTP ${status}): ${message}`;
};

const exitWithMessage = (message: string): never => {
  console.error(message);
  return exit(1);
};

export const listMembers = async (session: DevSession): Promise<readonly DevMember[]> => {
  const response = await fetch(`${session.server}/team/members`, { headers: { authorization: `Bearer ${session.deviceToken}` } });
  const body: unknown = await response.json();
  const members = readArray(body, "members");
  return members.map((member) => ({ id: readString(member, "id"), name: readString(member, "name") }));
};

export const findMemberId = async (session: DevSession, name: string): Promise<string> => {
  const members = await listMembers(session);
  const member = members.find((candidate) => candidate.name.toLowerCase() === name.toLowerCase());
  return member?.id ?? "";
};

export const putFollows = async (session: DevSession, memberIds: readonly string[]): Promise<number> => {
  const response = await fetch(`${session.server}/me/follows`, {
    method: "PUT",
    headers: { authorization: `Bearer ${session.deviceToken}`, "content-type": "application/json" },
    body: JSON.stringify({ memberIds }),
  });
  return response.status;
};

/** Node's WebSocket accepts headers, which is how the app authenticates too. */
export const openSocket = (session: DevSession): WebSocket =>
  new WebSocket(`${session.server.replace(/^http/, "ws")}/ws`, { headers: { authorization: `Bearer ${session.deviceToken}` } });

const readField = (body: unknown, field: string): unknown => {
  const isRecord = typeof body === "object" && body !== null;
  if (!isRecord) return undefined;
  return Object.entries(body).find(([key]) => key === field)?.[1];
};

const readString = (body: unknown, field: string): string => {
  const fieldValue = readField(body, field);
  if (typeof fieldValue === "string") return fieldValue;
  return "";
};

const readArray = (body: unknown, field: string): readonly unknown[] => {
  const fieldValue = readField(body, field);
  if (Array.isArray(fieldValue)) return fieldValue;
  return [];
};
