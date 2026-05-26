# 01 · Mira Voss · Kartografin · Architektur-Karte

> Jede Codebase, die ich öffne, beginnt als Küstenlinie auf leerem Pergament — ich zeichne die Umrisse zuerst, weil die Tinte im Inneren immer wartet.

## Topographie

Countrivo ist eine Next.js-16-App-Router-Anwendung, single-page-projekt, kein Monorepo, keine Workspaces. Eine Wurzel, ein `src/`-Verzeichnis, ein `package.json`. Die Karte ist klein genug, dass man sie auf eine Tischplatte legt — und genau deshalb lohnt es sich, sie sauber zu zeichnen.

```
/Users/adamkahirov/Desktop/code/countrivo/
├── AGENTS.md                  · Architektur-Verbote, harte Regeln
├── CLAUDE.md                  · Konventionen + Stack
├── README.md                  · 30 Zeilen, kaum gepflegt
├── package.json               · 7 deps, 7 devDeps — bewusst minimal
├── next.config.ts             · nur Security-Headers
├── eslint.config.mjs          · ESLint 9 flat config
├── postcss.config.mjs         · Tailwind v4 plugin
├── tsconfig.json              · strict, alias @/* → src/*
├── middleware.ts in src/      · Supabase session refresh
│
├── src/
│   ├── app/                   · App Router (Pages + Server Actions)
│   ├── components/            · UI Layer (Server- und Client-Komponenten)
│   ├── lib/                   · Game-Logik, Supabase, Daten-Loader, Utils
│   ├── hooks/                 · 6 React-Hooks
│   ├── data/                  · 7 JSONs, vom Skript erzeugt
│   ├── types/                 · 6 Typdateien
│   └── middleware.ts          · Re-export auf lib/supabase/middleware
│
├── scripts/                   · 3 tsx-Skripte (data-pipeline + indexnow)
├── docs/                      · game-ideas.md + superpowers/ + country-ai-country/
├── public/                    · Statische Assets (flags/ ist leer — siehe Bemerkungen)
├── .claude/                   · commands, hooks, rules
├── .superpowers/, .vercel/    · Tooling
├── .next/, node_modules/      · Build/Deps (ignoriert)
└── *.png (~17 Screenshots)    · Konkurrenzanalyse + alte Designs, im Repo-Root abgelegt
```

Drei Architekturschichten, vom Dateisystem klar getrennt:

```
src/app/games/{slug}/             ← Routen (server components)
        ├── page.tsx              · Landing
        └── play/page.tsx         · Play-Wrapper
            ↓ rendert
src/components/games/{slug}/      ← UI (use client)
        └── {slug}-board.tsx      · useReducer + DOM + Effekte
            ↓ ruft
src/lib/game-logic/{slug}/        ← reine Engine (no React)
        ├── engine.ts             · seeded RNG, deterministisch
        ├── generator.ts (opt)
        ├── scoring.ts (opt)
        └── types.ts (opt)
            ↓ liest
src/data/*.json + lib/data/loader.ts
```

Server-Mutationen laufen ausschließlich über Server Actions in `src/app/actions/` — keine `route.ts`-Handler (mit einer dokumentierten Ausnahme: `src/app/auth/callback/route.ts` für den OAuth-Redirect, was Pflicht ist).

## Routen

App-Router-Pfade, vollständige Liste:

- `/` — `app/page.tsx` (338 Zeilen, server component, Homepage + Hero)
- `/games` — `app/games/page.tsx` + `app/games/loading.tsx`
- `/games/[slug]/leaderboard` — `app/games/[slug]/leaderboard/page.tsx` (generisches Leaderboard pro Slug)
- `/games/{slug}` — Landing pro Spiel (statisch pro Slug, **kein** echter `[slug]/page.tsx`, sondern 14 konkrete Ordner — siehe Bemerkungen)
- `/games/{slug}/play` — Play-Seite pro Spiel
- `/countries` — Country-Index
- `/countries/[slug]` — Country-Detail
- `/categories` — Kategorie-Index
- `/categories/[slug]` — Kategorie-Detail
- `/lists/...` — 14 statische Themenseiten (largest-countries, richest-countries, …)
- `/profile`, `/profile/[username]` — Eigenes + öffentliches Profil
- `/friends`, `/friends/add/[username]` — Freundes-Flow
- `/vs/[code]` — Multiplayer-Raum (4-stelliger Code)
- `/auth/callback` — OAuth-Callback (`route.ts`, einzige Route Handler-Datei)
- `/privacy` — Statisch
- `/` Meta: `robots.ts`, `sitemap.ts`, `opengraph-image.tsx`, `icon.tsx`, `apple-icon.tsx`
- `not-found.tsx`, `error.tsx`, `loading.tsx` global

