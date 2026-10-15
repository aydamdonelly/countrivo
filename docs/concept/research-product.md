# Countrivo inventory: what the repo does today (read-only pass, 2026-10-12)

Repo: `/Users/adamkahirov/Desktop/code/countrivo`. Nothing was edited. I looked at the live site at countrivo.com in a new Chrome tab and played practice mode only, so no daily lock was written. I closed the tab afterwards.

---

## 1. Games: rules, scoring, seed, and what the board shows when

**Shared seed and state model.** These apply to every game.
- Daily seed: `getDailyRng(dateKey, edition)` = `mulberry32(dateSeed(dateKey + edition))` in `src/lib/daily-seed.ts`. The day is Europe/Berlin and resets at midnight Berlin. The edition is a reroll salt stored in `app_config` (`src/server/edition.ts`, admin button in `src/features/admin/reroll-button.tsx`).
- Practice boards use a server seed that is new on every request.
- Each game has the same file layout. Engine: `src/lib/game-logic/{slug}/`. Adapter: `src/games/{slug}/module.ts`. Action-log cookie: `codec.ts` writes `cv_p_{slug}`. Board, result and run-detail: `board.tsx`, `result.tsx`, `run-detail.tsx`. Registry: `src/games/registry.ts` and `src/data/game-registry.json`.
- The daily "done" and lockout state lives in cookies (`src/features/play/persist.ts`, `writeDone`, `writeLockoutBelt`). Signed-out players are therefore locked per browser only.
- **Integrity issue across all games.** Daily boards are rebuilt from the seed in the browser, so every answer is in the client. You can read it from the JS or RSC payload: the GeoWordle `answerIso3`, all 80 Higher or Lower values, Stat Guesser `actualValue`, Flag Quiz `correctIndex`. The server replays the board only for country-draft, blind-pick and stat-guesser (`validateGameResult` in `src/app/actions/game-runs.ts`). With a name-only leaderboard, the other boards cannot be checked at all.

### Country Draft (flagship), `src/lib/game-logic/country-draft/*` and `src/games/country-draft/*`
- **Rules.** Five rounds. Each round is one country from a pool of 51 sovereign states, chosen by the generator, never by the player. The country offers 3 people, each with a different archetype. You take one, put them in one of 5 open seats (Chair, Field, Purse, Voice, Desk), and the seat is then filled. You get one undo per run, which still works in the 60 s reveal window.
- **Scoring** (`tables.ts`):
  - Each appointment scores `FIT[archetype][seat]` (25/18/12/6/0) plus `STANDING_POINTS[standing]` (0/0/2/5/7/10).
  - There are 8 archetypes. Sovereign, Commander, Financier, Performer and Builder are each the natural fit for one seat. Firebrand, Contender and Outlaw have no natural seat.
  - Bonuses: Full cabinet +8 (every fit ≥12), Right hand +7 (the highest standing sits at a natural fit), Three naturals +5. Maximum 195.
  - Bands: "A footnote" below 40, then "A region", "A continent", "Most of the map", and "The whole thing." at 160+.
- **Generator** (`generator.ts`):
  - Brute force over all 29,160 cabinets (`bestLine`).
  - Rerolls up to 40 times until all of these hold: the ceiling is between 166 and 186; the greedy line scores at least 12 below the ceiling; the five countries span at least 3 continents; at least 4 of the 5 natural archetypes are offered.
- **Result.** A conquest map fills countries in great-circle order outward from your 5 countries (`fill-order.ts`, `src/ui/conquest-map.tsx`). The result also shows the best line.
- **Where the board makes the decision trivial** (`src/games/country-draft/board.tsx`):
  1. Every person card prints the archetype label and the standing (lines 68–73, "Sovereign · standing 5"). Because each archetype maps 1:1 to a natural seat, the label is the answer.
  2. Selecting a person shows the fit word and fit points on all 5 seats before you commit (lines 168–192, e.g. "natural 25 / plausible 12 / thin 6"). This is exactly the Napoleon/Macron/Zidane problem the owner described.
  3. The landing page publishes the whole FIT table and the bonus rules (`src/features/seo/draft-tables.tsx`, `src/content/draft.ts`).
  4. The 5 countries are listed on the "plan line" from the first second. This helps planning, but the player never chooses a country.
  5. After seating, a running score counts up per seat (`CountUp`).
  - What is left is only a knapsack puzzle on visible numbers. No knowledge about the people is needed.
