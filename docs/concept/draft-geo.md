# Countrivo: the geographer's proposal

**Thesis.** Countrivo should be the place where people find out that the world is stranger than they thought, one small "wait, really?" at a time. Each game should end on a true fact about the country or person the player just chose. Each fact needs a number, a year and a source. A daily game with no lesson in it is just a coin toss with flags.

Every number below marked "(repo)" was computed this session from `src/data/*.json`. Items marked [M] come from my own knowledge and need checking before they ship.

---

## 1. Diagnosis: what a first-time visitor runs into today

1. **Country Draft tests nothing about the world.**
   - Each card prints an archetype label such as "Sovereign · standing 5", and every archetype maps 1:1 to a seat, so the label gives the answer away.
   - Selecting a person then shows fit points on all five seats, which is the Napoleon problem the owner described.
   - "Standing" is just the person's position in an authored list, not real fame.
   - All that remains is a knapsack puzzle over visible numbers. A visitor who knows nothing about Napoleon scores exactly as well as a historian.
2. **The player never chooses a country**, even though the game is called *Country* Draft. The five countries sit on a plan line from the first second and are picked by the generator.
3. **The site's facts are buried.** Countrivo holds 21 sourced stats for 243 entities, 950 figures and a border graph. A visitor sees none of it after playing. Results show scores, not the world. The most surprising fact in the repo ("Czechia drinks 184 litres of beer per person a year, 1.7 times Austria", Kirin 2022, repo) appears nowhere a player would meet it.
4. **Geography shows up as distance numbers, not places.**
   - GeoWordle measures centre to centre. A guess of Kazakhstan for Russia reads as thousands of km away although the two share the world's second-longest land border [M].
   - The first guess comes with no clue at all.
   - Taiwan, Hong Kong, Macau, Western Sahara, Kosovo and Åland cannot even be typed as guesses, so a player who types "Taiwan" thinks the game is broken.
5. **Some "countries" are silently not countries.**
   - Flag Quiz draws from all 243 entities. A first-timer gets Sint Maarten or Wallis and Futuna in a "countries" quiz and feels cheated.
   - Elsewhere the site says 195, and nowhere explains which 195. In the data that is 193 UN members plus the Holy See and Palestine (repo: `sovereign.json` has 195 and includes VAT and PSE).
6. **Misleading facts are waiting to surface.** The repo's top lists would produce embarrassing "facts" if surfaced raw:
   - DR Congo 96.3% and Somalia 95.4% top renewables. That is firewood and charcoal, not wind farms.
   - Qatar (0.13%) and Niger (0.41%) have the lowest unemployment. That reflects migrant-labour statistics and informal work.
   - Afghanistan has −4.6% inflation, the bottom of that list.
   - Ireland ranks #25 in GDP with only #121 in population, which is inflated by multinational accounting.

   Nothing in the product guards against these.
7. **The people pool is Euro-heavy and thin elsewhere** (repo): 396 of 950 figures (42%) are European and only 29 come from Oceania. 110 countries have any figures, and only 27 have ten or more. An Indian or Nigerian visitor sees their country through 2 to 4 people, if at all.
8. **The SEO pages are filler.** Country pages are ranked tables, at position 25 to 80 with zero clicks. `/lists/countries-in-africa` gets 859 impressions at position 83 because it is a list, not a destination. Nothing on it is worth linking to.
9. **Empty boards and login cues make the site look dead.** Every board says "No shots yet today", the CTA is "Shoot", and the header shows Friends and You. To a first-timer the site looks abandoned and asks for an account.
10. **Difficulty is random.**
    - Higher or Lower pairs are uniform random, so pair 1 can be Tuvalu vs Nauru on FDI.
    - Flag Quiz distractors come from a whole continent, so Chad is never offered against Romania. That pair is the one comparison that teaches something.

---

## 2. Principles

