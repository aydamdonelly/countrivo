interface ListItem {
  position: number; // 1-based rank
  name: string;     // country display name
  url?: string;     // optional absolute or relative URL to the country page
}

interface ListItemJsonLdProps {
  name: string;        // human title of the ranking, e.g. "Largest Countries in the World by Area"
  description: string; // short description of what the list ranks
  url: string;         // relative path, e.g. "/lists/largest-countries"
  items: ListItem[];   // ordered ranked countries (position + name)
}

/**
 * Emits a schema.org ItemList so search engines can read the ranking
 * (position + country name) as structured data. Rendered alongside the
 * page's existing BreadcrumbList/FAQPage script — multiple JSON-LD blocks
 * per page are valid.
 */
export function ListItemJsonLd({ name, description, url, items }: ListItemJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    description,
    url: `https://countrivo.com${url}`,
    numberOfItems: items.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      name: item.name,
      ...(item.url
        ? { url: item.url.startsWith("http") ? item.url : `https://countrivo.com${item.url}` }
        : {}),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
