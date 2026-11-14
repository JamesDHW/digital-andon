import type { AndonError } from "../../errors/andonError.js";

export type OutgoingEmail = {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
};

export type Mailer = {
  readonly send: (email: OutgoingEmail) => Promise<undefined | AndonError>;
};
