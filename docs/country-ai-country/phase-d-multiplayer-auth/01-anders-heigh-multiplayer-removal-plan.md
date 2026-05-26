# 01 · Anders Heigh · Multiplayer-Entfernung

> Code löschen ist die seltene Form von Engineering, die respektiert werden sollte. Acht Jahre nach Stavanger schreibe ich wieder ein Memo, das mit "We are tearing this out" anfängt. Diesmal ohne Mona, die das Memo nicht mehr liest.

---

## Pre-Flight: Lina's Map Verified

Lina hat sauber gearbeitet. Ich habe ihre Liste gegen den Code abgeglichen und drei Tests in der Live-DB gefahren. Ergebnisse:

**Bestätigt — Komplett-Löschungen:**
- `src/lib/supabase/rooms.ts` (72 Z.)
- `src/hooks/use-multiplayer.ts` (133 Z.)
- `src/app/vs/[code]/page.tsx` (194 Z.) + `src/app/vs/`
- `src/components/games/blitz/create-game-button.tsx` (36 Z.)
- `src/components/games/borderline/create-game-button.tsx` (36 Z.)
- `src/components/games/supremacy/create-game-button.tsx` (36 Z.)

**Bestätigt — Engine/Board-Cleanup:**
- `blitz/engine.ts` — `opponentScore`, `opponentScored()` weg.
- `supremacy/engine.ts` — tiefe Versus-Kopplung, Sonderfall (siehe Engine-Refactor unten).
- `borderline/engine.ts` — Engine sauber, Versus nur im Board.
- 3 Boards mit `isVersus`-Branches.

**Bestätigt — Routing/Registry/Types:**
- `mode: "daily" | "practice" | "versus"` in `game-runs.ts:11` + `mode`-CHECK-Constraint in DB.
- Registry-Einträge für blitz/borderline/supremacy mit `["practice", "versus"]`.
- 3 `play/page.tsx` parsen `?mode=versus` und `?room=`.
- 3 Landing-Pages mit `playMode="MultiPlayer"` JSON-LD.

**Ergänzungen, die Lina nicht in ihrer Liste hatte:**

1. **Marketing-Text in Landing-Pages.** Drei Strings, die Versus-Modus bewerben:
   - `src/app/games/blitz/page.tsx:57` — "In versus mode, first correct answer wins the round"
   - `src/app/games/borderline/page.tsx:58` — "In versus mode, race your opponent — fewest steps wins!"
   - `src/app/games/supremacy/page.tsx:8` — "Real-time multiplayer geography game" (in meta-description)
   - `src/app/games/supremacy/page.tsx:17` — "outsmart your opponent" (im description-Prop)

2. **Score-Anzeige in Versus-Results.** `blitz-board.tsx:200-204`, `supremacy-board.tsx:189-197` — der Win/Lose/Draw-Titel-Branch verschwindet. Practice-Pfad muss übrig bleiben.

3. **`GameSessionTopBar` in `blitz-board.tsx:279`.** Dort steht `mode={mode === "versus" ? "practice" : mode}` — der Versus-Fall war schon ein Workaround, der jetzt verschwindet.

4. **CHECK-Constraint in DB.** `game_runs.mode` hat eine CHECK-Klausel `(mode = ANY (ARRAY['daily', 'practice', 'versus']))`. Die muss in der Migration neu definiert werden, sonst bleibt `'versus'` in der DB technisch erlaubt — Disziplinbruch zwischen Code und Schema.

5. **`page.tsx`-Files in den drei Play-Routen sind `"use client"`.** Lina notiert das in SYNTHESIS unter "Architektur-Drift". Das ist nicht zwingend Multiplayer-Code, aber die Existenz dieser `"use client"`-Pages **hat einen einzigen Grund**: `useSearchParams()` für `mode=versus`. Sobald nur noch `practice|daily` möglich ist, kann man die mode-Parsing-Logik in den `GameShell` schieben oder mit einer einzigen Server-Component machen. Eigentlich ein Cleanup-Kandidat **als Folge** der Removal. Schiebe ich in einen separaten Commit (siehe Phasenplan).

6. **`useGameKeys`-Disable-Bedingung.** In `supremacy-board.tsx:184` und `blitz-board.tsx:181` keine versus-spezifische Logik — sauber. Borderline-Board hat `getValidNeighbors`-Call, der nichts mit Versus zu tun hat. **Kein Risiko.**

7. **Friend-Challenges via `compute_daily_rankings`.** `compute_daily_rankings` läuft nur für `mode="daily"`. Versus-Runs haben heute `mode="versus"` (nicht "daily"), also gibt es 0 Rankings für Versus. **Bestätigt:** keine Daten-Migration für Rankings.

8. **`score_sort_value`-Switch.** Die drei Spiele bleiben im Switch drin (für Practice-Submits). **Korrekt.** Nichts zu tun.

**DB-Verifikation (selbst gefahren):**

| Frage | Antwort |
|---|---|
| `SELECT mode, COUNT(*) FROM game_runs GROUP BY mode` | `daily: 131, practice: 93` — **0 versus-Zeilen** |
| FK-Constraints auf `game_results`/`sessions`/`game_rooms`? | `game_results.session_id → sessions.id`, `game_results.room_id → game_rooms.id`. **DROP-Reihenfolge wichtig: `game_results` zuerst.** |
| CHECK-Constraint auf `game_runs.mode`? | `(mode = ANY (ARRAY['daily', 'practice', 'versus']))` — muss neu gesetzt werden |