- **Live bug, seen in Chrome.** The seat keyboard hint is glued to the fit number. The seats read "natural 25**1**", "plausible 12**2**", "thin 6**5**" (`board.tsx`, `<span className="key ...">{seat+1}</span>` sits inside the same `<b>`).
- Some people have no portrait and get an initial-letter placeholder (Ada Yonath showed "A"). There are 571 portraits for the 950 figures.

### Blind Pick, `src/lib/game-logic/blind-pick/*`
- **Rules.** 8 categories are drawn from 20 preferred stats. 8 countries come with continent spread ≥3, and every one has a rank in all 8 chosen categories. Countries arrive one at a time and you put each on an unused category. One undo.
- **Scoring.** Sum of world ranks, compared with the optimal (Hungarian) assignment via `solveAssignment`. Grade by gap: perfect at 0, then ≤10, ≤25, ≤50, ≤100. Leaderboard sort value is `1944 - scoreRaw`.
- **Shown when.** Before a pick you see only the country (flag, name, region) and the category labels with a clarifier. The rank appears only after placing. Nothing trivialising here.
- **Weakness.** The score is "sum of ranks", which a newcomer cannot read. The 3–5 min estimated time is long.

### Higher or Lower, `src/lib/game-logic/higher-or-lower/engine.ts`
- **Rules.** 80 pairs are precomputed, each a random category from 10 with two random countries. The left value is shown, the right is hidden, and one wrong call ends the run. Score is the streak.
- **Shown when.** The left value is always visible. The right value counts up during a 1500 ms reveal.
- **Problems.** The pairs are uniformly random, so there is no difficulty curve and no daily "story". All 80 values ship to the client. There is no server replay.

### GeoWordle, `src/lib/game-logic/geo-wordle/engine.ts`
- **Rules.** The hidden country is one of 237 with a centroid. Taiwan, Hong Kong, Macau, Western Sahara, Kosovo (UNK) and Åland can never be answers or guesses. You get 6 guesses. Feedback per guess is distance (haversine between centroids), an 8-way bearing, a proximity % on a sqrt scale, and a band from burning to cold.
- **Score.** Number of guesses; a loss counts as 6.
- **Shown when.** The first guess has no clue at all. Centroid distance is wrong for big countries: Russia and Canada score oddly.

### Stat Guesser, `src/lib/game-logic/stat-guesser/engine.ts`
- **Rules.** 5 rounds, each a random country × one of 8 stats. A reference anchor country with its value is shown. You type a free number (`inputMode="decimal"`).
- **Score.** `max(0, 100 - avg % error)`. The error is asymmetric: guessing 10× too high costs 900%, guessing 0 costs 100%, so guessing low is safer.
- **Shown when.** The anchor is the only hint. That is fine and not trivialising. Typing "84,500,000" on a phone is friction.

### Flag Quiz, `src/lib/game-logic/flag-quiz/engine.ts`
- **Rules.** 10 flags from all 243 entries, including territories such as Sint Maarten. 4 options each, with distractors from the same `region` (continent level), not the same subregion.
- **Score.** x/10. Answers ship to the client and there is no server replay.

### Speed Flags (practice only), `src/lib/game-logic/speed-flags/engine.ts`
- **Rules.** 20 s, 2 options each. The distractor is any random country, even though the code comment says "different region", so it is often trivially easy. Score is the number correct. No daily mode and no leaderboard.

---

## 2. Data (`src/data`, via `src/lib/data/loader.ts`)

### Datasets

| File | Content |
|---|---|
| `countries.json` | 243 entities (195 sovereign states in `sovereign.json`). Fields: iso2/iso3, name, displayName, slug, region, subregion (24), continent (Africa 58, Americas 55, Europe 53, Asia 50, Oceania 27), capital, borders[], flagSvgPath |
| `categories.json` | 21 stats with label, unit, direction, source, sourceYear and coverage% (details below) |
| `stats.json` / `ranks.json` | Raw values and world ranks for 243 entities. Coverage runs from 243 (area, population) down to 55 (wine) |
| `borders.json` | Neighbour lists. 79 entities have none (islands). Most neighbours: China 16, Russia 14, Brazil 10, Germany 9, DR Congo 9 |
| `capitals.json` | 243 capitals |
| `centroids.json` | 237 lat/lng points (missing: ALA, HKG, UNK, MAC, TWN, ESH) |
| `silhouettes.json` | 173 SVG outlines, which leaves 29 sovereign states without one. `mark-silhouettes.json` has 12 crest marks |
| `public/flags` | 244 SVG flags |
| `figures.json` | 950 people, 5 fields each (name, iso3, category, era, note) across 110 countries. 682 historical, 268 modern. Categories: leaders 153, athletes 143, scientists 116, musicians 110, writers 106, screen 81, commanders 66, founders 59, comedians 37, broadcasters 31, autocrats 25, outlaws 23. Top countries: USA 90, GBR 70, ITA 42, IND 41, FRA 40 |
| `draft-pool.json` | Built by `scripts/build-draft-pool.mjs`. 51 countries and 514 people mapped to 8 archetypes. "Standing" 5..1 is just the position in the authored list order, not an external fame metric |
| `portrait-slugs.json` / `figure-credits.json` / `public/figures` | 571 Wikimedia portraits with licence and author credits |
| `data-timestamps.json` | Content hashes and lastModified per entity (for sitemaps and IndexNow) |

