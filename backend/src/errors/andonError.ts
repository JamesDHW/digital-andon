export type AndonErrorCode =
  | "invalid-request"
  | "unauthorised"
  | "forbidden"
  | "not-found"
  | "invalid-code"
  | "rate-limited"
  | "email-not-allowed"
  | "delivery-failed"
  | "storage-failed"
  | "unexpected";

/** Every failure this service returns as a value. Narrow with instanceof or by code. */
export class AndonError extends Error {
  readonly code: AndonErrorCode;

  constructor(code: AndonErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AndonError";
    this.code = code;
  }
}

export class InvalidRequestError extends AndonError {
  constructor(message: string) {
    super("invalid-request", message);
  }
}

export class UnauthorisedError extends AndonError {
  constructor() {
    super("unauthorised", "Sign in again to continue.");
  }
}

export class ForbiddenError extends AndonError {
  constructor(message: string) {
    super("forbidden", message);
  }
}

export class NotFoundError extends AndonError {
  constructor(message: string) {
    super("not-found", message);
  }
}

export class InvalidCodeError extends AndonError {
  constructor() {
    super("invalid-code", "That code or link is invalid or has expired.");
  }
}

export class RateLimitedError extends AndonError {
  constructor() {
    super("rate-limited", "Too many attempts. Wait a minute and try again.");
  }
}

export class EmailNotAllowedError extends AndonError {
  constructor() {
    super("email-not-allowed", "That email address can't join this team.");
  }
}

export class DeliveryFailedError extends AndonError {
  constructor(message: string) {
    super("delivery-failed", message);
  }
}

export const isAndonError = (candidate: unknown): candidate is AndonError => candidate instanceof AndonError;
