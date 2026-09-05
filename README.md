# Countrivo

Free geography games: six daily puzzles and Speed Flags for unlimited practice.
Play GeoWordle, Country Draft, Blind Pick, Higher or Lower, Stat Guesser and Flag Quiz.
Country profiles cover 243 countries and territories.

Live at [countrivo.com](https://countrivo.com).

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
npm run dev       # Dev server
npm run build     # Production build (type-checks included)
npm run lint      # ESLint
npx tsc --noEmit  # Type check only
npm run check:theme  # UI conventions
npm run check:contracts  # Game submission contracts
npx tsx scripts/check-geo-wordle.ts  # Country input and puzzle regressions
```

## Stack

Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS 4, Supabase (auth + DB + realtime), Vercel.

## Project layout

See [CLAUDE.md](./CLAUDE.md) for the full architecture overview — directory map, game pattern, daily-seed system, Supabase conventions, and design tokens.

## Deploy

Vercel auto-deploys on push to `main`. Build and verify locally before pushing.

For Search Console reporting, SEO priorities and publishing checks, see
[Search acquisition](docs/seo-growth.md).
