# 02 · Jonas Eberhardt · Layer · Schichtgrenzen-Audit

> Eine Schicht ist eine Sektion. Wenn das Blech in die Streicher fällt, hört man es. Heute höre ich die Codebase wie eine Probe — wo die Bratschen plötzlich Pauke spielen, wo der Tonmeister geschlafen hat, wo ein einzelner Ton herüberblutet. Mein linkes Ohr taugt nicht mehr für Mahler. Für `grep` taugt es noch.

## Das Regel-Set

Die Schichten dieser Codebase sind in `CLAUDE.md` und `AGENTS.md` exakt benannt. Ich restate sie, weil ich nichts auditiere, was ich nicht zuerst auswendig kann:

1. **Game-Logic** (`src/lib/game-logic/{slug}/`) — pure Funktionen, kein React-Import, keine Side-Effects. Die Engine bekommt eine RNG als Parameter. `Math.random` ist verboten. `Date.now()` zählt als Side-Effect.
2. **Game-UI** (`src/components/games/{slug}/{slug}-board.tsx`) — `"use client"`, ein einziges Board, `useReducer` für komplexen Spielzustand.
3. **Pages** (`src/app/**/page.tsx`) — IMMER Server Components. Niemals `"use client"`.
4. **Server-Mutations** — ausschließlich in `src/app/actions/*.ts` mit `"use server"` ganz oben. Keine Route-Handler (`route.ts`).
5. **Supabase-Clients** — `@/lib/supabase/server` ausschließlich in Server-Layer. `@/lib/supabase/client` ausschließlich in Client-Layer. Niemals quergreifen.

Sechs Sektionen, sechs Verantwortungen. Ich höre durch jede.

## `"use client"` Direktiven

`grep -rn '"use client"' src/` liefert **47 Treffer**. Ich klassifiziere — jeder einzeln bewertet.

### Justifiziert (Hooks, Komponenten mit echtem Client-Bedarf)

```
src/hooks/use-local-storage.ts                    — localStorage, requires window
src/hooks/use-daily-challenge.ts                  — client-side date check
src/hooks/use-game-keys.ts                        — keydown listener
src/hooks/use-share.ts                            — navigator.share
src/hooks/use-countdown.ts                        — setInterval timer
src/hooks/use-multiplayer.ts                      — Supabase realtime channel
src/components/auth/auth-provider.tsx             — React context, onAuthStateChange listener
src/components/auth/auth-modal.tsx                — controlled inputs, browser-auth
src/components/layout/header.tsx                  — usePathname, useState
src/components/streak-badge.tsx                   — local UI animation
src/components/join-code-input.tsx                — controlled input
src/components/daily-hero.tsx                     — client-side countdown
src/components/game/pick-feedback.tsx             — animated UI
src/components/game/endgame-ramp.tsx              — animation
src/components/game/game-session-top-bar.tsx     — live timer
src/components/game/game-over-screen.tsx          — interactive end-screen
src/components/game/daily-already-played.tsx     — lockout UI
src/components/game/played-today-banner.tsx      — banner with state
src/components/game/daily-lockout-guard.tsx      — client-side gating
src/components/friends/friends-client.tsx        — interactive list
src/components/friends/challenge-friend-picker.tsx — modal picker
src/components/profile/profile-edit-form.tsx     — controlled form
src/components/country/countries-client.tsx      — search/filter
src/components/games/blitz/create-game-button.tsx           — onClick handler
src/components/games/supremacy/create-game-button.tsx       — onClick handler
src/components/games/borderline/create-game-button.tsx      — onClick handler
src/components/games/country-draft/draft-share-card.tsx     — share button
```

Plus alle 15 Board-Komponenten unter `src/components/games/*/`. Alle justifiziert — sie führen das Spiel.

### Verdächtig: Pages mit `"use client"`

Die strikteste Regel (`AGENTS.md` Z29: "Do NOT add 'use client' to page.tsx files") ist an **vier Stellen** verletzt:

```
src/app/error.tsx:1                              "use client";
src/app/vs/[code]/page.tsx:1                     "use client";
src/app/games/blitz/play/page.tsx:1              "use client";
src/app/games/supremacy/play/page.tsx:1          "use client";
src/app/games/borderline/play/page.tsx:1         "use client";
```

