# Countrivo Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Countrivo from a solo client-side geography game into a multiplayer platform with real-time VS games, a distinctive "Explorer" design system, keyboard support, and Supabase backend.

**Architecture:** Supabase provides anonymous auth + Realtime Channels for multiplayer room sync + Postgres for session/result tracking. Games keep their pure `useReducer` state machines — multiplayer wraps them with a `useMultiplayer` hook that broadcasts moves via Supabase Realtime. The new "Explorer" design system (forest green/gold/cream, DM Serif + Inter, custom SVG line icons, topo background) replaces the current amber/indigo theme.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS 4, Supabase (Realtime + Postgres + Auth), TypeScript

**Spec:** `docs/superpowers/specs/2026-03-31-multiplayer-design-revamp-design.md`
**Mockup:** `.superpowers/brainstorm/40888-1774973896/content/explorer-v3.html`

---

## Phase 1: Design System Foundation

### Task 1: Install Fonts and Update Layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update font imports in layout.tsx**

Replace the Geist font imports with DM Serif Display + Inter from `next/font/google`:

```tsx
import { DM_Serif_Display, Inter } from "next/font/google";

const serif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
```

Update the `<body>` className to use the new font variables:
```tsx
<body className={`${serif.variable} ${sans.variable} font-sans ...`}>
```

Remove the old `geistSans` and `geistMono` imports.

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | head -5`
Expected: `Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: swap fonts to DM Serif Display + Inter"
```

---

### Task 2: Rewrite Design Tokens in globals.css

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace all CSS custom properties**

Replace the entire `:root` / `@theme` block. New tokens:

```css
@theme {
  /* Typography */
  --font-sans: var(--font-sans);
  --font-serif: var(--font-serif);

  /* Explorer palette — 3 colors only */
  --color-bg: #0b140a;
  --color-surface: #132011;
  --color-surface-elevated: #1a2d18;
  --color-gold: #c9a44c;
  --color-gold-bright: #e8c96e;
  --color-gold-dim: rgba(201,164,76,0.12);
  --color-cream: #e6dec5;
  --color-cream-muted: rgba(230,222,197,0.55);
  --color-cream-ghost: rgba(230,222,197,0.18);
  --color-border: rgba(201,164,76,0.13);
  --color-border-hover: rgba(201,164,76,0.35);

  /* Game feedback (keep) */
  --color-correct: #16a34a;
  --color-correct-light: #dcfce7;
  --color-incorrect: #dc2626;
  --color-incorrect-light: #fef2f2;

  /* Radius — varied, not consistent */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 10px;
  --radius-xl: 14px;

  /* Motion */
  --ease-game: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
}
```

- [ ] **Step 2: Update body and base styles**

```css
body {
  background-color: var(--color-bg);
  color: var(--color-cream);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 3: Update utility classes**

Replace `.game-card` hover effect:
```css
.game-card {
  border-radius: var(--radius-lg);
  transition: border-color 0.2s, transform 0.2s;
}
.game-card:hover {
  border-color: var(--color-border-hover);
  transform: translateY(-1px);
}
```

Update `:focus-visible`:
```css
:focus-visible {
  outline: 2px solid var(--color-gold);
  outline-offset: 2px;
}
```

Keep animation keyframes (`fade-in`, `slide-up`, `scale-in`) but remove `shimmer`, `float-slow`, `float-medium`, `pulse-glow`. Add:
```css
@keyframes pulse {
  0%  { box-shadow: 0 0 0 0 rgba(201,164,76,0.6); }
  70% { box-shadow: 0 0 0 7px rgba(201,164,76,0); }
  100%{ box-shadow: 0 0 0 0 rgba(201,164,76,0); }
}

@keyframes topo-breathe {
  0%, 100% { opacity: 0; }
  50% { opacity: 0.3; }
}
```

- [ ] **Step 4: Remove all references to old color tokens**

Search and remove: `--color-brand`, `--color-brand-light`, `--color-brand-dark`, `--color-brand-subtle`, `--color-accent`, `--color-accent-light`, `--color-accent-dark`, `--color-surface-inverse`, `--color-surface-dark`, `--color-text`, `--color-text-secondary`, `--color-text-muted`, `--color-text-inverse`, `--color-gold` (old medal), `--color-silver`, `--color-bronze`.

- [ ] **Step 5: Build and fix any missing token references**

Run: `npm run build 2>&1 | grep -i error | head -20`

Any component referencing old tokens (like `text-brand`, `bg-surface-muted`) needs updating. Do a global find-and-replace:
- `text-brand` → `text-gold`
- `bg-brand` → `bg-gold`
- `bg-surface` → `bg-surface`
- `text-text` → `text-cream`
- `text-text-muted` → `text-cream-muted`
- `text-text-secondary` → `text-cream-muted`
- `border-border` → `border-border`
- `bg-surface-muted` → `bg-surface`

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: rewrite design system to Explorer theme (forest/gold/cream)"
```

---

### Task 3: Create SVG Icon Components

**Files:**
- Create: `src/components/icons/index.tsx`

- [ ] **Step 1: Create all icon components in a single file**

Each icon: 24x24 viewBox, `stroke="currentColor"`, `strokeWidth={1.5}`, `strokeLinecap="round"`, `strokeLinejoin="round"`, `fill="none"`. Accept `className` prop.

```tsx
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      width={24} height={24} {...props}>
      {children}
    </svg>
  );
}