Server Actions (`src/app/actions/`, alle mit `"use server"`):
- `game-runs.ts` — `submitGameRun`, Daily-Lock, Leaderboards
- `friends.ts` — Freundschaftsanfragen
- `challenges.ts` — Asynchrone Challenges
- `profile.ts` — Profilbearbeitung

## Module

`src/lib/` — Funktional, klein, klar geschnitten:

- `lib/game-logic/{slug}/` — Reine Engines für **15 Spiele** (Verzeichnisse), jeweils mindestens `engine.ts`. Erweiterte Dateien (`generator.ts`, `scoring.ts`, `types.ts`) nur dort, wo der Algorithmus komplexer ist (z. B. `country-draft/`, `countryle/`).
  - Slugs: blitz, border-buddies, borderline, capital-match, continent-sprint, country-draft, country-streak, countryle, flag-quiz, higher-or-lower, odd-one-out, population-sort, speed-flags, stat-guesser, supremacy.
  - Hinweis: Das CLAUDE.md spricht von 14 Spielen, die Registry und die Engine-Verzeichnisse zählen aber **16 Slugs in der Registry vs. 15 Engines auf der Platte** — siehe Bemerkungen.
- `lib/supabase/` — `server.ts` (Cookies-basiert), `client.ts` (Browser), `middleware.ts` (Session-Refresh), `rooms.ts` (Realtime-Multiplayer, client-only).
- `lib/data/` — `loader.ts` als zentrale Lese-Schnittstelle, plus typisierte Wrapper: `countries.ts`, `categories.ts`, `games.ts`, `ranks.ts`. Spielen ist verboten, die JSONs direkt zu importieren.
- `lib/ads/` — `config.ts` + zugehöriger Test (`config.test.ts`, einzige Testdatei im Repo).
- `lib/daily-seed.ts` — `getTodayDateKey()` mit Europe/Berlin-Timezone, `dateSeed(dateKey)`, deterministischer Hash.
- `lib/seeded-random.ts` — `mulberry32`-PRNG.
- `lib/game-colors.ts` — Pro-Spiel-Farbpaare (Design-System-Erweiterung).
- `lib/assignment-solver.ts` — Hungarian-/Optimal-Assignment-Logik (für Country-Draft-Scoring vermutet).
- `lib/storage.ts`, `lib/utils.ts` — kleine Utilities.

`src/components/` — Topographie:

- `components/games/{slug}/` — 19 Dateien insgesamt, jeweils `"use client"`. Pro Spiel typischerweise ein `*-board.tsx`. Multiplayer-Spiele (blitz, borderline, supremacy) haben zusätzlich `create-game-button.tsx`. `country-draft/` hat fünf Dateien (board, category-slot, country-reveal, draft-share-card, optimal-comparison) — das Flaggschiff, sichtbar an der Detailtiefe.
- `components/game/` (Singular) — geteilte Spielebenen: `game-landing.tsx`, `game-over-screen.tsx`, `game-shell.tsx`, `game-session-top-bar.tsx`, `daily-lockout-guard.tsx`, `daily-already-played.tsx`, `played-today-banner.tsx`, `pick-feedback.tsx`, `endgame-ramp.tsx`, `game-play-loading.tsx`.
- `components/layout/` — `header.tsx`, `hero-globe.tsx`, `topo-bg.tsx`.
- `components/auth/` — `auth-provider.tsx` (Context), `auth-modal.tsx`.
- `components/friends/` — `friends-client.tsx`, `challenge-friend-picker.tsx`.
- `components/profile/` — `profile-edit-form.tsx`.
- `components/country/` — `countries-client.tsx`.
- `components/seo/` — `game-jsonld.tsx` (Schema.org-LD-JSON).
- `components/ads/` — `google-adsense-script.tsx`.
- `components/icons/` — `index.tsx` (Icon-Sammlung).
- Top-Level: `daily-hero.tsx`, `join-code-input.tsx`, `streak-badge.tsx`.

