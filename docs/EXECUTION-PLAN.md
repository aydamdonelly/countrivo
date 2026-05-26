# Countrivo · Execution Plan (verbleibende Arbeit)

> **Stand:** 26. Mai 2026
> **Coverage gegen FINAL-BRIEF:** ~60% (Steps 0-5 done, Steps 6-10 offen + Brand-Klammer + Deferred-Liste)
> **Aufwand verbleibend:** ~40-55 Stunden Engineering + laufende Editorial-Pflege für Cluster
> **Reihenfolge:** Pragmatisch — Quick-Wins zuerst, Cluster als größtes verbleibendes Stück, Anti-Cheat vor Public Launch, Hygiene zuletzt.

Dieser Plan ist die direkte Fortsetzung des `FINAL-BRIEF.md`. Er übersetzt jeden offenen Punkt in konkrete Files, SQL, Commit-Messages und Verifikations-Schritte. Wer das hier liest, kann ohne Rückfragen ausführen.

---

## Inhalt

0. [Pre-Flight — vor dem nächsten Deploy](#0--pre-flight--vor-dem-nächsten-deploy)
1. [Phase 1 — countryle → trace Rename](#1--phase-1--countryle--trace-rename)
2. [Phase 2 — Brand-Klammer: der mittlere Punkt](#2--phase-2--brand-klammer-der-mittlere-punkt-u00b7)
3. [Phase 3 — Cluster-Engine (neues Spiel)](#3--phase-3--cluster-engine-neues-spiel)
4. [Phase 4 — Share-Grids + Streak-Halbwertszeit](#4--phase-4--share-grids--streak-halbwertszeit)
5. [Phase 5 — Friend-Challenge-Notifications](#5--phase-5--friend-challenge-notifications)
6. [Phase 6 — Server-Side Re-Compute (Anti-Cheat)](#6--phase-6--server-side-re-compute-anti-cheat)
7. [Phase 7 — Repo-Hygiene + country-draft RNG-Fix](#7--phase-7--repo-hygiene--country-draft-rng-fix)
8. [Phase 8 — Deferred (parallel oder ad-hoc)](#8--phase-8--deferred-parallel-oder-ad-hoc)
9. [Launch-Checklist](#9--launch-checklist)
10. [Aufwand gesamt](#10--aufwand-gesamt)

---

## 0 · Pre-Flight — vor dem nächsten Deploy

Diese 5 Punkte MÜSSEN passieren bevor du das nächste Mal `vercel --prod --yes` fährst, sonst sperrst du existierende User aus oder gehst mit halb-fertigem UI live.

### P1. OAuth-User Bulk-Reset (CRITICAL — sonst gehen 6 User-Accounts kaputt)

**Warum:** Step 2 hat Magic-Link + Google/Apple OAuth aus dem UI entfernt. 6 bestehende User haben sich nur via Google angemeldet — sie haben kein Passwort. Nach Deploy können sie sich nicht mehr einloggen.

**Wie (3 Optionen, eine wählen):**

**Option A — Bulk Reset-Mail an alle OAuth-User (empfohlen):**
1. Supabase Dashboard → Authentication → Users
2. Filter `created_at > 2026-04-01` (oder alle anzeigen)
3. Identifiziere User mit `provider: "google"` (sichtbar in der Liste oder via SQL):
   ```sql
   SELECT id, email, raw_app_meta_data->>'provider' AS provider
   FROM auth.users
   WHERE raw_app_meta_data->>'provider' IN ('google', 'apple');
   ```
4. Für jeden: rechts "Send password reset email" klicken — schickt eine Mail an den User mit Link auf `/auth/reset-password`.
5. Optional: separate Erklär-Mail vorher schicken ("Wir haben Login vereinfacht — bitte setze ein Passwort").

**Option B — Code-Banner für unmigrate User:**
- In `AuthProvider`: prüfe ob `user.app_metadata.provider === 'google' && !user.user_metadata.password_set`
- Zeige Banner auf jeder Seite: "You signed up with Google. Set a password to keep your account secure → [Set Password]"
- Link führt zu `/auth/reset-password?force=true` (forciert die Eingabe ohne vorherigen Reset)
- Aufwand: ~1h. Nachteil: Code-Last, läuft potentiell für immer.

**Option C — akzeptieren dass 6 User raus sind:**
- Bei Sign-In: "Account not found? Maybe you signed up with Google. Click Forgot Password to recover."
- Aufwand: 30 min Hinweistext im Modal.
- Empfehlung: NUR wenn die 6 User nicht aktiv sind (check `last_sign_in_at`).

**Empfehlung: Option A.** Konvertiert sauber, dauert ~10 min, kein technischer Restaufwand.

### P2. Supabase Dashboard Settings

Manuell im Dashboard zu setzen (nicht via Code):

| Setting | Wert | Wo |
|---|---|---|
| Email confirm | ON (bereits) | Auth → Email Auth |
| Min password length | 8 | Auth → Policies |
| HaveIBeenPwned check | ON | Auth → Policies (Pro-Tier-Feature, check ob verfügbar) |
| Recovery token TTL | 24h (heute 1h) | Auth → Email Templates |
| Password reset email template | redirectTo: `/auth/reset-password` | Auth → Email Templates |
| Sign-up email template | redirectTo: `/auth/callback?type=signup` | Auth → Email Templates |

### P3. Browser-Smoke der Wave 1-3 Änderungen

Lokal mit `npm run dev`, durchklicken in dieser Reihenfolge:

1. **Multiplayer ist weg:**
   - `/games/blitz` — keine "Challenge friend" Buttons mehr
   - `/games/blitz/play` — Practice spielen, kein "Waiting for opponent"
   - `/vs/ABC` — sollte 301-redirecten zu `/games`
   - `/games/supremacy/play` — AI-Mode, kein Versus-Toggle

2. **Auth funktioniert:**
   - Sign up mit Test-Email → Verification-Mail kommt → klick → eingeloggt
   - Sign out → Sign in mit Email+Password
   - Forgot password → Reset-Mail → klick → neues Passwort setzen
   - Existing User testen (mit altem Account)

3. **Hauptmenü reduziert:**
   - `/` (Home) — nur 3 Main-Games prominent + Drills-Strip
   - `/games` — Daily-Tab default, Drills-Tab via `?show=drills`
   - 11 ehemalige Hauptspiele über Drills-Sektion erreichbar

4. **Atlas Album:**
   - `/album` — eingeloggt sehen
   - Sticker-Grid rendert (243 Cells, deine eigenen Sticker farbig)
   - Tooltip beim Hover zeigt Land + First-Stamp-Date
   - Spiele ein countryle Daily → nach Submit ist neues Sticker im Atlas
   - Spiele country-draft Daily → 8 Sticker dazu
   - Spiele stat-guesser Daily → 1 Sticker dazu

5. **Token-Refactor / Visual:**
   - HeroGlobe auf Home (3 dots statt 10, neue alpha-strokes)
   - Game-Over-Screen Buttons (jetzt `<Button>`)
   - `.label-caps` auf "DAILY", "RECENTLY STAMPED", "YOUR PICK"
   - Stat-Anzeigen mit tnum (gleichbreite Ziffern)

6. **Auth-Modal:**
   - Tab "Sign In" / "Sign Up"
   - Show-Password-Toggle funktioniert
   - Caps-Lock-Warning bei Password-Focus
   - Mobile: Bottom-Sheet (im DevTools mobile-mode testen)
   - Loading-State während Submit
   - Error-Messages spezifisch (invalid_credentials, etc.)

Falls etwas bricht: fixen vor Deploy.

### P4. Stale Stashes droppen

```bash
git stash list
# stash@{0}: On main: WIP multiplayer removal - other workstream
# stash@{1}: On main: WIP blitz multiplayer removal - not my work

# Beide sind Artefakte aus dem Multi-Agent-Chaos, redundant zu commits.
git stash drop stash@{0}
git stash drop stash@{0}  # nach erstem drop wird {1} zu {0}
```

### P5. Deploy

```bash
vercel --prod --yes
```

Beobachte Vercel-Logs für 5 Min. Wenn ein User in dieser Zeit auf `/vs/...` klickt, sieht er den 301-Redirect (gut). Wenn ein 500 erscheint: `vercel rollback` über die UI.

**Nach Deploy:**
- Eigenen Login mit Production-Account testen
- Daily-Spiel komplett durchklicken
- `/album` aufrufen, eigener Sticker-Stand sichtbar

---

## 1 · Phase 1 — countryle → trace Rename

**Goal:** Slug `countryle` durch `trace` ersetzen. Route, Registry, Boards, DB-Daten, Atlas-Extraction. SEO-relevant — `countryle` kollidiert mit drei existierenden Produkten.

**Aufwand:** 3-4h
**Risiko:** Mittel — touches DB + URL-history. Reversibel via Code-Revert, DB-Backfill braucht 2. Migration zum Rückdrehen.

### Pre-Flight

1. Prüfe existing daily_puzzles + game_runs Counts:
   ```sql
   SELECT COUNT(*) FROM game_runs WHERE game_slug = 'countryle';
   SELECT COUNT(*) FROM daily_puzzles WHERE game_slug = 'countryle';
   SELECT COUNT(*) FROM user_game_stats WHERE game_slug = 'countryle';
   ```
2. Backup via Supabase Dashboard Export (oder CSV-COPY).

### Files (Code)

| File | Änderung |
|---|---|
| `src/data/game-registry.json` | countryle-Eintrag: `"slug": "trace"`, `"route": "/games/trace"`, `_todo` entfernen, `title`: "Trace", `description` neu |
| `src/lib/game-logic/countryle/*` | Folder rename: `mv src/lib/game-logic/countryle src/lib/game-logic/trace`. Internal: `engine.ts` Types und Functions bleiben (CountryleState → TraceState wäre optional, kann später) |
| `src/components/games/countryle/*` | Folder rename: `mv src/components/games/countryle src/components/games/trace`. `countryle-board.tsx` → `trace-board.tsx` |
| `src/app/games/countryle/` | Folder rename: `mv src/app/games/countryle src/app/games/trace`. Update imports in page.tsx und play/page.tsx |
| `src/app/actions/game-runs.ts` | Im `score_sort_value`-Switch (Z.81-84): `case "countryle"` → `case "trace"` |
| `src/components/seo/*` | Falls JSON-LD oder Sitemap-Einträge countryle referenzieren: nachziehen |
| `next.config.ts` | Redirect hinzufügen: `{ source: "/games/countryle", destination: "/games/trace", permanent: true }` und `{ source: "/games/countryle/play", destination: "/games/trace/play", permanent: true }` |

### Files (DB Migration)

Apply als `mcp__supabase__apply_migration` named `rename_countryle_to_trace`:

```sql
BEGIN;

-- 1. game_runs backfill
UPDATE public.game_runs
SET game_slug = 'trace'
WHERE game_slug = 'countryle';

-- 2. daily_puzzles backfill
UPDATE public.daily_puzzles
SET game_slug = 'trace'
WHERE game_slug = 'countryle';

-- 3. user_game_stats backfill
UPDATE public.user_game_stats
SET game_slug = 'trace'
WHERE game_slug = 'countryle';

-- 4. atlas_stickers backfill (first_game_slug)
UPDATE public.atlas_stickers
SET first_game_slug = 'trace'
WHERE first_game_slug = 'countryle';

-- 5. extract_countries CASE update
CREATE OR REPLACE FUNCTION public.extract_countries(slug text, result jsonb) RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  out_array text[] := ARRAY[]::text[];
  v text;
BEGIN
  IF result IS NULL THEN RETURN out_array; END IF;

  CASE slug
    WHEN 'trace' THEN  -- renamed from countryle
      IF (result->>'won')::boolean THEN
        v := result->>'target';
        IF v IS NOT NULL THEN out_array := ARRAY[v]; END IF;
      END IF;
    WHEN 'country-draft' THEN
      IF jsonb_typeof(result->'countryIso3s') = 'array' THEN
        SELECT array_agg(DISTINCT upper(elem)) INTO out_array
        FROM jsonb_array_elements_text(result->'countryIso3s') elem;
      END IF;
    WHEN 'stat-guesser' THEN
      v := result->>'targetIso3';
      IF v IS NOT NULL THEN
        out_array := ARRAY[upper(v)];
      ELSIF jsonb_typeof(result->'targetIso3s') = 'array' THEN
        SELECT array_agg(DISTINCT upper(elem)) INTO out_array
        FROM jsonb_array_elements_text(result->'targetIso3s') elem;
      END IF;
    WHEN 'cluster' THEN
      -- placeholder for Phase 3
      IF jsonb_typeof(result->'countryIso3s') = 'array' THEN
        SELECT array_agg(DISTINCT upper(elem)) INTO out_array
        FROM jsonb_array_elements_text(result->'countryIso3s') elem;
      END IF;
    ELSE
      out_array := ARRAY[]::text[];
  END CASE;

  RETURN COALESCE(out_array, ARRAY[]::text[]);
END $$;

COMMIT;
```

### Step-by-Step

1. Backup machen (Supabase Dashboard Export).
2. Code-Renames (folder moves + import updates). Build muss grün sein zwischendurch.
3. Commit 1: `Rename countryle to trace across folders, imports, and config`
4. Apply DB-Migration. Verifiziere counts gleich pre/post.
5. Commit 2 (nur SQL via supabase MCP, kein Repo-Commit): die Migration ist die DB-Spur.
6. Update `docs/decisions.md`: trace-Rename done, kein deferral mehr.
7. Build + push.

### Verification

```bash
npx tsc --noEmit && npm run build
# Browser: /games/trace, /games/trace/play, alte /games/countryle → redirect
# DB: SELECT COUNT(*) FROM game_runs WHERE game_slug = 'countryle';  -- 0
# DB: SELECT COUNT(*) FROM game_runs WHERE game_slug = 'trace';      -- old countryle count
```

### Commit-Messages

- `Rename countryle to trace across folders, imports, and registry`
- (DB migration ist in der Supabase-Migrations-Historie, kein git commit)

### Risiken

- **Externe Backlinks** auf `/games/countryle` — der 301-Redirect deckt das ab. SEO sollte sauber konsolidieren.
- **Bookmark-Verluste** — Redirect handhabt das.
- **CDN-Caching** — Vercel Edge cached aggressiv; nach Deploy 1-2 Min warten oder Cache flush.

---

## 2 · Phase 2 — Brand-Klammer: der mittlere Punkt (U+00B7)

**Goal:** Stanisław Mraz's zentrale Brand-DNA implementieren — der mittlere Punkt `·` (U+00B7) an 8 konsistenten Stellen, eine einzige typografische Geste, zwanzigfach wiederholt.

**Aufwand:** 3-5h
**Risiko:** Niedrig — pure UI/Typography.

### Die 8 Stellen (aus FINAL-BRIEF §3)

| # | Stelle | File | Aktuell | Soll |
|---|---|---|---|---|
| 1 | Wortmark Header | `src/components/layout/header.tsx` | "Countrivo" | `Coun · trivo` mit Punkt in Gold |
| 2 | Streak-Badge | wo immer die Streak angezeigt wird (Header/Profile) | "23 day streak" o.ä. | `23 · day · streak` |
| 3 | Hero-Subline | `src/components/layout/hero-globe.tsx` oder Home-Page | aktueller Subtitel | `Tuesday · May 26 · Resets in 7h 23m` |
| 4 | Game-Landing-Datum | `src/app/games/[slug]/page.tsx` template | wenn Datum angezeigt | `26 · 05 · 26` |
| 5 | OG-Card | `src/app/opengraph-image.tsx` (Next.js dynamic OG) | aktueller Inhalt | Wortmark + Datums-Zeile |
| 6 | Share-Card | `src/components/share/share-card.tsx` (existiert noch nicht, Phase 4) | — | Score + Datum mit `·` |
| 7 | Footer | `src/components/layout/footer.tsx` (existiert?) | — | `Countrivo · One puzzle a day · Since 2026` |
| 8 | Game-Over-Screen | `src/components/game/game-over-screen.tsx` | aktueller Score-Display | `Score · Rank · Datum` mit `·` |

### Files (Code)

#### 2.1 Header Wortmark (`src/components/layout/header.tsx`)

```tsx
// Vorher:
<Link href="/" className="font-extrabold text-xl text-cream">
  Countrivo
</Link>

// Nachher:
<Link href="/" className="font-extrabold text-xl text-cream tracking-tight">
  Coun<span className="text-gold mx-[1px]">·</span>trivo
</Link>
```

Mono-Spacing für den Punkt: er ist im Inter-Font etwas eng. `mx-[1px]` gibt ihm Atem.

#### 2.2 Streak-Badge

Such-Pattern:
```bash
grep -rn "streak" src/components --include="*.tsx" | grep -i "day"
```

Wo "X day streak" angezeigt wird, ersetzen durch:
```tsx
<span className="font-mono">
  {streakCurrent}<span className="text-gold mx-1">·</span>day<span className="text-gold mx-1">·</span>streak
</span>
```

#### 2.3 Hero-Subline

In Home oder HeroGlobe-Komponente:
```tsx
const today = new Date();
const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
const monthDay = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
const resetIn = formatResetCountdown(); // existiert vermutlich oder einfach schreiben

<p className="text-cream-muted text-sm font-mono">
  {dayName} <span className="text-gold mx-1.5">·</span> {monthDay} <span className="text-gold mx-1.5">·</span> Resets in {resetIn}
</p>
```

#### 2.4 Game-Landing-Datum

In `src/app/games/[slug]/page.tsx` (oder einer geteilten Game-Landing-Komponente):
```tsx
const today = new Date();
const dd = String(today.getDate()).padStart(2, '0');
const mm = String(today.getMonth() + 1).padStart(2, '0');
const yy = String(today.getFullYear()).slice(2);

<time className="font-mono text-cream-muted text-sm">
  {dd}<span className="text-gold mx-0.5">·</span>{mm}<span className="text-gold mx-0.5">·</span>{yy}
</time>
```

#### 2.5 OG-Card

`src/app/opengraph-image.tsx` (Next.js Convention):
```tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage() {
  return new ImageResponse(
    (
      <div style={{
        background: '#fafaf8',  // cream
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter',
      }}>
        <div style={{ fontSize: 144, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.04em' }}>
          Coun<span style={{ color: '#b8860b', margin: '0 4px' }}>·</span>trivo
        </div>
        <div style={{ fontSize: 36, color: '#666', fontFamily: 'Geist Mono', marginTop: 24 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>
    ),
    { ...size }
  );
}
```

Wenn `opengraph-image.tsx` bereits existiert: anpassen.

#### 2.6 Share-Card

Wird in Phase 4 (Share-Grids) gebaut. Vormerken: gleiche Punkt-Logik.

#### 2.7 Footer

`src/components/layout/footer.tsx` (erstellen falls nicht da, oder im layout.tsx):
```tsx
<footer className="text-center text-cream-muted text-xs py-8 font-mono">
  Countrivo <span className="text-gold mx-1.5">·</span> One puzzle a day <span className="text-gold mx-1.5">·</span> Since 2026
</footer>
```

#### 2.8 Game-Over-Screen

`src/components/game/game-over-screen.tsx`. Such die Stelle wo Score/Rank/Datum angezeigt wird:
```tsx
<div className="flex items-center justify-center gap-1.5 text-sm text-cream-muted font-mono">
  <span>{scoreText}</span>
  <span className="text-gold">·</span>
  <span>Rank {rank}</span>
  <span className="text-gold">·</span>
  <time>{formattedDate}</time>
</div>
```

### Bonus: Logo (separate SVG)

Wenn du ein Logo-Asset hast (z.B. `public/logo.svg` oder Inline-SVG):
- Erstelle eine kleine Logo-Komponente die das Wortmark als SVG rendert (für Email-Signaturen, externe Assets)
- Inter Extrabold, mit Punkt in Gold

### Favicon

`src/app/icon.tsx` (Next.js Convention für dynamisches Favicon):
```tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{
        background: 'transparent',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#b8860b',
        fontSize: 28,
        fontWeight: 900,
        fontFamily: 'Inter',
      }}>
        C
      </div>
    ),
    { ...size }
  );
}
```

### Streak-Counter Atem-Animation

In `globals.css`:
```css
@keyframes streak-breath {
  0% { transform: scale(1); }
  40% { transform: scale(1.08); }
  100% { transform: scale(1); }
}

.streak-incremented {
  animation: streak-breath 350ms var(--ease-game);
}
```

In dem Component, das die Streak rendert: bei increment einen `key` ändern oder kurz `streak-incremented` Class togglen.

### Verification

- HeroGlobe-Subline zeigt `Tuesday · May 26 · Resets in 7h 23m`
- Header zeigt `Coun · trivo` mit goldenem Punkt
- Streak-Badge zeigt `23 · day · streak`
- Footer zeigt `Countrivo · One puzzle a day · Since 2026`
- OG-Image (https://countrivo.com/opengraph-image) zeigt Wortmark mit Punkt
- Favicon ist nur "C" in Gold
- Streak-Counter zuckt beim Inkrementieren

### Commit-Messages

- `Wordmark: introduce middle-dot brand bracket (Coun · trivo)`
- `Footer + game-over: apply middle-dot separator typography`
- `OG-card and favicon rebuild with middle-dot brand bracket`
- `Streak counter: 350ms breath animation on increment`

### Risiken

- **Performance OG-Image:** Edge-Image-Generation ist langsam beim ersten Hit, dann gecached. Akzeptabel.
- **Mittler Punkt vs Bullet:** `·` (U+00B7) NICHT `•` (U+2022). Letzteres ist zu fett.
- **Render-Inkonsistenz auf Mobile:** Inter rendert den Punkt teils unten. `align-baseline` oder explizite `vertical-align: middle` einsetzen.

---

## 3 · Phase 3 — Cluster-Engine (neues Spiel)

**Goal:** Cluster als 4. VERDICT-Hauptspiel bauen — 16 Länderflaggen in 4 Gruppen sortieren, Connections-Mechanik für Geographie. Mit Editorial-Hand für die "lila Gruppe".

**Aufwand:** 20-30h Engineering + ongoing Editorial (~5-10 min/Tag oder Batch von 30 Tagen vorab)
**Risiko:** Mittel-Hoch — neues Spiel, Editorial-Abhängigkeit, mehrere Sub-Komponenten

### Spec (aus FINAL-BRIEF §2 und phase-c-research)

- 4×4 Grid aus Länderflaggen
- 4 Gruppen à 4 Länder, gruppiert nach einem versteckten Kriterium
- Spieler wählt 4 Flaggen aus, die er für eine Gruppe hält → submit
- 4 Versuche, einer wird "lila" (obvious-unobvious — die schwerste Gruppe)
- Daily-Mode: 1 Puzzle pro Tag, deterministischer Seed
- Practice-Mode: zufälliges Puzzle
- Editorial: jeder Tag braucht ein redaktionell kuratiertes Puzzle in `content/cluster/YYYY-MM-DD.md`

### Architektur (folgt dem Countrivo-Game-Pattern)

```
src/
  data/game-registry.json                          — Neuer Eintrag tier:"main"
  lib/game-logic/cluster/
    engine.ts                                       — Pure Logic, seeded RNG
    generator.ts                                    — Tagespuzzle aus content/cluster/YYYY-MM-DD.md
    types.ts                                        — ClusterState, ClusterGroup, ClusterPuzzle
    scoring.ts                                      — Score-Logic: 4-1 = Gruppen-Reihenfolge bonus
  components/games/cluster/
    cluster-board.tsx                               — "use client", useReducer, drag-or-tap-to-group
    cluster-grid.tsx                                — 4×4 Flag-Grid Cell-Komponente
    cluster-results.tsx                             — Game-Over mit allen 4 Gruppen revealed
  app/games/cluster/
    page.tsx                                        — Landing (Server Component)
    play/page.tsx                                   — Play (Server Component, Client-Wrapper für Board)
content/cluster/
  2026-05-27.md                                     — Tag 1
  2026-05-28.md                                     — Tag 2
  ... (30 vorab)
__tests__/cluster/
  aldrich-tests.ts                                  — C1-C8 aus phase-h-edge-case-qa/02-boros-aldrich.md
```

### Step-by-Step

#### 3.1 Types

`src/lib/game-logic/cluster/types.ts`:
```ts
export interface ClusterGroup {
  theme: string;           // "Island nations of the Mediterranean"
  countryIso3s: string[];  // 4 Länder
  difficulty: "easy" | "medium" | "hard" | "purple"; // letzteres = obvious-unobvious
}

export interface ClusterPuzzle {
  date: string;            // YYYY-MM-DD
  groups: ClusterGroup[];  // 4 Gruppen
  editorial?: string;      // Markdown-Note vom Curator (optional)
}

export interface ClusterState {
  phase: "playing" | "finished";
  puzzle: ClusterPuzzle;
  shuffledCells: string[]; // 16 ISO3s in randomisierter Reihenfolge
  selected: Set<string>;   // Aktuell ausgewählte ISO3s (max 4)
  solvedGroups: ClusterGroup[]; // Bereits gefundene Gruppen
  attemptsLeft: number;    // Start: 4
  attempts: Array<{        // History aller Versuche
    iso3s: string[];
    correct: boolean;
    nearMiss?: boolean;    // 3 von 4 richtig
  }>;
  won: boolean;
}
```

#### 3.2 Generator

`src/lib/game-logic/cluster/generator.ts`:
```ts
import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter'; // npm install — kleine Dependency
import type { ClusterPuzzle, ClusterGroup } from './types';

export async function loadClusterPuzzle(dateKey: string): Promise<ClusterPuzzle | null> {
  const filePath = path.join(process.cwd(), 'content/cluster', `${dateKey}.md`);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(raw);
    return {
      date: dateKey,
      groups: data.groups as ClusterGroup[],
      editorial: content.trim() || undefined,
    };
  } catch {
    return null; // Fallback: generator.ts könnte ein zufälliges Puzzle generieren, aber kuratiert ist besser
  }
}
```

#### 3.3 Engine

`src/lib/game-logic/cluster/engine.ts`:
```ts
import { seededShuffle } from '@/lib/seeded-random';
import type { ClusterPuzzle, ClusterState, ClusterGroup } from './types';

export function createCluster(rng: () => number, puzzle: ClusterPuzzle): ClusterState {
  const allCountries = puzzle.groups.flatMap(g => g.countryIso3s);
  return {
    phase: "playing",
    puzzle,
    shuffledCells: seededShuffle(allCountries, rng),
    selected: new Set(),
    solvedGroups: [],
    attemptsLeft: 4,
    attempts: [],
    won: false,
  };
}

export function toggleSelect(state: ClusterState, iso3: string): ClusterState {
  if (state.phase !== "playing") return state;
  if (state.solvedGroups.some(g => g.countryIso3s.includes(iso3))) return state;

  const newSelected = new Set(state.selected);
  if (newSelected.has(iso3)) {
    newSelected.delete(iso3);
  } else if (newSelected.size < 4) {
    newSelected.add(iso3);
  }
  return { ...state, selected: newSelected };
}

export function submitGroup(state: ClusterState): ClusterState {
  if (state.phase !== "playing" || state.selected.size !== 4) return state;

  const guess = Array.from(state.selected).sort();
  const match = state.puzzle.groups.find(g =>
    g.countryIso3s.slice().sort().every((c, i) => c === guess[i])
  );

  const newAttempts = [...state.attempts];
  if (match) {
    newAttempts.push({ iso3s: guess, correct: true });
    const newSolved = [...state.solvedGroups, match];
    const won = newSolved.length === 4;
    return {
      ...state,
      phase: won ? "finished" : "playing",
      selected: new Set(),
      solvedGroups: newSolved,
      attempts: newAttempts,
      won,
    };
  }

  // Check near-miss (3 von 4 richtig)
  let bestOverlap = 0;
  for (const g of state.puzzle.groups) {
    const overlap = guess.filter(c => g.countryIso3s.includes(c)).length;
    if (overlap > bestOverlap) bestOverlap = overlap;
  }
  const nearMiss = bestOverlap === 3;

  newAttempts.push({ iso3s: guess, correct: false, nearMiss });
  const newAttemptsLeft = state.attemptsLeft - 1;
  const lost = newAttemptsLeft === 0;

  return {
    ...state,
    phase: lost ? "finished" : "playing",
    selected: new Set(),
    attemptsLeft: newAttemptsLeft,
    attempts: newAttempts,
    won: false,
  };
}
```

#### 3.4 Scoring

`src/lib/game-logic/cluster/scoring.ts`:
```ts
import type { ClusterState } from './types';

export function clusterScore(state: ClusterState): { scoreRaw: number; scoreMax: number; scoreDisplay: string } {
  // Score = 4 - attempts used (höher = besser)
  // Won in 0 misses = 4 perfect, 1 miss = 3, etc.
  // Lost = 0
  if (!state.won) {
    return { scoreRaw: 0, scoreMax: 4, scoreDisplay: "0/4" };
  }
  const attemptsUsed = state.attempts.length;
  const scoreRaw = Math.max(0, 4 - (attemptsUsed - 4)); // 4 groups + misses
  // Actually simpler: 4 - (attempts - 4 wins) misses
  const misses = state.attempts.filter(a => !a.correct).length;
  const score = Math.max(0, 4 - misses);
  return { scoreRaw: score, scoreMax: 4, scoreDisplay: `${score}/4` };
}
```

#### 3.5 Board UI

`src/components/games/cluster/cluster-board.tsx`:
- "use client"
- useReducer für ClusterState
- Grid mit 16 Cells (Flag + Country-Name optional)
- Selected Cells = goldener Border
- Solved Groups oben "abgesetzt" gestapelt, mit Theme-Label
- Submit-Button aktiv wenn `selected.size === 4`
- "Attempts left: 3/4" Indicator
- Game-Over: alle 4 Gruppen revealed, Score
- Submit zu `submitGameRun` mit:
  ```ts
  resultJson: {
    won: state.won,
    attempts: state.attempts,
    groups: state.puzzle.groups, // für Share-Grid
    countryIso3s: state.puzzle.groups.flatMap(g => g.countryIso3s), // für Atlas
  }
  ```

#### 3.6 Routes

`src/app/games/cluster/page.tsx`:
- Server Component, GameLanding-Pattern
- JSON-LD, meta
- "Play Daily" + "Practice" Buttons
- Description: "16 country flags, 4 groups. Find the connections. One puzzle a day."

`src/app/games/cluster/play/page.tsx`:
- Server Component, fetcht `loadClusterPuzzle(dateKey)`
- Renders ClusterBoard Client-Wrapper mit puzzle prop

#### 3.7 Registry

`src/data/game-registry.json` — Neuer Eintrag, `tier: "main"`:
```json
{
  "slug": "cluster",
  "title": "Cluster",
  "shortDescription": "16 flags. 4 groups. Find the connections.",
  "description": "Sixteen country flags. Four hidden groupings. Sort them in four attempts. The purple group is always the trickiest.",
  "emoji": "🎴",
  "difficulty": "medium",
  "estimatedTime": "3-5 min",
  "category": "strategy",
  "tier": "main",
  "isNew": true,
  "isFlagship": false,
  "availableModes": ["daily", "practice"],
  "route": "/games/cluster"
}
```

#### 3.8 Editorial (CRITICAL)

`content/cluster/2026-05-27.md` Beispiel:
```yaml
---
groups:
  - theme: "Landlocked African countries"
    difficulty: easy
    countryIso3s: [TCD, MLI, NER, BFA]
  - theme: "Pacific island nations"
    difficulty: medium
    countryIso3s: [FJI, TON, WSM, VUT]
  - theme: "Former Soviet republics now in NATO"
    difficulty: hard
    countryIso3s: [EST, LVA, LTU, POL]
  - theme: "Countries whose flag features a sun"
    difficulty: purple
    countryIso3s: [ARG, URY, PHL, JPN]
---
Editorial: the purple group is tricky because three of these flags feature a sun prominently in the center (Argentina, Uruguay, Philippines), but Japan's sun is just a circle without rays. Easy to overthink.
```

**Hand-Curated Backlog: 30 Tage vorab vom Solo-Entwickler erstellen.** Themes-Inspiration aus phase-c-research/03-lou-yang-fun-forensics-game-concepts.md.

#### 3.9 Aldrich-Tests

`__tests__/cluster/aldrich-tests.ts` — die C1-C8 Tests aus phase-h-edge-case-qa:
- C1: Empty puzzle (no groups) → fallback
- C2: Group with <4 countries → invalid
- C3: Duplicate country across groups → invalid
- C4: All correct first try → wins, score 4
- C5: 4 misses (used all attempts) → loses, score 0
- C6: Near-miss feedback (3/4 correct) → state.attempts[n].nearMiss true
- C7: Click solved cell → no-op
- C8: Submit with <4 selected → no-op

Test via vitest (oder existing test-runner).

#### 3.10 Atlas-Integration

`extract_countries()` SQL hat schon `WHEN 'cluster' THEN` Branch (von Phase 1 SQL — `countryIso3s` Array). Funktioniert direkt sobald cluster-board die richtige resultJson emittiert.

### Verification

- `npm run build` grün
- `/games/cluster` rendert Landing
- `/games/cluster/play` lädt Puzzle aus content/cluster/<today>.md, rendert Grid
- Daily für 3 Tage hintereinander durchspielen — selber Puzzle wenn gleiches Datum
- Submit → game_runs Row mit mode=daily
- Atlas-Sticker bekommen nach Daily-Win (16 neue Sticker)
- 30-Tage-Backlog ist im content/cluster/ Folder

### Commit-Messages

- `Add cluster game logic (types, engine, scoring, generator)`
- `Add cluster game UI (board, grid, results screen)`
- `Register cluster in game-registry, add routes`
- `Add 30-day editorial backlog for cluster (content/cluster/)`
- `Add Aldrich C1-C8 tests for cluster engine`

### Risiken

- **Editorial-Aufwand wird unterschätzt.** 30 gute Puzzles brauchen 3-5h Recherche. Ehrlich vor sich selbst sein. Wenn keine Zeit: 7 Puzzles vorab, dann wöchentlich nachfüllen.
- **gray-matter Dependency** — kleines NPM-Package, harmless. Approve es.
- **Difficulty-Calibration** — Purple-Gruppe muss schwer aber lösbar sein. Test mit 2-3 Personen vorab.
- **content/ Folder im Repo** — wird mitversioniert, ist OK weil Markdown-Puzzles klein sind. Alternative: Supabase-Tabelle für Puzzles (overkill für jetzt).

---

## 4 · Phase 4 — Share-Grids + Streak-Halbwertszeit

**Goal:** Pro Spiel ein teilbares Ergebnis-Grid (Wordle-Style), plus Streak-Berechnung mit Halbwertszeit für verpasste Tage.

**Aufwand:** 8-12h
**Risiko:** Mittel — DB-Schema-Änderung (`weight` column) + UI für 4 Spiele.

### Share-Grids — 4 Formate

#### 4.1 Country-Draft Share-Grid

`src/components/share/country-draft-grid.tsx`:
```
Countrivo · Country Draft · 26.05.26
🟨🟩🟩🟨⬛🟩🟩🟨  Score: 1342/1944
                Rank: 12th
countrivo.com
```

- 8 Symbole, gefärbt nach Rang der Picks:
  - 🟩 = optimal-Pick (rank == optimalRank)
  - 🟨 = Within 50 of optimal
  - ⬛ = Far from optimal
- Plus Score + Rank + URL

#### 4.2 Trace Share-Grid

Existiert quasi schon (Countryle-Style):
```
Countrivo · Trace · 26.05.26
🟩🟩🟩⬛⬛⬛  4/6
🟩⬛🟩⬛🟩⬛
🟩🟩🟩🟩⬛⬛
🟩🟩🟩🟩🟩🟩
countrivo.com
```

- 6 Reihen × 6 Stat-Pfeile (✅⬆️⬇️)
- Plus guess count + URL

#### 4.3 Stat-Guesser Share-Grid

```
Countrivo · Stat-Guesser · 26.05.26
🎯 Off by 12%
Anchor: Spain (47M) → Tanzania
countrivo.com
```

- Anker-Distanz-Symbol
- Plus Anchor-Land + Target

#### 4.4 Cluster Share-Grid

```
Countrivo · Cluster · 26.05.26
🟩🟩🟩🟩  Solved in 3 tries
🟨🟨🟨🟨
🟪🟪🟪🟪
🟦🟦🟦🟦
countrivo.com
```

- 4×4 Farbgrid mit Reveal-Reihenfolge
- Plus Tries-Count

### Implementation

#### 4.5 Generic Share-Card Component

`src/components/share/share-card.tsx`:
- Props: `game: "country-draft" | "trace" | "stat-guesser" | "cluster"`, `result: ResultJson`, `dateKey`
- Renders das richtige Grid (via per-game sub-component)
- "Copy to clipboard" Button (Standard Pattern)
- "Share" Button (Web Share API mit Fallback auf copy)
- Brand-Klammer im Header: `Countrivo · <Game> · 26 · 05 · 26`

#### 4.6 Per-Game Share-Components

In `src/components/share/`:
- `country-draft-grid.tsx`
- `trace-grid.tsx`
- `stat-guesser-grid.tsx`
- `cluster-grid.tsx`

Jeder generiert ein Plain-Text-Grid (Emoji-Squares) das in die Zwischenablage kopierbar ist.

#### 4.7 Game-Over-Screen Integration

`src/components/game/game-over-screen.tsx`:
- Add "Share Result" Button neben "Play Again"
- Opens Modal mit ShareCard

### Streak-Halbwertszeit

#### 4.8 DB-Migration

Apply als `mcp__supabase__apply_migration` named `streak_weight_column`:

```sql
ALTER TABLE public.game_runs
  ADD COLUMN IF NOT EXISTS weight numeric(3,2) DEFAULT 1.0;

-- Backfill: alle existing Rows haben weight 1.0 (default kicks in)
-- Trigger: bei INSERT berechnet weight basierend auf submitted vs daily_date Diff
CREATE OR REPLACE FUNCTION public.compute_weight()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  diff_days int;
BEGIN
  IF NEW.mode != 'daily' OR NEW.daily_date IS NULL THEN
    NEW.weight := 1.0;
    RETURN NEW;
  END IF;

  diff_days := EXTRACT(DAY FROM (CURRENT_DATE - NEW.daily_date));
  -- diff_days = 0 (same day) → weight 1.0
  -- diff_days = 1 (one day late) → weight 0.5
  -- diff_days = 2 → 0.25
  -- diff_days = 3+ → 0.125
  NEW.weight := CASE
    WHEN diff_days <= 0 THEN 1.0
    WHEN diff_days = 1 THEN 0.5
    WHEN diff_days = 2 THEN 0.25
    ELSE 0.125
  END;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_compute_weight ON public.game_runs;
CREATE TRIGGER trg_compute_weight
  BEFORE INSERT ON public.game_runs
  FOR EACH ROW EXECUTE FUNCTION public.compute_weight();
```

#### 4.9 Streak-Race-Condition Fix (Konstantinou Säule #8)

Aktuell wird streak in `updateStreak()` inkrementell aktualisiert — Race-bedingt anfällig (zwei Daily-Submits gleichzeitig führen zu falschem Increment).

Fix: Aggregation-Query statt incrementeller Update.

In `src/app/actions/game-runs.ts`, ersetze `updateStreak` durch:
```ts
async function updateStreak(supabase, userId, dateKey) {
  // Compute streak from aggregation over game_runs
  const { data: runs } = await supabase
    .from('game_runs')
    .select('daily_date')
    .eq('user_id', userId)
    .eq('mode', 'daily')
    .order('daily_date', { ascending: false })
    .limit(365); // 1 year window

  // Compute current streak: consecutive days ending today
  const dates = new Set(runs?.map(r => r.daily_date) ?? []);
  let streak = 0;
  let cursor = new Date(dateKey);
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  await supabase
    .from('profiles')
    .update({
      streak_current: streak,
      streak_longest: { sql: `GREATEST(streak_longest, ${streak})` }, // raw SQL
      last_daily_date: dateKey,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
}
```

Race-Condition vermieden, weil Streak immer aus den Run-Records berechnet wird, nie incrementell.

### Files (zusammengefasst)

| File | Änderung |
|---|---|
| `src/components/share/share-card.tsx` | NEW: generic share component |
| `src/components/share/country-draft-grid.tsx` | NEW |
| `src/components/share/trace-grid.tsx` | NEW (oder rename von countryle-grid wenn existiert) |
| `src/components/share/stat-guesser-grid.tsx` | NEW |
| `src/components/share/cluster-grid.tsx` | NEW |
| `src/components/game/game-over-screen.tsx` | Add Share button + Modal |
| `src/app/actions/game-runs.ts` | Rewrite `updateStreak` to aggregation-based |
| DB Migration `streak_weight_column` | weight column + compute_weight trigger |

### Verification

- Spielen → Share-Button → Copy to clipboard → in Notion/Slack paste → korrektes Grid
- DB: `SELECT mode, weight, COUNT(*) FROM game_runs GROUP BY mode, weight` — neue Daily-Runs haben weight 1.0 (oder 0.5 wenn nachträglich submitted)
- Streak-Test: lokal Datum manipulieren (System-Date Trick oder Test-User), verschiedene Streak-Pfade durchprobieren

### Commit-Messages

- `Add share-card component with per-game emoji grids`
- `Game-over-screen: add Share button to result modal`
- `DB: add weight column to game_runs with date-based decay trigger`
- `Streak: switch from incremental update to aggregation-based query`

### Risiken

- **`updateStreak` Aggregation-Performance:** 365 rows scan pro Daily-Submit. Bei 100 Daily-Spielen pro User × 14 Spiele = OK. Bei millionen Usern → Cache via View. Heute kein Problem.
- **Share-Grid Emoji-Rendering:** Mobile vs Desktop unterschiedlich. Use plain Unicode squares, kein Custom-Font.
- **Weight-Trigger fires bei jedem INSERT** — overhead minimal (CASE statement).

---

## 5 · Phase 5 — Friend-Challenge-Notifications

**Goal:** Email-Trigger bei neuer Friend-Challenge + In-App-Badge im Header.

**Aufwand:** 6-8h
**Risiko:** Mittel — Postgres Function + Supabase Edge Function + Email-Provider

### Architektur

```
[friend_challenges INSERT]
       ↓
[trg_notify_friend_challenge trigger]
       ↓
[Postgres function: net.http_post()]
       ↓
[Supabase Edge Function: send-challenge-email]
       ↓
[Resend / SendGrid / Supabase Email]
       ↓
[Email an challenged_id User]
```

### Setup

#### 5.1 Email Provider

Empfehlung: **Resend** (resend.com — gratis bis 100 Mails/Tag, schöne API).

```bash
# Account erstellen, API-Key generieren, Domain verifizieren
# Env-Var in Supabase Edge Function settings:
RESEND_API_KEY=re_xxx
```

#### 5.2 Edge Function

`supabase/functions/send-challenge-email/index.ts`:
```ts
import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  const { challenge_id } = await req.json();

  // Fetch challenge + challenger + challenged from Supabase
  const supabase = createSupabaseClient(); // service-role
  const { data: challenge } = await supabase
    .from('friend_challenges')
    .select(`
      *,
      challenger:profiles!challenger_id(username, display_name),
      challenged:profiles!challenged_id(username, display_name, id)
    `)
    .eq('id', challenge_id)
    .single();

  if (!challenge) return new Response("Not found", { status: 404 });

  // Fetch challenged user's email from auth.users
  const { data: { user } } = await supabase.auth.admin.getUserById(challenge.challenged.id);
  if (!user?.email) return new Response("No email", { status: 400 });

  // Send via Resend
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Countrivo <noreply@countrivo.com>",
      to: user.email,
      subject: `${challenge.challenger.display_name} challenged you on Countrivo`,
      html: `
        <p>${challenge.challenger.display_name} challenged you to ${challenge.game_slug}.</p>
        <p><a href="https://countrivo.com/friends">Accept Challenge</a></p>
      `,
    }),
  });

  return new Response(JSON.stringify({ sent: res.ok }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

Deploy:
```bash
supabase functions deploy send-challenge-email
```

#### 5.3 Postgres Trigger

Apply als `mcp__supabase__apply_migration` named `friend_challenge_notifications`:

```sql
-- Enable pg_net extension if not yet (für http_post)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notify_friend_challenge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://reqvdyfzwkrtlvgapnyq.supabase.co/functions/v1/send-challenge-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('challenge_id', NEW.id)
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_friend_challenge ON public.friend_challenges;
CREATE TRIGGER trg_notify_friend_challenge
  AFTER INSERT ON public.friend_challenges
  FOR EACH ROW EXECUTE FUNCTION public.notify_friend_challenge();
```

**Wichtig:** `service_role_key` muss als Postgres setting verfügbar sein:
```sql
-- Im Supabase Dashboard unter Database → Settings → Custom Postgres config:
-- app.settings.service_role_key = <YOUR_SERVICE_ROLE_KEY>
```

Alternativ: Hardcoded im Edge Function selbst per env var, dann ist der Auth-Header im Trigger nicht nötig.

#### 5.4 In-App Badge

`src/components/layout/header.tsx`:
```tsx
import { getPendingChallengeCount } from '@/app/actions/challenges';

// Im Header-Component (Server Component oder Client mit polling)
const pendingCount = await getPendingChallengeCount();

<Link href="/friends" className="relative">
  Friends
  {pendingCount > 0 && (
    <span className="absolute -top-1 -right-2 bg-gold text-bg text-xxs font-bold rounded-full w-4 h-4 flex items-center justify-center">
      {pendingCount}
    </span>
  )}
</Link>
```

Server Action:
```ts
// src/app/actions/challenges.ts (existiert schon, add this)
export async function getPendingChallengeCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from('friend_challenges')
    .select('id', { count: 'exact', head: true })
    .eq('challenged_id', user.id)
    .eq('status', 'pending');

  return count ?? 0;
}
```

Für Live-Update: 60-Sekunden-Polling im Client:
```tsx
"use client";
const { data } = useSWR('/api/pending-count', { refreshInterval: 60000 });
```

Oder einfacher: Re-fetch beim Tab-Focus mit `document.visibilitychange`.

### Verification

- Challenge erstellen → Email kommt an (im Resend Dashboard sichtbar)
- Header zeigt Badge nach Challenge-Receive (max 60s Verzögerung beim Polling)
- Click auf Badge → /friends mit Challenges-Liste

### Commit-Messages

- `Add send-challenge-email Supabase Edge Function`
- `DB: trigger emails on friend_challenge INSERT`
- `Header: add pending-challenges badge with 60s polling`

### Risiken

- **Email-Provider Lock-In:** Resend vs SendGrid vs Postmark. Resend ist heute am simpelsten, OK.
- **pg_net Extension:** muss im Supabase-Projekt aktiviert sein. Default ja in neuen Projekten.
- **Spam:** wenn jemand wiederholt challenges schickt, viele Mails. Rate-Limit im Trigger (`COUNT challenges in last 1h > 5 → skip`).
- **Email Deliverability:** Domain DKIM/SPF setup, sonst landen Mails im Spam.

---

## 6 · Phase 6 — Server-Side Re-Compute (Anti-Cheat)

**Goal:** Pflicht-Validierung pro Spiel: der Server replays die Engine mit dem Daily-Seed und vergleicht mit der gemeldeten User-Score. Schützt vor manipulated client submits.

**Aufwand:** 6-10h
**Risiko:** Mittel — touches `submitGameRun`, 4 per-game validators, Performance-Impact

### Konzept

Aktuell: `validateGameResult()` prüft nur resultJson-Shape vs scoreRaw consistency. Was fehlt: ist `scoreRaw` überhaupt erreichbar in diesem Daily-Seed?

```
User submitted: trace day 26.05, score 1 (won on first guess)
Server check: replay trace engine with seed(2026-05-26), is that score achievable?
  → if scoreRaw > max_possible_score: REJECT
  → if scoreRaw == 1 but target_country requires multiple stat-clues: REJECT
```

### Files

#### 6.1 Engine-Replay-Helpers

Pro Spiel: eine Server-Side-Replay-Function die die Engine mit Seed startet und max achievable score zurückgibt.

`src/lib/game-logic/trace/server-validate.ts` (NEW):
```ts
import { createCountryle } from './engine'; // or trace nach Rename
import { dateSeed } from '@/lib/daily-seed';
import { mulberry32 } from '@/lib/seeded-random';

export function validateTraceResult(
  dateKey: string,
  scoreRaw: number,
  resultJson: Record<string, unknown>
): { valid: boolean; reason?: string } {
  const seed = dateSeed(dateKey + 'countryle'); // or 'trace'
  const rng = mulberry32(seed);
  const state = createCountryle(rng);

  // Target country aus engine
  const expectedTarget = state.target.iso3;
  const submittedTarget = resultJson.target as string;

  if (submittedTarget !== expectedTarget) {
    return { valid: false, reason: 'target_mismatch' };
  }

  // Score muss zwischen 1-7 sein
  if (scoreRaw < 1 || scoreRaw > 7) {
    return { valid: false, reason: 'score_out_of_range' };
  }

  // Won = score 1-6, lost = 7
  const won = resultJson.won === true;
  if (won && scoreRaw === 7) return { valid: false, reason: 'won_but_score_7' };
  if (!won && scoreRaw !== 7) return { valid: false, reason: 'lost_but_score_not_7' };

  return { valid: true };
}
```

Analog für country-draft, stat-guesser, cluster.

#### 6.2 Server Validator-Switch

`src/app/actions/game-runs.ts`:
```ts
import { validateTraceResult } from '@/lib/game-logic/trace/server-validate';
import { validateCountryDraftResult } from '@/lib/game-logic/country-draft/server-validate';
import { validateStatGuesserResult } from '@/lib/game-logic/stat-guesser/server-validate';
import { validateClusterResult } from '@/lib/game-logic/cluster/server-validate';

// Innerhalb submitGameRun, NACH dem existing validateGameResult, NUR für daily mode:
if (input.mode === 'daily') {
  let serverValidation: { valid: boolean; reason?: string } | null = null;
  switch (input.gameSlug) {
    case 'trace': // or countryle until rename
      serverValidation = validateTraceResult(input.dateKey, input.scoreRaw, input.resultJson);
      break;
    case 'country-draft':
      serverValidation = validateCountryDraftResult(input.dateKey, input.scoreRaw, input.resultJson);
      break;
    case 'stat-guesser':
      serverValidation = validateStatGuesserResult(input.dateKey, input.scoreRaw, input.resultJson);
      break;
    case 'cluster':
      serverValidation = validateClusterResult(input.dateKey, input.scoreRaw, input.resultJson);
      break;
  }

  if (serverValidation && !serverValidation.valid) {
    return { success: false, error: `server_validation_failed: ${serverValidation.reason}` };
  }
}
```

#### 6.3 Country-Draft Validation (komplex)

Country-Draft hat optimal-score per Daily-Seed. Replay:

`src/lib/game-logic/country-draft/server-validate.ts`:
```ts
export function validateCountryDraftResult(
  dateKey: string,
  scoreRaw: number,
  resultJson: Record<string, unknown>
): { valid: boolean; reason?: string } {
  const seed = dateSeed(dateKey + 'country-draft');
  const rng = mulberry32(seed);
  const game = createDraftGame(rng); // ruft generator auf

  // Optimal score muss <= scoreRaw sein (lower is better)
  const optimalScore = game.optimalScore;
  const submittedScore = scoreRaw;

  // Theoretical max = 8 × 243 = 1944 (worst case)
  if (submittedScore > 1944) return { valid: false, reason: 'score_exceeds_theoretical_max' };

  // Submitted assignments must match game's available countries
  const submittedAssignments = resultJson.assignments;
  if (!Array.isArray(submittedAssignments) || submittedAssignments.length !== 8) {
    return { valid: false, reason: 'invalid_assignments_shape' };
  }

  // Verify each assignment is in the game's eligible set
  const eligibleCountryIdxs = game.countries.map(c => c.idx);
  for (const a of submittedAssignments) {
    if (!eligibleCountryIdxs.includes(a.countryIdx)) {
      return { valid: false, reason: 'invalid_country_idx' };
    }
  }

  // Recompute score from assignments and compare
  const recomputed = computeScore(submittedAssignments, game);
  if (recomputed !== scoreRaw) {
    return { valid: false, reason: `score_mismatch: client ${scoreRaw} vs server ${recomputed}` };
  }

  return { valid: true };
}
```

#### 6.4 Performance

`createDraftGame()` ist ~50ms. `submitGameRun` ist heute ~100ms. Mit Validation: ~150-200ms. Akzeptabel.

Wenn slow: Cache `createDraftGame(seed)` results per (slug, dateKey) im Memory oder Redis. Heute nicht nötig.

### Verification

- Submit normalen Run → success
- Submit mit manipuliertem `score_raw = 0` (auf country-draft, was nicht erreichbar) → `server_validation_failed: score_mismatch`
- Submit mit falschem `target` für trace → `target_mismatch`
- Submit `cluster` mit Assignments die nicht zum Daily-Seed passen → reject

### Commit-Messages

- `Add server-side validators for trace, country-draft, stat-guesser, cluster`
- `submitGameRun: gate daily-mode submits behind server-validation re-compute`

### Risiken

- **Performance bei langsamer Engine** — country-draft Generator könnte teuer sein. Profilieren vor Deploy.
- **False positives:** wenn Engine non-deterministisch ist (z.B. Math.random irgendwo), schlägt Validation Permanent fehl. Audit Engines auf Math.random vor Implementation.
- **Bestehende Runs:** keine Migration nötig — gilt nur für neue Runs.

---

## 7 · Phase 7 — Repo-Hygiene + country-draft RNG-Fix

**Goal:** Aufräumarbeiten, die sich angesammelt haben. Engine-Purity wiederherstellen, dead-code raus, README erneuern.

**Aufwand:** 6-8h
**Risiko:** Niedrig — pure cleanup

### Items

#### 7.1 country-draft RNG-Signature-Fix

`src/lib/game-logic/country-draft/engine.ts:6` — Engine sollte `rng` als Parameter nehmen, aktuell holt sie irgendwo intern Math.random oder ähnliches.

Vorher:
```ts
export function createGame(mode, dateKey) {
  // intern: const rng = ...
}
```

Nachher:
```ts
export function createGame(rng: () => number, mode, dateKey) {
  // explicit
}
```

Alle Callsites mit-migrieren.

#### 7.2 17 PNG-Screenshots aus Repo-Root

```bash
mkdir -p docs/screenshots
mv *.png docs/screenshots/
# falls einige als references in README/MD-Files: paths nachziehen
```

#### 7.3 README ersetzen

Aktuell: Next.js Default README. Schreibe ein echtes README:

```md
# Countrivo

Geography gaming platform — 4 daily games, 243 countries, Atlas Album to collect them.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind 4 · Supabase · Vercel

## Quick start

```
npm install
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

## Project structure

See `CLAUDE.md` and `docs/country-ai-country/FINAL-BRIEF.md`.

## Deploy

```
vercel --prod --yes
```

CLI-only, no auto-deploy on push.

## License

(your choice)
```

#### 7.4 country-streak useState → useReducer

`src/components/games/country-streak/streak-board.tsx` — komplex enough state to warrant useReducer.

Refactor pattern: bestehender useState → reducer mit `type Action = ...`.

Optional, low priority.

#### 7.5 play-page Client-Wrapper Extraction

`src/app/games/{blitz,supremacy,borderline,...}/play/page.tsx` haben heute `"use client"` weil sie `useSearchParams()` für Mode-Parsing nutzen.

Pattern: Server Component für page.tsx, Client-Wrapper-Komponente für das was useSearchParams braucht.

Vorher:
```tsx
"use client";
export default function PlayPage() {
  const params = useSearchParams();
  const mode = params.get('mode') ?? 'practice';
  return <BlitzBoard mode={mode} />;
}
```

Nachher:
```tsx
// page.tsx — Server Component
export default async function PlayPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const params = await searchParams;
  const mode = params.mode ?? 'practice';
  return <BlitzBoard mode={mode} />;
}
```

`BlitzBoard` ist eh schon `"use client"`. So braucht die page.tsx nicht mehr `"use client"`.

Effekt: bessere Initial-Render-Performance, bessere SEO. Mache für alle play-pages.

#### 7.6 Pre-existing lint errors

```bash
npm run lint
```

Fix die ~25 pre-existing errors in:
- `src/lib/game-logic/country-draft/engine.ts` (unused vars)
- `src/lib/game-logic/country-draft/generator.ts` (unused vars)
- `src/lib/game-logic/countryle/engine.ts` (unused var)
- `src/lib/game-logic/higher-or-lower/engine.ts` (unused vars)
- `src/hooks/use-game-keys.ts` (whatever was flagged)

Meist `_unused` prefix oder löschen.

### Commit-Messages

- `Country-draft engine: accept rng as parameter for purity`
- `Move root PNG screenshots to docs/screenshots/`
- `Replace Next.js default README with project README`
- `Country-streak board: migrate useState chain to useReducer`
- `Play pages: extract client-wrapper, keep page.tsx server-component`
- `Fix pre-existing lint warnings across game engines`

### Risiken
- Sehr low. Pure cleanup. Build catches everything.

---

## 8 · Phase 8 — Deferred (parallel oder ad-hoc)

Diese Items aus `decisions.md` können parallel zu den Phasen erledigt werden. Keine harte Reihenfolge.

### 8.1 SECURITY DEFINER RPC `ensure_daily_puzzle` (1h)

Härtere Variante als die heutige `auth.uid() IS NOT NULL` Policy. Statt direkten INSERT erlauben, nur via RPC der atomar das Tagespuzzle ensure-t (Single-Writer-Pattern).

```sql
CREATE OR REPLACE FUNCTION public.ensure_daily_puzzle(p_game_slug text, p_daily_date date, p_seed int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  puzzle_id int;
BEGIN
  SELECT id INTO puzzle_id
  FROM public.daily_puzzles
  WHERE game_slug = p_game_slug AND daily_date = p_daily_date;

  IF puzzle_id IS NULL THEN
    INSERT INTO public.daily_puzzles (game_slug, daily_date, seed)
    VALUES (p_game_slug, p_daily_date, p_seed)
    ON CONFLICT (game_slug, daily_date) DO NOTHING
    RETURNING id INTO puzzle_id;

    -- Edge case: another transaction inserted between SELECT and INSERT
    IF puzzle_id IS NULL THEN
      SELECT id INTO puzzle_id
      FROM public.daily_puzzles
      WHERE game_slug = p_game_slug AND daily_date = p_daily_date;
    END IF;
  END IF;

  RETURN puzzle_id;
END $$;

-- Code in submitGameRun:
-- statt .from('daily_puzzles').upsert(...): await supabase.rpc('ensure_daily_puzzle', { p_game_slug, p_daily_date, p_seed })
```

### 8.2 search_path-Hardening auf 6 SQL-Functions (1h)

Supabase-Advisor flagged 6 functions ohne `SET search_path`. Alle:
- `public.handle_new_user()` (gefixt in Step 2)
- `public.update_user_game_stats()`
- `public.compute_daily_rankings()`
- `public.get_daily_leaderboard()`
- `public.get_daily_summary()`
- `public.recompute_user_game_stats()`

Pro Function: `ALTER FUNCTION ... SET search_path = public, pg_temp;`

### 8.3 HaveIBeenPwned (Dashboard, 5 min)

Schon erwähnt in Pre-Flight P2. Falls Pro-Tier nicht vorhanden: Custom-Validierung im Auth-Modal mit der HaveIBeenPwned-API.

### 8.4 OAuth-User Migration-Script (2h, optional)

Wenn du den manuellen Bulk-Reset von P1 nicht willst:

`scripts/migrate-oauth-users.ts`:
```ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const { data: users } = await supabase.auth.admin.listUsers();
const oauthUsers = users.users.filter(u =>
  u.app_metadata.provider !== 'email' && u.app_metadata.provider !== null
);

for (const user of oauthUsers) {
  await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: user.email!,
  });
  console.log('Reset sent to', user.email);
  await sleep(100); // Rate limit
}
```

Run: `npx tsx scripts/migrate-oauth-users.ts`

### 8.5 Atlas-Backfill für country-draft + stat-guesser

Historisch fehlen ISO3s in result_json für diese 2 Spiele. Backfill braucht Engine-Replay (ähnlich Phase 6 Anti-Cheat).

Erst nach Phase 6 sinnvoll — die Validators können dann auch das Replay für den Backfill liefern.

```ts
// scripts/backfill-atlas-historical.ts
// Für jede historische daily-Run von country-draft/stat-guesser:
//   1. Replay Engine mit dateSeed
//   2. Extract Country-ISO3s aus engine state
//   3. Insert in atlas_stickers (mit ON CONFLICT update stamp_count)
```

### 8.6 3 Sign-In-Trigger-Punkte

Aus Vellanti's Plan: nach Daily-Sieg, an Streak-Tag-3, bei Friend-Challenge-Reception ein Modal-Trigger zum Login.

Files:
- `src/components/game/game-over-screen.tsx` — wenn `mode === "daily"` und `won` und kein User: trigger `openAuthModal({ context: 'save-score' })`
- `src/components/layout/header.tsx` — wenn streak === 3 (von SessionStorage flag): einmaliger Trigger
- Friend-Challenge-Email enthält Link, der bei Klick (wenn nicht eingeloggt) das Modal triggert

### 8.7 country-ai-country/ Folder committen

Aktuell untracked. Entweder:
- `git add docs/country-ai-country && git commit -m "Add country-ai-country strategic review materials"`
- Oder zu .gitignore hinzufügen wenn lokal-only

Empfehlung: committen. Die 30 Berichte + FINAL-BRIEF + EXECUTION-PLAN sind die Code-Genese-Doku.

---

## 9 · Launch-Checklist

Vor dem ersten richtigen Public-Launch (z.B. Reddit-Post, Twitter):

### Code-Vollständigkeit
- [ ] Phase 1 (Trace-Rename) done
- [ ] Phase 2 (Brand-Klammer) done
- [ ] Phase 3 (Cluster) done — mindestens 30 Editorial-Puzzles im Backlog
- [ ] Phase 4 (Share-Grids) done
- [ ] Phase 5 (Notifications) done
- [ ] Phase 6 (Anti-Cheat) done — KRITISCH vor Public Launch
- [ ] Phase 7 (Hygiene) done — optional, kann nach Launch

### Pre-Launch Smoke
- [ ] Alle 4 Hauptspiele Daily + Practice durchgespielt
- [ ] Alle 11 Drills funktionieren
- [ ] Friend-Challenge: erstellen → Email kommt → annehmen → spielen → Ergebnis
- [ ] /album: nach Daily-Win neue Sticker sichtbar
- [ ] Share-Grids: alle 4 Spiele → copy to clipboard → paste → korrekt formatiert
- [ ] Streak-Counter: Tag 1 → Tag 2 → richtig hochgezählt
- [ ] Sign-In/Sign-Up/Forgot-Password/Reset-Password End-to-End
- [ ] OAuth-User-Migration komplett (alle 6 haben Passwort gesetzt)

### Anti-Cheat
- [ ] Server-Validators für alle 4 Spiele aktiv
- [ ] Test mit manipulierter Score (Browser-DevTools) — wird rejected

### SEO + Brand
- [ ] OG-Image lädt korrekt (test mit `https://www.opengraph.xyz/`)
- [ ] Favicon ist "C"
- [ ] Sitemap.xml enthält alle 4 Hauptspiele
- [ ] robots.txt erlaubt Index für Spielseiten, blockt /album

### Performance
- [ ] Lighthouse-Score > 90 auf Home
- [ ] First Contentful Paint < 1.5s
- [ ] HeroGlobe lädt nicht-blocking

### Monitoring
- [ ] Vercel Analytics aktiv
- [ ] Supabase Logs review
- [ ] Error-Boundary in Place (für unbehandelte Errors)

### Launch
- [ ] `vercel --prod --yes`
- [ ] 30 Min beobachten
- [ ] Eigenen Account testen
- [ ] (optional) Reddit-Post r/geography, r/dailygames

---

## 10 · Aufwand gesamt

| Phase | Inhalt | Stunden |
|---|---|---|
| Pre-Flight (P1-P5) | OAuth-Migration, Dashboard, Smoke, Deploy | **2** |
| Phase 1 | countryle → trace Rename | **3-4** |
| Phase 2 | Brand-Klammer mittlerer Punkt | **3-5** |
| Phase 3 | Cluster-Engine | **20-30** (+ ongoing Editorial) |
| Phase 4 | Share-Grids + Streak-Halbwertszeit | **8-12** |
| Phase 5 | Friend-Challenge-Notifications | **6-8** |
| Phase 6 | Server-Side Re-Compute | **6-10** |
| Phase 7 | Repo-Hygiene + RNG-Fix | **6-8** |
| Phase 8 | Deferred (parallel) | **4-6** |
| **Summe** | | **58-85 Stunden** |

**Realistischer Zeitplan für Solo-Entwickler mit Tagesjob:**

- Wenn 10h/Woche an Countrivo: **6-8 Wochen**
- Wenn Vollzeit-Sprint: **2-3 Wochen**
- Editorial-Pflege Cluster: 10 min/Tag ongoing

**Empfohlene Sprint-Aufteilung (jede Woche 1-2 Phasen):**

| Woche | Fokus |
|---|---|
| 1 | Pre-Flight + Phase 1 (Trace) + Phase 2 (Brand-Klammer) |
| 2-3 | Phase 3 (Cluster) — größtes Stück |
| 4 | Phase 4 (Share + Streak) |
| 5 | Phase 5 (Notifications) |
| 6 | Phase 6 (Anti-Cheat) |
| 7 | Phase 7 (Hygiene) + Phase 8 (Deferred) |
| 8 | Launch-Checklist + Public Launch |

---

## Notizen für künftige Sessions

- Dieser Plan ist nicht in Stein gemeißelt — wenn eine Entdeckung in einer Phase die nächsten umschreibt (z.B. Cluster-Engine zeigt dass Share-Grids generischer sein müssen), Plan updaten.
- `decisions.md` weiter pflegen — jeder nicht-offensichtliche Entschluss landet dort.
- Wenn neue Reports/Brief-Erweiterungen kommen, dieses Dokument als zentrale Roadmap-Wahrheit aktualisieren.
- Bei Re-Engagement mit AI-Agent: dieses Dokument + `FINAL-BRIEF.md` als Briefing geben — kein Wiederholungs-Onboarding nötig.

— Ende des Execution-Plans.