export function IconTarget(props: IconProps) {
  return <Icon {...props}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></Icon>;
}

export function IconScale(props: IconProps) {
  return <Icon {...props}><path d="M12 3v18"/><path d="M4 7l8-4 8 4"/><path d="M4 7l-1 6c0 1.1 2 2 3 2s3-.9 3-2L8 7"/><path d="M16 7l-1 6c0 1.1 2 2 3 2s3-.9 3-2L20 7"/></Icon>;
}

export function IconPath(props: IconProps) {
  return <Icon {...props}><circle cx="5" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 6h4c2 0 3 1 3 3v6c0 2 1 3 3 3h2"/></Icon>;
}

export function IconBolt(props: IconProps) {
  return <Icon {...props}><path d="M13 2L4.5 13H12l-1 9 8.5-11H12l1-9z"/></Icon>;
}

export function IconFlag(props: IconProps) {
  return <Icon {...props}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></Icon>;
}

export function IconChevronDouble(props: IconProps) {
  return <Icon {...props}><polyline points="18 15 12 9 6 15"/><polyline points="18 20 12 14 6 20"/></Icon>;
}

export function IconBars(props: IconProps) {
  return <Icon {...props}><rect x="3" y="10" width="4" height="11" rx="1"/><rect x="10" y="5" width="4" height="16" rx="1"/><rect x="17" y="2" width="4" height="19" rx="1"/></Icon>;
}

export function IconPin(props: IconProps) {
  return <Icon {...props}><path d="M12 22c-4 0-8-6-8-12a8 8 0 1 1 16 0c0 6-4 12-8 12z"/><path d="M8 10c0-2 2-4 4-4"/></Icon>;
}

export function IconCheck(props: IconProps) {
  return <Icon {...props}><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></Icon>;
}

export function IconClock(props: IconProps) {
  return <Icon {...props}><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></Icon>;
}

export function IconSearch(props: IconProps) {
  return <Icon {...props}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></Icon>;
}

export function IconChain(props: IconProps) {
  return <Icon {...props}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></Icon>;
}

export function IconGlobe(props: IconProps) {
  return <Icon {...props}><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></Icon>;
}

export function IconHash(props: IconProps) {
  return <Icon {...props}><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></Icon>;
}

export function IconArrowRight(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      width={16} height={16} {...props}>
      <path d="M6 4l4 4-4 4"/>
    </svg>
  );
}
```

- [ ] **Step 2: Build to verify**

Run: `npm run build 2>&1 | head -5`

- [ ] **Step 3: Commit**

```bash
git add src/components/icons/index.tsx
git commit -m "feat: add custom SVG line icon components"
```

---

### Task 4: Topo Background Component

**Files:**
- Create: `src/components/layout/topo-bg.tsx`

- [ ] **Step 1: Create the topo background SVG component**

```tsx
export function TopoBg() {
  return (
    <svg
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      viewBox="0 0 430 1200"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="topo-vfade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity={0} />
          <stop offset="15%" stopColor="white" stopOpacity={0.8} />
          <stop offset="40%" stopColor="white" stopOpacity={1} />
          <stop offset="70%" stopColor="white" stopOpacity={0.5} />
          <stop offset="100%" stopColor="white" stopOpacity={0} />
        </linearGradient>
        <mask id="topo-mask">
          <rect width="430" height="1200" fill="url(#topo-vfade)" />
        </mask>
      </defs>
      <g mask="url(#topo-mask)" opacity={0.14} stroke="#c9a44c" fill="none">
        <path d="M-20,180 Q110,140 220,170 Q330,200 450,165" strokeWidth={0.6} />
        <path d="M-20,210 Q110,175 220,200 Q330,228 450,198" strokeWidth={0.6} />
        <path d="M-20,240 Q110,208 220,232 Q330,256 450,228" strokeWidth={0.8} />
        <path d="M-20,270 Q110,241 220,262 Q330,284 450,258" strokeWidth={0.6} />
        <path d="M-20,300 Q110,274 220,293 Q330,312 450,288" strokeWidth={0.8} />
        <path d="M-20,330 Q110,307 220,323 Q330,340 450,318" strokeWidth={0.6} />
        <path d="M-20,360 Q110,340 220,353 Q330,368 450,348" strokeWidth={0.6} />
        <path d="M-20,390 Q110,373 220,384 Q330,396 450,378" strokeWidth={0.6} />
        <path d="M-20,500 Q110,483 220,495 Q330,508 450,490" strokeWidth={0.6} />
        <path d="M-20,530 Q110,515 220,525 Q330,536 450,520" strokeWidth={0.6} />
        <path d="M-20,700 Q110,688 220,696 Q330,706 450,692" strokeWidth={0.6} />
        <path d="M-20,730 Q110,718 220,726 Q330,736 450,722" strokeWidth={0.6} />
      </g>
      {/* Single breathing highlight line */}
      <path
        d="M-20,270 Q110,241 220,262 Q330,284 450,258"
        stroke="#c9a44c" strokeWidth={0.5} fill="none" opacity={0}
        mask="url(#topo-mask)"
      >
        <animate attributeName="opacity" values="0;0.3;0" dur="8s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}
```

- [ ] **Step 2: Add TopoBg to root layout**

In `src/app/layout.tsx`, import and render `<TopoBg />` as the first child inside `<body>`, before the Header.

- [ ] **Step 3: Build and verify**

Run: `npm run build 2>&1 | head -5`

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/topo-bg.tsx src/app/layout.tsx
git commit -m "feat: add topo background SVG with breathing animation"
```

---

### Task 5: Update Header to Explorer Design

**Files:**
- Modify: `src/components/layout/header.tsx`

- [ ] **Step 1: Rewrite header component**

Replace the entire header with the Explorer nav:

```tsx
"use client";

import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-bg/80">
      <nav className="max-w-[430px] mx-auto flex items-center justify-between px-5 py-4">
        <Link href="/" className="font-serif text-xl text-cream tracking-tight">
          Coun<em className="text-gold not-italic">trivo</em>
        </Link>
        <div className="flex gap-5">
          <Link href="/games" className="text-sm font-medium text-cream-muted hover:text-cream transition-colors">
            Games
          </Link>
          <Link href="/countries" className="text-sm font-medium text-cream-muted hover:text-cream transition-colors">
            Explore
          </Link>
        </div>
      </nav>
    </header>
  );
}
```

No hamburger menu — 2 links is enough.

- [ ] **Step 2: Build and verify**

Run: `npm run build 2>&1 | head -5`

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/header.tsx
git commit -m "feat: update header to Explorer design (serif logo, 2 nav links)"
```

---

### Task 6: Rewrite Homepage

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Rewrite homepage with Hero → VS → Join → Solo structure**

```tsx
import Link from "next/link";
import { getFlagshipGame, getAllGames } from "@/lib/data/games";
import { IconScale, IconPath, IconBolt, IconFlag, IconChevronDouble, IconBars, IconPin, IconCheck, IconClock, IconSearch, IconChain, IconGlobe, IconTarget, IconArrowRight } from "@/components/icons";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Countrivo — Geography Games & Country Quizzes",
  description: "14 free geography games. Flag quizzes, country ranking games, real-time multiplayer. Daily challenges, no account needed.",
};

const GAME_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  "country-draft": IconTarget,
  "flag-quiz": IconFlag,
  "higher-or-lower": IconChevronDouble,
  "capital-match": IconCheck,
  "population-sort": IconBars,
  "country-streak": IconPin,
  "border-buddies": IconChain,
  "continent-sprint": IconGlobe,
  "stat-guesser": IconHash,
  "speed-flags": IconClock,
  "odd-one-out": IconSearch,
  "supremacy": IconScale,
  "borderline": IconPath,
  "blitz": IconBolt,
};

