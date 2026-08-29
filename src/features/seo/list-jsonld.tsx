import { jsonLdProps, node, SITE_URL } from "./breadcrumbs";

export interface ListJsonLdItem {
  /** 1-based rank. */
  position: number;
  name: string;
  /** Relative path to the country page. */
  url?: string;
}

export interface ListItemJsonLdProps {
  name: string;
  description: string;
  /** Relative path, e.g. "/lists/largest-countries". */
  url: string;
  items: readonly ListJsonLdItem[];
}

/**
 * The ranking as schema.org ItemList, moved from src/components/seo/list-jsonld.tsx with
 * the same output. Rendered beside the page's BreadcrumbList and FAQPage graph.
 */
export function ListItemJsonLd({ name, description, url, items }: ListItemJsonLdProps) {
  const data = node({
    "@type": "ItemList",
    name,
    description,
    url: `${SITE_URL}${url}`,
    numberOfItems: items.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      name: item.name,
      ...(item.url ? { url: `${SITE_URL}${item.url}` } : {}),
    })),
  });
  return <script {...jsonLdProps(data)} />;
}
