const MINUTE_MS = 60_000;

export const LOGIN_CODE_LIFETIME_MS = 10 * MINUTE_MS;
export const LOGIN_CODE_RESEND_INTERVAL_MS = 60_000;
export const LOGIN_CODE_DIGITS = 6;
export const LOGIN_CODE_MAX_ATTEMPTS = 5;
export const SIGN_IN_ATTEMPT_LIFETIME_MS = 10 * MINUTE_MS;
export const GOOGLE_CALLBACK_PATH = "/auth/google/callback";