export default function HomePage() {
  const flagship = getFlagshipGame();
  const soloGames = getAllGames().filter(g => !["supremacy","borderline","blitz"].includes(g.slug) && !g.isFlagship);

  return (
    <div className="relative z-1 max-w-[430px] mx-auto px-5 pb-12">
      {/* Hero */}
      <section className="mt-6 mb-8">
        <p className="text-xs font-semibold text-gold tracking-wide mb-3">Today&apos;s challenge</p>
        <h1 className="font-serif text-[30px] text-cream tracking-tight leading-none mb-2">
          {flagship.title}
        </h1>
        <p className="text-sm text-cream-muted leading-relaxed mb-6">{flagship.description}</p>
        <Link
          href={`${flagship.route}/play?mode=daily`}
          className="inline-flex items-center gap-2.5 bg-gold text-bg text-[13px] font-bold tracking-wide px-5 py-3 rounded-md hover:opacity-90 transition-opacity"
        >
          Play today
          <IconArrowRight className="w-3.5 h-3.5" />
        </Link>
      </section>

      {/* Divider */}
      <div className="h-px bg-border mb-7" />

      {/* Versus */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[13px] font-bold text-cream tracking-wide">Versus</h2>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-gold animate-[pulse_2.5s_ease-out_infinite]" />
            <span className="text-[11px] font-semibold text-gold">Live</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          {[
            { slug: "supremacy", name: "Supremacy", desc: "Outplay your opponent with hidden country cards" },
            { slug: "borderline", name: "Borderline", desc: "Race through borders to reach the target country" },
            { slug: "blitz", name: "Blitz", desc: "See a flag, type the country. First correct answer wins." },
          ].map((game) => {
            const GameIcon = GAME_ICONS[game.slug]!;
            return (
              <Link
                key={game.slug}
                href={`/games/${game.slug}`}
                className="flex items-center gap-3.5 px-4 py-3.5 bg-surface/70 border border-border rounded-lg hover:border-border-hover transition-colors"
              >
                <GameIcon className="w-[22px] h-[22px] text-gold shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-[17px] text-cream leading-none">{game.name}</div>
                  <div className="text-xs text-cream-muted mt-1 truncate">{game.desc}</div>
                </div>
                <IconArrowRight className="w-4 h-4 text-cream-muted shrink-0" />
              </Link>
            );
          })}
        </div>

        {/* Join code */}
        <div className="flex items-center gap-2.5 mt-3 px-4 py-3 bg-surface/40 border border-border rounded-lg">
          <span className="text-xs text-cream-muted">Code</span>
          <input
            type="text"
            maxLength={4}
            placeholder="_ _ _ _"
            spellCheck={false}
            autoComplete="off"
            className="flex-1 bg-transparent border-none outline-none text-base font-semibold tracking-[6px] text-cream uppercase placeholder:text-cream-ghost"
          />
          <Link
            href="#"
            className="text-xs font-bold text-gold border border-gold-dim px-3 py-1.5 rounded-md hover:border-border-hover transition-colors"
          >
            Join
          </Link>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-border my-5" />

      {/* Solo */}
      <section>
        <h2 className="text-[13px] font-bold text-cream tracking-wide mb-3">Solo</h2>
        <div className="flex flex-col">
          {soloGames.map((game) => {
            const GameIcon = GAME_ICONS[game.slug] ?? IconTarget;
            return (
              <Link
                key={game.slug}
                href={game.route}
                className="flex items-center gap-3.5 py-3 border-b border-border/60 last:border-b-0 hover:text-gold transition-colors group"
              >
                <GameIcon className="w-[18px] h-[18px] text-gold shrink-0" />
                <span className="text-sm font-semibold text-cream flex-1 group-hover:text-gold transition-colors">
                  {game.title}
                </span>
                <span className="text-[11px] text-cream-muted">{game.difficulty}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Build and fix any issues**

Run: `npm run build 2>&1 | grep -i error | head -20`

Fix any Tailwind class name issues (the new token names from Task 2).

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: rewrite homepage with Explorer design (hero, VS, solo)"
```

---

### Task 7: Update Shared Game Components

**Files:**
- Modify: `src/components/game/game-shell.tsx`
- Modify: `src/components/game/game-over-screen.tsx`
- Modify: `src/components/game/game-landing.tsx`

- [ ] **Step 1: Update GameShell**

Replace old color tokens with new ones. Change `text-brand` to `text-gold`, `bg-brand/10` to `bg-gold-dim`, etc.

- [ ] **Step 2: Update GameOverScreen**

Same token replacement. Replace emoji in suggested games section with SVG icon components. Import from `@/components/icons`.

- [ ] **Step 3: Update GameLanding**

Replace emoji icon display with SVG icons. Update color tokens. Remove any `text-brand`/`bg-brand` references.

- [ ] **Step 4: Build and verify**

Run: `npm run build 2>&1 | head -5`

- [ ] **Step 5: Commit**

```bash
git add src/components/game/
git commit -m "feat: update shared game components to Explorer design"
```

---

### Task 8: Update Footer

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Rewrite footer in layout.tsx**

Update footer colors from old palette to new. Replace `text-text-muted` → `text-cream-muted`, `border-border` → `border-border`, `text-brand` → `text-gold`. Keep the same 4-column link structure.

- [ ] **Step 2: Build and verify**

Run: `npm run build 2>&1 | head -5`

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: update footer to Explorer design tokens"
```

---

### Task 9: Global Token Migration — Fix Remaining Pages

**Files:**
- Modify: all files referencing old color tokens

- [ ] **Step 1: Find all remaining old token references**

Run grep for old token names across `src/`:
```bash
grep -r "text-brand\|bg-brand\|text-text\b\|bg-surface-muted\|text-text-muted\|text-text-secondary\|border-brand\|bg-surface-elevated" src/ --include="*.tsx" --include="*.ts" -l
```

- [ ] **Step 2: Batch replace in each file**

For each file found:
- `text-brand` → `text-gold`
- `bg-brand` → `bg-gold`
- `hover:bg-brand-dark` → `hover:opacity-90`
- `text-text-muted` → `text-cream-muted`
- `text-text-secondary` → `text-cream-muted`
- `text-text` → `text-cream`
- `bg-surface-muted` → `bg-surface`
- `bg-surface-elevated` → `bg-surface-elevated`
- `border-brand` → `border-gold`
- `border-brand/30` → `border-border`

- [ ] **Step 3: Build to verify zero errors**

Run: `npm run build 2>&1 | tail -5`
Expected: `Compiled successfully` + all pages generate

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "fix: migrate all remaining pages to Explorer design tokens"
```

**CHECKPOINT: Review Phase 1. All pages should render in the new forest/gold/cream theme.**

---

## Phase 2: Keyboard Support

### Task 10: Create useGameKeys Hook

**Files:**
- Create: `src/hooks/use-game-keys.ts`

- [ ] **Step 1: Create the hook**

```tsx
"use client";
import { useEffect } from "react";

export function useGameKeys(
  keymap: Record<string, () => void>,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      const fn = keymap[e.key];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [keymap, enabled]);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-game-keys.ts
git commit -m "feat: add useGameKeys shared keyboard hook"
```

---

### Task 11: Add Keyboard to Flag Quiz

**Files:**
- Modify: `src/components/games/flag-quiz/flag-quiz-board.tsx`

- [ ] **Step 1: Import and wire up keyboard**

Add at the top:
```tsx
import { useGameKeys } from "@/hooks/use-game-keys";
```

Inside the component, after the `useReducer` call, add:
```tsx
const keymap = useMemo(() => {
  if (state.phase === "answered") {
    return { Enter: () => dispatch({ type: "NEXT" }) };
  }
  const map: Record<string, () => void> = {};
  ["1", "2", "3", "4"].forEach((key, i) => {
    if (i < state.questions[state.currentQuestion].options.length) {
      map[key] = () => handleAnswer(i);
    }
  });
  return map;
}, [state.phase, state.currentQuestion, handleAnswer]);

useGameKeys(keymap, state.phase !== "results");
```

Also add `useMemo` to imports from React.

- [ ] **Step 2: Build and verify**

Run: `npm run build 2>&1 | head -5`

- [ ] **Step 3: Commit**

```bash
git add src/components/games/flag-quiz/flag-quiz-board.tsx
git commit -m "feat: add keyboard support to Flag Quiz (1-4, Enter)"
```

---

### Task 12: Add Keyboard to All Remaining Games

**Files:**
- Modify: `src/components/games/higher-or-lower/hol-board.tsx`
- Modify: `src/components/games/capital-match/capital-board.tsx`
- Modify: `src/components/games/country-streak/streak-board.tsx`
- Modify: `src/components/games/speed-flags/speed-board.tsx`
- Modify: `src/components/games/odd-one-out/odd-board.tsx`
- Modify: `src/components/games/continent-sprint/sprint-board.tsx`
- Modify: `src/components/games/population-sort/sort-board.tsx`
- Modify: `src/components/games/country-draft/draft-board.tsx`

- [ ] **Step 1: Higher or Lower — ArrowUp/ArrowDown**

Import `useGameKeys` and `useMemo`. Add:
```tsx
const keymap = useMemo(() => ({
  ArrowUp: () => handleGuess("higher"),
  ArrowDown: () => handleGuess("lower"),
}), [handleGuess]);

useGameKeys(keymap, state.phase !== "gameover" && !showReveal);
```

- [ ] **Step 2: Capital Match, Country Streak, Odd One Out, Continent Sprint — 1/2/3/4**

Same pattern as Flag Quiz Task 11. Each uses 1/2/3/4 for option selection and Enter for next.

- [ ] **Step 3: Speed Flags — 1/2**

```tsx
const keymap = useMemo(() => ({
  "1": () => handleAnswer(0),
  "2": () => handleAnswer(1),
}), [handleAnswer]);

useGameKeys(keymap, state.phase === "playing");
```

- [ ] **Step 4: Population Sort — ArrowUp/ArrowDown/Space/Enter**

```tsx
const [selectedIdx, setSelectedIdx] = useState(0);

const keymap = useMemo(() => ({
  ArrowUp: () => setSelectedIdx(i => Math.max(0, i - 1)),
  ArrowDown: () => setSelectedIdx(i => Math.min(state.countries.length - 1, i + 1)),
  " ": () => handleSwapUp(selectedIdx),
  Enter: () => handleSubmit(),
}), [selectedIdx, state.countries.length, handleSwapUp, handleSubmit]);

useGameKeys(keymap, state.phase === "sorting");
```

Add visual highlight on the `selectedIdx` item.

- [ ] **Step 5: Country Draft — number keys for category**

```tsx
const keymap = useMemo(() => {
  const map: Record<string, () => void> = {};
  state.availableCategories.forEach((cat, i) => {
    map[String(i + 1)] = () => handleAssign(cat.slug);
  });
  return map;
}, [state.availableCategories, handleAssign]);

useGameKeys(keymap, state.phase === "playing");
```

- [ ] **Step 6: Build and verify all**

Run: `npm run build 2>&1 | tail -5`
Expected: `Compiled successfully`

- [ ] **Step 7: Commit**

```bash
git add src/components/games/
git commit -m "feat: add keyboard support to all 11 games"
```

**CHECKPOINT: Review Phase 2. Every game should be playable with keyboard.**

---

## Phase 3: Supabase Infrastructure

### Task 13: Install Supabase and Create Client

**Files:**
- Modify: `package.json`
- Create: `src/lib/supabase/client.ts`
- Create: `.env.local`

- [ ] **Step 1: Install Supabase**

```bash
npm install @supabase/supabase-js
```

- [ ] **Step 2: Create .env.local**

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

- [ ] **Step 3: Create Supabase client**

```tsx
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/client.ts package.json package-lock.json
git commit -m "feat: add Supabase client setup"
```

---

### Task 14: Database Schema Migration

**Files:**
- Create: `supabase/migrations/001_initial.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- Room system for multiplayer
create table game_rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  game_type text not null,
  status text not null default 'waiting',
  seed bigint not null,
  player_count int not null default 1,
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '30 minutes'
);

-- Index for fast code lookup
create index idx_game_rooms_code on game_rooms(code);

-- Auto-cleanup expired rooms
create index idx_game_rooms_expires on game_rooms(expires_at);

-- Session tracking
create table sessions (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text not null,
  started_at timestamptz default now(),
  last_active timestamptz default now(),
  user_agent text,
  country text
);

-- Game results
create table game_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id),
  game_slug text not null,
  mode text not null,
  score int not null,
  max_score int,
  room_id uuid references game_rooms(id),
  played_at timestamptz default now()
);

create index idx_game_results_session on game_results(session_id);
create index idx_game_results_slug on game_results(game_slug);

-- Enable realtime on game_rooms
alter publication supabase_realtime add table game_rooms;

-- RLS policies
alter table game_rooms enable row level security;
alter table sessions enable row level security;
alter table game_results enable row level security;

-- Allow anonymous access to rooms
create policy "Anyone can read rooms" on game_rooms for select using (true);
create policy "Anyone can insert rooms" on game_rooms for insert with check (true);
create policy "Anyone can update rooms" on game_rooms for update using (true);

-- Sessions: users can only see their own
create policy "Users can insert sessions" on sessions for insert with check (true);
create policy "Users can read own sessions" on sessions for select using (anonymous_id = auth.jwt() ->> 'sub');

-- Results: users can insert, read all (for leaderboards)
create policy "Anyone can insert results" on game_results for insert with check (true);
create policy "Anyone can read results" on game_results for select using (true);
```

- [ ] **Step 2: Apply migration via Supabase MCP or dashboard**

Use the Supabase MCP tool `apply_migration` to run this SQL.

- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add Supabase schema (rooms, sessions, results)"
```

---

### Task 15: Room System and Multiplayer Hook

**Files:**
- Create: `src/lib/supabase/rooms.ts`
- Create: `src/hooks/use-multiplayer.ts`

- [ ] **Step 1: Create room CRUD helpers**

```tsx
import { supabase } from "./client";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createRoom(gameType: string) {
  const code = generateCode();
  const seed = Math.floor(Math.random() * 2147483647);

  const { data, error } = await supabase
    .from("game_rooms")
    .insert({ code, game_type: gameType, seed, status: "waiting", player_count: 1 })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function joinRoom(code: string) {
  const { data, error } = await supabase
    .from("game_rooms")
    .select()
    .eq("code", code.toUpperCase())
    .eq("status", "waiting")
    .single();

  if (error || !data) throw new Error("Room not found");

  await supabase
    .from("game_rooms")
    .update({ player_count: 2, status: "playing" })
    .eq("id", data.id);

  return data;
}

export async function getRoomByCode(code: string) {
  const { data } = await supabase
    .from("game_rooms")
    .select()
    .eq("code", code.toUpperCase())
    .single();
  return data;
}
```

- [ ] **Step 2: Create useMultiplayer hook**

```tsx
"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Message = { type: string; [key: string]: unknown };

export function useMultiplayer(roomCode: string | null) {
  const [connected, setConnected] = useState(false);
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!roomCode) return;

    const channel = supabase.channel(`room:${roomCode}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "game" }, ({ payload }) => {
        setMessages((prev) => [...prev, payload as Message]);
        if (payload.type === "player:joined") setOpponentJoined(true);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
          channel.send({ type: "broadcast", event: "game", payload: { type: "player:joined" } });
        }
      });

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [roomCode]);

  const send = useCallback((message: Message) => {
    channelRef.current?.send({ type: "broadcast", event: "game", payload: message });
  }, []);

  const lastMessage = messages[messages.length - 1] ?? null;

  return { connected, opponentJoined, messages, lastMessage, send };
}
```

- [ ] **Step 3: Build and verify**

Run: `npm run build 2>&1 | head -5`

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/rooms.ts src/hooks/use-multiplayer.ts
git commit -m "feat: add room system and useMultiplayer hook"
```

