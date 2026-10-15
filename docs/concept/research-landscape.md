# Geo-trivia and daily-puzzle market scan for Countrivo (research, October 2026)

**How sure each fact is.** Facts marked **[P]** come from the game's own page or code bundle. **[S]** means press, a guide or Hacker News. **[M]** means my own knowledge that I could not re-check this session. I could not search Reddit, so player complaints come from Hacker News (HN) and press.

---

## 1. Game-by-game

### 195-0 World Draft (the cabinet-draft rival)
- **Mechanic [P]:** Five rounds. Each round pairs a country with a category ("Athletes of USA", "Icelandic poets"). You draft one person into one of five seats (President, VP, General, Propaganda Minister, Treasurer). Then a "Conquer the World" counter animates to a score out of 195 ("18-177 DIPLOMATIC DISASTER"). https://the-cabinet-beta.vercel.app/ , https://195-0.com/how-to-play
- **Information hiding [P]:** The draft modal shows only "Title · Category · Country". Points are never previewed and the role-fit calculation is hidden.
- **Its weak spot [P]:** The score is driven by *category*, not by the person. The site publishes a full lookup table: President takes Politicians 48 / Dictators 46. Every seat has a +10 category bonus. A Poet as General costs 16. Missing an authority figure costs 30. Three or more countries add 8. A random 0 to 14 chance bonus is added. Raw points convert as round((raw−25)×195/290). So knowing *who* the person is matters little, the strategy fits on one static page, and the "game" is solved by reading the Scoring guide. https://195-0.com/scoring
- **Daily vs unlimited [P]:**
  - Classic has unlimited plays and lets you respin the country or category *before* seeing candidates.
  - The Daily has five locked rounds, no respins, a UTC reset and an archive.
  - "Players can replay as often as they like; only their best verified result goes on today's Daily leaderboard." https://195-0.com/daily
- **Leaderboard without accounts [P]:** "Server-scored runs can be published under a short nickname." "The public board shows the score and time, but keeps every cabinet private." Only your best run is listed, and sharing and publishing are optional. The footer says "Free access · No account · No download". There is also an opt-in AI portrait "Avatar Maker" and a Weekly Challenge. https://www.195-0.cc/
- **Other notes:** The game is spread across many domains (195-0.com, .cc, 195-0game.com, the-cabinet-beta, netlify clones) and its identity is muddy. I found no press or Reddit proof that it went viral. https://weird-things.net/things/195-0/

### Worldle (Teuteuf)
- **Mechanic [P]:** Name a country from its silhouette in 6 guesses. https://worldle.teuteuf.fr/faq
- **Feedback [P]:** Each guess shows distance, one of 8 bearing arrows, and a proximity % (0 means the opposite side of the globe).
- **Share [P]:** Proximity rounds down to 10 and becomes 5 squares, e.g. 72% = 🟩🟩🟩🟨⬛. The grid is spoiler-free.
- **Bonus rounds [P][S]:** Solving opens a chain about *the same country*: Neighbours, then Capital, then Flag, then more trivia. The app adds languages, population, currency, cities and area. Each round is gated by the previous one (e.g. Capital needs at least 2 neighbours right). This chain is the clearest "discovery" device in the genre.
- **Curation rules [P]:** No country repeats within 100 days. Countries under 5,000 km² don't repeat within 7 days. Consecutive days don't come from the same continent (Africa, Asia).
- **Business model:** Practice mode with XP. The archive and cross-device stats need an account plus Premium. Ads.

### Globle
- **Mechanic [P][S]:** Guess any country with unlimited guesses. Each guess is painted on a 3D globe in a heat colour (pale/dark = far, deep red = close), and past guesses stay on the globe. https://sites.google.com/view/globlegame
- **Fun:** You build a mental map by triangulating, and there are no dead ends.
- **Complaints:**
  - The colour gradient is hard to read (colour-only feedback).
  - Unlimited guesses make it brute-forceable.
  - Typing every guess is tedious. HN: "I don't want to type the name of the country everytime". https://news.ycombinator.com/item?id=39272674