`src/app/error.tsx` — Next.js verlangt für Error-Boundaries explizit `"use client"`. **Justifiziert** durch Framework-Konvention; die Regel im AGENTS.md ist hier zu absolut formuliert.

Die drei `play/page.tsx` (blitz, supremacy, borderline) verwenden `useSearchParams` für den `mode`-Param. Konstruktion (`src/app/games/blitz/play/page.tsx:1-35`):

```tsx
"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
...
function PlayContent() {
  const params = useSearchParams();
  const rawMode = params.get("mode");
  ...
}
```

Dasselbe Muster bei supremacy/play und borderline/play — wortgleich.

`src/app/vs/[code]/page.tsx:1` ist eine komplette Client-Page mit `useMultiplayer`, Countdown, Clipboard. Auch hier zwingt das Feature die Schicht.

**Verdict:** Major Violation der Regel — aber lösbar. Die Pages könnten ein triviales Server-Component-Shell bleiben und die Search-Param-Logik in eine Client-Child-Komponente schieben. Die drei `play/page.tsx` sind heute eine Mini-Schicht-Verletzung, die jeden Tag größer wird, wenn sie ungeahndet bleibt. Die `vs/[code]/page.tsx` ist als ganzes ein Multiplayer-Lobby-Client — vermutlich am sinnvollsten in `src/components/vs/vs-lobby.tsx` ausgelagert, mit einem dünnen Server-Page-Shell.

### Hooks-Markierung

`src/hooks/use-local-storage.ts`, `use-daily-challenge.ts`, `use-game-keys.ts`, `use-share.ts`, `use-countdown.ts`, `use-multiplayer.ts` führen `"use client"` am Datei-Anfang. Streng genommen ist die Direktive auf Hook-Modul-Ebene überflüssig — die Direktive wirkt am Importpunkt, nicht am Hook-Definitionspunkt. Es schadet nicht, aber es ist Lärm. **Minor.**

## Server-Import-Hygiene

`grep -rn 'from "@/lib/supabase/server"' src/` — 11 Treffer, alle in der richtigen Sektion:

```
src/app/page.tsx:11                              — server component
src/app/auth/callback/route.ts:2                 — route handler (siehe weiter unten)
src/app/profile/page.tsx:3                       — server component
src/app/profile/[username]/page.tsx:2            — server component
src/app/friends/page.tsx:2                       — server component
src/app/friends/add/[username]/page.tsx:2        — server component
src/app/games/[slug]/leaderboard/page.tsx:5      — server component
src/app/actions/challenges.ts:3                  — server action
src/app/actions/profile.ts:3                     — server action
src/app/actions/friends.ts:3                     — server action
src/app/actions/game-runs.ts:3                   — server action
```

`grep -rn 'from "@/lib/supabase/server"' src/components/` — **leer**. Sauber.
`grep -rn 'from "@/lib/supabase/server"' src/hooks/` — **leer**. Sauber.

Spiegelbild: `@/lib/supabase/client` (3 Treffer) ausschließlich in Client-Layer:

```
src/components/auth/auth-provider.tsx:12         — "use client"
src/components/auth/auth-modal.tsx:5             — "use client"
src/hooks/use-multiplayer.ts:3                   — "use client"
```

**Verdict:** Die Supabase-Schichtgrenze ist akkurat respektiert. Hier hört das Ohr nichts Falsches. Sauber wie ein leerer Saal.

## Game-Logik-Reinheit

Die wichtigste Sektion. `src/lib/game-logic/` enthält 19 TS-Dateien.

`grep -rn "from \"react\"" src/lib/game-logic/` — **leer**. Keine einzige Engine importiert React. Erste Probe bestanden.

`grep -rn "Math.random" src/lib/game-logic/` — **leer**. Keine Engine ruft `Math.random()`. Zweite Probe bestanden.

### Aber: `Date.now()` in Engines

`grep -rn "Date.now()" src/lib/game-logic/`:

