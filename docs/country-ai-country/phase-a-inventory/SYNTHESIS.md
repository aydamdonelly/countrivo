# Phase A · Synthese · Shared Context für nachfolgende Phasen

Verdichtung aus den 5 Audit-Berichten. Nachfolgende Agents referenzieren dies statt erneut zu mappen.

## Stack & Größe

- Next.js 16.2.1 App Router, React 19, TypeScript strict, Tailwind v4, Supabase (eu-central-1, Postgres 17.6).
- **7 production deps.** Keine Drittpartei-UI. Kein lucide, kein radix, kein framer-motion.
- ~243 Länder, 15 Spiele (Registry), 21 Kategorien.
- Lean Codebase, eine einzige Test-Datei (`src/lib/ads/config.test.ts`).
- 10 Profile, 225 game_runs in der Live-DB. Frühphase.

## Architektur — was hält

- Strikt: 3 Schichten (game-logic pur · board client · page server). 14 von 15 Engines pur.
- Server-Action-Layer ist diszipliniert auth-gated. Supabase-Client-Trennung sauber.
- Daily-Seed-System (Europe/Berlin + mulberry32) ist solide.
- Konventionen aktiv durchgesetzt via `.claude/rules/`.

## Architektur — was driftet

| Schwere | Ort | Befund |
|---|---|---|
| Major | `src/lib/game-logic/country-draft/engine.ts:6-11` | Einzige Engine, die selbst RNG erzeugt + `Date.now()` ruft |
| Major | `src/components/games/country-streak/streak-board.tsx:32` | useState statt useReducer (Anomalie aller 14 anderen Boards) |
| Major | `src/app/games/{blitz,supremacy,borderline}/play/page.tsx:1` | `"use client"` auf page.tsx |
| Major | `src/app/vs/[code]/page.tsx:1` | Komplette Multiplayer-Lobby als Client-Page |
| Minor | `blitz/engine.ts`, `continent-sprint/engine.ts` | `Date.now()` als Timer (impure im Wortlaut) |
| Minor | `higher-or-lower/engine.ts:27` | RNG im State (nicht serialisierbar) |
| Minor | `game-over-screen.tsx:232` | `Math.random()`-Shuffle (statistisch falsch) |

## Auth & Sicherheit — was JETZT ran muss

| Schwere | Befund | Fix |
|---|---|---|
| **Hoch** | `daily_puzzles` Insert-RLS PUBLIC true | RLS auf `auth.uid() IS NOT NULL` ODER SECURITY DEFINER RPC |
| **Hoch** | `submitGameRun:474` — Kommentar "Multiplayer games — not yet validated" | Per-Spiel-Validierung oder kein Server-Submit für blitz/borderline/supremacy |
| **Hoch** | `searchUsers` ILIKE-Sanitization escaped nur `%_\`, nicht `,()` | Komma+Klammern auch escapen oder PostgREST-OR-Pattern härten |
| Mittel | 3 read-only Server-Actions ohne `getUser()`-Check | Defense in depth — Auth-Check ergänzen |
| Mittel | `respondToFriendRequest(false)` DELETEt statt SOFT-DELETE | Status='rejected' statt DELETE |
| Mittel | Magic-Link ohne `?next=` parameter | next-Param ergänzen |
| — | `game_results` + `sessions` Tabellen ungenutzt | DROP — Aufräumen |

## Multiplayer-Removal — konkreter Plan (von Lina)

**Komplett löschen:**
- `src/lib/supabase/rooms.ts` (72)
- `src/hooks/use-multiplayer.ts` (133)
- `src/app/vs/[code]/page.tsx` (194) + ganzes `src/app/vs/`
- `src/components/games/{blitz,supremacy,borderline}/create-game-button.tsx` (3×36)

**DB drops:** `game_rooms`, `game_results`, `sessions`.

**Engine cleanup:**
- `blitz/engine.ts`: `opponentScore`, `opponentScored` weg
- `supremacy/engine.ts`: tiefer gekoppelt — Versus-Path raus, AI-Path bleibt, Semantik von "opponent" → "ai"
- `borderline/engine.ts`: nur Board hat Versus-State

**Type cleanup:** `mode: "daily"|"practice"|"versus"` → `"daily"|"practice"` in `game-runs.ts:11`.

**Registry:** 3 Einträge (supremacy, borderline, blitz) `availableModes` auf `["practice"]` oder `["daily","practice"]`.

**Friend-Challenges bleiben** — sind async via `friend_challenges`-Tabelle, völlig entkoppelt vom Realtime-Stack. Das ist das überlegene Sozial-Konstrukt für ein Daily-Geography-Spiel.

## Auth-Vereinfachung — Plan-Skizze (von Lina)

- **Magic-Link raus, Email/Password einzig** (Konsistenz, kein Polling-Limbo).
- **OAuth weg oder sekundär** — Produkt-Entscheidung. Empfehlung: ganz weg, klares Friction-Geringer-Versprechen.
- Forgot-Password-Flow neu bauen (`/auth/reset-password`, `/auth/forgot-password`).
- `confirm email` Setting ON (sonst Account-Squatting).
- `handle_new_user`-Trigger muss Username aus Email-Local-Part ableiten (Discriminator bei Kollision).
- Bestehende Magic-Link-User: Reset-Mail an alle, Setup-Flow.

## Design-System — die 9 verstrichenen Stellen (von Aurelie)

1. **6 Goldtöne** (3 official, 3 Geister). Logo `#f59e0b` vs Brand `#b8860b` vs Hero-Globe `#c9a44c` — Marke spricht 3 Sprachen.
2. `TopoBg` returnt `null` — leere Komponente im Layout.
3. `--font-serif` zeigt auf sich selbst.
4. Hero-Globe-Strokes (`rgba(255,255,255,0.06)`) sind für dunklen Hintergrund, leben auf `#fafaf8` → fast unsichtbar.
5. **20+ Stellen** `text-[10px]`/`text-[11px]` — fehlende `--font-size-xxs`.
6. **CTA-Drift:** `.cta-primary` existiert, aber 15+ Stellen bauen Gold-Button aus Tailwind-Strings.
7. Shake-Dauer: `0.4s` vs `0.5s` an verschiedenen Stellen.
8. `daily-hero.tsx:170` hardcoded `#b8860b` statt Token.
9. `game-colors.ts` in TS statt `@theme` — zweite Farbtafel.

