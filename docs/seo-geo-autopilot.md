# SEO + GEO Autopilot — research findings, August 2026

> **Status 2026-08-02:** Tier 1 items 1.1–1.3 and 1.5–1.7 shipped, plus Tier 2 items 2.1, 2.4, 2.5
> (partial), 2.7 (partial) and 2.8. Not built: the player-stats layer (1.4), the `/quiz` layer (2.2),
> the `/unlimited` `/today` `/archive` URL set (2.3), the measurement loop (2.6) and all of Tier 3.
> Two claims in this document were disproven on inspection — see the corrections section.

Researched by a 13-agent swarm (6 independent angles, each adversarially fact-checked, then
synthesised). Every code-level claim below was independently re-verified against this repo and
against the live site before being written down. Claims that failed verification are marked.

**Constraint that shaped every ranking:** build once, then it runs itself. Anything needing
recurring human work is labelled as such and pushed down or cut.

---

## The thesis

Growth here is not a content problem. It is a **closed loop that is only 12% wired**.

`src/components/share/share-card.tsx` narrows `ShareGame` to `"country-draft" | "stat-guesser"` —
**2 of 17 games emit a shareable result**, and the string they emit points at `https://countrivo.com`
instead of the game's own URL.

The precedent is unambiguous. Worldle earns ~994,800 of its ~1.0M monthly organic visits from the
single token `worldle`. The causal chain is:

```
share string  →  people search the game's NAME  →  you rank #1 on a zero-competition term
```

SEO does not create that demand. It harvests it. Which is why the share payload outranks every
content idea in this document.

The second lever is the one thing Google's own AI-optimization guide ranks above all its other
suggestions: *"creating content that people find unique, compelling, and useful will likely
influence your website's presence in generative AI search in the long run more than any of the
other suggestions in this guide."* The `game_runs` table is a dataset **no competitor, scraper or
answer engine can reproduce**. Surfacing it turns every country page into a source of facts only
Countrivo can supply — and makes freshness real instead of cosmetic.

Treat GEO as identical to SEO. Google says so outright: *"optimizing for generative AI search is
optimizing for the search experience, and thus still SEO."* There is no separate AI checklist.

---

## Verified state of the repo (checked 2026-08-01)

| Claim | Status |
|---|---|
| `share-card.tsx` supports only 2 of 17 games | ✅ confirmed |
| Share string points at `countrivo.com`, not the game URL | ✅ confirmed |
| `sitemap.ts` stamps a single `new Date()` on all ~301 URLs | ✅ confirmed |
| `sitemap.ts` still sets `changeFrequency` + `priority` (both ignored by Google) | ✅ confirmed |
| `scripts/submit-indexnow.ts` posts to `https://www.bing.com/indexnow` (Bing only), run by hand | ✅ confirmed |
| Only one OG image exists (`src/app/opengraph-image.tsx`) | ✅ confirmed |
| No `.github/` directory — no CI, no scheduled jobs | ✅ confirmed |
| `robots.ts` is a single `User-agent: * / Allow: /` | ✅ confirmed — and this is already correct |
| `<title>My Profile \| Countrivo \| Countrivo</title>` on /profile | ✅ confirmed live |
| Root layout OG description says "14 free geography games" | ✅ confirmed — stale, there are 17 |
| Country + list pages hide facts behind client state | ❌ **FALSE** — see below |
| `run/[runId]` defers metadata, hurting AI crawlers | ⚠️ **overstated** — see below |

### Correction 1 — country pages are already fine. Do not refactor them.

Probed live as `OAI-SearchBot`:

```
/countries/japan          HTTP 200 | 2,142 chars visible text | canaries: 124.5M, 84.0 years ✅
/lists/largest-countries  HTTP 200 | 2,903 chars visible text ✅
/games/blitz              HTTP 200 | 1,090 chars visible text ✅
```

All three ship `<title>` before `<body>`. All three return full prerendered HTML to AI crawlers with
no bot challenge. The widely-circulated "your facts aren't server-rendered" diagnosis came from a
**case-sensitive grep for `Life expectancy` against rendered `Life Expectancy`**.

Write a regression test. Do not rewrite the pages.

### Correction 2 — the streaming-metadata issue is real but low-stakes

`src/app/games/[slug]/run/[runId]/page.tsx` does `await getRunDetail(...)` inside
`generateMetadata`, so metadata streams after `<body>` for any bot not in Next's
`htmlLimitedBots` list — and no AI crawler is in that default list.

But: **that page already sets `robots: { index: false }`**, and it is the *only* indexable-route
`generateMetadata` in the app that awaits data. Social unfurl bots (facebookexternalhit, Discordbot,
Twitterbot, Slackbot) *are* in Next's default list and already get buffered HTML.

So the `htmlLimitedBots` change is cheap insurance, not an emergency. Keep it in Tier 1 because it
costs one line — but the "this is actively bleeding AI visibility" framing does not survive
verification.

---

## Tier 1 — Close the loop that already exists

Six of seven are small or trivial. Every one either directly produces new players or fixes a
verified live defect.

### 1.1 Ship the shareable result payload for all 17 games — point each at its own game URL
`impact: transformative · effort: medium · runs itself: yes`

Replace the `ShareGame` union with a registry-driven dispatcher: `buildShareText(slug, result,
dateKey)` looks up an optional per-game grid builder in `src/components/share/{slug}-grid.tsx` and
falls back to a generic line:

```
Countrivo · {game.title} · #{dailyNumber(dateKey)} · {score}
https://countrivo.com/games/{slug}
```

Change the trailing URL in `country-draft-grid.tsx` and `stat-guesser-grid.tsx` from
`https://countrivo.com` to `https://countrivo.com/games/{slug}`. **The homepage URL manufactures one
brand token. The per-game URL manufactures 17.**

Mechanics that matter:
- Keep it a **single plain-text blob**. Call `navigator.share({ text })` with the URL *inside* `text`.
  Never split `text`/`url` — the Web Share spec permits targets to "discard or combine members".
- Never pass `files` — many share targets then drop the text entirely.
- Keep the clipboard fallback and the visible `Copied!` state.
- Mount `<ShareCard>` in `src/components/game/game-over-screen.tsx` for **every** game, not two.
- On the Capacitor iOS build, use the native Share plugin, not `navigator.share`.

### 1.2 Per-game and per-run Open Graph images
`impact: high · effort: small · runs itself: yes`

Add `src/app/games/[slug]/opengraph-image.tsx` and
`src/app/games/[slug]/run/[runId]/opengraph-image.tsx` using `ImageResponse` (same pattern as the
existing root file). Render game title + daily number + the emoji/score grid + the literal string
`countrivo.com`. Edge-rendered and cached — zero ongoing work.