---

### Task 16: VS Join Page

**Files:**
- Create: `src/app/vs/[code]/page.tsx`

- [ ] **Step 1: Create the room join/waiting page**

```tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRoomByCode } from "@/lib/supabase/rooms";
import { useMultiplayer } from "@/hooks/use-multiplayer";

export default function VsJoinPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const [room, setRoom] = useState<{ game_type: string; seed: number; code: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { connected, opponentJoined } = useMultiplayer(room?.code ?? null);

  useEffect(() => {
    getRoomByCode(params.code)
      .then((r) => { if (r) setRoom(r); else setError("Room not found"); })
      .catch(() => setError("Room not found"));
  }, [params.code]);

  useEffect(() => {
    if (opponentJoined && room) {
      router.push(`/games/${room.game_type}/play?mode=versus&room=${room.code}`);
    }
  }, [opponentJoined, room, router]);

  if (error) {
    return (
      <div className="relative z-1 max-w-[430px] mx-auto px-5 py-20 text-center">
        <p className="text-cream-muted text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative z-1 max-w-[430px] mx-auto px-5 py-20 text-center">
      <div className="w-1.5 h-1.5 rounded-full bg-gold animate-[pulse_2.5s_ease-out_infinite] mx-auto mb-4" />
      <p className="font-serif text-2xl text-cream mb-2">Waiting for opponent</p>
      <p className="text-cream-muted text-sm mb-6">
        Share this code: <span className="font-bold text-gold tracking-widest">{params.code.toUpperCase()}</span>
      </p>
      <p className="text-xs text-cream-ghost">{connected ? "Connected" : "Connecting..."}</p>
    </div>
  );
}
```

