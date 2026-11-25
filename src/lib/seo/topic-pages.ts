/**
 * Root-level topic pages, one per search intent (Phase 5 build list, item 6). Shared by
 * the sitemap, the timestamp fingerprints and IndexNow, like PRACTICE_PAGES. Each slug
 * is a route at `/{slug}` with its view in `src/features/seo/{slug}.tsx`.
 */
export const TOPIC_PAGES = ['world-map-quiz', 'games-like-worldle'] as const;
