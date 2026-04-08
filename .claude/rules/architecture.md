# Architecture Rules

## Game Pattern (mandatory for all games)
- Logic: `src/lib/game-logic/{slug}/engine.ts` — pure functions, seeded RNG parameter, no React
- UI: `src/components/games/{slug}/{slug}-board.tsx` — "use client", useReducer, calls engine
- Route: `src/app/games/{slug}/page.tsx` (landing) + `play/page.tsx` (play) — both server components
- Registry: every game has an entry in `src/data/game-registry.json`

## Server Components by Default
- Only add "use client" to components that need state, effects, or browser APIs
- page.tsx files are ALWAYS server components
- Server actions in `src/app/actions/` with "use server" directive
- No API route handlers (route.ts) — use server actions

## Data Flow
- Static data: `src/data/*.json` -> `src/lib/data/loader.ts` -> game engines
- Never import JSON directly in components — use the loader
- Never edit JSON by hand — use `scripts/`