```
src/lib/game-logic/blitz/engine.ts:23           // Date.now() when round started
src/lib/game-logic/blitz/engine.ts:85           roundStartTime: Date.now(),
src/lib/game-logic/blitz/engine.ts:146          const timeMs = Date.now() - state.roundStartTime;
src/lib/game-logic/blitz/engine.ts:184          roundStartTime: Date.now(),
src/lib/game-logic/continent-sprint/engine.ts:43    startTime: Date.now(),
src/lib/game-logic/continent-sprint/engine.ts:62    elapsed: Date.now() - state.startTime,
src/lib/game-logic/continent-sprint/engine.ts:70    elapsed: Date.now() - state.startTime,
src/lib/game-logic/country-draft/engine.ts:7    const dateKey = mode === "daily" ? getTodayDateKey() : `practice-${Date.now()}`;
src/lib/game-logic/country-draft/engine.ts:9       mode === "daily" ? getDailyRng(dateKey) : mulberry32(Date.now());
```

`Date.now()` ist nichtdeterministisch — eine Engine, die ihn ruft, ist nicht mehr pur. Das Mahler-Adagio darf nicht zucken.

**`blitz/engine.ts`** und **`continent-sprint/engine.ts`** rufen `Date.now()` als Timer-Startpunkt im State. Das ist *im Geist* okay (Stoppuhr ist Spielmechanik, nicht Zufall), aber *im Wortlaut* der Regel ein Bruch der Pure-Function-Vorgabe. Beide Engines wären sauberer, wenn der Caller den Startzeit-Wert reinreichen würde: `createBlitz(rng, startedAtMs)`. Dann ist die Engine reproduzierbar wie Notentext.

**`country-draft/engine.ts:6-11`** ist der ernste Fall:

```ts
export function createGame(mode: "daily" | "practice"): DraftGameState {
  const dateKey = mode === "daily" ? getTodayDateKey() : `practice-${Date.now()}`;
  const rng =
    mode === "daily" ? getDailyRng(dateKey) : mulberry32(Date.now());
  ...
}
```

Diese Engine ist **die einzige Engine im Repo, die ihren eigenen RNG erschafft.** Vergleiche die saubere Form in `blitz-board.tsx:50`, `flag-quiz-board.tsx:29`, `border-buddies-board.tsx:30` etc. — dort ruft das Board `mulberry32(Date.now())` und übergibt die RNG **an die Engine**. Bei `country-draft/engine.ts` ist der Date-Now-Aufruf *innerhalb* der Engine, plus zwei externe Seiteneffekt-Quellen (`getTodayDateKey`, `getDailyRng`).

Es ist genau das, was passiert, wenn die Bratsche anfängt, die Pauke zu spielen, weil der Schlagzeuger spät dran ist. Es klingt nicht falsch. Es ist falsch.

**Empfehlung:** `country-draft/engine.ts:6` umbauen auf `createGame(rng: () => number, mode: ..., dateKey: string)`. Date-Source und RNG-Erzeugung ins Board verschieben — wie es alle anderen 14 Engines machen.

### Stateful RNG in `higher-or-lower/engine.ts:27`

```ts
export interface HoLState {
  ...
  rng: () => number;
}
```

Der RNG wird im State festgehalten und in `guess()` weiter gerufen (Z97). Das ist *technisch* deterministisch — solange die `mulberry32`-Closure von oben mit demselben Seed gestartet wurde — aber es ist **kein purer Datenstruktur-State** mehr. Ein State, der eine mutable Closure trägt, lässt sich nicht serialisieren, nicht time-travel-debuggen, nicht mit `JSON.parse(JSON.stringify(state))` reproduzieren. Eine kleine Dissonanz, aber sie sitzt am falschen Pult.

**Empfehlung:** Den nachträglichen RNG-Bedarf (für Nachschub-Rounds in Z97) anders lösen — entweder einen großen Vorrat im `createHoL` erzeugen, oder den RNG-Tick als `tickSeed: number` im State speichern und bei Bedarf `mulberry32(state.tickSeed + state.currentRound)` ableiten.

### Math.random im UI-Layer (nicht Logik, aber erwähnenswert)

`src/components/game/game-over-screen.tsx:232`:

```tsx
const suggestions = useMemo(() =>
  ALL_SUGGESTIONS
    .filter((s) => !gameSlug || !s.href.includes(gameSlug))
    .sort(() => Math.random() - 0.5)
    .slice(0, 4),
[gameSlug]);
```