The run permalink route already exists and is a server component, so shared result links already
resolve to crawlable HTML. The OG image is the missing half.

### 1.3 Generate the extractable per-game entity block from `game-registry.json`
`impact: high · effort: small · runs itself: yes`

`src/data/game-registry.json` already carries slug, title, shortDescription, description, difficulty,
estimatedTime, category, availableModes, route for all 17 games. Render, as **server HTML** on each
`/games/{slug}` landing page, a block in plain declarative prose stating:

- the exact game name
- a one-sentence definition of the mechanic — *"{Name} is a daily geography game in which players…"*
- what skill it trains
- round count and typical duration (`estimatedTime`)
- that it is free and needs no signup
- whether there is a daily mode, and that it resets at midnight Europe/Berlin
- that it covers 243 countries
- one honest positioning sentence — *"similar to Worldle, but…"*

Plus one platform sentence on every game page: *"Countrivo is a free browser-based geography game
platform with 17 daily games covering 243 countries."* **That is the sentence an LLM lifts when asked
to recommend a game.**

Name entities explicitly; avoid pronouns across sections; open sections with definition sentences.
One template edit, applied to 17 games forever. **Never rename a game URL** — entity stability is what
lets citations accumulate.

### 1.4 Surface player-derived statistics from `game_runs`
`impact: transformative · effort: medium · runs itself: yes`

Add Supabase RPCs (`get_country_difficulty`, `get_game_score_distribution`, `get_hardest_countries`)
returning aggregates over `game_runs`, called from the existing **server** components with
`export const revalidate = 86400`. This deliberately avoids Vercel Cron, which needs an HTTP endpoint
and therefore a `route.ts` — banned by `AGENTS.md`.

Surfaces:
- `/countries/{slug}` — *"Players identify Bhutan's flag correctly 31% of the time across 84,000
  attempts"*, *"the 7th most-missed country this month"*
- `/games/{slug}` — score distribution and median
- new `/stats` — *"the 20 hardest countries in the world, ranked by N real player answers"*
- new `/data` — CSV + JSON under CC BY 4.0 with `Dataset` JSON-LD

Three payoffs from one query layer:
1. It is the only content on the site that satisfies Google's helpful-content test — *"Does the
   content provide original information, reporting, research, or analysis?"* — with data nobody else has.
2. It makes the numbers genuinely change, so `dateModified` is **real** rather than the cosmetic
   date-bumping Google's helpful-content doc explicitly warns against.
3. It is the prerequisite that makes any future page expansion (archives, hints, quizzes) survive the
   scaled-content-abuse bar.

> `Dataset` markup powers Google **Dataset Search**, not Google Search. Publish it for entity value,
> not traffic.

### 1.5 Make sitemap `lastmod` truthful, and shard by section
`impact: high · effort: small · runs itself: yes`

Google honours `lastmod` only *"if it's consistently and verifiably accurate"*. A single `new Date()`
across all 301 URLs is precisely the pattern Mueller has said makes Google discard it. And because
**Google participates in neither IndexNow nor the Indexing API** for these page types, accurate
`lastmod` is the *only* Google-side freshness lever this site has.

- Have `scripts/fetch-country-data.ts` and `scripts/compute-ranks.ts` hash each record before writing
  and emit `src/data/data-timestamps.json` mapping record key → ISO date of last **actual value change**.
  Read that in `sitemap.ts`.
- Split into `src/app/countries/sitemap.ts`, `src/app/lists/sitemap.ts`, `src/app/games/sitemap.ts`
  for free per-section indexation diagnostics in GSC and Bing WMT.
- **Delete `changeFrequency` and `priority`** from every entry — Google ignores both.
- If you use `generateSitemaps`, Next 16 passes `id` as a **Promise**:
  `export default async function sitemap(props: { id: Promise<string> }) { const id = await props.id }`.
  Next 15-era code breaks silently.
- Fix `<title>My Profile | Countrivo | Countrivo</title>` (same class as commit `ac2bf53`), and the
  stale "14 free geography games" in the root layout OG description.

### 1.6 Repoint IndexNow at the fan-out endpoint, diff before submitting, automate it
`impact: medium · effort: trivial · runs itself: yes`

- Change `ENDPOINT` from `https://www.bing.com/indexnow` to **`https://api.indexnow.org/indexnow`**,
  which fans out to all participants (Bing, Yandex, Naver, Seznam.cz, Yep, Amazon). Google is not and
  never has been a participant.
- Persist the previous run's URL+lastmod snapshot and submit **only changed URLs** — resubmitting
  unchanged URLs earns HTTP 429 and reduced trust.
- Response codes: `200/202` accepted, `403` invalid key, `422` URL/host mismatch, `429` rate limited.
  Cap is 10,000 URLs per POST, so all ~300 fit in one call.
- The key file `public/f9505761df0dc045e453ea76165d13b0.txt` already exists and resolves.
- Add `.github/workflows/indexnow.yml` with `on: push: branches: [main]` plus a weekly `schedule: cron`.
  There is currently **no `.github/` directory at all** — creating it is also the prerequisite for the
  CI guards in Tier 2.

> Justify this on **Bing/Copilot distribution only**. OpenAI's own crawler docs describe OAI-SearchBot
> as its first-party search crawler and never mention Bing, so the popular "IndexNow → Bing → ChatGPT"
> claim is unsupported.

### 1.7 Add AI crawlers to `htmlLimitedBots` in `next.config.ts`
`impact: medium · effort: trivial · runs itself: yes`

Next 16.2.1's default `HTML_LIMITED_BOT_UA_RE` contains **no AI crawler**, so on any route where
`generateMetadata` defers to request time, Next streams the shell and appends `<title>` / meta
description / OG *after* `<body>` — and no AI crawler executes JavaScript.

Set `htmlLimitedBots` to the **full default regex plus**:

```
GPTBot|OAI-SearchBot|OAI-AdsBot|ChatGPT-User|ClaudeBot|Claude-User|Claude-SearchBot|
PerplexityBot|Perplexity-User|meta-externalagent|Meta-WebIndexer|Bytespider|CCBot|
Amazonbot|DuckAssistBot|MistralAI-User|Diffbot|cohere-ai|Timpibot|YouBot|Gemini-Deep-Research
```

> ⚠️ Setting this **replaces** Next's default list. Re-paste the defaults or you break Bingbot,
> Applebot, facebookexternalhit, Twitterbot, Slackbot and Discordbot metadata.

This becomes mandatory rather than prudent if `cacheComponents` (PPR) is ever enabled.

---

## Tier 2 — Build the non-branded acquisition surface, plus a guard that keeps it alive

