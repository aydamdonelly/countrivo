# Countrivo rebuild: the binding blueprint

Status: BINDING. This is the one build contract for the from-scratch rebuild of the Countrivo front end (Next.js 16.2.1 App Router, React 19.2, Tailwind v4, Supabase). It starts from `proposals/engineering.md` (the judged winner), grafts everything the three judges asked for from `proposals/product.md` and `proposals/editorial.md`, and resolves every contradiction between them. Where this document and any proposal disagree, this document wins. Where this document is silent, `understand.json` (the map of the current system) and the anti-slop law (`~/.claude/CLAUDE.md`, read in full, every point binding) decide.

Sources of truth, in order:
1. The look: `design/k/k3-ein-board.html` rendered at `home/k3-demo.png` (390x844), with its component code `design/k/lib-k.js`, `lib-h.js`, `lib-m.js`, `design/lib/common.js`, `design/lib/fonts.css`. K3 is the law of the look. Every number in this document that describes the home is measured from K3; every other screen is derived in K3's language.
2. The system: `rebuild/understand.json` (routes, data, engines, design, relics, native, seo). Contracts quoted here are summaries; the JSON is the authority for field lists and signatures.
3. The law: `~/.claude/CLAUDE.md`. Author confirmation: the whole file was read before writing this blueprint and is re-checked in section 13.
4. The owner's product rules (binding): the home is an arcade you land on and immediately see you can play geo games, compete, and that it is daily. Exactly two modes: Daily (one shot per game per day, same board for everyone, 24 h global board) and Practice (random boards, nothing counts). No duels, no Blitz mode, no live counters, no levels or quests, no "you as a friend". Friends and "you" use crests (the chosen country outline); flags only on the global board and inside game content. Country Draft is the anchor but is not playable on the home. World Draft is a different game (placeholder: draft 5 people, conquer 195 countries). Mobile first, desktop composed too. Drawn icons, no emoji anywhere. The flame really burns.

Repo of record: `~/Desktop/code/countrivo` (main, Vercel git-linked). Deploy only after `npm run build && npx next start -p 3100` and the acceptance run (section 13). Deploy right after 00:00 Europe/Berlin (section 9.6 explains why).

---

## 0. Non-negotiables

1. One theme. The page looks identical in a dark-mode browser and a light-mode browser. `:root { color-scheme: light }`, `viewport.colorScheme = "light"`, no `@media (prefers-color-scheme)`, no `dark:` variants, no `data-theme`, no `--color-black`/`--color-white` overrides. `viewport.themeColor` is the single string `#fbfaf6`. Native status bar style is fixed (dark text on paper).
2. No loading states. No `loading.tsx` anywhere, no skeletons, no spinners, no `animate-pulse`, no `opacity-0` starts, no `mounted` gates, no `useSyncExternalStore(..., () => null)`, no `next/dynamic({ ssr: false })` for anything visible on arrival, no `Suspense` fallback that paints a placeholder, no `unstable_instant`. Every route's first HTML is its final layout. Daily boards are generated on the server from the deterministic seed (dateKey + edition); practice boards from a per-request server seed; session, lockout, played-today, mode and resume are resolved on the server from cookies and the server Supabase client; countdowns are seeded from the server clock; links to play routes are prefetched. The play route appears with its board.
3. No emoji anywhere in rendered UI, in data the UI reads, in `<option>` labels, in results, in undo rows, in feedback. Flags are SVG files; icons, marks and stat icons are React SVG components from the house set; crests are silhouettes. The only emoji that may exist in the code base are inside the clipboard share strings (`src/lib/share/*`), which are never rendered on screen.
4. No duels, no challenges UI, no "playing now", no levels, quests, XP, confetti, estimated percentiles, "you beat N players". Two modes: Daily and Practice.
5. Friends and "you" use crests; real flags only on the global board and where the flag is game content or country identity (game boards, country and ranking pages).
6. Every indexed URL, sitemap, canonical, title, description, robots rule, redirect and JSON-LD family is preserved (`understand.json seo`). The Supabase schema, RPCs, server actions and run-validation contracts are preserved (`data`). The pure engines under `src/lib/game-logic` are preserved except the two data-shape edits in 5.1. The auth and native contracts are preserved (`native`). Everything else (pages, layouts, components, CSS, icons, flags, copy) is rebuilt from zero in a new component tree; `src/components` is deleted at the end (section 12).
7. Every control that looks interactive works. Every interactive control has a 44 px hit area on touch.
8. Copy: no em dashes, no exclamation marks in system copy, no "Daily challenge" family, no "challenge" as a noun for the daily. The voice is section 10.
9. The signature is on every route: the burning flame in the header, Erode numerals, the one accent, small radii, hairlines only between rows.

---

## 1. Design tokens (single theme, exact values)

Defined once in `src/styles/tokens.css` inside Tailwind v4 `@theme`, imported by `src/app/globals.css`. Nothing else in `src/` may contain a hex literal except `src/lib/seo/og-image.tsx` (Satori cannot read CSS variables; it mirrors these values and carries a comment saying so), `src/app/global-error.tsx` and `capacitor/www/offline.html` (they load without the stylesheet and mirror paper, ink, mute, ember).

```css
@import "tailwindcss";

@theme {
  /* surfaces (values measured from K3, lib-h.js `C` and the literals in lib-k.js) */
  --color-paper:  #fbfaf6;   /* page ground; label text on ink; Shoot fill; crest silhouette fill; flame core */
  --color-card:   #f1f0ea;   /* switch track; me-row; practice card; nudge; week tiles; quiet buttons; fields; slots; option rows */
  --color-line:   #e9e8e1;   /* the only hairline: 1px between rows; GeoWordle "cold" */
  --color-bar:    #ffffff;   /* bottom tab bar; sheets */
  --color-wait:   #cfcec6;   /* waiting crest fill; conquest-map land; empty pips; disabled fills; GeoWordle "cool" */
  --color-faint:  #b9b8b1;   /* chevrons; inactive tab-bar icons and labels */
  --color-mute:   #74756f;   /* every secondary text; GeoWordle "hot" */
  --color-down:   #8a8b85;   /* disabled text; tertiary meta */
  --color-ink:    #17181a;   /* text; anchor card; switch knob; crest circle; active tab underline; correct fills; GeoWordle "burning" */
  --color-ink-2:  #2b2c2e;   /* pressed/hover state of ink fills; chip fill on the ink card */
  --color-ember:  #b8432a;   /* THE colour: flame, live counters, NEW, friends-link facts, me-crest ring, active tab seed, wrong verdicts, GeoWordle "hit" */

  /* text on ink (anchor card, result panel) */
  --color-on-ink:        #fbfaf6;
  --color-on-ink-body:   #c9c8c1;   /* how-text on the card */
  --color-on-ink-kicker: #a9aaa3;   /* kicker row and counter on the card; GeoWordle "warm" */
  --color-on-ink-chip:   #d9d8d1;   /* chip text on the card (chip fill is --color-ink-2) */

  /* alphas: the only two allowed */
  --color-scrim: rgba(23, 24, 26, 0.45);   /* behind sheets; never derived from black */
  --color-edge:  rgba(23, 24, 26, 0.08);   /* the 1px inset ring on flags only */

  /* type */
  --font-sans: system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
  --font-display: var(--font-erode), "Erode", Georgia, serif;   /* --font-erode is injected by next/font/local */

  /* radii: nothing rounder than 12px anywhere; crests are 50% */
  --radius-card: 12px;   /* ink card, practice card, switch track, sheets (top corners), fields */
  --radius-note: 10px;   /* nudge */
  --radius-knob: 9px;    /* switch knob */
  --radius-ctl:  6px;    /* buttons, me-row, week tiles, tiles, slots, option rows, toast, suggestion panel */
  --radius-chip: 4px;    /* category chips */
  --radius-flag: 3px;    /* flags */

  /* spacing rhythm (phone) */
  --gutter: 20px;        /* side padding; content = 350 at 390 */
  --stack: 16px;         /* between sections */
  --row-y: 7px;          /* board row vertical padding */
  --list-y: 12px;        /* list row vertical padding */

  /* motion */
  --ease-out: cubic-bezier(0.2, 0, 0, 1);
  --dur-fast: 120ms;
  --dur-base: 220ms;
  --dur-knob: 300ms;
}

:root { color-scheme: light; }
html { background: var(--color-paper); }
body { background: var(--color-paper); color: var(--color-ink); font-family: var(--font-sans); -webkit-font-smoothing: antialiased; }
::selection { background: var(--color-card); }
:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--color-paper), 0 0 0 4px var(--color-ink); border-radius: inherit; }
.on-ink :focus-visible { box-shadow: 0 0 0 2px var(--color-ink), 0 0 0 4px var(--color-paper); }
```

