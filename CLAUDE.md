# Countrivo

Seven daily geography games and one practice game. The October 2026 Table redesign
replaces the August K3 interface and the account-based play flow.

@AGENTS.md

Current build contract: `docs/REDESIGN-IMPLEMENTATION.md`. Visual reference:
https://www.figma.com/design/ZKNzvFolKFKjU2EVzWpCBY, pages 00 through 08.
`docs/REBUILD-BLUEPRINT.md` remains historical documentation; its account, Friends,
Shoot, black-card, old scoring and deployment restrictions are superseded.

## Stack

Next.js 16.2.1, React 19.2, strict TypeScript, Tailwind v4, Supabase Postgres,
Capacitor iOS wrapper, Vercel. Read the installed Next guides before coding.
No new dependencies without approval.

## Games

| Slug | Daily | Rules |
|---|---|---|
| country-draft | yes | Five rounds: choose one of three countries, then a person and a free cabinet job. Points revealed only after seating. Maximum 195. |
| geo-wordle | yes | Six country guesses with distance/bearing, an optional costed outline clue, then neighbour/capital discovery. |
| pinpoint | yes | Place five countries on a map. Fifth round double, maximum 1,200. |
| flag-quiz | yes | Twenty-second sprint: as many flags as you can name, four names each, a wrong answer costs 2 s. Server clock, score = flags named, target 8. Days frozen under the old ten-flag quiz keep it. |
| higher-or-lower | yes | Ten calls, final three double, maximum 13. Practice remains a streak. |
| stat-guesser | yes | Five rulers with reference countries. Final round double, maximum 600. |
| blind-pick | no | Six countries into six statistics. Lower excess over the optimal assignment wins. |
| speed-flags | no | Thirty seconds, two answers, incorrect answers cost three seconds. |

Use scripts to regenerate registry/data JSON. Do not revive retired game slugs.

## Architecture and persistence

Pure deterministic engines: `src/lib/game-logic/{slug}`. Inject RNG.
Per-game UI: `src/games/{slug}`; host is the client boundary.
Shared remote host orchestrates the three quick games; their renderers stay per slug.

The seven dailies send decisions to server actions; Flag Quiz moves are stamped with the server receipt time. The server owns the
full solution, commits an action exactly once at the expected revision, and returns
only a sanitized view. Stale requests return the already committed result. Never
serialize future countries, fits, answers, map targets or engine seeds to the client.
Speed Flags is timed local practice, replay-validated on save.

A signed HttpOnly device cookie replaces player accounts. Results save automatically.
Publishing a name is optional after a daily game. No player sign-in, profile or Friends
navigation. The owner admin secret is separate from player identity.

Current tables are isolated `countrivo_*` tables in the configured FizzAI project.
Use `gameDatabase()` server-side and `COUNTRIVO_SUPABASE_SERVICE_KEY`, never an
unrelated globally exported service key. Never put credentials in tracked files.
Historical tables/accounts in the previous project are untouched.

Daily seeds use server-secret HMAC per slug/date/edition. Full daily board snapshots
are immutable. Archives read snapshots and reject dates at or after today. Today is
Europe/Berlin. Practice excludes current daily draft countries and relevant targets.

## UI

One light theme, paper ground, Erode headings/numerals, system body, one ember accent.
Colors and sizes live in tokens/styles. The muted text token is #6a6b65.
Clay assets and stop-motion states live in `public/clay`; exact Figma tray/map/footer
assets in `public/design`. Motion respects reduced motion.

Every route includes complete first HTML. No loading.tsx, skeleton, spinner, mounted
blank gate or theme toggle. Every apparent control works; touch targets at least 44 px.
No decorative emoji, em dashes or exclamation marks in system copy. Clipboard share
grids are the exception. Real counts and ranks exclude labelled simulated rivals.

## Verification and release

Run `npm run lint`, `npm run check:theme`, `npm run check:contracts`,
`npm run check:draft`, geography/discovery checks and `npm run build`.
`npm run check:render` takes `PLAYWRIGHT_MODULE` pointing to an already installed
playwright-core module. Use it for regression, and Chrome extension Computer Use
for visual walkthroughs. Inspect screenshots, not just HTTP/DOM assertions.

Deploy with `vercel --prod --yes`, verify Ready and countrivo.com, then push main
when authorized. Future board replacement is queued for the next Berlin day;
never reset someone's committed current-day run as a routine deployment step.

## Computer Use

When computer use is needed, always use Claude's Google Chrome extension (skill `claude-in-chrome`, tools `mcp__claude-in-chrome__*`), not Orca Computer Use. Use Orca Computer Use only for native desktop apps that cannot be reached in the browser. Keep Playwright for repeatable regression tests. This applies across all projects, see `~/.claude/CLAUDE.md`. Always on the MacBook with the M1 Max, never the one with the M5: that file has the steps to select it.
