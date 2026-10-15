# Countrivo: the game designer's proposal

Read-only pass over the repo (`src/lib/game-logic/*`, `src/games/*`, `src/lib/share/*`, `src/ui/flag.tsx`) plus Research A, B and C. No edits.

---

## 1. Diagnosis: what a first-time visitor gets today

I traced the most common visit (Google, then "country draft", then `/games/country-draft`, half of them on a phone) step by step.

1. **They land on a page that looks dead.** The anchor card says "Shoot", which is jargon. The board says "No shots yet today. Be the first." Below it is a full scoring table. The game itself is one more click away at `/play`. The first thing they read is that nobody plays here.
2. **The game answers itself.** Each person card prints the archetype and the standing ("Sovereign · standing 5"). Archetypes map 1:1 onto natural seats, so the label is the answer. Holding a person shows "natural 25 / plausible 12 / thin 6" on every seat before you commit. That is the Napoleon, Macron, Zidane problem the owner described. What remains is a knapsack puzzle on visible numbers, and knowing nothing about Napoleon costs you nothing.
3. **The undo is a probe.** The one undo still works inside the 60 s reveal window (`RESULT_REVEAL_MS`, `module.ts` `case "undo"`). You can seat someone, watch the points count up, take it back and try another seat. Even with every label hidden, this alone would leak the scoring.
4. **The player never chooses the country.** All five countries are fixed and listed on the plan line from the first second. Agency only begins at "which of three people", so the country, which is the geography part, is decoration.
5. **The result is a dead end.** You get 154 of 195, a map, and "the best line" (which is public on run pages the same day, so it spoils the board for anyone who has not played). Then "Get on the board" sits next to "sign in to keep your streak", above an empty board. Nothing says tomorrow exists and nothing points to the next game.
6. **The other games have their own leaks and friction:**
   - Flag Quiz serves the flag as `/flags/fr.svg` (`src/ui/flag.tsx:43`). On a phone, a long press on the image shows the filename, which is the answer.
   - Flag Quiz `correctIndex`, all 80 Higher or Lower values, the Stat Guesser `actualValue` and the GeoWordle `answerIso3` are all in the client payload.
   - GeoWordle's first guess is blind, and centroid distance misjudges Russia and Canada.
   - Stat Guesser makes you type "84,500,000" on a phone keyboard.
   - Higher or Lower is uniformly random, with no difficulty curve and no story.
   - Blind Pick scores in "sum of ranks", which nobody understands.
   - Speed Flags' distractor is any random country, so it is trivial.
   - Keyboard hints like "1 to 3 take · 1 to 5 seat" print on touch screens.
7. **Root cause in one line:** the games reward reading the interface instead of knowing the world, and the loop ends at the result screen.

---

## 2. Principles

1. **Commit, then reveal.** Before a commit the screen shows only identity (name, face, flag, years, one neutral line), never a value. *If the UI can score an option, the player does not have to.*
2. **No probing.** After a value is revealed there is no undo. "Put back" exists only between picking something up and committing it. *Undo plus reveal turns any hidden value into a lookup.*
3. **Choose the what, never see the worth.** Players pick countries, cells, seats and order; worth stays hidden. *Agency is fun, and agency over visible numbers is arithmetic.*
4. **Score real knowledge, publish principles.** Scores come from data about the actual person, country or stat (career record, Wikipedia reach, real ranks). The landing explains the logic in words and never prints a table. *A public table makes a solved game (see 195-0).*
5. **Every miss teaches.** A wrong or weak commit always shows the fact that made it weak, in one line. *The loss screen is the learning screen.*
6. **Partial credit, no dead ends.** Distance, ratio and rank give a beginner something every round. *A zero feels like a wall, a 40 feels like a lesson.*
7. **Escalate.** Later rounds are harder or worth more, so a comeback is always possible. *Round 5 has to matter as much as round 1.*
8. **One shot counts, practice is endless, and the two never mix.** The daily is first-run-only. Practice boards and past dailies are unlimited and never ranked. *Scarcity makes the daily matter; abundance keeps people on the site.*
9. **The server is the referee.** No solution ships in HTML, RSC payloads, cookies, filenames or alt text. Each commit is a server round trip that returns the reveal. *A name-only leaderboard is worthless if the answer sits in DevTools.*
10. **Never show an empty room.** When fewer than 5 runs exist today, the board shows Par (a named honest baseline line) instead of "no shots yet". *An empty board says "abandoned"; a par line says "here is the bar".*
11. **One verb.** "Play". Not Shoot, not shots. *Every word you have to learn is a reason to leave.*
12. **The next card is always visible.** Every result pane shows the next unplayed game peeking in. *Session depth comes from momentum, not menus.*
13. **The share tells the journey, not the answer.** No names, no countries, no flags in share text, and the site name is in the text. *The group chat is the leaderboard that works with 1,000 visitors a month.*
14. **Touch first.** Every input is a tap, a drag or prefix-ranked autocomplete. No keyboard hints render on coarse pointers. *Half the traffic is a thumb.*
15. **Feedback never relies on colour alone.** Every colour comes with a number, a word or a shape. *One accent plus ember plus clay green cannot carry meaning on hue.*

