# Countrivo

Geography games. Six daily games plus one practice-only speed variant, 243 countries,
one shot a day on a shared board. Rebuilt from scratch in August 2026 against
`docs/REBUILD-BLUEPRINT.md`, which is the binding contract for everything below.

@AGENTS.md

Read before changing anything visual: `docs/REBUILD-BLUEPRINT.md` (the build contract,
measured from the K3 reference at `design/k/k3-ein-board.html`) and the anti-slop design
law in `~/.claude/CLAUDE.md`. Where they disagree with this file, they win.

## Stack

Next.js 16.2.1 (App Router), React 19.2, TypeScript strict, Tailwind CSS v4, Supabase
(auth plus Postgres), Capacitor for the iOS wrapper, Vercel for the web deploy.

## The roster (seven registry entries, six of them daily)

| Slug | Title | Mode | What it is |
|---|---|---|---|
| `country-draft` | Country Draft | daily | The flagship cabinet draft. Five rounds, five seats (The Chair, The Field, The Purse, The Voice, The Desk). Each round is one country offering three of its people; take one, seat them, score 0 to 195. |
| `blind-pick` | Blind Pick | daily | The stat game. Eight countries arrive one at a time, each goes on the stat where it ranks highest. You never see the next country. Scored against the optimal assignment. |
| `higher-or-lower` | Higher or Lower | daily | Two countries, one stat, call the bigger one. The streak is the score. |
| `geo-wordle` | GeoWordle | daily | Six guesses at a hidden country, each answered with a distance and a bearing. |
| `stat-guesser` | Stat Guesser | daily | Five rounds, one number each, scored on percentage error. |
| `flag-quiz` | Flag Quiz | daily | Ten flags, four options each. |
| `speed-flags` | Speed Flags | practice only | Two options, twenty seconds, as many flags as you can call. No daily board. |

Naming is load-bearing and was decided by the owner in August 2026. The search term
"country draft" belongs to the cabinet game, so `/games/country-draft` (the URL that
already ranks) serves the cabinet draft. The stat-assignment game that used to carry
that name is now Blind Pick at `/games/blind-pick`. Never call Blind Pick "Country
Draft" in code, copy, metadata or a commit message.

Eleven games were cut in the same decision: capital-match, population-sort,
country-streak, border-buddies, continent-sprint, odd-one-out, cluster, risk-zone,
supremacy, borderline, blitz. Their code and routes are gone; every old URL 301s from
`RETIRED_GAMES` in `next.config.ts`. `/games/world-draft` 301s to `/games/country-draft`
(one game, one page). Do not reintroduce a slug from that list.

## Non-negotiables

1. One theme. The page is identical in a light and a dark browser. No
   `prefers-color-scheme`, no `dark:` variants, no `data-theme`, no theme toggle.
   `viewport.themeColor` is the single string `#fbfaf6`.
2. No loading states. No `loading.tsx`, no skeletons, no spinners, no `opacity-0`
   starts, no mounted gates, no `ssr: false` for anything visible on arrival. Every
   route's first HTML is its final layout, boards included.
3. No emoji anywhere in rendered UI or in data the UI reads. The only emoji in the tree
   are the coloured squares inside `src/lib/share/*`, which go to the clipboard and are
   never painted. No glyph characters (arrows, ticks, crosses, stars, bullets) in
   rendered strings; use the house icons.
4. Two modes only: Daily (one shot per game per day, same board for everyone, 24 h
   global board) and Practice (random boards, nothing counts). No duels, challenges,
   levels, quests, XP, live counters or "playing now".
5. Friends and "you" are crests (the chosen country outline). Real flags only on the
   global board and where a flag is game content or country identity.
6. Every control that looks interactive works, with a 44 px touch target.
7. Copy has no em dashes, no exclamation marks in system copy, and never the word
   "challenge" for the daily.

`npm run check:theme` fails the build on most of these. Run it before you commit.

## Project structure