Lina hat die 0-Versus-Annahme nicht explizit verifiziert. Jetzt ist sie verifiziert.

---

## Phasenplan

Vier Commits. Jeder Commit lässt den Build grün, jeder ist atomar, jeder ist auch einzeln revertierbar. Die Reihenfolge ist nach **Risiko** sortiert, nicht nach Größe — zuerst die UI-Teile, die nichts brechen können, am Ende die DB.

### Commit 1 — Strip versus paths from the three multiplayer boards

**Was:** UI-Bereinigung. Engine bleibt unverändert. Boards akzeptieren weiterhin `mode`-Prop, aber `"versus"` ist kein gültiger Wert mehr.

**Files:**
- `src/components/games/blitz/blitz-board.tsx` — `useMultiplayer`-Import + Hook-Call weg, `isVersus`-Branches weg, `roomCode`-Prop weg, "Opponent got it" → "Missed", Score-Anzeige auf Solo, Reducer-Action `OPPONENT_SCORED` weg.
- `src/components/games/borderline/borderline-board.tsx` — analog: `useMultiplayer` weg, `opponentSteps`/`opponentFinished`-State weg, Subtitle in Results auf Solo, "Waiting for opponent" weg.
- `src/components/games/supremacy/supremacy-board.tsx` — `useMultiplayer` weg, der `lastMessage`-useEffect weg, "Opponent is picking" → "AI is thinking" (war bereits korrekt für Practice), `isVersus` ausschließlich aus dem JSX getilgt. **Wichtig:** Der State-Shape bleibt erstmal — Umbenennung `opponent → ai` ist Commit 3.
- `src/app/games/blitz/play/page.tsx`, `borderline/play/page.tsx`, `supremacy/play/page.tsx` — `rawMode === "versus"`-Check weg, `roomCode` weg. (`"use client"` bleibt erstmal, siehe Commit 4.)
- `src/app/games/blitz/page.tsx`, `borderline/page.tsx`, `supremacy/page.tsx` — `CreateGameButton`-Import + JSX weg, `playMode="MultiPlayer"` → `"SinglePlayer"`, Versus-Werbetexte raus.

**Was bleibt unverändert in diesem Commit:** Engine-Files. Type `mode: "daily" | "practice" | "versus"` in `game-runs.ts`. DB-Schema. Registry `availableModes`. Die `*-create-game-button.tsx`-Files (sind noch da, aber niemand importiert sie mehr).

**Test:** `npm run build` muss grün bleiben. `npm run dev`, manuell jede der drei Spielseiten aufrufen, Practice + Daily durchspielen. Es darf nirgendwo ein "Waiting for opponent..."-Screen mehr erscheinen.

**Reihenfolge-Begründung:** UI-only. Kein State-Shape geändert, keine DB-Migration. Wenn etwas schief geht, ist es ein typed-Compile-Fehler oder ein toter Code-Pfad — beides offensichtlich. Bevor irgendetwas DB-seitig passiert, läuft die App ohne Multiplayer-UI.

---

### Commit 2 — Delete multiplayer infrastructure and registry cleanup

**Was:** Die Files, die jetzt niemand mehr importiert.

**Files (delete):**
- `src/lib/supabase/rooms.ts`
- `src/hooks/use-multiplayer.ts`
- `src/app/vs/[code]/page.tsx` + Verzeichnis `src/app/vs/`
- `src/components/games/blitz/create-game-button.tsx`
- `src/components/games/borderline/create-game-button.tsx`
- `src/components/games/supremacy/create-game-button.tsx`

**Files (edit):**
- `src/data/game-registry.json` — drei Einträge:
  - `supremacy:167`: `["practice", "versus"]` → `["practice"]`
  - `borderline:181`: `["practice", "versus"]` → `["practice"]`
  - `blitz:195`: `["practice", "versus"]` → `["practice"]`
  
  (Daily wird **nicht** hinzugefügt — das wäre eine separate Produkt-Entscheidung. Heute haben die drei Spiele technisch Daily-Pfade im Code via `dailyKey`-Prop, aber keine Einträge in `availableModes`. Status quo bleibt.)

**Was bleibt unverändert:** Engine-Files (siehe Commit 3). Type `mode` (siehe Commit 4). DB (siehe Commit 4).

**Test:** `npm run build` grün. `grep -r "useMultiplayer\|createRoom\|joinRoom\|getRoomByCode\|/vs/" src/` muss leer sein. `grep -r "from \"@/hooks/use-multiplayer\"\|from \"@/lib/supabase/rooms\"" src/` muss leer sein.

**Reihenfolge-Begründung:** Erst nachdem niemand mehr importiert (Commit 1 ist durch), kann man löschen ohne Compile-Errors. Wenn man die Reihenfolge umdreht, hat man eine kaputte Build-Phase zwischendrin — vermeidbar.

---

### Commit 3 — Engine refactor: blitz, supremacy, borderline

**Was:** Versus-Felder aus Game-State-Shapes raus. Bei supremacy: `opponent*` → `ai*` Umbenennung.

**Files:**
- `src/lib/game-logic/blitz/engine.ts`
  - `BlitzState.opponentScore` weg.
  - `createBlitz()` Init: `opponentScore: 0` weg.
  - `opponentScored()` Funktion komplett gelöscht (Z.190-215).
  - Kommentar `/* ── Opponent scored (versus mode) ── */` weg.