Das ist UI-Layer, nicht Game-Logik. Die Regel ("no Math.random in game logic") wird im Buchstaben gewahrt — aber der `.sort(() => Math.random() - 0.5)`-Shuffle ist ohnehin **statistisch fehlerhaft** (kein gleichverteilter Permutationen-Generator). Wenn schon, dann `seededShuffle(arr, mulberry32(Date.now()))` aus `@/lib/seeded-random`. **Minor**, aber kosmetisch hässlich. Würde ein Tonmeister es so durchgehen lassen? Nein.

## Server Actions

`ls src/app/actions/` liefert vier Dateien. Jede Datei beginnt mit `"use server";` in Zeile 1:

```
src/app/actions/challenges.ts:1                   "use server";
src/app/actions/friends.ts:1                      "use server";
src/app/actions/game-runs.ts:1                    "use server";
src/app/actions/profile.ts:1                      "use server";
```

`grep -rn '"use server"' src/` — nur die vier Treffer. Keine versehentliche Inline-Direktive in irgendeinem anderen File.

`game-runs.ts:27-40` zeigt das saubere Muster — Auth-Check zuerst, dann Score-Validierung, dann typisierte Rückgabe. Konvention wie sie in `.claude/rules/supabase.md` definiert ist, eingehalten.

**Verdict:** Server-Action-Layer ist sauber durchstrukturiert. Diese Sektion sitzt aufrecht.

## Route Handlers (verboten)

`find src/app -name route.ts` — **ein Treffer**:

```
src/app/auth/callback/route.ts
```

Vollständiger Inhalt (22 Zeilen):

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";

  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
