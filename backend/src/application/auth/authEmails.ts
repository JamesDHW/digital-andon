import type { OutgoingEmail } from "../ports/mailer.js";

export const createLoginCodeEmail = (recipient: string, code: string): OutgoingEmail => ({
  to: recipient,
  subject: `Your Digital Andon sign-in code is ${code}`,
  text: [`Enter this code in Digital Andon to sign in on this Mac:`, "", code, "", "It expires in 10 minutes."].join("\n"),
});