- `src/lib/game-logic/supremacy/engine.ts` — siehe **Engine-Refactor: supremacy** unten. Hauptpunkt: `opponentHand`, `opponentHandSize`, `opponentScore`, `opponentCard` → `ai*` umbenannt; `isMyTurn` → `isPlayerTurn`. `revealCards(state, opponentCard, ...)` wird zu interner Logik, die direkt aus `state.aiHand[currentRound]` zieht.

- `src/lib/game-logic/borderline/engine.ts`
  - Keine Änderung. Bereits sauber.

- `src/components/games/blitz/blitz-board.tsx`
  - `state.opponentScore`-Referenzen weg (sind alle in dead branches nach Commit 1, jetzt physisch raus).

- `src/components/games/supremacy/supremacy-board.tsx`
  - Alle `state.opponent*` → `state.ai*`.
  - Reducer-Action `REVEAL` Signatur ändert sich: kein `opponentCard`-Argument mehr, da der Reducer den AI-Card direkt aus `state.aiHand` lesen kann.
  - `aiPickStat`-Aufruf bleibt. AI-Timer-useEffect bleibt.

- `src/components/games/borderline/borderline-board.tsx`
  - `opponentSteps`-State weg. `opponentFinished`-State weg. Subtitle-Ternary vereinfacht.

**Was bleibt unverändert:** Type `mode` in `game-runs.ts` (Commit 4). DB-Schema (Commit 4). Daily-Pfade.

**Test:** `npm run build` grün. `npx tsc --noEmit` grün. Manuell jede der drei Spielseiten durchspielen — vor allem supremacy, weil dort der State-Shape mechanisch tiefgreifend wurde.

**Reihenfolge-Begründung:** Engine-Refactor ist invasiver als UI-Bereinigung. Wenn die Engine umbenannt wird, bricht TypeScript an drei Boards (gewollt — Compiler zeigt jede Stelle). Erst nachdem die Versus-UI komplett weg ist (Commit 1+2), gibt es keine `isVersus`-Branches mehr, die mit `state.opponentScore` arbeiten und zu Verwirrung führen.

---

### Commit 4 — Type + DB migration: kill 'versus' for good

**Was:** Type-Union einkürzen + DB-Schema und CHECK-Constraint nachziehen + die drei Tot-Tabellen droppen.

**Files (code):**
- `src/app/actions/game-runs.ts:11`
  - `mode: "daily" | "practice" | "versus"` → `mode: "daily" | "practice"`.
- `src/app/actions/game-runs.ts:474`
  - Kommentar `// Multiplayer games (blitz, borderline, supremacy) — not yet validated` weg, weil die Lücke per Definition geschlossen ist (kein versus-Submit mehr möglich) — bzw. der Default-Branch bleibt für blitz/borderline/supremacy Practice-Submits, die nicht validiert sind. **Wichtig:** Das ist Linas Sicherheitsbefund H2. Ich schließe die Lücke in diesem Commit nicht — das ist Phase E. Ich tausche nur den Kommentar zu etwas Ehrlicherem aus: `// blitz, borderline, supremacy — practice-only, validation deferred`.

**Files (potentiell):**
- `src/types/server.ts` — falls dort `mode` als String-Union dupliziert ist. (Lina hat das nicht explizit verifiziert; ich prüfe im Commit selbst und passe an.)
- `src/app/games/{blitz,borderline,supremacy}/play/page.tsx` — der parametrisierte `mode`-Parse vereinfacht sich. Hier optional auch `"use client"` raus (siehe Synthese-Drift-Punkt) — **separate Commit-Diskussion**: ich nehme das **nicht** in Commit 4 mit, weil es eine eigene Refaktor-Linie ist (page-vereinheitlichung). Stattdessen Note für Phase G oder ein Folge-Commit.

**DB-Migration:** siehe **DB-Migration** unten. Wird mit `mcp__supabase__apply_migration` ausgeführt.

**Test:** `npm run build` grün. `npx tsc --noEmit` grün. `SELECT mode, COUNT(*) FROM game_runs GROUP BY mode` — nur `daily` und `practice`. `\dt public.game_rooms` (oder Äquivalent) — Tabelle existiert nicht mehr. CHECK-Constraint per `SELECT cc.check_clause ...` — nur noch `daily|practice`.

**Reihenfolge-Begründung:** DB ist die einzige nicht-revertierbare Stelle. Sie kommt **zuletzt**. Wenn nach Commit 1-3 etwas in der UI nicht funktioniert, kann ich revert pushen ohne Daten-Verlust. Nach Commit 4 ist es echt weg. Auch wichtig: Die Type-Reduktion `"daily" | "practice"` darf erst gemacht werden, **nachdem** die Boards den Versus-Mode nicht mehr referenzieren, sonst hagelt es 30 Compile-Errors auf einmal.

---

## DB-Migration

Vollständiges SQL. Vor dem Apply: **kein** offener Connection-Pool-User, **keine** Edge-Functions, die diese Tabellen lesen (im Repo nicht, aber Supabase-extern via Dashboard-Custom-SQL möglich — Vorprüfung via `pg_stat_activity` empfohlen).