Tier 1 creates and captures **branded** demand. Tier 2 is where genuinely new, **non-branded** players
come from. The evidence is a clean split: play-intent and tool queries are the low-AI-Overview,
high-click surface (Ahrefs, 146M SERPs: transactional 2.1% AIO trigger vs informational 21.4%).
Sporcle proves the demand — only ~9% of its 1.3M monthly visits are branded; the rest come from
literal `{X} quiz` pages, with "flags of the world quiz" at #1.

### 2.1 AI-crawler reachability + SSR regression test in CI
`impact: high · effort: small · runs itself: yes`

`.github/workflows/crawler-check.yml`, daily cron. For ~8 canonical URLs and each of
`OAI-SearchBot`, `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Bingbot`, `Googlebot`:
`curl -A '<ua>'`, then assert:

- HTTP 200, no `cf-ray` or challenge markers
- visible-text length above a **per-page floor** = today's measured value − 20%.
  Measured: `/countries/japan` 2,142 · `/lists/largest-countries` 2,903 · `/` 1,602 · `/games/blitz` 1,090.
  A blanket 3,000-char floor produces four false failures on day one.
- **case-insensitive** canary regexes asserting on **values, not labels**: `/124\.5M/`, `/84\.0 years/`.
  (A case-sensitive grep for `Life expectancy` against rendered `Life Expectancy` is what produced the
  erroneous "your facts aren't server-rendered" diagnosis in the first place.)
- `<title>` and meta description appear before `</head>` — catches a streaming-metadata regression directly
- `robots.txt` still returns `Allow: /`

Fail the workflow → it emails you. Re-run the `curl -A GPTBot` check *periodically*, not once:
OAI-SearchBot now ships a Chrome-based UA string, hinting at headless-Chrome infrastructure. Treat
"AI crawlers never render JS" as current fact, not permanent law.

### 2.2 Programmatic `/quiz/{topic}` layer — the single largest new non-branded surface
`impact: high · effort: large · runs itself: yes`

Generate ~60–100 static routes from `countries.json` / `categories.json` via `generateStaticParams`:
`/quiz/flags-of-the-world`, `/quiz/capital-cities`, `/quiz/countries-of-europe`, `/quiz/africa-map`,
`/quiz/country-shapes`, `/quiz/flags-of-asia`, regional sets.

Each page = a filtered country set fed into an existing game engine + a server-rendered intro + the
full answer key as HTML + the Tier-1 player-difficulty stats for that set.

This targets the literal `{X} quiz` pattern that carries Sporcle (1.3M visits, ~9% branded) and
JetPunk (8.33M visits, 67.8% direct). **Play intent, not fact intent** — an AI answer cannot satisfy
"get me to a thing I can click".

- **Hard gate:** do not emit a page unless it carries a distinct question set **and** live
  player-derived stats. Gate generation on data availability rather than shipping a thin page.
- Ship in phases (first ~30, measure GSC index coverage 3–4 weeks, then the rest) — not to avoid a
  penalty, for which there is no primary evidence, but so you learn whether the template indexes
  before committing 100 URLs to it.
- Implement phasing as a `publishAfter` date field in JSON honoured by `sitemap.ts` + a noindex
  switch, so releasing the next batch needs **zero deploys**.

### 2.3 Brand-defence URL set per game: `/unlimited`, `/today`, `/archive`
`impact: high · effort: medium · runs itself: yes`

Generated from `game-registry.json` at build time:

- `/games/{slug}/unlimited` — practice mode already exists; it just needs its own indexable URL, H1 and copy
- `/games/{slug}/today` — **ONE evergreen URL, continuously updated.** Verified live 2026-08-01:
  `tomsguide.com/news/what-is-todays-wordle-answer` serves *"Today's Wordle hints and answer: August 1,
  2026, solution #1,869"* from a single stable URL. **Never mint a new URL per day** and fragment your
  own equity.
- `/games/{slug}/archive/{YYYY-MM}` — monthly hubs listing **playable** dated puzzles at
  `/games/{slug}/{YYYY-MM-DD}`

Because `dateSeed` + `mulberry32` is deterministic, every past date replays exactly — which makes each
dated page a **distinct interactive artifact** rather than a spoiler stub. That is the one thing no
aggregator can copy. Attach that date's score distribution from `game_runs` to each dated page.

Do not put all ~6,200 dated URLs in the sitemap on day one: index the current month plus the monthly
hubs, and let dated pages enter on a rolling basis.

> This exists because the alternative is someone else owning your SERP: `globle-game.com` outranks the
> original `globle.org` on the brand term "globle".

### 2.4 A modest set of question H2s + short answer capsules on country and list pages
`impact: high · effort: small · runs itself: yes`

On each `/countries/{slug}` and `/lists/{slug}`, add **4–8** question-shaped H2s a player would
actually ask, each followed by **one bare declarative answer of ~20–25 words / 120–150 characters**,
no links, placed in the first third of the DOM.

Use 20–25 words: that is the figure from the Search Engine Land study (Adam Gnuse, Saltbox Solutions,
Nov 2025, 15 domains) that actually *measured* answer capsules. The widely-quoted 40–75 word figure
traces to a vendor page with no methodology.

> 🚫 **HARD LIMIT — the correction that matters most.** Do NOT generate every attribute × every
> question form to blanket the fan-out surface. Google's guide names that exact tactic:
> *"While it might be tempting to create separate content for every possible variation of how people
> might search (for example, by focusing on other queries that people have asked, or fan-out queries),
> doing so primarily to manipulate rankings or generative AI responses in Google Search violates
> Google's scaled content abuse spam policy."*

Also add a visible `Data updated {date}` stamp driven by `data-timestamps.json`, never hand-edited.

Ignore the "150–300 word chunk" prescription — Google explicitly mythbusts it: *"There's no
requirement to break your content into tiny pieces… There's no ideal page length."*

### 2.5 Data-derived internal linking + an orphan-detection build gate
`impact: high · effort: small · runs itself: yes`

Every `/countries/{slug}` auto-links to: its region hub, every bordering country from `borders.json`,
the top 3 ranking lists where it places top-10 or bottom-10 (computed from `ranks.json`), its own
`/quiz/{slug}`, and the two countries immediately above and below it by population and area.

That is 10–25 contextual, genuinely useful, per-page-distinct links with **zero editorial work**.

Then add a CI step that enumerates all routes from `generateStaticParams`, crawls the rendered
`<a href>` graph from `/`, and **fails the build if any route is unreachable**. Orphaned programmatic
pages are the most common pSEO failure mode and are almost always a template filter bug when a new
entity is added to the dataset.

