/**
 * JSON-LD helpers shared by every static family (blueprint 7.3, 7.9, 7.11, 7.13). The
 * breadcrumb shapes are the ones the old pages emitted, so the graph types per URL are
 * unchanged.
 */

export const SITE_URL = "https://countrivo.com";

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
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
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