```sql
-- ─── Multiplayer-Removal Migration ─────────────────────────────────────
-- Anders Heigh, May 2026
-- 
-- Voraussetzungen (verifiziert):
--   - game_runs hat 0 Zeilen mit mode='versus' (verifiziert 2026-05-26)
--   - FK-Constraints: game_results.session_id → sessions.id
--                     game_results.room_id → game_rooms.id
--     → game_results MUSS zuerst gedroppt werden
--   - CHECK-Constraint auf game_runs.mode enthält 'versus' und muss neu definiert werden

BEGIN;

-- 1. CHECK-Constraint auf game_runs.mode neu definieren
--    (Sicherer als ALTER COLUMN, weil sonst alte Default-Rows einen Constraint-Verletzungs-Check kriegen können.)
ALTER TABLE public.game_runs
  DROP CONSTRAINT IF EXISTS game_runs_mode_check;

ALTER TABLE public.game_runs
  ADD CONSTRAINT game_runs_mode_check
  CHECK (mode = ANY (ARRAY['daily'::text, 'practice'::text]));

-- 2. Tot-Tabellen droppen, in der richtigen FK-Reihenfolge:
--    game_results referenziert sessions und game_rooms.
DROP TABLE IF EXISTS public.game_results CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.game_rooms CASCADE;

-- 3. Verifikation innerhalb der Transaktion (rollback-fähig)
DO $$
DECLARE
  versus_count INTEGER;
  table_exists BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO versus_count FROM public.game_runs WHERE mode = 'versus';
  IF versus_count > 0 THEN
    RAISE EXCEPTION 'unexpected versus rows after constraint update: %', versus_count;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN ('game_rooms', 'game_results', 'sessions')
  ) INTO table_exists;
  IF table_exists THEN
    RAISE EXCEPTION 'one of game_rooms/game_results/sessions still exists';
  END IF;
END $$;

COMMIT;
```

**Vorprüfung (vor dem BEGIN, manuell):**

```sql
-- Wer hat aktive Connections gegen die zu-droppenden Tabellen?
SELECT pid, usename, application_name, state, query
FROM pg_stat_activity
WHERE state != 'idle'
  AND query ILIKE ANY (ARRAY['%game_rooms%', '%game_results%', '%sessions%'])
  AND pid != pg_backend_pid();
-- Erwartung: keine Zeilen. Wenn doch: warten oder Connection terminieren.

-- Backup: erst exportieren, dann droppen
COPY public.game_rooms TO '/tmp/game_rooms_predrop_20260526.csv' CSV HEADER;
COPY public.game_results TO '/tmp/game_results_predrop_20260526.csv' CSV HEADER;
COPY public.sessions TO '/tmp/sessions_predrop_20260526.csv' CSV HEADER;
-- (Auf Supabase-Managed evtl. via Dashboard-Export statt COPY. Egal — Hauptsache es gibt ein Snapshot.)
```

**Was passiert mit `game_runs.mode='versus'`-Zeilen:** Es gibt keine (verifiziert: 0 Zeilen). Wenn welche existieren würden, wäre meine Empfehlung **Backfill auf 'practice'** statt DELETE, weil:
- Die User haben gespielt. Die Stats gehören ihnen.
- Practice ist semantisch näher an Versus (keine Daily-Wertung) als an Daily.
- Bei DELETE würden Stats-Aggregate (`user_game_stats`) per Trigger neu berechnet — unnötiger Aufwand.

Backfill-SQL für den hypothetischen Fall:

```sql
-- (NICHT ausführen — heute 0 Zeilen, daher unnötig. Nur als Referenz für die Zukunft.)
UPDATE public.game_runs SET mode = 'practice' WHERE mode = 'versus';
```

---

## Type-Migration

Konkrete Edit-Liste für `"daily" | "practice" | "versus"` → `"daily" | "practice"`:

| File | Zeile | Vorher | Nachher |
|---|---|---|---|
| `src/app/actions/game-runs.ts` | 11 | `mode: "daily" \| "practice" \| "versus";` | `mode: "daily" \| "practice";` |
| `src/components/games/blitz/blitz-board.tsx` | 30 | `mode: "practice" \| "versus";` | `mode: "practice";` |
| `src/components/games/blitz/blitz-board.tsx` | 41 | `\| { type: "RESET"; mode: "practice" \| "daily" };` | unverändert (RESET-Mode ist eigener Type) |
| `src/components/games/blitz/blitz-board.tsx` | 87 | `const isVersus = mode === "versus";` | entfernt (Commit 1) |
| `src/components/games/borderline/borderline-board.tsx` | 27 | `mode: "practice" \| "versus";` | `mode: "practice";` |
| `src/components/games/borderline/borderline-board.tsx` | 91 | `const isVersus = mode === "versus";` | entfernt (Commit 1) |
| `src/components/games/supremacy/supremacy-board.tsx` | 23 | `mode: "practice" \| "versus";` | `mode: "practice";` |
| `src/components/games/supremacy/supremacy-board.tsx` | 34 | `\| { type: "RESET"; mode: "practice" \| "daily" };` | unverändert |
| `src/components/games/supremacy/supremacy-board.tsx` | 77 | `const isVersus = mode === "versus";` | entfernt (Commit 1) |
| `src/app/games/blitz/play/page.tsx` | 11-12 | `const mode = rawMode === "versus" ? "versus" : "practice"; const roomCode = ...` | `const mode = "practice"; // (kein roomCode mehr)` |
| `src/app/games/borderline/play/page.tsx` | 11-12 | analog | analog |
| `src/app/games/supremacy/play/page.tsx` | 11-12 | analog | analog |
| `src/app/games/{game}/play/page.tsx` | 18-20 | `mode={mode === "versus" ? "versus" : "practice"}` + Prop `roomCode={roomCode}` | `mode="practice"` (kein roomCode) |
| `src/types/server.ts` | tbd | `mode: string` (vermutlich allgemein) | unverändert — DB-Type, keine String-Union |

