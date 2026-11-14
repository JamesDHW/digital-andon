import type { AndonErrorCode } from "../errors/andonError.js";

export const ERROR_STATUSES = {
  "invalid-request": 400,
  unauthorised: 401,
  forbidden: 403,
  "not-found": 404,
  "invalid-code": 400,
  "rate-limited": 429,
  "email-not-allowed": 403,
  "delivery-failed": 502,
  "storage-failed": 500,
  unexpected: 500,
} as const satisfies Readonly<Record<AndonErrorCode, number>>;