- [ ] **Step 2: Build and verify**

Run: `npm run build 2>&1 | head -5`

- [ ] **Step 3: Commit**

```bash
git add src/app/vs/
git commit -m "feat: add VS room join/waiting page"
```

**CHECKPOINT: Review Phase 3. Room creation, joining, and realtime channel should work.**

---

## Phase 4: Supremacy Game

### Task 17: Supremacy Engine

**Files:**
- Create: `src/lib/game-logic/supremacy/engine.ts`

- [ ] **Step 1: Create the game engine**

```tsx
import { seededPick, seededShuffle } from "@/lib/seeded-random";
import { getAllCountries } from "@/lib/data/countries";
import { getAllCategories } from "@/lib/data/categories";
import { getStatValue } from "@/lib/data/ranks";
import type { Country } from "@/types/country";
import type { Category } from "@/types/category";

export interface SupremacyCard {
  country: Country;
  stats: Record<string, number | null>;
}

export interface SupremacyRound {
  attackerCard: SupremacyCard;
  defenderCard: SupremacyCard;
  chosenStat: string | null;
  winner: "attacker" | "defender" | null;
}

export interface SupremacyState {
  phase: "picking" | "reveal" | "results";
  hand: SupremacyCard[];
  opponentHandSize: number;
  categories: Category[];
  currentRound: number;
  rounds: SupremacyRound[];
  myScore: number;
  opponentScore: number;
  isAttacker: boolean;
}

const GOOD_CATS = ["population", "area-km2", "gdp-per-capita", "life-expectancy", "co2-per-capita"];

export function createSupremacy(rng: () => number, isPlayer1: boolean): SupremacyState {
  const allCountries = getAllCountries();
  const allCats = getAllCategories().filter(c => GOOD_CATS.includes(c.slug));
  const categories = seededPick(allCats, 5, rng);
  const pool = seededPick(allCountries, 10, rng);

  const cards: SupremacyCard[] = pool.map(country => ({
    country,
    stats: Object.fromEntries(categories.map(c => [c.slug, getStatValue(country.iso3, c.slug)])),
  }));

  const shuffled = seededShuffle(cards, rng);
  const hand = isPlayer1 ? shuffled.slice(0, 5) : shuffled.slice(5, 10);

  return {
    phase: "picking",
    hand,
    opponentHandSize: 5,
    categories,
    currentRound: 0,
    rounds: [],
    myScore: 0,
    opponentScore: 0,
    isAttacker: isPlayer1,
  };
}

export function pickStat(state: SupremacyState, categorySlug: string): SupremacyState {
  if (state.phase !== "picking" || !state.isAttacker) return state;
  const myCard = state.hand[0];
  return {
    ...state,
    phase: "reveal",
    rounds: [...state.rounds, {
      attackerCard: myCard,
      defenderCard: myCard, // placeholder until opponent reveals
      chosenStat: categorySlug,
      winner: null,
    }],
  };
}

export function resolveRound(
  state: SupremacyState,
  opponentCard: SupremacyCard,
  chosenStat: string
): SupremacyState {
  const myCard = state.hand[0];
  const myVal = myCard.stats[chosenStat] ?? 0;
  const oppVal = opponentCard.stats[chosenStat] ?? 0;
  const winner = myVal >= oppVal ? "attacker" : "defender";
  const iWon = (state.isAttacker && winner === "attacker") || (!state.isAttacker && winner === "defender");

  const newRound: SupremacyRound = {
    attackerCard: state.isAttacker ? myCard : opponentCard,
    defenderCard: state.isAttacker ? opponentCard : myCard,
    chosenStat,
    winner,
  };

  const nextHand = state.hand.slice(1);
  const nextRound = state.currentRound + 1;

  return {
    ...state,
    phase: nextRound >= 5 ? "results" : "picking",
    hand: nextHand,
    opponentHandSize: state.opponentHandSize - 1,
    rounds: [...state.rounds.slice(0, -1), newRound],
    currentRound: nextRound,
    myScore: state.myScore + (iWon ? 1 : 0),
    opponentScore: state.opponentScore + (iWon ? 0 : 1),
    isAttacker: !state.isAttacker,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/game-logic/supremacy/
git commit -m "feat: add Supremacy game engine"
```

