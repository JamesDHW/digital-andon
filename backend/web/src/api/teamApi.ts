import { AndonError } from "@backend/errors/andonError.js";
import type { MemberId } from "@backend/domain/memberId.js";
import type { TeamSnapshot } from "../domain/board.js";
import type { TimeRange } from "../domain/timeRange.js";
import { joinCsvPages } from "../domain/csvPages.js";
import { EVENT_PAGE_COUNT_HEADER, EVENT_PAGE_LIMIT, EVENT_PAGE_NEXT_HEADER } from "./api.constants.js";
import { get, requestJson, requestNothing, requestTextResponse } from "./apiClient.js";
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

export type EventsCsv = {
  readonly csv: string;
  readonly rows: number;
};

/** Every page of the export, one after another, joined into one file. */
export const fetchEventsCsv = async (token: string, filters: CsvFilters, onProgress: (rows: number) => void): Promise<EventsCsv | AndonError> => {
  const pages = await fetchCsvPages(token, filters, 0, { pages: [], rows: 0 }, onProgress);
  if (pages instanceof AndonError) return pages;
  return { csv: joinCsvPages(pages.pages), rows: pages.rows };
};

type CsvPages = {
  readonly pages: readonly string[];
  readonly rows: number;
};

const fetchCsvPages = async (
  token: string,
  filters: CsvFilters,
  afterId: number,
  sofar: CsvPages,
  onProgress: (rows: number) => void,
): Promise<CsvPages | AndonError> => {
  const query = new URLSearchParams({
    format: "csv",
    limit: String(EVENT_PAGE_LIMIT),
    afterId: String(afterId),
    from: String(Math.round(filters.range.from)),
    to: String(Math.round(filters.range.to)),
  });
  if (filters.memberIds !== null) {
    query.set("memberIds", filters.memberIds.join(","));
  }
  const response = await requestTextResponse(get(`/team/events?${query.toString()}`, token));
  if (response instanceof AndonError) return response;

  const collected = { pages: [...sofar.pages, response.text], rows: sofar.rows + Number(response.headers.get(EVENT_PAGE_COUNT_HEADER) ?? 0) };
  onProgress(collected.rows);
  const nextAfterId = Number(response.headers.get(EVENT_PAGE_NEXT_HEADER) ?? Number.NaN);
  if (!Number.isSafeInteger(nextAfterId)) return collected;
  return fetchCsvPages(token, filters, nextAfterId, collected, onProgress);
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
