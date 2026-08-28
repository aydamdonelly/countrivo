# Countrivo — 20 Must-Haves still missing (from the 11-lens / 70-candidate workflow)

Code-grounded. Several are real bugs / App-Store blockers found beyond the earlier launch audit.
Effort: S/M/L. Check off as shipped.

## Trust / reliability (don't lose runs, don't look broken)
- [ ] **1 (L) Resilient daily-submit pipeline** — `submitGameRun` is fire-and-forget (no `.catch`) and `setDailyLockout` runs BEFORE submit → a dropped network silently loses the run AND locks the player out. Fix: `src/hooks/use-submit-run.ts` + `src/lib/submit-queue.ts` (enqueue to localStorage, retry on `online`/Network; lockout only AFTER success); refactor the duplicated submit effect out of all 11 boards; expose `submitState`.
- [x] **19 (S) Root error boundary** — add `src/app/global-error.tsx` (own `<html><body>`, dependency-free, friendly recovery); `error.tsx` can't catch a root-layout crash → blank WebView.
- [x] **13 (S-M) Honest scoring** — `hol-board` passes `maxScore={state.streak}` (always 100% "Perfect"); `country-streak` passes `maxScore={20}`. Use the real round count so tier/percentile/share are honest.
- [ ] **14 (L) Server anti-cheat for the other 7 daily games** — only country-draft + stat-guesser are validated; the rest trust client `scoreRaw`. Add `server-validate.ts` per game (replay seeded engine), wire into `game-runs.ts`.

## App Store submission blockers (found beyond the earlier audit)
- [x] **15 (S) Info.plist: `WKAppBoundDomains` + `ITSAppUsesNonExemptEncryption=false`** — missing; the first can make WKWebView refuse to load the site, the second stalls every upload on export compliance.
- [x] **16 (S) Terms of Service + Support page** — only `/privacy` exists; Apple requires a working Support URL and a social/account app needs Terms. Add `/terms` + `/support`, link from footer + signup.
- [ ] **6 (M) Block & Report on profiles/friends** — Apple Guideline 1.2 effectively requires it for social discovery. Add `user_blocks` + `reports`, filter everywhere, `...` menu with Block/Report.
- [x] **5 (M) Stop deriving usernames from email local-part (PII) + profanity gate** — `handle_new_user()` uses `split_part(email,'@',1)` → real name on public leaderboards/URLs. Generate `adjective-noun-NNN`; add blocklist in `updateUsername`/`updateProfile`; one-time scrub script.

## Retention
- [ ] **3 (M) Forgiving streak-freeze** — `updateStreak` hard-resets on one missed day. `profiles.streak_freezes` (default 2), consume on a single gap, warm "welcome back" on a real lapse.
- [ ] **4 (M) Scheduled evening streak-at-risk push** — `send-push` has no caller. pg_cron ~19:00 Berlin → users with a live streak who haven't played today; suppress already-played. (After #3.)
- [ ] **10 (L) Replayable archive/calendar of past dailies** — `getDailyRng(date)` already regenerates any day; thread an `?date=` param + `/archive` grid, `mode='archive'` (no streak/leaderboard impact).
- [ ] **17 (S) First-win onboarding** — home hero hardwires the HARD flagship as first touch. Route cold visitors (streak 0) to an easy daily + a special first-completion moment.

## Content / fairness / a11y
- [x] **2 (M) Real flag SVG assets** — `public/flags/` is EMPTY but `countries.json` bakes `/flags/{iso2}.svg`; flag games show grey letterboxes on Windows/Android. `scripts/fetch-flags.ts` → render `<img>` with emoji fallback. (Also unblocks Flag-dle.)
- [ ] **11 (M) Diacritic/alias-tolerant answer matching** — typed games fail on "cote divoire", "usa", "burma". Shared `normalizeAnswer` (strip diacritics) + `country-aliases.json`.
- [ ] **12 (M) Color-blind-safe verdict + screen-reader announcements** — no `aria-live` in any board; flag-quiz/hol convey right/wrong by color alone. Shared `<Verdict>` icon + `sr-only aria-live` status per board.
- [ ] **18 (M) In-board rules `?` affordance** — most entry points deep-link past the landing rules. A `?` opening a bottom-sheet (rules from registry), auto-open once per game.

## Settings / control / delight
- [ ] **7 (M) A real Settings screen** — none exists. `/settings` with Sound/haptics, Appearance, Notifications, Account, About/Legal; entry from profile (mobile tab) + header.
- [x] **8 (S) Sign-out on mobile + mute toggle UI** — sign-out only in the header dropdown (mobile can delete account but not log out!); `useJuice` mute store has ZERO callers (every tap is unmutable). Wire both.
- [ ] **20 (M) Theme override (System/Light/Dark)** — currently system-only. `data-theme` on `<html>` + early inline script (no flash) + a 3-way control in Settings; status bar follows.
- [x] **9 (M) Daily-complete / perfect confetti burst** — zero confetti; the peak moment has no visual climax. Dependency-free canvas particle burst gated on Perfect/Elite/daily-finish, reduced-motion safe.

## Honorable mentions (next tier)
Pause/resume timed games on background (iOS throttles timers — burns Speed-Flags); Country leaderboard
("#4 in Germany"); native App-Rating prompt at a win; per-game run-detail for the other 11 games;
post-daily answer review for hol/country-streak; surface submit errors; non-fatal post-insert steps;
confirm-before-friend (GET side-effect); brand-voice microcopy; web/PWA reminder.