1. **Commit, reveal, then one true surprise.** Every decision ends with the value plus one fact tied to *that* pick. The reveal is the reward, so it must carry the learning.
2. **Knowledge beats reading.** No score, rank, fit or bar is visible before commit. If the screen holds the answer, the player learns to read the screen, not the world.
3. **Choose the *where*, hide the *what*.** Players pick countries, routes and cells, but never see their value. This gives agency, which the owner asked for, without a leak.
4. **Every number has a year and a source within one tap.** Readers only trust a surprising fact if it is checkable. "Suriname 94.5% forest (World Bank 2021)" travels; "Suriname is very green" does not.
5. **Never surface a misleading true number.** A fact can be technically correct and still teach the wrong thing (firewood renewables, Ireland's GDP), so a caveat table vets each stat before it can become a fact.
6. **Partial credit is geography.** "Wrong, but you were 300 km off" teaches the map, while all-or-nothing scoring teaches nothing.
7. **Neighbours are 0 km.** Distance is measured between borders, not centres, because that matches how people understand "close".
8. **Countries first, territories labelled.** Daily answer pools use the 195 sovereign states only. Territories are always guessable and visibly marked, never a trap.
9. **Neutral naming, one consistent policy.** Use the name the country uses in English today (Czechia, Eswatini, Timor-Leste), and give disputed places a factual label, not a political one.
10. **Curated rotation, not random draws.** No repeats within a window, no same-continent streaks, and difficulty climbs inside each run. A good day is designed; a random one punishes people.
11. **Every country deserves a moment.** Facts and figures cover all continents in proportion. A player from Bangladesh should find Bangladesh interesting here.
12. **Real people, real faces, no fake likeness.** Never draw a real person in clay or with an AI model. Use Wikimedia photos with credit, or a neutral nameplate when no photo exists.
13. **Tie stats to the player's own world.** "Kazakhstan is 7.6 times the size of Germany" uses the visitor's country from the request geo header, with no login and nothing stored. A comparison to the player's own country lands harder than "about the size of Western Europe".
14. **Always show the answer on failure.** A lost GeoWordle ends with the country, its outline and the fact you were missing.

---

## 3. The game catalog

| Game | Verdict | Daily? |
|---|---|---|
| Country Draft | **Change deeply** (choose country, hidden fit, whole-life scoring, reach bonus) | yes, flagship |
| GeoWordle | **Change** (border distance, clue ladder, bonus chain) | yes |
| Higher or Lower | **Change** (themed ladder with a difficulty curve, 12 steps) | yes |
| Stat Guesser → **How Many** | **Change** (log ruler instead of typing, symmetric scoring) | yes |
| Flag Quiz | **Change** (lookalike distractors, flag families) | yes |
| Border Run | **Add** (A to B through neighbours) | yes |
| Blind Pick | **Move to practice**, URL kept | no |
| Speed Flags | **Keep as practice**, fix distractors | no |
| Name Them All (per continent) | **Add**, practice and SEO | no |
| Pin It (tap the capital on the map) | **Add in phase 2** | yes, replacing one if the strip gets crowded |

The daily strip holds six cards. Seven or more and the "one card per screen" idea turns into a chore list.

### Country Draft (flagship, `/games/country-draft`)
- **Rules.**
  - Five rounds. Each round you first pick one of three offered countries, then seat one of that country's three people in one of five jobs.
  - People score on their whole real-life record, not their headline job. A footballer who became president is a president.
  - The five countries you pick also paint a conquest map, and the reach across continents adds a bonus.
- **What the player decides.** Which of three countries to open, shown as flag, outline, name and continent (people hidden). Which person to take. Which job to give them.
- **Hidden until commit.**
  - All points.
  - Every fit word.
  - The other two people's values, which are revealed only on the result as "What you passed on".
  - The jobs sheet lists the five jobs with a one-line description each and **no numbers**.
- **Feedback moment.**
  - The seat plops into the cabinet strip.
  - The card flips to show the points and one *why* line about the person's real record. Example: "George Weah, The Chair: 25. He was President of Liberia from 2018 to 2024." [M]
  - The country fills on the map.
- **Scoring.**
  - Job fit comes from each person's authored record (a server-only table).
  - Plus standing, from a real fame proxy (section 5.7).
  - Plus the reach bonus: 3 continents +5, 4 +10, 5 +15. This one is visible, because choosing far-apart countries is a geography decision, not a leak.
  - Normalised to 195.
  - Rarity line on the result: "7% of today's players seated Weah in The Chair."
- **Share line.** `Countrivo Country Draft 14 Oct · 158/195 · G G Y G W · reached 4 continents`. Each square is one seat in a fixed seat order: G natural, Y plausible, W thin. No names, no countries.

### GeoWordle (`/games/geo-wordle`)
- **Rules.** Six guesses at a hidden sovereign country. Each guess returns border-to-border distance, a bearing and a proximity %, and neighbours show "0 km, shares a border".
- **What the player decides.** Which country to guess next, using any of the 243 entities, with prefix-ranked autocomplete.
- **Hidden until commit.** The answer, its outline and the clue ladder. Clue 1 unlocks after guess 2 (hemisphere and continent count of neighbours), clue 2 after guess 4 (population band and a 2023 year tag).
- **Feedback moment.**
  - Each row slides in with the distance counted up and a direction arrow, so meaning never rests on colour alone.
  - On a solve, a three-step bonus chain on the same country follows:
    - Neighbours: tap the bordering ones from 8 tiles.
    - Capital: 4 options, with multiple correct answers accepted (Bolivia: Sucre or La Paz).
    - Flag: 4 lookalikes.
- **Scoring.** Guesses used (1 to 6, X for a loss) plus a separate bonus score of 0 to 3.
- **Share line.** `Countrivo GeoWordle 14 Oct · 3/6 · Y O G · bonus 2/3`.

### Higher or Lower (`/games/higher-or-lower`)
- **Rules.** Twelve steps along one daily theme (for example "Islands", "The Andes", "Coffee and beer"). The winner of each pair stays and a new country arrives; call higher or lower and one wrong call ends the run.
- **What the player decides.** Higher or lower on a single stat with its unit shown.
- **Hidden until commit.** The challenger's value, served by the server one step at a time and never shipped in the board payload.
- **Feedback moment.**
  - The challenger's value counts up with unit and year.
  - A one-line contrast follows: "Bangladesh: #8 in population, #133 in tourist arrivals" (WB/UNWTO 2022, repo).
- **Scoring.**
  - Score is the streak, 0 to 12, and 12 is a perfect day. Pairs start about 5x apart and close to about 1.15x by step 12, and pairs under a 3% gap are excluded.
  - Both values in a pair must share a source year.
- **Share line.** `Countrivo Higher or Lower 14 Oct · Islands · 9/12`.

### How Many (rebuilt Stat Guesser, `/games/stat-guesser`, URL kept)
- **Rules.**
  - Five rounds, each a country with a stat. You drag a pin along a log-scale ruler on which two reference countries are already pinned. One of them is the visitor's own country when it has data.
  - No typing of "84,500,000".
- **What the player decides.** The order of magnitude, then the fine position.
- **Hidden until commit.** The value.
- **Feedback moment.** The true value drops onto the ruler, and three neighbours of that country appear on the same ruler for context: "and Kenya is here".
- **Scoring.**
  - 0 to 200 per round from |log10(guess/actual)|: within 10% scores 200, a factor of 2 about 100, a factor of 10 scores 0.
  - The error is symmetric, which fixes today's "guessing low is safer" asymmetry.
- **Share line.** `Countrivo How Many 14 Oct · 712/1000 · G G Y O G`.

### Flag Quiz (`/games/flag-quiz`)
- **Rules.** Ten flags of sovereign states, easy to hard, four names each. The distractors are the real lookalikes.
- **What the player decides.** Which name.
- **Hidden until commit.** Correctness. All four options render identically in seeded order.
- **Feedback moment.** The right flag gets a one-line "family" note, for example:
  - "Nordic cross: the off-centre cross started with Denmark's Dannebrog." [M]
  - "Pan-African colours, taken from Ethiopia's flag." [M]
  - Chad vs Romania: "near-identical; Chad's blue is darker." [M]
- **Scoring.** x/10, with flags 8 to 10 counting double (a 13-point maximum). This creates a late-game comeback.
- **Share line.** `Countrivo Flag Quiz 14 Oct · 11/13 · G G G G Y G G O G G`.

### Border Run (new, `/games/border-run`)
- **Rules.**
  - Start in one country and reach another by crossing land borders, in as few crossings as possible.
  - At each step you see only your current country's neighbours as flag-and-name tiles, with no map. Backtracking is allowed and costs a step.
- **What the player decides.** Which neighbour to step into. Knowing where the target lies is the whole game.
- **Hidden until commit.** The map and the optimal route.
- **Feedback moment.**
  - Each step adds one country to a growing chain.
  - At the end the map draws your route against the shortest one, followed by one fact. Example: "The longest shortest land route on Earth runs from Lesotho to Timor-Leste in 18 crossings" (repo, BFS over `borders.json`, needs re-check after the territory clean-up).
- **Scoring.** Crossings over par (par = shortest path). Daily pairs are 3 to 6 crossings apart.
- **Share line.** `Countrivo Border Run 14 Oct · Spain to Poland · 4 (par 4)`.

### Blind Pick (practice only, `/games/blind-pick` stays indexable)
- **Rules.** Six countries arrive one by one. Place each on the stat where it ranks highest, without seeing the next country.
- **What changes.**
  - The score reads as "% of the best possible" instead of "sum of ranks".
  - It gets shorter: 6 stats instead of 8.

### Speed Flags (practice)
- **Rules.** Twenty seconds, two options per flag. The distractor now comes from the same subregion, which is what the code comment already promised.

### Name Them All (practice, SEO)
- **Rules.** Type every country of a continent. The map fills as you go, it is untimed by default, and "give up" reveals the rest.
- **Why.** "countries in africa" style queries already bring impressions. This turns `/lists/countries-in-africa` into a page worth linking to, with the quiz on it.

### Pin It (phase 2)
- **Rules.** Five capitals or places a day. Tap the spot on a world map, scored 0 to 200 by distance, with rounds 4 and 5 counting double.
- **What it needs.**
  - Capital coordinates, a cheap public-domain source (Natural Earth populated places).
  - A self-rendered SVG world map. A geo projection library would be a new dependency and needs the owner's approval.

---

## 4. Every pane of the site

"S" means a sheet or overlay; P/D is the phone/desktop note.

### Shell
| Pane | Job |
|---|---|
| Header with the today strip | Six clay game tokens show today's state (unplayed, in progress, done with score) and jump to that card. P: horizontal scroll strip. D: centred row. |
| Footer | Sources and methods, credits, privacy, terms and support, with one line on which 195 count. |
| Midnight rollover | Shown when a tab is left open past 00:00 Berlin. It says "New boards are out" and replaces the cards in place, without a reload loop. |

### Home `/`
| Pane | Job |
|---|---|
| Card stack, unplayed | One big card per game, the next card peeking, and a Play button on each. P: vertical swipe. D: centre column at about 560 px with the peek below, never a grid. |
| Card, in progress | Same card, now reading "Round 3 of 5" with a Resume action. |
| Card, done | Shows the score, the percentile ("better than 64% today"), the share action and the countdown to the next board. |
| All done | The **Today's atlas** card puts every country you met today on one small map, with one fact and a "come back tomorrow" countdown. |
| Practice row | Sits below the dailies: practice versions plus Blind Pick, Speed Flags and Name Them All. |

### Game landing `/games/[slug]` (SEO)
| Pane | Job |
|---|---|
| Landing hero card | The game in one sentence, a Play button and today's percentile line. If fewer than 20 runs have been stored, show nothing rather than "no shots". |
| How to play | Three lines plus a principles paragraph. For Country Draft it says "people are scored on their whole life" and **never shows tables**. |
| What you can learn | Three real example facts from past boards. |
| FAQ | FAQ JSON-LD stays; the indexable text stays. |
| Archive link | Past boards, free and playable as practice. |

### Play `/games/[slug]/play`
| Pane | Job |
|---|---|
| First-visit rules sheet (S) | Three lines and one illustrated example, dismissed once (stored per device). |
| Board | The live game. P: board fills the screen, actions sit in thumb reach. D: same column, wider tiles, keyboard keys shown only on hover-capable devices. |
| Reveal state | The commit animation, the value and the one-line why. |
| Fact card | One sourced fact (≤ 20 words, number, year, source on tap). |
| Source sheet (S) | Dataset, year, link and caveat. |
| Result | Score, band, per-round breakdown, "what you passed on" (draft), the answer on failure, rarity and percentile. |
| Put me on the leaderboard (S) | Name field and a home-country crest (defaults to the geo-IP country, changeable), then submit. Shown only for the first daily run on this device. |
| Name rejected / taken state | Inline message with a suggestion. |
| On the board state | "You're #23 of 311 today" with your row highlighted. |
| Share sheet (S) | The text share line with a copy action and the native share. |
| Already played | The daily is locked on this device; show your result and switch to Practice. |
| Practice banner | "Practice board, nothing counts", with a New board action. |
| Bonus chain (GeoWordle) | Three short steps after a solve. |

### Country Draft specific
| Pane | Job |
|---|---|
| Country choice | Three countries shown as flag, outline, name and continent. The reach meter shows continents covered so far. |
| People | Three cards with photo or nameplate, name, lifetime years and one neutral headline line. |
| Person detail (S) | The longer identity text (headline job, birthplace, era). It never mentions the other careers, which hold the knowledge edge. |
| Jobs sheet (S) | Five jobs with a one-line description each, open ones active, no numbers. |
| Cabinet strip | Five seats along the top, filling as you play. |
| Seat reveal | The card flips: points, why line, rarity. |
| Undo | One take-back per run, available before the next country is chosen. |
| Conquest map result | The map fills outward from your five countries, with real totals: "Your homelands hold 1.9 billion people and 11% of the land". |
| What you passed on | The other two people per round with their points and why lines. This is where most of the learning happens. |
| Best cabinet | The best cabinet possible from your five countries. |

### Leaderboard `/leaderboard`
| Pane | Job |
|---|---|
| Today per game | Top 50 with name, crest, score and time; your row pinned if you joined. |
| Countries today | Average score per home crest with at least 10 players, for example "Brazil 142, Germany 131". A tribe board without accounts. |
| Yesterday | Final boards with the answers revealed. |
| Empty state | "Boards fill as people play"; never say "be the first". |

### Archive `/games/[slug]/archive`
| Pane | Job |
|---|---|
| Calendar list | Past boards by date with each day's theme; tap to play as practice. |

### Geography pages
| Pane | Job |
|---|---|
| `/countries` | A world map index plus search, grouped by continent. Territories sit in a labelled section. |
| `/countries/[slug]` | A **country dossier**: one hero fact, a strip of where it ranks, neighbours with contrasts, people from here, its flag family, and "play with this country" practice boards. |
| `/categories` and `/categories/[slug]` | The full ranked stat with the source, the year, the caveat and the surprising positions. |
| `/lists` and `/lists/[slug]` | Editorial lists that each answer a question ("Which countries border the most others? The honest count"). |
| `/lists/countries-in-{continent}` | The list, the map and the embedded Name Them All quiz. |
| `/sources` (new) | Which 195 count, the naming policy, every dataset with year and licence, and the caveats. |
| Credits / privacy / terms / support | Unchanged in job; credits list portrait licences. |
| 404 | A wrong-turn page with one random fact and links to today's games. |
| Error / global error / offline | A plain message and a retry. Offline (app) shows the last cached board state. |

### Removed
These go: auth sheet, forgot/reset password, friends, profile, challenges and duels, the streak UI tied to an account, and push opt-in.

**Admin reroll** needs a non-login gate: a server-side secret URL token or Vercel protection, never a user account.

---

## 5. Geography content and facts (my deep part)

### 5.1 Which places count
- **Sovereign set (195)** = 193 UN members + the Holy See (Vatican City) + Palestine. This is the set behind "195", daily answers, Country Draft and the conquest map. The `/sources` page says it in one sentence.
- **Other entities (48 in the data)** are labelled by type:
  - "partially recognised": Taiwan, Kosovo
  - "disputed territory": Western Sahara
  - "special administrative region of China": Hong Kong, Macau
  - "territory of X": Greenland, Puerto Rico, Réunion and others
- **Treatment of other entities.**
  - They are always typeable as guesses: Taiwan, Kosovo and Western Sahara need centroids or polygons, and Taiwan's tile reads "not today's answer pool" if guessed.
  - They are never daily answers.
  - They are allowed in practice "hard" pools.
- **Disputed facts carry a factual label.**
  - Capitals:
    - Israel: show "Jerusalem (status disputed internationally)".
    - Palestine: Ramallah is in the data. Use "Ramallah (seat of government); East Jerusalem (claimed)".
  - Neither is ever a quiz answer or a distractor.
  - The same rule applies to Western Sahara's El Aaiún.
- **Multiple capitals are accepted answers, never traps.**

  | Country | Accept |
  |---|---|
  | Bolivia | Sucre, La Paz |
  | South Africa | Pretoria, Cape Town, Bloemfontein |
  | Netherlands | Amsterdam (The Hague holds the government) |
  | Ivory Coast | Yamoussoukro, Abidjan |
  | Benin | Porto-Novo, Cotonou |
  | Sri Lanka | Sri Jayawardenepura Kotte, Colombo |
  | Malaysia | Kuala Lumpur, Putrajaya |
  | Switzerland | Bern ("federal city") |
  | Nauru | Yaren (no official capital) |
  | Equatorial Guinea | Ciudad de la Paz and Malabo [M]: check the current status of the capital move |

  The repo stores one capital per country, so it needs a `capitalsAccepted[]` field.
- **Naming.**
  - Use the country's own current English short name: Czechia, Eswatini, North Macedonia, Timor-Leste, Myanmar.
  - Two current data names need a decision:
    - Turkey: the UN has used "Türkiye" since 2022. Recommend the display name "Türkiye", with Turkey as a search alias.
    - Ivory Coast: the government prefers "Côte d'Ivoire". Recommend that display name, with Ivory Coast as an alias.
  - Autocomplete must match aliases (Holland, Burma, Swaziland, Czech Republic, Cape Verde/Cabo Verde, East Timor, Turkey).
  - Show both Congos as "DR Congo" and "Republic of the Congo"; never "Congo" alone.

### 5.2 Data audit: concrete problems in the repo today
| Problem | Evidence (repo) | Fix |
|---|---|---|
| Border counts include territories | China lists 16 neighbours (incl. HKG, MAC); the honest sovereign count is 14, tying Russia's 14 | Store `bordersSovereign[]` next to `borders[]`; "most neighbours" facts use the sovereign list and say so |
| Overseas borders split off | France lists 8 neighbours; France also borders Brazil and Suriname via French Guiana and the Netherlands via Saint Martin [M] | Add a curated "via overseas territory" note; Border Run uses the listed entities and says "land borders of the listed entities" |
| Centre-to-centre distance | GeoWordle uses `centroids.json` | Border-to-border distance from Natural Earth admin-0 1:50m polygons (public domain), precomputed into a 243 × 243 matrix (about 30k numbers, computed once by a script) |
| Missing centroids | ALA, HKG, MAC, TWN, ESH, UNK | Add them from Natural Earth, so all are guessable |
| 29 sovereign states have no outline | Includes Malta, Singapore, Maldives, Bahrain, all of the Pacific microstates (repo) | Generate outlines from Natural Earth 1:10m for small islands; for an archipelago show an inset dot cluster |
| Renewables top list | DR Congo 96.3%, Somalia 95.4%, Liberia 92.8% (WB 2021) | Caveat flag "mostly traditional biomass (wood, charcoal)"; never use in "greenest" lists without it. The existing `greenest` list needs this |
| Unemployment extremes | Qatar 0.13%, Cambodia 0.26%, Niger 0.41% (WB 2023) | Caveat "ILO modelled; informal work and migrant contracts make low numbers misleading"; exclude from Higher or Lower |
| GDP distorted by multinationals | Ireland GDP #25 vs population #121 | Caveat flag; never a "surprising wealth" fact for IRL or LUX without explanation |
| Inflation outliers | Lebanon 221%, Afghanistan −4.6% (WB 2023) | Keep for facts, with the year; exclude from How Many (a log scale cannot hold negatives) |
| Sparse consumption stats | Beer 70 entities, coffee 59, wine 55 | Only "among countries with data" phrasing; never "world's lowest" |
| Taiwan has 2 stats | Population and area only | Fine, but do not let it into stat games |
| Rounded tourism values | France exactly 100,000,000 (2022) | Show it as "about 100 million" |
| "Standing" is list order | `draft-pool.json` standing 5..1 | Replace with a fame proxy (5.7) |
| Figure pool skewed | Europe 396, Americas 222, Asia 187, Africa 116, Oceania 29 | Rebalance (5.7) |
| Portrait gap | 571 photos for 950 figures | Restrict daily Country Draft to people with a photo, or use a neutral clay nameplate object, never a generated likeness |

### 5.3 Cheap data to add (all free or open licence)
- **Natural Earth admin-0 and populated places** (public domain): polygons, border-to-border distances, coastline flag (landlocked), capital coordinates for Pin It, outlines for the 29 missing states.
- **Wikidata:**
  - Per figure: birth and death years, birthplace coordinates, positions held (P39), awards, and number of Wikipedia language editions.
  - Per country: highest point, time zones, official languages, currency.
  - Under CC0.
- **Wikimedia pageviews API:** 12-month views per country and per figure, the recognition and fame proxy.
- **UN World Population Prospects 2024:** cross-check population, plus median age, a great comparative stat [M].
- **OEC or UN Comtrade top export per country:** an optional "they export *that*?" fact type (Tradle shows this lands). The licence needs checking.

All of it flows through scripts into JSON into the loader, never by hand-editing, consistent with the repo rules.

### 5.4 The fact engine
One module, `src/lib/facts/`, pure and server-side, returns facts for a context (a country, a pair, a person, or a seat plus a person). Each fact has `{text ≤ 20 words, numbers[], source, year, caveatId?, kind, sensitivity}`.

**Fact kinds** (each with a real example from the repo data):
1. **Extreme.** "South Korea has the world's lowest fertility rate among countries: 0.72 children per woman (WB 2022)." Hong Kong (0.75) and Macau (0.59) are lower but are territories. *That footnote is the honesty rule in action.*
2. **Rank contrast within one country.**
   - "Burundi: #78 in population, #175 in GDP (WB 2023)."
   - "Kyrgyzstan: #58 for internet use, #170 for income per person (WB 2022/2023)."
3. **Border contrast.**
   - "Cross from Algeria into Mali and life expectancy drops by 15.8 years (76.3 vs 60.4, WB 2022)."
   - "Chile and Bolivia: 12.6 years apart across one border."
4. **Share of the world.** "India and China together hold more than a third of humanity (2.85 billion, WB 2023)." Also: "India overtook China in 2023."
5. **Personal comparison** (geo-IP, nothing stored). "Kazakhstan is 7.6 times the size of Germany." The fallback reference is the country the player just guessed.
6. **Consumption surprise.**
   - "Czechia: 184 litres of beer per person a year (Kirin 2022)."
   - "Finland: 12 kg of coffee per person, the most of any country with data (ICO 2022)."
7. **People.** "Five of the eight people you met today came from countries with fewer than 10 million people."
8. **Route** (Border Run). "From Lesotho to Timor-Leste is the longest land route in our map: 18 crossings" (repo).
9. **Second career** (Country Draft, authored). "Ignacy Paderewski, concert pianist, was Prime Minister of Poland in 1919." [M]

**Selection rules.**
- Pick the fact with the highest "surprise score": rank gap, ratio, or z-score against the continent.
- No kind repeats twice in a session.
- A fact is never shown about something the player has not yet committed to.

**Guardrails.**
- **Sensitive-pair blocklist** for auto-generated contrasts: pairs in active conflict or occupation, where a GDP or life-expectancy gap reads as politics, not geography. The repo's top two border gaps are both in this class: Israel–Syria (52,004 vs 1,052 USD per person) and Israel–Palestine (18 years of life expectancy). Also Armenia–Azerbaijan, Russia–Ukraine, the two Koreas (only with a factual frame), Sudan–South Sudan and Ethiopia–Eritrea.
- **No ranking of people's worth.** Facts about people are about their record, never "the most evil" or "the best".
- **Caveat flags** (from 5.2) attach automatically. A fact with a caveat must show it inline or be dropped.
- **Year agreement.** Never compare two values from different years in one sentence.

**Editorial layer.** One hand-written "wow" fact per sovereign state (195 lines, each with a source URL), written once and reviewed by a second person. These anchor country pages and the GeoWordle solve. Examples [M, verify]:
- Liechtenstein and Uzbekistan are the only doubly landlocked countries.
- France spans 12 time zones with its territories, more than any other country.
- Brazil borders every South American country except Chile and Ecuador.

### 5.5 Which fact appears at each reveal
| Game | Moment | Fact source |
|---|---|---|
| Country Draft | After each seat | Why line from the person's record (second career if one exists) |
| Country Draft | Result | Homelands totals (population, area, continents) plus the best "passed on" second career |
| GeoWordle | Each guess | None, to keep the pace |
| GeoWordle | Solve or fail | The country's editorial wow fact plus its outline |
| Higher or Lower | Each reveal | Rank contrast for the challenger |
| How Many | Each reveal | Three neighbours on the same ruler |
| Flag Quiz | Each answer | Flag-family line (about 12 families authored once: Nordic cross, Pan-African, Pan-Arab, Pan-Slavic, Gran Colombia, Union Jack canton, Southern Cross, crescent and star, Central American bands, the tricolour lineage, the "lookalike pairs" set, and unique shapes: Nepal and Ohio-style pennants [M]) |
| Border Run | End | Route fact plus the shortest route drawn |
| All done | Today's atlas | One fact linking two countries the player met today |

### 5.6 Difficulty and rotation
**Recognition tiers** from 12-month English Wikipedia pageviews over the 195 states:
- **A:** top 50 (France, Japan, Brazil…)
- **B:** 51 to 120
- **C:** 121 to 195 (Comoros, Palau, Eswatini…)

The pageviews are recomputed quarterly by a script.

| Game | Curve |
|---|---|
| GeoWordle | Mon–Thu tier A/B, Fri–Sun B/C. No answer repeats within 120 days, no same continent on consecutive days, and at most one state under 5,000 km² per 7 days. |
| Country Draft | Round 1 offers three tier-A countries; by round 5 at least one tier-C country is offered (with tier-C people pools, see 5.7). |
| Flag Quiz | Flags 1–3 tier A with far distractors, 4–7 same subregion, 8–10 the true lookalike pairs (Chad/Romania, Indonesia/Monaco, Ireland/Ivory Coast, Slovenia/Slovakia/Russia, Australia/New Zealand, Norway/Iceland, Senegal/Mali [M]). |
| Higher or Lower | The value ratio falls from about 5x to about 1.15x over 12 steps; tier C is allowed only after step 6. |
| How Many | Round 1 is population for a tier-A country; round 5 is an odd stat (tourism, forest) for tier B/C. |
| Border Run | Mon par 3 inside one continent; Sun par 6 crossing continents through the Sinai or the Bosporus [M]. |

**Regional fairness check.** A script reports each month's spread of answers by continent and fails the build if any continent goes above 40% or below 10% over 30 days.

### 5.7 Rebuilding the Country Draft people pool (the knowledge edge)
The owner's complaint generalises: **the screen must not contain the decision.** So the knowledge has to live in the player's head, and the richest knowledge to test is that famous people often had a second life.

- **Data model per figure.**
  - `headline`: the public-famous role, which is the only thing shown before commit. For Weah: "footballer, Ballon d'Or 1995".
  - `record[]`: the full life, each item `{job, strength 1–3, evidence, years, source}`. For Weah: Voice 2 (global footballer), Chair 3 (President of Liberia 2018–2024).
  - `fame`: number of Wikipedia language editions, banded 1–5. This is the real standing and replaces list order.
  - `born`, `died`, `birthplaceLatLng` from Wikidata.
- **Scoring principle (publishable, numbers not published).** "Each person is scored on the best thing they ever did in that job, plus how widely they are known."
- **Crossover quota.** Each daily board includes at least two people whose best job differs from their headline. Candidates [M, verify each]:
  - George Weah (football → president)
  - Volodymyr Zelensky (comedian → president)
  - Václav Havel (playwright → president)
  - Imran Khan (cricket → prime minister)
  - Ignacy Paderewski (pianist → prime minister)
  - Ronald Reagan and Arnold Schwarzenegger (actors → office)
  - Pelé (football → Brazil's minister for sport, 1995–98)
  - Hedy Lamarr (actress → frequency-hopping patent, The Desk)
  - Brian May (guitarist → PhD in astrophysics, The Desk)
  - Josephine Baker (performer → Resistance agent, The Field)
  - Vigdís Finnbogadóttir (theatre director → president of Iceland)
  - Winston Churchill (also Nobel in Literature, The Voice)
- **Rebalance targets** before launch:
  - every continent at least 15% of the daily-eligible pool
  - at least 60 countries with 6 or more eligible people
  - about 30% women

  Today 110 countries have any figures and 39 have six or more (repo). Wikidata queries per country ("positions held" plus "notable for", sorted by language editions) make this a few days of curation, not months.
- **Dead and living.** Living people only in Voice, Desk and Purse-type records. Jokes about a living politician running an army are a tone risk on a game about conquering the world.
- **Identity line rule.** The headline states the famous role in plain words and never uses a job title from the five seats ("general" is fine as history, "The Field" is not). It is never rewritten to hint at the hidden career.

### 5.8 SEO pages that are worth landing on
- **Country dossier `/countries/[slug]`, top to bottom:**
  1. The hero fact (the editorial wow line).
  2. A personal comparison ("7.6 times Germany").
  3. A strip of where it ranks across all 21 stats, with only the top-3 and bottom-3 positions called out.
  4. Neighbours with one contrast each (sovereign borders, honest count).
  5. People from here, with photos and credits.
  6. Its flag family.
  7. "Play this country": practice boards seeded around it, with the country as a guess context, never as the answer of its own page.

  The title pattern changes from "Argentina facts and stats" to a question the page answers ("Argentina: how big, how rich, who's from there").
- **Lists answer questions:**
  - "Which countries border the most others? (Honest count: China and Russia, 14 each)"
  - "The biggest gaps across a single border" (sensitive pairs excluded, method stated)
  - "Countries drinking the most beer, coffee and wine"
  - "Doubly landlocked countries"
  - "Countries with more than one capital"
  - "The longest land routes"
- **Continent lists plus Name Them All.** `/lists/countries-in-africa` becomes the definitive page: 54 countries (the repo's 58 includes Mayotte, Réunion, Saint Helena and Western Sahara, which are labelled), a map, capitals, population, and the embedded quiz.
- **Category pages** add the caveat paragraph and a "surprising positions" block. This is where the honesty rules become a ranking advantage.
- **`/sources`.** One page for "which 195", naming, datasets and caveats. It is linked from every fact's source sheet.

### 5.9 Clay objects with geographic meaning (input for the designer)
- **A white clay globe with grey continents** as the brand hero (the strongest existing asset).
  - A stop-motion set of four states: Americas, Africa/Europe, Asia, Pacific facing the camera.
  - **Anti-leak rule.** On GeoWordle the globe never turns to the answer's side before the solve. Before the solve it shows a neutral pose; after the solve it turns to the answer's region.
- **Flags in two-tone clay** (dark grey plus white split), never plain white (which reads as surrender).
- **Border Run:** a grey clay stone wall with a gap pressed into it, the gap touching the main mass so the cutout keeps it.
- **How Many:** a clay ruler with three pins pressed in.
- **Higher or Lower:** two stacked blocks, the arrow moulded *into* the front face so the cutout keeps it.
- **GeoWordle:** a classic teardrop pin with a hole, in dark grey.
- **Country Draft:** a round table seen from a high angle, with five chairs touching the table.
- **Green only on the trophy and the money seat, brick orange only on errors**, per the pipeline rules.
- **No clay people, ever** (principle 12).

---

## 6. Risks and open questions

1. **Anti-leak needs server stepping.** Hidden values only stay hidden if the server serves each reveal one step at a time; today every daily board ships its answers. This is the game designer's call, but the fact engine assumes it.
2. **Fact errors are reputational.** One wrong "wow" fact posted to Reddit costs more than ten good ones earn. Proposal: every editorial fact has a source URL and a second reviewer, and auto facts only use stats that pass the caveat table. Do we have the owner's time for a 195-line review?
3. **Crossover facts need careful sourcing.** Every [M] item in 5.7 must be checked against Wikidata or a primary source before it becomes scoring.
4. **Geo-IP comparisons.** Using `x-vercel-ip-country` is stateless and needs no consent, but VPN users get odd comparisons. It needs a fallback and a "compared with" label. Confirm it is fine under the privacy page.
5. **Political naming.** Türkiye/Turkey, Côte d'Ivoire/Ivory Coast, Jerusalem, Kosovo and Taiwan: the policy in 5.1 is neutral, but the owner should sign it off once and the policy should be published on `/sources`.
6. **Polygons and the bundle.** Border-to-border distances are a precomputed matrix (small). A Pin It map needs SVG paths at about 200–400 KB for 1:50m, so it should load only on that route. A projection library would be a new dependency and needs approval.
7. **Strip size.** Six dailies is my maximum. If Pin It ships, one of Higher or Lower and How Many should merge or move to practice. Which one do the owner's play numbers favour?
8. **Blind Pick to practice.** Its URL keeps a landing page, but no daily may cost its few players. Check `play_finish` counts first.
9. **People pool rebalancing is real curation work.** Wikidata does the bulk, but the 2–3 line headlines and records need a human editor. Who signs off on living people?
10. **The "195" promise.** Country Draft's conquest map and the brand rest on 195. If the owner prefers "UN 193", the copy, maps and SEO title change together, never half-way.
11. **Data freshness.** World Bank years range from 2021 to 2023 today. Refresh annually (a cron script), and show the year everywhere so stale never looks wrong.