---

### Task 18: Supremacy Board + Pages

**Files:**
- Create: `src/components/games/supremacy/supremacy-board.tsx`
- Create: `src/app/games/supremacy/page.tsx`
- Create: `src/app/games/supremacy/play/page.tsx`

- [ ] **Step 1: Create the board component**

A full `useReducer`-based board that integrates with `useMultiplayer`. The board shows the player's hand at the bottom, opponent card face-down, stat picker when attacking, reveal animation, and score. Wire up `send()` and react to `lastMessage` for opponent moves. Use `useGameKeys` for number key stat selection.

This is the most complex component — it should follow the same patterns as `draft-board.tsx` and `hol-board.tsx` but with multiplayer message handling.

- [ ] **Step 2: Create landing page**

Use the `GameLanding` component template with Supremacy-specific content. Set metadata title to "Supremacy — Real-Time Stat Battle".

- [ ] **Step 3: Create play page wrapper**

Same pattern as other play pages: read `mode` from search params, handle `versus` mode by also reading `room` param, render `<SupremacyBoard mode={mode} roomCode={roomCode} />`.

- [ ] **Step 4: Build and verify**

Run: `npm run build 2>&1 | head -10`

- [ ] **Step 5: Commit**

```bash
git add src/components/games/supremacy/ src/app/games/supremacy/
git commit -m "feat: add Supremacy game (board + landing + play pages)"
```

