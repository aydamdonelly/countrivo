# Countrivo Growth Roadmap (Workflows A → B → C)

North star: **maximize returning daily players** (NOT revenue). The engine: finish daily →
post a spoiler-safe emoji grid / "beat me" link → friend lands account-free in the SAME puzzle →
streak → evening loss-aversion push brings everyone back. (From the 13-agent growth-discovery
workflow, 2026-06-19.)

## Workflow A — the closed viral + retention engine
- [x] Remove AdSense everywhere (layout + 3 sub-layouts + ad files + ads.txt + privacy) — perf at aha/share moments
- [x] Unified SPOILER-SAFE emoji share grid for all 12 plain-text games (`buildShareGrid`, header + grid + full https link)
- [x] Delete the answer-leaking country-draft share → route through the safe emoji grid
- [x] Manifest → dark theme colors
- [x] Promote Share to the PRIMARY (gold) closing action on the result screen
- [x] Move APNs permission ask off cold-launch → `requestPushPermission()` fired after the first completed daily (once per device). (Refinement TODO: a soft in-app pre-prompt sheet before the OS dialog.)
- [x] Result-screen + auth-modal loss/streak copy ("Save & start streak"; "keep your streak alive")
- [ ] Seeded "Beat my score" / challenge link — logged-out recipient lands DIRECTLY in the same-seed puzzle (no signup wall) → "You vs <name>" card. The K-factor unlock.
- [ ] Close the friend-challenge return loop — thread challengeId through play → call `completeChallenge()` on submit (it has zero callers today)
- [ ] Ship Ghost Duels — `/duel/[id]` route renders board + GhostLane; Quick Duel button calls `startQuickDuel`; GhostLane index-synced per game
- [ ] Scheduled evening streak-at-risk push (pg_cron → send-push), HARD-suppress anyone who already played today
- [ ] Forgiving streak-freeze (auto-consume one missed day; profiles.streak_freezes)

## Workflow B — retention + conversion
- [ ] One server-backed streak as the hero everywhere + in the share artifact
- [ ] Migrate guest localStorage streak into the profile on signup (never reset on convert)
- [ ] Route cold/first-time visitors to an easy ~60-90s winnable daily (not HARD country-draft)
- [ ] One-tap Google + web Apple OAuth in the website auth modal
- [ ] Friend Streaks (shared daily streak that advances only if both play) + nudge button
- [ ] Wire challenge/duel events to native push + a results feed
- [ ] Dynamic per-game/per-country/per-list OG images (next/og)
- [ ] iOS Add-to-Home-Screen coach + beforeinstallprompt capture, after first daily

## Workflow C — leagues, stats, SEO, polish
- [ ] Cross-game XP currency → weekly leagues (small cohorts, Monday reset)
- [ ] Screenshot-worthy stats screen (streak hero, win %, distribution) + weekly share card
- [ ] Streak-milestone celebrations + shareable badges (7/30/100/365)
- [ ] Give the 5 practice-only games daily modes
- [ ] Daily-fresh "today's hint" SEO pages per daily game
- [ ] UTM/source attribution on shared + challenge links + manifest start_url
- [ ] Inline rules "?" affordance + legend on every play screen
- [ ] Derive DailyHero `totalDaily` from the registry (not hardcoded 9)

## New games to build (drop into the loop once the share/invite infra exists)
- [ ] **Countryle** (Worldle-style: distance + direction arrow + green/yellow/black grid) — the #1 viral geo format; make it the new daily flagship
- [ ] GeoConnections (16 countries → 4 hidden groups; collectible colored grid)
- [ ] Shape Guesser (silhouette; hints = how many you needed)
- [ ] Neighbor Chain (shortest border path; uses borders.json)
- [ ] Flag-dle (guess the flag; attribute reveals)

## Avoid
No ads/paywalls/IAP. No spoilers in share artifacts. Never gate a challenge-link recipient behind
signup before first fun. No cold push-permission ask. Never push to someone who already played today.
No unforgiving streak cliff (ship streak-freeze before leaning on streak-loss pushes). Max ~1-2 pushes/day.
