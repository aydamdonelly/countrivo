# Countrivo: Multiplayer Games, Design Revamp & Playability Overhaul

## Context

Countrivo is a client-side geography gaming platform (Next.js App Router, 11 games, 306 static pages) deployed on Vercel. It has no backend — all state is localStorage, all games use seeded RNG with `useReducer`. The platform needs:

1. **3 new real-time multiplayer games** played via shared room codes
2. **A complete design/UX revamp** from generic AI-looking to a distinctive "Explorer" identity
3. **Keyboard support** across all games
4. **Mobile playability improvements**
5. **Supabase backend** for realtime, session tracking, and usage analytics

---

## 1. Design System: "Explorer"

### Visual Identity

- **3 colors only**: Forest green (`#0b140a` bg), Gold (`#c9a44c` accents/icons), Cream (`#e6dec5` text)
- **2 fonts**: DM Serif Display (game titles, hero), Inter (body, UI)
- **Zero emoji** — all icons are custom SVG line icons, consistent 1.5px stroke, gold on dark
- **Background**: SVG topographic contour lines with gradient mask (fade at edges), `mix-blend-mode: screen`, subtle breathing animation on one highlight line
- **No gradient orbs, no shimmer sweeps** — restraint over decoration
- **Single idle animation**: one topo line that fades in/out on an 8s loop

### Layout Principles

- **Intentional hierarchy**: Hero breathes (32px margins), VS cards are compact (14px padding), Solo is a flat list (13px padding, border-bottom separators)
- **Varied border-radius**: Hero button 8px, VS cards 10px, Join input 6px. Not consistent everywhere.
- **Varied layouts per section**: Hero = raw text, VS = card list, Solo = flat list. Never grid-of-same-cards.
- **Mobile-first**: max-width 430px centered, all content designed for 390px viewport first

### Component Inventory

| Component | Radius | Padding | Font |
|-----------|--------|---------|------|
| Hero title | — | 0 | DM Serif 30px |
| Hero button | 8px | 12px 20px | Inter 13px 700 |
| VS card | 10px | 14px 16px | DM Serif 17px name, Inter 12px desc |
| Join input row | 10px | 12px 16px | Inter 16px 600 (code), 12px (label) |
| Solo list item | 0 | 13px 0 | Inter 14px 600 name, 11px meta |
| Section title | — | 0 | Inter 13px 700 |

### Custom SVG Icons (all 1.5px stroke, gold)

| Game | Icon concept |
|------|-------------|
| Country Draft | Target/crosshair |
| Supremacy | Balance/scale |
| Borderline | Path with start/end nodes |
| Blitz | Lightning bolt |
| Flag Quiz | Waving flag |
| Higher or Lower | Double chevrons up |
| Population Sort | Bar chart ascending |
| Country Streak | Map pin |
| Capital Match | Checkmark in box |
| Speed Flags | Clock |
| Odd One Out | Magnifier with minus |
| Border Buddies | Chain links |
| Continent Sprint | Flag with plus |
| Stat Guesser | Hash/number |

### Nav

- Logo: "Coun*trivo*" — DM Serif, italic gold on "trivo"
- Right: "Games" and "Explore" text links (Inter 13px 500, muted cream)
- Mobile: same, no hamburger — just 2 links is enough

### Homepage Structure (above the fold on 390px)

1. Nav
2. Hero: "Today's challenge" overline (gold) → "Country Draft" (DM Serif 30px) → 1-line description → "Play today →" button
3. Thin gold divider
4. "Versus" + "Live" dot header
5. 3 VS cards (Supremacy, Borderline, Blitz)
6. Join code input row
7. "Solo" header + flat list of 8 games

---

## 2. Multiplayer Architecture (Supabase)

### Infrastructure

- **Supabase project** for: Realtime (game rooms), Database (session tracking, game results), Edge Functions (room creation)
- **No auth required** — anonymous sessions via `supabase.auth.signInAnonymously()`
- **Room system**: 4-character alphanumeric codes, stored in `game_rooms` table
- **Realtime**: Supabase Realtime Channels (Broadcast) for game state sync