---

## 3. The game catalog

| Game | Verdict | One-line change |
|---|---|---|
| Country Draft | **Keep, rebuild the round** | Pick the country from 3, then the person; all values hidden until seated; scoring from each person's real record |
| GeoWordle | **Keep, fix** | Border-to-border distance, an earned outline clue, a bonus chain on today's country |
| Blind Pick | **Keep, retune** | Golf scoring ("4 off perfect"), ranks shown as "#12 of 195" |
| Higher or Lower | **Change the daily** | 10 fixed calls on a difficulty ladder, a miss does not end it; the endless streak becomes practice |
| Stat Guesser | **Change the input** | Log-scale drag slider with anchor countries; symmetric ratio scoring |
| Flag Quiz | **Keep, harden** | Look-alike distractors, a difficulty ladder, opaque image URLs |
| Speed Flags | **Fold into Flag Quiz practice** | Becomes "Rapid" practice on the Flag Quiz card; keep the URL with a 301 or noindex |
| New dailies | **None now** | Six is the right count (NYT ships about six). Candidate for later: "Pin" (tap the place on a map, MapTap-style), once a proper map renderer exists |

Below, **Decides** is what the player decides, **Hidden** is what stays hidden until commit, and **Feedback** is the feedback moment.

### 3.1 Country Draft (flagship)

- **Rules:** Five rounds. Each round you pick one of three countries, it reveals three of its people, and you seat one of them in an open cabinet job (Chair, Field, Purse, Voice, Desk). The cabinet scores out of 195 from how well each person fits their job, how widely the world knows them, and three cabinet bonuses.
- **Decides:**
  - Which country to open, without knowing its people.
  - Which of the three people to take.
  - Which open seat to spend them on. This is the opportunity cost: Napoleon is strong in both Chair and Field, so the real question is which seat the next four countries are less likely to fill.
- **Hidden until commit:**
  - The country's three people, until you pick the country.
  - Each person's fit per seat, their reach and their points, until seated.
  - The par and best lines, until the run ends.
  - The best line itself, until midnight Berlin. Only its number, "Best possible today 181", is shown at the result.
- **What each person card shows:**
  - Portrait, name and years ("1769-1821").
  - One neutral identity line in the person's own terms: "Emperor of the French", not "Commander".
  - No archetype, no standing, no number.
  - The three cards are shuffled by seed, never sorted by fame.
