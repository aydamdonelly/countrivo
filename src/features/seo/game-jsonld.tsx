import { breadcrumbList, graph, jsonLdProps, SITE_URL } from "./breadcrumbs";
import { getGameBySlug } from "@/lib/data/registry";

export interface GameJsonLdProps {
  /** Game name, e.g. "Flag Quiz". */
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
  const pageUrl = `${SITE_URL}${url}`;
  const game = getGameBySlug(url.split("/").at(-1) ?? "");
  const mode = game?.availableModes.includes("daily") ? "daily" : "practice";
  const data = graph([
    breadcrumbList([
      { name: "Home", path: "" },
      { name: "Games", path: "/games" },
      { name: title ?? name, path: url },
    ]),
    {
      "@type": "VideoGame",
      "@id": `${pageUrl}#game`,
      name: title ?? name,
      description,
      url: pageUrl,
      genre,
      playMode: `https://schema.org/${playMode}`,
      applicationCategory: "Game",
      operatingSystem: "Web Browser",
      gamePlatform: "Web browser",
      isAccessibleForFree: true,
      inLanguage: "en",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      author: { "@type": "Organization", name: "Countrivo", url: SITE_URL },
      potentialAction: {
        "@type": "PlayAction",
        target: `${pageUrl}/play?mode=${mode}`,
      },
    },
  ]);
  return <script {...jsonLdProps(data)} />;
}
