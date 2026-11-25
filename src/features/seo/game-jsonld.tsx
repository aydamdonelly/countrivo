import { breadcrumbList, graph, jsonLdProps, SITE_URL } from "./breadcrumbs";
import { getGameBySlug } from "@/lib/data/registry";
import { APP_STORE_URL, ORGANIZATION } from "@/lib/seo/site";

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
  /** ISO date the landing last changed, the same instant as its sitemap <lastmod>. */
  dateModified?: string;
}

/**
 * BreadcrumbList + VideoGame for one landing, moved from src/components/seo/game-jsonld.tsx
 * with the same field set. The `rules`-derived "Step N: What happens next?" FAQPage is
 * dropped (blueprint 7.3): the landing emits one FAQPage, built from GAME_COPY.
 *
 * Every game also plays inside the Countrivo iPhone app (it loads this site), so the
 * VideoGame names iOS as a platform and the App Store page as its install URL, and the
 * author is the one Organization node whose `sameAs` is that App Store page.
 */
export function GameJsonLd({ name, description, url, genre, playMode, title, dateModified }: GameJsonLdProps) {
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
      operatingSystem: "Web Browser, iOS",
      gamePlatform: ["Web browser", "iOS"],
      installUrl: APP_STORE_URL,
      isAccessibleForFree: true,
      inLanguage: "en",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      author: ORGANIZATION,
      publisher: ORGANIZATION,
      ...(dateModified ? { dateModified } : {}),
      potentialAction: {
        "@type": "PlayAction",
        target: `${pageUrl}/play?mode=${mode}`,
      },
    },
  ]);
  return <script {...jsonLdProps(data)} />;
}