- **Feedback:** Seating is the commit. The card drops into the cabinet strip with a clay "plop". A stamp counts up in 700 ms: fit word and points, then reach points, then one "why" line: "The Field · 25 · won 60 of 70 battles", "Reach · 10 · in 190 Wikipedias". A weak seat shows the same thing in ember: "The Purse · 6 · never ran a treasury".
- **Scoring:**
  - **Fit, 0 to 25 per seat:** from a 5-value vector authored per person at five levels (25 / 18 / 12 / 6 / 0), based on what they actually did. Example: Napoleon gets Chair 25, Field 25, Desk 18 (Code civil), Voice 12, Purse 6.
  - **Reach, 0 to 10:** from the Wikidata sitelink count (language editions), percentile-banded across the pool and frozen per `POOL_VERSION`.
  - **Base:** 5 × 35 = 175.
  - **Bonuses, 20 in total:**
    - **Full cabinet +8:** every fit is at least 12.
    - **Three continents +6:** this is now a real choice, because you pick the countries.
    - **Across the ages +6:** at least one person active before 1900 and one after 1950.
  - The maximum stays at 195, which keeps the SEO title "Draft 5 People, Conquer 195 Countries".
- **Share** (the existing middle-dot house grammar stays; fits are sorted, so nothing about seats is revealed):
  ```
  Countrivo · Country Draft · #241
  162 of 195 · Most of the map
  fits 25 · 25 · 18 · 25 · 12
  12 above par
  countrivo.com/games/country-draft
  ```

### 3.2 GeoWordle

- **Rules:** Six guesses at a hidden country. Each guess returns the distance between the nearest borders (0 km means you are touching it), a bearing arrow and a proximity percentage.
- **Decides:** Which country to probe next for the most information, and whether to spend the clue.
- **Hidden:**
  - The answer stays on the server. Each guess is a server action that returns only that guess's distance, bearing and proximity.
  - After the second miss you may tap **Clue**, which reveals the outline. It costs one guess and shows in the share.
- **Feedback:** The row slides in, the distance counts down from 20,000 km to the real value in 600 ms, the bearing arrow rotates into place, and "touching" gets its own word, not just a colour.
- **Bonus chain** (after a solve or a loss, same country, not in the main score):
  - neighbours: tap all of them among 6 options
  - capital: 4 options
  - one surprising stat line: "Ranks #3 for forest cover, #180 for area"
- **Scoring:** Guesses used, plus one if the clue was used; a loss counts as X. Bonus stars are shown separately (0 to 2).
- **Share:**
  ```
  Countrivo GeoWordle #241 · 4/6
  ⬜⬜🟨🟩 + 2 bonus
  ```
  A clue row is marked with a distinct square. This is Worldle grammar, which is recognisable in chats.

### 3.3 Blind Pick

- **Rules:** Eight countries arrive one at a time. You place each on one of eight unused stats, aiming for the stat where it ranks highest in the world.
- **Decides:** Spend a country's strongest stat now, or save that stat for a country that might be even better at it. The next country is unknown.
- **Hidden:**
  - The rank, until placed.
  - The upcoming countries.
  - The optimal board, until the end.
- **Feedback:** The rank stamps in as "#3 of 195", with a tier word (Top 10 / Top 50 / Mid / Low) and a number, never colour alone.
- **Scoring:** Golf. You see "Perfect" or "+N" (ranks off the optimal assignment), the same grammar Travle made readable. The end screen overlays your board on the perfect board, with the swaps that would have fixed it.
- **Share:**
  ```
  Countrivo Blind Pick #241 · +14
  🟩🟩⬜🟩🟨🟩🟩⬜
  ```
  A square means the placement matched the optimal stat or not.

### 3.4 Higher or Lower

- **Daily rules:** Ten calls in a chain where the winner stays and the next country challenges it. A miss does not end the run; the score is calls right out of 10. Pairs climb a ladder: the value ratio shrinks from about 5× in call 1 to about 1.15× in call 10.
- **Decides:** Higher or lower.
- **Hidden:** The right-hand value comes from the server only after the call. It counts up for a fixed 900 ms whatever the value, so the animation length leaks nothing.
- **Feedback:** The number counts up, then the stamp. A miss gets one line: "Mongolia: 3.4 M people. Less than Uruguay's 3.4 M by 2,000."
- **Practice:** The old endless sudden-death streak.
- **Share:**
  ```
  Countrivo Higher or Lower #241 · 8/10
  🟩🟩🟩🟩🟥🟩🟩🟩🟥🟩
  ```