```
src/
  app/
    layout.tsx  globals.css  error.tsx  not-found.tsx  global-error.tsx
    fonts.ts                    Erode 600 via next/font/local (--font-erode)
    icon.tsx  apple-icon.tsx  opengraph-image.tsx  manifest.ts  robots.ts  sitemap.ts
    actions/                    server actions (game-runs, home, friends, profile, admin, push-tokens)
    auth/callback/route.ts      the one route handler in the tree (OAuth)
    (app)/                      viewer-aware routes: /, leaderboard, run, friends, profile
    (play)/games/[slug]/play/   the one play route, all seven boards
    (auth)/                     forgot-password, reset-password
    (seo)/                      games, countries, categories, lists, legal, the three sitemaps
  ui/                           every primitive: header, board, anchor-card, slot, options,
                                verdict, result-panel, flag, crest, mark, flame, icons/, icons/stat/
  features/                     composites by surface: home, play, social, seo, auth, admin
  games/{slug}/                 module.ts, codec.ts, board.tsx, result.tsx, run-detail.tsx, host.tsx
  games/registry.ts             HOSTS, CODECS, RUN_DETAILS keyed by slug (append-only)
  games/_shared/                board pieces more than one game uses
  lib/game-logic/{slug}/        pure engines: engine.ts (+ generator, scoring, types, server-validate)
  lib/                          share/ (clipboard builders), seo/, data/ (loaders), supabase/,
                                native/, daily-seed.ts, daily-edition.ts, seeded-random.ts
  server/                       per-request server helpers: viewer, clock, edition, boards, runs,
                                progress, home-lists, shot
  styles/                       tokens.css, base.css, type.css, flame.css, ui.css
  content/                      editorial copy: games, entity, lists, hubs, chips, draft
  data/                         static JSON (never hand-edited)
  proxy.ts                      the Next proxy (was middleware.ts)
scripts/                        data pipeline and the check scripts
docs/REBUILD-BLUEPRINT.md       the build contract
```

There is no `src/components`, no `src/hooks` beyond `use-juice`, no `loading.tsx`
anywhere, and no per-slug route folder. Anything that reaches for one of those is
working from the pre-rebuild tree.

## Commands

```
npm run dev            start the dev server
npm run build          production build (type-checks)
npm start              serve the build
npm run lint           ESLint
npm run check:theme    single-theme and no-loading-state guard
npx tsc --noEmit       type check only
node scripts/check-render.mjs        Playwright acceptance run (needs a server on :3290)
npx tsx scripts/check-contracts.ts   every game module against its submission contract
npx tsx scripts/check-crawler-access.ts   crawler text floors
npx tsx scripts/check-country-draft.ts    the cabinet draft's board generator
```

## Coding conventions

- Server components by default. `"use client"` only for state, effects or browser APIs.
- Server mutations are server actions in `src/app/actions/`. No API routes.
- Import alias `@/*` maps to `src/*`. File names are kebab-case.
- Tailwind v4: tokens live in `src/styles/tokens.css` inside `@theme`. No
  `tailwind.config`. No arbitrary hex outside that file (the only exceptions are
  `src/lib/seo/og-image.tsx`, `src/app/global-error.tsx` and
  `capacitor/www/offline.html`, which render without the stylesheet).
- No third-party UI libraries. The primitives in `src/ui` are the component library.
- Nothing new imports from a deleted path. If an import fails, the file is stale.

## Game architecture

Four layers, one per game:

1. Engine: `src/lib/game-logic/{slug}/engine.ts`. Pure, no React, takes an RNG function
   as a parameter. Never calls `Math.random()` or `Date.now()`.
2. Module: `src/games/{slug}/module.ts` implements `GameModule` from
   `src/games/types.ts`: `create(seed)`, `reduce(state, action)`, `done`, `progress`,
   `verdict`, `payload`, `scoreLabel`, `keys` and the optional `feedback` / `after`
   windows. `codec.ts` encodes the action log to the `cv_p_{slug}` cookie so a reload
   replays the run on the server.
3. Surfaces: `board.tsx` (the live board), `result.tsx` (the result rows),
   `run-detail.tsx` (the public run page), `host.tsx` (the client host).