### The 21 stats (source, year, coverage)
- **World Bank:**
  - population (2023, 99%)
  - GDP (2023, 90%)
  - GDP per capita (2023, 90%)
  - life expectancy (2022, 95%)
  - urban % (2022, 95%)
  - internet % (2022, 90%)
  - fertility (2022, 95%)
  - forest % (2021, 90%)
  - unemployment (2023, 88%)
  - renewables (2021, 85%)
  - inflation (2023, 85%)
  - arable land (2021, 90%)
  - FDI inflow (2022, 82%)
- **Joint sources:**
  - tourism arrivals: World Bank/UNWTO, 2022, 80%
  - military % GDP: World Bank/SIPRI, 2022, 80%
  - education % GDP: World Bank/UNESCO, 2021, 75%
  - health % GDP: World Bank/WHO, 2021, 85%
- **Other:**
  - area: REST Countries, 2023
  - beer: Kirin/WHO, 2022, 40%
  - coffee: ICO, 2022, 35%
  - wine: OIV, 2022, 35%
- `surface-area` exists in `stats.json` for 215 entities but is not a category.

### What the existing data could power with no new sources
- **Border games:**
  - "Name a neighbour" or a border chain from A to B (shortest path on `borders.json`).
  - "Which of these does not border X".
  - Most-neighbours trivia.
- **Capital games:** capital ↔ country match, and "capital or not" (a capital-match game was cut in August).
- **Silhouette game:** "whose outline is this" for 173 shapes, or 144 if limited to sovereign states.
- **Figure-knowledge games** (950 people with country, category, era and a one-line note):
  - "Which country is this person from" (pick from 4 flags).
  - "Who doesn't belong".
  - "Same country, different field".
  - A revised Country Draft that hides archetype and fit, so the player judges the person from the name, portrait and note.
- **Ranking and sorting:** sort 4–5 countries on one stat, or a top-N list with gaps.
- **Distance:** "closer to X or to Y" from centroids, and hemisphere or bearing quizzes.
- **"Did you know" facts generated from ranks:**
  - Extremes per stat.
  - Surprising pairs from `ranks.json`, e.g. country X is #3 in forest cover but #180 in area.
  - A country's best rank (already used in country-page metadata).
  - Neighbour contrasts, e.g. biggest GDP per capita gap across a border.
  - Per-country "people from here" from `figures.json`.
- **Gaps:** no coastline, landlocked flag, elevation, languages, currency or time-zone data. Taiwan and Hong Kong have no centroid.

---

## 3. SEO surfaces and traffic

### Routes (`src/app/(seo)`, all static or ISR)
- `/games` and `/games/[slug]`: 7 landings, `revalidate=600`, each with its own OG image.
  - Built by `src/features/seo/game-landing.tsx`: anchor card with a "Shoot" CTA, public top 3, how-to, FAQ JSON-LD.
  - Country Draft additionally prints the full scoring tables (`draft-tables.tsx`). GeoWordle has `geo-wordle-guide.tsx`.
- `/countries` and `/countries/[slug]`: 243 pages (`country-page.tsx`, `capsules.ts`).
  - Content: answer capsules, about text, all stats with ranks, peers, more in the continent, a "Play with X" row, rankings.
- `/categories` and `/categories/[slug]`: 21 pages.
- `/lists` and `/lists/[slug]`: 15 editorial lists in `src/content/lists.ts`. Examples: largest, most-populated, richest, countries-in-{europe, asia, africa, americas}, most-visited, life expectancy, GDP, forested, connected, fertility, military, greenest.
- Also `/credits`, `/privacy`, `/terms` and `/support`. Sitemaps are sharded under `/countries`, `/games` and `/lists`. IndexNow is wired up in `src/lib/seo/indexnow.ts`.
- `RETIRED_GAMES` 301s live in `next.config.ts`.

### Search Console, 28 days to 2026-10-08 (`reports/2026-10-11/search-console/report.md`)

