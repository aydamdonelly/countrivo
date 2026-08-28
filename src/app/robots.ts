import type { MetadataRoute } from "next";

// One `User-agent: *` group that allows everything — including Google-Extended,
// GPTBot, ClaudeBot, PerplexityBot and every other AI crawler. That is deliberate:
// Countrivo is an acquisition site and wants to be cited by answer engines.
//
// ⚠️ Do NOT add named AI-bot groups here. robots.txt is not additive: a crawler
// obeys the single most specific matching group and ignores `*` entirely. Adding
// `User-agent: GPTBot` with anything less than the full rule set silently CHANGES
// GPTBot's behaviour rather than adding to it. Allow-everything is already the
// maximally permissive configuration — there is nothing a named group can add.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    // Sitemap index is sharded by section — register every shard.
    sitemap: [
      "https://countrivo.com/sitemap.xml",
      "https://countrivo.com/countries/sitemap.xml",
      "https://countrivo.com/lists/sitemap.xml",
      "https://countrivo.com/games/sitemap.xml",
    ],
  };
}