**Zusätzlich, indirekt:**
- `Action`-Type in `blitz-board.tsx:37-41` — die Action `OPPONENT_SCORED` verschwindet (Commit 3). Damit verschwindet der Versus-Pfad im Reducer.
- `Action`-Type in `supremacy-board.tsx:30-34` — die Action `REVEAL` ändert ihre Signatur (kein `opponentCard`-Argument mehr — wird intern aus `state.aiHand` gezogen). Siehe nächster Abschnitt.

**Was ich NICHT ändere:** Die Mode-Prop in `GameShell`-Wrappers. Die ist bereits ein generischer String-Union (`"daily" | "practice" | "versus"`), aber sie wird nirgendwo gegen `"versus"` getestet außer in den drei play-pages. Sobald die play-pages `"versus"` nicht mehr produzieren, ist die Eingabe automatisch `"daily" | "practice"`. Wenn die `GameShell`-Definition selbst die `"versus"`-String hat, ziehe ich sie nach (Commit 4).

---

## Engine-Refactor: supremacy

Das ist der schwierige Teil. Heute ist supremacy als Zwei-Spieler-Turn-Alternation modelliert. Wir wollen einen sauberen Practice-vs-AI-Modus.

### Vorher

```ts
export interface SupremacyRound {
  myCard: SupremacyCard;
  opponentCard: SupremacyCard | null;     // null until revealed
  chosenStat: string | null;
  winner: "me" | "opponent" | "draw" | null;
}

export interface SupremacyState {
  phase: "waiting" | "picking" | "reveal" | "results";
  hand: SupremacyCard[];                  // player's hand
  opponentHand: SupremacyCard[];          // used in practice; empty in versus
  opponentHandSize: number;
  categories: Category[];
  currentRound: number;
  rounds: SupremacyRound[];
  myScore: number;
  opponentScore: number;
  isMyTurn: boolean;
}

export function createSupremacy(rng: () => number, isPlayer1: boolean): SupremacyState
export function pickStat(state: SupremacyState, categorySlug: string): SupremacyState
export function revealCards(state: SupremacyState, opponentCard: SupremacyCard, chosenStat: string): SupremacyState
export function advanceRound(state: SupremacyState): SupremacyState
export function aiPickStat(aiCard: SupremacyCard, gameCats: Category[]): string
```

### Nachher

```ts
export interface SupremacyRound {
  playerCard: SupremacyCard;
  aiCard: SupremacyCard;                  // revealed via state.phase, not via null
  chosenStat: string | null;
  winner: "player" | "ai" | "draw" | null;
}

export interface SupremacyState {
  phase: "picking" | "reveal" | "results";  // 'waiting' weg — siehe unten
  playerHand: SupremacyCard[];
  aiHand: SupremacyCard[];
  categories: Category[];
  currentRound: number;
  rounds: SupremacyRound[];
  playerScore: number;
  aiScore: number;
  isPlayerTurn: boolean;                  // wer pickt diese Runde
}

export function createSupremacy(rng: () => number): SupremacyState
export function pickStat(state: SupremacyState, categorySlug: string): SupremacyState
export function reveal(state: SupremacyState): SupremacyState
export function advanceRound(state: SupremacyState): SupremacyState
export function aiPickStat(aiCard: SupremacyCard, gameCats: Category[]): string
```

### Wichtige Änderungen

1. **`isPlayer1`-Parameter weg.** Im Practice-Modus gibt es immer einen Spieler und eine AI. Wer "Spieler 1" ist, war eine Versus-Eigenheit (Karten gleichmäßig auf zwei Hände splitten). Practice-vs-AI splittet weiterhin 10 Karten auf 5+5, aber **Spieler bekommt immer die erste Hälfte**. Deterministisch.

2. **`opponentCard: SupremacyCard | null` → `aiCard: SupremacyCard`.** Heute ist `opponentCard` als `null` Marker für "noch nicht aufgedeckt". Stattdessen: die Karte ist immer in `state.aiHand[currentRound]` verfügbar. Ob sie **aufgedeckt** ist oder nicht, ergibt sich aus `state.phase === "reveal" | "results"` und/oder dem `round.winner` (gesetzt nach `reveal()`).

3. **`phase: "waiting"` weg.** "Waiting" hatte zwei Bedeutungen: (a) AI denkt nach (Practice), (b) Opponent pickt (Versus). Beide gehen weg:
   - In Versus: existiert nicht mehr.
   - In Practice: der "AI denkt"-Effekt wird nur noch durch ein `setTimeout` im Board getriggert, nicht durch einen State-Phase. Reducer geht direkt von `picking` zu `reveal`.