Game-state colour is tonal, never a second hue family:
- Correct / hit / solved: ink fill with paper text.
- Wrong: 2 px inset ember outline (`box-shadow: inset 0 0 0 2px var(--color-ember)`) and ink text, or ember text. Ember is never a fill behind text.
- Near / "close": mute text.
- GeoWordle bands, one grey ramp plus the accent for the hit: cold `line`, cool `wait`, warm `on-ink-kicker` (#a9aaa3), hot `mute`, burning `ink`, hit `ember`.
- Cluster groups by id 0..3: ink (paper text), ember (paper text; the only ember fill on the site, and it carries the trait label so the group is never colour-only), mute (paper text), wait (ink text).
- Country Draft rank quality: rank <= 5 ink 600, <= 30 mute 600, else ember 600. Numerals only, no chips.

Rules that make the single theme hold:
- No `bg-black/N`, `bg-white/N`, `text-white`, `border-border`, raw Tailwind palette classes (`gray-`, `green-`, `red-`, `blue-`, `amber-`, `purple-`). Alpha on ink is never used for text; the ramp is used instead.
- No `box-shadow` except the two authored ones: the flag inset ring (`--color-edge`) and the focus ring above. No `backdrop-filter`. No gradient except the 40 px fade above the tab bar (`linear-gradient(rgba(251,250,246,0), #fbfaf6)`).
- No `text-transform`; kicker strings are typed in caps. No letter-spacing except the 11 px kicker (`.02em`). No tracking on the wordmark.
- `font-variant-numeric: tabular-nums` only on classes that carry ticking or ranked numbers (`.num`), never body-wide.
- Form controls inherit `color-scheme: light`; scrollbars stay native.
- `scripts/check-theme.mjs` (section 13) fails the build on any violation.

Native alignment: `capacitor.config.ts` `ios.backgroundColor` and `SplashScreen.backgroundColor` stay `#fbfaf6`; `src/lib/native/bootstrap.ts` step 2 becomes `StatusBar.setStyle({ style: Style.Light })` once, with no `matchMedia` listener; `manifest.ts` `background_color` and `theme_color` become `#fbfaf6`.

---

## 2. Type scale and where Erode is used

Two faces only. Erode 500 and 600 self-hosted via `next/font/local` from `src/fonts/erode-500.woff2` and `erode-600.woff2` (`variable: "--font-erode"`, `display: "block"`, `preload: true`, `adjustFontFallback: "Times New Roman"`, `fallback: ["Georgia", "serif"]`). Inter and every `next/font/google` import are removed. Body is the system stack exactly as K3. No mono anywhere (share text is never shown on screen).

Erode 600 is used for exactly these roles and nowhere else:

| Class | Size / line | Where |
|---|---|---|
| `.t-wm` | 22 / 1 | wordmark |
| `.t-card` | 30 / 1.1 (desktop 40 / 1.05) | anchor card h2 ("Country Draft"), practice card h2, the round subject in play (country name, category) |
| `.t-h1` | 28 / 1.1 (desktop 34 / 1.05) | hub h1s, country name, category label, list title, profile name (the landing h1 sits inside the card and uses `.t-card`) |
| `.t-h2` | 22 / 1.15 | editorial section titles ("Where Germany stands", "Full world ranking"), sheet headlines, legal h2 |
| `.t-h3` | 18 / 1.2 | play-bar game title, result section titles |
| `.t-score-xl` | 56 / 1 (desktop 64) | post-shot score, result score, streak number on profile, "the number" on list pages |
| `.t-score-l` | 22 / 1 | rank values in standing rows, quick facts, list number captions, streak count in the profile hero |
| `.t-score` | 14 / inherit | scores in board rows, table values, list metas that are scores |
| `.t-num` | 15 / 1 | step numerals in the K2 steps variant, rank numerals in Draft slots, pip labels |
| `.t-big` | 40 / 1 | in-play big numbers: streak count, Risk Zone pot, revealed value in Higher or Lower, timers |

Erode 500 is loaded for the OG image fallback only; if unused after the build, drop the 500 face from the font loader (the OG route embeds its own base64 Erode 600).

System-ui scale (weights 400 / 500 / 600 only):

| Class | Size / line | Weight | Uses |
|---|---|---|---|
| `.t-kicker` | 11 / 1.2, letter-spacing .02em | 400 | card kicker row and its counter (typed in caps), chip text, NEW tag (700 ember), tab-bar labels, friends-strip labels (600 names) |
| `.t-meta` | 12 / 1.35 | 400 (500 for "no shot yet", section heads and counters; 600 for live counters in ember) | help line, section heads, rank numbers, list metas, counters, play mode label, table units, data-updated line, entity line |
| `.t-body` | 13 / 1.45 | 400 | card how-text, board tabs, verdict lines, result lines, capsule answers, form hints, source line |
| `.t-row` | 14 / 1.3 | 400 (600 active) | board rows, switch labels (500 / 600 active), table cells, nav, buttons in play |
| `.t-cta` | 15 / 1 | 600 | Shoot and primary buttons |
| `.t-list` | 16 / 1.25 | 400 (500 options, 600 capsule questions) | list row titles, option rows in play, capsule questions, FAQ summaries, field text (16 px prevents iOS zoom) |
| `.t-lead` | 17 / 1.5 | 400 | hub intro paragraphs, landing lead |
| `.t-prose` | 15 / 1.6 | 400 | legal pages, "What X is", list intros, country prose |

Numerals: `.num { font-variant-numeric: tabular-nums }` on the countdown, scores, ranks, timers and table value cells. Not global.

---

## 3. Component library

All primitives live in `src/ui/*`, composites in `src/features/*`. Every component is a server component unless marked (client). Sizes are CSS pixels at the phone frame (390 wide, 350 content). Desktop deltas are listed where they exist; otherwise identical. Props are TypeScript-exact and frozen by the Foundation package (section 14) on day 2; later changes are additive.

### 3.1 `Wordmark`
`<a href="/">Countrivo</a>` in `.t-wm` ink, no tracking, hit area padded to 44 px height. Props: none.

### 3.2 `Countdown` (client)
Renders `resets in <b class="num">17 h 37 m</b>`. Props: `resetAt: number` (epoch ms of the next Europe/Berlin midnight, from `getClock()`), `serverNow: number`, `label?: "resets in" | "next board in"` (default "resets in"). The first render prints the string derived from the props (identical on server and client); after mount a 30 s interval re-derives from `Date.now() + (serverNow - clientNowAtMount)`. Format `${h} h ${m} m`; under one hour `${m} m`; under one minute `now`. 12 px mute, the number 600 ink. The `<b>` carries `suppressHydrationWarning`. Never renders empty.

### 3.3 `Streak`
`<span class="st"><Flame size={18} /><b>3</b></span>`: inline-flex, gap 3, margin-left 8, `<b>` 12 px 600 ink. Props: `n: number | null`. The flame always burns and is always ember. The number is rendered only when `n > 0`; guests and members at 0 see the flame alone. Never print "0".

### 3.4 `Header`
Height 64 (12 px top padding inside), flex space-between, sits on paper, not sticky, no border, no blur, no avatar, no "Sign in". Left `Wordmark`. Right cluster by variant:
- `variant="app"` (dynamic routes): `Countdown` then `Streak n={viewer.streak}`.
- `variant="static"` (prerendered routes; carries zero viewer state): `<Flame size={18} />` alone (the signature burns on every route) then a text link `Today's draft` (13 px ink 600, `prefetch`) to `/games/country-draft/play?mode=daily`.
Desktop (>= 1024): after the wordmark, `Nav` (3.22) with a 40 px gap; the right cluster unchanged. Play routes replace the header with `PlayBar` (3.17). Auth pages render `Wordmark` only.

### 3.5 `ModeSwitch` (client, progressive)
K3 `switchK` exactly. Track 44 tall, radius 12, card fill, padding 4; knob 36 tall, width `calc(50% - 4px)`, radius 9, ink, `transform: translateX(0 | 100%)` 300 ms `--ease-out`; labels 14 px, mute 500, active label paper 600, line-height 36 (colour swap instant). Help line `.t-meta` mute, margin-top 8. Copy: Daily = "One shot per game, same board for everyone, 24 h." Practice = "Random boards, unlimited, nothing counts."
Markup: a `<form method="get" action="/">` with two `<button type="submit" name="mode" value="daily|practice" role="tab" aria-selected>` inside the track, so it works without JS: `src/proxy.ts` answers `GET /?mode=daily|practice` with a 303 redirect to `/` and `Set-Cookie: cv_mode=<mode>; Path=/; Max-Age=31536000; SameSite=Lax` (server components cannot set cookies; the proxy can), and the home reads only the cookie. Client enhancement: `onClick` prevents the submit, writes `document.cookie = "cv_mode=<mode>; Path=/; Max-Age=31536000; SameSite=Lax"`, toggles `data-mode` on `<main>` and moves the knob. Both panes are always in the HTML; the inactive pane carries `hidden` and `inert`. No `router.refresh()`, no reload, no localStorage. Arrow keys switch.

### 3.6 `AnchorCard`
Ink card: radius 12, padding 18 18 20, margin-bottom 16, `position: relative`, full content width, class `on-ink`. Variants:
- `pre` (daily, not shot; K3 `anchorK how:'line'`): kicker row `.k` flex space-between `.t-kicker` on-ink-kicker: left `TODAY · COUNTRY DRAFT`, right `41 shots · top 635` (from `board.shots` and `board.top`; 0 shots: `no shots yet`). `<h2 class="t-card">` on-ink margin-top 6: `Country Draft`. `<p class="how t-body">` on-ink-body margin-top 8: "Countries appear one at a time. Put each one on the stat where it ranks highest in the world. Eight picks, one shot." Chips (3.13): flex wrap gap 6 margin-top 12 `padding-right: 110px` so they wrap around the button: the 8 chip labels of today's `draftCategories` (section 10.6). `Button shoot` "Shoot" absolute right 14 bottom 16, linking `/games/country-draft/play?mode=daily`, `prefetch`. Card height is content-driven (about 269 px on the phone). No min-height.
- `steps` (K2; used on the Country Draft landing only): as `pre` but the how-text is replaced by `.steps` flex gap 6 margin-top 10, three columns each `.t-kicker`-sized (11 px, line-height 1.3) on-ink-body text with a `.t-num` numeral in on-ink: `1 8 stats are on the board` / `2 countries appear one by one` / `3 put each where it ranks best`.
- `post` (shot taken; K4 `anchorShot`): kicker `TODAY · YOUR SHOT` / `holds till 00:00`. `.res` flex align-center gap 16 margin-top 10: `<b class="t-score-xl num">612</b>` then a `.t-body` on-ink-kicker block line-height 1.5: `<em>#9</em> of 41 global` / `<em>#2</em> of 5 friends` (em = on-ink 600, not italic). The friends line is omitted when `friendCount = 0`; the global line reads `of 41 global` with rank `–` while the server rank is unknown. Then `<p class="t-body">` on-ink-kicker margin-top 12: "Bad day? <u>Practice a board</u>, it won't count." (u = on-ink, `text-underline-offset: 3px`, links `/games/country-draft/play?mode=practice`). No button.
- `practice` (practice pane; H `anchorPractice`): card fill, ink text, kicker mute `PRACTICE · COUNTRY DRAFT` / `you've run 14` (from `user_game_stats.total_runs`; omitted for guests), h2 "A fresh board every time.", p mute "Your practice best is 790. Nothing here touches the leaderboard." (guests: "Nothing here touches the leaderboard."), `Button ink` "New board" absolute bottom-right linking `?mode=practice`.
- `landing` (game landings, static): kicker `DAILY · {TITLE}` / `resets at midnight Berlin` (fixed string, never a countdown on a static page); practice-only games: `PRACTICE · {TITLE}` / `unlimited`. `<h1 class="t-card">` = the game title (the page h1 lives inside the card at the card size). How-text = the game's one-line rule (10.5). Chips = the game's three facts (10.5). Button `Shoot` (dailies) or `Play` (practice-only) to `?mode=daily` / `?mode=practice`, `prefetch`. Country Draft uses the `steps` layout for its how-text and its 8 chips.
- `world` (`/games/world-draft` only): kicker `NEW · IN DEVELOPMENT` / `draft 5 people · conquer 195`, h1 "World Draft", how "Draft five people. Give each a seat: leader, general, money, propaganda, diplomacy. Then send them out and count how many of the 195 countries they take. Same draft for everyone, one shot." Under it a `ConquestMap` 314x120 in place of chips (land on-ink-chip fill `--color-ink-2`, taken countries paper). No button.
Desktop (>= 1024): padding 24 24 26; h2 `.t-card` 40; how 15 px; chips 12 px padding 5 10; Shoot right 20 bottom 20.
Props: `{ variant, slug, title, kicker, counter, how, chips, cta: { label, href } | null, result?: { score, globalRank, globalShots, friendRank, friendCount } }`.

### 3.7 `Board` (client only for the tab swap)
The K3 signature: one list with Global and Friends as tabs. Props: `{ slug, title, board: GameBoard, viewer: Viewer, initialTab: "global" | "friends", variant: "full" | "public", hrefFull: string, limit?: number }` (`GameBoard`, `BoardRow`, `FriendRow` are the existing `src/app/actions/home.ts` shapes).
Head `.tabs`: flex gap 16, `.t-body`, align baseline, margin-bottom 8. `Global` and `Friends` are `<a href="?tab=global|friends" role="tab">` so they work without JS; the client wrapper intercepts the click, swaps the panes and calls `history.replaceState` (no navigation). Active = ink 600 with `border-bottom: 2px solid var(--color-ink)` and `padding-bottom: 3px` under the word only, static, no animation; inactive = mute. Right `<em>`: margin-left auto, `.t-meta` 600 ember, not italic: global `41 shots` (0: `no shots yet`, 1: `1 shot`); friends `3 of 5 have shot`.
Rows (`BoardRow`): grid `18px 26px 1fr auto`, gap 10, align center, padding 7 0, `.t-row`, `border-top: 1px solid var(--color-line)`. Rank `<i>` `.t-meta` mute; identity cell = `Flag size="xs"` (global) or `Crest size={26}` (friends); name ink 400 (`you` for the viewer); score `<b class="t-score num">`. Rows link to `/games/{slug}/run/{runId}` when a run id is known.
Global pane: top 3 then the me-row. Friends pane: me + friends sorted by score desc, unplayed last with wait crest, mute 500 name and `not yet` in the score cell (`.t-meta` 500 mute).
Me-row `.me`: card fill, margin 0 -8px, padding 7 8, radius 6, no border-top, always present and last, on both panes. Before the shot: `<i>–</i>`, the viewer's `Crest` (seed crest when no country), `you`, `<b class="nos">no shot yet</b>` (`.t-meta` 500 mute). After: rank + Erode score. If the viewer is already in the top 3, that row takes the `.me` treatment and no extra row is added.
Empty states (one row, `.t-body` mute, padding 12 0, border-top line): global with 0 shots "No shots yet today. Be the first."; friends signed out "See how your friends shot today. <a>Sign in</a>" (a = ember 600, opens `AuthSheet`); friends with none "No friends yet. <a href=/friends>Add a few</a> and today's shots line up here."
Foot: a `.t-meta` mute right-aligned link `Full board` with `Icon arrow-up-right 14` to `hrefFull`, rendered only when `board.shots > 3` (home and landing; not on the leaderboard itself).
`variant="public"` (static landings, K `rankK`): no tabs; head `<h3>` `.t-meta` 500 mute flex space-between: `Today · global` / `41 shots · 9 countries` (countries = distinct `flag` codes among the day's runs); three global rows; the me-row reads `–` / seed crest / `you` / `sign in to see your shot` and the whole row is a link to `/games/{slug}/leaderboard`. No viewer state is rendered on static pages. Never "you · no shot yet" here.
No row entrance animation. Both panes are in the HTML; the inactive one is `hidden`.

### 3.8 `GameRow` and `GameList`
K3 `listK`. Head `<h3>` (`SectionHead` 3.9): `More dailies` / `6 games · 0 shot` (the right fact is an `<a>` to `/games`, mute). Row: `<Link prefetch>` flex gap 12, padding 12 0, `.t-list`, `border-top: 1px solid var(--color-line)`: `Mark slug 26` in a 42 px centred wrapper, then `<span>` flex 1 with the title, optional `<em>NEW</em>` (`.t-kicker` 700 ember, margin-left 6, not italic), `<small class="t-meta">` block meta; then `Icon chevron-right 18` faint (or a `.t-meta` ink 600 word such as `Shoot` when the row is an action row). No hover background; pressed state = title colour mute for 120 ms. Metas: section 10.4. On the home the last list carries `.fade` so its rows dissolve into the tab bar (3.21).

### 3.9 `SectionHead`
`<h3>`: `.t-meta` 500 mute, flex space-between, margin `4px 0 2px` (lists) or `0 0 10px` (strips and boards). Left = title, right = fact. Fact is mute by default, ember 600 when it is a live fact about people (`41 shots`, `3 of 5 have shot`, `you're #2`). Facts are joined by ` · ` (U+00B7 with spaces). Never uppercase, no rule beside it.

### 3.10 `FriendsStrip`
K4/K5 `friendsK`. `SectionHead` `Friends today` / `3 of 5 have shot` (ember; post-shot `you're #2`). `.r` flex gap 14, horizontally scrollable without a visible scrollbar. Each `<a href="/profile/{username}">` column: `Crest 40`, `<b class="t-kicker">` 600 ink name, `<i class="t-kicker">` mute score or `not yet`; waiting = wait crest and mute 500 name; me = `outline: 2px solid var(--color-ember); outline-offset: 2px` on the crest. Optional `<p class="t-body">` mute margin-top 10 ("Beat <b>610</b> and you're ahead of endy for the day.", b = ink 600). Used on `/friends`, on the result panel, and in the desktop home rail. Not on the phone home (K3 has one board instead).

### 3.11 `Nudge`
Flex gap 10, card fill, radius 10, padding 12 14, `.t-body`; `Flame 18`; text flex 1; optional `<a>` ember 600 nowrap. Used for "Your shot is still open. Shoot" on the leaderboard and the streak nudge on the profile.

### 3.12 `StreakWeek` (profile)
`.n`: `Flame 36` + `<b class="t-score-xl num">3</b>` + `<small class="t-body">` mute two lines ("day streak" / "play any daily to keep it"). `.week`: 7 tiles flex 1, height 44, radius 6, card fill, `.t-meta` mute day letters; played = ink fill, paper text, with `<i>` 9 px `4/12`; today = `outline: 2px solid var(--color-ink); outline-offset: -2px`, ink 600. No streak: the flame stays lit (it is the brand mark), the number is omitted, the small text reads "No streak yet. One shot starts it."

### 3.13 `Chip`
`.t-kicker` (11 px), padding 4 8, radius 4. On ink: fill `--color-ink-2`, text on-ink-chip. On paper: card fill, ink text. Used only for the eight draft categories, a landing card's three facts, and solved Cluster groups' trait labels. Never for metadata, status or tags anywhere else.

### 3.14 `Button`
One component, four variants; there is no outlined variant, so a filled-next-to-outlined pair cannot occur.
- `shoot`: paper fill, ink text, padding 11 16, radius 6, `.t-cta`, single word. Hover (fine pointer): fill card. Disabled: fill wait, text mute. Used on ink surfaces (anchor cards, result panel).
- `ink` (default primary on paper): ink fill, paper text, same metrics. Hover: fill `--color-ink-2`. Used for "New board", "Join", "Save", "Sign in", "Send request", "Submit", form submits.
- `quiet`: card fill, ink text 500. Hover: fill line. Used for secondary actions ("Practice a board", "Deselect", "Give up", "Cancel", "Copy").
- `text`: no fill, ember 600, padding 11 0, underline none. Used for inline actions ("Sign in", "Add friends", "Today's board", "Undo last pick").
All: `min-height: 44px`, `display: inline-flex`, gap 8, `cursor: pointer`, `transition: background-color 120ms`; no transform on hover or press, no shadow. Pending (React 19 `useFormStatus` / `useTransition`): the label changes to the pending word ("Joining", "Saving", "Sending"), `aria-busy="true"`, `pointer-events: none`, fill unchanged; no spinner, no ring. `href` renders a `<Link>` with the same look; `prefetch` passed through. The only icon that may sit inside a button is `arrow-up-right` (Share) or `undo`.
Two actions side by side are never two fills: one `ink`/`shoot` plus one `text`.

### 3.15 `Flag`
`<Flag iso2 size alt />`, 4:3 at `xs` 24x18, `s` 32x24, `m` 48x36, `l` 80x60, `xl` 104x78, `hero` 120x90. Markup: `<span class="flag" style="width;height">` with `display: inline-block; flex: none; position: relative; border-radius: 3px; overflow: hidden` and `::after { content: ""; position: absolute; inset: 0; border-radius: inherit; box-shadow: inset 0 0 0 1px var(--color-edge); pointer-events: none }`; inside, `<img src="/flags/{iso2}.svg" width height alt loading="lazy" decoding="async">` with `display: block; width: 100%; height: 100%; object-fit: cover`. The ring keeps white-heavy flags (JP, FI, MC) legible on paper and on the white tab bar; it is not a card border. `alt` = country display name when the flag is information; `alt=""` when the name sits beside it or when naming it would leak an answer (Flag Quiz, Country Streak, Speed Flags, Blitz subjects). Section 5.1 covers the asset pipeline.

### 3.16 `Crest`
`<Crest path size muted ring label />`: `<span class="crest">` width/height = size, radius 50 %, ink fill (muted: wait fill), inline-flex centred; inside `<svg viewBox="0 0 100 100" width=height=round(size*0.62)>` with `<path d={path} fill="var(--color-paper)">`. `ring` adds `outline: 2px solid var(--color-ember); outline-offset: 2px`. `path === null` (no country chosen, or a territory without a silhouette) renders the seed crest: the same circle with one paper circle `r = size * 0.1` at the centre, `aria-label="no crest yet"`. Never an initial letter, never "?". Sizes: 22 (desktop nav "You", run byline), 26 (rows), 40 (strips, friend rows), 64 (profile head, add-friend page). Server components pass the path string; client components receive it as a prop and never import `silhouettes.json`. Centring is verified at 3x zoom (the silhouette's bounding box is centred by `fitExtent` with a 2 px inset when the JSON is built; the seed dot is `cx=cy=50`).

### 3.17 `Mark`
`<Mark slug size=26 tone="ink" | "paper" />`: one bespoke SVG per game (4.3) inside a wrapper `round(size*1.6)` wide, `inline-flex; justify-content: center; flex: none`. Ink by default; `paper` on ink surfaces.

### 3.18 `PlayBar` (play-route header)
Height 56, flex, align center, gap 12. Left: `<Link href="/games/{slug}" aria-label="Back to {title}">` with `Icon chevron-left 24` in a 44 px hit area. Then `Mark slug 22` and `<h1 class="t-h3">` title. Right: `.t-meta`: daily `Daily · one shot` ink; practice `Practice · doesn't count` mute. Nothing else. Desktop: the bar sits inside the 720 px play column.

### 3.19 `Progress` (session line and pips)
Under the PlayBar, height 24, flex, align center, margin-bottom 12. Left `Pips`: a row of N squares 6x6 radius 1.5, gap 4 (the Draft mark's geometry reused): done = ink, current = ember, remaining = wait; a mistake or a wiped chain = ember outlined square (2 px, no fill). Max 20 pips; above that (Country Streak, Higher or Lower, Sprint) the left side shows nothing or a 3 px bar (`height: 3px; border-radius: 1.5px`, ink on line, `width` animated 320 ms) where a total exists. Right: `scoreLabel` `.t-meta` mute + value `.t-score num` (`score 412`, `streak 7`, `found 3/9`) + optional `extra` `.t-meta` mute (`4 picks left`, `0:42`).

### 3.20 `Subject`
The thing in play. Default: `Flag l` (80x60) centred, `<b class="t-card">` country name, `<span class="t-body">` mute `Americas · South America`. Variants: `flag-only` (`Flag hero` 120x90, no name: Flag Quiz, Country Streak, Speed Flags, Blitz), `stat` (`StatIcon 28` + `.t-card` category label + `.t-meta` mute clarifier), `pair` (two default subjects side by side at `Flag m`, names `.t-list` 500, values `.t-score-l num`, the hidden value rendered as `?` in wait). Reveal motion 6.3.1 on change.

### 3.21 `Options` and `OptionButton`
Full-width stack, gap 8: each `<button>` height 52, card fill, radius 6, `.t-list` 500 ink, padding 0 14, text-align left, optional `Flag xs` lead, and a `.t-meta` mute key hint (`1`..`4`) at the right hidden under `@media (hover: none)`. States: `chosen-right` = ink fill, paper text; `chosen-wrong` = 2 px inset ember outline, ink text, one shake (6.3.3); `answer` (revealed when missed) = ink fill, paper text, trailing `.t-meta` on-ink-kicker `the answer`; `dim` = text wait. `grid="2"` renders a 2x2 grid (Odd One Out tiles 72 tall with `Flag s` above the name; Speed Flags two 60-tall rows). `busy` disables pointer events without changing the look.

### 3.22 `Slot` (Country Draft) and `Tile` (Cluster, Odd One Out)
`Slot`: card fill, radius 6, min-height 64, padding 10 12; open = `StatIcon 22` + chip label `.t-body` 500 + clarifier `.t-meta` mute + key numeral `.t-num` mute top-right (hidden on touch); assigned = `Flag xs` + country name `.t-body` 500 + `<b class="t-num num">#4</b>` coloured by rank quality (section 1); unavailable = text wait. Selected (keyboard focus) = the focus ring. `Tile`: card fill, radius 6, `aspect-ratio: 1`, `Flag xs` over the name `.t-kicker` 500 two-line clamp, gap 6; selected = ink fill paper text; solved = the group tone with the trait label.

### 3.23 `Verdict` (the feedback line)
A `.t-body` line always rendered (min-height 20) under the board, `role="status" aria-live="polite"`. Good: ink 600 ("Rank 4. Great pick."). Neutral: mute 500 ("Solid. Rank 14."). Bad: ember 600 ("Costly. Rank 118."). Delta appended in mute 400 (`+118`). Text changes in place with a 4 px `translateY` slide (220 ms). No pill, no icon, no toast. The element never starts hidden.

### 3.24 `ResultPanel`
Rendered by the host on completion (8.4) and by the lockout and run pages. Ink card (radius 12, padding 20, `on-ink`): kicker `TODAY · YOUR SHOT` / `holds till 00:00` (practice: `PRACTICE · {GAME}` / `doesn't count`; run page: `{GAME} · SAT 28 AUG` / `#9 of 41`), `<b class="t-score-xl num">` the game's compact score (`612`, `4/6`, `1 280 pts`, `7 in a row`), then the ranks block `.t-body` on-ink-kicker with 600 numerals (`#9 of 41 global`, `#2 of 5 friends`; practice: `best 790`; unknown rank: `of 41 global` with `–`), then for daily a `.t-body` line "Bad day? <u>Practice a board</u>, it won't count." (lockout mode: "You've shot today. <u>Practice a board</u>, it won't count." followed by a `Countdown label="next board in"` line in on-ink-kicker). Below the card: the game's `Result` rows (8.7), then the action row: daily = `Button ink` "Today's board" (`/games/{slug}/leaderboard`, `prefetch`) + `Button text` "Share" (3.29) ; practice = `Button ink` "New board" + `Button text` "Share". Guests after a daily: `JoinRow` (3.25) between the card and the rows. Then `NextDailies`: a `GameList` head `More dailies today` / `3 of 12 shot`, rows of the unshot dailies (registry order, Country Draft first), each with `Shoot` `.t-meta` ink 600 at the right instead of a chevron. A failed save shows one `.t-meta` ember line under the card: "Couldn't save this shot (played too fast)." with the reason in words (10.8).

### 3.25 `JoinRow` (client)
Card fill, radius 12, padding 16. Title `.t-row` 600 "Get on the board" (practice: "Save this result"), sub `.t-meta` mute "Pick a name, no account needed." `Field` placeholder "Your name", maxLength 30, `autoCapitalize="words"`, Enter submits; `Button ink` "Join" (pending "Joining"). Under it `Button text` "Or sign in to keep your streak across devices" (opens `AuthSheet` with `onSuccess = onJoined`). Calls `joinAsGuest(name)` then `onJoined()` exactly as the auth contract (`understand.json native.auth`): errors "Enter a name first", "Pick a name between 1 and 30 characters", "That name isn't allowed", "Could not join. Try again." as `.t-meta` ember under the field.

### 3.26 `KeyHint`
`.t-meta` mute single line under the options (`1 to 4 pick · Enter next`), rendered only under `@media (hover: hover) and (pointer: fine)` via CSS (present in the HTML, hidden on touch by the media query, never by JS).

### 3.27 `TabBar` (client: `usePathname` for the active state only)
K3 `tabbar`. Fixed bottom, `height: calc(80px + env(safe-area-inset-bottom))`, bar fill, no border, no blur, `padding: 12px 8px 0`, flex space-around, `align-items: flex-start`, `transform: translateZ(0)`. Four `<Link prefetch>` columns, gap 4, `.t-kicker` labels: `home` Play (`/`), `trophy` Ranks (`/categories`), `users` Friends (`/friends`), `user` You (`/profile`). Icon 24; active = ink with the seed dot ember (`seed="ember"`); inactive = faint. Active rule: Play matches `/` and `/games*`; Ranks matches `/categories*`, `/lists*`, `/countries*`; Friends `/friends*`; You `/profile*`. `aria-current="page"`. Above it `FadeBar`: fixed, height 40, gradient transparent to paper, `pointer-events: none`. Hidden on `/games/*/play`, `/auth/*` and at >= 1024. Page bottom padding on phones is 120 px so nothing hides under the bar. When signed in, the You icon is replaced by the viewer's `Crest 22` (no ring; the seed dot rule does not apply to crests). When signed in and friend requests are pending, the Friends label gets a `.t-kicker` 600 ember count after it (`Friends 2`), never a pill; the count comes from `getPendingRequestCount()` awaited in the `(app)` layout's `Promise.all` only for signed-in viewers.

### 3.28 `Nav` (desktop, >= 1024)
Inline in the header: four `<Link prefetch>` items, each `Icon 20` + label `.t-body`, gap 6, item gap 24; active ink 600 with the seed in ember, inactive mute. Same targets and active rule as 3.27. Signed in: the You item shows `Crest 20`. No dot, no underline, no bar.

### 3.29 Share (no sheet, no preview)
"Share" is a `Button text` with `Icon arrow-up-right 16`. On click: `text = builder(...)` from `src/lib/share/*` (unchanged output); if `navigator.share` exists call `navigator.share({ text })` (silent on abort); else `navigator.clipboard.writeText(text)` and `Toast "Copied"`. The share text (which contains the coloured squares for the clipboard) is never rendered on screen. No modal, no `<pre>`, no mono.

### 3.30 `Sheet` (client)
Bottom sheet on phones: bar fill (#fff), top radius 12, padding `20px 20px calc(env(safe-area-inset-bottom) + 28px)`, no grabber; centred 440 px panel (radius 12) at >= 768. Scrim `--color-scrim`, no blur. Enters with `transform: translateY(100%) → 0` 240 ms `--ease-out` (content is in the DOM at full opacity from the first frame); the scrim colour fades 240 ms (it is chrome, not content). Escape and scrim click close; focus trap and focus restore as in the existing auth modal. Used by `AuthSheet` only.

### 3.31 `AuthSheet` (client)
The existing auth modal's behaviour, error taxonomy, focus handling and Apple flow (`understand.json native.auth`) inside `Sheet`. Headline `.t-h2` "Welcome back" / "Create your account", sub `.t-body` mute "Sign in to keep your scores and your streak." / "Scores, a streak, the board with your friends." Two text tabs `Sign in` / `Sign up` with the K3 word underline (`role="tablist"`). `Field` email, `Field` password (show/hide as a `Button text` "Show" / "Hide", `tabIndex={-1}`), caps-lock `.t-meta` ember `role="status"` "Caps Lock is on". Submit `Button ink` block ("Sign in" / "Create account", pending "Signing in" / "Creating account"). `Button text` "Forgot password?" (closes the sheet, links `/auth/forgot-password`). Apple: only when `hasNativeApple()`, `Button ink` block with the Apple mark in paper and "Sign in with Apple"; no "or" divider. `Button quiet` block "Continue as guest" = close. Errors `.t-meta` ember `role="alert" aria-live="polite"` with the contract's strings verbatim. The sheet does not close itself on success; `AuthProvider` closes it on the auth event.

### 3.32 `Toast` (client)
Fixed bottom, above the tab bar (bottom 24 at >= 1024), ink fill, paper text `.t-body`, radius 6, padding 10 14, max-width 350, `translateY(12px) → 0` 200 ms, auto-dismiss 2.4 s, tap dismisses, `role="status"`. Only for "Copied", "Request sent", "Saved", "Removed".

### 3.33 `Field`, `Select`, `Suggest`
- `Field`: height 44 (48 on phones for typed games), radius 6, card fill, no border, padding 0 12, `.t-list` ink, placeholder mute. Focus: the global ring. Label `.t-meta` mute above (or visually hidden). Hint / error `.t-meta` under (error ember; no red border). `inputMode`, `autoComplete`, `autoCapitalize`, `enterKeyHint`, `maxLength` passed through.
- `Select`: the same box; native `<select>` with `appearance: none` and `Icon chevron-down 18` faint at the right; `color-scheme: light`; option text = plain names, never emoji.
- `Suggest` (client): `Field` with a listbox that opens **above** the field on phones (the keyboard sits below) and below at >= 768: bar fill, radius 6, no shadow, no border, rows 44 tall `.t-row` with `Flag xs`, active row card fill. Max 5 (6 for Border Buddies). `role="combobox"`, `aria-expanded`, `aria-activedescendant`, ArrowUp/Down cycle, Enter submits the active suggestion (falls back to the raw text), Tab fills, Escape closes; `onMouseDown` prevents blur on the list. Used by Border Buddies, Continent Sprint, GeoWordle, Borderline, Blitz (no list, plain `Field`), Countries search, Friends search.

### 3.34 `Table`, `RankTable`, `StatRows`
- `Table`: full width `<table>`, `.t-row`, rows padding 10 0, `border-top: 1px solid var(--color-line)`, no header background, `<th scope="col">` `.t-meta` mute 500 left-aligned; value cells `.t-score num` right-aligned; wide tables scroll inside `overflow-x: auto` on phones. No zebra, no borders.
- `RankTable` (rankings, lists): a `<table>` whose rows are laid out as the board grid `18px 26px 1fr auto` (`display: grid` on `tr`): rank `.t-meta` mute, `Flag xs`, name (link to `/countries/{slug}`), value `.t-score num` with the unit `.t-meta` mute after it. `highlight` (the viewer's own country, when the page is dynamic; never on static pages) gets the `.me` treatment. Rank 1 to 3 carry no crown and no colour: the number is enough. No pagination (crawlers need the whole thing).
- `StatRows` (the 21-row country statistics): grid `28px 1fr auto 56px`: `StatIcon 20`, label `.t-row` ink (link to `/categories/{slug}`) + clarifier `.t-meta` mute, value `.t-score num` + unit `.t-meta` mute, world rank `.t-meta` mute right-aligned (`19th`, system face). Missing value: `no data` mute and no rank. Semantics `<table>`.

### 3.35 Editorial text primitives
- `PageTitle { title, eyebrow?, meta?, fact? }`: eyebrow (a `Flag xl` or `StatIcon 32`) above on phones, left of the title on desktop; `<h1 class="t-h1">`; `meta` `.t-row` mute margin-top 8 (one line, middle dots); `fact` `.t-meta` mute right-aligned on desktop. No kicker above it, no rule under it. Margin-bottom 24.
- `EditorialHead { title, lead?, fact? }`: `<h2 class="t-h2">` ink, optional lead `.t-row` mute margin-top 6, optional fact `.t-meta` mute right (baseline aligned). Margin-top 32 (desktop 40), margin-bottom 12.
- `Prose`: `.t-prose` ink, paragraphs spaced 12, `max-width: 62ch`, `<b>` 600, links ink with underline offset 3 and decoration faint (hover: decoration ink; no animated underline).
- `QaList { items, open: "all" | "details" }`: `all` = each item a block, question `<h2 class="t-list">` 600, answer `.t-body` mute margin-top 4, items separated by 1 px line with padding 14 0; `details` = native `<details>` per item, `<summary class="t-list">` 500 ink with `Icon chevron-right 18` faint at the right that rotates 90 deg on open (`transition: transform 160ms`), answer `.t-body` mute padding-bottom 14. Real controls, no JS.
- `FactRow { facts: { value, label, href? }[] }`: at most ONE per page. A single row of 2 to 4 tiles, card fill, radius 12, padding 14 14 12, value `.t-score-l num` ink, label `.t-meta` mute margin-top 4; if `href` the tile is a link (hover fill line). No icon in a tile.
- `SiteFoot` (static pages only): a card-fill island (radius 12, margin-top 40, padding 20) with three inline link lines `.t-row` (links ink, separated by ` · `): "Play · Country Draft · Flag Quiz · Higher or Lower · All games", "Browse · Countries · Rankings · Lists · Most populated · Richest", "Countrivo · Privacy · Terms · Support · Friends · Profile"; then one `.t-meta` mute line "Data: World Bank, REST Countries, WHO, UNWTO. One shot a day, same board for everyone." Not a column footer. App routes (home, play, leaderboard, run, friends, profile) have no footer at all.

### 3.36 `ConquestMap` and `WorldMap`
- `ConquestMap`: Natural Earth land at `wait` (on ink: `--color-ink-2`), taken countries ink (on ink: paper); paths precomputed at build time by `scripts/build-marks.mjs` into `src/assets/marks/conquest.json` (NaturalEarth1 projection fitted to 320x150) and rendered as `<svg viewBox="0 0 320 150">` at any size. Used at 40x26 as the World Draft mark and 314x120 on the world card. No d3 in the client bundle.
- `WorldMap` (GeoWordle, in `src/games/_shared/world-map.tsx`): `<svg viewBox="0 0 360 142">` equirectangular (`x = lng + 180`, `y = 84 - lat`, lat clipped to 84..-58); backdrop = all 237 centroids as `r=1.35` circles in wait; each guess a circle in its band tone; the latest guess ringed `r=8` with a needle rotated by `bearingDeg`; the answer revealed at the end as an ember ring and dot. Height 142 on phones, 200 on desktop.

---

## 4. Icon and mark set

### 4.1 House rules
24-grid, `stroke: currentColor`, `stroke-width: 2`, round caps and joins, `fill: none`, plus exactly one filled circle with class `s` (the seed, r 1.2 to 1.6) as the house detail on every icon. `<Icon name size=22 color="currentColor" seed=color />`; the active tab-bar and nav item pass `seed="ember"`. Drawn as React components in `src/ui/icons/*.tsx`, exported from `src/ui/icons/index.ts`. Chevrons and arrows are the only seedless glyphs. No icon may be a verbatim Lucide or Feather path; no glyph characters (`✓ ✗ → ← ↑ ↓ ↩ ✕ ★ •`) are ever used as icons. Every icon has `aria-hidden` unless given a `title`.

### 4.2 UI icons (name: drawing, coordinates on the 24 grid)
1. `home`: roof `M4 11l8-7 8 7`, walls `M6 10v10h12V10`, door notch `M10 20v-5h4v5`; seed (12,9).
2. `trophy`: cup `M7 4h10v5a5 5 0 0 1-10 0V4z`, handles `M7 6H4.5a2.5 2.5 0 0 0 2.6 4M17 6h2.5a2.5 2.5 0 0 1-2.6 4`, stem `M12 14v3`, base `M8 20h8`; seed (12,8).
3. `users`: head `circle(9,8,3)`, shoulders `M3.5 19a5.5 5.5 0 0 1 11 0`, second head arc `M15 5.5a3 3 0 0 1 0 5`, second shoulders `M17.5 13.8A5 5 0 0 1 21 19`; seed (9,8) r1.2.
4. `user`: head `circle(12,8,3.5)`, shoulders `M5 20a7 7 0 0 1 14 0`; seed (12,8) r1.3.
5. `globe`: `circle(12,12,8.5)`, `M3.5 12h17`, meridians `M12 3.5c3 3 3 14 0 17M12 3.5c-3 3-3 14 0 17`; seed centre.
6. `clock`: `circle(12,12,8.5)`, `M12 7.5V12l3 2`; seed (12,12) r1.4.
7. `crown`: `M4 17l-1-9 5 4 4-6 4 6 5-4-1 9z`, `M5 20h14`; seed (12,13.5).
8. `bolt`: `M13 3L5 13h6l-1 8 9-11h-6l1-7z`; seed (11.5,12.5).
9. `play`: `M8 5.5v13l10-6.5z`; seed (10.5,12).
10. `target`: `circle(12,12,8.5)`, `circle(12,12,4.5)`; seed centre.
11. `medal`: `circle(12,14,5.5)`, ribbons `M9 9.5 7 3h4l1 3 1-3h4l-2 6.5`; seed (12,14).
12. `chevron-right`: `M9 6l6 6-6 6`. `chevron-left`: `M15 6l-6 6 6 6`. `chevron-down`: `M6 9l6 6 6-6`. No seed.
13. `arrow-up`: `M12 19V5m-6 6 6-6 6 6`. `arrow-down`: `M12 5v14m-6-6 6 6 6-6`. No seed. Higher or Lower and Risk Zone buttons.
14. `arrow-up-right`: `M7 17L17 7M9 7h8v8`. The only outbound and share arrow. No right-pointing CTA arrow exists anywhere.
15. `check`: `M5 12.5l4.5 4.5L19 7`; seed at the elbow (9.5,17).
16. `cross`: `M7 7l10 10M17 7L7 17`; seed at the crossing.
17. `undo`: arc `M17 16a6 6 0 1 0-6 6` reversed into a hook: `M16.5 15.5A6.5 6.5 0 1 1 12 5.5H7`, head `M9.5 3l-2.5 2.5L9.5 8`; seed (12,12). Replaces the ↩ glyph.
18. `search`: `circle(10.5,10.5,6)`, handle `M15 15l5 5`; seed (10.5,10.5).
19. `copy`: `rect(9,9,11,11,rx2)`, back outline `M4 15V6a2 2 0 0 1 2-2h9`; seed (14.5,14.5).
20. `plus`: `M12 5v14M5 12h14`; seed centre. `minus`: `M5 12h14`; no seed.
21. `close`: `M6 6l12 12M18 6L6 18`; no seed. Sheet close.
22. `sound`: body `M4 9h4l5-4v14l-5-4H4z`, wave `M17 9a4.5 4.5 0 0 1 0 6`; seed (10,12). `sound-off`: body plus `M17 10l4 4M21 10l-4 4`.
23. `lock`: shackle `M8 11V8a4 4 0 0 1 8 0v3`, body `rect(5,11,14,9,rx2)`; seed as the keyhole (12,15.5). Marks a shot daily in lists.
24. `pin`: `M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z`; seed (12,10). Capitals.
25. `timer`: `circle(12,13,7)`, stem `M12 3v3`, cap `M9 3h6`; seed (12,13). Speed and sprint games.
26. `hash`: `M9 4l-2 16M17 4l-2 16M4 9h16M4 15h16`; seed (12,12). Stat Guesser entry.
27. `flame`: the K3 filled flame (4.4) at 24; the only filled icon; the core is its seed.

### 4.3 Game marks (`Mark`, 28-grid unless noted, ink fill; silhouettes from `src/data/mark-silhouettes.json`, the 12-country client-safe subset: CHL, ISL, AUS, ESP, PRT, BRA, NGA, JPN, DEU, NOR, ARG, MDG)
1. `country-draft` (K3): eight rounded rects 5x8 rx1.2 in two rows of four (x = 2 + i*6.5, y 4 and 16); top row first three solid, bottom row first one solid, the rest at .25 opacity.
2. `world-draft` (K3): `ConquestMap` at 1.55:1 (40x26 at size 26), land wait, BRA, NGA, AUS, JPN, CHL in ink.
3. `higher-or-lower` (K3): Chile silhouette (CHL), tall and thin, it reads as a bar.
4. `geo-wordle` (K3): Iceland outline (ISL), stroke 2.2, dasharray 3 3, no fill.
5. `cluster` (K3): four circles r4.2 at (8,8),(20,8),(8,20),(20,20), two solid, two at .35, four connector strokes 1.6 at .5.
6. `stat-guesser` (K3): three bars 5 wide at x 3 / 11.5 / 20 with heights 11 / 18 / 14 from the base y 25, middle solid, outer .35, dashed line at y 5 (2 2).
7. `risk-zone` (K3): three stacked ellipses rx10 ry4 at cy 21 / 16 / 11, opacities .35 / .6 / 1, with a paper inner ellipse rx4 ry1.6 on the top one.
8. `flag-quiz` (K3): pole `M6 25V4`, pennant `M6 5h15l-3 5 3 5H6`, stroke 2, round joins.
9. `capital-match`: the `pin` glyph at 28 with a 4x3 filled ground bar under its tip at (10,24).
10. `population-sort`: three horizontal bars 18 / 12 / 8 wide, 4 tall, rx1, left-aligned at x 3, y 5 / 12 / 19; the middle one .35.
11. `country-streak`: Japan silhouette (JPN) at x 0..14 solid, followed by two smaller copies to the right at .45 and .2 (a run).
12. `border-buddies`: Spain (ESP) and Portugal (PRT) silhouettes touching, Portugal solid, Spain .35.
13. `odd-one-out`: four circles r3.5 on y 14 at x 5 / 11 / 17 / 23; three filled, the third outlined (stroke 2, no fill).
14. `continent-sprint`: the `timer` ring at 28 with the Nigeria silhouette (NGA) filled inside it at 55 % size.
15. `speed-flags`: the flag-quiz pennant with three motion lines to its left (`M2 9h3M1 13h3M2 17h3`) at .35.
16. `supremacy`: two overlapping rounded rects 12x16 rx2 at (3,6) and (11,4); front solid, back .35.
17. `borderline`: a polyline route `M3 21L9 12l6 3 9-9` stroke 2 with a filled dot r2 at each end.
18. `blitz`: the `bolt` outline at stroke 2 with the seed filled.
Every mark is verified centred in its 28 box at 3x zoom (silhouettes are fitted with a 2 px inset by the build script).

### 4.4 `Flame` (animated)
The K3 `flameLive` port, exact paths and keyframes (6.1). Sizes 18 (header, nudges, session lines), 36 (profile). Fill always ember; the core is paper. Never grey, never "off".

### 4.5 Stat icons (21 categories, 24-grid, same stroke, one seed each; `<StatIcon slug size=20 />` from `src/ui/icons/stat/*.tsx`)
`population` two heads side by side, seed in the front head · `area-km2` a square with four short corner ticks, seed at centre · `gdp-per-capita` a head above a single coin line, seed in the coin · `gdp` a stack of three coin ovals, seed in the top one · `life-expectancy` a heart, seed at its centre · `urban-population-pct` three building silhouettes of different heights, seed as a window · `internet-users-pct` three concentric quarter arcs from the bottom-left corner, seed at the origin · `fertility-rate` a sprout with two leaves, seed at the base · `tourism-arrivals` a plane in a 45 degree climb, seed at the nose · `forest-coverage-pct` a triangular tree with a trunk, seed at the trunk top · `unemployment-rate` a trend line falling left to right over a short baseline, seed at the last point · `military-spending-pct` two nested chevrons (a rank stripe), seed at the apex · `renewable-energy-pct` a single leaf with a mid vein, seed at the vein base · `inflation-rate` a trend line rising, seed at the last point · `beer-consumption-per-capita` a mug with a handle and a foam line, seed in the foam · `coffee-consumption-per-capita` a cup with a handle and one steam curl, seed in the cup · `wine-consumption-per-capita` a stemmed glass, seed in the bowl · `education-spending-pct` a mortarboard with a tassel, seed at the button · `health-spending-pct` a bold plus in a rounded square, seed at the crossing · `arable-land-pct` a wheat ear (stem with three pairs of grains), seed at the top grain · `fdi-inflow` an arrow entering an open box from the top right, seed at the arrow tip. Drawn fresh in the new tree; `src/components/ui/stat-icon.tsx` is not reused.

---

## 5. Flag and crest rendering

### 5.1 Flags
Source: the MIT-licensed `flag-icons` package, `flags/4x3/*.svg` (viewBox `0 0 640 480`; the 4x3 folder already composes non-rectangular flags such as Nepal on the 4:3 canvas). `flag-icons` is added as a devDependency (asset copy only, never imported at runtime; this is the one dependency approval needed, alongside the existing `d3-geo` and `topojson-client` devDependencies used by the build scripts). `scripts/build-flags.ts` (replaces `scripts/fetch-flags.ts`) copies `node_modules/flag-icons/flags/4x3/{iso2}.svg` into `public/flags/{iso2}.svg` for every lowercase `iso2` in `countries.json` (243, including `xk`), overwriting the current 3:2 files under the SAME filenames so `/flags/{iso2}.svg` URLs, `flagSvgPath` and the proxy matcher exclusion survive. Any code missing from the package keeps its current file and is printed by the script; the build fails if a code has no file at all. Every copied file is checked for `viewBox="0 0 640 480"`.
Rendering: `Flag` (3.15). The 1 px inset ring is the only edge treatment; no border, no shadow. Flags are never emoji and never `<option>` decorations: the profile country `<select>` shows display names only, and a `Flag m` of the chosen country renders beside the select (server-rendered from the profile).
Data edits: `Country.flagEmoji`, `Category.emoji` and `GameMeta.emoji` are removed from the types now and from the JSON by the data scripts (`scripts/fetch-country-data.ts`, `scripts/clarify-category-labels.ts` and a one-off `scripts/strip-emoji.ts` run once; JSON is never hand-edited). Two engine edits, both data-shape only, RNG consumption unchanged: `src/lib/game-logic/cluster/engine.ts` line 56 pool filter becomes `countries.filter((c) => c.iso2.length === 2)` (all 243 pass both filters, so the daily draw order is identical) and `ClusterTile` drops `flagEmoji`; `src/lib/game-logic/geo-wordle/engine.ts` drops `flagEmoji` from `GeoGuess`, keeps `bearingDeg`, `direction` and `band`, and keeps the `arrow` string only because it is part of the persisted `resultJson` contract (the UI never renders it; the share builder uses `band`).
Where flags appear: global board rows, leaderboard rows, every board where the flag is the question (Flag Quiz, Country Streak, Speed Flags, Blitz), country identity cells in Draft, Higher or Lower, Capital Match, Stat Guesser, Population Sort, Odd One Out, Cluster, Border Buddies, Borderline, Supremacy, GeoWordle rows; country pages (`xl` in the title), category and list tables (`xs`), the countries index (`xs`). Never as a person's avatar.

### 5.2 Crests
Source: `src/data/silhouettes.json` (173 countries, 100x100 box, built by `scripts/build-silhouettes.mjs`) via `getSilhouettePath(iso3)` in `src/lib/silhouettes.ts` (server only). The server resolves `profile.country_code` (ISO2 or ISO3, `iso2ToIso3`) to a path and passes it down as `viewer.crest: string | null`; board rows carry `crest` per row (already in `BoardRow` / `FriendRow`). Client components never import the JSON; `mark-silhouettes.json` (10 KB) is the only silhouette data in the client bundle.
Rendering: `Crest` (3.16). Waiting friends: wait fill, mute name. Me: ember ring where K3 shows it (friends strip, post-shot). No country chosen or a territory without a silhouette: the seed crest. No initials ever, no "?".
The seed-crest rule: the seed dot is the house detail (4.1); a person without a crest wears the seed alone. The profile nudges "Pick a country and you get a crest."
Where crests appear: the me-row on every board, friends-tab rows, the friends strip, friends page rows, profile heads, the run page owner, the tab bar and desktop nav "You" item when signed in.

### 5.3 Asset budget
`public/flags` about 243 files at about 2 KB. `src/assets/marks/conquest.json` <= 8 KB and `mark-silhouettes.json` 10 KB in the client bundle. `silhouettes.json` (96 KB) stays server-only.

---

## 6. Motion spec

Only purposeful motion. Nothing hides content: nothing animates from `opacity: 0`, nothing waits for an observer, no entrance reveals. Every animation is `transform` or colour. All of it is disabled under `prefers-reduced-motion: reduce` (the flame stops, exactly as K3).

### 6.1 The flame (exact K3, `src/styles/flame.css`)
```css
@keyframes fl-o{0%{transform:scaleY(1) skewX(0)}20%{transform:scaleY(1.06) skewX(-3deg)}45%{transform:scaleY(.96) skewX(2.5deg)}70%{transform:scaleY(1.04) skewX(-1.5deg)}100%{transform:scaleY(1) skewX(0)}}
@keyframes fl-m{0%{transform:scaleY(1) skewX(0)}30%{transform:scaleY(1.12) skewX(3deg)}55%{transform:scaleY(.92) skewX(-3deg)}80%{transform:scaleY(1.06) skewX(1deg)}100%{transform:scaleY(1) skewX(0)}}
@keyframes fl-c{0%,100%{transform:scaleY(1) scaleX(1)}50%{transform:scaleY(1.18) scaleX(.9)}}
@keyframes fl-e{0%{opacity:0;transform:translateY(2px)}15%{opacity:.9}100%{opacity:0;transform:translateY(-9px)}}
.fl-outer{animation:fl-o 1.1s ease-in-out infinite;transform-origin:12px 21px}
.fl-mid{animation:fl-m .8s ease-in-out infinite;transform-origin:12px 21px}
.fl-core{animation:fl-c .55s ease-in-out infinite;transform-origin:12px 20px}
.fl-e1{animation:fl-e 1.4s ease-out infinite}.fl-e2{animation:fl-e 1.9s ease-out .6s infinite}
@media (prefers-reduced-motion:reduce){.fl-outer,.fl-mid,.fl-core,.fl-e1,.fl-e2{animation:none}}
```
SVG (24 viewBox, `overflow: visible`, `vertical-align: -3px`): outer `M12 2.5c.6 3.2 4.4 5 4.4 9.4 0 2.6-1.3 4.6-3.1 5.7-.3-1.4-1-2.4-2-3.1-.9.9-1.6 2-1.8 3.3C7.6 16.7 6.4 14.6 6.4 12c0-2 .8-3.4 1.9-4.5.3 1.3 1 2.1 2 2.4C9.6 7.4 10 4.6 12 2.5z` (ember); mid `M12 8.5c.5 2 2.6 3.1 2.6 5.6 0 1.6-.8 2.9-2 3.6-.2-.9-.6-1.6-1.2-2.1-.6.6-1 1.3-1.1 2.2-1.1-.7-1.9-2-1.9-3.5 0-1.3.5-2.2 1.2-2.9.2.8.6 1.3 1.2 1.5-.2-1.6.2-3.2 1.2-4.4z` (ember, opacity .55); core `M12 13.2c.4 1.2 1.5 1.9 1.5 3.3 0 1.1-.7 2-1.5 2.4-.8-.4-1.5-1.3-1.5-2.4 0-1.4 1.1-2.1 1.5-3.3z` (paper, opacity .9); embers `circle(9.5,9,.9)` and `circle(15,7.5,.7)` (ember, opacity 0 at rest, driven by `fl-e`; the embers are decoration inside the flame, not content, so their opacity keyframe is allowed). The streak number next to it does one `scale 1 → 1.08 → 1` beat, 350 ms `--ease-out`, when it increments after a submit response.

### 6.2 Mode switch knob
`transform: translateX(0 | 100%)` 300 ms `--ease-out`. Label colour swap instant. Nothing else moves.

### 6.3 Authored micro-interactions (the complete list; anything not here does not animate)
1. Subject reveal (next country in Draft, next pair in Higher or Lower, next flag in the quizzes): `transform: translateY(6px) → 0` 220 ms `--ease-out`. Opacity never animates.
2. Draft pick lands: the slot's rank number counts from 0 to the rank over 300 ms (text updated by rAF; the number is visible throughout) and plays `num-pop` (`scale(.88) → 1`, 140 ms) once.
3. Wrong answer: horizontal shake on the pressed option only, `translateX` 0 / -4 / 4 / -2 / 0 over 240 ms, once; the outline lands on ember.
4. Verdict line change: 4 px `translateY` slide, 220 ms.
5. Higher or Lower and Risk Zone reveal: the hidden value counts up from 0 to the real value over 400 ms (tabular numerals; width reserved by a `visibility: hidden` sizer holding the final value).
6. Score arrival on the result panel: the Erode 56 score counts from 0 to the score over 600 ms once; the server HTML contains the final value, the count starts on hydration; reduced motion = static.
7. Cluster solved group: the four tiles slide into a band (FLIP with `transform`, 260 ms) and take the group tone.
8. GeoWordle guess: the proximity bar grows with `transform: scaleX` from 0 to its value (240 ms) with stable square caps (`border-radius: 0`); the needle rotates to its bearing (300 ms).
9. Timer under 5 s (Speed Flags): the numeral takes ember and beats `num-pop` on each tick; the bar shrinks with `scaleX` per tick, linear, 1 s. No pulse.
10. Progress bar (Sprint, Streak): `width` 320 ms `--ease-out`, caps stable.
11. Sheet: `translateY(100%) → 0` 240 ms; scrim colour 240 ms. Toast: `translateY(12px) → 0` 200 ms.
12. FAQ `<details>` chevron: `rotate(90deg)` 160 ms.
13. Countdown: text only, ticks every 30 s. Tab bar, board tabs, nav, pips: instant.
Forbidden: opacity-from-0 entrances, staggered rows, growing underlines, carousel snapping, `animate-pulse`, glow keyframes, hover lifts, scale or translate on press, pane fades, confetti. `src/lib/confetti.ts` is deleted; a celebration is `juice.celebrate()` (sound + haptic) and the streak beat.

---

## 7. Route families: composition, section order, above the fold

Frames: phone = one column, gutters 20, content max-width 560 centred on tablets (768 to 1023). Desktop (>= 1024) = container max-width 1080, padding 0 40; app pages use the grid `minmax(0,1fr) 380px` with column gap 48; editorial pages use main (about 616) + a sticky rail (328, `top: 24px`) with a 56 gap. "Fold" = fully visible at 390x844 above the 80 px tab bar (content area 764 px). Every non-play route renders `Header` first (variant by route group, 9.1); play routes render `PlayBar`; auth pages render the wordmark only. App routes (home, play, leaderboard, run, friends, profile, auth) have no footer; static routes end with `SiteFoot`. Mobile is the design; desktop is a composed two-column version of the same order, never a stretched phone.

### 7.1 Home `/` (dynamic; `(app)` group)
Server inputs: `getViewer()`, `getClock()`, the `cv_mode` cookie (or `?mode=` from the no-JS form, which also sets the cookie via the response), `?tab=`, `getHomeData()`, `getPracticeMetas(viewer)` (`user_game_stats`, signed in only).
Phone order (both panes in the HTML; `<main data-mode="daily|practice">` shows one; the inactive pane is `hidden inert`):
1. `Header app` (64).
2. `ModeSwitch` + help line (44 + 8 + line; margin-bottom 16).
3. Daily pane: `AnchorCard pre|post` for Country Draft (variant decided on the server from the viewer's run or the done cookie; about 269 tall). Practice pane: `AnchorCard practice` (about 180).
4. Daily pane: `Board variant="full"` for `country-draft` (tabs 8 + three rows 33 each + me-row 40 = about 147). Practice pane: nothing here.
5. Daily pane: `GameList` head `More dailies` / `6 games · 0 shot` (rows: World Draft NEW `draft 5 people · conquer 195`, Higher or Lower, GeoWordle, Cluster, Stat Guesser, Risk Zone) then `GameList` head `Drills` / `6 games · 0 shot` (Flag Quiz, Capital Match, Population Sort, Country Streak, Border Buddies, Odd One Out). Counters = rows in that list · rows the viewer has shot today. Practice pane: `GameList` head `Practice any game` / `16 games` (every playable game except Country Draft, main tier first then drills, metas per 10.4). The last list on the screen carries `.fade`.
6. `FadeBar` + `TabBar`.
Fold at 390x844 (K3 measured; the acceptance screenshot is diffed against `home/k3-demo.png`): switch track y 66 to 110; help line about 124; ink card 147 to about 416; board tabs about 450; rows about 494 / 527 / 560; me-row about 597; `More dailies` head about 640; first row about 677 and the second row about 737 dissolving into the 40 px fade at 724; tab bar 764 to 844. Tolerance +-6 px. The whole loop (switch, card, full board with the me-row, the list head) is on one screen. No carousel, no dots, no peeking card, no date row, no sticky chrome, no footer.
Desktop (>= 1024): left column = switch (max-width 420), anchor card, the two lists (or the practice card + practice list). Right column (380, sticky `top: 24px`) = `Board` under a `.t-meta` mute head line `Today · Country Draft`, then `FriendsStrip` when signed in with friends. The header carries `Nav`. The first screen shows switch, card and the whole board side by side.
Rendering: `export const dynamic = "force-dynamic"`; the page awaits `Promise.all([getHomeData(), getViewer(), getPracticeMetas()])` and renders in one pass. No Suspense boundary. The page also emits the ItemList JSON-LD (all 18 games) and the sr-only h1 "Countrivo: daily geography games" (kept for SEO; the visible h1-level title is the card).

### 7.2 Games hub `/games` (static; `(seo)`)
`Header static`; `PageTitle` "All games" with meta `18 games · 243 countries · one shot a day` (counts from the registry); `GameList` `Dailies` / `12 games` (tier main first, then drills, each row linking to `/games/{slug}`, meta = registry `shortDescription`); `GameList` `Practice only` / `5 games`; `GameList` `In development` / `1 game` (World Draft, tag NEW, meta `draft 5 people · conquer 195`); `QaList open="details"` with the three hub FAQs (counts computed); `SiteFoot`. Fold: title, head and the first six rows. Desktop: Dailies left, Practice + In development right, FAQ full width below. JSON-LD unchanged (ItemList 18 + FAQPage 3). Metadata unchanged.

### 7.3 Game landing `/games/[slug]` (static, ISR `revalidate = 60`; one route file with `generateStaticParams` over the 18 slugs; world-draft branches to 7.4)
Card-first, as K2/K3. Order:
1. `Header static`.
2. `AnchorCard landing` (the page `<h1>` is the title inside the card): kicker `DAILY · {TITLE}` / `resets at midnight Berlin`; practice-only games: `PRACTICE · {TITLE}` / `unlimited`. How-text = the one-line rule (10.5); chips = the three facts (10.5); Country Draft uses the `steps` layout and its 8 chips (`generateDraftConfig(getDailyRng(dateKey, edition))` is NOT called here, because that would make the page dynamic; the chips on the landing are the 8 preferred-category labels fixed for the game copy: Population, Land area, GDP per person, Life expectancy, Tourists, Forest cover, Coffee, Internet users). `Button shoot` "Shoot" / "Play".
3. One `.t-body` mute line directly under the card: "or <a>practice a board</a>, it won't count" (dailies) then "One shot per day, same board for everyone, on the global board till midnight Berlin time. <a>Today's board</a>" (a = ember 600 `Button text`, link `/games/{slug}/leaderboard`). Practice-only: "Random boards, unlimited, nothing counts."
4. `Board variant="public"` (dailies only): the public top 3 from `getPublicBoard(slug)` (anon client, `unstable_cache` keyed by dateKey and slug, revalidate 60) and the me-row `sign in to see your shot` linking to the leaderboard. Nothing viewer-specific.
5. `EditorialHead` "How it works": the four rules as `<ol>` with `.t-num` numerals at the left and `.t-body` text (no rail, no line beside the numbers).
6. `EditorialHead` "What {Title} is": `Prose` from `GAME_COPY[slug].about` (verbatim).
7. `EditorialHead` "Questions": `QaList open="details"` from `GAME_COPY[slug].faq` (verbatim).
8. `SectionHead` "More games" / `4 games`: four `GameRow`s (the page's `relatedGames` or the default six's first four).
9. `EntityBlock`: the "{Title} in numbers" prose (ENTITY_COPY verbatim, moved to `src/content/entity.ts`) and its `<dl>` rendered as `StatRows`-style rows (Game / Type / Modes / Daily reset "Midnight, Europe/Berlin" / Session length / Difficulty / Countries covered 243 / Price "Free, no account required"); the platform sentence uses `getAllGames().length`.
10. `SiteFoot`.
Fold: header, the whole card with Shoot, the line, the board head and first row. Desktop: main = card, line, How it works, What it is, Questions, Entity; rail (sticky) = `Board public` then More games. JSON-LD: `GameJsonLd` (BreadcrumbList + VideoGame) once, plus ONE FAQPage built from `GAME_COPY.faq`; the "Step N: What happens next?" FAQPage and the duplicate page-level `GameJsonLd` are dropped (`buildGameJsonLd` keeps its signature; `rules` no longer feed a FAQ). Metadata via `buildGameMetadata(slug)` unchanged. Human copy per slug (hero how-line, rules, relatedGames, facts) lives in `src/content/games.ts`. The OG route `(seo)/games/[slug]/opengraph-image.tsx` reads `params.slug`. No `PlayedToday` fetch on the landing (the Shoot link goes to the play route, which renders the lockout state server-side). No `DateStamp`, no countdown.

### 7.4 World Draft `/games/world-draft` (static; the world-draft branch of 7.3)
`Header static`; `AnchorCard world` (kicker `NEW · IN DEVELOPMENT` / `draft 5 people · conquer 195`, h1 "World Draft", the how-text, the `ConquestMap` 314x120, no button); under it `SectionHead` "Meanwhile" / `today's board`: one `GameRow` for Country Draft with meta `one shot · same board for everyone` and `Shoot` at the right, linking `/games/country-draft/play?mode=daily` (`prefetch`); `EditorialHead` "What World Draft will be": `Prose` from `GAME_COPY["world-draft"].about`; `QaList open="details"` from its faq; `SiteFoot`. Title and canonical unchanged ("World Draft: Draft 5 People, Conquer 195 Countries (Coming Soon)"). No JSON-LD beyond the layout's. No play route exists; the games hub lists it under In development with NEW.

### 7.5 Play `/games/[slug]/play?mode=daily|practice` (dynamic; noindex; `(play)` group; one route file for all 17 playable slugs, section 8)
No `Header`, no `TabBar`, no `SiteFoot`. Width 640 (gutter 20; 720 column centred at >= 1024).
Order: `PlayBar`, `Progress`, the game's `Board`, `Verdict`, `KeyHint`. On completion the host renders `ResultPanel` (3.24) under the board; games with `keepBoardOnResult` (Country Draft, Cluster, GeoWordle, Population Sort, Border Buddies, Borderline) keep the finished board visible above the panel; quiz games hide it.
Already shot today (server-resolved, 9.4): `PlayBar`, then `ResultPanel` in lockout mode (score from the done cookie or the server run; ranks from the run when signed in; `holds till 00:00`; actions "Today's board" ink + "Practice a board" text), then `NextDailies`. Nothing swaps after hydration.
Mode: `?mode=daily` only when the registry lists `daily` for the slug (continent-sprint, speed-flags, supremacy, borderline and blitz never run as daily); no `?mode=` = practice by design. Unknown slug or world-draft = `notFound()`.
Fold budget at 390x844: `PlayBar` 56 + `Progress` 24 + 12 + board + `Verdict` 20 + `KeyHint` 16 <= 764; every board in 8.8 states its subject and controls so all of them fit above about 700 px (Country Draft: subject 128 + 2x4 grid 4x64 + 3x8 = 280 = about 560 total).
Desktop: the same column at 720; the Draft grid is 4x2; Cluster 4x4 at 160 px tiles; quiz options 2x2. No side rail (a board wants one column).

### 7.6 Leaderboard `/games/[slug]/leaderboard?date&tab` (dynamic; noindex; `(app)`)
`Header app`; title row `Mark 26` + `<h1 class="t-h1">{Title}</h1>`, under it `.t-meta` mute `Today's board · 41 shots · top 635 · avg 512` (past day: `Wed 27 Aug · ...`) flanked by `chevron-left` / `chevron-right` day links as 44 px targets (`?date=YYYY-MM-DD`, forward disabled beyond today: faint, `aria-disabled`); `Board variant="full" limit={50}` (tabs are real links here and the client intercept keeps them instant; rows link to run pages; the viewer's row highlighted in place; the me-row pinned last when the viewer is not in the list); when today and the viewer has not shot: a `Nudge` "Your shot is still open. <a>Shoot</a>" (a → `/games/{slug}/play?mode=daily`, `prefetch`) directly under the tabs; empty states per 10.7. Data: `getDailyLeaderboard(slug, dateKey, 50)`, `getFriendsLeaderboard` (friends tab only), `getDailySummary`, profiles `country_code` for flags via `toFlagCode`. Fold: head, title, tabs, nudge, eight rows. Desktop: a single 640 column.

### 7.7 Run `/games/[slug]/run/[runId]` (dynamic; noindex; `(app)`)
`Header app`; head row: `Crest 40` (owner's crest; wait crest when none) + display name (link `/profile/{username}`) + `.t-meta` mute `{Title} · Sat 28 Aug`; `ResultPanel` variant `shared` (kicker `{TITLE} · SAT 28 AUG` / `#9 of 41`, the compact score, `top 22 %`); the game's `RunDetail` rows (8.7; the module's own for Country Draft, Stat Guesser, Border Buddies; `GenericDetail` for the rest reads the known `resultJson` keys score, total, streak, bestStreak, avgError, accuracy, correct, rounds); `Button ink` "Play {Title}" → `/games/{slug}`; `Button text` "Board" → `/games/{slug}/leaderboard`. `notFound()` when the run is missing or `run.gameSlug !== slug`. Metadata as today (title `{displayName}'s {Title} · {date}`, `robots: { index: false }`); the description drops "daily challenge" (10.1). Desktop 640 column. The OG route stays generic (`renderGameOgImageForSlug(slug, { badge: "Shared result", ... })`).

### 7.8 Countries hub `/countries` (static; `(seo)`)
What it is: an index you can search that also tells a first-time visitor the site is a game. Order: `Header static`; `PageTitle` "Countries" meta `243 countries and territories · flags, capitals, 21 rankings`; `Suggest`-less `Field` search (client enhancement; placeholder "Search a country or capital"; filters the already-rendered rows by name or capital, diacritics folded, hides continent groups that go empty; on hydration it reads `?q=` once to prefill and apply the filter; the server never reads `q`, so the page stays static); `Prose` intro (two short paragraphs written new in the voice of section 10: what a profile contains, where the data comes from (World Bank, WHO, UNWTO, REST Countries), and "Every country here can turn up in Flag Quiz, Higher or Lower and Country Draft." with three text links); `FactRow` x 4 fixed editorial facts (no date rotation, no build-time freeze; each linking to the country): `17.1M km²` / Russia, the largest; `1.43B` / India, the most people; `2.0 km²` / Monaco, the smallest with a capital; `0` / Nauru has no capital city; continent anchor links as a text row (`Africa · Americas · Asia · Europe · Oceania`, `href="#africa"` etc., real anchors, no JS); five continent groups each `SectionHead` "{Continent}" / `{n} countries` (with `id`) then `GameRow`-shaped rows with `Flag xs`, name, meta = capital (or `no capital`), chevron, linking `/countries/{slug}`; `SiteFoot`. All 243 rows are in the HTML (text floor >= 800 chars). The WebSite `SearchAction` is removed from the layout JSON-LD. The emoji COUNTRY_PULLS are gone. Desktop: search + intro + facts in main, groups in two columns below; rail = the "Play with countries" `GameList` (Flag Quiz, Capital Match, Border Buddies).

### 7.9 Country `/countries/[slug]` (static, 243; `(seo)`)
One column of meaning, not a stack of cards (composition from editorial 7.9, expressed in rows). Order:
1. `PageTitle`: eyebrow `Flag xl` (104x78), title = displayName (`.t-h1`), meta `{Continent} · {Subregion} · capital {Capital}` (`· no capital` for Macau). No ISO codes here.
2. Standing: `SectionHead` "Where {Name} stands" / `{k} of 21 rankings` then the ONE `FactRow` of the page: the three best world ranks (lowest rank numbers with data), value `19th` (`.t-score-l`, system ordinal suffix), label = category `shortLabel`, third line the formatted stat `.t-meta`; each tile links `/categories/{slug}`.
3. About: `EditorialHead` "About {Name}" → `QaList open="all"` with the six question/answer pairs from `buildCapsules` (text verbatim, function moved to `src/features/seo/capsules.ts`; questions are `<h2>`; capped at six by rule).
4. All statistics: `EditorialHead` "All statistics and world rankings" / fact `Data updated {Month D, YYYY}` (from `data-timestamps.json` `generatedAt`, read at build) → `StatRows` (21 rows via `formatStat`, so the crawler canaries `124.5M` and `84.0 years` stay).
5. Neighbours: `SectionHead` "Borders {Name}" / `{n} countries` → rows `Flag xs` + name + meta `shares a land border`, chevron; zero: one `.t-body` mute row "No land borders. {Name} is an island or an exclave state."
6. Peers: `SectionHead` "Close to {Name} by population" / `by area` → the four + four `RelatedCountries` stat-neighbour links as rows (`Flag xs`, label "{Country} population", meta `{value} · {ordinal} in the world`); then "Regional hubs" as two rows (the continent list page, `/countries`). Anchor text stays descriptive (link logic verbatim from `related-countries.tsx`, moved to `src/features/seo/peers.tsx`).
7. Same continent: `SectionHead` "More in {Continent}" / `{n} countries` → 12 rows (flag + name).
8. Play: `SectionHead` "Play with {Name}" / `5 games` → `GameRow`s for Flag Quiz, Higher or Lower, Capital Match, Country Draft, Border Buddies (landing links; no ink promo card on this page).
9. Rankings: `SectionHead` "Rankings" → rows for most-populated-countries, largest-countries, richest-countries, `/categories` (`StatIcon` lead).
10. Entity line `.t-meta` mute: `ISO 3166-1 alpha-2 {DE} · alpha-3 {DEU} · {Subregion}`.
11. `SiteFoot`.
Desktop: main = title, About, All statistics, Neighbours, Peers; rail (sticky) = Standing, Play, More in continent (first 6), Rankings. JSON-LD unchanged (BreadcrumbList + Country). Metadata template unchanged. `generateStaticParams` over all 243; `notFound()` otherwise. Fold: title block, the standing row, the first capsule.

### 7.10 Rankings hub `/categories` (static; `(seo)`)
`Header static`; `PageTitle` "Rankings" meta `21 statistics · every country ranked`; 21 rows: `StatIcon 24` in the 42 px lead slot, label `.t-list`, meta `{clarifier} · {source} {year}`, three `Flag xs` (top 3) before the chevron, link `/categories/{slug}`; `SectionHead` "Test yourself" → `GameRow` Higher or Lower ("the daily that tests exactly this"); `SiteFoot`. Desktop: rows in two columns. No JSON-LD beyond the layout's.

### 7.11 Category `/categories/[slug]` (static, 21; `(seo)`)
The world as one board. Order: `PageTitle` eyebrow `StatIcon 32`, title "{Label} by Country", meta `{clarifier} · {source} {sourceYear} · {n} countries ranked`, then the `description` sentence as a `.t-row` mute lead; the ONE `FactRow` of the page = the top 3 (value = formatted stat `.t-score-l`, label `1st · {Country}` with a `Flag xs` inline, tiles link to the country); `EditorialHead` "Full world ranking" / `{n} countries` → `RankTable` with every ranked country (`getTopCountries(slug, 300)`), value + unit, links to `/countries/{slug}`, no pagination; `SectionHead` "Source" → one `.t-body` mute paragraph: "{source}, {sourceYear}. Coverage {coveragePercent} % of countries. {Higher is better. | Lower is better. | Neither direction is better; this is a descriptive ranking.}"; `SectionHead` "More rankings" → 12 rows (`StatIcon` lead); `SectionHead` "Test yourself" → 4 `GameRow`s: Country Draft, Higher or Lower, Population Sort, Stat Guesser; `SiteFoot`. Desktop: main = title, lead, table; rail = top-3 row, source, more rankings, test yourself. JSON-LD unchanged (BreadcrumbList + ItemList top 10, numberOfItems = ranked count). Metadata unchanged.

### 7.12 Lists hub `/lists` (static; `(seo)`)
`Header static`; `PageTitle` "Country lists" meta `15 curated rankings`; `Prose` with the two existing intro paragraphs (verbatim); 15 rows (lead = `StatIcon 24` of the underlying stat for the 11 stat lists and `Icon globe 24` for the 4 continent lists; title; meta = description; chevron); `SectionHead` "Test yourself" → `GameRow`s Flag Quiz, Country Draft, Higher or Lower and a row "All games" → `/games`; `SiteFoot`. The list of 15 lives in `src/content/lists.ts` and is the single source for the hub, the 15 pages, `lists/sitemap.ts` (`LIST_SLUGS` derived) and `scripts/build-data-timestamps.ts` (`LIST_SOURCES` derived).

### 7.13 List `/lists/[slug]` (static, 15; one template `ListArticle`; `(seo)`)
The 15 hand-written page files are replaced by `(seo)/lists/[slug]/page.tsx` with `generateStaticParams` over `LISTS` and a synchronous `generateMetadata` returning each list's exact `metaTitle`, `description` and absolute canonical (strings carried verbatim into `src/content/lists.ts`: `{ slug, metaTitle, description, h1, intro: string[], quickFacts, faq: { q, a }[], source: { kind: "stat", category } | { kind: "continent", continent }, seeAlso: string[] }`). Order: `Header static`; `PageTitle` title = the current h1, meta `{n} countries · {source} {year}`; the number: `.t-score-xl num` headline figure with a `.t-body` mute caption (stat lists: row 1 at build, e.g. `17.1M km²` / "Russia, the largest country on Earth"; continent lists: `{n}` / "countries and territories in {Continent}"); `Prose`: the intro paragraphs verbatim; the ONE `FactRow` of the page = the four Quick Facts, numbers derived from `getTopCountries` at build so they cannot drift, labels from the content module; `EditorialHead` "The ranking" / `top {n}` → `RankTable` (top 50 for stat lists; all countries by population for continent lists, four columns rank · flag+name · capital · population, area added at >= 1024); `EditorialHead` "Questions" → `QaList open="all"` with the two FAQ pairs (question wording verbatim; continent answers derived from data: "There are 44 sovereign countries in Europe; this list also shows the {n-44} territories Countrivo tracks, {n} entries in all."); `SectionHead` "Play the ranking" → `GameRow`s Country Draft, Higher or Lower, Population Sort; `SectionHead` "See also" → rows to the sibling lists; `SiteFoot`. Desktop: main = title, number, prose, ranking, questions; rail = facts, play rows, see also. JSON-LD unchanged in shape: one `@graph` (BreadcrumbList Home > Lists > short name, FAQPage 2) plus `ListItemJsonLd` (50 or the full continent). The `/lists/largest-countries` floor (>= 2320 chars) is met by prose + facts + 50 rows + FAQ.

### 7.14 Friends `/friends` (dynamic; signed in; guests `redirect("/")`; `(app)`)
`Header app`; `PageTitle` "Friends" meta `{a} of {b} have shot today`; `FriendsStrip` "Friends today" / `3 of 5 have shot` (sorted by today's Country Draft score, then shots); `SectionHead` "Requests" / `{n}` (only when any) → rows `Crest 26`, name, `Button ink` "Accept" + `Button text` "Decline" (`respondToFriendRequest` in `useTransition`, optimistic removal); `SectionHead` "Find players" → `Suggest`-style `Field` ("Search by name", 300 ms debounce, min 2 chars, `searchUsers`) with results as rows (`Crest 26`, name, `@username` meta, `Button text` "Add" → "Sent"; empty: "No players found."); `SectionHead` "Your invite link" → one row with the URL `.t-meta` and `Button text` "Copy" (toast "Copied"); `SectionHead` "Friends" / `{n}` → one row per friend: `Crest 40`, name `.t-list`, meta `3 shots today · streak 9` or `not played today`, a second line of the friend's today shots as `Mark 18` + `.t-score` pairs (`draft 612 · hol 14 · wordle 3/6`) each linking `/games/{slug}/leaderboard?tab=friends`, and a `minus` icon button (44 px) "Remove" (`removeFriend`, optimistic, toast "Removed"); empty: "No friends yet. Search for players above to add them." No challenges section, no duels, no W/L/D dots, no game colour washes, no header badge from challenges (the tab bar's Friends label carries the pending-requests count as in 3.27). Fold: title, strip, requests or the search field, first three friend rows. Desktop: left = strip, requests, search, invite; right = friends rows.

### 7.15 Add friend `/friends/add/[username]` (dynamic; `(app)`)
`Header app`; `Crest 64` + name `.t-h1` + `@username` meta; `.t-body` "Add {name}?"; `Button ink` "Send request" (pending "Sending"; then the row reads "Request sent. {name} will see it." + `Button text` "Go to friends"); existing states verbatim from the social contract ("You're already friends with {name}!" becomes "You're already friends with {name}." ; "Friend request already sent to {name}."); self → `redirect("/profile")`; unknown → "Player not found." with `Icon user 24` (no emoji); signed out → the head + `Button ink` "Sign in to add {name}" (opens `AuthSheet` with `onSuccess` = `router.refresh()`). The request is sent only on click, never on GET.

### 7.16 Profile `/profile` and `/profile/[username]` (dynamic; `(app)`)
Own profile: `Header app`; hero row `Crest 64` (ember ring) + `<h1 class="t-h1">{displayName}</h1>` + `@username` meta + streak line (`Flame 18` + `.t-score-l num` count + `.t-body` mute `day streak · best {longest}`; no streak: the flame stays lit, no number, "No streak yet. One shot starts it."; no country: "Pick a country and you get a crest."); `StreakWeek`; `SectionHead` "Today" → `GameList` of today's shots (mark, title, meta `612 · #9 of 41`), rows link to the leaderboard; empty: one row "No shot yet today. <a>Shoot</a>"; `SectionHead` "Numbers" → one `.t-body` line `142 runs · 31 dailies · 12 games`; `SectionHead` "Games" → rows per `user_game_stats` (mark, title, `18 runs · best 7/10`); the edit forms: `Field` display name (max 30) + `Select` country (`value = iso3`, names only, chosen `Flag m` beside it) + `Button ink` "Save" (pending "Saving", toast "Saved"), `Field` username (filters to `[a-z0-9-]`, max 20, Save disabled when unchanged or < 3) + `Button ink` "Save"; `SectionHead` "Sound and haptics" → one row with `Icon sound|sound-off 22` and two text tabs `On` / `Off` with the word underline (`juice.toggleMute`, `aria-pressed`); `Button quiet` "Sign out"; `Delete account` two-step (`Button text` "Delete my account" → `Button ink` "Yes, permanently delete" + `Button text` "Cancel"; failure "Could not delete account. Please try again."); admin uid only: `Button quiet` "Reroll today" (`rerollDailyAction`, which also calls `revalidateTag("edition", "max")`). After a successful profile save the client re-fetches the profile through the provider (`profileGenRef` bump inside the provider; the form calls `refreshProfile()` exposed by the provider).
Public profile: same hero (no ring), `Button ink` "Add as friend" → `/friends/add/{username}` when signed in and not friends, Today, Numbers, Games, and `SectionHead` "Same dailies, last 30 days" → one `.t-body` line `you 4 · them 6 · 2 draws` then up to 10 rows `Mark 18 · date · 612 vs 635` (`getHeadToHead`, when signed in and total > 0). Own username → `redirect("/profile")`; unknown → `notFound()`.
Desktop: left = hero, streak, Today, Numbers, forms; right = Games and head-to-head.

### 7.17 Auth `/auth/forgot-password`, `/auth/reset-password` (`(auth)` group; noindex, nofollow)
Header = `Wordmark` only. A 440 px column (full width on phones): `PageTitle` "Reset your password" / "Set a new password", one `.t-body` line, `Field`s, `Button ink` block with pending labels "Sending" / "Updating", states and anti-enumeration copy from the auth contract verbatim ("Check your email", "If an account exists for {email}, you'll get a reset link within a minute.", "Use a different email", "Link expired or invalid", "Request new link", "Passwords don't match.", "Password updated"). No card around the form. `/auth/callback/route.ts` unchanged (moved into the group folder, same URL).

### 7.18 Legal `/privacy`, `/terms`, `/support`, `not-found`, `error`
`(seo)`: `Header static`; `PageTitle`; `Prose` sections with `EditorialHead`s; the support FAQ as `QaList open="details"`; `mailto:countrivo@gmail.com` as a text link; `SiteFoot`. Indexable, not in sitemaps. `not-found.tsx`: `PageTitle` "Not on the map", `.t-body` mute "That page does not exist.", `Button ink` "Home" + `Button text` "All games". `error.tsx` ("use client"): "Something went wrong", `Button ink` "Try again", `Button text` "Home". `global-error.tsx` ("use client"): own html/body with inline token hexes (paper, ink, mute, ember) and the same copy.

---

## 8. The shared game frame and the per-game board contract

### 8.1 What the frame owns (package P3, `src/features/play/*`)
- `src/app/(play)/games/[slug]/play/page.tsx`: ONE dynamic page for all 17 playable games (the 17 per-slug play folders are deleted; URLs are unchanged because `[slug]` matches them). It resolves `mode`, `edition`, `dateKey`, `seed`, `viewer`, `lockout`, `resume`, `friendsToday`, and renders `<PlayFrame>` around the slug's host component.
- `PlayFrame` (server): `PlayBar` then the host.
- `GameHost` (client, generic): owns the reducer, the action log and its persistence, submission, the auth hand-off, `Progress` / `Verdict` / `ResultPanel` / `JoinRow` / `KeyHint`, keyboard binding, juice calls, feedback windows, the push-permission prompt. It receives a `GameModule` and renders `module.Board` and `module.Result`.
- `src/games/registry.ts` (server-only map): `HOSTS: Record<GameSlug, ComponentType<HostProps>>` importing the 17 per-game `host.tsx` client entries statically. A server-side map of client components costs nothing on the client: the browser fetches only the chunk of the host that appears in the RSC payload, so each board stays its own chunk.
- `src/games/types.ts`: the `GameModule`, `BoardProps`, `HostProps`, `Action` and `Codec` types (frozen on day 3 of the Foundation step).
- `src/games/_shared/*`: board furniture shared by several boards (`option-list.tsx`, `country-block.tsx`, `tile-grid.tsx`, `found-list.tsx`, `world-map.tsx`, `pair.tsx`), frozen after week 1; boards may not add files there.
- `src/server/progress.ts` (co-owned with P1): cookie parse and replay.

### 8.2 `GameModule`: a server-safe adapter plus a client board
Each game is a folder `src/games/{slug}/` with exactly these files:
- `module.ts` (no React, importable on the server and the client): the adapter below. It imports only the engine (`src/lib/game-logic/{slug}`), `src/lib/seeded-random.ts`, the data accessors and the codec helpers.
- `board.tsx` ("use client"): the board.
- `result.tsx` ("use client"): the result rows under the `ResultPanel`.
- `run-detail.tsx` (server component): the rows for `/run/[runId]` (or a re-export of `GenericDetail`).
- `host.tsx` ("use client", 6 lines): `export function CountryDraftHost(p: HostProps) { return <GameHost module={module} Board={Board} Result={Result} {...p} /> }`.

```ts
export interface GameModule<S, A extends Action> {
  slug: GameSlug;
  /** Pure. Same seed → same state on server and client. No Date.now(), no Math.random(). */
  create(seed: number, mode: Mode, dateKey: string): S;
  /** Pure reducer over engine functions. Unknown actions return state unchanged. */
  reduce(state: S, action: A): S;
  /** Compact codec for the resume log (8.6). Round-trips every persisted action. */
  codec: { enc(a: A): string; dec(s: string): A[] };
  /** Which actions are persisted. Default: all except { ui: true } and tick actions. */
  persist?(action: A): boolean;
  done(state: S): boolean;
  progress(state: S): { done: number; total?: number; label: string; value: string; extra?: string; bar?: boolean };
  /** Verdict for the last action, or null to leave the line unchanged. */
  verdict(prev: S, next: S, action: A): { tone: "good" | "neutral" | "bad"; text: string; delta?: string } | null;
  /** Milliseconds the host holds `busy` after an answer before applying the queued advance (0 = none). */
  feedbackMs?: number;
  /** Payload for submitGameRun (exact shapes from understand.json engines.games[*].submission). */
  payload(state: S, ctx: { mode: Mode; dateKey: string; startedAt: string }): SubmitGameRunInput;
  /** Compact score for the result card and the done cookie ("612", "4/6", "1 280 pts", "7 in a row"). */
  scoreLabel(state: S): string;
  /** Key map while the board is live and not busy. */
  keys?(state: S, dispatch: (a: A) => void): Record<string, () => void>;
  keepBoardOnResult: boolean;
  submits: boolean;          // false for blitz, borderline, supremacy (never call submitGameRun, as today)
}

export interface BoardProps<S, A> {
  state: S;
  dispatch: (a: A) => void;   // the host wraps it: records, persists, juices by verdict tone
  mode: Mode;
  busy: boolean;              // true during a feedback window
  viewer: Viewer;             // { signedIn, name, crest }
  seed: number;               // for boards that render a hint derived from the seed (none today)
}

export interface HostProps {
  slug: GameSlug; mode: Mode; dateKey: string; edition: string; seed: number;
  log: string;                // encoded resume log ("" when fresh)
  startedAt: string;          // ISO, from the cookie or the request time
  viewer: Viewer; resetAt: number; serverNow: number;
  friendsToday: number | null; friendCount: number;
  streakBefore: number;       // for the streak beat
}
```
The host computes `state = replay(module, seed, log)` in the lazy initialiser of `useReducer`, identically on the server (SSR of the client component) and on the client, so the first HTML already shows the resumed board and hydration finds identical markup. No state object crosses the RSC boundary (engine states contain `Set`s; only `seed` and the encoded log travel).
Rules for module authors:
1. `create` is deterministic given `seed`. Practice boards get a fresh server seed per request; "New board" asks the host for a new seed (`crypto.getRandomValues` on the client); only the first practice board needs server/client parity.
2. Time-dependent engines (Speed Flags `startGame(now)`, Continent Sprint `pickContinent`, Blitz `roundStartTime`) put the timestamp in an action (`{ t: "start", now }`) dispatched from a user gesture, never in `create`. Blitz's `create` sets `roundStartTime: 0` and the first `start` action stamps it (a wrapper action in the module, not an engine edit).
3. Actions are small and serialisable (indices, iso3 strings, numbers). The persisted log must stay under 900 bytes (8.6).
4. Boards never call `submitGameRun`, `useAuth`, storage, cookies or timers for submission; the host does. Boards may run their own interval for a visible clock (`tick` actions, not persisted).
5. Boards use only `src/ui/*` primitives, `src/games/_shared/*` and the tokens; no hex, no `border-border`, no tinted pills, no glyph icons (`✓ ✗ → ↑ ↓ ↩ ✕`), no text arrows.
6. Every board renders its complete initial UI from `state` with no effects needed to become visible.
7. Feedback windows (the coloured pause after an answer) are host-driven: the module returns `verdict` and `feedbackMs`; the host sets `busy` for that long before applying the queued `advance`; boards render the revealed look from `state` plus `busy`.
8. The 60 s reveal window and the one free undo in Country Draft are contracts (8.8).

### 8.3 Actions and codecs per game (the resume log; `t` is the tag)
Encoding: the log is a string of tokens; each token is one lowercase letter followed by fixed-width or `;`-terminated arguments as listed; iso3 codes are three uppercase letters; indices are one base-36 digit. Tick actions are never persisted.

| Game | Actions (tag) | Codec tokens | Worst case |
|---|---|---|---|
| country-draft | `pick{c}` (categoryIdx 0-7), `undo`, `seen` (reveal acknowledged) | `p{c}` `u` `s` | 8 picks + 1 undo + 1 = 20 chars |
| flag-quiz | `answer{i}` (0-3) | `{i}` | 10 chars |
| capital-match | `answer{i}` | `{i}` | 10 chars |
| odd-one-out | `answer{i}`, `next` | `{i}` `n` | 10 chars |
| country-streak | `answer{i}` | `{i}` | 243 chars |
| higher-or-lower | `guess{h or l}` | `h` / `l` | 80 chars |
| population-sort | `move{from,to}` (not persisted), `order{perm}` (the current order, rewritten on every move), `submit` | `o{6 digits}` `s` | 8 chars |
| border-buddies | `found{iso3}`, `giveup` | `f{ISO}` `g` | 14 borders = 57 chars |
| stat-guesser | `guess{v}`, `next` | `g{number};` `n` | about 80 chars |
| geo-wordle | `guess{iso3}` | `g{ISO}` | 24 chars |
| cluster | `toggle{iso3}`, `clear` (ui, not persisted individually), `submit` | `S{ISO...}` (current selection, rewritten), `q{ISO}{ISO}{ISO}{ISO}` per submit | 8 submits + selection = 117 chars |
| risk-zone | `guess{h or l}`, `bank`, `push`, `next` | `h` `l` `b` `p` `n` | about 80 chars |
| continent-sprint, speed-flags, supremacy, borderline, blitz | practice only; nothing persisted | | |
Cluster and Population Sort persist a state snapshot token instead of the raw event stream; `dec` expands `S`/`o`/`q` into the toggle/move/submit actions the reducer understands.

### 8.4 Host state machine
`idle → live → (busy ↔ live)* → finished → submitting → settled | join`.
- `live`: the board is interactive; every dispatched action goes through `reduce`, is appended to the log, persisted (8.6) and produces juice by verdict tone (`good → juice.correct`, `bad → juice.wrong`, `neutral → juice.select`; `milestone` every fifth correct in the streak games).
- `finished` (`module.done`): the host writes the done cookie (8.6) and the localStorage lockout belt, builds `payload`, then: signed in and `submits` → `submitting` → `submitGameRun` → `settled` with the run (ranks); guest and daily → `join` (`JoinRow`; `onJoined → openAuthModal(submit)` per the auth contract → `settled`); practice → no cookie, no join; submit only when signed in (practice runs count for personal stats as today).
- `settled`: `ResultPanel` shows `#rank of shots` from `run.rankDaily` and `getDailySummary`-free counts (`shots` = the day's board count passed by the page), `#k of n friends` from `friendsToday`. If `submitGameRun` fails (`already_played`, `server_validation_failed`, `too_fast`, `invalid_start_time`, `not_authenticated`), the panel shows the score with the ember line "Couldn't save this shot ({reason})." and the actions remain. Idempotency on `started_at` makes a second submit safe.
- `juice.celebrate()` once on `finished`. The streak beat fires when `run` shows the streak grew (`profile.streakCurrent` after vs `streakBefore`). `requestPushPermission()` once after the first settled daily (`countrivo_push_prompt_seen`, native only).

### 8.5 Feedback windows and keyboard
The host binds `module.keys(state, dispatch)` with `useGameKeys` while `live && !busy`. Conventions kept per game: digits `1`..`8` for slots and options, ArrowUp/ArrowDown for higher/lower, `b` / `p` in Risk Zone, Enter for next/submit, Backspace/Escape for deselect, Tab to fill a suggestion. `feedbackMs`: flag-quiz 1200, capital-match 1200, country-streak 800, higher-or-lower 1500, speed-flags 0, odd-one-out and stat-guesser 0 (explicit `next`), risk-zone 0 (explicit), blitz 1500 (between rounds), supremacy 2000 (auto advance after reveal). Higher or Lower and Risk Zone also accept a vertical swipe of >= 40 px on the pair (touch handler on the `Subject pair` element; up = higher, down = lower); the hint `swipe up for higher, down for lower` is rendered only under `@media (hover: none)`.

### 8.6 Persistence without localStorage gates
- Progress cookie `cv_p_{slug}` = `{dateKey}|{edition}|{startedAtMsBase36}|{log}`; `Path=/`, `SameSite=Lax`, `Max-Age = msUntilReset / 1000`; written by the host via `document.cookie` on every persisted action (the whole cookie, cheap, <= 1 KB). The page reads it on the server (`src/server/progress.ts`), discards it when the date or edition differ, decodes `log` with the module codec, and passes `log` and `startedAt` to the host; the host replays it in its initialiser, so the resumed board is in the first HTML and there is no jump. `startedAt` from the cookie keeps the server's 3 s `too_fast` check honest across reloads. Hard cap: if a write would exceed 900 bytes the host stops persisting further actions (never truncates mid-token) and logs a console warning; every codec in 8.3 stays far below it. Practice runs are not persisted.
- Done cookie `cv_done` = JSON `{ d: dateKey, e: edition, g: { [slug]: scoreLabel } }`, same expiry, rewritten on every completion (about 20 bytes per game). The play page renders the lockout from it for guests, and for signed-in users from `getTodayRun(userId, slug, dateKey)` (`src/server/runs.ts`, the `checkDailyStatus` query inlined without the action round-trip). The home card and `NextDailies` counters read the same sources.
- localStorage belt: on completion the host still writes `countrivo_lockout_{slug}_{dateKey}_e{edition}` (`{ score, scoreDisplay, timestamp }`) through `setStorageItem` so a rollback to the previous build keeps its lockouts; nothing in the new tree reads it. The old progress keys are neither written nor read; `use-daily-progress.ts` is deleted.
- Sound mute stays in localStorage (`countrivo_sound_muted`) inside `use-juice.ts` (kept). `countrivo_push_prompt_seen` stays.
- Cookies used by the whole app: `cv_mode`, `cv_p_{slug}` (12 at most), `cv_done`, plus the Supabase auth cookies. Nothing else.

### 8.7 Board layout language (so 17 boards look like one product)
- The question area is at the top: `Subject` (3.20). For "what flag is this" games `Subject flag-only`.
- Answer options are `Options` rows (3.21): full width, 52 tall, card fill; revealed states per section 1 (ink fill for right, ember inset outline for wrong, never an ember fill behind text).
- Grids use `Slot` / `Tile` (3.22), gap 8 (Cluster gap 6), radius 6; selected = ink fill; solved = group tone with the trait label; assigned = flag + name + Erode rank.
- Text-entry games use `Suggest` at the top (list opens above on phones), found items as `Flag xs` + name rows under it with `Icon check 16`, misses with `Icon cross 16`.
- Numbers that matter are Erode (`.t-score`, `.t-big`, `.t-score-xl`).
- Result rows (`result.tsx`) and run-detail rows use `RankTable`-style grids or `GameRow`-shaped rows; no coloured washes, no stars (the grade is a word in `.t-h3`).
- Verdict copy per game is section 10.6.

### 8.8 Per-game boards (the acceptance spec each board owner builds against)
Grammar per entry: Session line · Subject · Controls · Verdict · Keys · Result rows. Every board fits `PlayBar` 56 + `Progress` 36 + subject + controls + `Verdict` 20 + `KeyHint` 16 inside 764 px at 390x844 (fold budget 7.5). Copy is terse, numerals are digits, facts are joined by ` · `. Wrong = ember outline or ember text, never an ember fill behind text. Payloads are the exact shapes in `understand.json engines.games[*].submission`.

**Country Draft** (anchor). Session `pick 3 of 8` · `score 412`; 8 pips. Subject: `Flag l` + `.t-card` country name + `.t-body` mute `Americas · South America`, reveal motion 6.3.1 each step. Controls: a 2x4 grid (two columns of four rows on phones, 4x2 on desktop) of `Slot`s (min-height 64, gap 8, about 280 px total): open = `StatIcon 22` + chip label (10.6) `.t-body` 500 + clarifier `.t-meta` mute + key numeral top-right; assigned = `Flag xs` + country name + `<b class="t-num num">#4</b>` coloured by rank quality; the slot geometry is 2x4 so all eight slots and the subject fit above the fold. Under the grid: `Button text` "Undo last pick · 1 left" with `Icon undo 16`, only while `canUndo`. Verdict: rank <= 5 `Rank 4. Great pick.` (good, `juice.correct`), <= 30 `Solid. Rank 18.` (neutral, `juice.select`), else `Costly. Rank 120.` (bad, `juice.wrong`), delta `+120`. Keys 1 to 8. After the 8th pick: the reveal window: the board stays with all ranks, session `all picks in · score 612`, `Button ink` "See result"; undo is still allowed (resets the window); the host auto-dispatches `seen` after 60 s (`RESULT_REVEAL_MS = 60000`, kept). Result rows: a head line `you 612 · optimal 188 · gap 424` with the grade word `.t-h3` (`Great.`), then 8 rows grid `26px 1fr auto auto`: `Flag xs`, country, `your pick` (`StatIcon 18` + `#rank` `.t-score` coloured by quality), `optimal` (`StatIcon 18` + `#rank` mute); a row where the pick equals the optimal shows one `Icon check 16` instead of the second column. `keepBoardOnResult: true`. Share text via `buildCountryDraftShareText` with `rank` injected from the run.

**Higher or Lower** (main). Session `streak 7` · `best 22`, no pips: `Flame 18` + streak numeral `.t-score` in the session line. Subject `pair` under a `stat` line (`StatIcon 22` + `Population` `.t-list` 500): left `Flag m`, name, value `.t-score-l num`; right `Flag m`, name, `?` in wait. Controls: two stacked `Options` rows `Higher` (`Icon arrow-up`) / `Lower` (`Icon arrow-down`). Reveal 1500 ms (`busy`): the right value counts up (6.3.5), the correct button fills ink, a wrong button takes the ember outline. Touch: swipe up / down on the pair (8.5); keys ArrowUp / ArrowDown. Verdict `Right.` / `Wrong. Streak ends.` Result: `7 in a row` big; rows: the last 5 pairs (`left vs right · stat · your call`, the wrong one in ember text). `keepBoardOnResult: false`. `scoreMax = streak` as today.

**GeoWordle** (main). Session `guess 2 of 6`; 6 pips. Subject: `WorldMap` (3.36), height 142; under it one `.t-body` line `Norway is 2 340 km north-east of the answer.` (intro copy before the first guess: `A hidden country. Every guess tells you how far and which way.`). Controls: `Suggest` "Type a country" (list above the field, max 5, excludes guessed) with `Button ink` "Guess" inline right (grid `1fr auto`). Guess rows (max 6, 34 tall): `Flag xs`, name, `2 340 km` `.t-score`, a 3 px proximity bar (band tone on line, `scaleX`), the needle icon rotated by bearing; empty rows are wait dashes. Errors under the field for 2 s: `Not a country.` / `Already guessed.` (`juice.wrong`). Keys: ArrowUp/Down, Enter, Tab, Escape; focus returns to the field after each guess. Result: `4/6` big (lost: `X/6` and `It was Chad.`); rows = the guess rows plus an `Answer` row when lost; the map shows the answer ring. `keepBoardOnResult: true`. Share via `buildGeoWordleShareText`.

**Cluster** (main). Session `groups 1 of 4` · `mistakes 1 of 4`; 4 pips (ember-outlined for mistakes). Subject: `.t-body` mute "Tap four countries that share a connection." Controls: 4x4 `Tile` grid (gap 6, `aspect-ratio: 1`, `Flag xs` over the name); selected = ink fill; a solved group collapses into a full-width band in its tone with the trait label `.t-body` 500 (FLIP 6.3.7). Under the grid: `Button ink` "Submit" (disabled until 4 selected, label `Submit 3/4` while short) + `Button quiet` "Deselect". Verdict: the trait on a solve (`Western Africa.`), `One away.`, `One mistake left.`, `Not a group.` Keys Enter / Backspace. Result: `3/4` big; rows: four bands (trait, `solved` or `missed`, members as `Flag xs` + names). `keepBoardOnResult: true`.

**Stat Guesser** (main). Session `round 2 of 5`; 5 pips. Subject `stat` (`StatIcon 28` + `.t-card` `Population` + clarifier), then a `.t-body` reference line `For reference: Norway 5.5M` with `Flag xs`, then the target `Subject` (`Flag l`, name). Controls: `Field` `inputMode="decimal"` placeholder `e.g. 1.5M, 200K, 3B` (parser as today: a single comma with no period is a decimal separator; otherwise commas stripped; k/m/b/t suffixes) + `Button ink` "Submit" inline. Feedback phase (explicit `next`): two `.t-score-l` lines `your guess 4.2M` / `actual 5.5M` and `24 % off` (ink < 20, mute < 50, ember otherwise), `Button ink` "Next round" / "See result". Keys Enter. Result: `18 % avg error` big (score 82); rows: 5 (`Flag xs`, country, stat, actual, `% off`). `keepBoardOnResult: false`. Share via `buildStatGuesserShareText` (names never printed).

**Risk Zone** (main). Session `chain 2 of 5` · `pot 225` · `banked 480`; 5 pips (ember-outlined for a wipe). Subject `pair` with the `stat` line and the multiplier `x2.25` `.t-num` beside the pot. Controls: guess phase `Higher` / `Lower` options; decide phase `Button ink` "Bank 225" + `Options` row "Push to x3" with `small` `one wrong wipes 225`; wiped / banked phase `Button ink` "Next chain" / "See result". Verdict `Right. Pot 225.` / `Busted. Chain wiped.` / `Banked 225.` (`juice.celebrate` on a bank). Keys ArrowUp/ArrowDown, b, p, Enter; swipe as in Higher or Lower. Result: `1 280 pts` big; rows: 5 chains (`stat · +225 (x2.25)` or `wiped` in ember text). No glyph strings (the old 💥🎲🏦 are gone). `keepBoardOnResult: false`.

**Flag Quiz** (drill). Session `flag 3 of 10` · `right 2`; 10 pips. Subject `flag-only` (`alt=""`). Controls: 4 `Options` (names). 1200 ms window with the fill states; Verdict `Right.` / `Wrong. It was Chile.` Keys 1 to 4. Result: `7 / 10` big; rows: 10 (`Flag xs`, name, `Icon check` or `Icon cross`). `keepBoardOnResult: false`.

**Capital Match** (drill). Session `country 3 of 10` · `right 2`; 10 pips (progress = question index, fixing the old quirk). Subject: `Flag l` + name + `.t-body` mute "What is the capital?". Controls: 4 `Options` (capitals). Same window, verdict and result grammar (`7 / 10`). `keepBoardOnResult: false`.

**Population Sort** (drill). Session `sort 6 by population` · `highest first`; no pips. Subject `stat` line only. Controls: 6 rows (card fill, radius 6, 52 tall): `.t-num` position, `Flag xs`, name, `Icon arrow-up` / `arrow-down` 44 px icon buttons (disabled at the ends, wait). Keyboard: ArrowUp/Down move the selection cursor, Space moves the selected row up one, Enter submits. `Button ink` "Submit order". Result: `4 / 6` big; rows: the correct order with the value and `Icon check` where the player placed it right, `Icon cross` otherwise. Copy says six everywhere. `keepBoardOnResult: true`.

**Country Streak** (drill). Session `streak 7` · `best 12` with `Flame 18`. Subject `flag-only` + `.t-body` mute "Which country is this?". Controls: 4 `Options`. 800 ms window. `juice.milestone` every fifth. Result `7 in a row` (0: `First answer is the hardest.`); rows: the last 5 flags with check / cross. `keepBoardOnResult: false`.

**Border Buddies** (drill). Session `found 3 of 9`; pips = border count. Subject `Flag l` + name + `.t-body` mute "Name every neighbour". Controls: `Suggest` "Type a country" (max 6; excludes found and the target; Enter selects the first suggestion) + `Button ink` "Add"; the found list as `Flag xs` + name rows with `Icon check`; `Button quiet` "Give up". Verdict `Found.` / `Not a border.` Result: `9 / 9` big (`All borders found.`) or `6 / 9` (`3 missed.`); rows: every border with check or cross. `keepBoardOnResult: true`.

**Continent Sprint** (practice only). Picking phase: `.t-body` "Pick a continent." + 5 `Options` (`Africa · 58 countries`); the `start` action carries `now`. Playing: session `named 12 of 50` · `3:42` (`.t-score num`, a `tick` action every second, not persisted); 3 px bar instead of pips. `Suggest` (Enter selects the first suggestion, fixed from the click-only behaviour) with the found list newest first (max-height 240, scroll); `Button ink` "Finish". Verdict `Found.` (`juice.correct`) / `Not on this continent.` (`juice.wrong`). Result: `12 / 50 named` · `Africa in 3:42`; rows: the full continent with check / cross in a scroll box. `submits: true` (practice runs count for personal stats, as today).

**Odd One Out** (drill). Session `round 2 of 5` · `right 1`; 5 pips. Subject: `.t-body` mute "Three share a trait. Which one doesn't?" Controls: `Options grid="2"` of `Flag s` + name tiles (72 tall). Feedback phase (explicit `next`): the odd tile fills ink, a wrong choice takes the ember outline, one `.t-body` line with the trait (`The other three are in Africa.`), `Button ink` "Next round" / "See result". Keys 1 to 4, Enter. Result `4 / 5`; rows: 5 with four `Flag xs` (the odd one ringed in ember) and the trait. `keepBoardOnResult: false`.

**Speed Flags** (practice only). Ready screen: `Mark speed-flags 44`, `.t-body` "20 seconds. Two options each. Go.", `Button ink` "Start" (`start{now}`). Playing: session `20 s` (`.t-score num`, ember under 5 with the beat) · `right 12`; the shrinking bar (6.3.9); `Subject flag-only`; `Options grid="2"` (two names, 60 tall). No blocking window; Verdict `Right.` / `Wrong.` Keys 1, 2. Result: `23 flags` · `88 % accuracy` · `26 in 20 s`.

**Supremacy** (practice only). Session `round 2 of 5` · `you 1 · ai 0`; 5 pips. Subject `pair`: your card (`Flag m`, name, the chosen stat value once picked) and the AI card (a wait-filled placeholder with the seed dot until reveal). Controls on your turn: 5 `Options` (`StatIcon 18` + shortLabel + value `.t-score` or `n/a`); AI turn: `.t-body` mute "AI picks in a moment." (no pulsing dot), the host dispatches `aipick` after 800 ms, `reveal` 200 ms after a pick, `advance` after 2000 ms. Reveal line `You win this round.` / `AI wins this round.` / `Draw.` Hand preview: 5 `Flag xs` in a row (played ones wait). Result `3 - 2` big; rows: 5 (`Norway vs Chile · population · you`). `submits: false`.

**Borderline** (practice only). Session `steps 2` · `optimal 4`. Subject: a row `Flag m` start → `Flag m` target with names (`Start` / `Target` `.t-meta`), then the current country as `Subject` (`Flag l`, name, `You are here`). Controls: `Suggest` "Type a bordering country" (unvisited neighbours, max 5, Tab fills, Enter submits via `fuzzyMatchCountry`) and the neighbour chips (paper `Chip`s as buttons, 44 px hit area via padding, tap to move); the path as a `Flag xs` chain with `Icon chevron-right 14` faint separators. Errors under the field for 2 s (`Country not found`, `X does not border Y`, `You already visited X`). Result `4 steps` · `optimal 4` (`Perfect.` when equal); rows: the path. `keepBoardOnResult: true`, `submits: false`.

**Blitz** (practice only). Session `round 3 of 10` · `right 2`; 10 pips. Subject `flag-only`. Controls: `Field` "Type the country" (`autoCapitalize="off"`, autofocus per round) + `Button ink` "Enter"; wrong = the shake on the field and an ember focus ring for 500 ms; between rounds (1500 ms `busy`): the name appears under the flag with `Right.` / `Missed.` Result `7 / 10` · `avg 1.8 s`; rows: 10 (`Flag xs`, name, time or `missed`). `submits: false`.

**World Draft**: no board, no module. The landing (7.4) is the whole surface; `/games/world-draft/play` is `notFound()`.

### 8.9 Registry and copy corrections shipped with the rebuild (code, not JSON edits)
- continent-sprint and speed-flags are practice-only everywhere: the play page forces `mode = "practice"` for any slug whose `availableModes` lacks `daily`; no lockout, no persistence, no daily submit for them.
- Population Sort renders 6 rows and every string says six (the registry `shortDescription` "Sort 5 countries." is corrected in the next data-script run; until then the landing how-line comes from `src/content/games.ts`, which says six).
- Higher or Lower's swipe hint is real (8.5).
- Capital Match's progress is the question index.
- `RESULT_REVEAL_MS = 60000` and the single free undo stay.
- GameOverScreen's estimated percentile, "you beat N players", StatPills, daily-chain box, insight text and confetti do not return. The result surface is 3.24.

---

## 9. Rendering and data flow with no loading states

### 9.1 Request pipeline
1. `src/proxy.ts` (Next 16 name for middleware; `src/middleware.ts` is deleted). Matcher: everything except `_next/*`, `flags/*`, `fonts/*`, file extensions (`svg png jpg jpeg gif webp ico woff2 txt xml`), `robots.txt`, `sitemap.xml`, `*/sitemap.xml`, `manifest.webmanifest`, `opengraph-image`, `icon`, `apple-icon`, and the static SEO families `/countries`, `/countries/*`, `/categories`, `/categories/*`, `/lists`, `/lists/*`, `/privacy`, `/terms`, `/support`, `/games` exactly and `/games/{slug}` exactly for the 18 registry slugs (a regex built from the registry at build time in the matcher string; play, leaderboard and run paths are NOT excluded). Those routes never need a session, so static HTML is never blocked on a Supabase round trip. It also handles the no-JS mode switch: `GET /?mode=daily|practice` → 303 to `/` with the `cv_mode` cookie set (3.5). For the rest it calls `updateSession()` (`src/lib/supabase/session.ts`, the renamed `middleware.ts`) exactly as today (`auth.getUser()`); if the project is switched to asymmetric JWT signing keys, `auth.getClaims()` replaces it (no network hop; with the current legacy key `getClaims` falls back to the same request, so the switch is safe either way).
2. `src/server/viewer.ts` `getViewer()` (React `cache()` per request): server Supabase client → `getUser()` → one `profiles` select (`id, username, display_name, country_code, streak_current`) → `{ user, profile, signedIn, name, crest: getSilhouettePath(iso2ToIso3(country_code)), streak }`. Called by the `(app)` layout and any page that needs the viewer; one auth call and one query per request.
3. `src/server/edition.ts` `getEdition()`: `unstable_cache` over an anon `@supabase/supabase-js` client read of `app_config.daily_edition`, key `["daily-edition"]`, `revalidate: 60`, `tags: ["edition"]`; `rerollDailyAction` calls `revalidateTag("edition", "max")` after the RPC (two-argument form; Next 16 deprecates the one-argument form). No cookie dependency, so play pages for guests do no DB work. (`unstable_cache` is deprecated in Next 16 in favour of `use cache`; it still works and `cacheComponents` is not enabled in this rebuild. Migrating the three cached reads to `use cache` is a follow-up, not part of this build.)
4. `src/server/clock.ts` `getClock()`: `{ now: Date.now(), dateKey: getTodayDateKey(), resetAt: now + msUntilReset() }` once per request (`cache()`), plus `formatReset(ms)` producing `17 h 37 m` / `41 m` / `now`.
5. `src/server/boards.ts`: the anon-client public-boards read moves here from `home.ts` as `getPublicBoards(dateKey, dailySlugs)` (same query, same `unstable_cache` 30 s, same 6 s timeouts) and `getPublicBoard(slug)` for landings (`unstable_cache` 60 s, tag `boards`). `src/app/actions/home.ts` keeps `getHomeData()` with its exact return shape and imports `getPublicBoards` from here (an internal refactor, not a contract change).
6. `src/server/runs.ts` `getTodayRun(userId, slug, dateKey)`: the `checkDailyStatus` query (`game_runs` by user, slug, `daily_date`, mode daily, `.maybeSingle()`) mapped through the same `mapGameRun`; `getTodayRuns(userId, dateKey)` for the home card, `NextDailies` and the profile.
7. `src/server/progress.ts`: `readProgress(cookies, slug, dateKey, edition, codec)` → `{ log, startedAt } | null`; `readDone(cookies, dateKey, edition)` → `Record<slug, scoreLabel>`.
8. `src/server/home-lists.ts` `getPracticeMetas(viewer)`: one `user_game_stats` select by `user_id` (<= 18 rows) → `{ [slug]: { runs, best } }` for the practice metas (10.4).
9. Root layout `src/app/layout.tsx` is free of dynamic APIs: `<html lang="en" class={erode.variable}>`, `<body>`, fonts, `<AuthProvider>` (no initial user), `<NativeBootstrap/>`, `<ToastProvider>`, `<AuthSheet/>`, `<main>`, `<Analytics/>`, `<SpeedInsights/>`, metadata (strings from `understand.json seo`; the description's game count from `getAllGames().length`; `verification.google` kept), viewport (`themeColor: "#fbfaf6"`, `colorScheme: "light"`, `viewportFit: "cover"`), the JSON-LD `@graph` with `WebSite` (no `potentialAction`) and `Organization`. Four route groups supply the chrome (route groups do not change URLs; the same `games/[slug]` prefix in two groups is fine because the full paths differ):
   - `(app)/layout.tsx` (home, leaderboard, run, friends, add-friend, profile): `await Promise.all([getViewer(), getClock()])`, renders `<ViewerSeed user profile/>` (a client component that seeds the provider so `useAuth()` starts with `loading: false` and the server user), `<Header variant="app" viewer clock/>` (a server component, so the crest, streak and countdown are in the first HTML), the page, `<FadeBar/>` and `<TabBar viewer/>`.
   - `(play)/layout.tsx` (`/games/[slug]/play` only): `getViewer()` + `<ViewerSeed/>`, no header, no tab bar, no footer; the page renders `PlayBar` itself.
   - `(auth)/layout.tsx` (`/auth/forgot-password`, `/auth/reset-password`): `Wordmark` only, no tab bar. `src/app/auth/callback/route.ts` stays at the root (route handlers use no layout; URL unchanged).
   - `(seo)/layout.tsx` (games hub, landings, world-draft, countries, categories, lists, legal): renders `<Header variant="static"/>`, the page, `<FadeBar/>`, `<TabBar/>` and nothing dynamic; every page in the group stays fully static (ISR where noted). The provider resolves the session on mount for these pages only, which changes nothing visible because they render no viewer-specific UI.
   The `AuthProvider` rewrite keeps every invariant of `understand.json native.auth` (stable `openAuthModal`, `userRef`, deferred `onAuthStateChange`, `profileGenRef`, `PASSWORD_RECOVERY` bypass, sign-out order, `joinAsGuest` flow) and adds `initialUser` / `initialProfile` props plus `refreshProfile()`; it refreshes the profile in the background after mount.
10. Home (`(app)/page.tsx`): `force-dynamic`; awaits `Promise.all([getHomeData(), getViewer(), getPracticeMetas(viewer)])` and renders in one pass. No Suspense boundary, no `loading.tsx`.
11. Play page: `await searchParams`, `getClock()`, `getEdition()`, `cookies()` (mode, progress, done), `getViewer()`; signed in and daily → `getTodayRun()` (one select) and `getFriendsLeaderboard` count for `friendsToday`. `seed = dateSeed(dateKey + edition)` for daily; `seed = crypto.getRandomValues(new Uint32Array(1))[0] >>> 1` for practice; passes `HostProps`. Guest daily budget: no DB, about 5 ms of server work.
12. Leaderboard, run, friends, profile: server components awaiting the kept actions; each renders its frame and data in one pass (no Suspense); queries are single round trips.
13. Every `<Link>` to a dynamic route a user is likely to tap (Shoot, "New board", list rows, tab bar, "Today's board", the leaderboard nudge) sets `prefetch={true}` so the full RSC payload of the dynamic route is fetched when the link enters the viewport; the click then paints the full page at once (with no `loading.tsx` there is nothing to show in between, and prefetch makes the wait invisible). Links from static pages to play routes prefetch too.
14. Countdowns everywhere are `Countdown` with `resetAt` / `serverNow`. No client-side date math on the first render anywhere.

### 9.2 What is a client component (complete list)
`ModeSwitch`, the `Board` tab swapper, `Countdown`, `Streak` beat, `TabBar` (active state), `GameHost` and every `board.tsx` / `result.tsx`, `JoinRow`, `AuthSheet`, `Sheet`, `Toast`, `Suggest`, the countries search filter, friends search and request buttons, profile edit forms, the sound row, the delete-account flow, the admin reroll button, `ViewerSeed`, `NativeBootstrap`, `AuthProvider`, `error.tsx`, `global-error.tsx`. Everything else is a server component. No client component renders differently on the server than on its first client render (the acceptance run logs zero hydration warnings).

### 9.3 Data contracts used (unchanged)
`getHomeData()` → `HomeData`; `submitGameRun(input)`; `getDailyLeaderboard`, `getFriendsLeaderboard`, `getDailySummary`, `getRunDetail`, `getUserTodayRuns`, `getFriends`, `getPendingRequests`, `getPendingRequestCount`, `searchUsers`, `sendFriendRequest`, `respondToFriendRequest`, `removeFriend`, `getPublicProfile`, `getProfileTodayRuns`, `getHeadToHead`, `updateProfile`, `updateUsername`, `rerollDailyAction`, `savePushToken`. `checkDailyStatus` and `getUserGameStats` remain exported with zero callers. `src/app/actions/challenges.ts` stays on disk with zero callers (schema and RPC contract kept; no UI). New server-only helpers live in `src/server/*` and are never imported by client components.

### 9.4 Lockout resolution
`resolveShot(slug, dateKey, edition, viewer, cookies)`: signed in → `getTodayRun` → `{ scoreLabel, scoreDisplay, rankDaily, percentile, runId }`; guest → `cv_done.g[slug]` → `{ scoreLabel }`. Used by the play route (7.5), the home card variant and counters, `NextDailies`, and the profile "Today" list.

### 9.5 Caching
Public boards 30 s; landing board 60 s (ISR); edition 60 s with tag invalidation; static families prerendered at build with `generateStaticParams` (243 + 21 + 15 + 18 + hubs); OG images computed from the registry only. No `revalidatePath` anywhere. Nothing viewer-specific is ever cached.

### 9.6 Deploy timing and the release note
The old localStorage progress and lockout keys are no longer read. Deploy the rebuild right after 00:00 Europe/Berlin so no in-progress daily is lost and the day's lockouts start fresh; the release note says so. `PROGRESS_VERSION` is gone with the hook; the cookie log carries `dateKey` and `edition` and is discarded when either differs.

### 9.7 Hydration rules
- Any server string that can drift within seconds (the countdown) carries `suppressHydrationWarning` on its own `<b>`.
- No `Date.now()` / `Math.random()` in render paths. Practice reseed and the `start{now}` actions happen in event handlers.
- The mode switch reads the cookie server-side; the tab bar reads `usePathname()`; both are hydration-safe.
- `localStorage` is read only in effects and only to advance visible state (sound mute), never to decide what is rendered first.
- Pending states are label swaps (React 19 `useActionState` / `useTransition` / `useFormStatus`); there is no spinner component.

### 9.8 Native
`bootstrapNative` sequence unchanged except: status bar fixed to `Style.Light` with no media listener; `SplashScreen.hide` on the first `requestAnimationFrame` after mount. Push tap deep link `/games/{slug}/play` resolves through the single play route (practice mode, as today without `?mode=`). `requestPushPermission()` is called by the host on the first settled daily. `persistSession` / `clearPersistedSession` stay inside the provider. `capacitor/www/offline.html` is repainted in the tokens (paper ground, ink text, ember `Retry` button, no emoji).

---

## 10. Copy voice with examples

Second person, lowercase `you`, short declaratives, facts as numerals joined by ` · `, one word for the action. No exclamation marks in system copy, no em dashes (a comma, a colon or a full stop instead), no "challenge" for the daily (the product words are `daily`, `shot`, `board`), no "awesome", no "level up", no "Blitz mode", no "playing now". Units are spaced: `17 h 37 m`, `1 280 pts`, `24 h`, `24 % off`. Buttons are one or two words. SEO strings (GAME_SEO titles and descriptions, GAME_COPY, ENTITY_COPY, capsules, list intros and FAQ questions, hub metadata) are kept verbatim from the kept modules; only the "Daily challenge" phrases are replaced (10.1).

### 10.1 The "daily challenge" replacements (exact)
- Root metadata description: "Play {n} free geography games online. One shot a day, flag quizzes, country rankings, capitals and stat puzzles. 243 countries. No signup needed." OG title: "Countrivo | Free Geography Games, One Shot a Day". Manifest description: "Play {n} geography games. One shot a day, flag quizzes, country rankings and strategy puzzles. 243 countries." (`n = getAllGames().length`).
- Entity block modes: "Daily board and unlimited practice" / "Practice only"; daily paragraph: "{Title} has a daily board: every player in the world gets the same puzzle on the same day, and the {Title} board resets at midnight Europe/Berlin time. Outside the daily board, {Title} can be played an unlimited number of times in practice mode."
- Run page description: "{displayName} scored {scoreDisplay} on the {gameTitle} daily board for {date}."
- Games hub FAQ question: "How does the daily work?"
- OG badge: "Daily board" / "Practice" / "Shared result".
- Terms and support prose: "daily board" for "daily challenge".

### 10.2 Fixed strings (home, header, play chrome)
| Place | Copy |
|---|---|
| Header | `resets in 17 h 37 m` · static pages: `Today's draft` |
| Switch help | "One shot per game, same board for everyone, 24 h." / "Random boards, unlimited, nothing counts." |
| Card kicker | `TODAY · COUNTRY DRAFT` / `41 shots · top 635` / empty `no shots yet` |
| Card how | "Countries appear one at a time. Put each one on the stat where it ranks highest in the world. Eight picks, one shot." |
| Card steps | `1 8 stats are on the board` · `2 countries appear one by one` · `3 put each where it ranks best` |
| CTA | `Shoot` (dailies) · `Play` (practice-only) · `New board` (practice) |
| Post-shot | `TODAY · YOUR SHOT` / `holds till 00:00` · `612` · `#9 of 41 global` · `#2 of 5 friends` · "Bad day? Practice a board, it won't count." |
| Practice card | `PRACTICE · COUNTRY DRAFT` / `you've run 14` · "A fresh board every time." · "Your practice best is 790. Nothing here touches the leaderboard." |
| Board | `Global` · `Friends` · `41 shots` · `1 shot` · `no shots yet` · `3 of 5 have shot` · `you` · `no shot yet` · `not yet` · `Full board` |
| Board, public | `Today · global` / `41 shots · 9 countries` · `sign in to see your shot` |
| Empty board | "No shots yet today. Be the first." · "See how your friends shot today. Sign in" · "No friends yet. Add a few and today's shots line up here." · "No friends have shot today." · "No shots on this day." |
| List heads | `More dailies` · `Drills` · `Practice any game` · `Dailies` · `Practice only` · `In development` · `More dailies today` · `More games` |
| Play mode | `Daily · one shot` / `Practice · doesn't count` |
| Result kicker | `TODAY · YOUR SHOT` / `holds till 00:00` · practice `PRACTICE · {GAME}` / `doesn't count` |
| Result actions | `Today's board` · `Share` · `Practice a board` · `New board` |
| Lockout | the post-shot card, then "You've shot today. Practice a board, it won't count." |
| Join | `Get on the board` · `Save this result` · "Pick a name, no account needed." · `Your name` · `Join` · `Joining` · "Or sign in to keep your streak across devices" |
| Save failed | "Couldn't save this shot (played too fast)." · "(already played today)" · "(the server rejected the replay)" · "(not signed in)" |
| Leaderboard | `Today's board` · `Wed 27 Aug` · `41 shots · top 635 · avg 512` · "Your shot is still open. Shoot" |
| Countdown states | `resets in 41 m` · `resets now` · `next board in 17 h 37 m` |
| Streak | `3 day streak · best 9` · "No streak yet. One shot starts it." · "play any daily to keep it" |
| Auth | `Welcome back` · "Sign in to keep your scores and your streak." · `Create your account` · "Scores, a streak, the board with your friends." · `Sign in` · `Sign up` · `Create account` · `Continue as guest` · `Forgot password?` · error strings verbatim from the auth contract |
| 404 | `Not on the map` · "That page does not exist." · `Home` · `All games` |
| World Draft | `NEW · IN DEVELOPMENT` / `draft 5 people · conquer 195` · "Draft five people. Give each a seat: leader, general, money, propaganda, diplomacy. Then send them out and count how many of the 195 countries they take. Same draft for everyone, one shot." · `Meanwhile` |
| Landing line | "or practice a board, it won't count" · "One shot per day, same board for everyone, on the global board till midnight Berlin time. Today's board" · practice-only: "Random boards, unlimited, nothing counts." |
| Games hub | `All games` · `18 games · 243 countries · one shot a day` |
| Friends | `Friends` · `3 of 5 have shot today` · `Friends today` · `you're #2` · `Requests` · `Find players` · `Search by name` · `Add` · `Sent` · `Accept` · `Decline` · `Your invite link` · `Copy` · `Copied` · `Remove` · `Removed` · `3 shots today · streak 9` · `not played today` · "No players found." · "No friends yet. Search for players above to add them." · "Beat 610 and you're ahead of endy for the day." |
| Profile | `Today` · `Numbers` · `Games` · `142 runs · 31 dailies · 12 games` · `18 runs · best 7/10` · `Save` · `Saving` · `Saved` · `Sound and haptics` · `On` · `Off` · `Sign out` · `Delete my account` · `Yes, permanently delete` · `Cancel` · "Pick a country and you get a crest." · `Same dailies, last 30 days` · `you 4 · them 6 · 2 draws` · `Add as friend` · `Reroll today` |
| Countries hub | `Countries` · `243 countries and territories · flags, capitals, 21 rankings` · "Search a country or capital" · "Every country here can turn up in Flag Quiz, Higher or Lower and Country Draft." |
| Country page | `Where Germany stands` / `19 of 21 rankings` · `About Germany` · `All statistics and world rankings` / `Data updated August 2, 2026` · `Borders Germany` / `9 countries` · `Close to Germany by population` · `by area` · `Regional hubs` · `More in Europe` · `Play with Germany` · `Rankings` · "No land borders. Iceland is an island or an exclave state." |
| Category page | `Population by Country` · `total people · World Bank 2023 · 217 countries ranked` · `Full world ranking` · `Source` · "Higher is better." · `More rankings` · `Test yourself` |
| Lists | `Country lists` · `15 curated rankings` · `The ranking` / `top 50` · `Questions` · `Play the ranking` · `See also` · "Russia, the largest country on Earth" · "countries and territories in Europe" |

### 10.3 Product vocabulary
`daily` (the mode), `shot` (one daily run), `board` (a leaderboard and a game board), `Shoot` (the CTA), `resets in`, `holds till 00:00`, `practice`, `New board`, `you`, `friends`, `global`, `streak`, `NEW`.

### 10.4 List metas (server-computed)
- Daily, viewer shot: `your shot 635 · #9 of 41`.
- Daily, others shot: `41 shots · top 635`.
- Daily, none: `no shots yet`.
- Daily, viewer shot and rank unknown yet: `your shot 635`.
- Practice pane, signed in with stats: `27 played · best 22`; without: `practice`.
- Practice pane, guest: the registry `shortDescription`.
- World Draft: `draft 5 people · conquer 195` with `NEW`.
- Games hub (static): the registry `shortDescription`.
- Profile "Today": `612 · #9 of 41`; profile "Games": `18 runs · best 7/10`.
- Result `NextDailies`: `41 shots · top 635` or `no shots yet` with `Shoot` at the right.

### 10.5 One-line rules and three facts per game (landing how-text, play hint, chips)
Country Draft: the how (10.2) and its 8 chips. Higher or Lower: "Two countries, one stat. Call which ranks higher. One wrong call ends the streak." · `2 countries` · `1 stat` · `2 to 5 min`. GeoWordle: "A hidden country. Every guess tells you how far and which way. Six tries." · `6 tries` · `237 countries` · `1 to 2 min`. Cluster: "Sixteen countries, four hidden groups of four. Four mistakes and it's over." · `16 countries` · `4 groups` · `4 mistakes`. Stat Guesser: "A country and a stat. Guess the number. Five rounds, closest wins." · `5 rounds` · `% error` · `3 to 5 min`. Risk Zone: "Call higher or lower, bank the pot or push for more. One wrong call wipes the chain." · `5 chains` · `x5 max` · `1 to 2 min`. Flag Quiz: "Ten flags, four names each. Score out of ten." · `10 flags` · `4 options` · `2 to 3 min`. Capital Match: "Ten countries, four capitals each." · `10 countries` · `4 options` · `2 to 3 min`. Population Sort: "Six countries. Put them in order, highest first." · `6 countries` · `1 stat` · `2 to 4 min`. Country Streak: "Name the flag. Keep going till you miss." · `243 flags` · `4 options` · `till you miss`. Border Buddies: "One country. Name every neighbour." · `1 country` · `all borders` · `2 to 4 min`. Continent Sprint: "Pick a continent. Name every country in it, on the clock." · `5 continents` · `on the clock` · `3 to 10 min`. Odd One Out: "Four countries, three share a trait. Find the one that doesn't." · `5 rounds` · `4 countries` · `3 to 5 min`. Speed Flags: "Twenty seconds. Two names per flag. Go." · `20 s` · `2 options` · `1 min`. Supremacy: "Five cards, five stats, the AI on the other side." · `5 rounds` · `5 stats` · `vs AI`. Borderline: "Cross borders from start to target in as few steps as you can." · `start to target` · `fewest steps` · `2 to 5 min`. Blitz: "Type the country before the next flag." · `10 flags` · `typed` · `2 to 3 min`. World Draft: 10.2. These live in `src/content/games.ts` together with the four `rules` per game (carried verbatim from the current page files) and `relatedGames`.

### 10.6 Chip labels for the 20 draft categories (K3 voice; `src/content/chips.ts`, keyed by category slug; used for the card chips and the Draft slots)
Population · Land area · GDP per person · Total GDP · Life expectancy · Urban share · Internet users · Fertility · Tourists · Forest cover · Unemployment · Renewables · Inflation · Beer · Coffee · Wine · Farmland · Education spend · Health spend · Foreign investment (military-spending-pct is not a draft category; its label on ranking pages stays the registry `shortLabel`).

### 10.7 Verdicts and empty states
`Right.` · `Wrong.` · `Wrong. It was Chile.` · `Wrong. Streak ends.` · `Found.` · `Not a border.` · `Not on this continent.` · `Not a country.` · `Already guessed.` · `One away.` · `One mistake left.` · `Not a group.` · `Rank 4. Great pick.` · `Solid. Rank 18.` · `Costly. Rank 120.` · `Right. Pot 225.` · `Busted. Chain wiped.` · `Banked 225.` · `Final pick in.` · `You win this round.` · `AI wins this round.` · `Draw.` · `Missed.` · "No shots on this day." · "No friends have shot today." · "Your shot is still open." · "Not on the map" · "Player not found." · "No shot yet today. Shoot" · "New personal best" (a `.t-body` 600 ink line on the result panel when `run.isPersonalBest`).

### 10.8 Save-failure reasons in words
`too_fast` → "played too fast" · `already_played` → "already played today" · `server_validation_failed: …` → "the server rejected the replay" · `invalid_start_time` → "the clock did not agree" · `not_authenticated` → "not signed in" · anything else → "something went wrong".

### 10.9 Figures: one formatter, no second opinion (owner decision, supersedes the section 12 freeze on `utils.ts`)

Every figure on every surface, editorial page and game board alike, is printed by `formatStat` / `formatNumber` in `src/lib/utils.ts`. No module may carry its own tier, rounding or currency branch, because the same country then prints two ways in one product. Three rules, decided here:

1. **Trillions exist.** The tiers are `T` `B` `M` `K` above a thousand. The US economy is `$27.3T` on `/categories/gdp`, on the 15 list pages, on `/countries/united-states` and in Higher or Lower. It is never `$27292.2B`. A mantissa that rounds up to 1000.0 steps to the next tier (`999,999` is `1.0M`, never `1000.0K`).
2. **Magnitude is absolute, the sign leads.** Foreign investment runs to -343,402,798,888, so it prints `-$343.4B`, not `$-343,402,798,888.19` and not `$-343.4B`.
3. **Below a thousand, two decimals at most, trailing zeros dropped.** The source carries up to eighteen decimals. `4.22 births/woman`, `900 arrivals/year`, `0.49 km²`. Precision the reader cannot use is noise, and it is what wraps a fact tile. The percent family (`%`, `% of GDP`) keeps one decimal with the sign welded to the number, so the three spending categories read `15.0% of GDP`: a percentage first, a qualifier second. `years` keeps one decimal (`84.0 years`, a crawler canary). Population keeps its tier (`124.5M`, the other canary).

Where a game needs a finer step than the house form (Higher or Lower separates a pair that ties at two decimals), it steps down from the house form and says so at the call site; it does not fork the formatter.

---

## 11. The new `src` tree and file ownership

Owners are the packages of section 14 (F0 Foundation, P1 Shell, P2 Home, P3 Play frame, P4-{slug} boards, P5 Social, P6 SEO pages, P7 Identity assets, P8 Gate). Each file has exactly one owner. Shared files have an owner and an append-only rule.

```
src/
  app/
    layout.tsx                                   P1  html/body, fonts, providers, metadata, JSON-LD (no dynamic APIs)
    globals.css                                  F0  imports styles/tokens.css, base.css, type.css, flame.css
    not-found.tsx  error.tsx  global-error.tsx   P1
    sitemap.ts  robots.ts  manifest.ts  icon.tsx  apple-icon.tsx  opengraph-image.tsx   P7 (sitemap/robots moved verbatim)
    auth/callback/route.ts                       kept, untouched (root)
    actions/*                                    kept, untouched (home.ts imports getPublicBoards from src/server/boards.ts, P1)
    (app)/layout.tsx                             P1  getViewer + getClock → ViewerSeed, Header app, TabBar
    (app)/page.tsx                               P2  home
    (app)/games/[slug]/leaderboard/page.tsx      P5
    (app)/games/[slug]/run/[runId]/page.tsx      P5   (+ opengraph-image.tsx P7)
    (app)/friends/page.tsx  friends/add/[username]/page.tsx   P5
    (app)/profile/page.tsx  profile/[username]/page.tsx       P5
    (play)/layout.tsx                            P3  ViewerSeed only, no chrome
    (play)/games/[slug]/play/page.tsx            P3  the one play page
    (auth)/layout.tsx                            P1  Wordmark only
    (auth)/auth/forgot-password/page.tsx  forgot-password-form.tsx   P5
    (auth)/auth/reset-password/page.tsx   reset-password-form.tsx    P5
    (seo)/layout.tsx                             P1  Header static, TabBar
    (seo)/games/page.tsx                         P6
    (seo)/games/sitemap.ts                       P7  (moved verbatim)
    (seo)/games/[slug]/page.tsx                  P6  landing + world-draft branch; generateStaticParams over 18 slugs
    (seo)/games/[slug]/opengraph-image.tsx       P7
    (seo)/countries/page.tsx  countries/sitemap.ts  countries/[slug]/page.tsx   P6 / P7 (sitemap)
    (seo)/categories/page.tsx  categories/[slug]/page.tsx   P6
    (seo)/lists/page.tsx  lists/sitemap.ts  lists/[slug]/page.tsx   P6 / P7 (sitemap)
    (seo)/privacy/page.tsx  terms/page.tsx  support/page.tsx   P6
  proxy.ts                                       P1
  styles/tokens.css  base.css  type.css  flame.css   F0
  fonts/erode-500.woff2  erode-600.woff2         kept
  assets/marks/conquest.json                     F0  (built by scripts/build-marks.mjs)
  ui/                                            F0  (index.ts published day 2; additive after)
    wordmark.tsx  countdown.tsx  streak.tsx  header.tsx  nav.tsx  tab-bar.tsx  fade-bar.tsx  viewer-seed.tsx
    mode-switch.tsx  anchor-card.tsx  board.tsx  board-row.tsx  section-head.tsx  game-row.tsx  game-list.tsx
    friends-strip.tsx  nudge.tsx  streak-week.tsx
    button.tsx  chip.tsx  flag.tsx  crest.tsx  mark.tsx  flame.tsx  conquest-map.tsx
    play-bar.tsx  progress.tsx  subject.tsx  options.tsx  slot.tsx  tile.tsx  verdict.tsx  result-panel.tsx  join-row.tsx  key-hint.tsx  next-dailies.tsx  share-button.tsx
    sheet.tsx  auth-sheet.tsx  toast.tsx  field.tsx  select.tsx  suggest.tsx
    table.tsx  rank-table.tsx  stat-rows.tsx  page-title.tsx  editorial-head.tsx  prose.tsx  qa-list.tsx  fact-row.tsx  site-foot.tsx
    icons/index.ts  icons/*.tsx  icons/stat/index.ts  icons/stat/*.tsx
    types.ts                                     F0  Viewer, Clock, Mode, GameSlug
  features/
    home/{home-page.tsx, daily-pane.tsx, practice-pane.tsx, lists.ts}   P2
    play/{play-frame.tsx, game-host.tsx, replay.ts, persist.ts, feedback.ts, keys.ts}   P3
    social/{leaderboard-page.tsx, run-page.tsx, friends-page.tsx, friend-rows.tsx, friend-search.tsx, invite-row.tsx, add-friend-button.tsx, profile-head.tsx, profile-edit.tsx, sound-row.tsx, delete-account.tsx, head-to-head.tsx}   P5
    seo/{game-landing.tsx, world-draft-page.tsx, entity-block.tsx, capsules.ts, capsules-list.tsx, peers.tsx, standing.tsx, country-page.tsx, countries-hub.tsx, countries-search.tsx, category-page.tsx, categories-hub.tsx, list-article.tsx, lists-hub.tsx, games-hub.tsx, legal-page.tsx, game-jsonld.tsx, list-jsonld.tsx, breadcrumbs.ts}   P6
    auth/{auth-provider.tsx, native-bootstrap.tsx}   P1  (provider logic ported 1:1 from the contract; UI rebuilt)
    admin/reroll-button.tsx                      P5
  games/
    types.ts                                     P3  (frozen day 3 of F0 by agreement; P3 owns it)
    registry.ts                                  P3  HOSTS map (append-only: each P4 adds its one line)
    _shared/{option-list.tsx, country-block.tsx, tile-grid.tsx, found-list.tsx, world-map.tsx, pair.tsx}   P3 (frozen after week 1)
    {slug}/{module.ts, board.tsx, result.tsx, run-detail.tsx, host.tsx, codec.ts}   P4-{slug} (17 folders)
  server/{viewer.ts, edition.ts, clock.ts, boards.ts, runs.ts, progress.ts, home-lists.ts, shot.ts}   P1 (progress.ts co-owned with P3: P3 may add codec calls)
  content/
    games.ts    P6   per-slug human copy: how-line, three facts, four rules, relatedGames
    chips.ts    F0   the 20 draft chip labels (10.6)
    entity.ts   P6   ENTITY_COPY verbatim + sentence templates
    lists.ts    P6   the 15 lists (7.13 shape)
    hubs.ts     P6   countries intro, 4 fixed facts, hub copy
  lib/
    game-logic/**                                kept (two data-shape edits, 5.1; F0)
    daily-seed.ts  seeded-random.ts  silhouettes.ts  profanity.ts  utils.ts  admin.ts  assignment-solver.ts  daily-edition.ts   kept
    storage.ts                                   trimmed by F0 to getStorageItem/setStorageItem/removeStorageItem + setDailyLockout (the belt)
    share/{share-utils.ts, country-draft.ts, geo-wordle.ts, stat-guesser.ts}   F0  moved from components/share, pure, output unchanged
    seo/{game-metadata.ts, game-copy.ts, erode-font.ts}   kept; og-image.tsx restyled by P7
    supabase/{client.ts, server.ts, session.ts}  kept (middleware.ts renamed to session.ts by P1)
    native/*                                     kept (bootstrap.ts status-bar edit by P1)
    data/*                                       kept
  hooks/{use-juice.ts, use-game-keys.ts}         kept
  types/*                                        kept; emoji / flagEmoji fields removed (F0)
  data/*.json                                    kept; emoji keys stripped by the data scripts (F0 runs them)
public/flags/*.svg                               F0 (4x3 set, same filenames)
public/favicon.svg  f9505761df0dc045e453ea76165d13b0.txt   kept
scripts/build-flags.ts  build-marks.mjs  strip-emoji.ts  check-theme.mjs  check-render.mjs  check-contracts.ts   F0 / P8
capacitor/www/offline.html                        P7
```

Shared-file rules:
- `src/ui/index.ts`: F0 publishes it on day 2 with final props; later changes are additive only and announced in the PR title.
- `src/games/types.ts`: P3 publishes on day 3; frozen afterwards.
- `src/games/registry.ts`: append-only, one line per P4 package; P3 merges.
- `src/content/*`: P6 owns; P2 and P3 read `chips.ts` and `games.ts` only.
- `src/server/*`: P1 owns; other packages import, never edit (P3 may add codec calls in `progress.ts` by PR to P1).
- Nothing outside `src/lib/game-logic` may import `src/data/*.json` directly except `src/lib/data/*`, `src/lib/silhouettes.ts` and `src/ui/mark.tsx` (mark-silhouettes only).

---

## 12. Deletion list (executed as the last PR before the acceptance run)

Delete entirely:
- `src/components/**` (every file: admin, auth, country, friends, game, games, home, icons, layout, native, profile, seo, share, ui, `daily-hero.tsx`, `streak-badge.tsx`). Content that survives is moved BEFORE deletion by copying the contract, not the file: `share/*.ts` builders → `src/lib/share` (byte-identical output; F0); `game-entity-block.tsx` ENTITY_COPY → `src/content/entity.ts`; `answer-capsules.tsx` `buildCapsules` → `src/features/seo/capsules.ts` (text verbatim); `related-countries.tsx` link logic → `src/features/seo/peers.tsx`; `game-jsonld.tsx`, `list-jsonld.tsx` → `src/features/seo`; `auth-provider.tsx` logic → `src/features/auth/auth-provider.tsx` (invariants verbatim); `native-bootstrap.tsx` → `src/features/auth/native-bootstrap.tsx`; the 15 list pages' prose, quick facts and FAQ → `src/content/lists.ts`; the 17 landing pages' hero descriptions, rules and relatedGames → `src/content/games.ts`.
- `src/app/loading.tsx` and every `src/app/**/loading.tsx` (games, categories, countries, friends, profile, profile/[username], games/[slug]/leaderboard, the 14 play loading files).
- The 17 per-slug folders `src/app/games/{slug}/` (page.tsx, play/page.tsx, opengraph-image.tsx, loading.tsx) and `src/app/games/world-draft/page.tsx`, replaced by the `[slug]` routes in the `(seo)` and `(play)` groups.
- The 15 `src/app/lists/{slug}/page.tsx` files, replaced by `(seo)/lists/[slug]/page.tsx` + `src/content/lists.ts`.
- `src/app/page.tsx`, `src/app/games/page.tsx`, `src/app/countries/*`, `src/app/categories/*`, `src/app/lists/page.tsx`, `src/app/friends/*`, `src/app/profile/*`, `src/app/auth/forgot-password/*`, `src/app/auth/reset-password/*`, `src/app/privacy|terms|support/page.tsx`, `src/app/games/[slug]/*` (leaderboard, run): all rebuilt inside the route groups (same URLs).
- `src/app/globals.css` in full (rewritten as the four `src/styles/*.css` files; no legacy class survives: `.skeleton`, `.cta-*`, `.btn-*`, `.shoot`, `.game-card`, `.label-caps`, `.nav-active`, `.stagger-*`, `.rank-*`, `.streak-badge`, `.animate-*`, `--game-*`, `--shadow-*`, `--color-cream*`, `--color-gold*`, `--color-cluster-*`, `--color-geo-*`, `--color-correct*`, `--color-incorrect`, `--font-inter`, the dark block, `color-scheme: light dark`).
- `src/middleware.ts` (→ `src/proxy.ts`); `src/lib/supabase/middleware.ts` renamed to `session.ts`.
- `src/hooks/use-countdown.ts`, `use-daily-challenge.ts`, `use-local-storage.ts`, `use-daily-progress.ts`, `use-reset-countdown.ts`.
- `src/lib/game-colors.ts`, `src/lib/confetti.ts`, `src/types/storage.ts`.
- `src/lib/storage.ts` functions `isDailyCompleted`, `saveDailyResult`, `getDailyResult`, `getDailyLockout`, `dailyProgressKey`, `clearDailyProgress` (keep `getStorageItem`, `setStorageItem`, `removeStorageItem`, `DailyLockoutEntry`, `setDailyLockout` for the belt).
- Inter: the `next/font/google` import and `--font-inter`.
- `src/fonts/erode-600.ttf`.
- `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`; the 3:2 `public/flags/*.svg` (overwritten by the 4x3 set under the same names).
- `scripts/fetch-flags.ts` (replaced by `build-flags.ts`); `scripts/build-silhouettes.mjs` stays (server crests).
- Data fields: `emoji` in `game-registry.json` and `categories.json`, `flagEmoji` in `countries.json` (via `scripts/strip-emoji.ts` and the fetch pipeline; the types drop them now); the `emoji` keys of the old lists array go with the file.
- Copy: every occurrence of `Daily challenge`, `challenge`, `Today's shot` (as a header CTA), `Live`, `playing now`, and the glyphs `→ ← ✓ ✗ ✕ ↑ ↓ ↩ ★ •` in rendered strings. Text-arrow affordances become `Icon chevron-right` or nothing.
- The home carousel, dots, peek card, hover arrows, date row, sticky blurred header, marketing footer, `hero-globe`, `daily-hero`, `Art()` CSS illustrations, `Pill`, `StatPill`, `EndgameRamp` glow box, `PlayedTodayBanner`, `DateStamp`, `ResetLabel`, `StreakBadge`, `GameOverScreen`, `GamePlayLoading`, `DailyLockoutGuard`, `ChallengeFriendPicker`, duel components, `CountriesClient`, `HomeClient`, `GameCarousel`, `Header`, `Footer`, `FooterGate`, `BottomTabBar`.
- The WebSite JSON-LD `potentialAction` (SearchAction); the duplicate page-level `GameJsonLd` renders; the rules-based FAQPage.
- Dead exports left in place (no callers, flagged for a later cleanup, never deleted in this build): `src/app/actions/challenges.ts` (whole file), `getUserGameStats`, `checkDailyStatus`, `getMyOutgoingChallenges`, `completeChallenge`, `getDuelById`, `startQuickDuel`, `getRecentChallengeResults`.
- `CLAUDE.md` in the repo: the "Design System", "Project Structure" and "Supabase tables" blocks are rewritten to match this document (gold, per-game colour pairs, `game_rooms`, `use-multiplayer`, "14 games" removed).

Signed off the freeze: `src/lib/utils.ts` `formatNumber` and `formatStat` are rewritten to 10.9 (T tier, absolute magnitude with a leading sign, two decimals below a thousand, the percent family). `cn`, `slugify` and `ordinal` are untouched, and the crawler canaries `124.5M` and `84.0 years` are unchanged. The local trillions branch in `src/games/higher-or-lower/module.ts` becomes redundant and is deleted with it.

Keep untouched (contracts): `src/lib/game-logic/**` (the two data-shape edits only), `daily-seed.ts`, `daily-edition.ts`, `seeded-random.ts`, `silhouettes.ts`, `assignment-solver.ts`, `profanity.ts`, `supabase/client.ts`, `supabase/server.ts`, `native/*` (status-bar edit only), `src/app/actions/*` (home.ts import refactor only), `src/lib/seo/game-metadata.ts`, `game-copy.ts`, `erode-font.ts`, `src/data/*.json` (script-edited only), `supabase/**`, `capacitor.config.ts`, `next.config.ts` (plus the `www` redirect with `has: [{ type: "host", value: "www.countrivo.com" }]`), `/auth/callback`, `robots.ts`, the four sitemaps (moved, same output), `public/favicon.svg`, the IndexNow key file, `.github/workflows/*`, `scripts/check-crawler-access.ts`, `scripts/submit-indexnow.ts`.

Verification of the deletion: `rg -n "components/|game-colors|confetti|use-daily-progress|loading\.tsx|cta-primary|label-caps|animate-pulse|skeleton|flagEmoji|\.emoji|prefers-color-scheme|dark:" src` returns nothing (share builders excepted for the emoji squares); `next build` passes; the CI guards pass.

---

## 13. Acceptance checklist

Run by P8 on the merged tree: `npm run build && npx next start -p 3100` (always restart the server after a build), then `node scripts/check-render.mjs` (Playwright at 390x844 @3x and 1280x800 in both `colorScheme: "light"` and `"dark"`, signed out, signed in with friends, signed in after a shot; guest sessions are created with names starting `playtest` and deleted afterwards via the Supabase admin API), `node scripts/check-theme.mjs`, `npx tsx scripts/check-contracts.ts`, `npx tsx scripts/check-crawler-access.ts`. Every line must pass.

Look
1. [ ] `/` at 390x844 matches `home/k3-demo.png` within 6 px on every measured y (switch 66 to 110, card top 147, tabs 450, me-row 597, list head 640) and the same fonts, colours and radii; the light and dark emulation screenshots are pixel-identical (tolerance 0). The same pixel-identity check for `/games/country-draft/play?mode=daily`, `/games/flag-quiz`, `/countries/germany`, `/categories/population`, `/lists/largest-countries`, `/friends`, `/profile`.
2. [ ] Radii measured: card 12, switch 12, knob 9, Shoot 6, me-row 6, chips 4, flags 3; no element rounder than 12 except crests.
3. [ ] Zero `box-shadow` except the flag inset and the focus ring, zero `backdrop-filter`, zero borders except the 1 px line separators; no gradient except the fade bar (stylesheet grep + DOM audit).
4. [ ] Computed-colour audit: a Playwright script collects every computed `color`, `background-color`, `border-color`, `outline-color`, `fill` and `stroke` on `/`, `/games/country-draft/play?mode=daily`, `/games/geo-wordle/play?mode=practice`, `/games/cluster/play?mode=practice`, `/friends`, `/profile`, `/countries/japan`, `/categories/population`, `/lists/largest-countries`; every value is one of the section 1 tokens (plus `transparent`, the scrim and the edge alpha). No green, red, blue, purple, gold, grey-100 anywhere.
5. [ ] `grep -rn "prefers-color-scheme\|dark:" src/` returns nothing; `viewport.themeColor` is one string.
6. [ ] Erode-only-on-these-classes: a DOM audit confirms `font-family` resolves to Erode only on elements carrying `.t-wm .t-card .t-h1 .t-h2 .t-h3 .t-score-xl .t-score-l .t-score .t-num .t-big`; nothing else, and Inter is not in the bundle (`rg -i inter .next/static/css` is empty). Fonts loaded: Erode 600 (and 500 only if used), nothing from any other origin.
7. [ ] The flame burns (five animations running, ember fill, paper core) in the header on every route, including static pages; the number is absent for guests and members at 0; the streak number beats once when it increments.
8. [ ] No emoji in any HTML: `curl` every route family and grep with `\p{Extended_Pictographic}` and regional indicators; also the profile country `<select>`, the Risk Zone result, the Draft undo control, the friends page, feedback lines. No glyph characters `→ ← ✓ ✗ ✕ ↑ ↓ ↩ ★ •` in rendered text.
9. [ ] Crests vs flags placement: friends rows, the me-row, friends strips, profile heads, the run owner and the You tab show crests (or the seed crest); global board rows, leaderboard global rows, ranking tables, country pages and game content show `<img src="/flags/xx.svg">` at 4:3 with the 3 px radius and the inset ring; no friend or "you" ever shows a flag; no global row ever shows a crest; no initial letters anywhere.
10. [ ] Icons are the house set (seed dot present, 2 px stroke); no Lucide geometry; no sun/moon toggle; every mark from `src/ui/mark.tsx`; every stat icon from `src/ui/icons/stat`; centring verified at 3x zoom for crest silhouettes, seed dots, pips, tab-bar icons and the Shoot label.
11. [ ] Desktop 1280: the home is the two-column composition with the sticky board; play is the 720 column; editorial pages are main + rail, not stretched phones.

Rendering
12. [ ] `find src/app -name loading.tsx` is empty; `grep -rn "animate-pulse\|animate-spin\|skeleton\|ssr: false\|setMounted\|useSyncExternalStore(.*null\|opacity-0\|unstable_instant" src/` is empty.
13. [ ] Playwright: from `/`, click Shoot; no frame between the click and the board shows a placeholder (a DOM observer records every mutation; the first painted frame of the play route already contains the eight slots and the first country's name); the board is interactive within 400 ms on localhost. Repeat for all 17 play routes in both modes and for "New board".
14. [ ] `curl -A Googlebot /games/country-draft/play?mode=daily` returns HTML containing the eight category slots and today's first country name; `curl /games/cluster/play` (practice) returns 16 tiles and a second request returns a different board; with a `cv_done` cookie the HTML contains `TODAY · YOUR SHOT` and the score.
15. [ ] Reload mid-run on a daily (after two picks) renders the resumed state in the first HTML (screenshot at first paint shows two assigned slots); the same for Cluster after one solved group and Population Sort after a move.
16. [ ] After finishing a daily, revisiting `?mode=daily` renders the lockout panel in the first HTML for a guest (cookie) and for a signed-in user (server run); the home card shows the post variant and the list metas read `your shot …`.
17. [ ] Zero hydration warnings in the browser console across all routes in both colour schemes.
18. [ ] The header shows the signed-in crest, streak and countdown in the first HTML on app routes (view-source); static pages show the flame and "Today's draft" and no viewer state; the countdown text equals the client's first render.
19. [ ] `cv_mode=practice` renders the practice pane in the first HTML (no flip after hydration); the no-JS `?mode=` form works.
20. [ ] Home TTFB under 400 ms warm; play TTFB under 250 ms for a guest (no DB) and under 400 ms signed in.
21. [ ] Cookies used: `cv_mode`, `cv_p_*`, `cv_done` and the Supabase auth cookies only; `localStorage` holds only `countrivo_sound_muted`, `countrivo_push_prompt_seen` and the write-only lockout belt.
22. [ ] `prefetch={true}` is set on Shoot, New board, list rows, tab bar, "Today's board" and the leaderboard nudge (DOM audit of `<a>` elements rendered by `Link`).

Product rules
23. [ ] Exactly two modes exist in the UI; the strings `Blitz mode`, `duel`, `challenge`, `playing now`, `level`, `quest`, `XP` do not occur in rendered text.
24. [ ] Country Draft is not playable on `/` (the card links to the play route); World Draft has no play route (`/games/world-draft/play` is 404) and reads `NEW · draft 5 people · conquer 195`.
25. [ ] The home board has Global and Friends tabs, top 3 + `you`, the counter in ember; the three friends-tab states (signed out, no friends, with friends) match 3.7; the `?tab=` links work without JS and are instant with JS.
26. [ ] Every list row meta follows 10.4; every section head follows 3.9.
27. [ ] Share: clicking "Share" opens the native share sheet or copies and toasts "Copied"; the share text is never rendered on screen; its last line is `https://countrivo.com/games/{slug}`.

Contracts
28. [ ] `scripts/check-contracts.ts` plays every daily board to completion with the seeded RNG through `module.create` / `module.reduce` and asserts that `module.payload` equals the shapes in `understand.json engines.games[*].submission` and passes `validateGameResult` (and the country-draft and stat-guesser server validators for a fixed `(dateKey, edition)`); the codec round-trips every action log.
29. [ ] Guest flow: finish a daily → JoinRow → name → run saved → ranks shown; the second submit is deduped by `started_at`; `too_fast`, `already_played`, `invalid_start_time` show the ember line.
30. [ ] Auth invariants (`native.auth` 1 to 8) hold: `openAuthModal` identity stable, `userRef` short-circuit, deferred `onAuthStateChange`, `profileGenRef` guard, `PASSWORD_RECOVERY` bypass, sign-out order; sign in, sign up, guest join, password reset round trip and Apple (native) work.
31. [ ] Native: status bar dark text on paper; the splash hides after first paint; the push tap deep link opens the play route; the Apple button appears only under Capacitor; safe-area paddings on the tab bar and sheets; the tab bar is hidden on `/play` and `/auth`.
32. [ ] Streak logic untouched (`game-runs.ts` unchanged); the header streak equals `profiles.streak_current`.

SEO
33. [ ] All 302 sitemap URLs return 200 with unchanged canonicals, titles, descriptions and JSON-LD types; play, leaderboard, run and auth routes keep their robots rules; the three legacy redirects and the `www` redirect return 308; `robots.txt` and the four sitemaps are unchanged in content except the lastmod source.
34. [ ] `scripts/check-crawler-access.ts` floors pass for every listed UA: `/` >= 1280 chars, `/countries/japan` >= 1710 with the `124.5M` and `84.0 years` canaries, `/lists/largest-countries` >= 2320, `/games/blitz` and `/games/geo-wordle` >= 870, `/countries` >= 800, `<title>` and the description inside `<head>`.
35. [ ] Every game landing has an og:image in the new palette; the root OG, `icon`, `apple-icon` and the manifest use paper/ink/ember and derived counts; the run OG stays generic.
36. [ ] Every internal link of the SEO skeleton exists (SiteFoot lines, header nav, tab bar, landing → leaderboard + 4 related, country → categories/lists/neighbours/continent hub/games, list and category → hub + games); no indexable route is orphaned.
37. [ ] Copy has no em dash (`rg -P "\x{2014}" src` empty) and no "Daily challenge"; counts in metadata, manifest, OG and the entity block come from `getAllGames().length` and `243`.
38. [ ] Lighthouse on `/`, `/games/country-draft`, `/countries/japan`, `/categories/population`, `/lists/largest-countries`: SEO 100, accessibility >= 95, CLS 0 (Erode `display: block` with the metric-adjusted fallback).

Anti-slop re-check (the law, walked point by point against the built pages before sign-off)
39. [ ] No pills for metadata, no icon tiles, no hairline-bordered cards, no three- or four-column footer, no eyebrow ticks, no hover lifts, no growing underlines, no active-nav dot, no glows, no skeletons, no gradient text, no blur bars, no cream-over-cream sections, no faint grid, no fake window, no countdown tiles, no tracked-caps costume (the kicker is the only spaced string), no mono house voice, no default CTA pair (no outlined button exists), no stock right arrow (only `arrow-up-right`, `arrow-up`, `arrow-down`, chevrons), no dead controls, no purple, no blue-charcoal, no slop gray, no Inter, no Google fonts.
40. [ ] Nothing centred by eye: crest silhouettes (62 %, 2 px inset), seed dots, pips, the Shoot label, Erode numbers in fact tiles are measured centred at 3x zoom; no text jammed against an edge (20 px gutters everywhere); nothing clipped by the fade, the bar or a card edge (bottom padding 120; the Shoot button overlaps the chips by design and the chip block reserves 110 px); nothing hidden behind an animation; the chosen-wrong outline sits inside the option box with no clipped corner.
41. [ ] Every control reachable by keyboard with the ring; touch targets >= 44 px; the `<details>` FAQs open without JS.
42. [ ] Signature present: the ink anchor card with the overlapping Shoot, one board with Global and Friends tabs, crests as identity, the conquest-map mark, the burning flame in every header, Erode numerals everywhere a number matters. The page could not be swapped onto another product.

---

## 14. Build plan

The build is one FOUNDATION step followed by PARALLEL work packages with disjoint file ownership (section 11). Every package is buildable by an engineer who reads only this document and `understand.json`. Merge order: F0 → P1 → (P2, P3, P5, P6, P7 in parallel) → P4-{slug} land as each passes its board checks (they depend on P3's frozen types and `_shared`) → P8 deletion PR (section 12) → P8 acceptance run (section 13) → deploy after 00:00 Europe/Berlin.

### F0 FOUNDATION (one engineer, days 1 to 4; unblocks everyone on day 2)
Creates:
- `src/styles/tokens.css` (section 1), `base.css` (reset, `color-scheme`, focus ring, selection, `.on-ink`, `.num`, `.fade`), `type.css` (section 2 classes), `flame.css` (6.1); `src/app/globals.css` importing them.
- Fonts: `src/app/fonts.ts` exporting the `next/font/local` Erode loader (`--font-erode`); Inter removed from the tree.
- `src/ui/*` every primitive of section 3 with final props, plus `src/ui/index.ts` (published day 2), `src/ui/types.ts` (`Viewer`, `Clock`, `Mode`, `GameSlug`).
- `src/ui/icons/*` (4.2), `src/ui/icons/stat/*` (4.5), `src/ui/mark.tsx` (4.3), `src/ui/flame.tsx` (4.4), `src/ui/conquest-map.tsx` + `scripts/build-marks.mjs` + `src/assets/marks/conquest.json`.
- `scripts/build-flags.ts` + `public/flags/*.svg` (4x3 set); `flag-icons` devDependency; `src/ui/flag.tsx`, `src/ui/crest.tsx`.
- `src/content/chips.ts` (10.6).
- `src/lib/share/*` (moved builders, output unchanged).
- `src/types/*` without the emoji fields; the two engine data-shape edits (5.1); `scripts/strip-emoji.ts` run once; `src/lib/storage.ts` trimmed.
- `scripts/check-theme.mjs`: fails on `prefers-color-scheme`, `dark:`, `#[0-9a-f]{3,8}` outside `tokens.css` / `og-image.tsx` / `global-error.tsx`, `opacity-0`, `animate-pulse`, `animate-spin`, `skeleton`, `backdrop-blur`, `blur-`, `shadow-` (except `shadow-none`), `loading.tsx`, `ssr: false`, `unstable_instant`, `text-white`, `bg-black`, `border-border`, raw palette classes, the glyphs `→ ← ✓ ✗ ✕ ↑ ↓ ↩ ★ •` in tsx strings, and `\p{Extended_Pictographic}` in `src/**/*.{ts,tsx,json}` outside `src/lib/share`.
- A static gallery page `src/app/(seo)/kit/page.tsx` (noindex, deleted by P8 before release) rendering every primitive in every state, screenshotted at 390 and 1280 as the visual reference for the other packages.
Routes owned: none (the kit page is temporary).
Acceptance: the kit page screenshot passes checklist items 2, 3, 4, 6, 8, 10 on its own; `check-theme.mjs` passes; `build-flags.ts` reports 0 missing codes (or the documented fallbacks); the K3 flame animates; `npx tsc --noEmit` passes with `src/components` still present (the old tree keeps compiling until P8).

### P1 SHELL (one engineer, days 3 to 8)
Creates: `src/app/layout.tsx`, `(app)/layout.tsx`, `(play)/layout.tsx`, `(auth)/layout.tsx`, `(seo)/layout.tsx`, `not-found.tsx`, `error.tsx`, `global-error.tsx`; `src/proxy.ts` (+ delete `src/middleware.ts`, rename `supabase/middleware.ts` → `session.ts`); `src/server/{viewer,edition,clock,boards,runs,progress,home-lists,shot}.ts` (`home.ts` import refactor); `src/features/auth/{auth-provider,native-bootstrap}.tsx`; `src/ui/viewer-seed.tsx` wiring; `src/lib/native/bootstrap.ts` status-bar edit; `next.config.ts` `www` redirect; `manifest.ts` colours (P7 finishes counts).
Routes owned: the layouts, `not-found`, `error`, `/auth/callback` (unchanged).
Acceptance: every layout renders with a placeholder page; `curl /countries/japan` never triggers `updateSession` (proxy log); `getViewer()` runs one auth call and one query per request (Supabase log); the provider passes a unit test of the eight `native.auth` invariants; `revalidateTag("edition", "max")` compiles; checklist 5, 18 (chrome part), 20, 21, 31.

### P2 HOME (one engineer, days 5 to 10)
Creates: `src/app/(app)/page.tsx`, `src/features/home/{home-page,daily-pane,practice-pane,lists}.tsx|ts`.
Routes owned: `/`.
Acceptance: checklist 1 (home), 16 (home part), 19, 22, 23, 24, 25, 26; the `/` crawler floor (>= 1280 chars) passes with both panes in the HTML; the ItemList JSON-LD and the sr-only h1 are present.

### P3 PLAY FRAME (one engineer, days 3 to 10; types frozen day 5)
Creates: `src/games/types.ts`, `src/games/registry.ts`, `src/games/_shared/*`, `src/features/play/{play-frame,game-host,replay,persist,feedback,keys}.tsx|ts`, `src/app/(play)/games/[slug]/play/page.tsx`, `src/ui/{play-bar,progress,subject,options,slot,tile,verdict,result-panel,join-row,key-hint,next-dailies,share-button}.tsx` (F0 ships their props; P3 finishes behaviour), the progress codec helpers in `src/server/progress.ts` (by PR to P1), a reference module `src/games/_example/` (deleted by P8) proving the contract end to end.
Routes owned: `/games/[slug]/play`.
Acceptance: with the example module: checklist 12, 13, 14 (mechanics), 15, 16, 17, 21, 27, 29; the reveal window, undo and the 60 s auto-`seen` work in the example; the host never imports from `src/components`.

### P4-{slug} BOARDS (up to 17 engineers, days 6 to 14; each owns `src/games/{slug}/*` only)
Packages: P4-country-draft, P4-higher-or-lower, P4-geo-wordle, P4-cluster, P4-stat-guesser, P4-risk-zone, P4-flag-quiz, P4-capital-match, P4-population-sort, P4-country-streak, P4-border-buddies, P4-continent-sprint, P4-odd-one-out, P4-speed-flags, P4-supremacy, P4-borderline, P4-blitz.
Each creates exactly: `src/games/{slug}/module.ts`, `codec.ts`, `board.tsx`, `result.tsx`, `run-detail.tsx`, `host.tsx`, plus one line in `src/games/registry.ts` (append-only, merged by P3).
Each owns: its board inside `/games/{slug}/play`, its result rows, its run-detail rows.
Acceptance per package: the board matches its entry in 8.8 (subject, controls, verdict, keys, result rows); screenshots at 390x844 (fold budget met, subject and all controls above 700 px) and 1280x800 in both colour schemes are pixel-identical; `check-contracts.ts` passes for the slug (payload shape, validators, codec round trip, deterministic `create`); no `Date.now()` / `Math.random()` in `create` or render; no emoji, no glyph icons, no hex; keyboard map works; `busy` windows match 8.5; the board renders fully from `state` in SSR (`curl` the play route).

### P5 SOCIAL (one to two engineers, days 5 to 12)
Creates: `src/app/(app)/games/[slug]/leaderboard/page.tsx`, `(app)/games/[slug]/run/[runId]/page.tsx`, `(app)/friends/page.tsx`, `(app)/friends/add/[username]/page.tsx`, `(app)/profile/page.tsx`, `(app)/profile/[username]/page.tsx`, `(auth)/auth/forgot-password/*`, `(auth)/auth/reset-password/*`, `src/features/social/*`, `src/features/admin/reroll-button.tsx`, `src/ui/{sheet,auth-sheet,toast,field,select,suggest}.tsx` behaviour (F0 ships their look).
Routes owned: leaderboard, run, friends, add-friend, profile, public profile, forgot-password, reset-password.
Acceptance: checklist 9 (social surfaces), 16 (profile Today), 18, 30 (auth sheet and forms), 33 (robots on these routes); the friends flow with two guest sessions (search, request, accept, friends board); profile save refreshes the crest and streak without reload; no challenge UI anywhere.

### P6 SEO PAGES (one to two engineers, days 5 to 12)
Creates: `src/app/(seo)/games/page.tsx`, `(seo)/games/[slug]/page.tsx`, `(seo)/countries/page.tsx`, `(seo)/countries/[slug]/page.tsx`, `(seo)/categories/page.tsx`, `(seo)/categories/[slug]/page.tsx`, `(seo)/lists/page.tsx`, `(seo)/lists/[slug]/page.tsx`, `(seo)/{privacy,terms,support}/page.tsx`, `src/features/seo/*`, `src/content/{games,entity,lists,hubs}.ts`, `src/ui/{table,rank-table,stat-rows,page-title,editorial-head,prose,qa-list,fact-row,site-foot}.tsx` behaviour.
Routes owned: `/games`, `/games/[slug]` (18), `/countries`, `/countries/[slug]` (243), `/categories`, `/categories/[slug]` (21), `/lists`, `/lists/[slug]` (15), `/privacy`, `/terms`, `/support`.
Acceptance: checklist 33 (titles, canonicals, JSON-LD types per family), 34 (all floors and canaries), 36, 37; `next build` prerenders 243 + 21 + 15 + 18 + 5 pages; the landing is ISR 60 with the public board; the `?q=` prefill works after hydration and the page is still static; the countries hub has real anchors; the SearchAction is gone; screenshots of `/games/flag-quiz`, `/countries/germany`, `/categories/population`, `/lists/largest-countries` at 390 and 1280 in both schemes.

### P7 IDENTITY ASSETS (one engineer, part time, days 4 to 10)
Creates: `src/app/opengraph-image.tsx` (root, redrawn: Erode wordmark, paper ground, ink, a 6 px ember rule at the top edge, counts from the registry), `icon.tsx`, `apple-icon.tsx`, `manifest.ts` (colours `#fbfaf6`, counts derived, `start_url` and `scope` kept), `src/lib/seo/og-image.tsx` restyled (INK_MUTED `#74756f`, INK_FAINT `#b9b8b1`, ember rule, body system-ui, `GAME_ACCENTS` deleted, badge copy 10.1), `(seo)/games/[slug]/opengraph-image.tsx`, `(app)/games/[slug]/run/[runId]/opengraph-image.tsx`, `sitemap.ts`, `(seo)/games/sitemap.ts`, `(seo)/countries/sitemap.ts`, `(seo)/lists/sitemap.ts` (moved; `LIST_SLUGS` from `content/lists.ts`), `scripts/build-data-timestamps.ts` (`LIST_SOURCES` from `content/lists.ts`), `capacitor/www/offline.html` repainted.
Routes owned: `/opengraph-image`, `/icon`, `/apple-icon`, `/manifest.webmanifest`, `/sitemap.xml`, `/games/sitemap.xml`, `/countries/sitemap.xml`, `/lists/sitemap.xml`, `/games/[slug]/opengraph-image`, `/games/[slug]/run/[runId]/opengraph-image`.
Acceptance: checklist 35; the four sitemaps output the same 302 URLs with lastmod from `data-timestamps.json`; `robots.txt` unchanged; every OG image renders at build in the token palette with embedded Erode; `offline.html` has no emoji and no old gold.

### P8 GATE (one engineer, days 12 to 16)
Creates: `scripts/check-render.mjs` (Playwright: screenshots, pixel diffs light vs dark, the K3 fold diff, the Shoot-click mutation observer, hydration-warning capture, the computed-colour audit, the Erode-class audit, the DOM emoji/glyph audit, the prefetch audit), `scripts/check-contracts.ts` (all 17 modules), the deletion PR (section 12), the `CLAUDE.md` rewrite, the release note ("deploy after 00:00 Europe/Berlin; old localStorage progress is not read").
Routes owned: none.
Acceptance: every line of section 13 passes on the merged tree; `rg` verifications of section 12 return nothing; `npm run build` passes with zero hydration warnings in the acceptance run; the kit page and `_example` module are gone.

