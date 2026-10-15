# Countrivo redesign: the lead designer's proposal

*This proposal comes from the product and motion design discipline. It covers the whole product so the three proposals can be compared section by section. It builds on owner direction C-b: one game per screen as a big card, the next card peeking, a strip of today's games on top, clay stop-motion imagery, a cabinet strip in Country Draft and the jobs in a bottom sheet.*

**Sources I checked:**
- **Tokens:** `src/styles/tokens.css`.
- **Earlier drafts:** Figma file `ZKNzvFolKFKjU2EVzWpCBY`. Only the page "Entwurf" still exists, with frames 01 to 05. The pages "Varianten" and "C ausgearbeitet" are not in the file any more.
- **Clay assets:** the clay contact sheet in the scratchpad.

---

## 1. Diagnosis: what a first-time visitor meets today

I traced a typical visitor: they arrive from Google on `/games/country-draft`, half the time on a phone, and have never heard of Countrivo.

1. **The game is one click away from the page they landed on.**
   - The landing is a document that talks about a game: anchor card, a board, then long editorial text. The board itself sits behind "Shoot" at `/play`.
   - On a phone the first screen is mostly explanation. On desktop it is a two-column split where the playable thing is not the biggest thing.
2. **"Shoot" means nothing.** The verb, the "shots" noun and the "doesn't count" practice label are all house jargon. The visitor has to decode the vocabulary before they play.
3. **The page looks abandoned.** "No shots yet today. Be the first." appears on every row, and the top-3 board is empty. With 11 stored runs in 28 days, the most visible social signal on the site is a ghost town.
4. **The account system is visible but useless.** Friends, You and Ranks sit in the nav. "Sign in to see your shot" and "sign in to keep your streak" ask for a commitment before the visitor has had any fun, and the owner has now ruled accounts out completely.
5. **Country Draft shows the answer before the question.** In Figma frame 03 every seat prints "+28 strong fit / +16 thin fit / +10 wrong fit" for the selected person. Every person card prints the archetype word ("Firebrand"), which maps one to one onto a seat. The decision becomes "tap the biggest number". The person's photo and name, the only interesting content, are decoration.
6. **Country Draft has no agency at the country level.** The five countries are dealt and listed on a "Today:" line. The player plans nothing and chooses nothing about the world, in a game that claims to be about conquering it.
7. **The UI is built for a keyboard user that half the audience is not.** Hints like "1 to 3 take · 1 to 5 seat · Esc drop · U take back" are printed under the board on phones. The keyboard hint is fused into the fit number ("natural 251").
8. **There is no image of the world anywhere.** The product is about 243 countries, but the first screen is type and grey rows. The only pictures are flags at 20 px and some Wikimedia portraits, and 379 of 950 figures fall back to a letter tile.
9. **The finish has no pull forward.** After a result there is a "More dailies" list but no next card already in hand, no "tomorrow" object and no reason to come back that you can *see*.
10. **There are two daily/practice switches that fight.** A pill toggle on home writes a `cv_mode` cookie, and a header label inside play says something different. The player cannot tell from the UI whether this run counts.
11. **The long tail is high-friction on phones.** Stat Guesser asks you to type "84,500,000" on a decimal pad. Blind Pick takes 3 to 5 minutes and is scored in "sum of ranks", which nobody can read.

**The core design failure:** the site is organised as a *publication about games* (rows, lists, tables), not as a *place where a game is on the table and you pick it up*. Direction C fixes that only if the card *is* the game and not a link to it.

---

## 2. Principles

1. **The game is the first thing on every game URL.** Within 0.3 s of landing, the thumb is on a playable control. *Rationale:* 83% of clicks land on one URL; every pixel above the first move is lost players.
2. **One card, one game, one decision at a time.** Each screen asks exactly one question with one primary control. *Rationale:* first-time visitors fail on choice overload, not on difficulty.
3. **Value is hidden until commit, then shown in full.** Before a choice, show identity (who, what, where). After the choice, show worth (points, rank, why). Every option renders identically until commit. *Rationale:* this is the owner's Napoleon rule, made general and visual.
4. **Every commit gets a stop-motion beat.** A commit always lands with a 4 to 8 frame clay or numeral event at 12 fps on twos. *Rationale:* the reveal is the fun; it deserves a physical moment.
5. **Results move on twos, interface moves smoothly.** Navigation and sheets use 220 ms continuous easing. Anything that *is* an outcome (score, verdict, reveal, rank) steps at 12 fps. *Rationale:* one motion grammar that ties the clay world to the UI and makes outcomes feel hand-made.
6. **Clay is identity, line icons are controls.** Clay objects name games, jobs and outcomes. The 2 px house icons operate things. They are never mixed in one role. *Rationale:* stops clay becoming wallpaper and stops line icons becoming the brand.
7. **Grey world, two meanings of colour.** The clay and UI base is white, light grey, dark grey and ink. Ember (and its clay twin, brick-orange) means wrong, live or "you". Moss green appears *only in clay* and means won or money. Nothing else carries hue except flags. *Rationale:* flags are the most colourful objects on the site and must stay the only loud colour.
8. **No empty states that look abandoned.** Never print "no one yet". Show what is true and non-zero: the plays count, your percentile, yesterday's best. *Rationale:* honest numbers beat an empty table.
9. **Touch is the default, keyboard is a bonus.** Key hints render only under `(hover:hover) and (pointer:fine)`. Every target is at least 44 px, and the primary control sits in the bottom 40% on phones. *Rationale:* 50% of users are on phones, and they currently get desktop crumbs.
10. **No typing unless the answer is a name.** Use sliders, taps, maps and options. Text input exists only for country search (prefix-ranked over all 243) and the leaderboard name. *Rationale:* typing numbers is the single biggest mobile friction in the catalog.
11. **First paint is the final layout.** State 1 of every clay object is a still in the server HTML. Animation only ever *adds*. *Rationale:* this is a project non-negotiable, and it protects against invisible-content bugs.
12. **The end of one game is the start of the next.** The result pane always has the next card peeking at the same edge. One swipe or one tap continues. *Rationale:* the deck model only pays off if finishing deals the next card.
13. **Daily and practice are places, not a toggle.** Today is the deck; Practice is a separate tab with a visibly different card (card tone instead of paper, a "Practice" stamp in clay). *Rationale:* the "does this count?" doubt disappears when the room is different.
14. **The name is the whole identity.** After a daily you see "Put me on the leaderboard". It opens one field, prefilled from the last time on this device, with an auto-detected flag you can change. There are no accounts and no profile. *Rationale:* owner rule; one field converts, a form does not.
15. **Every miss teaches one fact.** A wrong or weak commit always reveals one short, specific line about the real answer. *Rationale:* turns losing into the discovery the product promises.

