# Countrivo — App-readiness pass (2026-06-20)

A multi-phase pass to get the app submission-ready, more addictive, and visually polished. Build + typecheck are green. Below is what shipped, what was deliberately deferred, and the manual steps you still own.

## New reference docs
- `docs/APP-REALITY-MAP.md` — verified truth of what's actually built vs. what FEATURES.md claims (found facade features + bugs).
- `docs/DESIGN-PLAYBOOK.md` — 71 enforceable design rules + the "AI-generated app smell" checklist the UI was audited against.
- `docs/APP-STORE-MASTER.md` — the single submission document: every field, image spec, checkbox, and step, with 2026 Apple requirements + the pre-flight blocker list. **Start here to submit.**

## Design polish (anti-AI-smell + native feel)
- Global: `touch-action: manipulation` app-wide (instant taps); 7 bare `:hover` blocks wrapped in `@media (hover:hover)` so hover no longer sticks after tap on iOS; safe-area on the header; bottom tab bar to 60px + `translateZ(0)`.
- Emoji-as-UI-icons → SVG icons across header, home stat cards, daily-hero stat row, games hub, profile, content pages (added `IconFlame/IconTrophy/IconController`). Game-identity emoji intentionally kept.
- Per-game color leakage removed from country/category cross-link cards (no more 4–5 game colors in one view).
- Result screens: generic/banned titles ("Game Over", "Time's Up!", "Try Again") → score-first specific copy across all boards; em dashes stripped from UI strings; ALL-CAPS sentence labels relaxed.
- Tap targets raised to ≥44px (buttons, auth modal, boards, friends, forms); `active:scale-[0.97]` press feedback added; progress bars animate `scaleX`/transform instead of width.
- "Explore" → "Browse"; error pages "Try again" → "Reload"; streak-0 now shown (not hidden); top-score card given a distinct accent to break the three-equal-cards tell.

## Retention / virality features
- **Streak-freeze** — a single missed day no longer hard-resets a streak (`updateStreak`, idempotent + defensive; needs the `streak_freezes` migration).
- **Streak-milestone celebration** — confetti + a shareable banner at 7/30/100/365 days.
- **Cold-start** — brand-new players (streak 0) are routed to an easy first win (Flag Quiz) instead of the hard flagship.
- **Evening streak-at-risk push** — new `streak-reminder` edge function (the #1 notification lever; needs pg_cron — see master doc §0a).
- Add-as-friend dead-end fixed (links to the direct add page); header challenge badge no longer over-counts.

## App Store compliance (blockers)
- `ios/App/App/PrivacyInfo.xcprivacy` created (fixes the ITMS-91053 auto-reject).
- **Sign in with Apple token revocation** implemented end to end (`apple-exchange` function + `_shared/apple.ts` + `delete-account` revocation + `apple_credentials` migration), gated on `APPLE_*` secrets with a safe data-only-delete fallback. Token-swap hardened (sub binding).
- Privacy policy now names Vercel Web Analytics + Supabase.

## Bug fixes (adversarially verified, from the 35-agent hunt)
- Anti-cheat: NaN / future `startedAt` no longer bypasses the too-fast guard, and a skewed device clock no longer false-rejects every run.
- `blitz` / `supremacy` / `borderline` scores no longer silently rejected by `validateGameResult`.
- `speed-flags` + `continent-sprint` now enter daily-finish mode correctly (daily chain + push prompt fire).
- `getHeadToHead` no longer leaks any user's 30-day history to non-friends (authz + friendship check).
- `completeChallenge`: server-resolved run id (anti-spoof), same-day guard, and no-op-retry detection.
- `session-fallback` guards `JSON.parse`; Country Draft share text uses `#<n>` + `https://` (auto-links).

## Deliberately deferred (with reason)
- Beat-my-score `?date=` replay + full challenge auto-wiring — needs the shared submit-hook refactor (MUST-HAVES #1) first; risky to bolt onto 14 boards.
- In-game rules sheet — touches every board.
- Daily-chain "X/N" off-by-one, flag-quiz submit re-fire on auth change, non-atomic PB flag, streak-freeze concurrent multi-gap — low severity; the first three need cross-board / DB-function work.
- Atlas sticker collection is still a facade (no write path) — make it real via a `game_runs` trigger, or cut it from nav. Not touched this pass.
- `population-sort` still imports `stats.json` into the client bundle — needs a data-flow change through the play page; deferred to avoid destabilizing the game.

## Manual steps you own
See `docs/APP-STORE-MASTER.md` §0a and §0. In short: run the two new migrations, deploy the three edge functions, set the `APPLE_*` + `CRON_SECRET` secrets, schedule the pg_cron push, add `PrivacyInfo.xcprivacy` to the Xcode target, regenerate screenshots at 1320×2868, complete the Age Rating + EU DSA declarations, rotate the demo password, and redeploy the site.
