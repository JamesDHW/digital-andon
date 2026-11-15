export const normaliseEmail = (rawEmail: string): string => rawEmail.trim().toLowerCase();

export const emailDomain = (email: string): string => email.slice(email.lastIndexOf("@") + 1);

/** An empty allow-list admits every domain. */
export const isEmailAllowed = (email: string, allowedDomains: readonly string[]): boolean =>
  allowedDomains.length === 0 || allowedDomains.includes(emailDomain(email));

/** Joining without an invite needs the domain listed explicitly: an empty list lets nobody in on their own. */
export const canJoinWithoutInvite = (email: string, allowedDomains: readonly string[]): boolean => allowedDomains.includes(emailDomain(email));