### 3.5 Stat Guesser

- **Rules:** Five rounds, each one country and one stat. You drag a pin along a log-scale track on which two anchor countries are already placed.
- **Decides:** Where between and beyond the anchors the value sits.
- **Hidden:**
  - The actual value.
  - The anchors are seeded so the answer falls below, between or above them in equal proportion, so anchor placement carries no bias.
- **Feedback:** The true marker slides in, and the gap prints as a ratio: "1.4× too high".
- **Scoring:**
  - Each round scores `round(100 × max(0, 1 − |log10(guess/actual)|))`. Off by 10× in either direction scores 0, so the old bias where guessing low was safer is gone.
  - Round 5 counts ×2, for a total out of 600.
- **Share:**
  ```
  Countrivo Stat Guesser #241 · 412/600
  🟩🟨🟩⬜🟩
  ```

### 3.6 Flag Quiz

- **Rules:** Ten flags, four country options each. Flags 1 to 3 are common sovereign states and flags 8 to 10 are look-alikes and territories.
- **Decides:** Which option.
- **Hidden:**
  - The answer stays on the server.
  - Flag images are served from a per-board opaque URL, `/f/{hash}.svg`, never `/flags/{iso}.svg`.
  - The image has no alt text and no title.
- **How distractors are picked:**
  - Same subregion, plus colour-palette similarity.
  - The same kind of entity as the answer (a sovereign state never mixed with territories), so the odd one out is not the answer.
- **Feedback:** A wrong tap marks the right option and gives one line: "Chad and Romania: same three bands, Chad's blue is darker."
- **Scoring:** x/10.
- **Practice:** "Rapid" practice (the former Speed Flags): 20 s, two options, look-alike distractor.
- **Share:**
  ```
  Countrivo Flag Quiz #241 · 9/10
  🟩🟩🟩🟩🟩🟩🟩🟥🟩🟩
  ```

---

## 4. Every pane on the site

D = desktop and P = phone where they differ. Everything not marked renders the same, adapted to width.

### Global
1. **Header:** wordmark, the flame with the device streak count, and the overflow menu. Its job is identity plus "you have a streak here".
2. **Today strip** (C-b): six clay objects, one per daily. Each shows one of four states: unplayed (still), in progress (wobbling, "3/5"), done (score under it), today's best (a green clay object). Tapping one jumps to its card. It sits on every route except inside a running board, where it collapses into the game's own progress strip.
3. **Overflow sheet:** your board name (edit), sound on or off, how scoring works, yesterday's answers, archive, about, privacy and terms.

### Home `/`
4. **Card stack, playing state:** one game per screen as a big card, with the next card peeking (P: below; D: to the right with arrow-key navigation). Each card has the clay object, the game name, a one-line pitch, today's par and **Play**.
5. **Card, in-progress state:** "Round 3 of 5 · Continue". The cookie action log resumes the run.
6. **Card, done state:** score, Par comparison, rank if there are 5 or more runs, then **Share** and **Practice board**.
7. **Full set state:** all six done. The strip becomes six green-based clay objects, plus "Full set · day 6", a countdown to 00:00 Berlin and a link to yesterday's answers.
8. **Midnight rollover banner** (a page open across 00:00 Berlin): "New boards are out", with the strip refreshing in place.

### Game landing `/games/[slug]` (SEO, keeps the URLs and indexable text)
9. **Landing hero:** the same game card as home, with **Play** going to `/play`. D shows the card plus today's board side by side.
10. **How it works:** three lines of rules in words plus one looping clay illustration. Principles, never number tables.
11. **Today's board:** the top 10 names and scores, or Par plus "Be the first name on it" when there are fewer than 5 runs.
12. **Yesterday's answers:** yesterday's board fully revealed, with facts (the best cabinet, the GeoWordle country, the flags). This is the indexable content that brings people back.
13. **FAQ:** keeps the JSON-LD.

