# Countrivo

Geography gaming platform. 17 games, 243 countries, daily challenges and practice mode.

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
```

## Stack

Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS 4, Supabase (auth + DB + realtime), Vercel.

## Project layout

See [CLAUDE.md](./CLAUDE.md) for the full architecture overview — directory map, game pattern, daily-seed system, Supabase conventions, and design tokens.

## Deploy

Vercel auto-deploys on push to `main`. Manual deploys:

```bash
vercel --prod --yes
```