**Site total:** 475 clicks, 6,613 impressions, CTR 7.18%, position 19.95. Up from 312 clicks the period before.

**Pages:**

| Page | Clicks | Share of clicks | Impressions | Position |
|---|---:|---:|---:|---:|
| `/games/country-draft` | 392 | 83% | 2,993 | 6.7 |
| `/games/geo-wordle` | 63 | | 1,893 | 4.3 |
| `/lists/countries-in-africa` | 0 | | 859 | 83 |
| `/games/higher-or-lower` | 6 | | | |
| `/` | 10 | | | |

- Country pages get impressions at position 25–80 (Argentina, Andorra, Costa Rica, Benin, Mali, Taiwan and others) with 0 clicks. Category pages rank about 5 (area-km2, education-spending) but have little volume.

**Country Draft queries:**
- Its own name converts: "country draft" 63% CTR at position 1.1, "country draft game" 50%.
- So do descriptive queries: "draft 5 people conquer the world game" 55% at position 2.5.
- The rival's terms do not: "195-0", "195-0 game", "world draft", "world draft 195 0", "195 and 0" and similar total about 800 impressions at position 7–10 with 0–3% CTR.

**Device split on country-draft:** mobile 96 clicks at 9.3% CTR, desktop 86 at 15.4%. Top country: US.

**GeoWordle:** "geowordle" is position 4 with 1,706 impressions and 3.6% CTR. It is a navigational query for other sites (geoworldle.com, worldle, geodle).

**Implication.** Any redesign has to keep these URLs and their indexable text:
- `/games/country-draft` (title "Country Draft: Draft 5 People, Conquer 195 Countries")
- `/games/geo-wordle`
- the 243 country pages

---

## 4. Auth, leaderboard, streak and friends: what goes when there is no login

**A name-only flow already exists.**
- `JoinRow` (`src/ui/join-row.tsx`) appears after a daily for signed-out players. It reads "Get on the board · Pick a name, no account needed" with a name field and a Join button.
- It calls `joinAsGuest` (`src/features/auth/auth-provider.tsx:228`) → `supabase.auth.signInAnonymously()` → the `handle_new_user` trigger creates a `profiles` row as `guestN` (fixed for anonymous users in migration `20260828120000_handle_new_user_anonymous.sql`) → `display_name` is updated → `submitGameRun`.
- The row also offers "Or sign in to keep your streak across devices". That line and the auth sheet are what must go.
- The anonymous provider has to be enabled in the Supabase dashboard; otherwise the code shows "Guest play is not enabled yet". Production status is not confirmed. 11 stored runs from 2 players in 28 days suggests the flow is barely used or failing. This needs checking.

**Code to remove for no-login:**
- Auth UI:
  - `src/features/auth/{auth-provider.tsx, auth-sheet-host.tsx, native-bootstrap.tsx}`
  - `src/ui/auth-sheet.tsx`
  - `src/app/(auth)/auth/{forgot-password, reset-password}`
  - `src/app/auth/callback/route.ts` (OAuth)
  - `src/lib/supabase/session.ts` session refresh in `src/proxy.ts`
  - `src/lib/native/session-fallback`
  - `supabase/functions/apple-exchange`
  - `scripts/migrate-oauth-users.ts`
- Social:
  - `src/app/(app)/friends/*`, `src/app/actions/friends.ts`, `src/features/social/{friends-page, friend-search, friend-rows, add-friend-button, invite-row, friendship, head-to-head}.tsx`
  - `src/ui/friends-strip.tsx`
  - the Friends tab on boards, the "Friends" nav item, and "Beat X and you're ahead of {friend}" in `src/features/home/daily-pane.tsx:86`
- Challenges and duels:
  - `src/app/actions/challenges.ts` (367 lines: createChallenge, startQuickDuel, and the rest)
  - the `friend_challenges` table
  - `supabase/functions/send-challenge-email`
  - migrations `ghost_duels` and `friend_challenges_hardening`
- Profile:
  - `src/app/(app)/profile/*`, `src/app/actions/profile.ts` (updateUsername, getHeadToHead and others)
  - `src/features/social/{profile-page, profile-head, profile-edit, delete-account, signed-out}.tsx`
  - `supabase/functions/delete-account`
- Streaks:
  - `updateStreak` in `game-runs.ts:420–518` (freezes, frozen dates, `streak_current/longest` on profiles)
  - `src/ui/{streak, streak-week}.tsx`
  - `supabase/functions/streak-reminder`
  - migration `streak_freezes`
- Push:
  - `src/app/actions/push-tokens.ts`, `device_tokens`, `supabase/functions/send-push` (only used by the iOS app)

