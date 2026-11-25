/**
 * JSON-LD helpers shared by every static family (blueprint 7.3, 7.9, 7.11, 7.13). The
 * breadcrumb shapes are the ones the old pages emitted, so the graph types per URL are
 * unchanged.
 */

import { ORGANIZATION, SITE_URL } from "@/lib/seo/site";

export { SITE_URL };

/**
 * The page itself as a WebPage node, carrying the same `dateModified` as the sitemap's
 * <lastmod> (src/lib/seo/last-modified.ts). Place, Country and ItemList nodes are not
 * creative works, so the date lives here rather than on them.
 */
export function webPage({ path, name, dateModified, about }: { path: string; name: string; dateModified: string; about?: string }): object {
  return {
    "@type": "WebPage",
    "@id": `${SITE_URL}${path}#page`,
    url: `${SITE_URL}${path}`,
    name,
    inLanguage: "en",
    dateModified,
    isPartOf: { "@type": "WebSite", name: "Countrivo", url: SITE_URL },
    publisher: ORGANIZATION,
    ...(about ? { about: { "@id": about } } : {}),
  };
}

export interface Crumb {
  name: string;
  /** Path, e.g. `/countries/germany`; the site URL is prepended. */
  path: string;
}

export function breadcrumbList(crumbs: readonly Crumb[]): object {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.path}`,
    })),
  };
}

export function faqPage(items: readonly { q: string; a: string }[]): object {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}

/** `<script {...jsonLdProps(graph)} />`: one ld+json block, server rendered. */
export function jsonLdProps(data: unknown): {
  type: string;
  dangerouslySetInnerHTML: { __html: string };
} {
  return {
    type: "application/ld+json",
    dangerouslySetInnerHTML: { __html: JSON.stringify(data).replace(/</g, '\\u003c') },
  };
}

/** The `@graph` wrapper the old pages used. */
export function graph(nodes: readonly object[]): object {
  return { "@context": "https://schema.org", "@graph": nodes };
}

/** A single top-level node. */
export function node(data: object): object {
  return { "@context": "https://schema.org", ...data };
}