> Crawl budget is a non-issue here. Google's own doc classifies the relevant tier as *"10,000+ unique
> pages with very rapidly changing content"* and says smaller sites *"don't need to read this guide."*
> At ~1,200 pages, every indexation failure you see is a **quality or linking** failure — debug it as such.

### 2.6 Free, automated measurement loop — no paid GEO tool
`impact: high · effort: small · runs itself: yes`

Four pieces, all one-time:

**(1) Bot logging.** `src/middleware.ts` already runs Supabase session refresh on every request —
Next 16 renames `middleware.ts` → `proxy.ts`, so migrate and add a non-blocking `after()` insert into
`ai_traffic_log(ts, kind, ua, referer, path, country)` when the UA matches
`/GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-SearchBot|Claude-User|PerplexityBot|Perplexity-User|Bytespider|CCBot|Amazonbot|meta-externalagent/i`
or the referer matches an AI assistant. **Crawler hits are the leading indicator months before
referral traffic exists.**

> Do NOT put `Google-Extended` in the UA list — Google's crawler docs state verbatim that it
> *"doesn't have a separate HTTP request user agent string"*. It is a robots.txt control token only and
> will never appear in a log. Verify OpenAI bots by IP against `openai.com/searchbot.json`,
> `gptbot.json`, `chatgpt-user.json` rather than trusting a spoofable header.