**What a name-only "Put me on the leaderboard" needs from the DB:**
- `game_runs` today keys on `user_id` (FK to auth.users, RLS on own rows). It also has a unique constraint on one daily run per user, game and date (submit maps error `23505` to already_played). Other columns: `daily_puzzle_id` (via RPC `ensure_daily_puzzle`), `score_raw/max/sort_value/display`, `result_json`, `started_at` (used as the idempotency key), `completed_at`, and rank and percentile computed by RPC `compute_daily_rankings`.
- Leaderboard reads: RPC `get_daily_leaderboard`, `get_daily_summary`, `get_run_detail`, plus `src/server/boards.ts`, which joins runs to `profiles(username, display_name, country_code, streak_current)` with the anon key and a 2 min cache.
- **Option A (lowest effort):** keep anonymous sign-in, but trigger it silently at submit time behind the name field. RLS, the FK, rankings and run pages all keep working unchanged. The cost is a throwaway auth user per device. Session loss means a new identity, which is acceptable.
- **Option B (true no-auth):**
  - A server action inserts into `game_runs` with nullable `user_id`, new `display_name` text and a hashed device id from a cookie.
  - The service role would be needed server side, because RLS currently requires `auth.uid()`.
  - The unique key becomes (device_hash, game, date).
  - Rank computation and leaderboard RPCs must read `display_name` from the run, not from profiles.
- **Both options need:**
  - a profanity check (`src/lib/profanity.ts` already exists: `isAllowedHandle`)
  - rate limiting
  - server-side replay for all six dailies, since without accounts the board is trivially cheatable
- **Keep:** the cookie lockout, the action-log resume, share text (`src/lib/share/*`) and play analytics (`src/lib/play-events.ts`: play_start, play_finish, run_saved and share go to Vercel Analytics). The analytics are the only record of anonymous play.
- **Caution:** production Supabase has migration drift. The repo has 11 migrations and no base schema for `game_runs`/`profiles`. Never `supabase db push`; apply idempotent SQL.

---

## 5. Pain points for a first-time visitor (live check plus code)

1. **Empty social proof everywhere.** The home page and landings show "No shots yet today. Be the first." and "no shots yet" on every game row (seen live). With about 2 stored players a month the boards are always empty, so the board makes the site look abandoned.
2. **Jargon CTA.** The primary button says "Shoot" (anchor card), and the system talks about "shots". The meaning is not obvious; "Play" is.
3. **Country Draft reveals the answer.** See section 1: archetype on the card plus fit points on hover-hold. There is no choice of country. The 60 s reveal plus "See result" adds a step.
4. **Visual bug:** fit points glued to the key hint ("natural 251", "plausible 122").
5. **Keyboard hints on touch.** "1 to 3 take · 1 to 5 seat · Esc drop · U take back" is printed under the board even though half the users are on mobile.
6. **Login cues.** The header shows Friends, You and Ranks to a visitor with no account. The board row says "sign in to see your shot", and the join row pushes "sign in to keep your streak".
7. **Daily and practice confusion.** There is a Daily/Practice toggle on home, which is stored in a `cv_mode` cookie, and the play header says "Practice · doesn't count". After a daily there is no clear next card, only a "More dailies" list.
8. **Long-tail weaknesses:**
   - Blind Pick takes 3–5 min and is scored in "sum of ranks".
   - Stat Guesser needs typed large numbers.
   - Speed Flags distractors are too easy.
   - Higher or Lower has no difficulty curve.
   - GeoWordle's first guess is blind, and it excludes Taiwan and Hong Kong.
9. **Missing portraits:** 950 figures but 571 portraits, so some cards show a letter placeholder.
10. **Desktop layout.** The landing shows a two-column split: anchor card left, board and "More games" right, with long editorial text below. The game itself sits one click away at `/play`.
11. **Retention infrastructure is unused:**
    - 213 runs ever, from 19 players.
    - Streaks, freezes, friends, duels and push all exist but serve almost nobody.
    - There is no reason to return beyond "a new board tomorrow", with no countdown or tomorrow teaser on the result screen. `src/ui/next-dailies.tsx` and `countdown.tsx` exist and need checking for use.

Key files for the team: `src/games/country-draft/board.tsx`, `src/lib/game-logic/country-draft/tables.ts`, `src/features/play/game-host.tsx`, `src/ui/join-row.tsx`, `src/features/auth/auth-provider.tsx`, `src/app/actions/game-runs.ts`, `src/server/boards.ts`, `src/features/seo/game-landing.tsx`, `src/data/figures.json`, `src/data/draft-pool.json`, `reports/2026-10-11/search-console/report.md`.