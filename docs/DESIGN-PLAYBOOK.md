# Countrivo Design Playbook

The enforceable rulebook for Countrivo: a free daily geography GAME (14 mini-games, streaks, friend leaderboards), Next.js 16 + Tailwind v4, shipped as a native iOS app via Capacitor/WKWebView. Goal: feel like a premium, hand-crafted, native iOS game — never an AI template. Tokens already live in `src/app/globals.css` `@theme`; this playbook makes them law.

---

## 1. Non-Negotiable Rules (audit against real files)

Each rule is checkable. A reviewer agent should be able to point at a component file and a line.

1. **One accent per screen, and it is gold.** Gold (`var(--color-gold)` `#b8860b`) is the single primary accent and applies to at most ONE focal action per screen. Every other interactive element uses surface/neutral tokens. Gold must not appear on text + icon + border + background simultaneously in one view. Chrome (header, bottom tab bar, active tab) is always gold — never a per-game color.

2. **Per-game colors stay on game surfaces only.** The 14 `--game-{slug}-bg/fg` washes (from `getGameColor` in `src/lib/game-logic`/`src/lib/game-colors.ts`) appear only on that game's own screens/cards — never two different game colors in one view, never in global chrome. Always apply via the CSS var (so dark twins flip), never as hardcoded hex in JSX/`style`.

3. **No purple/indigo/violet as accent — including game washes.** No hue in the 260–290° HSL range as a brand/accent. NOTE: `--game-population-sort` (`#ede9fe`/`#4c1d95`) and `--game-stat-guesser` lean violet/magenta — these are tolerated ONLY because they are confined to a single game surface per Rule 2; they must never leak into chrome, CTAs, or shared components. No `linear-gradient(135deg)` blue→purple anywhere.

4. **Two type families, period: SF/Inter for UI, Space Grotesk for display.** Body/UI uses `var(--font-sans)` (Apple system → Inter fallback). Display (hero H1, game titles, big tabular scores, game-over verdicts) uses `var(--font-display)` (Space Grotesk). No third family, no decorative serif, no separate mono. Display headings ≥24px carry `-0.02em` tracking and 600–900 weight.

5. **4px spacing grid, no exceptions.** Every padding/margin/gap is a multiple of 4 from the scale `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`. No `10/14/18/22px`, no arbitrary `p-[17px]`. Internal card padding ≤ the gap between cards (Gestalt proximity).

6. **Radius is contextual, two tokens per layer.** Use the existing tokens by element size: chips/tags/inputs `--radius-sm` (6px); buttons/cards `--radius-md`/`--radius-lg` (8–10px); modals `--radius-xl` (14px); bottom sheets `--radius-2xl` (20px, top corners only). Never apply one radius uniformly to buttons + cards + inputs + chips on the same screen.