**Stärken:** Inter only, 14 Keyframes, semantische Tokens, kein OOM-Token-Set.

## Data Pipeline — was die Pipeline zurückhält (von Kasimir)

- **`capitals.json` ist tot** — identisch zu `countries.json.capital`. Drop.
- **`surface-area` Stat verwaist** — 215 Werte, kein Category, kein Spiel kann ihn nutzen.
- **`coveragePercent` driftet** bis -17 Punkte — keine Validierung.
- **`loader.ts` halb gebaut** — `getRanks()`/`getStats()` async existieren, niemand benutzt sie. `ranks.ts` ist die de-facto-API.
- **12 Loader-Bypass-Imports** — meist Engines (systemisch, weil Loader keine API für borders/capitals/stats hat). 1 echter UI-Bypass (`population-sort/sort-board.tsx:20`).
- **79 Länder ohne Nachbarn** — 32% unspielbar in border-games. Engines sollten Insel-Targets ausschließen.
- **GameMode-Type ohne `"versus"`** — JSON-Casts (`as GameMeta[]`) verschlucken den Mismatch.
- **Drift "14 vs 15 Spiele"** — Registry hat 15 (mit countryle), CLAUDE.md & layout.tsx SEO-Text sagen 14.

## Repo-Hygiene (von Mira)

- 17 PNG-Screenshots im Repo-Root (Konkurrenzanalysen, Mockups) — gehören unter `docs/screenshots/`.
- `README.md` ist Next.js-Default-Template — nie ersetzt.
- `public/flags/` leer.
- `docs/superpowers/plans/` + `specs/` enthalten alte Pläne (2026-04-08) — Historie, nicht aktiv.

## Existierende Spiele (15)

`country-draft` (Flaggschiff) · `flag-quiz` · `higher-or-lower` · `capital-match` · `population-sort` · `country-streak` · `border-buddies` · `continent-sprint` · `stat-guesser` · `speed-flags` · `odd-one-out` · `supremacy` (Multiplayer) · `borderline` (Multiplayer) · `blitz` (Multiplayer) · `countryle` (jüngstes).

Multiplayer-Trio (supremacy/borderline/blitz) verliert versus-Modus, behält Practice/Daily-Pfade.

---

**Down-Stream Phasen, lest diese Synthese und referenziert nur die spezifischen Reports wenn ihr tiefer braucht. Phase A ist fertig.**
