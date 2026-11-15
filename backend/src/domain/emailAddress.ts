export const normaliseEmail = (rawEmail: string): string => rawEmail.trim().toLowerCase();

export const emailDomain = (email: string): string => email.slice(email.lastIndexOf("@") + 1);

/** Joining needs the domain listed explicitly: an empty list lets nobody in on their own. */
export const canJoin = (email: string, allowedDomains: readonly string[]): boolean => allowedDomains.includes(emailDomain(email));
