<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Architecture Rules

- Game logic MUST be pure functions in `src/lib/game-logic/{slug}/`. No React imports. No side effects.
- Game UI MUST be a single board component in `src/components/games/{slug}/`. Always "use client".
- Game engines take an RNG function as parameter — never call Math.random() directly.
- All server mutations go through server actions in `src/app/actions/`. No API routes (no route.ts).
- New games MUST be registered in `src/data/game-registry.json`.
- Data loading goes through `src/lib/data/loader.ts` — never import JSON directly in components.

## Code Quality

- TypeScript strict mode. No `any`. No unsafe `as` casts.
- Prefer `interface` for object shapes, `type` for unions/aliases.
- Tailwind v4 — use theme variables (var(--color-gold)), not arbitrary values.
- No new dependencies without explicit approval. The bundle is intentionally minimal.
- No third-party UI libraries (no shadcn, no MUI, no Chakra). Custom components only.

## Anti-Patterns — NEVER Do These

- Do NOT create API route handlers (route.ts). Use server actions.
- Do NOT use Math.random() in game logic. Use seeded RNG from mulberry32.
- Do NOT edit JSON data files by hand. Run the scripts.
- Do NOT add "use client" to page.tsx files. They are server components.
- Do NOT import from `@/lib/supabase/server` in client components.
- Do NOT store game state in global variables. Use useReducer in board components.

## Commit Style

Narrative, feature-focused messages. Examples from history:
- "Release 1: Truth Layer — auth, persistence, daily lock, real leaderboards"
- "Ingame juice + result screen overhaul for competitive game feel"
- "Full codebase audit: security hardening, UX polish, accessibility, performance"
