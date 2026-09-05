# Search acquisition

## September 2026 priorities

GeoWordle's existing `/games/geo-wordle` URL is the landing page for the daily and
unlimited game. Keep that URL stable. Its search result should explain the actual
offer: country deduction, six guesses, distance and direction clues, free daily
play and unlimited practice. The visible page must deliver each promise.

Country Draft already attracts most organic visits. Preserve its cabinet-game
name, URL, scoring explanation and direct route into play. Blind Pick is a
different game; do not rename it back or split Country Draft into duplicate pages.

GeoWordle's distance guide uses the real engine against a fixed, explicitly named
example answer. It never reads the daily seed. Country counts come from the
eligible pool, not the platform's larger dataset. Keep the guide, FAQs, game
mechanics and metadata consistent when changing the game.

The games hub targets broader geography-game intent. The footer and contextual
game links give visitors and crawlers a route to GeoWordle from country profiles,
rankings and other games. Retired published game URLs redirect to their closest
surviving game instead of returning a dead end.

## Measure the next iteration

The read-only report uses Python's standard library and an existing Google Cloud
CLI installation. It does not install packages or change credentials. The service
account must already have access to the Search Console property.

```sh
python3 scripts/search-console-report.py --end-date 2026-09-02 \
  --output-dir /tmp/countrivo-search-baseline

python3 scripts/search-console-report.py --days 28 \
  --output-dir /tmp/countrivo-search-current

python3 scripts/search-console-report.py --days 90 \
  --output-dir /tmp/countrivo-search-quarter
```

Authentication uses `GOOGLE_APPLICATION_CREDENTIALS`, `--credentials`, the existing
`~/.config/countrivo-seo/gsc-sa.json`, or existing gcloud application-default
credentials. Never commit credentials or raw exports. Reports contain current
and previous periods, site and GeoWordle totals, and query/page/device/country/day
breakdowns. Dates are inclusive Pacific Time dates. Only finalized data is
requested; allow for GSC's reporting delay.

After Google recrawls the landing, compare equal 28-day windows. Use a 7-day view
only as an early signal because the click counts are small. Record:

- GeoWordle's page clicks, impressions, CTR and position.
- The exact `geowordle` query on that page, split by device and country.
- New non-brand queries, including country Wordle and country guessing game.
- Country Draft clicks and impressions separately, to distinguish changes in its
  demand from changes in GeoWordle performance.
- Landing and play-route visits in the existing web analytics, alongside return
  visits where the analytics provides them. GSC clicks alone do not measure play.

Do not sum query rows to recreate totals: anonymized queries and API row limits
omit data. Average position across the whole site mixes very different queries.
A CTR change is not automatically caused by the new title; position, device mix,
country mix and demand can change at the same time.

Broader reach requires more relevant impressions as well as better CTR. Use new
query evidence to choose the next useful guide or game improvement. Avoid near
duplicate "today", "unlimited" and spelling-variant landing pages, generic country
articles without distinct value, or publishing today's answer as an acquisition
tactic. A distinct language version needs translated game controls and country
names, not just translated metadata.

## Publishing checks

After changing game copy or metadata, regenerate content fingerprints. An unchanged
country dataset must retain its previous date even when a game is updated.

```sh
npx tsx scripts/build-data-timestamps.ts
npm run lint
npm run check:theme
npm run check:contracts
npx tsx scripts/check-geo-wordle.ts
npx tsx scripts/check-indexnow.ts
npx tsx scripts/submit-indexnow.ts --dry-run
npm run build
npx next start -p 3290
```

With the production server running:

```sh
node scripts/check-render.mjs --base http://localhost:3290 --out /tmp/countrivo-render
CRAWLER_CHECK_BASE_URL=http://localhost:3290 npx tsx scripts/check-crawler-access.ts
```

Check the live canonical, title, description, sitemap and daily/practice links
after deployment. GSC URL Inspection reports Google's indexed version; it is not
a live fetch and may still show the prior crawl. Valid schema describes the game;
it does not guarantee a rich result or a ranking improvement.

The crawler and IndexNow workflows use Node 22. Reproduce CI installation with
`npm ci --legacy-peer-deps=false`; a local global `legacy-peer-deps=true` setting
can hide an invalid peer-dependency lockfile. Validate this in a clean checkout.
IndexNow's dry run prints changed canonical URLs without sending requests or
writing its snapshot. A successful submission confirms receipt, not indexing.
Only update the committed snapshot after the corresponding URLs were accepted.

References: [Google title links](https://developers.google.com/search/docs/appearance/title-link),
[snippets](https://developers.google.com/search/docs/appearance/snippet),
[canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls),
[Search Analytics API](https://developers.google.com/webmaster-tools/v1/searchanalytics/query).