---

## Phase 5: Borderline Game

### Task 19: Borderline Engine

**Files:**
- Create: `src/lib/game-logic/borderline/engine.ts`

- [ ] **Step 1: Create the engine**

The engine needs: `createBorderline(rng)` to pick start/target countries ensuring a valid path exists via `bordersData`, `validateMove(state, countryName)` for fuzzy name matching + border checking, `bfsShortestPath(start, target)` for optimal path calculation.

Import `bordersData` from `@/data/borders.json` and country lookup functions.

- [ ] **Step 2: Commit**

```bash
git add src/lib/game-logic/borderline/
git commit -m "feat: add Borderline game engine with BFS pathfinding"
```

---

### Task 20: Borderline Board + Pages

**Files:**
- Create: `src/components/games/borderline/borderline-board.tsx`
- Create: `src/app/games/borderline/page.tsx`
- Create: `src/app/games/borderline/play/page.tsx`

- [ ] **Step 1: Create the board component**

Text input with autocomplete dropdown (filter countries by border adjacency + text match). Show current country flag, path history, opponent step counter via `useMultiplayer`. Use `useGameKeys` for Enter submit and Tab autocomplete.

- [ ] **Step 2: Create landing and play pages**

Same template patterns as Supremacy.

- [ ] **Step 3: Build and verify**

Run: `npm run build 2>&1 | head -10`

- [ ] **Step 4: Commit**

