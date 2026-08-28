/**
 * Lightweight block-list for usernames and display names (App Store 1.2 hygiene
 * + anti-impersonation). Substring match on the letters-only, lowercased value.
 * Not a perfect filter — a pragmatic guard against the obvious cases.
 */
const BLOCKED = [
  // reserved / impersonation
  "admin", "administrator", "root", "moderator", "staff", "support", "countrivo",
  "official", "system", "owner",
  // slurs / explicit (kept intentionally short)
  "nigger", "nigga", "faggot", "cunt", "rape", "rapist", "molest", "fuck",
  "shit", "bitch", "whore", "slut", "pussy", "porn", "nazi", "hitler", "kkk",
  "pedo", "pedophile",
];

export function isAllowedHandle(value: string): boolean {
  const normalized = value.toLowerCase().replace(/[^a-z]/g, "");
  if (!normalized) return true; // digits/hyphens only — format check covers it
  return !BLOCKED.some((w) => normalized.includes(w));
}
