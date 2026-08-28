# Countrivo

Geography gaming platform. 14 games, 243 countries, daily challenges + practice mode.

@AGENTS.md

## Stack

Next.js 16.2.1 (App Router), React 19, TypeScript (strict), Tailwind CSS 4, Supabase (auth + DB + realtime), Vercel deployment.

## Project Structure

```
src/
  app/              — App Router pages, layouts, server actions
    actions/        — Server actions (game-runs.ts, friends.ts, challenges.ts)
    games/[slug]/   — Dynamic game route (landing page.tsx + play/page.tsx)
    countries/      — Country detail pages
    lists/          — Category ranking pages
    auth/callback/  — OAuth callback
  components/
    games/          — Game UI: {slug}/{slug}-board.tsx ("use client")
    game/           — Shared game components (game-landing, game-over-screen, game-session-top-bar)
    layout/         — Header, hero-globe, topo-bg
    auth/           — Auth provider + modal
    friends/        — Friend/challenge UI
    seo/            — SEO components
  lib/
    game-logic/     — Pure game engines: {slug}/engine.ts (+ generator.ts, types.ts, scoring.ts)
    supabase/       — server.ts (server client), client.ts (browser client), middleware.ts, rooms.ts
    data/           — Typed data loaders (loader.ts, countries.ts, games.ts, ranks.ts)
    daily-seed.ts   — Europe/Berlin timezone, deterministic mulberry32 PRNG
    game-colors.ts  — Per-game color palettes
  data/             — Static JSON: countries.json, categories.json, stats.json, ranks.json, borders.json, game-registry.json
  types/            — TypeScript types: country.ts, game.ts, category.ts, rank.ts, server.ts
  hooks/            — React hooks: use-game-keys, use-countdown, use-multiplayer, use-daily-challenge
scripts/            — Data pipeline scripts (run with npx tsx scripts/...)
docs/               — game-ideas.md (backlog), superpowers/ (specs + plans)
```

## Commands

```
npm run dev       — Start dev server
npm run build     — Production build (type-checks included)
npm run lint      — ESLint
npx tsc --noEmit  — Type check only
```

## Coding Conventions

- Server components by default. Only add "use client" when needed (state, effects, browser APIs).
- Server actions in src/app/actions/ with "use server" directive. No API routes.
- Import alias: @/* maps to src/*.
- File naming: kebab-case everywhere.
- Tailwind v4: design tokens in globals.css @theme block, not tailwind.config.

## Game Architecture

Each game has 3 layers:

1. **Logic** — `src/lib/game-logic/{slug}/engine.ts` (pure functions, no React)
   - Takes seeded RNG as parameter for deterministic daily games
   - Optional: generator.ts, types.ts, scoring.ts
2. **UI** — `src/components/games/{slug}/{slug}-board.tsx` ("use client")
   - useReducer for state, calls engine functions in reducer
   - Submits result via submitGameRun server action
3. **Route** — `src/app/games/{slug}/page.tsx` (landing) + `play/page.tsx` (play)
   - Both are server components
4. **Registry** — Entry in `src/data/game-registry.json`

## Daily Seed System

- All daily games use Europe/Berlin timezone (getTodayDateKey -> YYYY-MM-DD)
- dateSeed(dateKey) -> deterministic hash -> mulberry32 PRNG
- Same date = same puzzle worldwide, resets at midnight Berlin time

## Data Conventions

- NEVER edit JSON files in src/data/ by hand
- Use scripts: `npx tsx scripts/fetch-country-data.ts`, `npx tsx scripts/compute-ranks.ts`
- Data flow: external API -> scripts -> JSON -> loader.ts -> game engines

## Supabase

- Server components/actions: `import { createClient } from "@/lib/supabase/server"`
- Client components: `import { createClient } from "@/lib/supabase/client"`
- NEVER import server client in "use client" files
- Tables: game_runs, profiles, game_rooms, friendships, challenges

## Design System

- Colors: gold (#b8860b), cream text, semantic green (#16a34a) / red (#dc2626)
- Each game has a unique color pair (src/lib/game-colors.ts)
- Easing: --ease-game (bouncy cubic-bezier), --ease-out (standard)
- All tokens in globals.css @theme block
- No third-party UI libraries. Custom components only.

## Deployment

- Vercel auto-deploy on push to main
- Domain: countrivo.com
- No feature branches — commit directly to main

## Design system (since 2026-08-28)

- Display face: Erode, self-hosted in `src/fonts` via `next/font/local` (`--font-display`). Body: system stack. No Google fonts for the identity.
- One palette in `globals.css` `@theme`: off-white `--color-bg`, ink `--color-cream` (name kept for the ~250 callsites), burnt-red accent `--color-gold` (name kept), warm dark twins under `prefers-color-scheme: dark`. Per-game washes are neutral on purpose.
- No emoji in the UI. Country flags: `<CountryFlag iso2 />` (SVG from `public/flags`). Statistic categories: `<StatIcon slug />`. Games: `<GameMark slug />` (uses `src/data/mark-silhouettes.json`, client-safe). Country outlines for crests: `getSilhouettePath(iso3)` from `src/data/silhouettes.json` (server only; rebuild with `node scripts/build-silhouettes.mjs`).
- Buttons: `.btn-primary` / `.cta-primary` are ink-filled, no shadow, no hover lift. Secondary is a quiet surface. Never pair a filled and an outlined button.
- Home: `src/app/page.tsx` + `src/components/home/*`. Data from `getHomeData()` (`src/app/actions/home.ts`): public boards cached 30 s with the anon key, viewer data per request, every query with a timeout.

## Product rules

- Daily = one shot per game per day, same board for everyone, on the 24 h global board. Practice = random boards, never counts. No duels, blitz timers, levels, quests or live counters on the home.
- Friends are identified by a crest (their chosen country outline via `profiles.country_code`); real flags only on the global board.
- Country Draft (8 countries into 8 stats) and World Draft (draft 5 people, conquer 195) are different games.

## Deploy

Vercel is git-linked to GitHub `aydamdonelly/countrivo`: every push to `main` deploys production. Build and playtest locally first (`npm run build`, then `npx next start -p 3100`). Do not use the file-upload deploy path repeatedly (5000 files/day limit).
