import type { NextConfig } from "next";

// User agents that must get a BLOCKING render — Next holds the response until
// <head> is complete instead of streaming the shell and appending <title>/<meta>
// after <body>. Any crawler that doesn't run JavaScript sees no metadata at all
// unless it matches this pattern, so every AI crawler has to be listed here.
//
// WARNING: THIS REPLACES NEXT'S DEFAULT LIST — IT DOES NOT MERGE WITH IT.
// The first block below is a verbatim copy of Next 16.2.1's default
// HTML_LIMITED_BOT_UA_RE (node_modules/next/dist/shared/lib/router/utils/html-bots.js).
// Deleting any of it silently breaks metadata for Bingbot, Applebot,
// facebookexternalhit, Twitterbot, Slackbot and Discordbot. If you upgrade Next,
// re-diff that file against the first block. The second block is ours to extend.
//
// Next reads only `.source` off the RegExp we hand it and re-compiles it with
// the `i` flag at match time, so the `i` below is documentation, not behaviour.

// Verbatim copy of Next 16.2.1's default. DO NOT EDIT — re-diff against
// node_modules/next/dist/shared/lib/router/utils/html-bots.js on every upgrade.
const NEXT_DEFAULT_HTML_LIMITED_BOTS =
  "[\\w-]+-Google|Google-[\\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight";

// Ours to extend — AI answer engines and training crawlers, none of which run
// JavaScript and none of which are in Next's default list.
const AI_CRAWLER_BOTS =
  "GPTBot|OAI-SearchBot|OAI-AdsBot|ChatGPT-User|ClaudeBot|Claude-User|Claude-SearchBot|PerplexityBot|Perplexity-User|meta-externalagent|Meta-WebIndexer|Bytespider|CCBot|Amazonbot|DuckAssistBot|MistralAI-User|Diffbot|cohere-ai|Timpibot|YouBot|Gemini-Deep-Research";

const HTML_LIMITED_BOTS = new RegExp(
  `${NEXT_DEFAULT_HTML_LIMITED_BOTS}|${AI_CRAWLER_BOTS}`,
  "i",
);

// The eleven games cut from the roster (Aug 2026). Their landings were indexed, so every
// old URL under /games/{slug} keeps a permanent home on the closest surviving page: a
// nearby game where one exists, the hub where none does. Kept as data so the pairs stay
// readable and the play, leaderboard, run and opengraph-image children follow the parent.
const RETIRED_GAMES: Record<string, string> = {
  "capital-match": "/games/flag-quiz",
  blitz: "/games/flag-quiz",
  "population-sort": "/games/higher-or-lower",
  "risk-zone": "/games/higher-or-lower",
  "border-buddies": "/games/geo-wordle",
  borderline: "/games/geo-wordle",
  supremacy: "/games/country-draft",
  cluster: "/games",
  "odd-one-out": "/games",
  "continent-sprint": "/games",
  "country-streak": "/games",
};

const retiredGameRedirects = Object.entries(RETIRED_GAMES).flatMap(([slug, destination]) => [
  { source: `/games/${slug}`, destination, statusCode: 301 as const },
  { source: `/games/${slug}/:path*`, destination, statusCode: 301 as const },
]);

// World Draft and Country Draft were the same game described twice (Aug 2026): the cabinet
// draft now lives at /games/country-draft, the URL that already ranks, so /games/world-draft
// folds into it rather than splitting the search demand across two pages. /games/country-draft
// itself is never redirected — it keeps serving, with the new game on it.
const worldDraftRedirects = [
  { source: "/games/world-draft", destination: "/games/country-draft", statusCode: 301 as const },
  { source: "/games/world-draft/:path*", destination: "/games/country-draft", statusCode: 301 as const },
];

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  htmlLimitedBots: HTML_LIMITED_BOTS,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // Long-cache the non-hashed static assets in /public. Hashed
        // /_next/static files already get immutable caching from Next.js.
        source: "/favicon.svg",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // The apex is canonical; www served duplicates with a 200 (SEO audit, Aug 2026).
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.countrivo.com" }],
        destination: "https://countrivo.com/:path*",
        permanent: true,
      },
      { source: "/vs/:code", destination: "/games", permanent: true },
      { source: "/games/countryle", destination: "/games", permanent: true },
      { source: "/games/countryle/play", destination: "/games", permanent: true },
      ...worldDraftRedirects,
      ...retiredGameRedirects,
    ];
  },
};

export default nextConfig;
