/**
 * Site identity shared by the root layout's JSON-LD, every page graph, the visible App
 * Store link and /llms.txt. One App Store id, so the website, the schema and the Smart
 * App Banner always name the same app.
 */
export const SITE_URL = "https://countrivo.com";

export const APP_STORE_ID = "6782594305";
export const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;

/** The one Organization node id; pages reference it instead of repeating the entity. */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

/** The Organization as every graph names it: same id, same `sameAs`. */
export const ORGANIZATION = {
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: "Countrivo",
  url: SITE_URL,
  sameAs: [APP_STORE_URL],
} as const;
