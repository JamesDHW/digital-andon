export const TOKEN_BYTES = 32;
export const DECIMAL_BASE = 10;
export const RESEND_EMAILS_URL = "https://api.resend.com/emails";
export const GOOGLE_AUTHORISE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_SCOPES = "openid email profile";
export const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"] as const;
/** Google's photo URLs end in a size such as "=s96-c"; ask for one big enough for a Retina menu bar. */
export const GOOGLE_PHOTO_SIZE_PATTERN = /=s\d+-c$/;
export const GOOGLE_PHOTO_SIZE = "=s256-c";
export const SECONDS_TO_MS = 1000;
