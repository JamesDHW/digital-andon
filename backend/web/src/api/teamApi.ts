import type { AndonError } from "@backend/errors/andonError.js";
import type { MemberId } from "@backend/domain/memberId.js";
import type { TeamSnapshot } from "../domain/board.js";
import type { TimeRange } from "../domain/timeRange.js";
import { get, requestJson, requestNothing, requestText } from "./apiClient.js";
import { historySchema, settingsSchema, snapshotSchema, type History, type TeamSettings } from "./schemas.js";

export const fetchSnapshot = (token: string): Promise<TeamSnapshot | AndonError> => requestJson(get("/team/snapshot", token), snapshotSchema);

export const fetchHistory = (token: string, range: TimeRange, memberIds: readonly MemberId[]): Promise<History | AndonError> => {
  const query = new URLSearchParams({ from: String(Math.round(range.from)), to: String(Math.round(range.to)), memberIds: memberIds.join(",") });
  return requestJson(get(`/team/history?${query.toString()}`, token), historySchema);
};

export type CsvFilters = {
  readonly range: TimeRange;
  /** Null exports everyone. */
  readonly memberIds: readonly MemberId[] | null;
};

export const fetchEventsCsv = (token: string, filters: CsvFilters): Promise<string | AndonError> => {
  const query = new URLSearchParams({ format: "csv", limit: "5000", from: String(Math.round(filters.range.from)), to: String(Math.round(filters.range.to)) });
  if (filters.memberIds !== null) {
    query.set("memberIds", filters.memberIds.join(","));
  }
  return requestText(get(`/team/events?${query.toString()}`, token));
};

export const fetchSettings = (token: string): Promise<TeamSettings | AndonError> => requestJson(get("/team/settings", token), settingsSchema);

export const saveSettings = (token: string, settings: TeamSettings): Promise<TeamSettings | AndonError> =>
  requestJson({ method: "PATCH", path: "/team/settings", token, body: settings }, settingsSchema);

export const removeMember = (token: string, memberId: MemberId): Promise<undefined | AndonError> =>
  requestNothing({ method: "DELETE", path: `/team/members/${encodeURIComponent(memberId)}`, token, body: undefined });

/** Hands text to the browser as a downloaded file. */
export const saveTextFile = (fileName: string, text: string, type: string): void => {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([text], { type }));
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
};
