import type { Mailer, OutgoingEmail } from "../../src/application/ports/mailer.js";

export type RecordingMailer = Mailer & {
  readonly sentEmails: () => readonly OutgoingEmail[];
};

export const createRecordingMailer = (): RecordingMailer => {
  const outbox: OutgoingEmail[] = [];
  return {
    send: async (email) => {
      outbox.push(email);
      return undefined;
    },
    sentEmails: () => [...outbox],
  };
};