### Play `/games/[slug]/play`
14. **First-visit rules sheet:** a half-height sheet over an already rendered board, with three lines, one clay loop and "Got it". It never gates the board and shows once per game per device.
15. **Board, live:** per-game layout (section 5.4).
16. **Country Draft: country choice.** Three country cards (flag, name, continent) and the cabinet strip below with its open seats.
17. **Country Draft: people reveal.** The chosen country's three people flip in, with portrait, name, years and identity line.
18. **Country Draft: seat sheet** (bottom sheet on P, side panel on D). Open seats only, each with its name and its "wants" line ("takes ground"), no numbers. A taken person can be put back from here.
19. **Country Draft: seated stamp.** The fit, reach and why lines count up on the seat, then the next country choice slides in.
20. **GeoWordle: guess input.** Prefix-ranked autocomplete over all 243 entities, flags in the rows, and a Clue button that unlocks after miss 2.
21. **GeoWordle: bonus chain.** Neighbours, capital and the fact line.
22. **Practice banner state:** the same board with a quiet "Practice board · not ranked · New board" line.
23. **Daily already played** (revisit): opens straight to the result pane, read-only.
24. **Board closed state** (started yesterday, finished after midnight): "This board closed at midnight. Finish it as practice."
25. **Result pane:** the score count-up, band, per-round breakdown with why lines, Par and best possible, rank or percentile when there are 5 or more runs, then **Put me on the leaderboard**, **Share**, the next card peeking and Practice board.
26. **Name entry** (inline, expands from the button): a name field prefilled with the last name used on this device, and **Put me on**. Its error states:
    - "Pick a different name" (profanity)
    - "Max 20 characters"
    - "This device already has a name on today's board"
    - "Practice runs can't go on the board" (should be unreachable)
27. **On the board state:** the button becomes "You're #7 today · See board", and your row slides into the mini board.
28. **Share copied toast:** "Copied. Paste it anywhere." Native share sheet on mobile.

### Boards and runs
29. **Leaderboard `/leaderboard`:** a game switcher, Today or Yesterday, the top 50, your device's row pinned, and Par always listed as a row in mute ink.
30. **Run page `/run/[id]`:** private to the device until 00:00 Berlin (others see score and name only), then fully public with the cabinet or board.
31. **Archive `/games/[slug]/archive`:** a calendar of past dailies, playable as practice and never ranked. Free, no paywall.

### Reference (keep, lightly)
32. **Country page `/countries/[slug]`:** adds "Play a practice draft from {country}" and "{country} in today's games", the latter only after the day closes.
33. **Category pages and lists:** keep. Each gets a "Guess this stat" practice entry.
34. **About, credits (portrait licences), privacy, terms, support.**

### System
35. **404:** the clay globe with "That page isn't on the map" and today's strip.
36. **Error:** a retry, with the board state kept in the cookie.
37. **Offline (iOS):** the last result plus "Boards need a connection".

### Removed
`/friends`, `/profile`, every auth page, the auth sheet, the Daily/Practice toggle, and the Friends tab.

---

## 5. Game loops, scoring and anti-leak

### 5.1 The loop at three scales

- **Moment (under 1 s):** tap, a press state at 0 ms, the server reveal at 150 to 400 ms, a stamp and count-up over 600 to 900 ms, then the next decision is interactive at once. The count-up never blocks the next input; it can finish while you read the next card.
- **Session (3 to 8 min):**
  1. Land on one game.
  2. Finish it.
  3. The result pane shows the next card peeking.
  4. Swipe and play.
  5. The strip fills.
  6. Full set.

  The target is 2.2 games per session, against about 1 today.
- **Day to day:**
  - Device streak on the flame (one or more dailies played on a Berlin day). No freezes, because no accounts means no recovery theatre.
  - The result pane says "New board in 7 h 12 m".
  - "Yesterday's answers" is the reason to come back the next morning: people return to see the best line they missed.

### 5.2 Anti-leak audit