4. Registration: one line per map in `src/games/registry.ts`, one entry in
   `src/data/game-registry.json`, copy in `src/content/games.ts` and
   `src/lib/seo/game-copy.ts`.

A daily board is built on the server from `dateSeed(dateKey + edition)`, so the board in
the first HTML is the board the player finishes. A practice board uses a per-request
server seed. `validateGameResult` in `src/app/actions/game-runs.ts` gates every
submission, and country-draft, blind-pick and stat-guesser additionally replay the daily
board server side before a run is stored.

## Daily seed system

- Europe/Berlin everywhere. `getTodayDateKey()` returns `YYYY-MM-DD`.
- `dateSeed(dateKey + edition)` hashes to a `mulberry32` PRNG. The edition lets an admin
  reroll a broken board without changing the date.
- Same date plus same edition equals the same board worldwide. Boards reset at midnight
  Berlin. Deploy roster or data changes right after 00:00 Berlin so nobody's board
  changes under them mid-day.

## Data conventions

- Never hand-edit JSON in `src/data/`. Run the scripts: `fetch-country-data.ts`,
  `compute-ranks.ts`, `fetch-centroids.ts`, `build-flags.ts`, `build-marks.mjs`,
  `build-silhouettes.mjs`, `build-draft-pool.mjs`, `build-draft-map.mjs`,
  `build-data-timestamps.ts`.
- Flow: external source, then a script, then JSON, then `src/lib/data/loader.ts`, then
  engines and pages. Components do not import JSON directly.
- `src/data/figures.json` is the Country Draft roster (950 public figures, twelve
  fields). `build-draft-pool.mjs` derives `draft-pool.json` from it and refuses to write
  a changed pool under an unchanged `POOL_VERSION`.

## Supabase

- Server components and actions: `import { createClient } from "@/lib/supabase/server"`.
- Client components: `import { createClient } from "@/lib/supabase/client"`.
- Never import the server client in a `"use client"` file.
- Tables in use: `game_runs`, `profiles`, `user_game_stats`, `friendships`,
  `friend_challenges`, `device_tokens`, `app_config`. Migrations live in
  `supabase/migrations/`; the August 2026 rename that moved the stat game's rows from
  `country-draft` to `blind-pick` is `20260829120000_rename_country_draft_to_blind_pick.sql`.

## Design system

- Type: Erode 600 only, self-hosted from `src/fonts` via `next/font/local`, exposed as
  `--font-erode`. Body is the system stack. No Google fonts, no Inter, no mono.
  Erode is allowed only on the `.t-wm .t-card .t-h1 .t-h2 .t-h3 .t-score-xl .t-score-l
  .t-score .t-num .t-big` classes in `src/styles/type.css`.
- Palette: paper `#fbfaf6`, card `#f1f0ea`, line `#e9e8e1`, wait `#cfcec6`, faint
  `#b9b8b1`, mute `#74756f`, ink `#17181a`, and one accent, ember `#b8432a`. Ember is
  the flame, live facts, NEW, wrong verdicts and the me-crest ring. Nothing else is
  coloured. All of it lives in `src/styles/tokens.css`.
- Radii: card 12, note 10, knob 9, control 6, chip 4, flag 3. Crests are circles.
  Nothing is rounder than 12 except a crest.
- No `box-shadow` except the flag's inset ring and the focus ring. No
  `backdrop-filter`. No gradient except the 40 px fade above the tab bar. No hover
  lift. No pill chips for metadata. Hairlines only between rows.
- Icons are the house set in `src/ui/icons` (2 px stroke, one seed dot each), stat icons
  in `src/ui/icons/stat`, game marks in `src/ui/mark.tsx`. No icon packs.
- The signature on every route: the burning flame in the header, Erode numerals, the ink
  anchor card with the overlapping Shoot button, one board with Global and Friends tabs,
  crests as identity.

## Deploy

Vercel is git-linked to GitHub `aydamdonelly/countrivo`; a push to `main` deploys
production. Build and play locally first (`npm run build`, then `npx next start -p 3100`),
run the acceptance scripts, and deploy just after 00:00 Europe/Berlin. Do not use the
file-upload deploy path repeatedly (5000 files per day).
