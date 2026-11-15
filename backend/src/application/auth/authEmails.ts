import type { OutgoingEmail } from "../ports/mailer.js";

export const createInviteEmail = (recipient: string, inviterName: string, joinLink: string): OutgoingEmail => ({
  to: recipient,
  subject: `${inviterName} invited you to Digital Andon`,
  text: [
    `${inviterName} invited you to join your team's andon board.`,
    "",
    "Open this link on your Mac to join. If Digital Andon isn't installed yet, the page will help you install it first:",
    joinLink,
    "",
    "The link works once and expires in 48 hours.",
  ].join("\n"),
});

export const createLoginCodeEmail = (recipient: string, code: string): OutgoingEmail => ({
  to: recipient,
  subject: `Your Digital Andon sign-in code is ${code}`,
  text: [`Enter this code in Digital Andon to sign in on this Mac:`, "", code, "", "It expires in 10 minutes."].join("\n"),
});