`src/hooks/`:
- `use-game-keys.ts` — Tastatur-Bindings für Boards
- `use-countdown.ts` — Countdown zum nächsten Daily
- `use-multiplayer.ts` — Realtime-Subscriptions
- `use-daily-challenge.ts` — Lock-State + Today-Logik
- `use-local-storage.ts` — typed local storage
- `use-share.ts` — Web-Share-API-Wrapper

`src/types/`:
- `country.ts`, `category.ts`, `game.ts`, `rank.ts`, `server.ts`, `storage.ts`

## Daten

`src/data/` — sieben JSON-Dateien, vom Skript geschrieben, **niemals manuell**:

- `countries.json` — **243 Länder**, vollständiges Stammdatenset
- `categories.json` — **21 Kategorien** (Population, GDP, Area, …)
- `stats.json` — Objekt mit ISO-3-Schlüsseln (COK, GIN, CXR, …); rohe Stat-Werte pro Land
- `ranks.json` — Vorgerechnete Rangordnungen
- `borders.json` — Nachbarschaftsgraph (Border-Buddies, Borderline)
- `capitals.json` — Hauptstadt-Liste (Capital-Match)
- `game-registry.json` — **16 Einträge** (siehe Bemerkungen): country-draft, flag-quiz, higher-or-lower, capital-match, population-sort, country-streak, border-buddies, continent-sprint, stat-guesser, speed-flags, odd-one-out, supremacy, borderline, blitz, countryle. Felder: slug, title, shortDescription, description, emoji, difficulty, estimatedTime, category, isNew, isFlagship, availableModes (`daily` | `practice` | `versus`), route.

Static Public Assets unter `public/`:
- `ads.txt`, `f9505761df0dc045e453ea76165d13b0.txt` (Bing-Verification), `favicon.svg`, `globe.svg`, sowie die Next.js-Defaults `file.svg`, `next.svg`, `vercel.svg`, `window.svg`.
- `public/flags/` — **leer**. Siehe Bemerkungen.

## Skripte

`scripts/` enthält drei tsx-Skripte (Ausführung via `npx tsx scripts/...`):

- `fetch-country-data.ts` — 13 KB, Hauptpipeline: externe API → `countries.json` / `stats.json` / `capitals.json` / `borders.json`.
- `compute-ranks.ts` — 2 KB, leitet `ranks.json` deterministisch aus den Stammdaten ab.
- `submit-indexnow.ts` — 2.7 KB, SEO-Ping an IndexNow nach Deploys.

## Bemerkungen