| # | Leak | Where | Fix |
|---|---|---|---|
| 1 | Archetype label on the person card | `country-draft/board.tsx` 68-73 | Remove. Show an identity line in the person's own terms |
| 2 | Standing number on the card | same | Remove. Reach is hidden and comes from external data |
| 3 | Fit word and points on every seat while holding | `board.tsx` 168-192 | Seats show name plus "wants" only |
| 4 | Undo inside the 60 s reveal window (seat, see, undo, re-seat) | `module.ts` undo, `RESULT_REVEAL_MS` | Undo only before the seat commit ("put back"). Nothing after a reveal |
| 5 | FIT table and bonuses printed on the landing | `draft-tables.tsx`, `content/draft.ts` | Replace with principles in prose |
| 6 | Card order follows authored list order, which equals standing | `draft-pool.json` order | Shuffle by seed |
| 7 | Portrait presence correlates with fame (571 of 950 have one; a letter placeholder signals "obscure") | `public/figures` | Draft pool limited to figures with portraits, or one uniform portrait treatment for all |
| 8 | Best line visible on run pages the same day | `run-detail.tsx` 129 | Hidden until 00:00 Berlin; only "Best possible 181" as a number |
| 9 | Flag filename is the ISO code | `ui/flag.tsx:43` | Per-board opaque URL, served by the proxy or pre-hashed copies |
| 10 | Answers in the client payload (GeoWordle `answerIso3`, H/L values, Stat Guesser `actualValue`, Flag `correctIndex`) | all `module.ts` `create(seed)` on the client | Split each module into `publicBoard` (shipped) and `solution` (server only). Each commit is a server action returning the reveal for that step only |
| 11 | Autocomplete restricted to valid answers | GeoWordle | Autocomplete over all 243 entities; non-answer entities are valid guesses that return a distance |
| 12 | Distractors of a different kind (a territory among sovereigns, another continent) | Flag Quiz, Speed Flags | Same kind, same subregion and look-alike colours |
| 13 | Anchor placement bias | Stat Guesser | Equal thirds below, between and above |
| 14 | Pair position bias (bigger value always on one side) | Higher or Lower | Seeded 50/50 with a check in `check-contracts.ts` |
| 15 | Reveal animation length scales with the value | H/L, Stat Guesser count-ups | Fixed durations |
| 16 | Share text names countries or people | `src/lib/share/*` | Keep the current rule: no names, flags or seats. Add a test |
| 17 | Rarity percentages shown before commit | (future) | Only on the result pane |
| 18 | Alt text names the answer | Flag Quiz is already fixed (`alt=""`); check every future board | A lint rule in `check:theme`: no `alt` built from the answer on game boards |
| 19 | Day boundary trusted to the client | (already server Berlin) | Keep. Never let a client date choose the seed |
| 20 | Practice used to preview the daily | none (different seeds) | Keep the seeds disjoint by salting practice with `"p:"` |

How the leak test works: before shipping, a script renders each board's first HTML and every pre-commit state, then greps the payload and DOM for the solution tokens (ISO codes, values, indices, fit numbers). Any hit fails CI.

### 5.3 Integrity for the name-only board

- **Device token:** a random token issued at first visit in an httpOnly cookie, hashed server side. No auth user.
- **Who can submit:** only runs that started as a daily on today's Berlin date and were replayed by the server from the action log against the server-held solution. That covers all six dailies, not just three.
- **Plausibility checks:** a minimum duration per game (a Country Draft finished under 20 s is rejected), plus a rate limit per IP.
- **One entry per (device hash, game, date).** `isAllowedHandle` checks the name, max 20 characters. The name is remembered on the device so tomorrow it is one tap: "Put me on as Adam".
- **Names are not unique.** Two Adams are fine. The row shows the name plus a tiny crest seeded from the device hash, so the same device keeps the same crest.
- **Database:** `game_runs` gets a nullable `user_id`, plus `display_name`, `device_hash` and `verified boolean`. The insert happens through a server action using the service role. This is Option B from Research B. It is cleaner than silent anonymous auth and removes the whole auth surface.

### 5.4 Per-game board state machines

