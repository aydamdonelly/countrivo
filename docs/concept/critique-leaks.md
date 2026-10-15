# Adversarial test of the Countrivo concept v1.0: leaks, exploits and unfair boards

Severity order: **Critical** breaks the honesty of the daily board for everyone. **High** breaks one game or gives a dominant strategy. **Medium** makes boards unfair or lets knowledge stop mattering. **Low** is polish.

I checked the repo for two of these. GitHub `aydamdonelly/countrivo` is **PUBLIC**, and `src/lib/daily-seed.ts` derives a board as `mulberry32(dateSeed(dateKey + edition))` with no secret.

---

## Critical

### 1. ALL games, 5.9 / 9.2 "Keep daily-seed.ts": every future board can be computed today from the public repo
- **The leak.** The seed is `dateSeed(dateKey + edition)` with no secret. The edition is a small integer. The generators, `figures.json` fits and the planned "server only" distance matrix all live in a public GitHub repo. Anyone can run `solution(dateSeed("2026-10-13"+"1"))` on their own machine and get tomorrow's GeoWordle answer, the Flag Quiz order, every Country Draft fit vector and the Pinpoint countries.
- **Why it hurts.** The `publicBoard`/`solution` split, opaque flags and the leak grep protect nothing if the solution can be recomputed off-site. The claim that the server holds every answer, so a name-only board stays honest, is false as written.
- **Fix.**
  - Seed = `HMAC-SHA256(BOARD_SECRET, slug|dateKey|edition)`, with the secret only in Vercel env.
  - Move "server only" data (fit vectors, why lines, the distance matrix, the answer rotation) out of the public repo. Either make the repo private, or load that data at build time from a private bucket or Supabase table.
  - Add a CI check that fails if any solution-bearing JSON is tracked in git.

### 2. ALL dailies, 1.3 `cv_p_{slug}`: commit state lives in a client cookie, so the player can undo any move
- **The leak.** The action log sits in the cookie, and only the run header is HMAC-signed. The server "replays the log on every commit" and stores nothing until the run is finished. So a player can save the cookie, commit a move, read the reveal, restore the old cookie and commit something else. Signing the whole log would not help, because an old signed cookie is still valid.
- **What this lets you do in each game:**
  - GeoWordle: unlimited guesses.
  - Flag Quiz: try options until the right one fills ink.
  - Higher or Lower: try both calls.
  - Pinpoint: drop a pin, read the answer, roll back and drop inside.
  - Stat Guesser: lock, read the value, roll back and lock exactly.
  - Country Draft: probe all five seats for each person.
- **Why it hurts.** Every daily becomes a perfect score for anyone with devtools, and `verified` and the minimum durations cannot detect it.
- **Fix.**
  - Create the run server-side on its first commit: a `daily_runs` row with `status='open'`, plus a `run_steps(run_id, step, action)` table with `unique(run_id, step)`.
  - A commit is an INSERT. The reveal is returned only if the insert succeeds. A second action for the same step returns the stored reveal ("idempotent by step index" must mean "same answer back", never "accept a new action").
  - The cookie holds only `run_id`, signed.
  - Apply the same rule to practice runs that touch a daily board (the archive).

### 3. ALL games, A1 Archive `?date=`: today's and tomorrow's dailies can be played as practice
- **The leak.** `/games/[slug]/play?date=YYYY-MM-DD` replays a past board as practice. The concept only says "Today's board is never listed." Not listing a date is not blocking it. `?date=2026-10-12` (today) or `?date=2026-10-13` (tomorrow, which is deterministic) would serve the daily board in the P5 frame with full reveals.
- **Why it hurts.** It is a zero-skill route to every answer, and needs no devtools.
- **Fix.**
  - The server rejects any `date >= getTodayDateKey()` with a 404.
  - Archive boards use `edition = final edition of that day`.
  - Add a contract test that requests today's and tomorrow's dates and expects 404.

