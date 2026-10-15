# October Table redesign implementation

Reference: [Countrivo Figma](https://www.figma.com/design/ZKNzvFolKFKjU2EVzWpCBY),
pages 00 Design System to 08 Static. The owner's October instructions supersede the
August blueprint. This document describes the implementation rather than treating
sample Figma counts, scores or country facts as live data.

## Delivered surfaces

- Shared header, six-object daily strip, notched game trays, peeking next card,
  desktop controls, footer shelf, sheets, toasts and rollover/error/retry states.
- Home first visit, returning/resumable, finished game, full six-game day with the
  map of encountered countries; practice room and eight-game index.
- Eight landings with rules, real daily scores/Par, FAQ, related games and archive.
- Country Draft explicit country-opening actions, credited portraits, person information,
  free-job sheet, irreversible seating, score reveal, bonuses and a personal cabinet result.
- GeoWordle country search and map selection, distance/bearing, costed outline clue,
  solve/loss, neighbours and capital discovery.
- Pinpoint pan/zoom/touch/keyboard map, five rounds, distance/points reveal and result.
- Higher or Lower, Flag Quiz, Stat Guesser, Blind Pick and Speed Flags game/result
  states. Higher or Lower's practice streak and the daily ten-call game are distinct.
- Automatically saved results, optional name/place publication, name changes/removal,
  reporting, named human leaderboard, yesterday/date navigation and shared run pages.
- Immutable past-board archive; today's and future dates cannot be played as archives.
- Country index/map, dossiers, category rankings, comparative facts, lists, five
  continent Name Them All games, three sourced discovery lists and sources page.
- About, privacy with device-data deletion, terms, credits, support and imprint.
- 404, route/global error, embedded iOS offline fallback, reduced-motion variants,
  native-form play without JavaScript for six games; Pinpoint/Speed explain their JS need.
- Owner-only admin gate, report moderation and next-day board replacement queue.

Native startup now runs haptics, status-bar styling, offline detection, the splashscreen
and same-origin game links. It neither restores a Supabase session nor registers Apple
sign-in or the old account-based APNs token flow. Legacy authentication links return to
the home page. The unused push-permission helper has been removed.

## Assets and layout

The Figma trays, blank map, shelf and leaderboard icon are exported SVG assets.
All 53 available Clay image states are web-optimized WebP. The existing portraits and
flag SVGs are reused with credit information. Asset conversion is repeatable with
`scripts/build-clay.mjs`; it needs the preserved local concept manifest and sources.
Generated geography uses Natural Earth 50m polygons, Equal Earth display paths and
scoring on geographic coordinates. It is an approximation, labelled accordingly.

Mobile layout keeps decision controls visible and explanations optional.
Desktop uses the same hierarchy with additional contextual columns. Browser QA covers
320, 390 and 1440 px. Fonts, real data and animation states can change text wrapping
relative to the static Figma samples; screenshots, rather than a claim of universal
pixel identity, are the evidence for matching the design.

The October 15 play-flow revision takes a normal five-round Draft from 29 clicks to
20: open a country, choose a person, explicitly seat them in a job, then continue.
Job actions state their consequence; closing the sheet remains safe. Roles carry
neutral skill descriptions, with no individual points or fit shown before seating.
Person details also withhold career-category labels until the choice is committed.
The result derives a cabinet story and two highlights from the actual appointments,
with a one-second skippable map reveal and immediate share/replay actions.
GeoWordle keeps heat feedback on the map as well as in words, identifies a shared
border separately from a rounded zero distance, and brings the result and bonus
into view while preserving the complete route in an expandable section.

Each Draft offers fifteen distinct countries, grouped into five choices of three
that cross world regions. Opening a country reveals three different career groups;
the people within each group are drawn from its complete portrait-backed bench.
A country needs three usable groups, and every playable person needs a local image,
credit, biography and career record. Old per-category caps and equal-standing
rejections no longer discard otherwise usable people or countries.

## Anonymous backend

`countrivo_runs`, `countrivo_boards`, `countrivo_config`,
`countrivo_name_reports` and `countrivo_bot_runs` are isolated in the
CLI-accessible FizzAI project. Credentials are only in local/encrypted Vercel env.
The old project and its account records are preserved.

Identity is a signed HttpOnly cookie. Per-move CAS revisions prevent undoing a revealed
answer by restoring an old client cookie. Run tickets are authenticated encrypted
payloads, and daily seeds are HMAC-derived with a server secret. Opaque flag assets
remove country names from quiz URLs. Public DB access exposes only the leaderboard
projection/config, never solutions, run seeds or device identifiers.

A completed result is private until its owner chooses a name. Equal scores share ranks.
Percentiles require 20 real named entries. Simulated rivals are labelled Bot, separate
from the real list, and excluded from player counts, ranks and statistics. Clearing
cookies creates a new anonymous device; this is a casual leaderboard, not a promise
of cheating-proof identity.

Historical snapshots preserve boards across code/data deployments. GeoWordle excludes the last 45 days of answers; Pinpoint excludes the last 14 days within each difficulty band, using actual saved history. Practice excludes
current daily draft countries/people and relevant daily targets. Admin replacements
are queued for tomorrow rather than changing today's committed puzzle.

## Editorial limits

Published geography facts carry sources and dates. Country Draft's biography dates
are source-backed; its entire per-person scoring corpus is not independently
fact-checked. The expanded playable roster contains 482 credited portraits across
41 countries, each with biography and career records. Missing main military careers
have source-linked corrections; secondary entertainment credits and honorary advocacy
appointments cannot masquerade as full professional careers. Job fit is a game
judgement; fame compares frozen Wikidata language coverage across the configured
record corpus and within each homeland,
not a claim about a person's value. Existing curated beverage rows lack verified
per-row source coverage; this is disclosed on Sources.

The archive starts with the relaunch. No fabricated old boards or human activity are
seeded. Future expert scoring revisions must version the board engine and preserve
past snapshots. Don't reintroduce a fit preview, sorted role hints or answer-bearing
client data when refining the scoring system.

## Verification

Production build, strict TypeScript, lint and theme guard. Contract tests exercise
all eight adapters and payloads, including score tampering/replay rejection. Country
Draft checks cover35-point seat caps and exact board ceilings. Geometry checks cover
small islands, polygon winding, dateline/projection edges, scores and target secrecy.
Discovery checks cover route calculations, aliases and ranked-stat practice.

Browser regression covers routes at 320/390/1440, assets, console errors, overflowing
layouts, all game routes, a single theme and no-JS form interactions. Separate Chrome
extension walkthroughs cover selection/reveal/result, reload/resume and map controls.
The complete Higher or Lower daily also verifies all ten calls, saved-result reload and a 320px result. Backend tests cover save, name management, reports, privacy, revisions, RLS, opaque
flags and archive date rejection. QA-only database rows are cleared before launch;
labelled simulated rivals remain.

## Response performance

Functions run in Frankfurt alongside Supabase (`vercel.json`), avoiding the old
US-to-Europe database round trips. Only successful immutable board snapshots are
shared-cached; private device rows are deduplicated within one request. Public names
cache for ten seconds and publication/removal/moderation expires that cache immediately.
Moves still use server-owned revisions and scores. Labelled simulated rivals are generated
locally; gameplay no longer seeds or reads bot rows.

Each game host is split inside a client boundary with server rendering retained. In
the measured Chrome run, Flag Quiz/Higher/Stat initial JavaScript fell from 5.08 MB to
0.99 MB (gzip 1.78 MB to 297 KB). Quick games load no map chunks or private Draft records.
Display maps use simplified public paths; border scoring retains its original geometry.
The day atlas appears after a completed game discovers countries. Its shared land layer is
a cached external SVG instead of repeating about 241 KB of paths in each response. Geo map selection
is local, and Pinpoint panning keeps one coordinate scale throughout a gesture.

The active game is fully prefetched. Icon navigation switches the deck immediately;
swiping remains native. Clay assets have static responsive sizes and browser caching.
Blanket 300 ms input locks and the Blind Pick 900 ms result delay are removed. Neutral
selected states acknowledge input without predicting answers. Tests with move requests
held for 1.2 seconds measured visible feedback in 30–43 ms, no duplicate moves and a
recoverable network error. Stale identical/conflicting requests still preserve the saved
revision and view.

`check-interaction-feedback.mjs` aborts move requests. `check-navigation-performance.mjs`
measures the local deck and prefetched navigation without moves. `check-render.mjs
--read-only` skips its two no-JS mutations for repeatable checks against existing data.

## October 15 growth and return visits

The GeoWordle landing restores an optional worked example generated by its engine.
Country Draft and GeoWordle metadata describe the actual games. Category tables and
structured data share the same sovereign-country inventory, order and count.
`/practice/europe-flags` is a real regional game, including European alternatives;
`/practice/urban-geography` connects sourced comparisons to actual stat practice.
Both are linked, included in the sitemap, and tracked by freshness/IndexNow scripts.
Urban October is an editorial occasion, not a claim of measured search demand.

One daily game counts toward a compact weekly record. A missed day preserves the
personal best and previous activity; there is no paid streak repair. Calendar reminders
are optional local ICS downloads, requiring the player to import them. Results put the
next unfinished daily before optional naming and answer details. Signed score challenge
links open the same frozen daily or archived board without exposing choices or identity.

Leaderboards use full-board counts and competition ranks, including an owner's row
outside the first page. Simulated rivals stay collapsed and separate. Players can hide
reported publishers in their own browser; administrators can reversibly ban publication.
Hidden or unnamed results are not public through direct result links.

Draft and Pinpoint can display the next public stage immediately while the server
acknowledges Next. This does not reveal scores or permit a second irreversible move.
Retry resends the same revision and action, recovering the stored result after a lost
response. The delayed-network regression measured 8–17 ms local feedback with server
requests held for 1.2 seconds; this is not a production latency measurement.

Completion analytics are deduplicated per run. Share events distinguish intent from
clipboard/native/cancelled outcomes. `scripts/report-retention.py` calculates aggregate
device cohorts from real completed dailies, excludes practice/bots and waits for a full
return day to close. The new backend's initial cohort is too small for a reliable D7
retention conclusion. `reports/2026-10-15/` contains the local baseline and Search Console
exports; the search window ends October 12 and cannot establish this release's effect.

The ranked-board/block migration is applied to the existing Countrivo tables in the
CLI-accessible project. Its 600-player regression runs in a transaction and rolls back.
Build, lint, theme, 8,341 adapter assertions, regional-board, session retry, challenge,
weekly-history and responsive-browser checks pass. Generated QA artifacts stay ignored.