- **Country Draft:**
  1. `choose-country` (3 cards)
  2. `reveal-people` (3 cards flip in, 120 ms stagger)
  3. `holding` (seat sheet open, put back allowed)
  4. `seated`: the commit. Server reveal, stamp, strip update, then back to step 1 or to `result`
- **GeoWordle:** `guessing` (n of 6, clue locked or unlocked), `solved` or `lost`, then `bonus-neighbours`, `bonus-capital`, `fact`, `result`.
- **Blind Pick:** `arrive` (country slides in), `placed` (rank stamp), and `result` after 8, with your board compared to the perfect board.
- **Higher or Lower:** `call` (left value visible), `reveal` (fixed 900 ms), and `result` after 10. Practice: `call` until the first miss.
- **Stat Guesser:** `drag`, `lock` (button), `reveal` (true marker plus ratio), and `result` after 5.
- **Flag Quiz:** `options`, `tap` (commit), `reveal` (marks plus fact line, 1.2 s, tap to skip), and `result` after 10.

### 5.5 Feedback timing and juice (motion decisions sit with the designer; these are the gameplay timings)

| Event | Timing | Juice |
|---|---|---|
| Any tap | 0 ms press state | No hover lift, no boop |
| Commit to reveal | Optimistic "committed" state at once; the reveal arrives in 150 to 400 ms | A clay "plop" frame swap on the target |
| Score stamp count-up | 700 ms ease-out, fixed duration | Erode numerals tick on twos (12 fps steps) to match the clay |
| Perfect pick (fit 25, perfect placement, exact flag) | +200 ms hold | The clay object switches to its green state for one beat |
| Miss | 0 ms | Ember word plus one fact line. No shake longer than 160 ms |
| Run end | 900 ms total count | The conquest map fill (Draft) or the strip object turning green |
| Next card peek | Visible at once on the result pane | The card nudges 8 px once after 2 s if untouched, then never again |

Content is never hidden behind any of this; every stamp writes its final text at once and the count-up is decorative.

### 5.6 Difficulty and curation rules

- **Country Draft generator:**
  - 15 countries per day (5 rounds × 3).
  - Each round's three span at least 2 continents.
  - Each country's trio has three different best seats.
  - The ceiling is between 160 and 185.
  - The "famous-obvious" line (highest reach, then best fit) sits at least 12 below the ceiling. This makes fame-only play suboptimal.
  - No country repeats within 14 days.
  - Search space: 3^5 country paths times seatings, roughly 7 M lines per board. Compute it at board build time on the server and cache it per date and edition.
- **GeoWordle answers:**
  - No repeat within 100 days.
  - Countries under 5,000 km² not within 7 days of each other.
  - Never two days on the same continent.
  - Taiwan, Hong Kong and Kosovo become valid guesses as soon as distance data exists.
- **Flag Quiz:** a 3 easy / 4 medium / 3 hard ladder, scored from a look-alike index (palette distance plus layout class).
- **Higher or Lower:** the ratio ladder, plus each stat used at most twice per board.
- **Stat Guesser:** stats with at least 90% coverage only, and no microstate under 100k population in round 1.
- **Blind Pick:** the gap between greedy and optimal is at least 8, so placement actually matters.

### 5.7 Par instead of empty boards

Every daily ships with **Par**, an honest baseline computed by the engine and labelled as such:

| Game | Par |
|---|---|
| Country Draft | the famous-obvious line |
| GeoWordle | the median-solver guess count (start from the centroid of the most populous continent) |
| Blind Pick | the greedy line |
| Higher or Lower | 7/10 |
| Stat Guesser | the anchor midpoint guess |
| Flag Quiz | 7/10 |

The result pane always has something to compare against ("12 above par") from player one onward. Rank and percentile appear once 5 runs exist. Par is never presented as a player.

### 5.8 Share grammar

- One header line, `Countrivo {Game} #{n}`, then one score line, then at most one journey line, then the URL.
- Squares only where they encode the order of quality (GeoWordle, H/L, Flag, Blind Pick, Stat Guesser).
- Country Draft keeps the sorted middle-dot fits.
- Practice shares say "practice" and carry no number.
- After a Full set, a seventh option, **Share my day**, gives six lines, one per game.

