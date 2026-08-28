# Countrivo — Feature Inventory

An objective list of the features currently implemented in the codebase, grouped by area.
17 games · 243 countries · daily challenge + practice mode · web (Next.js) + native iOS (Capacitor) · Supabase backend.

---

## Games (17)

Each game has a daily mode and/or an unlimited practice mode (per the registry).

- **GeoWordle** *(daily + practice)* — Guess the mystery country in six tries; each guess reveals the distance and compass direction to the answer.
- **Cluster** *(daily + practice)* — Sixteen countries, four hidden groups; find the connection binding each quartet.
- **Risk Zone** *(daily + practice)* — Guess higher or lower, then bank your points or gamble one more reveal; one wrong answer wipes the chain.
- **Country Draft** *(daily + practice)* — Eight countries are revealed one at a time; the player assigns each to one of eight categories where it ranks highest (each category usable once), scored against an optimal assignment.
- **Flag Quiz** *(daily + practice)* — 10 rounds; a flag with four country options (distractors preferred from the same region), one point per correct answer.
- **Higher or Lower** *(daily + practice)* — Two countries, one statistic; pick whether the right value is higher or lower. A wrong pick ends the run; tracks current and best streak over up to 80 precomputed rounds.
- **Capital Match** *(daily + practice)* — 10 rounds; a country with four capital options, one point per correct answer.
- **Population Sort** *(daily + practice)* — Drag a set of countries into descending order for a statistic (population, area, GDP…); scored by countries placed in their correct position (value-based, so ties are fair).
- **Country Streak** *(daily + practice)* — Identify countries from their flag by choosing among four options; one wrong answer ends the run. Tracks current and best streak through a seeded shuffle.
- **Border Buddies** *(daily + practice)* — A country with ≥2 land borders is shown; name every bordering country.
- **Continent Sprint** *(practice)* — Pick a continent and name every country in it against a timer.
- **Stat Guesser** *(daily + practice)* — 5 rounds; guess a numeric statistic for a country (given an anchor country's value), scored by percentage error.
- **Speed Flags** *(practice)* — Identify flags (two options) within a 20-second window driven by an absolute end time, counting correct answers.
- **Odd One Out** *(daily + practice)* — Four countries where three share a trait; pick the outlier.
- **Supremacy** *(practice)* — Top-Trumps-style card game over 5 rounds vs an AI; compare a chosen stat each round.
- **Borderline** *(practice)* — Navigate from a random start country to a target by typing border-connected countries, measured against a BFS-optimal path.
- **Blitz** *(practice)* — 10 rounds; type the country name for a shown flag as fast as possible (with an alias/abbreviation map), recording per-round time.

**Shared mechanics:** seeded daily determinism (same puzzle worldwide per date); pure game engines with `useReducer` boards; mixed scoring models (point-per-correct, positional accuracy, percentage error, streak-until-wrong, optimal-comparison, timed counts, round-win tallies); server-side anti-cheat (auth check, score sanity checks, per-game validation, seed re-computation for Country Draft + Stat Guesser, too-fast rejection).

## Daily challenge system

- **One shared daily puzzle per game** — RNG seeded from a hash of the Europe/Berlin date key (+ edition salt) via mulberry32.
- **Europe/Berlin midnight reset** — single global daily boundary.
- **Editions** — an admin re-roll changes the seed and invalidates old edition-scoped storage.
- **Per-game daily lockout** — one daily attempt per game for guests, stored locally.
- **In-progress resume** — reloading mid-game restores the same point (versioned; stale blobs discarded).
- **Daily completion tracking** — read by the home progress ring, header counter, streak nudge, and game-chaining.
- **Daily progress bar** — X/total dailies completed, turns green when all are cleared.
- **Live reset countdown** — ticking HH:MM:SS to the next reset (home + game-over).
- **Streak counting** — consecutive days with ≥1 daily completed (365-day lookback; today's miss doesn't break it); server streak overrides local when present.
- **Streak-keep nudge** and **streak-tiered headlines**.
- **Game-chaining** — after finishing a daily, links to the next unplayed daily.
- **Resilient storage** — Set/Map-aware serialization; all writes/reads swallow quota/private-mode errors.

## Social & competition

- **Add friend by username search** (debounced, excludes self/existing friends).
- **Invite link** — personal `/friends/add/{username}` URL; the target renders a profile preview with an explicit confirm button (no mutation on page load).
- **Confirm / decline friend requests.**
- **Friends list with today's activity** — split into played-today vs not, per-game score pills, remove-friend.
- **Head-to-head per-game comparison** — W/L/D badge per game vs your own run.
- **Global daily leaderboard** (top 50 per game/date, with summary row).
- **Friends leaderboard tab.**
- **Leaderboard date navigation** (capped at today).
- **Tap a player to view their run** (run-detail page, noindex).
- **Challenge a friend** from game-over (server verifies friendship + caller's own run; one challenge per pair/game/day).
- **Incoming challenges list** with Play-now links.
- **Complete a challenge** (idempotent, anti-race).
- **Pending-count header badge** (friend requests + challenges).

## Accounts & authentication

- **Email + password sign-up / sign-in** (8-char minimum, mapped error messages).
- **Instant login** (email confirmation disabled — session returned immediately).
- **Sign in with Apple** (native iOS, nonce-hashed, via Supabase `signInWithIdToken`).
- **Password reset** (request + completion flow).
- **OAuth/recovery callback handler** (validated relative redirects).
- **Profile editing** — display name + home country.
- **Username editing** (3–20 chars, validated, uniqueness-checked).
- **Random geo-themed handles on signup** (e.g. `clever-meridian-482`); one-time scrub of old email-derived handles.
- **Profanity / reserved-name filter** on usernames and display names.
- **In-app account deletion** (JWT-verified edge function; cascades to runs/profiles/tokens/friendships).
- **Sign-out** (header menu + profile; clears native session).
- **Native session persistence** (mirrors Supabase session to secure storage; no-op on web).
- **Public profile lookup** by username with per-game stats.

## Native iOS app (Capacitor)

- **Live-site WKWebView wrap** of countrivo.com.
- **App-bound domains** (`WKAppBoundDomains`, navigation limited to countrivo.com / www).
- **Custom native offline screen** with a Retry button; runtime offline detection.
- **APNs push notifications** with deferred permission (requested after the first completed daily, once per device; re-registers only if already granted).
- **Push-tap deep routing** to the relevant game.
- **Native Sign in with Apple.**
- **Taptic Engine haptics** (seven types, wrapped so failures never throw).
- **Status bar follows system light/dark.**
- **Splash screen** with manual hide after init; dark launch background (no white flash).
- **Deep links / OAuth return handling** (universal + custom scheme).
- **Session mirroring + rehydration** across cookie purges.
- **Safe-area inset support** (notch / home indicator).
- **Native WebView feel** — no scroll bounce, edge-swipe-back.
- **Shared bootstrap** — all native calls guarded by `isNativePlatform()`, so the same code is a no-op on web.

## Profile, stats & replay

- **Own profile page** (auth-gated) and **public profile by username**.
- **Streak display** (current + best).
- **Stats overview cards** — games played, daily challenges, longest streak.
- **Per-game stats list** (run count + best score, tinted per game).
- **Today's dailies section** (with daily rank, links to leaderboards).
- **Head-to-head** on another user's profile (30-day W/D/L + recent matched runs).
- **Profile edit form** — username, display name, country, with a **sound + haptics mute toggle**, sign-out, and delete-account.
- **Run detail / decision replay page** — score, daily rank, percentile.
- **Per-game replay breakdowns** — Border Buddies (found vs missed), Country Draft (per-pick rank vs optimal), Stat Guesser (per-round % error), generic summary otherwise.
- **`submitGameRun`** with anti-cheat, daily-rank computation, streak update, personal-best flagging.

## Content: countries & rankings

- **243-country dataset** (iso codes, names, region/subregion/continent, capital, borders, flag emoji + SVG path).
- **243 local SVG flag assets** in `public/flags/`.
- **Per-country statistics and precomputed world ranks.**
- **21 ranking categories with source provenance** (World Bank, REST Countries, WHO, UNWTO, SIPRI, UNESCO, ICO, OIV, Kirin).
- **Countries index** (search + continent filter + daily curiosity facts).
- **Country detail pages** (statically generated) — flag, facts, top-3 rankings, all 21 stats with world ranks, neighbors, same-continent countries, game cross-links, JSON-LD.
- **Categories index + per-category leaderboard pages** (podium + full world ranking table, up to 300).
- **15 curated ranking list pages** (largest, most-populated, richest, most-visited, continents, etc.).
- **Typed data loaders** (no direct JSON imports in components).

## Sharing & SEO

- **Spoiler-safe Wordle-style share grid** (🟩/⬛, header brag line, only emits the grid when meaningful).
- **Daily puzzle number** (`#<n>`) in share text; share link as last line.
- **Game-specific share grids** (Country Draft per-pick symbols; Stat Guesser omits country names).
- **Native share + clipboard fallback.**
- **Per-game unique metadata** (title, description, canonical, Open Graph, Twitter).
- **Structured data (JSON-LD)** — VideoGame, BreadcrumbList, FAQ, ItemList; WebSite + Organization site-wide.
- **Per-country, per-category, per-list metadata + structured data.**
- **Sitemap, robots, PWA web manifest, dynamic Open Graph image.**

## Design & UX

- **Centralized design tokens** (@theme block) for color, radius, shadow, motion.
- **System-following dark mode** (token re-pointing + black-primitive flip; per-scheme theme color).
- **Inter + Space Grotesk fonts** (UI vs display), tabular numerals.
- **Per-game color palettes** (light + dark twins).
- **Sound + haptic juice** (synthesized Web Audio, pluggable haptic driver, persisted cross-tab mute toggle).
- **Confetti on great results** (≥90% or personal best; reduced-motion safe).
- **Bottom tab bar** (phone-only; hidden in /play and /auth).
- **Custom components, no third-party UI library.**
- **Reduced-motion handling** across animations.
- **Responsive / mobile-first layout** with safe-area utilities.
- **Keyboard focus ring + tap polish.**
- **Reusable animation/feedback keyframes** (fade, slide, scale, shake, score-pop, verdict-reveal, skeleton shimmer…).

## App Store artifacts (in repo)

- **App Store submission copy packet** (`docs/APP-STORE-SUBMISSION.txt`) — paste-ready name, subtitle, keywords, description, categories, age-rating answers, App Privacy declarations, demo account, review notes, screenshot captions, and ordered submission steps with field locations.
- **Ship checklist** (`docs/SHIP-CHECKLIST.md`) — ordered manual steps.
- **App icon** (1024²) and **splash** (2732²) sources.
- **5 store screenshots** (`resources/store-screenshots/`, 1290×2796, 6.9-inch).
- **Info.plist keys** — export-compliance (`ITSAppUsesNonExemptEncryption=false`), `WKAppBoundDomains`, URL scheme.
- **6 database migrations** (new-user handling, challenge email trigger, device_tokens, ghost_duels, friend-challenge hardening, random geo handles).
- **3 edge functions** — `delete-account`, `send-push` (APNs), `send-challenge-email` (Resend).
