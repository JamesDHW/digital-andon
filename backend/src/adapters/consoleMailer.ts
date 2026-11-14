import type { Mailer } from "../application/ports/mailer.js";

/** Local development: emails (with their codes and links) are printed in the wrangler dev log. */
export const createConsoleMailer = (): Mailer => ({
  send: async (email) => {
    console.info(`[andon email] to=${email.to} subject="${email.subject}"\n${email.text}`);
    return undefined;
  },
});