### 5.9 Practice

- **Practice board** appears on a card only after that game's daily is done. Before that, the card's only action is Play. This alone removes the Daily/Practice toggle.
- The archive gives past dailies as practice.
- Country pages seed themed practice drafts ("Draft from Italy").
- Practice is never ranked, never streaks and never asks for a name.

### 5.10 Metrics that judge this redesign

- Plays per visitor: about 1 now, target 2.2.
- Daily completion rate per started run.
- Rate of "Put me on the leaderboard" per finished daily: target 15%, against about 1% now.
- Share copies per finished daily.
- Visitors on day 2 and day 7 (device token).
- Country Draft: the fraction of runs at or below Par. If it is over 60%, the hidden information is too hard and needs better identity lines.

These all go through `play-events.ts`, extended with `card_next`, `name_submit` and `share_day`.

---

## 6. Risks and open questions

1. **Authoring load:** 514 or more draft figures × 5 fit values is about 2,600 judgements, plus a "why" line for each strong fit. Proposal: an LLM first pass from the existing note plus Wikipedia, then geography-expert review in batches by country, all stored in `figures.json` through the pipeline. Not hand-edited JSON.
2. **Reach data** is a new external source (Wikidata sitelinks). It needs a fetch script, a frozen snapshot per `POOL_VERSION`, and a check that sitelink counts do not unfairly penalise non-Western figures. A 0 to 10 cap and percentile bands soften this.
3. **Is the draft now too hard for newcomers?** Without numbers, someone who does not know who Astor Piazzolla is gets only "composer who remade the tango". The identity line has to carry enough to judge. Open: test 20 boards with naive players, and if the Par failure rate is over 60%, make lines richer before adding any numbers.
4. **Rarity scoring** ("12% seated him here") only works with volume. It is display-only after 20 runs per day and never in the score, until traffic is roughly 10× today.
5. **Server-step reveals add latency** on bad mobile networks. The optimistic commit state hides about 300 ms. Edge-cached solution lookup per date keeps it fast. Needs measuring on 3G.
6. **Cheating** on a name-only board is still possible with scripted devices. Replay plus minimum duration plus a rate limit is proportionate for 1,000 visitors. Revisit if the board ever matters.
7. **Device-only streaks will be lost** on a cleared browser (the Wordle outrage). The owner banned login. Open question for the owner: is a non-login "carry code" acceptable, or is losing a streak the accepted price?
8. **SEO continuity:** `/games/country-draft` must keep its title, H1 and indexable rules prose while the scoring table disappears. Replace it with longer "how scoring works" prose plus yesterday's answers, which is fresh daily content. Watch the 28-day click share after launch.
9. **Shipping a scoring change mid-day** changes boards under people. Deploy just after 00:00 Berlin, with a new edition salt and a new `POOL_VERSION`.
10. **Open: does "choose the country" make the daily less shared?** Everyone sees the same 15 countries but takes different paths, so "which country did you open in round 1" becomes the conversation. That is a feature, as long as share text stays spoiler-free (it does).

Files referenced: `/Users/adamkahirov/Desktop/code/countrivo/src/games/country-draft/board.tsx`, `/Users/adamkahirov/Desktop/code/countrivo/src/games/country-draft/module.ts`, `/Users/adamkahirov/Desktop/code/countrivo/src/games/country-draft/run-detail.tsx`, `/Users/adamkahirov/Desktop/code/countrivo/src/lib/game-logic/country-draft/tables.ts`, `/Users/adamkahirov/Desktop/code/countrivo/src/ui/flag.tsx`, `/Users/adamkahirov/Desktop/code/countrivo/src/lib/share/country-draft.ts`, `/Users/adamkahirov/Desktop/code/countrivo/src/data/draft-pool.json`, `/Users/adamkahirov/Desktop/code/countrivo/src/data/figures.json`.