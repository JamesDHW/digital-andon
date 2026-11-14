import { DeliveryFailedError } from "../errors/andonError.js";
import { tryCatchAsync } from "../errors/tryCatch.js";
import type { Mailer } from "../application/ports/mailer.js";
import { RESEND_EMAILS_URL } from "./adapters.constants.js";

export type ResendConfiguration = {
  readonly apiKey: string;
  readonly fromAddress: string;
};

export const createResendMailer = (configuration: ResendConfiguration): Mailer => ({
  send: async (email) => {
    const response = await tryCatchAsync(() =>
      fetch(RESEND_EMAILS_URL, {
        method: "POST",
        headers: { authorization: `Bearer ${configuration.apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({ from: configuration.fromAddress, to: [email.to], subject: email.subject, text: email.text }),
      }),
    );
    if (response instanceof Error) return new DeliveryFailedError(response.message);
    if (!response.ok) return new DeliveryFailedError(`Email provider answered ${response.status}.`);
    return undefined;
  },
});