4. **`reveal()`-Signatur vereinfacht.** Heute: `reveal(state, opponentCard, chosenStat)`. Neu: `reveal(state)`. Die Funktion liest `chosenStat` aus `state.rounds[state.currentRound].chosenStat` (gesetzt durch `pickStat`) und `aiCard` aus `state.aiHand[state.currentRound]`. Kein externer Input mehr.

5. **`opponentHandSize` weg.** Redundant — `state.aiHand.length - state.currentRound`.

6. **Winner-Enum `me|opponent|draw` → `player|ai|draw`.** Konsistente Sprache durch den Code.

### Board-Anpassungen

```ts
// Vorher:
const oppCard = state.opponentHand[state.currentRound];
aiTimerRef.current = setTimeout(() => {
  const chosenStat = aiPickStat(oppCard, state.categories);
  dispatch({ type: "PICK_STAT", slug: chosenStat });
}, 800);

// Nachher:
const aiCard = state.aiHand[state.currentRound];
aiTimerRef.current = setTimeout(() => {
  const chosenStat = aiPickStat(aiCard, state.categories);
  dispatch({ type: "PICK_STAT", slug: chosenStat });
  dispatch({ type: "REVEAL" });
}, 800);
```

Reducer-Action `REVEAL` wird argumentlos:

```ts
type Action =
  | { type: "PICK_STAT"; slug: string }
  | { type: "REVEAL" }
  | { type: "ADVANCE" }
  | { type: "RESET"; mode: "practice" | "daily" };
```

Der `lastMessage`-useEffect (Z.133-148) verschwindet komplett (Commit 1, dann hier final).

### Was nicht funktioniert, wenn man es naiv macht