### Database Schema

```sql
-- Rooms for multiplayer games
create table game_rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,        -- 4-char room code
  game_type text not null,           -- 'supremacy' | 'borderline' | 'blitz'
  status text not null default 'waiting', -- 'waiting' | 'playing' | 'finished'
  seed bigint not null,              -- shared RNG seed
  player_count int not null default 1,
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '30 minutes'
);

-- Session tracking (anonymous)
create table sessions (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text not null,        -- from supabase anon auth
  started_at timestamptz default now(),
  last_active timestamptz default now(),
  user_agent text,
  country text                       -- from edge function geo
);

-- Game results (solo + multiplayer)
create table game_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id),
  game_slug text not null,
  mode text not null,                -- 'daily' | 'practice' | 'versus'
  score int not null,
  max_score int,
  room_id uuid references game_rooms(id),
  played_at timestamptz default now()
);
```

### Multiplayer Flow

1. **Player 1** clicks "Create" on a VS game → calls Supabase Edge Function → generates room code + seed → returns code
2. **Player 1** sees room code + "Share link" button (copies `countrivo.com/vs/XXXX`)
3. **Player 2** enters code or opens link → joins room via Realtime channel
4. Both players subscribe to channel `room:{code}`
5. When `player_count === 2`, server broadcasts `game:start` with shared seed
6. During game: each player broadcasts their moves/progress
7. On finish: both see results side-by-side ("You" vs "Them")

### Realtime Messages

```typescript
type RealtimeMessage =
  | { type: 'player:joined' }
  | { type: 'game:start'; seed: number }
  | { type: 'move'; payload: GameMove }
  | { type: 'progress'; step: number; score: number }
  | { type: 'finished'; score: number; details: Record<string, unknown> }
```

---

## 3. Three New Multiplayer Games

### 3a. Supremacy (Stat Battle)

**Concept**: Top Trumps with country cards. Strategic bluffing.

**Flow**:
1. Both players get 5 hidden country cards (same pool, shuffled differently per player)
2. Each round: the "attacker" (alternating) picks a stat category
3. Both players reveal their top card's value in that stat
4. Higher value wins the round, winner keeps both cards
5. 5 rounds → whoever won more rounds wins

**Data**: Uses existing `getStatValue(iso3, categorySlug)` and `getAllCategories()`

**Key UI**: Card hand at bottom, stat picker, opponent's card face-down, reveal animation

**Keyboard**: Number keys 1-5 to pick stat category

### 3b. Borderline (Border Race)

**Concept**: Race from country A to country B through bordering countries.

**Flow**:
1. Both players see: Start country + Target country
2. Player types a bordering country name → if valid border, moves there
3. Repeat until reaching target
4. First player to reach target wins
5. Both see opponent's step count in real-time (not their path)

**Data**: Uses `bordersData` (Record<string, string[]>), `getAllCountries()` for name matching

**Key UI**: Current country (big flag), path history, text input with autocomplete, opponent step counter

**Keyboard**: Type country name, Enter to submit, Tab for autocomplete suggestion

### 3c. Blitz (Flag Speed)

**Concept**: See a flag, type the country name. First correct answer wins the point.

**Flow**:
1. 10 rounds
2. Each round: same flag shown to both players simultaneously
3. Both type the country name — first correct submission wins the round
4. 1.5s pause between rounds
5. Most round wins → game winner

**Data**: Uses `getAllCountries()` for flags and name matching (with fuzzy: "USA" = "United States")

**Key UI**: Big flag centered, text input below, round counter, score comparison

**Keyboard**: Fully keyboard-driven — just type and Enter

---

## 4. Keyboard Support (All Games)

Every game gets keyboard bindings. Pattern: `useEffect` with `addEventListener('keydown')` in each board component.