7. **Four semantic colors max in game UI.** Green `--color-correct` (#16a34a) = correct/win, red `--color-incorrect` (#dc2626) = wrong/loss, gold = streak/achievement/primary action, plus the one per-game accent. No fifth decorative color. No rainbow-per-card.

8. **Three text levels by opacity, not new colors.** Primary text `--color-cream` (100%), secondary `--color-cream-muted` (~62%), disabled/placeholder `--color-cream-dim` (~40%). Gold body text on light surfaces must use `--color-gold-ink` (#8a6708) to hold 4.5:1; `#b8860b` is for fills/borders/large numerals only.

9. **44×44pt minimum tap target, 8px minimum gap between targets.** Visually small icons get invisible hit-area padding. Bottom tab segments are equal-width with generous padding. Add `touch-action: manipulation` to all interactive elements.

10. **Six microstates on every interactive element; no default focus ring.** default / hover / focus / active / disabled / loading. Press = `scale(0.97)` via `:active`. Hover styles wrapped in `@media (hover: hover)` so they never stick on iOS touch. Focus is a custom gold ring, never the browser default.

11. **Animate only `transform` and `opacity`; honor durations and reduced-motion.** Use the motion tokens: `--duration-fast` 160ms (micro), `--duration-base` 240ms (component), `--duration-slow` 480ms (full-screen/milestone only). Nothing routine exceeds 480ms. Never animate width/height/top/left/margin. Every transform animation has a `@media (prefers-reduced-motion: reduce)` fallback that swaps to an opacity fade of equal-or-shorter duration (never strip motion entirely).

12. **Result screen = fixed hierarchy, with juice.** Top to bottom: (1) win/loss beat in 1–2 words + one large visual, (2) spoiler-free shareable artifact (emoji/icon grid that does not reveal the answer), (3) single primary share/copy CTA (one-tap clipboard, no sign-in gate, no modal), (4) live `HH:MM:SS` countdown to the next puzzle, (5) secondary actions. No ads, upsells, or signup walls on this screen. All numbers roll up (≈0.4s, `--ease-game`, 50ms digit stagger) — never a static number.

13. **Streak is amber and home-visible.** The streak flame is amber/orange (NOT gray/white) and the flame + count sit in the top three visible elements of the home screen, before "Play". Streak loss has a mercy mechanic (grace window / freeze) and forward-looking copy — never shame.

14. **Every async/data surface ships loading + empty + error.** Loading = structure-matching skeleton (never a bare spinner). Empty = names the missing thing + one next action. Error = plain language + one recovery action. No raw status codes/exception strings shown to users. No dead-end (404/error with only browser-back).

15. **Signup is gated AFTER the first complete game loop.** No auth wall, permission prompt, or modal in the first interaction. Notification/review prompts fire only at a natural pause (after a daily result), are dismissible, and never stack two blocking overlays in one flow.

---

## 2. AI-Smell Checklist — hunt and kill

For each tell: what to grep/look for, and the fix.

- **Purple→blue 135° gradient** (`#667eea`→`#764ba2`, indigo-500/600). FIX: delete. Flat dark surface + gold accent, or a warm gold→amber wash if a gradient is truly needed.
- **Glassmorphism as decoration** (frosted card on blurred gradient). FIX: opaque surface tokens + 1px low-opacity border. Reserve `backdrop-filter` for the sticky nav/tab bar only (see §5).
- **Emoji as functional UI icons/labels** (🌍 Explore, 🏆 Leaderboard, 🔥 streak). FIX: consistent SVG icon set, one stroke weight (1.5px or 2px), all-filled-active / all-outline-inactive. Emoji only as the result-screen win-beat visual or user-assigned content — never nav/status/section icons.
- **Three equal cards in a row** as the only feature layout. FIX: 2+1 asymmetric split, alternating left/right rows, or horizontal scroll.
- **Uniform radius everywhere** (12px on buttons+cards+inputs+chips). FIX: apply Rule 6 contextual radii.
- **Gradient text on numbers/headings/metrics** (`background-clip: text`). FIX: solid color for all numerics; gradient text banned on scores and titles.
- **Centered hero**: full-width centered H1 + subtitle + CTA + SVG blob/mesh bg. FIX: left-align headline, constrain to ~60% width, offset a globe/streak/map element asymmetrically.
- **Sparkle/robot/rocket/fire emoji as decorative accents** (✨🤖🚀🔥). FIX: remove entirely from product UI and marketing copy.
- **Tailwind default shadows** (`shadow-md`/`shadow-lg`, gray-only). FIX: use the project shadow tokens; gold-context cards cast `--shadow-gold` (amber-tinted), not gray.
- **Generic confetti on every win.** FIX: theme-specific, performance-scaled celebration (world-map pulse, flag rain, globe spin). A 3/10 score must not get the same celebration as 10/10.
- **Static result screen.** FIX: roll up score/stats numbers, pop the win visual, cascade the share artifact — sequential, not a simultaneous dump.
- **Generic result copy** ("Game Over!", "Try Again"). FIX: specific, warm, performance-aware lines (see §3). NOTE: `src/components/games/higher-or-lower/hol-board.tsx:148` ships `title="Game Over!"` — fix it.
- **"Challenge yourself" / "Explore [noun]"** as CTAs. FIX: name the action. NOTE: present at `src/app/lists/most-populated-countries/page.tsx:154`, `src/app/lists/countries-in-africa/page.tsx:155`, `src/app/countries/[slug]/page.tsx:326`, and `Explore` headings at `countries/[slug]/page.tsx:362` + `components/layout/footer.tsx:41`. Replace with a concrete question ("Can you name every African country?") or a verb ("See all rankings").
- **Random off-grid spacing** (10/14/18/22px). FIX: snap to the 4px scale.
- **Spinner-only loading / "No results" empty / raw error string.** FIX: skeleton + named-empty + plain-language-error per Rule 14.
- **`:hover` for feedback that sticks after tap.** FIX: `:active` for press, wrap `:hover` in `@media (hover: hover)`.
- **Uniform-contrast cream text** (same color for primary/secondary/disabled). FIX: three opacity levels per Rule 8.
- **Padding-as-content** (3 facts behind 60% whitespace). FIX: a phone-width result screen shows score + rank/percentile + time + country + correct answer + next action above the fold.

---

## 3. Banned Words & Copy Patterns (microcopy)

The "AI 25" plus Countrivo-specific bans. None of these ship in any string (button, label, toast, empty state, meta description, marketing).

**Banned words/phrases:** elevate, seamless, effortless, unleash, supercharge, harness, empower, unlock (as metaphor), leverage, transform, revolutionize, game-changer, cutting-edge, innovative, groundbreaking, unprecedented, delve, dive into, robust, powerful (as generic praise), journey, adventure, experience (as a verb for routine actions), explore (as a generic CTA), seamless integration, powerful features, intuitive experience, challenge yourself (standalone).

**Banned constructions:**
- Sentence openers: "Furthermore,", "Moreover,", "Additionally,", "In today's world,", "In this era,".
- The binary reframe: "It's not about X, it's about Y" / "It's not just a game, it's…".
- Emoji-bulleted feature lists (✅/🏆/🌍/🔥 + text).
- Exclamation marks on CTAs ("Play now!").
- Confirm-shaming opt-outs ("No thanks, I don't like geography").
- Guilt retention ("Your streak is crying", "You let your friends down").
- Over-apologetic errors ("We sincerely apologize…"), passive softening ("could not be saved at this time"), "currently"/"at this time" in empty states.
- >2 em dashes per screen; ZERO em dashes in UI strings (buttons/labels/toasts/empty states).

**Write instead:** direct second-person questions ("Can you name every border?"), concrete numbers ("243 countries", "20 seconds", "You beat 83% of players today", "Day 7"), contractions, plain past-tense confirmations ("Score saved."), two-sentence errors (what broke + what to do), 3-words-max buttons naming the immediate action ("Play today's challenge"), specific CTA pairs ("Challenge a friend" / "Skip for now"). Read every string aloud — if you wouldn't say it, rewrite it.

---

## 4. Numeric System (the single source of truth)

**Spacing** (4px grid): `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`. Typical: 8 inner padding, 16 between items, 32 section gap. Internal padding ≤ external gap.

**Type scale** (Major Third 1.25): `12 · 14 · 16 · 20 · 25 · 31` (+ 48/700 hero). Base body 16px; min UI label 14px; min caption 12px (one level only). Max 3 sizes per component — use weight/color for the rest.
- Line-height: body 1.4–1.5; display 1.1–1.25; never >1.6 above 24px.
- Tracking: display headings −0.01 to −0.03em; body 0/+0.01em; ALL-CAPS labels +0.05 to +0.1em (standalone tags only, never sentences or interactive labels).

**Color 60/30/10:** 60% background/surface tokens, 30% secondary surfaces/cards/inactive, ≤10% accent (gold/green/red). Gold is the minority. Max 4 semantic colors in game UI. Contrast: body 4.5:1 (aim 7:1 on the primary reading surface), large text/icons 3:1.

**Radius tokens:** `--radius-sm` 6 (chips/tags/inputs) · `--radius-md` 8 / `--radius-lg` 10 (buttons/cards) · `--radius-xl` 14 (modals) · `--radius-2xl` 20 (bottom sheets, top only). Two per layer max.

**Motion tokens:** `--duration-instant` 80 · `--duration-fast` 160 · `--duration-base` 240 · `--duration-slow` 480. Easing: `--ease-out` (entrance/standard UI), `--ease-emphasis` (section reveal), `--ease-game` `cubic-bezier(0.34,1.56,0.64,1)` (score reveals, confirmations, micro-bounce). Routine ≤480ms; long (800–1500ms) reserved for milestones (perfect score, 7/30/100/365-day streak). ≤3 distinct motion behaviors per screen. Animate only `transform`/`opacity`.

**Shadows:** project tokens only (`--shadow-sm/md/lg/xl`); gold-context surfaces use `--shadow-gold` (amber-tinted). No bare Tailwind `shadow-*`.

---

## 5. Make It Feel Native iOS (Capacitor / WKWebView)

1. **Viewport:** `width=device-width, initial-scale=1, viewport-fit=cover` (already set in `src/app/layout.tsx` — `viewportFit: "cover"`). Never set `user-scalable=0`/`maximum-scale=1` (fails WCAG 1.4.4 + App Store review).
2. **Safe-area top:** fixed headers use `padding-top: env(safe-area-inset-top)` and `height: calc(BASE + env(safe-area-inset-top))`, with `max(env(safe-area-inset-top), 20px)` fallback for the WebKit zero-on-load bug. Use the existing `.safe-top`/`.safe-bottom` helpers in `globals.css`.
3. **Bottom tab bar:** `height: calc(60px + env(safe-area-inset-bottom)); padding-bottom: env(safe-area-inset-bottom)`, background extends behind the home indicator. iOS 26 floating style: `margin: 0 12px; border-radius: 24px; bottom: calc(8px + env(safe-area-inset-bottom))`. Labels on every tab; filled icon active / outline inactive.
4. **Kill the bounce:** set `webView.scrollView.bounces = false` natively (CSS `overscroll-behavior` is ignored in WKWebView). CSS fallback: locked `html/body` + single scrollable `#app` wrapper.
5. **Tap polish:** `* { -webkit-tap-highlight-color: transparent }` (already in `globals.css`) + `touch-action: manipulation` on interactives. `user-select: none` on the game board and all interactive UI.
6. **Fixed elements:** every `position: fixed` element gets `transform: translateZ(0)` / `will-change: transform` to stop scroll flicker.
7. **Haptics (Capacitor):** `ImpactStyle.Light` on tab/selection, `Medium` on game result, `Heavy`/`notification(Success)` on streak milestone. Never ship a meaningful game moment without a haptic. The web Vibration API is unsupported on iOS — do not use it.
8. **Status bar:** set `StatusBar.setStyle` + `setBackgroundColor` to match the app background per theme; overscroll background color set on the scroll root (never white on a dark app).
9. **Transitions:** forward nav slides in from the right / old slides left; back pops the reverse. No fade-only or instant page transitions. Use bottom sheets (`translateY`, `border-radius: 20px 20px 0 0`, drag handle) for secondary/contextual actions — not full-page routes.
10. **Keyboard:** Visual Viewport API listener sets `--keyboard-inset`; bottom-fixed elements use `bottom: calc(var(--keyboard-inset,0px) + env(safe-area-inset-bottom))`. Inputs get `scroll-margin-bottom: 120px`.
11. **Liquid Glass (nav/tab bar only):** `backdrop-filter: blur(20px) saturate(180%)` (blur ≤20px for perf), plus the inset top highlight `inset 0 1px 0 rgba(255,255,255,0.35)` and a 1px low-opacity border. Separate light vs dark variants (dark: `rgba(0,0,0,0.35)` bg, `inset 0 1px 0 rgba(255,255,255,0.08)`). Never SVG `feDisplacementMap` + `backdrop-filter` (Safari-broken). Never decorative glass on cards/heroes.
12. **Dynamic Type:** opt in via `@supports (font: -apple-system-body)` guarded to iOS so rem tracks the user's iOS text-size setting.

---

*Reviewer note: every numbered rule in §1, every tell in §2, the banned list in §3, and every item in §5 is individually checkable against a component file and line.*