### 4. ALL games, 7.1 RLS and RPCs: anonymous reads of `daily_runs` and the `summary` RPC leak today's answers
- **The leak.** The concept says "RLS denies all anon writes" but says nothing about anonymous SELECT. The anon key is shipped to the client.
  - If SELECT is open, `GET /rest/v1/daily_runs?game=eq.geo-wordle&date_key=eq.today&select=result_json,action_log` returns every finished run's answer.
  - Even with SELECT closed, the `summary(game, date_key)` RPC returns "rarity counts" keyed by person and seat. Those are callable by anyone, before playing. They list the people of all 15 Country Draft countries (including unopened ones) and how the crowd seated them.
- **Fix.**
  - RLS: no anonymous SELECT on `daily_runs`, and REVOKE EXECUTE on both RPCs from `anon`. Call them only from server code with the service role.
  - `board()` returns only rank, name, place and `score_display`.
  - Rarity is computed in the result server render, only for the device's own seated people, and only when that device has a finished run.

### 5. Country Draft (CD1 to CD5) via W2 "Draft from Italy" and practice: the practice room is an oracle for today's daily
- **The exploit.** In daily round 2, France offers Napoleon, Macron and Zidane. The player opens `/countries/france`, taps "Draft from France", and round 1 is seeded with France. They seat Napoleon in The Field, read +37, and press "New board" to probe again. Then they seat him correctly in the daily.
- **The same pattern in other games:**
  - Practice Stat Guesser and practice Higher or Lower (any eligible stat, endless) reveal today's daily values.
  - `/categories/population` and the dossiers show them directly while a Higher or Lower or Stat Guesser call is open.
- **Why it hurts.** This is exactly the owner's complaint ("tap through and see Napoleon scores most"), moved to a second tab.
- **Fix.**
  - Until 00:00 Berlin, practice pools exclude every person on today's Country Draft board (all 15 trios), and practice Stat Guesser and Higher or Lower exclude today's (country, stat) pairs.
  - Category tables and dossiers cannot be gated, so record `visibilitychange` and blur counts per open step in the step row. Runs with the tab hidden while a question was open stay private but are not eligible for the top 50.
  - Accept and say openly on `/about` that Googling is possible. Do not claim the board is fully honest.

### 6. ALL games, P4 and 7.2 "a cleared cookie is a new device": scouting runs are free and unlimited
- **The exploit.**
  - Play the daily in an incognito window, or with a cookieless script that gets a fresh `cv_d` on every request.
  - Learn the answers, then play on the main device and name that run.
  - GeoWordle: 1/6 every day. Flag Quiz and Higher or Lower: 10/10.
  - Country Draft: one scout run reveals five seat values. R7 "What you passed on" reveals the other ten people's best seat and points, and R6 shows "Best possible today: 181" as a target. Two or three scout runs map the board.
  - The IP cap limits only *named* entries (10) and commits (600/h), and the scout run is never named.
- **Why it hurts.** The top of every board will be scouts, and the name rate goal (15%) means honest players see themselves beaten by cheaters.
- **Fix.**
  1. R7 shows only the names of passed-on people before midnight. Their best seat, points and why line appear after 00:00.
  2. Hide "Best possible today" until midnight.
  3. Cap *finished daily runs* per IP hash per game per day (for example 3). Beyond the cap, runs go practice-only, with the copy "This network already played today's board."
  4. Flag a run when it was started on an older device after a fresh device on the same IP hash finished the same game that day. The flagged run is not eligible for the top 50, but its private result still shows.
  5. To limit carrier-NAT false positives, compare IPv4 /24 and IPv6 /64 prefixes, and pair the cap with rule 4 rather than relying on it alone.

### 7. Flag Quiz, 5.9 rule 5: the "opaque" flag URLs form a public dictionary from URL to name
- **The leak.** `/f/{sha256(FLAG_SALT+iso)}.svg` is stable across days and modes. The same file is painted *next to its name* in many places:
  - GeoWordle suggestions (GW2: flag 20 plus name, all 243)
  - Higher or Lower cards
  - Country Draft country cards
  - board place flags (B1)
  - dossiers

  A userscript reads the dictionary off any of these pages and labels the Flag Quiz image. Even with per-question URLs, identical SVG bytes can be content-hashed against the 195 public flags.