| Game | Keys |
|------|------|
| Flag Quiz | 1/2/3/4 for options, Enter for next |
| Higher or Lower | Up arrow = Higher, Down arrow = Lower |
| Capital Match | 1/2/3/4 for options |
| Population Sort | Up/Down to select country, Space to swap, Enter to submit |
| Country Streak | 1/2/3/4 for options |
| Speed Flags | 1/2 for left/right option |
| Odd One Out | 1/2/3/4 for options |
| Border Buddies | Type to search, Enter to select |
| Continent Sprint | 1/2/3/4 for options |
| Stat Guesser | Already has Enter key support |
| Country Draft | Click only (drag assignment) — add number keys for category selection |

### Implementation

Shared hook: `useGameKeys(keymap: Record<string, () => void>, enabled: boolean)`

```typescript
export function useGameKeys(keymap: Record<string, () => void>, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      const fn = keymap[e.key];
      if (fn) { e.preventDefault(); fn(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [keymap, enabled]);
}
```

---

## 5. Mobile Playability

- **Touch targets**: minimum 44px on all interactive elements
- **No hover-dependent UI**: all hover states also work via active/focus
- **Input handling for Blitz/Borderline**: auto-focus text input, auto-capitalize off, autocorrect off
- **Haptic feedback**: use `navigator.vibrate(10)` on correct/incorrect answers (where supported)
- **Swipe support for Population Sort**: swipe up/down to reorder instead of button clicks
- **Safe area padding**: respect `env(safe-area-inset-bottom)` on game controls

---

## 6. Session & Usage Tracking

- Initialize Supabase client on app load
- Call `signInAnonymously()` once, store session in React context
- Track: page views, game starts, game completions, multiplayer room joins
- Use `game_results` table for all completed games (replaces localStorage for daily tracking)
- Keep localStorage as fallback for offline play

---

## Verification Plan

1. **Design**: Visual review at 390px, 768px, 1440px viewports
2. **Keyboard**: Tab through every game, verify all keybindings work
3. **Multiplayer**: Open 2 browser tabs, create room in one, join in other, play full game
4. **Mobile**: Test on iOS Safari (touch targets, safe area, input focus)
5. **Supabase**: Verify room creation, realtime sync, result persistence
6. **Build**: `npm run build` passes with 0 errors, all pages generate
7. **Lighthouse**: Score >90 on Performance, Accessibility, SEO

---

## Files to Modify/Create

### New files
- `src/lib/supabase/client.ts` — Supabase client init
- `src/lib/supabase/rooms.ts` — Room CRUD + realtime helpers
- `src/hooks/use-game-keys.ts` — Shared keyboard hook
- `src/hooks/use-multiplayer.ts` — Realtime room hook
- `src/app/vs/[code]/page.tsx` — Room join page
- `src/app/games/supremacy/` — Landing + play pages
- `src/app/games/borderline/` — Landing + play pages
- `src/app/games/blitz/` — Landing + play pages
- `src/components/games/supremacy/` — Board component
- `src/components/games/borderline/` — Board component
- `src/components/games/blitz/` — Board component
- `src/lib/game-logic/supremacy/engine.ts`
- `src/lib/game-logic/borderline/engine.ts`
- `src/lib/game-logic/blitz/engine.ts`
- `src/components/icons/` — All custom SVG icon components

### Modified files
- `src/app/globals.css` — New design system (colors, fonts, tokens)
- `src/app/layout.tsx` — New nav, footer, font imports
- `src/app/page.tsx` — New homepage with hero/VS/solo structure
- `src/components/layout/header.tsx` — New nav design
- `src/components/game/game-shell.tsx` — Updated to new design
- `src/components/game/game-over-screen.tsx` — Updated design
- `src/components/game/game-landing.tsx` — Updated design
- All 11 existing board components — Add keyboard support via `useGameKeys`
- `src/data/game-registry.json` — Add 3 new games
- `src/app/sitemap.ts` — Add new routes
- `package.json` — Add `@supabase/supabase-js`
