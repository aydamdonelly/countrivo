import type { Metadata } from "next";

const SITE_URL = "https://countrivo.com";

/** A standalone topic page outside the game, list and country families. */
export interface TopicPageSeo {
  /** Path from the site root, e.g. `/world-map-quiz`. */
  path: string;
  /** Full <title>, already ending in "| Countrivo". */
  title: string;
  description: string;
  /** A shorter social title; defaults to the page title. */
  ogTitle?: string;
}

/**
 * Canonical, Open Graph and Twitter metadata for a topic page, in the same shape
 * `buildGameMetadata` gives the game landings so the families never drift apart.
 */
export function buildTopicMetadata({ path, title, description, ogTitle }: TopicPageSeo): Metadata {
  const social = ogTitle ?? title;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: "Countrivo", url: `${SITE_URL}${path}`, title: social, description },
    twitter: { card: "summary_large_image", title: social, description },
  };
}