---

## 3. The game catalog

I propose **six daily cards** on the Today shelf, in this order, and **two practice-only games**. Practice can also replay any daily game with random boards, and nothing in Practice counts.

| # | Game | Status | Why |
|---|---|---|---|
| 1 | **Country Draft** | Keep, rebuilt | Flagship, 83% of clicks. Fix the leak, add country choice. |
| 2 | **GeoWordle** | Keep, changed | Second traffic page. Fix the blind first guess and the big-country distance. |
| 3 | **Pinpoint** | **Add** | A tap-on-the-map game is the best fit for phones and for discovery (MapTap's success). It uses existing centroids plus one new public-domain map. |
| 4 | **Higher or Lower** | Keep, changed | A curated difficulty ladder instead of random pairs. |
| 5 | **Flag Ten** (was Flag Quiz) | Keep, changed | Harder, fair distractors and a fact per flag. The `/games/flag-quiz` URL stays. |
| 6 | **Blind Pick** | Keep, shortened | Good tension mechanic. Cut to 6 countries and score as % of perfect. |
| P | **Speed Flags** | Practice, changed | Three options from the same subregion, 30 s. |
| P | **Ballpark** (was Stat Guesser) | Move to practice | The typed number is replaced by a log slider. It leaves the daily shelf because six is the most that fits a 390 px shelf without crowding. The `/games/stat-guesser` URL serves this practice game. |

### 3.1 Country Draft (daily, flagship)

- **Rules:** Five rounds. Each round you are dealt three countries and choose one. That country then offers three of its people; you take one and seat them in one of five jobs: Chair, Field, Purse, Voice and Desk. Your cabinet scores up to 195 by how well each person's real record fits the job you gave them.
- **What the player decides:**
  - which of three countries (by flag and name)
  - which of three people
  - which open job
  - Three real decisions per round, fifteen per run.
- **Hidden until commit:**
  - The person's archetype, the fit for every seat, the points, the "standing" (fame) and today's pick rarity.
  - Before commit the person card shows only: portrait (or a clay bust stand-in, see 5.6), name, life years, and one neutral identity line written as a *role and deed*, not a category. For example: "Emperor of the French, 1804-1815", "Footballer, 1998 World Cup winner", "President since 2017". Knowing that Napoleon won battles is now *knowledge you bring*, not a number we print.
  - The job sheet lists the five jobs with a one-line description each. The descriptions are identical for every person and never show per-person fit.
  - The three country cards render identically. You never see which country offers the strongest people.
- **Feedback moment:**
  - The job sheet closes and the person's portrait flies (220 ms, smooth) into that seat on the cabinet strip.
  - Then, on twos, the clay seat object "plops" (2 frames squash, 2 frames settle).
  - The seat's points tick up in Erode numerals at 12 fps, and one line appears under the strip: "+29 The Field. Won 60 of 70 pitched battles." A weak fit shows "+6 The Purse. Never ran a treasury; his campaigns ran France into debt."
  - The verdict word is in ink for good fits and ember for poor ones, always with the number, never colour alone.
- **Scoring:**
  - The server holds the authored fit matrix per *person* (not per archetype), so knowing the person is what scores.
  - Per seat: fit 0 to 30 plus fame 0 to 5.
  - Cabinet bonuses at the end (full cabinet, right hand) total up to 20.
  - The rules page publishes principles ("generals score in The Field, treasurers in The Purse, famous people score a little more everywhere"), never tables. The current `draft-tables.tsx` public FIT table is removed.
  - Rarity ("12% of today's players seated Napoleon in The Field") is shown on the result as glory, **not** added to the score while volume is under about 500 runs a day. Otherwise early players get noisy points.
- **Share line** (clipboard only, emoji allowed there):
  `Countrivo Country Draft, 12 Oct: 158 of 195, Most of the map` followed by five squares in seat order (natural, plausible, thin, as three square colours), then `countrivo.com`.

### 3.2 GeoWordle (daily)

- **Rules:** Find the hidden country in six guesses. Each guess returns the distance from your country's nearest border to the answer's nearest border, a bearing arrow and a closeness %.
- **What the player decides:** which country to guess next. Input is a prefix-ranked search over all 243 entities, plus tapping a country on the guess map.
- **Hidden until commit:** the answer. Clues unlock one per wrong guess on a fixed ladder: continent, then size class, then neighbour count, then flag colours, then capital initial. This fixes the blind first guess without giving it away. There is a free starter clue: hemisphere.
- **Feedback moment:**
  - The guessed country fills on the mini-map in a grey tone set by closeness.
  - A bearing arrow draws from it.
  - The distance ticks down on twos.
  - Each band has both a word and a numeral ("1,240 km, hot") because colour alone is not allowed.
  - On solve, the clay magnifier-and-pin object drops its pin into the country.
- **Bonus chain after solve (optional, not scored):**
  - Two mini-cards: "Name a neighbour" and "Pick its capital from 4".
  - Each adds a star to the share line.
- **Scoring:** guesses used 1 to 6, or X. Board tiebreak: fewer clues opened.
- **Share line:** `Countrivo GeoWordle, 12 Oct: 3/6` followed by one row of closeness squares per guess, plus a star per bonus solved.

### 3.3 Pinpoint (new daily)

- **Rules:** Five countries are named, one at a time. Tap where each one is on a blank world map. You score by how close your tap is to the country, and the last round counts double.
- **What the player decides:** a point on the map. They can pinch-zoom and drag on phones, and use the wheel or a click on desktop.
- **Hidden until commit:** everything. The map has no borders and no labels before the tap, only coastlines.
- **Feedback moment:**
  - The clay pin drops into the tap point (4 frames).
  - The true country fills in ink.
  - A rounded dashed line draws from the pin to its nearest border (smooth, 400 ms).
  - The km count ticks up on twos.
  - One fact line follows, e.g. "Bhutan: the only country that is carbon negative."
- **Scoring:**
  - A tap inside the country scores 200.
  - Outside it, the score decays with distance to the nearest border: 0 at 2,500 km or more, on a curve.
  - Round 5 is ×2, so the maximum is 1,200 points.
  - Daily rotation follows curation rules: one microstate at most, at least three continents, no country repeated within 60 days.
- **Share line:** `Countrivo Pinpoint, 12 Oct: 914 of 1200` followed by five squares by distance band.

### 3.4 Higher or Lower (daily)

- **Rules:** One stat per day, a ladder of 12 pairs. Call whether the right country is higher or lower than the left one; one wrong call ends the run.
- **What the player decides:** higher or lower, by tapping the top half or the bottom half of the right card.
- **Hidden until commit:** the right value. Pairs get closer in value as you climb: rung 1 has a 10× gap, rung 12 a gap under 10%.
- **Feedback moment:** the right value ticks to its number on twos. On a correct call the right card slides to become the next left card (smooth, 260 ms). On a wrong call the clay tower of blocks tips over (brick-orange top block, 6 frames).
- **Scoring:** rungs climbed, 0 to 12. Clearing all 12 gets the green clay trophy.
- **Share line:** `Countrivo Higher or Lower, 12 Oct: 9 of 12 on GDP per head` followed by a row of 9 squares and one cross square.

### 3.5 Flag Ten (daily)

- **Rules:** Ten flags, four names each. The wrong options are always similar: same subregion or same colour pattern.
- **What the player decides:** one of four names.
- **Hidden until commit:** the correct index, which is validated on the server per tap. It never ships in the payload.
- **Feedback moment:** the chosen option fills ink (right) or ember (wrong). The correct one gets the house check icon. The flag does a 2-frame "flutter" step, and one fact appears ("Chad and Romania: almost the same blue").
- **Scoring:** correct answers out of 10. The board tiebreak is total time, shown only on the result and never as a running timer.
- **Share line:** `Countrivo Flag Ten, 12 Oct: 8 of 10` followed by ten squares.

### 3.6 Blind Pick (daily)

- **Rules:** Six countries arrive one at a time and six stats wait. Place each country on the stat where you think it ranks best in the world, without seeing who comes next.
- **What the player decides:** which open stat slot.
- **Hidden until commit:** the country's ranks.
- **Feedback moment:** the slot flips to show the world rank, ticking on twos ("#4 of 193 in forest cover"). The next country card slides in from the deck.
- **Scoring:** the player's sum of ranks against the optimal assignment's, expressed as **% of perfect (0 to 100)**. The result shows "your line" and "the perfect line" side by side.
- **Share line:** `Countrivo Blind Pick, 12 Oct: 87% of perfect` followed by six squares (optimal slot or not).

### 3.7 Practice-only games

- **Speed Flags:**
  - 30 s.
  - Three names from the same subregion.
  - Score is the number correct.
  - The clock is a clay hourglass whose sand step-drains in 6 states.
- **Ballpark:**
  - Five numbers to guess on a log slider anchored by a reference country.
  - Score is 100 minus the symmetric log error.

---

## 4. Every pane of the site

The **"Phone / Desktop"** notes describe how each pane changes between breakpoints.
- **Phone** is 390 px (360 to 767).
- **Tablet** is 768 to 1023, using the phone layout centred at 560.
- **Desktop** is 1024 and up, designed at 1440.

### A. Global frame
| ID | Pane | Job | Phone / Desktop |
|---|---|---|---|
| A1 | Header | Wordmark, the flame plus "New boards in 7h 12m", and the Board link | Phone: 56 px, wordmark left, flame-countdown right. Desktop: 72 px, centred nav cluster (Today, Practice, Board, Countries) contained in one card-tone bar of radius 12 |
| A2 | Bottom tab bar | Today, Practice, Board, Countries | Phone only, white bar, 4 house icons with labels and the active seed dot. Desktop has none |
| A3 | Footer | Credits, privacy, terms, support, the sound toggle and a short "about" line | Under all SEO text. Desktop uses a 4-column grid aligned to the content columns |
| A4 | Toast | "Copied", "You're on the board", "Name taken today, try another" | Bottom-centre above the tab bar, on ink, 2.4 s, no motion beyond a 6 px rise |
| A5 | Scrim plus sheet container | Hosts every bottom sheet | Phone: bottom sheet with drag handle and a 40% scrim. Desktop: the same content as a right-side panel of 420 px, or anchored to the card |

### B. Today (home, `/`)
| ID | Pane | Job |
|---|---|---|
| B1 | **Today shelf** | Six clay objects in a row, each with a short title and state below (Play / score / in progress). Tap jumps the deck to that card. It is the progress bar of the day |
| B2 | **Deck: unplayed card** | Big card: clay object standing on the card's plinth notch, title, one-line promise, three-step rules, time estimate, "Played 214 times today", and the ink **Play** button overlapping the bottom edge |
| B3 | Deck: in-progress card | The same card showing the live state in miniature (e.g. the cabinet strip with 2 of 5 seated) and **Continue** |
| B4 | Deck: done card | Score in Erode at display size, your percentile, the clay object in its "done" state and **See result** |
| B5 | Deck: peeking next card | The edge of the next card, tappable, with its clay object visible. It is a real target, not decoration |
| B6 | Day complete card | Appears in place of the deck when all six are done. Shows the six objects with scores, your **Day total** (each game normalised to 100, out of 600), the countdown and "Practice while you wait" |
| B7 | First-visit coach (inline) | On the very first card only, a one-line hint under the deck, "Swipe for the next game", that disappears after the first swipe. It is not a modal |
| B8 | Below the deck | Yesterday's answers (row link), today's board top 5 for the focused card, and a short indexable intro paragraph |

**Desktop B:**
- The shelf sits centred above the stage.
- The active card is 680 wide. The next card peeks on the right at 88% scale.
- A right rail of 320 px shows the focused card's top 5 and your Day total. It sits beside the deck, never above it.

### C. Game landing (`/games/[slug]`, the SEO URL)
| ID | Pane | Job |
|---|---|---|
| C1 | Landing hero = the card | The same card as B2 for that game, with its real Play. The H1 is the game title on the card |
| C2 | Today's top 5 plus plays count | Proof the game is alive. "Played 214 times today. Best: 181" |
| C3 | How it works | Principles, three short steps, one image row of clay objects (for Country Draft: the five jobs). No scoring tables |
| C4 | FAQ | Indexable text plus JSON-LD. Keeps the current copy that ranks |
| C5 | Other games strip | The shelf again, without state, linking to the other landings |

### D. Play surfaces (`/games/[slug]/play`, one route)
| ID | Pane | Job |
|---|---|---|
| D1 | Play header | Back chevron, game title, round pips (stepped fill), score on the right, and the "Practice" stamp in practice runs |
| D2 | Card-to-board morph | A View Transition expands the card into the board. The clay object shrinks into the header slot |
| D3 | Rules peek (sheet) | A "How to play" sheet from the header "?" icon, with the same three steps as the card. Never auto-opened |
| D4 | Leave-run sheet | "Your run is saved on this device. Come back any time today." Shown only on back-swipe mid-run |
| **Country Draft** | | |
| D5 | Cabinet strip | Five clay seat objects across the top; seated ones carry the person's portrait crest and points |
| D6 | Country hand | Three country cards (big flag, name, region), dealt with a 3-step stop-motion deal. Choose one |
| D7 | People trio | Three person cards: portrait, name, years, identity line. Tap a card to select it; tap again or tap **Give a job** |
| D8 | Person detail sheet | Long-press or the "i" icon: a 3-line bio of facts only, never seat words or numbers |
| D9 | Job sheet | Five open jobs with clay objects and job lines, filled seats greyed with their occupant, and **Seat [Name]** after a job is chosen. One undo per run sits in this sheet |
| D10 | Seat reveal | Plop, ticking points and one why-line. 1.4 s, then the next country hand deals; a tap anywhere skips |
| D11 | Final tally | Seat-by-seat tick-up, then the bonuses ("Full cabinet +8") each as their own beat, then the total |
| D12 | Conquest map | The world fills outward from your five countries in great-circle order, stepping on twos, band word last ("Most of the map") |
| **GeoWordle** | | |
| D13 | Guess map plus clue ladder | Mini world map with guessed countries, the clue rail with locked and unlocked clues, and the guess list |
| D14 | Country search | The input pinned above the keyboard, prefix-ranked suggestions with flags, all 243 |
| D15 | Bonus chain cards | Neighbour, then capital, after a solve |
| **Pinpoint** | | |
| D16 | Map stage | Full-bleed coastline map, the country name on an ink chip at the top and a **Drop pin** confirm button (tap places, confirm commits) |
| D17 | Round reveal | Pin, fill, distance line, points and the fact |
| **Higher or Lower** | | |
| D18 | Pair stage | Left card (value shown) above the right card (value hidden), with Higher and Lower halves and the rung counter |
| **Flag Ten** | | |
| D19 | Flag stage | Flag at 2:3 up to 320 px, four option rows, a 1-of-10 pip strip |
| **Blind Pick** | | |
| D20 | Arrival stage | Incoming country card with six stat slots under it (two columns of three on phones, one row of six on desktop) |
| **Practice** | | |
| D21 | Speed Flags stage | Hourglass, flag, three options |
| D22 | Ballpark stage | Reference anchor, log slider with snapping, **Lock it** |

### E. Result (same URL, after done)
| ID | Pane | Job |
|---|---|---|
| E1 | **Result card** | Score at display size, band word, percentile ("Better than 71% of today's players"), and the clay object's outcome state (green trophy for a top band, toppled tower for a bust) |
| E2 | The why | Per-move breakdown: Country Draft seat list with points and why-lines; GeoWordle guess list; Pinpoint five distances. Includes "The best line today" and your line |
| E3 | Rarity row (Country Draft) | "Your rarest pick: Toussaint Louverture in The Field, 3% of players" |
| E4 | One fact to keep | One fact tied to the player's own picks, with a link to that country page |
| E5 | **Put me on the leaderboard** | The ink button. It opens E6 |
| E6 | Name sheet | One name field (prefilled from this device) and a flag (auto from the geo header, tap to change). The button reads **Put me on** |
| E7 | Name rejected state | Inline under the field: "Pick a different name" (profanity) or "Already on today's board under this name" |
| E8 | On the board | The sheet closes, your row slides into the board snippet at its rank with the ember ring, and the button becomes "You're #14 today" |
| E9 | Share | **Copy result** copies the share line and shows the toast. On phones `navigator.share` is used when present |
| E10 | Next card | The next unplayed card peeks from the right edge and the shelf updates. **Next: GeoWordle** is the secondary action under the result |
| E11 | Tomorrow teaser | The flame countdown plus a clay "tomorrow" object (a covered crate) and one line: "Tomorrow's draft deals from three continents" |

### F. Board (`/leaderboard`)
| ID | Pane | Job |
|---|---|---|
| F1 | Board head | Tabs per game (the shelf objects as tabs) plus **Day total** |
| F2 | Board list | Rank, flag, name and score, with your row ringed if your name is on it from this device |
| F3 | Thin-board state | Under 10 names: "Plays today: 214. Names on the board: 6. Yours could be next." Never "no one yet" |
| F4 | Yesterday's board | Final standings plus yesterday's answers (board line, best cabinet, the GeoWordle country) |
| F5 | Run detail (`/run/[id]`) | One public run: cabinet or line, score, date. Public and shareable |

### G. Practice (`/practice`)
| ID | Pane | Job |
|---|---|---|
| G1 | Practice deck | The same deck model with card-tone cards, the "Practice" clay stamp and an endless **Deal again** |
| G2 | Practice result | Score and why only. No board, no name, a **Deal again** primary |

### H. World content (SEO, existing routes)
| ID | Pane | Job |
|---|---|---|
| H1 | Countries index | Search plus a continent grouping, each row with a flag and the one best rank |
| H2 | Country page | Country hero (big flag, a clay globe turned to its continent, name), answer capsules, stats with ranks, "People from here" (figures), neighbours, "Play with X" cards |
| H3 | Category page | One stat, ranked table, extremes |
| H4 | List page | Editorial list |
| H5 | Credits, privacy, terms, support | Legal and portrait credits |

### I. System states
| ID | Pane | Job |
|---|---|---|
| I1 | Already played today | Opening `/play` for a done daily goes straight to E1, with the countdown |
| I2 | Board rerolled by admin | Banner on the card: "Today's board was reset. Your run still counts." |
| I3 | Offline (iOS app) | The clay globe with a cloth over it and one line |
| I4 | 404 | The clay globe spinning past an empty spot: "No country at this address." Links to Today |
| I5 | Error | The same frame; "Something broke on our side. Your run is saved on this device." Retry |
| I6 | Reduced motion | Not a pane but a mode: every stepped event becomes an instant state swap |
| I7 | Sound | Off by default; footer toggle. Soft clay foley on commit and reveal only |

---

## 5. Design system and motion

### 5.1 The idea: the Table

Countrivo is **a paper table with clay objects on it**. Each game is an object you pick up. The page is the tabletop, cards are trays on it, and the clay objects stand on the trays. The signature artifact is the **clay object standing on the card's plinth**, half above the card's top edge. It crosses the boundary between the shelf and the card, which gives real z-depth without shadows or glass. Every route has at least one clay object standing on something.

### 5.2 Grid and layout

**Phone (390):**
- 20 px gutters, content width 350.
- Deck: native horizontal `scroll-snap-type: x mandatory`. Card width is `calc(100vw - 20px - 48px)`, about 322 px, with a gap of 10.
- The next card shows **38 px** of its left edge, enough to show part of its clay object.
- The deck uses no JS for swiping. It works before hydration and in the first HTML.
- The card's height is set so the whole card plus the Play button fit above the fold on a 390×664 safe area. The shelf takes 84 px and the card about 470.

**Desktop (1440):**
- 1200 container, 12 columns, gutter 24.
- Shelf centred at 640 wide.
- Stage: the active card spans columns 1 to 7 (684 px). The peeking next card spans columns 8 to 9 at 88% scale, clipped by the rail. The rail spans columns 10 to 12 (300 px).
- The deck uses **arrow buttons** (house chevrons, 44 px) at the stage's left and right edges, plus scroll-snap for trackpads.

**Play surfaces:**
- One centred column: max 560 on phones and tablets, 720 on desktop.
- Country Draft desktop: the cabinet strip becomes a 5-wide row of 120 px seats. People cards sit 3 across, and the job sheet becomes a panel anchored under the selected card.

### 5.3 Colour

I keep all current tokens and add three. Only `tokens.css` may hold hex values.

| Token | Value | Use |
|---|---|---|
| paper | #fbfaf6 | Table ground |
| card | #f1f0ea | Trays: game cards, sheets on desktop, option rows |
| line | #e9e8e1 | Hairlines between board rows only |
| wait / faint / mute / down | existing | Map land, pips, secondary text |
| ink | #17181a | Text, Play button, correct fill, result card |
| ember | #b8432a | Wrong, live countdown, "you" ring, NEW |
| **clay-shade** (new) | #e1dcd2 | The measured tone of the white clay's shade side. Used for the plinth notch fill and the map ocean, so clay and UI share a substrate |
| **moss** (new, clay-only) | #4b5e4a | Reference colour for clay prompts ("muted dark bottle-green clay"). It is **never** a CSS fill on UI. Reserved for the trophy, coins and the Purse |
| **brick** (new, clay-only) | ember family | Reference for "burnt brick-orange clay" in wrong-state objects |

- The UI stays ink and ember.
- Moss lives only inside clay pixels, so the "green only for winners and money" rule is enforced by construction.
- The page is identical in light and dark browsers, with no theme toggle.

### 5.4 Type

- **Erode 600** is the single display voice. It is already self-hosted and licensed, and it is not on the Google shelf.
  - Uses: wordmark, card titles, H1/H2, all score numerals.
  - Numerals use `font-variant-numeric: tabular-nums lining-nums` so ticking numbers never jitter.
- **The body is `system-ui`.** There is no second display face and no mono anywhere.
- **Scale (phone / desktop):**
  - card title: 34/44
  - score XL: 72/96
  - score L: 40/52
  - H2: 24/30
  - body: 16/17 at line-height 1.45
  - meta: 13/14 in mute
- **Distinct treatments by role (no single tracked-caps label everywhere):**
  - Game identity: Erode title.
  - Metadata: system 13 in mute, sentence case.
  - Buttons: system 16 semibold, sentence case.
  - Round pips: no text at all.
  - Uppercase is used nowhere.

### 5.5 Shape language: the plinth notch

Every game card has the same bespoke silhouette: a 12 px-radius rectangle whose **top-right corner steps down** into a plinth.
- The notch is 30% of the card width and 28 px deep, with 12 px inner radii.
- The clay object stands in it, its base resting on the step and its top rising above the card's top edge.
- The card's title starts at the left, clear of the notch by 24 px (clear the cut).
- The Play button overlaps the **bottom-right** edge by half its height (22 px). This keeps the existing anchor signature, now on the opposite corner from the notch, so the card reads as a balanced diagonal.
- The notch is drawn with `clip-path: path()` generated per card width by a CSS custom property, with no images.
- Result cards, practice cards and the country hand cards all share this silhouette. Sheets, rows and options are plain 6 px rectangles.

**Plus one signature line:** a deliberate rounded path. The great-circle line in Pinpoint, the bearing arrow in GeoWordle and the conquest spread lines all use a 2 px stroke with round caps, ink at 60%, dashed 2/6, and always animate by `stroke-dashoffset` over the full length. This is the "route" motif, the only decorative line on the site, and it always means distance.

### 5.6 Clay object language

**Rules for every asset:**
- One chunky object of 2 to 3 parts, white body plus a dark-grey part, touching parts only.
- Trimmed and re-padded so the object fills 72% of the height on one shared floor line.
- A baked tight contact shadow: warm-tinted, offset 0/3, no all-around bloom.
- 1 px alpha erosion so edges sit cleanly on ink.

**Game identity objects** (each shown as idle → event → outcome states):

| Game | Object | States |
|---|---|---|
| Country Draft | Round dark table with **three** white chairs (not five: counts drift) | idle: chairs straight → event: one chair scoots out → done: a small moss coin stack on the table |
| GeoWordle | Magnifier resting on a classic teardrop pin with a hole, dark grey | idle → the magnifier tilts → solved: the pin is pressed into a clay map slab |
| Pinpoint | Dark-grey teardrop pin standing in a light-grey clay disc | idle → the pin lifts → the pin is pushed in deep |
| Higher or Lower | Two blocks on one clay base slab, an arrow *pressed onto* the taller block | idle → the short block grows → bust: the top block tips over in brick |
| Flag Ten | Flag with a **two-tone field** (dark-grey band on light grey) on a dark pole in a mound | idle → the cloth flutters (2 states) → 10/10: a moss rosette on the pole |
| Blind Pick | Three fanned cards, the front one face-down | idle → the front card lifts → flipped |
| Speed Flags | Hourglass | six drain states |
| Ballpark | Old balance scale | tilt left, level, tilt right |

**Job objects for the cabinet strip:**
- The Chair: high-backed chair.
- The Field: a dark-grey helmet.
- The Purse: a moss-green coin purse (money is green, by rule).
- The Voice: a megaphone.
- The Desk: a brick-and-trowel.

Each has empty and seated states, and the seated state has a slight squash. The portrait crest sits on top of the clay as a UI layer, so faces never pass through the model.

**Outcome objects:**
- Moss trophy (top band).
- White ribbon (mid band).
- Cracked brick-orange plate (bust).
- Covered crate (tomorrow).
- Globe (home and 404).

**Portrait fallback:** when a figure has no portrait, a **clay bust stand-in** in the job-neutral grey (head and shoulders, no face detail) carries the person's initial as a UI overlay in Erode. One asset reused for every missing portrait reads as intentional, not missing.

### 5.7 Motion grammar

| Layer | What | How | Timing |
|---|---|---|---|
| **Smooth (interface)** | Sheets, deck snaps, card-to-board morph, row insert | `--ease-out` cubic-bezier(0.2,0,0,1). Sheets enter as one block, never staggered | 220 ms base, 300 ms for the morph |
| **On twos (outcomes)** | Clay state swaps, score tick-ups, rank reveal, verdict words, conquest fill, pips filling | CSS `steps()` at 6 changes per second. Clay jitter is a `steps(1)` keyframe on transform (±1 px, ±0.3°) and brightness (±1.5%) every 166 ms | 0.5 to 1.4 s per beat; a tap skips to the end |
| **Idle (life)** | The focused card's clay object breathes: a 2 s loop of 2 states (e.g. the chair scoots and returns), played once every 8 s, only for the snapped card | IntersectionObserver plus `document.visibilityState` | At most 1 loop at a time on screen |

**Specific transitions:**
- **Card to board (D2):** the View Transitions API with `view-transition-name` on the card, the clay object and the title.
  - The card grows to the board frame (300 ms smooth). The clay object travels to the 40 px header slot and lands with one 2-frame squash on twos.
  - Fallback: a plain navigation. The board is already complete in the HTML.
- **Commit to reveal:** the commit control depresses (ink-2 fill, no translate) for 120 ms. Then the stepped reveal plays, then the next decision slides in smooth.
- **Result to next card:** the result card settles, the next card slides in 38 px from the right edge (smooth), and the shelf object for the finished game swaps to its done state on twos.
- **Joining the board (E8):** your row is inserted at its rank. The rows below shift down 220 ms smooth, and your rank number ticks into place on twos.
- **Buttons:** fill-tone change only. No lift, no scale, no glow, no growing underline. Arrow icons slide 3 px on hover where a hover exists.

**Reduced motion:** `prefers-reduced-motion: reduce`:
- removes every `steps()` animation, jitter and idle loop
- makes morphs crossfade at 0 ms, which is an instant swap
- keeps scores, verdicts and why-lines appearing at once at their final value

Nothing ever starts at opacity 0. Content is in the DOM at its final state, and motion only plays from "state 1" toward the event state on objects that are already visible.

### 5.8 Shipping clay on the web

- **Ship state stills plus CSS jitter by default:**
  - AVIF with a WebP fallback in `<picture>`.
  - 512 px for hero objects (≤12 KB), 160 px for shelf and seats (≤4 KB).
  - The states are stacked in one square box, and state 1 is the visible `<img>` in the server HTML.
- **Video** (HEVC-alpha mp4 plus VP9-alpha webm, poster = state 1) is only for the two hero clips, the conquest finale and the trophy, where a multi-state clip beats stacked stills.
- **Budgets:**
  - ≤150 KB of clay per route.
  - The LCP is the focused card's still, with `fetchpriority=high`.
  - Peeking and below-fold assets are lazy.
  - Every box is sized with `aspect-ratio: 1`, so nothing shifts.
- **Pipeline fixes before mass production:**
  - per-asset jitter seed
  - trim and re-pad to one floor line
  - alpha erosion
  - baked contact shadow
  - WebP/AVIF export at 128, 160, 256, 384 and 512 px
  - a QA contact sheet on paper and on ink

### 5.9 Iconography

The house set is 2 px stroke, round caps, one seed dot each, and it is used for controls only.

**New icons needed:**
- share
- info
- question
- the drag handle (a rounded 36×4 bar)
- map zoom
- undo (a curved arrow with the seed at its tail)
- a sound pair (speaker plus seed, speaker plus slash)

**The direction arrow** is the house up-right diagonal, and it is reused in "Next game" and the bearing arrow.

**Stat icons** (in `icons/stat`) stay on Blind Pick slots and country pages. They are never placed in tiles or chips.

### 5.10 Components

- **Game card:** notch silhouette, card tone, title, promise line, three rules, meta row, Play overlap.
- **Shelf item:** clay still (56 px), title in system 12, state line in Erode numerals or "Play".
- **Person card:** 72 px portrait (3 px radius frame, inset edge ring), name in system 17 semibold, years, identity line.
  - **Selected state:** an ink 2 px outline plus the portrait growing to 80 px (smooth).
  - All three cards are always identical in height. The identity line is clamped to 2 lines, with its slot reserved.
- **Option row** (Flag Ten, bonus chain): 56 px tall, card tone, 6 px radius. States: rest, pressed (ink-2), right (ink fill with paper text and the check icon), wrong (ember fill with paper text and the cross icon).
- **Seat (cabinet strip):** 64 px clay object with a 32 px portrait crest overlaid at the bottom-right and points in Erode 16 under it. An empty seat shows its job name in mute.
- **Sheet:** white, 12 px top radius, drag handle, max 88% height, scroll inside, primary button pinned at the bottom with a 16 px safe-area pad.
- **Board row:** 48 px tall, rank (Erode), flag (20×15), name, score (Erode, right-aligned). Hairlines between rows only. "You" gets the ember 2 px ring on its flag.
- **Map:** custom SVG built from Natural Earth 1:110m (public domain).
  - Land in `wait`, ocean in `clay-shade`, no graticule, coastlines only for Pinpoint.
  - Pinch and drag through Pointer Events with momentum-free panning.
  - The minimum zoom shows the whole world at 350 px wide.

### 5.11 Accessibility

- **Targets:** every interactive element is ≥44×44. On Higher or Lower the two halves are full-width targets with a visible label.
- **Colour:** every verdict pairs a word or numeral with colour. GeoWordle bands are words plus km. Share-grid colours appear only in the clipboard.
- **Screen readers:**
  - `aria-live="polite"` on the reveal line and the score.
  - Clay objects that are decorative get `alt=""`. Shelf objects carry the game name.
- **Keyboard:**
  - Full keyboard play on desktop.
  - Key hints appear in a small hint row only under `(hover:hover) and (pointer:fine)`, never fused into data.
- **Focus:** the existing focus ring, visible on ink and paper.
- **Contrast:** mute #74756f on paper is 4.6:1, which passes AA for body text. Nothing lighter than mute is used for text.

### 5.12 Anti-leak in the UI

1. All options render with identical markup, height and animation before commit. No per-option hover state differs.
2. Option order is shuffled by the seed.
3. Nothing about value is in the DOM, a tooltip, `data-` attributes, aria labels or the RSC payload before commit. The server returns the reveal per move.
4. The reveal animation has the same duration for good and bad picks, so timing cannot hint.
5. Job sheet copy is identical for every person.

---

## 6. Risks and open questions

1. **Server-per-move validation is a real architecture change.** Hiding values from the client means each commit is a server action round trip.
   - On a slow phone the reveal can wait about 300 ms. The stepped reveal *starts* on commit with the identity half (portrait flies to seat) and only the number waits.
   - I need the game designer to confirm this latency budget is acceptable.
2. **Clay consistency at scale.** The model miscounts, warps thin parts and ignores hex values. About 60 objects × 3 states × 2 to 4 candidates is roughly 500 generations, plus manual QA.
   - Risk: a set that does not cohere.
   - Mitigation: lock the shelf set first (8 objects), approve it as a contact sheet, then extend.
3. **Deck discoverability.** A peeking card is discoverable on phones. On desktop, people may not realise the deck moves. The arrow buttons and the shelf must carry that. This should be tested with 5 people.
4. **View Transitions support.** Same-document transitions work in Chrome and Safari 18. Cross-document support is newer. The fallback must be a full, correct page, which the no-loading-state rule already guarantees.
5. **The board stays thin.** Even with one-field naming, 1,000 visitors a month may produce about 30 names a day. Percentile and plays count must rely on anonymous `play_finish` analytics. Those must be stored server side (not only in Vercel Analytics), or the numbers cannot be shown.
6. **Pinpoint needs new geometry** (Natural Earth 110m, about 100 KB of SVG paths). It needs the geography expert's curation rules and a nearest-border distance precompute.
7. **Cutting Stat Guesser from the daily set** affects one URL with little traffic. The owner needs to accept that.
8. **Name abuse without accounts.** A profanity filter plus one name per device per game per day still allows cookie clearing. Do we accept it, or add a light IP rate limit?
9. **Desktop rail versus "one game per screen".** The right rail adds a board snippet beside the card. If the owner reads C strictly, the rail moves below the deck.
10. **Sound.** Clay foley would add a lot to the stop-motion feel but needs recording or licensing. It is proposed off by default. Is it worth doing at all for v1?
11. **The Figma file lost the 'Varianten' and 'C ausgearbeitet' pages.** Only "Entwurf" (frames 00 to 05) is readable now. This proposal builds on the owner's written description of C-b rather than those frames. Someone should confirm whether those pages were moved to another file.