- **Fix.**
  - The Flag Quiz question flag uses a per-slot URL: `/q/{HMAC(secret, dateKey|edition|index|deviceRun)}`. It answers only while that step is open on that run, with `Cache-Control: private, no-store`, and returns 404 after.
  - Serve it as a raster (WebP at 2×) or as a re-serialised SVG with randomised path precision, element order and a sub-pixel transform, so the bytes never match the named-flag file.
  - Named flags elsewhere keep their own stable URLs.

---

## High

### 8. Higher or Lower (HL1 and HL2): the left card is always the running maximum, so "Lower" dominates
- **The exploit.** "After each call, the country with the higher value stays as the next left card." So the left card's value never goes down. After two or three calls it sits near the top of the stat (China or India for population). Every new challenger is then likely lower, and at rank 1 it is certainly lower.
- **The contradiction.** The same section promises the bigger value sits left or right 50/50. The generator cannot keep finding higher challengers above a value that keeps climbing.
- **Why it hurts.** "Always Lower after call 3" scores well with no knowledge.
- **Fix.** The newly revealed right card always becomes the next left card (the classic chain), so the left value moves up and down. The seeded generator picks each challenger to hit the 50/50 split and the rank-gap ladder, and `check-contracts` asserts the higher-side split per board.

### 9. Pinpoint (5.3 scoring): pins in empty ocean beat near misses on land
- **The exploit.** `points = 170 − 30 × away`, where `away` counts entities whose border is closer to the pin than the answer's border.
  - Example: for Chile, a pin 2,000 km out in the Pacific has nothing closer (the Chilean islands belong to the answer), so `away = 0` and it scores 170.
  - A pin on land in Argentina 50 km from the border has `away ≥ 1`, because Argentina itself is at 0 km, so it scores 140 or less.
  - The same holds for any coastal country next to open ocean (Australia, New Zealand, Madagascar, Japan, Peru, Namibia).
- **Why it hurts.** The "region-fair" rule rewards not knowing where a place is, and offshore pins become a strategy.
- **Fix.**
  - Use a size-normalised distance: `points = 200 × exp(−d / k·√area)`, clamped at 0 beyond 3,000 km.
  - Or keep the count but multiply by `max(0, 1 − d/1500)`.
  - Unit-test the Chile offshore case.

### 10. Pinpoint (5.3 difficulty): the repeat rule cannot be satisfied and shrinks the candidate set
- **The problem.** "No country repeats within 60 days" × 5 rounds = 300 slots, but there are only 195 sovereign states. Rounds 1 to 3 (tier A or B, at least 100,000 km²) draw from roughly 80 to 90 states but need 180 in 60 days.
- **Why it hurts.** The generator will either fail or relax the rule silently. Near exhaustion, the remaining candidates are few and predictable from the archive.
- **Fix.** No repeat within 14 days per round band, enforced and tested in `check-fairness.ts`, with a generator assertion instead of a silent fallback.

### 11. GeoWordle (5.2 starter line): "Straddles the equator" gives far more information than the other two
- **The leak.** "Straddles the equator" fits about 13 sovereign states: Ecuador, Colombia, Brazil, Gabon, Republic of the Congo, DR Congo, Uganda, Kenya, Somalia, Indonesia, Maldives, Kiribati and São Tomé and Príncipe. "Northern hemisphere" fits about 150.
- **Why it hurts.** Equator days are solved in 2 or 3 guesses, so boards are unequal across days and streak or Par comparisons break.
- **Fix.** Use the hemisphere of the centroid only (two values, never "straddles"). Or drop the starter line and give everyone the same first-guess suggestion.

### 12. GeoWordle (5.2 rotation): the public archive plus the hard rules shrinks the answer list
- **The leak.** These rules are each strong, and players can check them against L4 and the archive:
  - no repeat within 120 days (62% of the 195 excluded once warm)
  - never yesterday's UN region
  - tiers by weekday (Monday to Thursday A and B)
  - at most one microstate per 7 days
  - plus the hemisphere starter line

  From about day 120, a spreadsheet leaves roughly 20 to 40 candidates, often fewer.
- **Why it hurts.** Regulars play by elimination, not geography.
- **Fix.**
  - No repeat within 45 days.
  - Make region and tier rules soft weights, not hard bans. Allow the same region on consecutive days with some probability.
  - Never publish the rotation rules.