```

Die Regel sagt: "No API routes. Use server actions." Dieser Route-Handler ist ein **strukturell unvermeidbarer Sonderfall**. OAuth-Provider (Google, etc.) führen den Browser über einen Redirect mit `?code=…` zur Callback-URL zurück. Ein Server Action kann kein OAuth-Callback-Ziel sein, weil OAuth-Provider ein klassischer HTTP-GET ist, kein POST mit Form-Action. Next.js erlaubt es technisch nicht.

**Verdict:** Justifizierter Sonderfall. Die Regel im AGENTS.md sollte präzisiert werden — "no application-mutation route.ts; auth callbacks excepted". Heute ist der File konform mit dem Sinn der Regel, nicht mit ihrem Wortlaut. **Minor** — Doku-Update statt Code-Änderung.

## Board-Schichten

`find src/components/games -name '*-board.tsx'` — 15 Boards, einer pro Spiel. Konsistenter Pfad: `src/components/games/{slug}/{slug}-board.tsx`. Alle starten mit `"use client";`.

Stichprobe auf `useReducer`-Pattern (Vorschrift in `.claude/rules/code-quality.md:11`):

```
blitz/blitz-board.tsx          useReducer count: 2  (import + Aufruf)
border-buddies/border-board.tsx                  : 2
borderline/borderline-board.tsx                  : 2
capital-match/capital-board.tsx                  : 2
continent-sprint/sprint-board.tsx                : 2
country-draft/draft-board.tsx                    : 2
country-streak/streak-board.tsx                  : 1   ← Anomalie
countryle/countryle-board.tsx                    : 2
flag-quiz/flag-quiz-board.tsx                    : 2
higher-or-lower/hol-board.tsx                    : 2
odd-one-out/odd-board.tsx                        : 2
population-sort/sort-board.tsx                   : 2
speed-flags/speed-board.tsx                      : 2
stat-guesser/guesser-board.tsx                   : 2
supremacy/supremacy-board.tsx                    : 2
```

### Major: `country-streak/streak-board.tsx`

Dieser Board **importiert** `useReducer`, **benutzt ihn aber nicht**. Stattdessen (Z32):

```tsx
const [state, setState] = useState(() => init(mode));
```

Der gesamte komplexe `StreakState` aus `streak-engine.ts` wird in ein `useState` gestopft. Es funktioniert, aber es bricht das Konventions-Pattern aller anderen 14 Boards. Ein Spieler im Orchester, der die falsche Stimme spielt — meist nicht hörbar, aber bei einem fortissimo merkt es jeder.

**Empfehlung:** `useReducer` einführen, mit einem Reducer der dieselbe Engine-Update-Logik kapselt wie z.B. `country-streak`'s Geschwister `flag-quiz`. Verbleibender ungenutzter `useReducer`-Import (Z3) soll dann genutzt werden — sonst entfernen, denn dead imports sind kleine Risse im Lack.

### Versprochene Vor-Beispiele

Best-in-class: `countryle/countryle-board.tsx:165` — `useReducer(reducer, mode, init)` mit klar getrennten Action-Typen und parallelem UI-State (`useState` für Eingabe-Felder und Feedback-Animations). So sieht die Trennung aus, wenn sie sitzt.

## Findings nach Schweregrad

### Critical
*Keine.* Die Architektur trägt.

### Major
1. **`src/app/games/blitz/play/page.tsx:1`** — `"use client"` auf einer page.tsx. AGENTS.md Z29 verletzt.
2. **`src/app/games/supremacy/play/page.tsx:1`** — dito.
3. **`src/app/games/borderline/play/page.tsx:1`** — dito.
4. **`src/app/vs/[code]/page.tsx:1`** — komplette Page als Client-Lobby; Server-Page-Shell + Client-Child-Component empfohlen.
5. **`src/lib/game-logic/country-draft/engine.ts:6-11`** — Einzige Engine, die ihren eigenen RNG erschafft und `Date.now()` plus externe Seed-Funktionen ruft. Pure-Function-Regel verletzt.
6. **`src/components/games/country-streak/streak-board.tsx:32`** — `useState(() => init(...))` für komplexen Spielzustand statt `useReducer`. Ungenutzter `useReducer`-Import in Z3.

### Minor
1. **`src/lib/game-logic/blitz/engine.ts:85, :146, :184`** — `Date.now()`-Aufrufe innerhalb der Engine. Wortlaut der Reinheit verletzt; im Geist Timer-Mechanik. Sauberer Fix: Caller reicht `nowMs` rein.
2. **`src/lib/game-logic/continent-sprint/engine.ts:43, :62, :70`** — dito.
3. **`src/lib/game-logic/higher-or-lower/engine.ts:27`** — `rng: () => number` als Feld im State. Schwer serialisierbar, prüfbar.
4. **`src/components/game/game-over-screen.tsx:232`** — `Math.random()` im UI-Layer (kosmetisch + statistisch falscher Shuffle). Nicht Game-Logik, aber unwürdig.
5. **`src/app/auth/callback/route.ts`** — vorhandener Route-Handler. Strukturell unvermeidbar. AGENTS.md-Regel "no route.ts" sollte den OAuth-Callback explizit ausnehmen.
6. **`src/app/error.tsx:1`** — `"use client"` auf einer App-Datei. Next.js zwingt es; Regel müsste "page.tsx & layout.tsx" statt allgemein "page.tsx" sagen.
7. **`src/hooks/use-*.ts`** — `"use client"` auf Hook-Modulen ist Lärm. Wirkt am Importpunkt, nicht am Hook-Definitionspunkt.

## Schluss

Die Architektur dieser Codebase ist im großen Bogen sauber gestimmt. Die Supabase-Trennung ist akkurat (keine einzige falsche Importrichtung), die Server-Actions sitzen aufrecht, 14 von 15 Engines bleiben pur. Das Mahler-Adagio läuft ohne Knack.

Die Stellen, an denen eine Sektion auf eine andere getreten ist, sind klar lokalisiert:

- **`country-draft/engine.ts`** — eine Engine, die sich selbst initialisiert, statt sich initialisieren zu lassen. Die einzige Engine im Repo, die das tut. Eine Bratsche, die im Tutti das Tutti-Zeichen gibt.
- **`country-streak/streak-board.tsx`** — ein Board, das aus dem `useReducer`-Quartett ausgebrochen ist und solo `useState`-spielt. Funktional. Falsch eingerichtet.
- **Vier Play-Pages**, die das `"use client"`-Stigma tragen, weil `useSearchParams` zwingt. Heilbar mit einem dünnen Server-Shell.

Das sind keine Katastrophen. Es sind die kleinen Dinge, die einem Tonmeister auffallen, wenn er mit dem rechten Ohr horcht — weil das linke seit Mai 2014 nichts mehr liefert, was kürzer als zwei Sekunden ist.

Wenn man diese sechs Major-Findings über zwei Tage zieht, ist die Akustik wieder lückenlos. Sechs Tage, wenn man die Minors mitnimmt. Niemand spielt dann falsch. Und das ist alles, was ein Tonmeister je wollen kann.

— Jonas Eberhardt, Layer
