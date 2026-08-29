import { breadcrumbList, graph, jsonLdProps, SITE_URL } from "./breadcrumbs";

export interface GameJsonLdProps {
  /** Full name, e.g. "Flag Quiz | Countrivo". */
  name: string;
  description: string;
  /** Relative path, e.g. "/games/flag-quiz". */
  url: string;
  genre: string;
  playMode: string;
  /** Clean title for the breadcrumb. */
  title?: string;
}

/**
 * BreadcrumbList + VideoGame for one landing, moved from src/components/seo/game-jsonld.tsx
 * with the same field set. The `rules`-derived "Step N: What happens next?" FAQPage is
 * dropped (blueprint 7.3): the landing emits one FAQPage, built from GAME_COPY.
 */
export function GameJsonLd({ name, description, url, genre, playMode, title }: GameJsonLdProps) {
  const data = graph([
    breadcrumbList([
      { name: "Home", path: "" },
      { name: "Games", path: "/games" },
      { name: title ?? name, path: url },
    ]),
    {
      "@type": "VideoGame",
      name,
      description,
      url: `${SITE_URL}${url}`,
      genre,
      playMode,
      applicationCategory: "Game",
      operatingSystem: "Web Browser",
      isAccessibleForFree: true,
      inLanguage: "en-US",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      author: { "@type": "Organization", name: "Countrivo", url: SITE_URL },
    },
  ]);
  return <script {...jsonLdProps(data)} />;
}