### 13. GeoWordle and Stat Guesser (L2 "Par today", H3 meta): per-board Par is a function of the answer and is shown before play
- **GeoWordle.** Par comes from a heuristic solver run against the actual answer. "Par 3" means a central, well-connected country and "Par 6" a remote island, and anyone with the (public) solver can map Par back to candidates.
- **Stat Guesser.** Par is the score from guessing the anchors' geometric midpoint, so it encodes how far the true values sit from that midpoint.
- **Fix.** Before play, show a fixed game-level Par: GeoWordle 4, Stat Guesser 300, Pinpoint 720. Show the per-board Par on R1 and the board only after the device has finished.

### 14. Stat Guesser (5.6 anchors): anchors chosen relative to the answer give the answer away
- **The leak.** The anchors are "seeded so the answer falls below, between or above them in equal thirds." That means the anchors depend on the answer. Players learn the selection pattern (for example "between anchors, the answer sits near the log midpoint", or "anchors are rank neighbours, so the answer is within N ranks").
- **Fix.** Fix two reference countries per stat (for example population: Germany and Kenya), the same every day. That gives a familiar ruler that says nothing about the answer. Par is then computed with those fixed anchors.

### 15. Speed Flags (5.8): tapping fast without looking beats knowing flags
- **The exploit.** There are two options, no penalty for a wrong answer, and a 300 ms reveal. Mashing gives about 3 taps per second × 30 s × 50% ≈ 40+ right. A knowledgeable player at about 1 flag per second scores about 30.
- **Fix.** Either a wrong tap costs 3 seconds, the score is right minus wrong, or the round ends after three wrong answers. Add a 150 ms input lock after each flag appears.

### 16. Flag Quiz (5.4, flags 1 to 3): "Tier A with far distractors" makes the answer guessable without reading the flag
- **The leak.**
  - If the distractors are each far from the answer, the answer is the geographic odd one out among the four names.
  - If the distractors come from lower recognition tiers, "pick the most famous name" wins.
- **Fix.** Pick the four options to be far from each other in every pair, all from the same recognition tier as the answer. Test that the answer is never the unique maximum by tier or by minimum distance to the other options.

### 17. ALL games (non-negotiable 2 vs 5.9): "no loading states" pushes engineers to embed future content
- **The leak.** To make reveals feel instant with no spinner, developers will be tempted to:
  - prefetch the people of all three countries
  - prefetch the next flag's options
  - `<Link prefetch>` the result route
  - pass `solution` into a client component's props

  Any of these lands in the RSC flight payload, not the HTML.
- **Fix.**
  - `check-leaks.ts` must also capture RSC flight responses (`text/x-component`), every server-action response body, and prefetch requests, not just the first HTML and images.
  - Set `prefetch={false}` on any link into a play or result route.
  - A step's server-action response must contain only that step's reveal (assert the key set).

---

## Medium

### 18. Country Draft (5.1 generation): the generator rules work as hints
- **The leak.**
  - "Each country's trio has three different best seats": once you know Napoleon's seat, the other two cannot have it, so you can eliminate.
  - "At least two crossover people per board" and "the famous-obvious line is at least 12 below the ceiling" tell regulars that the obvious line is a trap, and to look for exactly two crossovers.
- **Fix.** Loosen to "best seats span at least 2 jobs". Make the crossover count 1 to 3 at random. Keep all generation rules out of public copy (L3, P3, FAQ).

### 19. Country Draft (CD2 identity line): in most rounds the identity line already names the seat
- **The problem.** For people who did not have a second career, "Governor of the Bank of Italy" or "Field marshal" names the seat. Rounds without a crossover are reading, not knowing, and round 5 has a forced seat as well.
- **Fix.**
  - Use more general wording for single-role people ("Banker", "Soldier and statesman").
  - Make sure the 25 vs 18 split between two plausible seats depends on the record, not the line.
  - Measure it: if the CD5 seat-choice accuracy on non-crossover people is above 90%, the lines are too explicit.