```bash
git add src/components/games/borderline/ src/app/games/borderline/
git commit -m "feat: add Borderline game (board + landing + play pages)"
```

---

## Phase 6: Blitz Game

### Task 21: Blitz Engine

**Files:**
- Create: `src/lib/game-logic/blitz/engine.ts`

- [ ] **Step 1: Create the engine**

`createBlitz(rng)` generates 10 rounds with random countries. `checkAnswer(state, input)` does fuzzy name matching: lowercase, trim, handle "usa"/"united states"/"us", accented chars, common abbreviations. Returns `{ correct: boolean, country: Country }`.

- [ ] **Step 2: Commit**

```bash
git add src/lib/game-logic/blitz/
git commit -m "feat: add Blitz game engine with fuzzy name matching"
```

---

### Task 22: Blitz Board + Pages

**Files:**
- Create: `src/components/games/blitz/blitz-board.tsx`
- Create: `src/app/games/blitz/page.tsx`
- Create: `src/app/games/blitz/play/page.tsx`

- [ ] **Step 1: Create the board**

Big centered flag, text input below (auto-focused, `autoCapitalize="off"`, `autoCorrect="off"`), score comparison ("You 3 — 2 Them"), round counter. Fully keyboard-driven. Via `useMultiplayer`: on submit, broadcast answer + timestamp; on opponent correct answer, update their score.

- [ ] **Step 2: Create landing and play pages**

- [ ] **Step 3: Build and verify**

Run: `npm run build 2>&1 | head -10`

- [ ] **Step 4: Commit**

```bash
git add src/components/games/blitz/ src/app/games/blitz/
git commit -m "feat: add Blitz game (board + landing + play pages)"
```

**CHECKPOINT: Review Phases 4-6. All 3 VS games should be playable in solo practice mode.**

---

## Phase 7: Polish & Ship

### Task 23: Update Game Registry and Sitemap

**Files:**
- Modify: `src/data/game-registry.json`
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Add 3 new games to registry**

Add to `game-registry.json`:
```json
{
  "slug": "supremacy",
  "title": "Supremacy",
  "shortDescription": "Outplay your opponent with hidden country cards",
  "description": "Each player gets 5 hidden country cards. Take turns picking a stat — higher value wins the round. Strategy and geography knowledge combined.",
  "emoji": "",
  "difficulty": "medium",
  "estimatedTime": "~3 min",
  "category": "strategy",
  "isNew": true,
  "isFlagship": false,
  "availableModes": ["practice", "versus"]
},
{
  "slug": "borderline",
  "title": "Borderline",
  "shortDescription": "Race through borders to reach the target country",
  "description": "Start in one country, reach another by naming bordering countries. Race your opponent — first to arrive wins.",
  "emoji": "",
  "difficulty": "hard",
  "estimatedTime": "~2 min",
  "category": "knowledge",
  "isNew": true,
  "isFlagship": false,
  "availableModes": ["practice", "versus"]
},
{
  "slug": "blitz",
  "title": "Blitz",
  "shortDescription": "See a flag, type the country. First correct answer wins.",
  "description": "10 rounds of flag recognition. Both players type simultaneously — fastest correct answer takes the point.",
  "emoji": "",
  "difficulty": "easy",
  "estimatedTime": "~2 min",
  "category": "speed",
  "isNew": true,
  "isFlagship": false,
  "availableModes": ["practice", "versus"]
}
```

- [ ] **Step 2: Add new routes to sitemap**

In `src/app/sitemap.ts`, add the 3 new game routes + the `/vs/[code]` pattern.

- [ ] **Step 3: Update games page**

In `src/app/games/page.tsx`, add a "Versus" section above the categorized grid showing the 3 VS games with live dot indicator.

- [ ] **Step 4: Build and verify page count**

Run: `npm run build 2>&1 | grep "static pages" | head -1`
Expected: 312+ pages (was 306 + 6 new game pages)

- [ ] **Step 5: Commit**

```bash
git add src/data/game-registry.json src/app/sitemap.ts src/app/games/page.tsx
git commit -m "feat: register 3 VS games, update sitemap and games page"
```

---

### Task 24: Mobile Polish

**Files:**
- Modify: various game board components

- [ ] **Step 1: Audit touch targets**

Check all interactive buttons in game boards are at least 44px tall. Fix any that are smaller by adding `min-h-[44px]`.

- [ ] **Step 2: Add active states**

For all `hover:` states on game buttons, add matching `active:` states for mobile tap feedback.

- [ ] **Step 3: Add safe area padding**

In `game-shell.tsx`, add `pb-[env(safe-area-inset-bottom)]` to the game container for iPhone notch/home indicator.

- [ ] **Step 4: Set input attributes for Blitz/Borderline**

Verify `autoCapitalize="off"` `autoCorrect="off"` `spellCheck={false}` on text inputs.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: mobile polish (touch targets, active states, safe area)"
```

---

### Task 25: Final Build and Deploy

- [ ] **Step 1: Full build**

```bash
npm run build
```

Expected: `Compiled successfully`, 312+ static pages, 0 errors.

- [ ] **Step 2: Set Supabase env vars on Vercel**

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

- [ ] **Step 3: Deploy**

```bash
vercel --prod --yes
```

- [ ] **Step 4: Verify multiplayer in production**

Open 2 browser tabs to production URL. Create a room in one, join in the other. Play a full game.

- [ ] **Step 5: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final polish for production deploy"
```