- Der `phase: "waiting"`-Branch hatte einen UI-Effekt: ein "AI is thinking..."-Hinweis. Den brauchen wir weiterhin — also bleibt die UI-Bedingung, aber sie liest jetzt: `state.phase === "picking" && !state.isPlayerTurn` (AI's pick). Das funktioniert, weil der Reducer in der AI-Runde von `picking → reveal` wechselt; der Timer im Board sorgt für die 800ms Pause.

- Daily-Mode: heute funktioniert das nur, weil `createSupremacy(rng, true)` deterministisch ist. Nach Refactor: `createSupremacy(rng)` ohne `isPlayer1`-Parameter, deterministisch. Daily-Pfad unverändert.

---

## Engine-Refactor: blitz + borderline

### Blitz

**Files:** `src/lib/game-logic/blitz/engine.ts`, `src/components/games/blitz/blitz-board.tsx`.

**Engine:**
- `BlitzState.opponentScore: number` — entfernen.
- `createBlitz()`: `opponentScore: 0` im Return weg.
- `opponentScored(state: BlitzState): BlitzState` — Funktion komplett löschen (Z.188-215).
- Kommentar `/* ── Opponent scored (versus mode) ── */` weg.

**Board:**
- Import `opponentScored` weg.
- Action `OPPONENT_SCORED` weg, Reducer-Case weg.
- `state.opponentScore`-Referenzen im Results-Screen weg (heute in `if (isVersus) { ... }` — wird komplett gestrichen).
- `useMultiplayer`-Hook-Call und Import weg.

Resultat: `BlitzState` schrumpft um 1 Feld, Reducer schrumpft um 1 Action, Engine schrumpft um 1 Funktion. Sauber.

### Borderline

**Files:** `src/lib/game-logic/borderline/engine.ts` (keine Änderung), `src/components/games/borderline/borderline-board.tsx`.

**Engine:** Nichts. Heute null Versus-Kopplung in der Engine — der Versus-State lebt rein im Board als lokaler `useState`.

**Board:**
- `opponentSteps` + `opponentFinished` lokale State weg.
- `useMultiplayer`-Hook-Call und Import weg.
- `useEffect` für `lastMessage` (Z.139-149) weg.
- `submitMove`-Callback: der `if (!result.error && isVersus) { send(...) }`-Block weg.
- Results-Screen-Subtitle: nur Solo-Pfad bleibt (`"Optimal path: X steps"`).
- "Waiting for opponent"-Render weg.
- "Opponent: X steps"-Anzeige im stats-row weg.

---

## Routing & alte Links

### `/vs/[code]`-Verzeichnis löschen

Wenn jemand einen alten Friend-Invite-Link öffnet (`countrivo.com/vs/AB7K`), kriegt er heute ein Next.js-404. Drei Optionen:

| Option | UX | SEO | Aufwand |
|---|---|---|---|
| **A. 404 (nichts tun)** | "Page not found" — verwirrend, weil der Link "funktionierte" mal | Keine | 0 |
| **B. Redirect auf `/games`** | User landet auf der Spielübersicht; verliert den Versus-Kontext, kriegt aber etwas Sinnvolles | Permanent-Redirect (301) — gut für Google | 5 Min: `next.config.ts` |
| **C. Stub-Page mit Hinweis** | "Multiplayer was removed. Here's what you can play instead." + Buttons zu blitz/borderline/supremacy + Friend-Challenges-CTA | Keine, aber besser für Conversion | 30 Min |

**Empfehlung: B (Redirect auf `/games`).** Begründung:

- **Aufwand:** minimal. Eine Zeile in `next.config.ts`:
  ```ts
  async redirects() {
    return [{ source: "/vs/:code", destination: "/games", permanent: true }];
  }
  ```
- **UX:** Wer mal einen Versus-Link bekommen hat (vor Wochen, im Discord), klickt und sieht direkt die Spielauswahl. Frustrationsfrei. Wenn er enttäuscht ist, dass kein Multiplayer mehr existiert, soll er das durch die Stille der `/games`-Seite spüren — kein Hinweistext, der erklärt, was weg ist. (Erklärungen-für-weg-genommene-Features lesen User selten und kosten Pflege.)
- **SEO:** 301 ist der saubere Weg, dass Google die alten `/vs/XXXX`-URLs aus dem Index nimmt und auf `/games` konsolidiert. Die `/vs/`-URLs waren ohnehin Roomcode-spezifisch, also nie indexiert (kein `sitemap.xml`-Eintrag, ephemere Räume mit 30-Min-TTL). Realistisch verlieren wir hier **keine** Suchpräsenz.
- **Bookmark-Verluste:** Ein User, der einen `/vs/`-Bookmark hat — also wirklich einen einzelnen Raum bookmarken wollte — ist eine Randerscheinung. Selbst wenn so jemand existiert, ist die richtige Antwort: "Multiplayer-Räume waren immer 30-Min-ephemer. Das war nie ein Bookmark-Ziel." Der Redirect bringt ihn zur Spielauswahl, mehr ist nicht nötig.

Option C wäre richtig, **wenn** wir Multiplayer prominent beworben hätten (Press-Release, Social-Posts). Haben wir nicht — die App ist 10-Profile-frisch. Daher reicht der Redirect.

---

## Risiko-Liste

Top 5 nach Wahrscheinlichkeit × Impact (sortiert nach Schweregrad).

### R1. CHECK-Constraint-Drift nach DB-Migration vor App-Deploy

**Wahrscheinlichkeit:** Mittel · **Impact:** Hoch · **Score:** Hoch

**Szenario:** DB-Migration läuft (Commit 4 Apply), aber der App-Code wird erst Minuten später deployed. In dem Fenster könnte ein noch-laufender Client einen Run mit `mode: "versus"` submitten → DB lehnt mit Constraint-Verletzung ab → User sieht Crash beim Game-Submit.

**Mitigation:** Reihenfolge im Deploy:
1. Code-Deploy zuerst (Commit 1-4-Code-Teile, nur App, ohne DB-Migration).
2. Beobachtungs-Phase 5 Min — Logs prüfen, ob noch jemand Versus-Routes aufruft.
3. Erst dann DB-Migration applyen.

Realistisch heute: nur 10 Profile, niemand spielt Versus, weil keine UI-Buttons mehr existieren (nach Code-Deploy). Risiko praktisch null. Aber die Reihenfolge gehört dokumentiert.

### R2. Friend-Challenges brechen wegen falscher Engine-Annahmen

**Wahrscheinlichkeit:** Niedrig · **Impact:** Mittel · **Score:** Mittel

**Szenario:** Supremacy-Engine umgebaut, `winner: "me" | "opponent"` → `"player" | "ai"`. Wenn irgendwo in `friend_challenges` oder Result-Reading der String `"me"` oder `"opponent"` als String-Match verglichen wird, bricht das stillschweigend.

**Mitigation:**
- Vor Commit 3: `grep -rn "winner === \"me\"\|winner === \"opponent\"\|\"opponent\"" src/` — alle Stellen identifizieren.
- Nach Commit 3: gleicher Grep. Sollte 0 Hits liefern.
- Friend-Challenges speichern `score_raw` und `score_sort_value`, nicht `winner`-Strings (per Audit von Lina). **Wahrscheinlichkeit deshalb niedrig.**

### R3. Build-grün-aber-tot-Code-Pfade

**Wahrscheinlichkeit:** Mittel · **Impact:** Niedrig · **Score:** Niedrig–Mittel

**Szenario:** Nach Commit 1 löscht man UI-Branches. TypeScript ist zufrieden. Aber irgendwo gibt es einen ungetesteten Code-Pfad (z.B. ein nicht-benutzter `useMemo`-Branch), der jetzt impliziert `state.opponentScore` lesen will. Build grün, aber Runtime-Crash.

**Mitigation:**
- Nach jedem Commit `npm run dev` lokal, jede der drei Spielseiten manuell durchspielen. Practice + Daily-Pfad jeweils.
- Vor Deploy: alle drei Spielseiten im Inkognito-Mode auf Vercel-Preview testen.

### R4. DB-Migration läuft, Rollback unmöglich

**Wahrscheinlichkeit:** Niedrig · **Impact:** Hoch · **Score:** Mittel

**Szenario:** `DROP TABLE game_rooms` läuft, danach merkt jemand dass irgendein externer Edge-Function-Job die Tabelle lesen wollte. Tabelle ist weg, kein Restore.

**Mitigation:**
- Vor dem DROP: CSV-Export aller drei Tabellen nach `/tmp/`. Auch wenn die Daten irrelevant sind — der Akt des Sicherns zwingt einen, vorher zu prüfen.
- `pg_stat_activity`-Check (siehe DB-Migration-Sektion) — keine aktiven Konsumenten.
- BEGIN ... COMMIT mit DO-Block-Verifikation (in der Migration enthalten). Wenn etwas nicht stimmt, ROLLBACK.

### R5. `/vs/[code]`-Redirect fängt falsche Routes

**Wahrscheinlichkeit:** Sehr niedrig · **Impact:** Niedrig · **Score:** Niedrig

**Szenario:** Redirect-Pattern `/vs/:code` ist zu breit oder zu schmal. Z.B. fängt es `/vs/` ohne Code nicht ab, oder fängt `/vs/anything/sub` doch ab und sendet sub-Routen woanders hin.

**Mitigation:** Pattern explizit testen:
- `/vs/AB7K` → `/games` ✓
- `/vs/` → 404 (kein Pattern-Match) — akzeptabel
- `/vs/anything/sub` → 404 — akzeptabel (die Route existiert ohnehin nicht)

Trivial. Test via `curl -I` gegen Vercel-Preview.

---

## Friend-Challenges

**Verdict: Behalten.** Bestätige Lina.

Friend-Challenges sind asynchron (`friend_challenges`-Tabelle, kein Realtime-Channel, kein Presence, kein Room-Lifecycle). Sie nutzen die existierenden `game_runs` als Score-Quelle und vergleichen Sortwerte zwischen `challenger_id` und `challenged_id`. **Architektonisch entkoppelt** von der Multiplayer-Realtime-Schicht, die wir gerade entfernen.

Funktional ist Friend-Challenge das überlegene Sozialkonstrukt für ein Daily-Geography-Spiel:

- **Kein Realtime-Lock-In:** Der User spielt, wann er Zeit hat, nicht "wenn der andere online ist". Bei einer Casual-Daily-App ist das die richtige UX.
- **Kein Race-Condition-Stress:** Friend-Challenge-Scores werden in `game_runs` geschrieben — eine Tabelle mit klaren CHECK-Constraints, RLS und `score_sort_value`-Override. Keine "zwei Clients editieren denselben Raumstatus"-Falle.
- **Vermeidet das, was Versus eigentlich wollte:** Sozialer Druck und Head-to-Head-Vergleich. Friend-Challenges liefern das **ohne** Synchronizität.
- **Kein Multiplayer-Code mehr zu pflegen:** Die `friend_challenges`-Tabelle ist 5-Feld-flach, kein Polling, kein Broadcast. Wartungsaufwand minimal.

Behalten. Wenn in einer späteren Phase entschieden wird, Friend-Challenges auch zu droppen, ist das ein eigener Refactor — nicht Teil dieser Removal.

---

## Aufwand

Realistisch für einen Senior, der den Code **zum ersten Mal anfasst** (also Lesezeit eingerechnet).

| Phase | Inhalt | Stunden |
|---|---|---|
| Lesen | Codebase-Tour, Lina's Map verifizieren, DB inspizieren | **2** |
| Commit 1 | UI-Stripping in 3 Boards + 3 play-pages + 3 landing-pages | **3** |
| Commit 2 | Files löschen + Registry edit | **0.5** |
| Commit 3 | Engine-Refactor (supremacy ist der zähe Teil) + Board-Anpassungen | **4** |
| Commit 4 | Type-Migration + DB-Migration applyen + Verifikation | **1.5** |
| QA | Lokales Testing aller 3 Spiele × {practice, daily} = 6 Durchspiele | **1.5** |
| Deploy + Monitoring | Vercel-Deploy, 30 Min Logs beobachten | **0.5** |
| **Summe** | | **13** |

Plus Puffer für Unerwartetes: **+3 Stunden** = **~16 Stunden = 2 Arbeitstage**.

Wenn man den Code schon kennt (z.B. der ursprüngliche Autor): **8-10 Stunden.** Plus Puffer: 12.

Anmerkung: Die ursprüngliche Multiplayer-Implementierung hat laut Commit-Historie und Code-Volumen (rund 700 Zeilen über alle Schichten) wahrscheinlich 30-50 Engineering-Stunden gekostet. Wir entfernen sie in einem Drittel der Zeit. Das ist der typische Asymmetrie-Faktor zwischen Bauen und Löschen.

---

## Schluss

Was Mona gewusst hätte: dass die Versuchung, ein Edge-Case-Stable-System nachzubauen, immer da ist. Dass jemand vorschlägt, "wir machen es mit WebSocket-Reconnect-Logik und Optimistic-Locking und einem Last-Write-Wins-Resolver". Dass die Zeit, die das kostet, dieselbe Zeit ist, die wir brauchen, um zehn neue Spiele zu bauen. Dass User für Geographie-Quiz keinen Lobby-Screen wollen.

Sie hat in 2009 gesagt: "If two people want to play, ask one of them to wait." Wir machen das jetzt — heißt nur "Friend-Challenge" und nicht "ich warte im Lobby".

Acht Files weniger. Drei Tabellen weg. Ein State-Type um vier Felder leichter. Ein Type-Union halbiert. Ein Sicherheits-Kommentar aus `game-runs.ts:474` verschwindet — nicht weil wir die Validierungslücke geschlossen haben, sondern weil sie nicht mehr existieren kann. Das ist die seltene Form der Sicherheits-Arbeit, bei der die Wahrheit nicht "wir haben es gefixt" sondern "wir haben den Code entfernt, der gefixt werden müsste" ist.

Plan steht. Build kann grün durchlaufen, DB kann sauber droppen. Wer es ausführt: zuerst lesen, dann verifizieren, dann die Commits in der Reihenfolge.

Ich gehe schlafen. Mona hätte das alles in einem Memo geschrieben, das halb so lang war. Bei mir ist das die einzige Schwäche, die geblieben ist.

— A.H.