**(2) Weekly digest.** `.github/workflows/seo-report.yml`: pull GSC `searchanalytics.query` (service
account, scope `webmasters.readonly` — remember to add the service account's `client_email` as a user
on the Search Console property; that is the #1 cause of 403s) plus Bing Webmaster API
`GetQueryStats`/`GetRankAndTrafficStats`, diff against last week, email a digest.

**(3) Citation probe, $0.** Same workflow: fire 40–60 target prompts (*"best daily geography game"*,
*"games like GeoGuessr"*, *"wordle for countries"*, *"free geography quiz for kids"*) at **Gemini with
Google Search grounding** — 5,000 free grounded requests/month on the 3.x family, verified on
`ai.google.dev/gemini-api/docs/pricing`, so this costs literally nothing. Regex the responses and
citation URLs for `countrivo`, write to `ai_citation_probe(date, engine, prompt, mentioned, cited_url)`,
alert only on deltas.

> Treat it as a **diff alarm and trend line, not ground truth**. API answers are not what a logged-in
> consumer sees, and Google injects per-user embeddings into AI Mode, so logged-out position tracking
> measures nothing stable.

**(4) GA4.** The native channel is `AI Assistants` (medium = `ai-assistant`, populated from an
unpublished Google-maintained referrer list). Add a custom channel group keyed on
`medium == 'ai-assistant'` **OR** a source regex covering `perplexity.ai|claude.ai|you.com|meta.ai`.
Accept that a large unquantified share of AI referrals arrive with **no referrer at all** and land in
Direct — which is why the first-party `proxy.ts` logging matters more.

### 2.7 One JSON-LD module for the whole site — as entity hygiene, not as an AI lever
`impact: medium · effort: medium · runs itself: yes`

Consolidate into `src/lib/seo/json-ld.ts` (alongside existing `game-jsonld.tsx`, `list-jsonld.tsx`),
emitting from the JSON data files with stable `@id` URIs.

| Page | Markup |
|---|---|
| Homepage | `Organization` (name, alternateName, url, logo ≥112×112, description, foundingDate, `sameAs` → Wikidata QID, App Store, GitHub, AlternativeTo, itch.io, Product Hunt, X, subreddit) + `WebSite` — **no `SearchAction`**, the sitelinks search box was retired in late 2024 and renders nothing |
| Every page | `BreadcrumbList` — still a live desktop rich result |
| `/games/{slug}` | co-typed `['WebApplication','VideoGame']`, `applicationCategory: 'GameApplication'`, `operatingSystem`, `offers.price: 0` — `VideoGame` alone produces no rich result |
| `/countries/{slug}` | `Country` with `identifier` (PropertyValue, ISO 3166-1 alpha-2) and `sameAs` → Wikidata QID + Wikipedia. Add `wikidataId`/`wikipediaUrl` to `countries.json` via a one-time SPARQL pull on P297 |
| `/lists/{slug}` | `ItemList` with `numberOfItems`, each item a `Country` node carrying its QID |

> **Set expectations to zero for AI citation lift.** Google states *"there's no special schema.org
> structured data that you need to add"*, and Ahrefs' matched difference-in-differences over 1,885 pages
> that added JSON-LD found AI Mode +2.4%, ChatGPT +2.2% (both indistinguishable from zero) and AI
> Overviews −4.6% (significant, *wrong direction*). Though every treated page already had 100+ citations,
> so the study cannot rule out schema helping a page **enter** the consideration set.

Gate it in CI with the **schema.org Schema Markup Validator** or a JSON-LD/SHACL check, **not** Google's
Rich Results Test — the latter only reports on features Google supports and will silently pass
malformed `Country`, `ItemList`-of-`Country` and `Dataset` markup.

### 2.8 A `/methodology` page + a tiered `robots.ts` that does not break what already works
`impact: medium · effort: trivial · runs itself: yes`

**(a) `/methodology`**, linked sitewide from the footer: which datasets are used (World Bank, UN,
Natural Earth), when they were last regenerated, and — critically — that rankings and derived
statistics are **computed by Countrivo's own scripts** rather than restated.

Google's scaled-content-abuse policy has five bullets; the one a reviewer would apply to a geography
site is *"Stitching or combining content from different web pages without adding value."* This page
plus the player-stats layer is the answer to it. It also satisfies the helpful-content "How" test:
*"Is the use of automation self-evident to visitors?"*

**(b) `robots.ts`.** It is currently a single `User-agent: * / Allow: /` — which is **already the
correct allow-everything configuration** for an acquisition site. The popular advice to add named
AI-bot groups is actively dangerous here: robots.txt is **not additive**. A crawler obeys the single
most specific matching group and **ignores `*` entirely**, so adding `User-agent: GPTBot` with
anything less than the full rule set silently changes GPTBot's behaviour.

Change only two things: add the new sitemap shard URLs, and if you add any `Disallow` (e.g. `/auth/`,
`/profile/edit`), put it in the **wildcard group**. Keep `Google-Extended` allowed — it governs Gemini
grounding, not just training, and blocking it costs visibility while buying nothing, since AI Overviews
and AI Mode are served through Googlebot anyway.

---

## Tier 3 — Speculative bets and long-payback builds

Only after Tiers 1 and 2 are live and measured. None of it is wrong; all of it is second-order.

### 3.1 Automated daily YouTube pipeline
`impact: high · effort: large`

The common verdict that this gets you removed is **wrong**. YouTube's "inauthentic content" policy
(renamed from "repetitious content" on 2025-07-15) is a **Partner Program monetization** policy —
YouTube's own wording is that such content *"has always been ineligible for monetization"*. A
non-monetized channel faces YPP ineligibility (irrelevant) and weak algorithmic reach, not removal.

Build: nightly headless render of the day's board via Remotion or ffmpeg from the deterministic
`dateSeed` · 30–60s vertical · question-shaped title (*"Can you name the country from its outline? —
1 August 2026"*) · description containing the game name and countrivo.com · uploaded via the YouTube
Data API with OAuth.

Two honest caveats. The "YouTube is the top AI citation source" evidence is soft — the 0.737
correlation comes from an Ahrefs study filtered to Domain Rating >40 brands with 800+ monthly searches
(i.e. it describes established brands and cannot tell a small site what to do), and Ahrefs itself says
*"correlation isn't causation"*. And Google's guide warns against *"seeking inauthentic mentions across
the web."*

What changed the case for doing it properly: Google shipped Search Console **platform properties**
(announced 2026-07-07, globally available 2026-07-29) tracking how your YouTube content performs in
Google Search and Discover — so this is now **measurable** rather than faith-based.

### 3.2 Daily hints/answer pages for your OWN games — gated behind the stats layer
`impact: medium · effort: medium`

`/games/{slug}/today` gains progressive spoiler-gated hints for today plus yesterday's answer, the
country's real stats, and the guess distribution from `game_runs`.

**Do not ship before the Tier-1 stats pipeline exists.** 17 games × 365 days ≈ 6,200 near-identical
pages per year, and the only thing separating that from the scaled-content pattern is genuinely
distinct per-page player data.

Ranked here rather than higher for a strategic reason the enthusiasm usually skips: hints pages serve
people looking for an answer to **skip playing**, which makes them weak new-player acquisition relative
to the quiz and country pages.

### 3.3 A `/learn` flashcard surface with Education Q&A markup
`impact: medium · effort: medium`

Statically generate `/learn/flags`, `/learn/capitals`, `/learn/countries-in-europe` from
`countries.json` with server-rendered flashcards, marked up as `Quiz` with `eduQuestionType: 'Flashcard'`.

Two eligibility gates the usual write-ups omit: the carousel *"is only available when searching for
education-related topics"*, and language support is limited to English, Portuguese, Spanish (Mexico)
and Vietnamese. Whether Google classifies "capital of Burkina Faso" as education-related is unproven —
**that** is the gating risk, not the markup.

All-or-nothing per page: every question must use the Flashcard value, and questions must be visible in
HTML — which is why this needs a purpose-built server-rendered surface separate from the client-side
game boards. Do not reach for practice-problem markup: Google removed that documentation 2026-01-06.

### 3.4 An MCP server over the existing engines and JSON
`impact: medium · effort: medium`

Expose the country data and a quiz tool over the Model Context Protocol. Justify it **only on dual
use** — it serves Claude and any future agent surface as well as ChatGPT's plugin layer — because that
surface has already been renamed and restructured once in seven months (App Directory launched Dec 2025,
replaced by a Plugin Directory on 2026-07-09). Verify submission requirements against OpenAI's own
current docs; third-party write-ups are likely stale post-restructure.

Google is moving the same direction (its guide added an "Explore agentic experiences" section), so
agent-readiness is a two-vendor trend rather than an OpenAI quirk. Speculative bet — do not rebuild
anything around it.

### 3.5 A real, visible one-tap game rating (only if you want the Software App rich result)
`impact: low · effort: small`

The Software App rich result requires `name`, `offers.price` **and** either `aggregateRating` or
`review` — price 0 alone will not validate. The fact-checkers disagreed on whether first-party ratings
are compliant here (see Open Questions).

Safe default: ship the co-typed markup **without** `aggregateRating` and forfeit the rich result. If
you want it, the only honest path is a genuine one-tap "rate this game" control writing to Supabase,
with the average and count rendered **visibly** on the page, then marked up — Google's review-snippet
doc (updated 2026-07-24) requires ratings *"sourced directly from users"* and review content *"readily
available to users from the marked-up page."*

> 🚫 **Never** synthesise a rating from play counts, scores or leaderboard positions. That is not a
> user rating of the item, and it is the pattern that draws a structured-data manual action.

### 3.6 Cheap lottery tickets: `/feed.xml` and Markdown twins
`impact: low · effort: trivial`

~30 lines each. `/feed.xml` (Atom) listing the last 60 days of daily challenges, with
`<link rel="alternate" type="application/rss+xml">` in the layout. Optionally `/countries/{slug}.md`
static twins with `<link rel="alternate" type="text/markdown">` auto-discovery.

Honest evidence — in the only first-party server-log study available (dri.es, 2026-03-05), **not one
AI crawler used `Accept: text/markdown` content negotiation**: *"No AI crawler uses content
negotiation. Not one."* So skip the Accept-header path entirely. Dedicated `.md` URLs discovered via
`rel=alternate` **were** fetched: GPTBot 34.8%, OAI-SearchBot 22.7%, Amazonbot 10.9%, Claude-User 7.4%,
ClaudeBot 2.1%, PerplexityBot 0.2% — and OAI-SearchBot is the citation-producing bot, which is the one
point in favour. The author's own verdict was *"probably not"* worth it, and it slightly increased
crawler load.

**Budget 20 minutes. Expect nothing.**

### 3.7 If you ever localize: ONE language, fully, after the English set has matured
`impact: low · effort: large`

Not eight languages, and not auto-translated prose. If you do it: pick one language, translate the UI,
game instructions **and** the generated data-driven pages together — Google's multi-regional doc warns
specifically against *"Translating only the boilerplate text of your pages while keeping the bulk of
your content in a single language"* — and emit full hreflang reciprocity (every URL lists every
alternate plus `x-default`, plus self-referencing hreflang) via `alternates.languages` in
`generateMetadata`, mirrored in `sitemap.ts`.

The evidence base is thin and self-interested: the widely-cited "327% more AI Overview visibility"
figure is an "up to" maximum from a Weglot-sponsored advertorial (SEJ, 2025-11-14, 236 Spanish/Mexican
sites); the actual headline was +24% more citations per query.

---

## One-time manual clicks (ordered by value)

Everything below is done **once**, outside the codebase.

| # | Minutes | Action |
|---|---|---|
| 1 | 15 | **Verify countrivo.com in Google Search Console** → Settings → "Search generative AI" → confirm set to **Include**. Never enable the AI-features opt-out. |
| 2 | 15 | **Verify in Bing Webmaster Tools** (one-click import from GSC) → Settings → API access → generate API key. |
| 3 | 10 | **Vercel dashboard:** confirm the AI Bots managed ruleset is **Allow (inactive)** and Bot Protection is **Off**. Permanent "do not touch" note. |
| 4 | 25 | **Enable GSC BigQuery bulk data export.** |
| 5 | 45 | **Rewrite the App Store listing** as a brand-entity document. |
| 6 | 25 | **Create the AlternativeTo listing**, then add Countrivo as an alternative on GeoGuessr / Worldle / Seterra / Globle / WorldGuessr / MapGuesser. |
| 7 | 40 | **itch.io project page** + submit to listdle.com, wordly.org/wordle-games, wordleplay.com/wordle-games, wordle.global. |
| 8 | 90 | **Show HN**, then **Product Hunt**. Do not pay for launch-boost services. |
| 9 | 40 | **Create a Wikidata item** — only *after* #5 and at least two other external profiles exist. |
| 10 | 10 | **GA4 custom channel group** for AI assistants. |
| 11 | 10 | **Check Preferred Sources eligibility** — only build the button if countrivo.com actually appears. |
| 12 | 40 | **ISTE Learning Technology Directory** (free) + **OER Commons**. |
| 13 | 240 | ⚠️ **One bounded Reddit burst** — the only item that breaks the set-and-forget rule. |

### Notes on the non-obvious ones

**#1 — GSC generative-AI control.** Google's guide states *"a site must be included in Search generative
AI features in Search Console to be eligible for display in generative AI features on Google Search."*
Include is the default, but a **parent property can silently override it via inheritance**, and control
changes take 1–2 days to propagate. The opt-out toggle (effective ~2026-06-17) removes you from AI
Overviews, AI Mode and AI Overviews in Discover with zero upside for an acquisition site.

**#3 — Vercel.** Both rulesets are inactive by default (Vercel docs, updated 2026-07-09: *"The ruleset
is inactive by default. In the dashboard this is labeled Allow"*), and my live probes confirm all AI
user agents get HTTP 200 with full prerendered HTML and no `cf-ray`. So nothing is broken. The failure
modes are all self-inflicted: **deny** mode blocks every AI bot Vercel adds in future automatically and
forever with no code change; **challenge** mode serves a JS challenge that crawlers executing no JS
cannot solve; and bot detection degrades behind a reverse proxy. **Never put Cloudflare in front of this.**

**#5 — App Store.** `apps.apple.com` is a permanent page on one of the highest-authority domains on the
web, and it is the external structural identifier (Wikidata P3861) the Wikidata item depends on — so it
must come **before** #9. Honest ceiling: the claim that App Store listings routinely surface as AI
citations rests on an unrepeatable anecdote, and Firebase App Indexing is dead, so there is **no**
pathway by which an app listing lifts countrivo.com's web rankings. Also add
`<meta name="apple-itunes-app" content="app-id=XXXX">` to the site — one line, worth it on its own.

**#6 — AlternativeTo.** Your most valuable query class is literally "GeoGuessr alternative" / "Worldle
alternative", which is the page type AlternativeTo owns. `nofollow` is largely irrelevant for AI
retrieval (Semrush/Indig, 1,000 domains: nofollow 0.509 vs dofollow 0.504 Spearman correlation with AI
citations). Calibrate honestly: the "AlternativeTo is a top LLM source" claim rests on vendor blogs and
appears in no large-sample study. Do it because it costs 25 minutes and carries zero risk.

**#7 — directories.** "Best-of" listicles are the most-cited content format in the one verified
large-sample study (arXiv 2606.20065, 100,000+ responses across 100+ brands: listicles ~21% of
citations), and for "best geography games" / "wordle for countries" the engines currently cite
third-party roundups rather than any single game's homepage. **Skip bulk "submit to 300 directories"
packages** — the value is in a handful of specific destinations, not volume.

**#8 — Show HN / Product Hunt.** Do these for the **permanent, well-indexed third-party page containing
your brand name**, not for the traffic spike (evaporates within 24h) and not for the link (nofollow).
Sequence **after** #6 and #7 so the pages have corroborating entity signals. Paid placement is actively
counterproductive: Muck Rack (25M+ links) found earned media 84% of AI citations vs paid **0.3%**.

**#9 — Wikidata.** Converts an unknown string into a resolvable entity — the concrete form of the
problem that niche brands appear in only ~11% of relevant answers versus 73% for global brands. Attach
P31, P856, P571, P3861 (App Store), P2037 (GitHub), P6819 (Product Hunt), P2002 (X). Then add the Q-id
URL to the homepage `Organization.sameAs`. Two corrections to the usual advice: Wikidata has a **low**
bar, not **no** bar — items with only self-published sources do get deleted — and the "30–60 days to LLM
entity recognition" timeline is a single-vendor anecdote with no measurement.
**Do NOT attempt a Wikipedia article**: it will not survive notability review, and adding countrivo.com
to Wikipedia articles yourself is an explicit COI violation that gets reverted and can flag the domain.

**#13 — Reddit, labelled honestly.** Warm an account with 2–4 weeks of genuine participation, then make
~six posts to subs that explicitly permit sharing free web games (r/WebGames, r/InternetIsBeautiful,
r/playmygame, r/geography, r/dailygames), leading with the game rather than a pitch. **Then stop.**

Ranked last because of the recurring-work violation *and* live risk. `reddit.com/robots.txt` is now a
blanket `User-agent: * / Disallow: /` with no named exceptions, so Reddit reaches AI systems **only
through paid licensing pipes** — meaning a Reddit post is structurally invisible to Perplexity, Claude
and Copilot and reaches only Google and OpenAI. That pipe is actively at risk: Reddit's stock fell 9% on
2026-07-22 on reports it may not renew the Google deal, and its 2026-07-30 Q2 earnings announced no AI
deals. Also correct the tactic: Semrush's 248,000-cited-URL study found **engagement does not predict
citation** (80% of cited posts have under 20 upvotes) — format and topical relevance do, with Q&A threads
over half of all Reddit citations and cited posts averaging ~80 words. Write evergreen, question-shaped
posts. **Never automate posting into other people's subreddits** — 34% of subs ban self-promotion
outright and automation is the fastest route to an account and domain ban.

---

## Do NOT do

- **Do NOT build `llms.txt` / `llms-full.txt` as a strategy.** Google's guide (updated 2026-06-15):
  you don't need *"machine readable files, AI text files, markup, or Markdown to appear in Google Search
  (including its generative AI capabilities), as Google Search itself doesn't use them."* Ahrefs analysed
  137,000 domains: **97% of llms.txt files received zero requests** in May 2026. Dries Buytaert's logs
  recorded 52 requests in a month — every one from an SEO audit tool. Mueller compared it to the keywords
  meta tag. Ship it as a 10-minute generated freebie or not at all.

- **Do NOT generate combinatorial question-variant pages**, and **do NOT build the 243×242 country-vs-country
  cross product.** Google's guide names the fan-out tactic verbatim as a scaled-content-abuse violation.
  The comparison cross product is separately overdetermined: 58,806 pages would take the site from ~1,200
  to ~60,000, crossing Google's own documented 10,000+ crawl-budget tier; *"aggregators, directories, and
  comparison-driven sites"* were a confirmed loser category in the March 2026 core update; and
  georank.org, countryeconomy.com, worlddata.info, indexmundi already saturate it.
  **Build ONE `/compare` page with a client-side two-country picker instead.**

- **Do NOT auto-translate the corpus into eight languages.** This worked spectacularly for Reddit from
  mid-2024 and stopped working: its tens of millions of AI-translated URLs dropped heavily around the May
  2026 core update and June 2026 spam update.

- **Do NOT build `FAQPage`, `HowTo`, practice problem, `Course` info, `Speakable`, sitelinks `SearchAction`,
  or `ProfilePage` on player profiles.** FAQ rich results stopped appearing 2026-05-07 and Google removed
  the documentation entirely on 2026-06-15; Search Console API support ends August 2026. Practice-problem
  documentation was removed 2026-01-06 — that is the one a quiz site instinctively reaches for. HowTo has
  been dead since September 2023. The sitelinks search box was retired in late 2024. Existing markup is
  harmless; new investment is wasted.

- **Do NOT synthesise an `aggregateRating`** from leaderboard positions, play counts or scores.

- **Do NOT block GPTBot, ClaudeBot, CCBot or Google-Extended "to protect content."** This is the default
  2024–2026 publisher recommendation and it is **wrong for a free game with nothing to monetize**: it
  removes you from the parametric-memory channel that makes a model say "Countrivo" unprompted, while
  protecting nothing you sell. Corollaries most guides get wrong: blocking GPTBot does **not** remove you
  from ChatGPT Search (that's OAI-SearchBot), and blocking Google-Extended does **not** remove you from AI
  Overviews or AI Mode (served through Googlebot) but **does** cost you Gemini grounding.

- **Do NOT use the Google Indexing API** for game, country or list pages, and **do NOT ping
  `google.com/ping?sitemap=`.** The Indexing API doc (updated 2026-07-16) states verbatim: *"The Indexing
  API can only be used to crawl pages with either JobPosting or BroadcastEvent embedded in a VideoObject."*
  Every "instant indexing" plugin selling otherwise is a placebo or an abuse pattern. The sitemap ping
  endpoint was deprecated June 2023 and returns 404.

- **Do NOT expect IndexNow to reach Google**, and do not spam it with the full unchanged URL list on every
  deploy.

- **Do NOT create Vercel Cron jobs for any of this.** Vercel Cron triggers an HTTP GET against a path,
  which requires an `app/api/.../route.ts` — banned by this project's `AGENTS.md`. Use **GitHub Actions
  cron** (free, and it can hit a Vercel Deploy Hook to trigger a rebuild), or page-level
  `export const revalidate` for Supabase-derived data, which needs no endpoint at all.

- **Do NOT buy a GEO rank tracker** (Profound, Semrush AI Toolkit, Ahrefs Brand Radar, Peec, Otterly at
  $29–829/month) **or scrape the consumer ChatGPT/Perplexity UIs.** Google injects a persistent per-user
  embedding into AI Mode query interpretation and reranking, so logged-out position tracking is not
  measuring anything stable, and only ~30% of brands stay visible run-to-run. Google says it directly:
  *"Be wary of third-party tools that promise ranking success or claim to use internal Google metrics. No
  third-party tool has access to our internal ranking or AI systems."* The Gemini grounding probe
  replicates the useful part for $0.

- **Do NOT build your measurement system on Search Console's Generative AI performance reports.** Launched
  2026-06-03, rolled out to *"a subset of website owners in the UK"* under CMA requirements,
  **impressions-only** — no clicks, no CTR, no position, no query data — and **not in the Search Console
  API**, with no BigQuery export. CSV download only, which is by definition recurring manual work.

- **Do NOT compete for `{competitor} answer today`.** That SERP is owned by Tom's Guide, Dexerto, NME,
  Destructoid and Sportskeeda, and winning it would send users to a competitor's product. The adjacent
  `{game} unlimited / free / alternative` SERP, currently held by thin ad-heavy clone sites, is the
  winnable one.

- **Do NOT port a game to Poki or CrazyGames.** A Next.js + React 19 + Supabase multi-game app with auth,
  leaderboards and 243 country pages does not package into a self-contained bundle (CrazyGames: 250MB total
  cap, initial download ≤50MB, ≤20MB for mobile homepage eligibility, full SDK integration required). Even
  a stripped single-game extract would run on their domain with their ads and no path back to your accounts
  or streaks — **donating your best game to a competitor's SEO.**

- **Do NOT treat auto-posting to X, Bluesky, Mastodon or Threads as a distribution channel**, and **do NOT
  enforce word-count minimums or pad generated pages.** None of those platforms appears in any 2025–2026
  top-cited-domain list; Bluesky publishes only a users sitemap (post sitemaps 404); X blocks crawlers and
  suppresses link posts. Wire a Discord webhook for retention if it is free, and count nothing. On word
  count: Mueller has repeatedly said there is no minimum length, and padding is exactly the *"little
  value… contains search keywords"* pattern the spam policy names. **Gate on data completeness** (unique
  title/H1/meta, non-empty primary data block, N distinct rendered data points) instead.

- **Do NOT bump "last updated" dates without a substantive data change**, and do not chase press releases or
  paid listicle placements. Google's helpful-content doc warns verbatim against *"changing the date of pages
  to make them seem fresh when the content has not substantially changed."* The player-stats layer makes
  freshness real for free.

- **Do NOT refactor the country and list pages to "move facts into server HTML."** They are already there
  (verified above). Write the regression test instead — and keep the forward-looking guardrails: no
  `useEffect`-gated content, no `next/dynamic` with `ssr: false`, render all tab panels and hide with CSS,
  and **never count the `self.__next_f` RSC payload as content** since no AI crawler parses it.

---

## Timeline

**Weeks 0–2 — Tier 1 plumbing lands.** IndexNow starts fanning out to Bing/Yandex/Naver/Seznam/Yep/Amazon
within hours of each deploy; Bing typically processes in hours to a day. Truthful sitemap `lastmod` begins
accumulating credibility with Google — that takes weeks to be trusted, not days, precisely *because* it has
been wrong until now. **Nothing visible in traffic yet.**

**Weeks 2–8 — share loop live across all 17 games.** The only channel that produces players immediately. It
shows up in **Direct and Referral, not Search Console**. Branded terms move fastest of anything here:
"countrivo" and each of the 17 game names face essentially zero competition, so a well-structured landing
page with the name as H1 and in `<title>` ranks #1 within weeks of indexation. Expect the first genuinely
new players from **shares, not search**.

**Months 2–4 — Tier 2 surfaces indexed.** First long-tail impressions on quiz and country pages appear in
GSC at positions ~20–50, with impressions rising before clicks. **This is the flat stretch. Do not
panic-rewrite templates during it.** The base rate is brutal and well documented — Ahrefs publishes both
1.74% and 5.7% for "new pages reaching Google's top 10 within a year" on the same page, and the 5.7% figure
dates to roughly 2017. Either way, most new pages never get there, and those that do skew to high-authority
domains.

**Months 4–8.** Meaningful non-branded organic traffic if the quiz layer and internal-link graph are
working. The Sporcle/JetPunk shape — where the `{X} quiz` pages, not the brand, carry the traffic — is a
multi-quarter build, not a launch.

**Months 6–12.** AI citations follow, because in this vertical they follow classic ranking rather than
leading it. The educational geography layer is the winnable AI surface, and **ordinary SEO on the 243
country pages IS the AI-citation strategy** — Google says generative AI features are *"rooted in our core
Search ranking and quality systems"* and that *"SEO best practices continue to be relevant."* Expect the
payoff to be indirect and mostly invisible in analytics: being the answer to *"what's a good game for
learning flags"* produces branded search and direct visits that will never appear as AI referral traffic.

**12+ months.** Competitive head terms ("geography quiz", "geography games"), and Wikidata-driven entity
recognition if it lands at all.

Two framing notes:

1. **The compounding asset is branded search volume, and it is manufactured by the share string, not by
   content.** Worldle's 1.0M monthly organic visits are 994,800 from one token. Every month the share loop
   runs across 17 games instead of 2 is a month of compounding you do not get back.
2. **Expect month-to-month volatility in every third-party traffic estimate.** The same Ahrefs snapshot that
   produced the Worldle figure also showed teuteuf.fr down 446K, geoguessr.com down 1.3M, sporcle.com down
   148K and worldometers.info down 864K month-over-month, and returned internally inconsistent numbers for
   globle.org across two of its own pages.

---

## Open questions (where the evidence genuinely conflicted)

**Is a first-party `aggregateRating` on a game page compliant or a manual-action risk?** One fact-checker
showed Google's review-snippet doc (updated 2026-07-24) lists "Software App" as supported and scopes the
self-serving prohibition verbatim to *"pages that use LocalBusiness or any other type of Organization
structured data"* — `SoftwareApplication` is not an `Organization` subtype, so a genuine visible on-site
rating is the documented compliant path. Another concluded the opposite.
*Resolution:* ship without `aggregateRating`; if you want the rich result, build a real one-tap rating with
average and count rendered visibly, which satisfies both readings.

**How much traffic do AI answer engines actually send?** The vendor spread is roughly **fiftyfold** — 0.2–0.3%
of referrals at one end, 12–18% at the other — and both ends are vendor-sourced and unverifiable. **Ship no
number.** What is confirmable: Google reports AI Overviews at >2.5B monthly active users and AI Mode at >1B
(blog.google, 2026-06-03), so the surface is enormous while Google Search itself remains the dominant
referral source. The conclusion is robust regardless: **do not trade classic SEO for GEO — the required
build is identical.**

**How much do AI Overviews suppress clicks, and does being cited reverse it?** Seer's own 2026 update
documents CTR **recovering** (1.3% floor in Dec 2025 → 2.4% in Feb 2026, an 85% jump) and reports **+120%
more organic clicks per impression when you are cited inside an AI Overview** — which inverts the standard
"avoid AIO-heavy queries" advice into *"avoid what you can, get cited in what you can't."*

**Do comparison queries trigger AI Overviews at 95.4% or 26.2%?** Seer measured 95.4% from 53 client brands'
GSC data (biased convenience sample); Ahrefs measured 26.2% across 146M SERPs (SERP-representative), overall
AIO rate 20.5%. Irreconcilable. The "don't build the comparison cross product" recommendation deliberately
does not depend on either number.

**Does Bing indexation actually feed ChatGPT retrieval?** OpenAI's current crawler docs describe OAI-SearchBot
as its own first-party search crawler with published IP ranges and **never mention Bing**; independent
research has separately reported ChatGPT pulling from Google's index. The Copilot half of the argument is
solid (Copilot runs on Bing). IndexNow is justified on Bing/Copilot alone, so nothing here depends on
resolving this.

**Will Google classify "capital of Burkina Faso" as an education-related topic** for the Education Q&A
carousel? Unproven either way. This is the gating risk for `/learn`, not the markup.

**Is countrivo.com even eligible for Preferred Sources?** The feature is framed around publications and Top
Stories, and only domain/subdomain properties qualify. Check the tool before building the button. Also note
the badge only shows to users who **already** selected you — this is retention, not acquisition.

**Does the Worldle brand-token model transfer, or the GeoGuessr one?** Worldle is ~97% branded on 1.0M
visits; GeoGuessr, with a far stronger brand, is only ~10% branded on 5.9M visits — the rest non-branded.
**These are two viable shapes, not one law.** The plan hedges by building both (share loop for the branded
token, quiz layer for the non-branded surface) rather than betting on either.

**How durable is "AI crawlers do not execute JavaScript"?** The highest-confidence item in the entire
dossier today, corroborated across six independent 2026 sources. But OAI-SearchBot now ships a Chrome-based
user-agent string (`…Chrome/131.0.0.0 Safari/537.36; compatible; OAI-SearchBot/1.4`), suggestive of
headless-Chrome infrastructure. **Re-verify with curl periodically rather than assuming permanence** — which
is exactly what the daily CI check in 2.1 does.

**Does Reddit remain a top AI citation surface?** Adweek reported 2026-01-26 that YouTube overtook Reddit as
the go-to citation source; 5W claims Wikipedia + Reddit exceed 25% of US ChatGPT citations while Evertune
claims those platforms combined rarely top 5%. Reddit's ~$60M/yr Google licensing deal was unresolved as of
2026-07-31. And every one of these studies over-samples commercial and B2B queries — **there is no evidence
the source mix for "best daily geography game" resembles the source mix for "best CRM."**