### 20. ALL (G8 reroll): runs on the old and new board share one ranking
- **The problem.** "Finished runs on the old edition stay on the board. Unfinished ones restart." Old-board players and new-board players are ranked together on different boards, and old players knew the broken board (often broken *because* it was easy).
- **Fix.** Give each edition its own board segment ("Board 1, Board 2" tabs), or move old-edition runs to unranked with an apology line.

### 21. Flag Quiz, Higher or Lower, GeoWordle (7.3 ranking): capped scores make the top of the board luck or cheating
- **The problem.** With no tiebreak, 10/10 and 1/6 put dozens of players tied at #1. A lucky first guess or a scout outranks real skill.
- **Fix.**
  - Weight later rounds: Flag Quiz flags 8 to 10 worth 2 points each (13 max); Higher or Lower calls 8 to 10 worth 2.
  - Rank GeoWordle by guesses, then by the sum of first-guess proximity (knowledge, not speed).
  - Show 1-guess solves without a rank badge.

### 22. GeoWordle (5.2 edge case): Taiwan and Kosovo give free information
- **The leak.** "Distance not available yet, does not consume a guess." If the row still shows a bearing or proximity, it is a free probe.
- **Fix.** Return nothing at all: the suggestion is disabled, with no row.
- **Also check.** The outline clue label and its confirm copy are identical whether the answer has an outline or uses the subregion-and-size fallback. Otherwise the label leaks membership of the 36-state "no outline" set.

### 23. Country Draft (5.1 share text): squares show how hard each seat is today, before midnight
- **The leak.** Squares are in fixed seat order and posted publicly. Combined with the Par line (most players seat the same famous people), they show which seats are rich today, for example "every share has a red Purse".
- **Fix.** Order the squares by round, not by seat. Seat order is the information that leaks.

### 24. ALL (7.3 percentile, rarity, B3): scout and bot runs distort the statistics
- **The problem.** Percentile, rarity and "Countries today" are computed over *all* verified runs, including fresh-device scouts and scripts. One script can move "Better than 71%" or rarity lines.
- **Fix.** Compute the statistics only over the first finished run per IP prefix per game per day, the same rule as finding 6.

---

## Low

### 25. Country Draft (CD3, CD2 portraits): portrait quality hints at era and fame
- Grainy 19th-century photos, paintings or official headshots hint at fame and era. Years are shown anyway, but keep the uniform greyscale **and** a uniform crop and resolution step at build (`scripts/build-portraits`), so photo quality never hints at fame.

### 26. Country Draft (H5, R1 "Better than 71%"; Best possible, L2): fix the reveal order
- "Best possible today" and per-person rarity belong after midnight. Before midnight, show only the player's own percentile.

### 27. ALL (7.2 rate limits): carrier NAT and school networks
- 10 named entries per game per IP per day will block school classes, which are a likely geography audience, and mobile carrier NAT.
- Raise the named cap to about 50 per IP prefix, and rely on findings 2 and 6 for integrity instead.

### 28. Stat Guesser (5.6 Par): Par can be reached with no knowledge
- "Always lock at the anchors' midpoint" scores exactly Par with zero knowledge. That is fine as a definition, but the card copy should not present Par as a skill target.
- Set R1 copy to compare with the median player once N is 20 or more.

### 29. Higher or Lower (card copy "Today: population"): the stat is known in advance, combined with finding 5
- The stat is public before play. Together with the category page in another tab, it makes this the game easiest to look up.
- Prefer stats with no ranked table one tap away on the site during play, or use the blur flag from finding 5.

---

## Most urgent (the critical findings)

The fixes for findings 1 to 4 and 6 go in Phase 1 before any name board ships: a secret seed, server-side step rows, the archive date guard, RLS on reads and the scouting caps. Findings 5 and 7 (daily people out of practice pools, per-question flag URLs) are also critical. Without these, "Put me on the leaderboard" ranks people by who used devtools or a second window, not by geography.

Files checked:
- `/Users/adamkahirov/Desktop/code/countrivo/src/lib/daily-seed.ts`: no secret in the seed.
- `/Users/adamkahirov/Desktop/code/countrivo/public/flags/`: 244 files named by ISO code (`ad.svg`), so today's flag URLs are a ready dictionary.