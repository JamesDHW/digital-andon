export const normaliseEmail = (rawEmail: string): string => rawEmail.trim().toLowerCase();

export const emailDomain = (email: string): string => email.slice(email.lastIndexOf("@") + 1);

/** An empty allow-list admits every domain. */
export const isEmailAllowed = (email: string, allowedDomains: readonly string[]): boolean =>
  allowedDomains.length === 0 || allowedDomains.includes(emailDomain(email));