- **Share [M]:** Guess count plus streak, no grid.

### Travle (now Teuteuf)
- **Mechanic [P][S]:** Given a start and an end country, name the countries on the shortest land route. The counter shows "Guess (1/?)". https://travle.earth/
- **Hints [P]:** Three costed hints: next outline, all outlines, initials.
- **Modes [P]:** Daily, Weekly Challenge, Practice, regional Maps.
- **Feedback [S]:** Green moved you closer, orange was OK but not optimal, grey didn't help. https://www.capitalle.app/blog/how-to-play-travle
- **Score [S]:** "Perfect" means the fewest countries; "+1" means one extra.
- **HN reception** (https://news.ycombinator.com/item?id=38456692):
  - Praise: "Unlike the other wordle-like games, I feel like I'm actually learning something."
  - Complaints:
    - The rules were unclear; people thought guesses had to be in order.
    - Machine-translated versions were forced on them ("Polish translation has so many errors").
    - Users wanted more than one game a day.
    - It is easy to cheat with a map.
    - "Game trusts the local clock" (changing the device time unlocks old puzzles).
    - The restart option was hard to find.
  - **Developer note:** scoring runs client-side, and a "transfer code" stores compressed game data so progress moves between devices without an account.

### Tradle (OEC)
- **Mechanic [S]:** Guess the country from a treemap of its exports, with 6 guesses and distance/bearing feedback.
- **Discovery link [S]:** After you finish, "View on the OEC" opens the country's trade profile. A sub-national variant exists. https://automaton-media.com/en/news/20220311-10472/ , https://economicsnetwork.ac.uk/showcase/riano_games
- **Why it works:** The data *is* the clue, so geography becomes surprising facts ("they export *that*?").

### Flagle
- **Mechanic [S]:** Each guess reveals more flag tiles and gives distance/proximity for the previous guess. You get 6 attempts.
- **HN complaints** (https://news.ycombinator.com/item?id=30367906 cluster, Flagle thread):
  - It never showed the answer after a failed run.
  - The autocomplete didn't rank prefix matches first.
  - Players liked that it is "one per day, so you can't sit there and do a whole bunch in a row."

### Countryle
- **Mechanic [S]:** Guess a country. Each guess compares five attributes against the answer: hemisphere, continent, average temperature, population and coordinates. Higher/lower arrows and red/yellow/green markers show the result. https://selular.id/2022/07/gampang-cara-main-countryle-yang-ramai-di-twitter/
- **Lesson:** Attribute comparison teaches facts as a side effect, much like a Wordle for stats.

### GeoGrid (Teuteuf; read from its live bundle) [P]
- **Rules:** A 3×3 grid where each cell is a row category × column category (e.g. "landlocked" × "flag has red"). You get 10 guesses (an "infinite mode" is optional), and each country can be used once per board.
- **Scoring:** The score is the sum of each cell's rarity, where rarity is the % of all players who picked that country for that cell. An empty cell counts as 100, and *lower is better*.
- **Rarity tiers:** Common ≥25%, Uncommon ≥10%, Rare ≥5%, Epic ≥2%, Legendary ≥0.5%, Mythical <0.5%. Legendary and Mythical trigger confetti and sparkles.
- **No-account ranking:** Your rank comes from `rank/plays`, shown as a percentile ("better than X% today").
- **Wrong guesses:** A popup titled "Here is the relevant data we have on file for your guesses" explains each wrong pick with the actual row and column data.
- **Post-game answer lists:** Most Popular, Least Popular, All Answers, Your Wrong Guesses.
- **Achievements:** e.g. "Legendary Hunter", "Mythical Hunter".
- Sources: https://www.geogridgame.com/ (bundle `/js/app.e6faf290.js`)
- **Lineage:** This is the Immaculate Grid model (sports), where rarity was added to "encourage players to think of lesser known answers". https://en.wikipedia.org/wiki/Immaculate_Grid
- **A cousin, GeoRiddle:** scores rarity by population rank inside the valid set, so Iceland is low and Malta is high. https://georiddle.org/

### Statele / Pyramiddle / Earthle and other Worldle-likes
- **Statele [P]:** Worldle for US states (Teuteuf). https://statele.teuteuf.fr/about
- **Pyramiddle [S]:** Guess the country from its real population pyramid (2025-26).
- **Earthle [S]:** A close Worldle clone.
- **Pattern:** Take one real dataset, render it as the clue, and give distance feedback. https://pyramiddle.net/guides/daily-geography-games-like-wordle

### MapTap (the 2026 breakout) [S]
- **Mechanic:** 5 places a day, usually cities and sometimes a battle or historic event. You tap the spot on a globe without needing to know the name.
- **Scoring:** 0 to 100 points by distance, so a near miss earns almost full credit. Later rounds count ×2/×3, for a total out of 1000.
- **Daily thread:** All five places share one historical date.
- **Ending:** The day closes with short paragraphs on each place (e.g. Ibn Battuta).
- **Share:** A symbol strip per round plus the total score.
- **Business model:** Free. MapTap+ (about $3/mo) adds finer zoom, the archive, private groups and practice.
- **Origin:** A solo developer, John Donham. App Store rating 4.9.
- **Why it beats Worldle/Globle (press):** When stuck "you plant a pin and learn from how far off you were" instead of googling, so there is no dead end.
- **Complaint:** The map gets pixelated when zoomed in.
- Sources: https://techcrunch.com/2026/06/18/maptap-a-daily-geography-game-is-my-new-wordle , https://www.qiaeru.com/en/blog/2026/06/18/maptap-guessing-the-world-one-tap-at-a-time/ , https://news.ycombinator.com/item?id=48051223

### Wherio / Whenere / TimeGuessr / EraGuessr / EarthGuessr (2025-26 history-geo crossover) [S]
- **Wherio:** Place 5 historical events on a country map. Neighbouring countries earn partial credit, and the reveal explains each answer. No account. https://wherio.app/guides/daily-geography-games/
- **TimeGuessr:** 5 photos, scored on place and year (5,000 + 5,000 per photo). Daily plus custom shareable 5-photo games. 4.8 rating from 2.4K Google Play reviews. https://www.pcworld.com/article/3233865/geoguessr-fans-should-try-this-addictive-history-game.html

### GeoGuessr (incl. Daily Challenge and Duels)
- **Mechanic [S][M]:** Street View, place a pin, up to 5,000 points per round, 25,000 per game.
- **Daily Challenge [S]:** Free but needs an account. It shows the participant count, the top 5 and your streak. It resets at UTC midnight.
- **Duels [P, dev post 2021]:** Both players start with 6,000 HP, and the farther guess loses HP. The damage multiplier ramps ×2, ×3, ×4 and so on. A "health round" was added for comebacks. https://lr.eu.psf.lt/r/geoguessr/comments/qwop2o/duels_live_now
- **Friction [S]:**
  - The free mode was killed in February 2024.
  - The Steam Edition launched in May 2025 to about 84% negative reviews over its subscription model.
  - Pro costs about $47.88 a year.
  - Sources: https://maponica.com/blog/is-geoguessr-free , https://en.wikipedia.org/wiki/GeoGuessr
- **No native share:** There is no built-in share text, so the community built the GGShare add-on. https://addons.mozilla.org/sl/firefox/addon/ggshare/

### Seterra (owned by GeoGuessr since 2022)
- **Mechanic [S][M]:** A drill library of 400+ quizzes in pin, type and place modes, timed. A score % plus time is the speedrun currency (there is a speedrun.com community).
- **Feedback [M]:** In pin mode the target is revealed after repeated misses, and its colour codes how many attempts you needed.
- **Reception [S]:** Seen as "classroom-like": great for memorising, weak on discovery.
- **Business model [S]:** The web is free, mobile has ads, and ad-free costs $1.99/mo.

### Sporcle geography [P]
- **Format:** "Countries of the World": type 197 answers in 15 minutes. It has 45.9M plays.
- **Results:** You Got / Avg Score / Avg Friend Score plus a stats page. Give Up reveals everything. Practice mode is untimed.
- **Accounts:** Scoreboards, badges and challenges need a free account. https://www.sporcle.com/games/g/world
- **Lesson:** Scale and SEO through a huge long tail of quizzes. Comparing against the crowd average is the core motivation.

### Geotastic [S]
- **Mechanic:** Street View plus flag and country-battle modes, with daily and community tournaments.
- **Accounts:** Only the lobby creator needs an account; guests join with no account.
- **Funding:** Donationware. Reviews disagree about ads and creeping sign-up demands. https://www.alternativeto.net/software/geotastic/about/

### Wordle / NYT Games
- **Origin [S]:**
  - The one-puzzle-a-day limit was taken from Spelling Bee.
  - The emoji grid was invented by players (NZ) and then built in.
  - Wardle deliberately left the link out ("trashy"); the mystery grid drives curiosity.
  - "Three minutes a day… it doesn't want any more of your time."
  - https://en.wikipedia.org/wiki/Wordle
- **Device-only stats are fragile [S]:** Stats lived only on the device, and the NYT migration wiped some streaks, which caused public anger. https://www.tomsguide.com/uk/news/wordle-disaster-some-players-lose-their-streaks-in-transfer-to-nyt
- **Answer leak [S]:** The full answer list sat in plaintext in the JS, and "wordlinator" tools spoiled future days. https://tagteam.harvard.edu/hub_feeds/3415/feed_items/3436854
- **WordleBot [S]:** A post-game coach with skill 0-99, luck 0-99 and steps versus the day's average. It explains *why* a move was good and turns a result into learning. https://www.mentalfloss.com/posts/wordlebot-wordle-companion
- **Connections [S]:** Difficulty colours run yellow, green, blue, purple. The share grid replays the *order* of attempts, so the struggle is visible without spoilers. "One away" is a deliberately calibrated partial leak. Red herrings are hand-placed.
- **Strands [S][M]:** Every 3 non-theme words *earn* a hint. The share shows hints used as 💡, so help is honest and visible.
- **Pips [S]:** Domino logic launched August 2025 with Easy/Medium/Hard daily tiers. It flags a broken rule immediately and has a tutorial. https://www.tomsguide.com/gaming/nyts-new-game-pips-is-already-addictive-heres-how-to-play
- **Friends leaderboard [S]:** Added in April 2025 for Wordle, Connections, Spelling Bee and the Mini, with an account. https://geardiary.com/2025/05/01/new-york-times-games-app/

### LinkedIn Games (Queens, Zip, Pinpoint, Crossclimb) [S]
- **Social layer:** After play you see which of your connections played today, and results feed school and company leaderboards. Tribe-based comparison drives return. https://contentmarketinginstitute.com/strategy-planning/linkedin-gaming-strategy
- **Pinpoint:** Clues reveal one at a time, and fewer clues means a better score.

---

## 2. Cross-cutting findings

### 2a. How games leak the answer through the UI
| Leak | Example | Fix |
|---|---|---|
| Showing an option's score before you commit | Countrivo Country Draft preview (Napoleon shows highest for The Field) | Value is revealed only *after* commit. Before that, show only identity facts. |
| Scoring is a public lookup table | 195-0 publishes its category weights, so who the person is barely matters | Score from the person's real record. Publish *principles*, not numbers. |
| Answers shipped in the client | Wordle answer list in the JS | The server holds today's solution and validates each move. Never put the answer array in the first-HTML payload or a cookie. |
| Client clock trusted | Travle | Daily key from the server's Europe/Berlin clock (Countrivo already does this). |
| Autocomplete limited to valid answers | Common in clones [M] | Autocomplete always over all 243 countries. |
| Disabled or greyed options, sort order, animation length, tooltips that differ by correctness | General [M] | Every option renders identically until commit. Randomise order with the seed. |
| No reveal after failure (the reverse problem) | Flagle (HN) | Always show the answer and the "why" at the end. |
| Unlimited guesses make hot/cold brute-forceable | Globle | Cap guesses or let efficiency drive the score. |

### 2b. How good games make knowledge matter
- **Hidden value, then a revealed explanation:** 195-0 hides role fit; GeoGrid explains wrong picks with data.
- **Rarity rewards deep knowledge:** GeoGrid and Immaculate Grid. Anyone picks Napoleon, but knowing a lesser-known fit is worth more.
- **Continuous partial credit:** MapTap, Wherio, Worldle proximity. A near miss still teaches and scores.
- **Hints have a visible cost:** Travle 0/3, Strands 💡, Pinpoint clue count.
- **Escalation and comebacks:** MapTap ×2/×3, GeoGuessr Duels multipliers. The last rounds always matter.

### 2c. How geography becomes discovery
- Worldle's bonus chain turns one answer into a 5-fact dossier.
- MapTap ties the day's places to one historical date and closes with paragraphs about each.
- Tradle links "View on the OEC".
- GeoGrid's "Least Popular answers" list leaves players thinking "wait, Bhutan fits?".
- Wherio explains each event after the reveal.
- Countryle, Pyramiddle and Tradle turn a dataset into the clue itself.

The pattern: **commit, reveal, then one surprising fact tied to the player's own pick.**

### 2d. Leaderboards without accounts (all observed patterns)
1. **Nickname on a server-scored run, best result only, private details:** 195-0.
2. **Percentile against everyone who played today, with no identity at all:** GeoGrid rank/plays, Sporcle Avg Score, WordleBot vs. the average.
3. **Group chat as the leaderboard:** Wordle and Connections share grids. Wordle shows this needs no backend.
4. **Tribe boards:** LinkedIn connections, school and company; MapTap+ private groups; Geotastic guest lobbies. A Countrivo version without accounts is a "group code" created from a share link.
5. **Device continuity without login:** Travle's transfer code. This answers the risk that Wordle-style device-only streaks get lost.

### 2e. What annoys players (recurring)
- **Paywalls and forced accounts:** GeoGuessr's Steam review-bomb; Worldle's archive behind Premium.
- **Dead ends:** Worldle and Globle when you're stuck (MapTap press).
- **Colour-only feedback:** Globle.
- **Typing fatigue:** Globle.
- **Bad autocomplete:** Flagle.
- **Unclear rules:** Travle.
- **Forced machine translations:** Travle.
- **Too little play per day:** Travle, and the trade-off Flagle players accept.
- **Missing answer reveal:** Flagle.
- **Lost streaks:** Wordle.
- **Low-res maps on zoom:** MapTap.
- **Domain confusion and clones:** 195-0.

---

## 3. 22 transferable principles for Countrivo

1. **Value is revealed only after commit.** Before a pick, show *who/what* (name, photo, one-line role), never points, ranks or bars. After the pick, show the full breakdown. *(Countrivo's own leak vs. 195-0's hidden role fit.)*
2. **Score real knowledge, not a published table.** Score from each figure's real career, not a static category grid anyone can read. The rules page explains principles ("generals score in The Field") but never numbers. *(195-0 scoring page.)*
3. **Give choice over *what*, hide the *answer*.** Let the player choose which country or cell to tackle, or in what order. 195-0 Classic lets you respin country and category *before* seeing candidates; GeoGrid lets you pick the cell. This addresses the owner's "couldn't choose the country" point without leaking value. *(195-0, GeoGrid.)*
4. **Reward rare correct knowledge.** Add a rarity bonus or a separate rarity score ("only 3% seated Toussaint Louverture here"). The obvious pick is safe; the insider pick is glory. *(GeoGrid tiers, Immaculate Grid.)*
5. **Every miss teaches.** Each wrong or weak pick shows the data that made it weak. *(GeoGrid "data we have on file", WordleBot.)*
6. **Continuous partial credit, no dead ends.** Use distance and closeness scores so beginners always score something. *(MapTap, Wherio, Worldle proximity.)*
7. **Escalate within the daily.** Later rounds are worth more or are harder, so comebacks stay possible. *(MapTap ×2/×3, GeoGuessr Duels.)*
8. **End on one "wow" fact tied to the player's own picks.** Close the run with 1 to 3 facts in a few lines each, not a wall of text. *(MapTap paragraphs, Tradle→OEC, Wherio.)*
9. **Bonus chain on today's answer.** In GeoWordle, solving unlocks short follow-ups on the same country (neighbours, capital, flag). This deepens the session without a second daily. *(Worldle bonus rounds.)*
10. **A daily thread or theme.** One link across a day's boards ("all five countries border the Sahara"), revealed at the end. *(MapTap shared date, Connections categories.)*
11. **One shot counts, practice is unlimited, kept strictly apart.** A daily that allows unlimited replays with best-score-counts (195-0) cheapens it; one shot keeps it meaningful. *(Wordle, Worldle practice, HN demand for more play.)*
12. **A spoiler-free share that tells the *journey*.** Encode the order or quality of moves, not answers. No link inside the grid, but the site name is in the text. *(Wordle, Connections order, Strands 💡, Worldle squares, GeoGrid rarity emojis.)* Countrivo's no-emoji rule already allows emoji in the clipboard-only share text.
13. **Honest, costed hints that show in the share.** *(Strands, Travle 0/3, Pinpoint.)*
14. **Calibrated near-miss feedback.** "One away"-style messages for near misses only, deliberately designed and never accidental. *(Connections.)*
15. **Always reveal the answer and the why at the end, including on failure.** *(Flagle complaint.)*
16. **Curate the daily rotation with rules.** For example: no microstate two days running, no country repeat within N days, no same-continent streak. *(Worldle FAQ; the "Kiribati costs me points" joke.)*
17. **The server is the source of truth.** No answers in client JS or HTML, no trusting the client clock, server-side replay before storing. *(Wordle leak, Travle clock.)* Countrivo already does server replay; audit the first-HTML board payload and the `cv_p_` cookie for anything that encodes solutions.
18. **The no-account leaderboard is three layers:**
    - (a) A percentile against everyone today, shown right away with no identity (GeoGrid).
    - (b) "Put me on the board" takes a nickname on a server-validated *first daily run* only, with a profanity filter and one entry per device token per day (195-0).
    - (c) Group boards through a share-link group code (LinkedIn, MapTap+ groups).
19. **Continuity without login.** Keep a device token plus an optional "carry code" or QR to move streak and history to another device. *(Travle transfer code; the Wordle streak-loss outrage.)*
20. **Tap-first input on mobile.** Prefix-ranked autocomplete over *all* countries, map taps where they make sense, minimal typing. *(Globle and Flagle complaints, MapTap's tap.)*
21. **Feedback never relies on colour alone.** Pair colour with a number, shape or arrow. *(Globle gradient.)* This also fits Countrivo's one-accent palette.
22. **Free archive, no paywall, one canonical domain.** The archive is free and SEO-indexable. GeoGuessr's backlash, Worldle's Premium archive and 195-0's scattered domains each show the cost of getting this wrong. *(GeoGuessr, Worldle, 195-0.)*

---

## 4. What this means for Country Draft
1. **Answers principles 1-3:**
   - Before a pick, cards show name, portrait, nationality and one neutral identity line (e.g. "Emperor, 1804-1815"), with *no* per-seat numbers.
   - The seat bottom sheet lists only the jobs, never per-person fit.
   - After seating, the card flips to show points earned and why.
   - Country choice: each round, offer 2 or 3 countries, or let the player pick 5 from a hand at the start, then the people. This gives agency without leaking value.
2. **Rarity layer (principle 4):** Show "% of today's players who seated this person here" on the result. This makes the Napoleon pick feel obvious and rewards insider picks.
3. **Beating 195-0:** Where 195-0 has a solvable category table, server-only scoring, best-of-unlimited dailies and scattered domains, Countrivo should use person-specific knowledge, one honest shot a day, explanations after the reveal and one canonical URL.