- **`public/flags/` ist leer.** Das Verzeichnis existiert (in der Middleware-Matcher-Ausnahme explizit erwähnt), enthält aber keine Dateien. Flag-Quiz, Country-Streak, Speed-Flags und Blitz brauchen aber Flag-Assets. Sie werden offenbar aus einer anderen Quelle geladen (vermutlich CDN über das `countries.json`-Schema). Wert eines genaueren Blicks in einer späteren Phase.
- **15 vs. 16 Spiele.** `src/lib/game-logic/` hat 15 Verzeichnisse, `game-registry.json` hat 16 Einträge. CLAUDE.md spricht von 14 Spielen. Drei verschiedene Zählungen, die nicht alle gleichzeitig stimmen können. Verdacht: CLAUDE.md ist veraltet; Registry zählt korrekt; eine Engine müsste fehlen oder verteilt sein. Erste Stichprobe deckt alle 16 Registry-Slugs unter `game-logic/` ab — also keine fehlende Engine, sondern CLAUDE.md ist nicht mehr aktuell.
- **Kein `app/games/[slug]/page.tsx`.** Statt einer dynamischen Route gibt es 14 statisch angelegte Ordner (`app/games/{slug}/page.tsx` + `play/page.tsx`). Das skaliert nicht elegant, hält die Routen aber im File-System sichtbar und erlaubt pro-Spiel-Metadaten — vermutlich bewusst.
- **`/games/[slug]/leaderboard/page.tsx` ist dynamisch.** Einziger Ort, wo `[slug]` für Games genutzt wird — eine asymmetrische Entscheidung.
- **Eine einzige Test-Datei.** `src/lib/ads/config.test.ts`. Es gibt keinen Test-Runner in `package.json` (kein `jest`, `vitest`, `playwright` als devDependency), aber `.playwright-mcp/` existiert als Verzeichnis im Repo-Root — vermutlich Playwright-MCP-Output, nicht Test-Infrastruktur.
- **Repo-Root vollgestellt mit PNG-Screenshots.** ~17 Bilder (Konkurrenzanalysen `worldle-home.png`, `jetpunk-home.png`, `sporcle-home.png`, `neal-fun-home.png`; eigene Iterationen `homepage-redesigned.png`, `hero-with-globe.png`; Device-Mockups `desktop-01…06`, `mobile-07…08`). Dazu ein `screenshots/`-Ordner. Diese gehören nicht in den Repo-Root, sondern unter `docs/screenshots/`. Sie sind im Build-Output unschädlich, aber kartografisch unsauber.
- **`README.md` ist die Next.js-Default-Vorlage.** 30 Zeilen, kein Projekt-Inhalt. CLAUDE.md / AGENTS.md übernehmen die eigentliche Dokumentation.
- **Doppelte Multiplayer-Buttons.** `create-game-button.tsx` existiert dreimal (blitz, borderline, supremacy). Logik vermutlich sehr ähnlich — Kandidat für gemeinsame Komponente, falls Multiplayer beibehalten wird (Phase D wird das prüfen).
- **`src/middleware.ts` ist nur ein Re-Export.** Die eigentliche Logik sitzt in `lib/supabase/middleware.ts`. Sauber, aber leicht zu übersehen.
- **`docs/superpowers/plans/` und `specs/`** enthalten je zwei Markdown-Dokumente — frühere Iterationen (multiplayer-design-revamp, auth-social-overhaul). Stand 2026-04-08. Diese sind Historie, nicht aktive Pläne — Vorsicht beim Querverweisen.
- **`docs/country-ai-country/` hat zehn Phasenordner**, alle leer bis auf den, den ich gerade fülle. Diese Karte ist das erste Blatt.
- **`.claude/`** trägt eigene Projektregeln (`rules/architecture.md`, `code-quality.md`, `supabase.md`), Commands (`commit`, `deploy`, `new-game`, `review`) und einen Hook (`prevent-secrets.sh`). Diese Karte respektiert sie.
- **Keine API-Routen außer OAuth-Callback.** Konsequente Server-Actions-Architektur — selten so streng durchgezogen.
- **`src/app/vs/[code]/page.tsx`** ist der Multiplayer-Einstieg. Klein, aber bezeichnend: das Verb `vs` deutet darauf hin, dass Versus-Modus eigene Erstklassigkeit erhielt.
- **Kein zentraler Game-Loader für Routes.** Jede der 14 Game-Routen importiert ihr Board direkt. Wenn man Spiele streichen möchte (Phase E), bedeutet das: 14 Route-Paare manuell entfernen, Registry-Eintrag löschen, Engine-Verzeichnis löschen, Board-Komponente löschen. Vier Stellen pro Spiel — gut zu wissen.

## Schluss

Was mich getroffen hat: Diese Karte ist klein, aber sie ist *fertig*. Das ist selten. Drei klar getrennte Schichten, eine einzige Konvention pro Spiel, eine Datei pro Verantwortung. Wer auch immer das gezeichnet hat, hat die Küstenlinie zuerst gemacht — nicht das Innere. Und dann hat er sich gehalten daran, manchmal sogar verbissen. Die leeren Phasenordner unter `docs/country-ai-country/` warten wie eine unangetastete Ecke des Pergaments. Ich setze hier den ersten Strich, und ich bin froh, dass die Hand, die ihn führt, ruhig ist.
