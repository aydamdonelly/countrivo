# Countrivo: the complete site concept

Version 1.1, 12 October 2026. The lead product designer wrote this from the drafts and critiques of the game designer and the geography expert, then revised it after three adversarial reviews: leaks and exploits, first-visit clarity, and completeness. This document is the single source of truth. Where it disagrees with an earlier draft, this document wins. Where it disagrees with the owner's own words, the owner wins. The "Blueprint amendments" in 9.5 list every place where it overrides `docs/REBUILD-BLUEPRINT.md` and the project `CLAUDE.md`.

Notation:
- "Phone" means 360 to 767 px wide, designed at 390. "Small phone" means 320 to 359 px wide, or any viewport 600 px tall or less.
- "Desktop" means 1024 px and wider, designed at 1440.
- "Twos" means stop-motion stepping (defined in 3.7).
- Square brackets such as [verify] mark facts that must be checked against a source before they ship. [calibrate] marks numbers that are set from real play data after launch.

---

## 0. Summary and the ten principles

Countrivo is a free daily set of six geography games. You play them on your phone or at your desk, and there are no accounts.

- **Home.** Home has a strip of today's six games across the top. Below it is one big playable card per game, with the next card peeking in from the side.
- **Look.** The world is drawn as Aardman-style clay objects standing on paper.
- **Flow.** Every decision follows one rhythm:
  1. You choose something without seeing what it is worth.
  2. You commit with one clearly labelled action.
  3. A stop-motion beat shows what it was worth.
  4. One true, sourced fact tells you why.
- **After a game.** You can tap "Put me on the leaderboard" and type a name. That name is the only identity there is.
- **Server.** The server seeds every board with a secret. It writes every move exactly once and sends each answer only after the move is made, so nobody can forge a score on the name-only board. The server cannot stop someone looking a fact up in another tab. The board is for fun, and `/about` says so plainly.
- **Country Draft.** This is the flagship. You now choose the country, and you never see a person's points until you have seated them. The skill is knowing who Napoleon was, not reading a number.

### 0.1 The ten principles

Every later decision traces back to one of these.

1. **Worth is hidden until commit, then shown in full.** Before a choice, the screen shows only identity: name, face, flag, active years and one neutral line. After the commit it shows the points, the rank and the reason. No option looks, sorts, animates or reads differently before commit. If the screen could score an option for you, the player would not have to.
2. **Choose the what, never see the worth.** Players pick countries, people, seats, guesses and pin positions. Choosing when the worth is hidden is fun. Choosing from visible numbers is arithmetic.
3. **The server is the referee.** Boards come from a secret seed. Solutions live only on the server and never in the public repository. Each commit is written once as a server-side step, and it returns that step's reveal and nothing more. No answer ships in HTML, RSC payloads, action responses, prefetches, cookies, filenames, ids, alt text or animation timing.
4. **One shot counts, practice is endless, and the two never mix.** The daily is one run per device per game per Berlin day. Practice is unlimited, unranked and visibly a different room. Practice never contains today's daily content.
5. **Every commit teaches one true thing.** Each commit gets one line, generated from sourced data or authored with a source, and it carries its year. A true number is never used in a misleading way.
6. **Partial credit, no dead ends, the last rounds matter.** Distance, rank and ratio give a beginner something every round. The last rounds are harder and count double.
7. **One game per screen, the next one always visible.** The card is the game's front door. Finishing a game offers the next one.
8. **Never show an empty room, never inflate one.** Every game has a fixed Par from day one. Every name on a board is shown. Percentile, rarity and counts appear only above honest thresholds.
9. **Touch first, two seconds to understand, nothing irreversible by accident.** There is one verb: "Play". Selecting is free. A commit is one clearly labelled button, except in the quick games, where the tap is the answer and the card says so. New options ignore input for 300 ms after they appear. Every target is at least 44 px. Keyboard hints appear only for fine pointers.
10. **One world, one system.** Paper, ink and one ember accent. Clay is identity and outcome; the 2 px house icons are controls. Motion has two speeds: smooth for the interface and stepped for outcomes. First paint is always the final layout.

### 0.2 What others do and what we take

The owner asked for research into GeoTrivia and similar games. Each row below links to the decision it shaped. Mechanics we could not confirm first-hand are marked [verify].

| Product | What it does | What we take | What we leave |
|---|---|---|---|
| [195-0 World Draft](https://lovableapp.org/products/195-0-com) (the-cabinet-beta.vercel.app) | Free browser game with no account. You draft a five-person cabinet of public figures (President, Vice President, General, Propaganda Minister, Treasurer) and see how many of 195 nations your regime conquers. Reviewed as satire ([source](https://lovableapp.org/blog/the-cabinet-beta-vercel-app-2026)) | The conquest-of-195 fantasy and the five-seat cabinet, which our Country Draft already owns in search | Satire as the tone, and power numbers shown before picking [verify]. We score real records, and the player chooses the country (5.1) |
| [Geotrivia: Geography Games](https://apps.apple.com/app/id6758594564) | Daily modes: Georankle (sort countries into rankings), Geodle (a mystery country from clues), GeoConnections (group related items), plus flag, capital and shape quizzes | Placement-by-rank, which is already Blind Pick (5.7), and the "small set of dailies" shape | GeoConnections for v1, because a 16-tile grid fights the one-card model on a 390 px phone. It is a candidate for later |
| [Geo Trivia (GeoFunGames)](https://www.geofungames.com/games/trivia) | Topic quizzes of 10 or more multiple-choice questions, a leaderboard, no account | Proof that name-only boards without accounts work | Untimed topic quizzes as a daily |
| Worldle / Geo Daily | One hidden country, six guesses, distance and direction per guess. Worldle adds bonus rounds such as neighbours and capital [verify current bonus set] | Distance plus direction, six rows, and a bonus chain (5.2) | Centroid distance (we use border distance, so neighbours read 0 km) and a silhouette by default (ours is an optional clue that costs a guess) |
| Globle | Guess countries on a globe that warms in colour as you get closer, with unlimited guesses | The map as feedback (the GeoWordle mini-map) | Unlimited guesses |
| Travle | Connect two countries through a chain of bordering countries | Nothing in v1. The new `bordersSovereign[]` data makes it possible later | |
| Tradle | Guess a country from its export treemap | Nothing | Reading a chart is not readable in two seconds |
| GeoGuessr | Drop a pin from street imagery, scored by distance up to 5,000 | The pin drop as a native touch verb (Pinpoint, 5.3) | Raw-km scoring, which punishes crowded regions. Pinpoint scores relative to neighbouring countries and distance |
| Seterra | Click the named country on a map | Pinpoint is its daily, scored and shareable form | Untimed drill as a daily |
| Sporcle "Countries of the world" | Type every country you can name | "Name Them All" on continent lists (W7, practice only) | Typing-heavy dailies |
| Wordle | One puzzle a day for everyone, spoiler-free coloured-square share | The whole daily ritual: same board for everyone, midnight reset, plain-text squares | |

---

## 1. Product model

### 1.1 The daily set

There are six daily games, shown in this order in the strip:

| # | Game | URL | Time | Unit of score | Par |
|---|---|---|---|---|---|
| 1 | Country Draft | `/games/country-draft` | about 3 min | points of 195 | 140 |
| 2 | GeoWordle | `/games/geo-wordle` | about 2 min | guesses of 6 | 4 |
| 3 | Pinpoint (new) | `/games/pinpoint` | about 2 min | points of 1,200 | 720 |
| 4 | Flag Quiz | `/games/flag-quiz` | about 1.5 min | points of 13 | 9 |
| 5 | Higher or Lower | `/games/higher-or-lower` | about 1.5 min | points of 13 | 9 |
| 6 | Stat Guesser | `/games/stat-guesser` | about 2 min | points of 600 | 300 |

**Par** is one fixed number per game, not per board. It means "a good score for this game". It is the same every day, so it never hints at how easy today's board is. All values are [calibrate] after two weeks of data and then change at most once per quarter, on a midnight deploy.

Practice-only games:
- **Blind Pick** (`/games/blind-pick`): six countries placed onto six stats, scored like golf.
- **Speed Flags** (`/games/speed-flags`): 30 seconds of two-option flags.

Every daily game also has a practice version.

**Decision: why these six.**
- **Pinpoint replaces Blind Pick as a daily.** It needs a map renderer, which is required anyway for the GeoWordle mini-map, the Country Draft conquest map and the countries index. It is also the only daily that puts the shape of the world on screen, and it is native to touch.
- **Blind Pick goes to practice.** On a 390 px phone it is the longest and hardest game in the set to read.
- **Stat Guesser stays daily, rebuilt on a ruler.** Typing numbers is gone.
- **Names are kept.** "Flag Quiz" and "Stat Guesser" stay (not "Flag Ten" or "How Many"), so URLs, H1s and search terms stay aligned.
- **Phasing.** Until Pinpoint ships in phase 2, Blind Pick holds daily slot 3, already on its new 6 × 6 rules (see 5.7, "Interim daily"). The rest of this concept describes the end state.

### 1.2 Practice

Practice is never a toggle, so a player is never unsure whether a run counts.

**Where practice lives:**
- **On the card, after the daily is done.** The done card's secondary action is "Practice board". Before the daily is done, the card's only action is Play.
- **In the practice room** at `/practice`, a deck of card-tone practice cards for all eight games. It is linked from the header (desktop), the footer and the Day complete card.
- **In the archive.** Every past daily since the relaunch date can be replayed as practice.
- **On country pages.** "Draft from Italy" opens a practice draft whose first round offers that country. It exists only for countries with six or more portrait people in the draft pool (see 5.1).

**What makes a practice run different:**
- Practice boards come from `HMAC(BOARD_SECRET, "p:" + random nonce)`, so a practice board can never equal a daily board.
- **Practice never contains today's daily content.** Until 00:00 Berlin, practice pools exclude:
  - every person on today's Country Draft board (all 15 trios)
  - today's (country, stat) pairs from Stat Guesser and Higher or Lower
  - today's GeoWordle and Pinpoint answers
  - today's Flag Quiz answer flags
- Practice runs are never ranked, named or counted toward the streak.
- The play header always shows the Practice stamp and "Nothing counts".

### 1.3 No login: the anonymous device session

There are no accounts, no sign-in, no email and no OAuth. Identity is a device.

**Cookies:**

| Cookie | What it holds | Notes |
|---|---|---|
| `cv_d` | 128 random bits | Issued by `src/proxy.ts` on the first request to a dynamic path. httpOnly, Secure, SameSite=Lax, 400 days. The server stores only `device_hash = sha256(token + DEVICE_PEPPER)` |
| `cv_run_{slug}` | Only the signed `run_id` of today's daily run in progress | Moves live on the server as `run_steps` rows (7.1). A reload resumes from those rows. An old copy of the cookie restores nothing, because each step is written once |
| `cv_p_{slug}` | The action log of a practice run, under an HMAC-signed header `{nonce, mode:"practice", startedAt}` | Practice only. Rolling it back affects only unranked play, and archive answers are already public |
| `cv_name`, `cv_place` | The last submitted name and place | Readable server side, set only when the player submits to a board. They prefill the name field in the first HTML, so the field never loads in |
| `cv_h` | A small bitmask of which first-run hints this device has passed | Written by the commit server action, so hints render correctly in the first HTML |

**What exists on the server:**
- one `daily_runs` row per daily run, created at its first commit, plus its `run_steps` rows
- an IP prefix hash per run (kept 24 h in `rate_events`; on the run row it is used only for the day's statistics, then nulled at 00:00 + 24 h)
- nothing else about the person

**"Forget this device"** on `/privacy` deletes every row for the device hash and clears all cookies.

**First visit** is detected by the absence of `cv_d` on the incoming request. That is why first-visit-only elements (the H1 hint line) are decided in the server render and never pop in or out.

### 1.4 "Put me on the leaderboard"

1. A daily ends. Below the result there is an ink button: **Put me on the leaderboard**.
2. Tapping it expands it in place into one row:
   - a name field, prefilled from `cv_name`
   - a place row, prefilled from `cv_place`, otherwise from the request's geo country. It can be changed or removed through the place sheet (G9).
   - a **Put me on** button
   - the meta line "Your name and flag show on today's public board. No account."

   The keyboard and the board stay in one view; there is no sheet.
3. The server checks the run and the name:
   - the run is verified and eligible (section 7)
   - the run is from today, or from yesterday within the 15-minute naming grace after midnight
   - the run belongs to this device and is not already named
   - the name passes the filter and length rules
4. Your row slides into the board snippet below at its rank. The button becomes "You're #2 of 3 names today" with "See the leaderboard". The count is the number of named entries on that board.
5. Until midnight Berlin, your row offers **Change name** (inline) and **Take me off**.

**Rules:**
- Names are not unique.
- One named entry per device per game per day.
- Practice results have no leaderboard button at all.
- **Next time:** once a name exists on this device, the button reads "Put me on as Adam". One tap submits, and a "Change" action sits beside it.
- **When a run cannot go on the board** (section 7), the button is replaced by one plain line that says why (R3). The private result is never hidden.

### 1.5 Streaks on the device

- **What a streak is.** The number of consecutive Berlin days on which this device finished at least one daily. It is computed from `daily_runs` by device hash. There are no freezes and no recovery.
- **Where it shows.** The header flame with the number appears only when the streak is 2 or more, and only on dynamic routes: home, play, result and leaderboard.
- **Static SEO pages** show no flame at all. That is a fixed per-route rule, not a value swapped in after load.
- **Clearing the browser loses the streak.** Whether a carry code is offered is an open question for the owner (section 10).

### 1.6 Sharing

- **Share** copies a plain-text, spoiler-free summary. The formats are in section 5.
- **On the web:** phones use `navigator.share` when it exists.
  - If the player cancels the share, nothing happens.
  - Where `navigator.share` does not exist, the text goes to the clipboard with the toast "Copied. Paste it anywhere."
  - If both share and clipboard fail, the share fallback sheet (G10) opens with the text in a selectable field.
- **In the iOS app:** the Capacitor Share plugin.
- **Emoji** are allowed only inside the copied text and are never painted on screen. There is no on-screen preview of the share text, except in G10 when everything else has failed.
- **Spoilers.** The share text names no country, person, flag or seat occupant.
- **"Share my day"** after a full set gives one line per game.

### 1.7 Midnight Berlin

- **Day key.** Server only, from `getTodayDateKey()` in Europe/Berlin. The client clock is never trusted.
- **At 00:00 Berlin:**
  - New boards go live. Each is built once and stored as a `daily_boards` snapshot (7.1).
  - Yesterday's boards close.
  - Yesterday's answers, best lines, "what you passed on" values and run pages become public.
  - The streak day rolls.
- **Naming grace.** A run that finished before 00:00 can still be named until 00:15 Berlin, onto its own day's board.
- **A tab open across midnight** shows the rollover banner (G6). The strip and cards refresh in place on the next interaction.
- **A run started yesterday and unfinished at midnight** shows "This board closed at midnight" (P6). The player can finish it as practice or play today's.
- **Deploys** that change rosters, data or scoring happen just after 00:00 Berlin. They come with a new `engine_version`, and for Country Draft a new `POOL_VERSION`. Past boards are never rebuilt; every past-board surface reads its snapshot.

### 1.8 What the board can and cannot promise

The server stops forged scores, replayed moves, bots that finish in seconds and repeated scouting from one network. It cannot stop someone reading a category table or searching the web in another tab while a question is open. `/about#fair` says this in two sentences:

> "Every move is checked on our server, so scores can't be faked. Nothing stops you looking things up, so the board is for fun, not for prizes."

Runs where the page sat in the background for 15 seconds or more while a question was open carry the meta word "paused" on the board (7.3).

---

## 2. Information architecture and navigation

### 2.1 Site map

```
/                                Today (strip + deck)
/practice                        Practice room
/leaderboard                     Leaderboards (Today, Yesterday, Countries today)
/run/[id]                        One run (private until midnight)
/games                           Games index
/games/[slug]                    Game landing (SEO); the first thing is the playable card
/games/[slug]/play               The one play route (daily, or practice via ?mode=practice)
/games/[slug]/archive            Past boards since relaunch, playable as practice
/countries, /countries/[slug]    Countries index and dossiers
/categories, /categories/[slug]  Stats and rankings
/lists, /lists/[slug]            Editorial lists (continent lists carry Name Them All, phase 3)
/sources                         Which 195, naming policy, datasets, caveats
/about                           How Countrivo works (#streak, #fair, #par)
/privacy /terms /credits /support /imprint
/admin                           Edition reroll and name moderation (secret form, no account)
```

**Redirects (301):**

| From | To |
|---|---|
| `/friends/:path*`, `/profile/:path*` (includes `/friends/add/[username]` and `/profile/[username]`) | `/` |
| `/auth/:path*`, `/forgot-password`, `/reset-password` | `/` |
| `/games/[slug]/leaderboard` | `/leaderboard?game=[slug]` |
| `/games/[slug]/run/[runId]` | `/run/[runId]` if the run exists in `daily_runs`, otherwise `/games/[slug]` |
| `/vs/:code` | `/games` (unchanged) |
| `RETIRED_GAMES` and `/games/world-draft` | unchanged |

`src/app/auth/callback/route.ts` is deleted.

### 2.2 Navigation model

**Decisions:**
- No phone tab bar and no overflow menu.
- On home, the strip navigates the day.
- The header is tiny and constant.
- Everything else lives in the footer.

With no accounts, and with practice folded into cards, the tab bar and menu had nothing left to carry. Removing them gives the card about 64 px more height on a phone.

**Header (G1):**
- The wordmark on the left links to `/`.
- On the right: the flame with the streak number (dynamic routes, streak of 2 or more), then **Leaderboard** with the board icon.
- Desktop adds **World** (`/countries`) and **Practice** (`/practice`) as text links before Leaderboard.

**Today strip (G2):**
- Only on home and in the practice room (practice variant).
- Not on game landings: there it pushed Play below the fold, and its taps had no deck to drive.
- Inside a running board, the game's own round pips take its place.

**Footer (G3):** the shelf footer, with the links set as three sentences (G3).

### 2.3 The C model on phone

```
┌ header 52 ───────────────────────────────┐
│ Countrivo            (flame 6) Leaderboard│
├ strip 76 ────────────────────────────────┤
│ [draft][wordle][pin][flag][h/l][stat]     │  44 px clay + 1 state line, ink bar under focus
├ deck scroller (padding 40 top, 30 bottom) ┤
│    clay rises ↑                           │
│ ┌card 322───────────┐▄notch┐ ┌peek        │
│ │ title (≤158 wide) │ clay │ │38 px of    │
│ │ promise               └──┘ │next card   │
│ │ three lines                │            │
│ │ meta                       │            │
│ └────────────────[ Play ]────┘ └          │
│  Swipe for the next game (first visit)    │
├───────────────────────────────────────────┤
│ below the fold: Today on this game,       │
│ yesterday's answers, intro, footer        │
└───────────────────────────────────────────┘
```

**Deck mechanics:**
- The deck is a native horizontal scroller with `scroll-snap-type: x mandatory`. It works in the first HTML and before hydration, with no JavaScript needed to swipe.
- Card width is `calc(100vw - 20px - 48px)`, about 322 px at 390, with a 10 px gap. The next card shows 38 px, including part of its clay object.
- **The scroller clips both axes**, so it carries the overhangs as padding:
  - `padding-block: 40px 30px`. The top covers the clay box rising above the card; the bottom covers the 22 px Play overlap plus the 4 px focus ring and a 4 px margin.
  - The padding is part of the height maths below.

**Sizing (home):**
- Card height is `clamp(360px, 100svh - 218px, 540px)`. That is the viewport minus header 52, strip 76, scroller padding 70 and hint line 20.
- At 390 × 664 visible, the card is 446 px and everything above the hint line fits.
- **Small-height mode** (`max-height: 600px`):
  - header 48, strip 60 (clay 36), scroller padding 32/30
  - clay box 88, notch 104 × 44
  - the three card lines become two
  - card `clamp(340px, 100svh - 190px, 540px)`
- **Below 520 px of height** the strip is not rendered on home (the deck still swipes) and the card minimum is 320.
- **Required check** in `check-render.mjs`: at viewports 320 × 568, 360 × 640 and 375 × 553 the whole Play button is visible without scrolling.

**Strip and deck stay in sync:**
- Strip items are `<a href="#card-[slug]">`, so they work without JavaScript. With JavaScript, a tap smooth-scrolls the deck to that card.
- Snapping the deck moves the strip's focus bar, through a `scrollsnapchange` listener with an IntersectionObserver fallback.

**Deck order (one rule):**
- The deck is the strip order, rotated to start at the first unplayed daily.
- Exception: if a run is in progress and was the last thing touched on this device, its card comes first.
- The rotation is decided in the server render, so the first card is at scroll position 0 and no script runs before paint. The strip always keeps the fixed game order; items map to cards by slug.
- The deck does not wrap. When the day is complete, the Day complete card (H7) is first and the played cards follow.

### 2.4 The C model on desktop

```
┌ header 64, content 1200 ────────────────────────────────────────────────┐
│ Countrivo                       World  Practice  Leaderboard  (flame 6)  │
├ strip 88, centred 640 ──────────────────────────────────────────────────┤
│          [draft] [wordle] [pin] [flag] [h/l] [stat]   56 px clay         │
├ stage: height max(560px, 100svh - 152px), card centred vertically ──────┤
│  (<)   ┌ active card 680, notch 216 ───────▄▄▄▄┐ ┌ next card 88%   (>)  │
│        │ title (≤408)        │ clay 200 │       │ │ clipped at the  │     │
│        │ promise             └──────────┘       │ │ container edge, │     │
│        │ three lines       empty-board preview  │ │ 120 visible     │     │
│        │ meta              (five empty seats…)  │ │                 │     │
│        └────────────────────────────[ Play ]────┘ └                 │     │
├ (the stage ends at the fold on screens 712 px tall or more) ────────────┤
│ Today on this game: Par, names | Yesterday's answers | intro             │
└─────────────────────────────────────────────────────────────────────────┘
```

**Container and stage:**
- The container is 1200 px on a 12-column grid with 24 px gutters.
- The active card is a free 680 px block, centred in the container; it is not tied to columns.
- The stage is `max(560px, 100svh - 152px)` tall. The card is `clamp(480px, stage - 128px, 640px)`, centred vertically in the stage, with 88 px of room above for the clay.
- The next card peeks on the right at 88% scale, clipped by the container edge with 120 px visible. The previous card, if any, peeks on the left the same way.

**Inside the card:**
- The left half holds the text column (title, promise, lines, meta).
- The right half, below the notch, shows the game's **empty first state**, built from the real board components and marked `aria-hidden`:

| Game | Empty first state |
|---|---|
| Country Draft | five empty seats with job names |
| GeoWordle | the blank mini-map and six empty rows |
| Pinpoint | the blank coastline map |
| Flag Quiz | an empty flag box and four empty rows |
| Higher or Lower | two cards with "?" |
| Stat Guesser | the ruler with its two fixed anchors |

- The whole card is the Play target, so the preview is never a dead control.

**Navigation:**
- **Arrow buttons.** Two 44 px buttons (house chevrons) sit at the stage's left and right edges, vertically centred on the card. Each moves the deck one card.
- **Keyboard and trackpad.** Left and Right arrows move the deck when focus is not in a field. A trackpad horizontal swipe works through scroll-snap.

**Decision: no right rail.** "One game per screen" is better served by a full-width "Today on this game" block below the fold, aligned to the card.

### 2.5 Tablet

From 768 to 1023 px, tablets use the phone model centred in a 560 px column:
- card 480 px, with 40 px of peek
- the header with the desktop text links
- the desktop empty-board preview only from 900 px

Play surfaces use the desktop play layout from 900 px up.

### 2.6 Play surfaces

- **Phone.** One column with 20 px gutters. The primary control sits in the bottom 40% of the screen. Sheets come up from the bottom.
- **Desktop.** A centred 720 px column. Country Draft and Pinpoint widen to 960.
- **Desktop sheets** follow one rule:
  - **Country Draft's job sheet** lives inside the 960 column. While a person is held, the people collapse into a 520 px left column of three rows, and the 400 px job panel sits on the right with a 40 px gap. Nothing is covered.
  - **Every other sheet** (rules, place, share fallback) is a 400 px panel docked to the viewport's right edge over a scrim at `rgba(23,24,26,.25)`. It closes with Esc, the close icon or a scrim click.
- **Round pips.** The play header (P1) replaces the strip with the game's round pips.
- **Back.** The back chevron always goes to `/`, where the deck opens on this game's card. If a run is in progress the card reads "Continue" (H4). This avoids the static landing showing "Play" mid-run.

---

## 3. Design system

### 3.1 The idea: the Table

Countrivo is a paper table with clay objects standing on it.

- The page is the tabletop. Cards are trays.
- **First signature.** Each game is a clay object standing in a notch cut into its card's top-right corner, rising above the card's top edge. The object crossing the card boundary gives real depth with no shadow, glass or gradient.
- **Second signature: the route line.** One dashed, round-capped stroke, used only to mean distance or a path.
- **Third signature: the ink Play button** overlapping the card's bottom-right edge, kept from the K3 anchor card.

### 3.2 Grid and breakpoints

| Breakpoint | Width | Gutter | Content | Columns |
|---|---|---|---|---|
| small phone | 320 to 359 | 16 | fluid | 4 |
| phone | 360 to 767 (design 390) | 20 | 350 at 390 | 4, gap 10 |
| tablet | 768 to 1023 | 32 | 560 centred | 8, gap 16 |
| desktop | 1024+ (design 1440) | 24 | 1200 | 12, gap 24 |

- **Height breakpoints:** `max-height: 600px` (small-height mode, 2.3) and `max-height: 520px` (no strip on home).
- **Vertical rhythm.** 4 px base. Sections stack 16 px apart on phones and 32 px on desktop.
- **Layout safety.** No horizontal page scroll at any width. The deck and the practice strip scroll inside themselves.

### 3.3 Type roles

- **Display face.** Erode 600 is the only display face: self-hosted, licensed and not on the Google shelf.
- **Body.** The system stack.
- **No mono, no uppercase anywhere, and no tracking changes.**
- **Numerals.** Every numeral uses `font-variant-numeric: tabular-nums lining-nums`, so count-ups never jitter.

| Role (class) | Face | Phone | Desktop | Use |
|---|---|---|---|---|
| `.t-wm` | Erode | 22/28 | 24/30 | wordmark |
| `.t-card` | Erode | 32/36 | 44/48 | card titles (one or two lines, never three) |
| `.t-h1` | Erode | 30/36 | 40/46 | page H1 on SEO pages |
| `.t-h2` | Erode | 24/30 | 30/36 | section openers |
| `.t-h3` | Erode | 19/24 | 21/26 | person names, country names on choice cards |
| `.t-score-xl` | Erode | 72/76 | 96/100 | result score |
| `.t-score-l` | Erode | 40/44 | 52/56 | H/L values, done-card scores |
| `.t-score` | Erode | 24/28 | 28/32 | running score in the play header |
| `.t-num` | Erode | 17/22 | 17/22 | board ranks and scores, strip scores, seat points |
| `.t-big` | Erode | 56/60 | 72/76 | Stat Guesser live value, Pinpoint country name |
| body | system | 16/24 | 17/26 | everything readable |
| meta | system | 13/18 mute | 14/20 mute | sources, years, counts, sentence case |
| control | system 600 | 16/20 | 16/20 | button labels, sentence case |
| strip label | system | 12/14 mute | 13/16 mute | strip state line and seat labels |

- **Fit-to-width rule** for `.t-big` and `.t-card`:
  - If the text would take three lines, it steps down one role (`.t-big` to `.t-score-l`, `.t-card` to `.t-h2`) and is held to two lines.
  - Test strings: "Saint Vincent and the Grenadines", "Central African Republic", "Bosnia and Herzegovina".
- **Each role has its own look.** Game identity uses Erode titles, metadata uses system meta in mute, buttons use system semibold, and pips have no text.

### 3.4 Colour tokens

All colour values live in `src/styles/tokens.css`. The theme is identical in light and dark browsers.

| Token | Hex | Allowed uses |
|---|---|---|
| paper | #fbfaf6 | page ground, text on ink and ember, map ocean, the cool/cold fill on maps |
| card | #f1f0ea | game cards (trays), option rows, fields, practice cards, the footer shelf |
| bar | #ffffff | sheets and side panels |
| line | #e9e8e1 | the only hairline: 1 px between board and list rows |
| wait | #cfcec6 | map land, empty pips, disabled fills |
| faint | #b9b8b1 | chevrons and non-text marks only. Never text |
| **mute** | **#6a6b65** (was #74756f) | all secondary text, the route line, conquered countries on the conquest map, the "warm" map fill. 5.15:1 on paper and 4.71:1 on card. The old value failed AA (4.45 and 4.07) |
| down | #8a8b85 | disabled text only (exempt from contrast as disabled) |
| ink | #17181a | text, Play button, correct fills, focus bar, answer fill and "hot" fill on maps, guessed-country outlines |
| ink-2 | #2b2c2e | pressed state of ink fills |
| ember | #b8432a | the flame, the live countdown numerals, the "you" ring, wrong verdicts and the wrong-option fill (paper text 5.19:1), no-fit and thin-fit points. Small ember text on card is 4.75:1 and allowed |
| on-ink, on-ink-body, on-ink-kicker, on-ink-chip | as today | text on ink surfaces |
| scrim | rgba(23,24,26,.45) | behind phone sheets |
| scrim-light | rgba(23,24,26,.25) | behind desktop side panels |
| edge | rgba(23,24,26,.08) | inset ring on flags and portrait discs only |

**Map palette** (GeoWordle, Pinpoint, conquest, atlas):
- **Base.** Land wait, ocean paper, no graticule.
- **GeoWordle guesses.** Every guessed country also gets a 1.5 px ink outline, so no guess can blend into the land. There are three fills:

| Bands | Distance | Fill |
|---|---|---|
| Touching, Burning, Hot | 0 to 1,499 km | ink |
| Warm | 1,500 to 2,999 km | mute |
| Cool, Cold | 3,000 km and more | paper (lighter than land) |

- **Answer.** On reveal the answer is filled ink and labelled with its name in an ink-on-paper label, and route lines converge on it.

**Clay reference colours** (not CSS tokens; they live only in prompts and clay pixels):
- **Off-white, light grey, dark grey:** the base of everything.
- **Muted dark bottle-green:** only for winners and money (trophy, coins, the Purse).
- **Burnt brick-orange:** only for error states. It is the same family as ember, so clay red and UI red are one colour.

**Rules:**
- **Ember is never decorative.** Nothing else in the UI carries hue except flags and portraits.
- **Ember never means "good".** "Touching" in GeoWordle is ink.
- **Losing is not an error.** A low score gets a grey object, never brick.
- **Contrast.** No text is set in faint, wait or line. Band words are always ink text, never set in the band's tone.

### 3.5 Radii and shape

- **Existing radii are kept.** Card 12, note 10, knob 9, control 6, chip 4, flag 3. Portrait discs and region marks are circles. Nothing else is rounder than 12.
- **The plinth notch (the bespoke silhouette).** Every game card is a 12 px rounded rectangle whose top-right corner steps down into a notch. The notch width is always the clay box width plus 16 px:

| Size | Clay box | Notch | Title box width |
|---|---|---|---|
| Phone | 104 | 120 wide × 52 deep | 158 px |
| Small-height | 88 | 104 × 44 | |
| Desktop | 200 | 216 × 96 | 408 px |

  - The inner radii are 12 px. The notch is drawn with `clip-path: path()` built from CSS custom properties.
  - The clay box is a sibling layer above the clipped card, so the clip never cuts it. The object's floor line (88% of the box height) rests on the notch's step. Its visible top rises about 23 px (phone) or 48 px (desktop) above the card's top edge, inside the scroller padding.
  - **Clear the cut:** the title sits in a box that ends 24 px left of the notch, so it never runs under the clay. The promise and lines below the notch use the full card width.
  - The ink Play button (44 px tall, radius 6) overlaps the bottom-right edge by 22 px.
  - Game cards, result cards, practice cards and the footer shelf (mirrored, notch top-left) share the silhouette. Country cards, person cards, sheets, rows and options are plain rectangles.
- **The route line.** A 2 px stroke in mute with round caps and a 2/6 dash, used only for real distance and paths:
  - the GeoWordle guess-to-answer lines
  - the Pinpoint pin-to-country line
  - the Stat Guesser guess-to-truth gap
  - the conquest spread

  It animates with `stroke-dashoffset` over its full length, smooth, in 400 ms. It is never decoration.

### 3.6 Iconography

**House icons** are 24 px, 2 px stroke, round caps and joins, with one seed dot each. They are for controls only, always bare and never in a tile or chip.

- **Existing set:** back chevron, chevrons, close, check, cross, flame, flag, board.
- **New, drawn in the house style:**
  - share (an open box with the up-right arrow; the seed at the arrow's tail)
  - copy
  - info (the seed is the dot)
  - question
  - outline clue (a dashed blob outline with a seed inside)
  - zoom in, zoom out
  - place (a teardrop with the seed in the hole)
  - archive (a calendar with the seed on today)
  - world (a globe arc)
  - sound on, sound off (reserved, see 3.8)
  - drag handle (a 36 × 4 rounded bar, sheets only)
- **The arrow** is the house up-right diagonal everywhere: "Next game", the deck arrows (rotated), the Higher and Lower buttons (rotated) and the GeoWordle bearing (rotated to eight directions).
- **Stat icons** (`src/ui/icons/stat`) appear on Stat Guesser, Higher or Lower, Blind Pick slots and category pages, bare and beside the label.
- **No icon packs.** No glyph characters in rendered strings.

**Clay vs icons.** Clay objects name games, jobs and outcomes. Icons operate things. One element is never both.

### 3.7 Motion language

There are two speeds, and they are never mixed in one element.

| Layer | What animates | How | Timing |
|---|---|---|---|
| **Smooth (interface)** | deck snap, sheets, side panels, card-to-board morph, row insert, route line draw, portrait flight to seat, hint collapse | `--ease-out` cubic-bezier(0.2,0,0,1) | `--dur-fast` 120, `--dur-base` 220, `--dur-morph` 300, route 400 |
| **On twos (outcomes)** | clay state swaps, clay jitter, verdict stamps, pips filling, conquest fill steps, region and era marks filling | CSS `steps()`. Clay changes 6 times per second (12 fps, each frame held 2): `--step-clay` 166 ms | one beat is 0.33 to 1.4 s |
| **Ticks (numbers)** | every count-up of a score or value | 12 changes per second (`--step-num` 83 ms), fixed `--dur-count` 750 ms whatever the value | fixed, so the length never leaks the value |
| **Idle (life)** | the focused card's clay object plays its idle sequence once every 8 s | IntersectionObserver plus `visibilitychange`; only the snapped card | at most one loop on screen |

**Specific motion:**
- **Commit press.** The control fills ink-2 at 0 ms. It never translates or scales.
- **Reveal.**
  - The identity half starts at once: the portrait flies, the pin drops, the flag flutters.
  - The value half (tick-up, verdict line) starts when the server answers, which should take 400 ms or less at p75.
  - Good and bad picks get the same choreography and length (`--dur-reveal` 900 ms in total).
- **Input lock.** Any newly dealt set of options (country cards, flag options, a new Higher or Lower pair) ignores input for 300 ms (150 ms in Speed Flags). Nothing is dimmed; the lock is invisible and short.
- **Skip layer.** During a multi-beat sequence (the Draft round-1 deal, the result sequence), a transparent layer over the sequence area catches taps. The first tap jumps every animation to its end state and removes the layer. A skip tap can never land on a control underneath.
- **Card to board.**
  - The default is a plain navigation, which is already a complete page.
  - Where React `<ViewTransition>` is enabled through Next 16's `experimental.viewTransition` [verify in `node_modules/next/dist/docs` before building; it is experimental in React 19.2], the card grows into the board frame (300 ms smooth). The clay object travels to the 32 px slot in the play header and lands with one 2-frame squash on twos.
- **Result to next.** The finished game's strip object swaps to its done still on twos.
- **Peek nudge.** One 8 px nudge of the next card after 2 s untouched. It happens once per device per day and is remembered in localStorage, wrapped in try/catch. It is motion only, so a storage failure changes no layout.
- **Board join.** Rows below shift over 220 ms smooth, and your rank ticks in.
- **Buttons.** Only the fill tone changes. No lift, scale, glow or underline animation. Arrow icons slide 3 px on hover where hover exists.
- **Tab indicator.** A 2 px rounded ink bar slides under the focused strip item and under the active leaderboard tab (220 ms). There is no dot.

**Clay on the web:**
- Each object ships as one still per state: AVIF with a WebP fallback, square, with `width` and `height` set.
- States are stacked `<img>` elements in an `aspect-ratio: 1` box. State 1 is the visible image in the server HTML. Other states are `visibility: hidden` until a `steps()` keyframe shows them.
- **Jitter** is a `steps(1)` keyframe on `transform` (±1 px translate, ±0.3° rotate) and `filter: brightness(0.985 to 1.015)`, changing every 166 ms. The offsets come from a per-asset seed generated at build time, so two loops never twitch in sync.
- **No video on the site.** The webm and mov exports are only for social clips and OG video.

**Content is never gated on motion.**
- Every element is in the DOM at its final state.
- Count-ups write the final value into the text node and `aria-live` immediately and only paint the ticking.
- No `opacity: 0` start exists anywhere. "Stamps" on twos are ink-weight or scale steps on content that is already visible.

**Reduced motion** (`prefers-reduced-motion: reduce`):
- All `steps()`, jitter, idle loops, nudges, morphs, deals and route draws are removed.
- Count-ups show the final value at once. Clay shows the final-state still.
- Sheets appear in place without sliding. Deck snapping uses `scroll-behavior: auto`.
- The reveal still waits for the server, and the identity half becomes an instant state swap.

### 3.8 Sound and haptics

- **Web:** no sound and no vibration in v1.
- **iOS app (Capacitor Haptics):**
  - a light impact on every commit
  - a success notification on a natural-fit seat, a solve or a trophy result
  - a warning notification on a wrong answer
  - nothing on navigation
- **Sound** (clay foley on commit and reveal, off by default, with a footer toggle) is an open question (section 10). The icons are reserved.

### 3.9 Accessibility

- **Targets.** Every interactive element is at least 44 × 44. Higher and Lower are two full-width 56 px buttons.
- **Colour.** Feedback never relies on colour alone. Every verdict has a word or numeral. Every distance band has a word and a km number. Every guessed map country has an ink outline.
- **Live regions.** `aria-live="polite"` on the reveal line, the running score and toasts.
- **Clay.**
  - Clay is `alt=""` and `aria-hidden` when decorative.
  - Strip items carry the game name and state, e.g. "Country Draft, played, 158 of 195".
  - On phones the play header's game title lives in `aria-label` on the clay slot.
- **Keyboard.** Full keyboard play on desktop. Hints appear only under `(hover:hover) and (pointer:fine)`, in a separate hint row.
- **Focus.**
  - The existing focus ring is visible on paper, card and ink.
  - After each reveal, focus moves to the first new control (usually "Next").
- **Pinpoint.** Has a keyboard crosshair mode: arrow keys move, Enter places and Enter again drops.
- **Sheets.** They trap focus and return it on close. Esc closes.
- **Language and motion.** `lang="en"` on every page. Reduced motion follows 3.7.

### 3.10 Components (the primitives in `src/ui`)

| Component | Spec |
|---|---|
| **Game card** | Card fill, notch silhouette, clay object in the notch, title (`.t-card`) in its clear box, promise (body), three short lines (body, mute; no numbers, no bullets; two in small-height mode), meta row (time, Par), Play overlap. Desktop adds the empty-board preview (2.4). States: unplayed, in progress, done, practice. |
| **Strip item** | 58 px wide. Clay still at 44 px (56 on desktop) with one state line in mute: nothing (unplayed), "3/5" (in progress), or the score in `.t-num` ink (done). The focus bar sits under the focused item. |
| **Portrait disc** (was "crest" for people) | Round crop of the uniform greyscale portrait, edge ring. Sizes 28 (seat), 40 (sheet head), 72 (person card, square radius 3), 120 (detail). "Crest" keeps its old meaning only in code being deleted. |
| **Person card** | Equal heights across all three. Portrait 72 px square, radius 3, same greyscale treatment, crop and resolution for everyone (`scripts/build-portraits.mjs`). Name `.t-h3`, "Active 1796 to 1815" in meta, identity line in body clamped to 2 lines with the slot always reserved, "i" info button. Selected: 2 px ink outline. Identical markup for all three. |
| **Country card** | A plain 12 px rectangle, card fill, no notch. Flag 64 × 43 with the edge ring, name `.t-h3`, UN region in meta. Selected: 2 px ink outline. No outline map, no people, no numbers. |
| **Seat** | Clay job object 56 px. Under it, always, the plain job word in strip-label style ("Leader", "Army", "Money", "Voice", "Builder"). Once seated, a 28 px portrait disc overlaps the object's bottom-right corner, and below the word sit the points (`.t-num`) and the fit word in meta ("Natural"). Thin and no-fit points are ember. A seated seat is tappable and re-shows its why line. |
| **Option row** | 56 px tall, card fill, radius 6, label body 17. States: rest; pressed (ink-2 fill, paper text); right (ink fill, paper text, check icon); wrong (ember fill, paper text, cross icon); revealed-correct (card fill, 2 px ink outline, check icon). |
| **Sheet** | Bar fill, radius 12 on the top corners, drag handle, max 88% height, internal scroll, primary button pinned at the bottom with the safe-area pad. Desktop: per 2.6. |
| **Board row** | 48 px: rank `.t-num`, place flag 20 × 15 (or nothing), name in body, score `.t-num` right-aligned, and "paused" in meta after the score when it applies. Hairlines between rows. Your own row has a 2 px ember ring around the flag. Tapping a row expands it in place (B5). |
| **Par row** | No flag, "Par" in Erode, score in mute ink. No line above it. |
| **Fact line** | Body 15 ink plus a meta source, e.g. "World Bank 2023", linked to `/sources#stat`. One line. It replaces the previous line and never stacks. |
| **Map** | SVG from Natural Earth 1:50m admin-0 (public domain), with 1:10m geometry for entities missing at 1:50m [verify coverage of all 243]. Equal Earth projection, antimeridian-wrapped. Paths are projected at build time by `scripts/build-map.mjs`, so there is no runtime projection dependency. Fills per 3.4. Pointer Events pan and pinch, double-tap zooms 2×, plus zoom buttons. The minimum zoom shows the whole world. |
| **Toast** | Ink, paper text, radius 6, bottom centre above the safe area, 2.4 s, enters with a 6 px rise. |
| **Region meter** (Draft) | Five 10 px circles labelled "Af", "Am", "As", "Eu", "Oc" on phones and with full names on desktop, in meta. Reached regions fill ink on twos. Copy: "Seat people from 3 different regions: +6. You have 2." When reached: "3 regions: +6 earned." |
| **Ages meter** (Draft) | One meta line: "Before 1900: done. After 1950: not yet. +6." When reached: "Across the ages: +6 earned." |
| **Next row** | A full-width compact game card: card fill, the game's clay at 56, "Next: GeoWordle" in `.t-h3`, the promise in body, and an ink "Play" at the right edge. Used on results (R9). |
| **Skip layer** | A transparent full-area element over a running sequence (3.7). |

---

## 4. Clay asset and stop-motion inventory

### 4.1 Rules for every asset

**Pipeline.** `clay_icon` and `clay_animation`: a Gemini image, square 1024, Vision cutout.

**Before mass production,** make these small fixes in the generator repo:
1. a per-asset jitter seed
2. trim to the alpha bounding box and re-pad, so the object fills 72% of the box height with its base on a shared floor line 88% from the top
3. 1 px alpha erosion
4. a baked contact shadow: warm-tinted, offset 0/3 px at 512, blur 4, with no all-around bloom
5. AVIF and WebP export at 128, 256 and 512 px
6. a QA contact sheet of each cutout on paper and on ink, beside its raw render
7. an HEVC-alpha export, for social only

**Candidates and approval.** Generate three candidates per object and pick by eye. Approve the eight game objects as one contact sheet before generating anything else.

**Prompt rules:**
- one chunky object, with every part touching the main mass
- counts written as words and never above three
- never the word "bright"
- no light effects, only physical clay changes
- flags always two-tone
- no people or faces, ever

**Animation states.** Each state is an edit of state 1, never of the previous state, so every `change` describes the full difference from state 1.

**Shipping.** Every animation ships as its state stills plus a generated CSS sequence (3.7). The sequence arrays below are the source of truth for that CSS.

**Budgets:**
- Per state: AVIF 12 KB or less and WebP 20 KB or less at 512 px. At 128 px: AVIF 4 KB and WebP 6 KB.
- 150 KB of clay per route, counting only what loads eagerly:
  - the focused card's state 1, which is the LCP image (`fetchpriority="high"`)
  - the six strip stills
  - any outcome still above the fold
- Everything else is `loading="lazy"`, including the other states of non-focused cards and idle states, which load once a card is snapped.

**Shared `extra` strings** (appended verbatim):
- **X1 (grey):** "Colours only off-white, light grey and dark grey clay. One chunky object, every part pressed firmly onto the main body. No text, no numbers, no letters, no people, no faces."
- **X2 (green allowed):** "Colours only off-white, light grey, dark grey and muted dark bottle-green clay. One chunky object, every part pressed firmly onto the main body. No text, no numbers, no letters, no people, no faces."
- **X3 (error edits):** used only inside `change` text as "burnt brick-orange clay"; never in a state 1.

`clay_animation` takes no separate `extra`, so the first state's text is `object` + " " + its extra, put into `object`.

**Per-game state table.** This defines every slot the UI asks for.
- **"In progress"** always uses the rest still; the strip's "3/5" line and H4's live miniature carry the progress.
- **"Done"** is the still the strip and the done card show, whatever the score. It is never a green winner state unless it is money.

| Game | rest | idle (focused card) | done still (strip, H5) | good reveal (header slot) | bad reveal (header slot) |
|---|---|---|---|---|---|
| Country Draft CL-01 | `rest` | `cd-idle` | `coins` | `cd-done` (once, on finishing) | none |
| GeoWordle CL-02 | `rest` | `gw-idle` | `pressed` | `gw-solve` | stays `rest` |
| Pinpoint CL-03 | `rest` | `pp-idle` | `deep` | `pp-drop` per round | `pp-drop` per round (same, so worth is not leaked) |
| Flag Quiz CL-05 | `rest` | `fq-idle` | `furled` | `fq-right`, and `fq-perfect` at 13 | `fq-wrong` |
| Higher or Lower CL-04 | `rest` | `hl-idle` | `level` | `hl-right` | `hl-wrong` |
| Stat Guesser CL-06 | `rest` | `sg` | `slide` | `sg` (same for any result) | `sg` |
| Blind Pick CL-07 | `rest` | `bp-idle` | `flip` | `bp` per placement | `bp` |
| Speed Flags CL-08 | `full` | none | `empty` | timer-driven | timer-driven |

**Rule for R1.** The outcome object (trophy, rosette or hill, 4.4) owns the R1 notch. The game object plays its good reveal or done state in the play header slot. Two objects never share one notch.

### 4.2 Game identity objects

**CL-01 Country Draft: the table.** Plays on the game card, strip, landing hero, play header slot and archive.

- Object: "a round dark grey clay table seen from a high three-quarter angle, with three chunky off-white clay chairs pressed against its rim"
- Extra: X1

```json
{"name":"cd-idle","object":"a round dark grey clay table seen from a high three-quarter angle, with three chunky off-white clay chairs pressed against its rim. <X1>",
 "states":[{"id":"rest"},{"id":"out","change":"the front chair is pulled half a chair-width away from the table and turned slightly outward, its front leg still touching the table rim"}],
 "sequence":[["rest",4],["out",12],["rest",8]]}
{"name":"cd-done","object":"<same as cd-idle>",
 "states":[{"id":"rest"},{"id":"coins","change":"a small stack of three muted dark bottle-green clay coins now sits in the centre of the tabletop"}],
 "sequence":[["rest",2],["coins",22]]}
```

- `cd-done` plays once in the header slot when Country Draft finishes, then holds on `coins`. Coins are money, so green is allowed.
- The object has three chairs on purpose, because counts drift. The cabinet strip always shows five seats.

**CL-02 GeoWordle: pin and magnifier.** Plays on the card, strip, play header and the solve reveal.

- Object: "a chunky dark grey clay map pin in the classic upside-down teardrop shape with a round hole near its top, standing upright, with a thick off-white clay magnifying glass leaning against its side, the handle resting on the ground"
- Extra: X1

```json
{"name":"gw-idle","object":"<object>. <X1>",
 "states":[{"id":"rest"},{"id":"tilt","change":"the magnifying glass leans further forward so its lens covers the top of the pin, its handle still on the ground"}],
 "sequence":[["rest",4],["tilt",12],["rest",8]]}
{"name":"gw-solve","object":"<object>. <X1>",
 "states":[{"id":"rest"},{"id":"pressed","change":"the pin is pushed down into a flat light grey clay slab so only its top half shows, and the magnifying glass lies flat on the slab beside it"}],
 "sequence":[["rest",2],["pressed",22]]}
```

- `gw-solve` plays on a solve. On a loss the object stays at `rest` in the header. The strip's done still is `pressed` either way.

**CL-03 Pinpoint: pin in disc.** Plays on the card, strip, play header and each round's commit.

- Object: "a chunky dark grey clay map pin in the classic upside-down teardrop shape with a round hole near its top, standing upright in the centre of a thick round light grey clay disc"
- Extra: X1

```json
{"name":"pp-drop","object":"<object>. <X1>",
 "states":[{"id":"rest"},{"id":"lean","change":"the pin leans over to one side at a steep angle, its tip still touching the disc"},{"id":"deep","change":"the pin is pushed deep into the disc so the clay of the disc bulges up in a ring around it"}],
 "sequence":[["rest",2],["lean",4],["deep",18]]}
{"name":"pp-idle","object":"<object>. <X1>",
 "states":[{"id":"rest"},{"id":"lean","change":"the pin leans over to one side at a steep angle, its tip still touching the disc"}],
 "sequence":[["rest",6],["lean",6],["rest",12]]}
```

- In play, the map pin itself is an SVG house pin. The clay drop plays in the header slot on every commit, the same for any result.

**CL-04 Higher or Lower: two blocks.** Plays on the card, strip, play header and the reveal.

- Object: "two chunky off-white clay blocks side by side on one flat light grey clay base slab, the right block twice as tall as the left, with a thick dark grey clay arrow shape pointing upward pressed flat into the front face of the right block"
- Extra: X1. Check that the cutout keeps the arrow; the old cv-higherlower lost it.

```json
{"name":"hl-right","object":"<object>. <X1>",
 "states":[{"id":"rest"},{"id":"level","change":"the left block has grown so it is exactly as tall as the right block"}],
 "sequence":[["rest",2],["level",6],["rest",16]]}
{"name":"hl-wrong","object":"<object>. <X1>",
 "states":[{"id":"rest"},{"id":"lean","change":"the right block leans over sideways at a steep angle and rests against the left block, and the arrow pressed into it is burnt brick-orange clay"}],
 "sequence":[["rest",2],["lean",14],["rest",8]]}
{"name":"hl-idle","object":"<object>. <X1>",
 "states":[{"id":"rest"},{"id":"level","change":"the left block has grown so it is exactly as tall as the right block"}],
 "sequence":[["rest",6],["level",6],["rest",12]]}
```

**CL-05 Flag Quiz: two-tone flag.** Plays on the card, strip, play header and the per-flag reveal.

- Object: "a chunky clay flag on a thick dark grey clay pole stuck into a small light grey clay mound; the flag cloth is light grey with one wide dark grey stripe across its middle, its folds soft and thick"
- Extra: X1

```json
{"name":"fq","object":"<object>. <X1>",
 "states":[{"id":"rest"},
  {"id":"wave1","change":"the flag cloth ripples into two big waves and its free end curls upward"},
  {"id":"wave2","change":"the flag cloth ripples the other way and its free end dips downward"},
  {"id":"droop","change":"the flag cloth hangs straight down limp against the pole and its wide stripe is burnt brick-orange clay"},
  {"id":"rosette","change":"a chunky muted dark bottle-green clay rosette is pressed onto the pole just below the cloth"},
  {"id":"furled","change":"the flag cloth is wrapped neatly around the top of the pole and tied with a thin dark grey clay band"}],
 "sequence":[["rest",2],["wave1",2],["wave2",2],["wave1",2],["rest",16]]}
```

| Sequence | Frames | When |
|---|---|---|
| `fq-right` | the flutter above | right answer |
| `fq-wrong` | `[["rest",2],["droop",14],["rest",8]]` | wrong answer |
| `fq-perfect` | `[["rest",2],["wave1",2],["wave2",2],["rosette",18]]` | 13 of 13, in the header slot only |
| `fq-idle` | `[["rest",6],["wave1",4],["rest",14]]` | focused card |
| done still | `furled` | strip, H5 |

**CL-06 Stat Guesser: ruler with pins.** Plays on the card, strip and play header.

- Object: "a chunky off-white clay ruler lying flat, seen from a three-quarter angle, with two light grey clay pins and one dark grey clay pin pressed into its top edge, evenly spaced"
- Extra: X1. If the model adds tick marks or numbers, regenerate.

```json
{"name":"sg","object":"<object>. <X1>",
 "states":[{"id":"rest"},{"id":"slide","change":"the dark grey pin has moved to the far right end of the ruler, while the two light grey pins stay exactly where they were"}],
 "sequence":[["rest",6],["slide",12],["rest",6]]}
```

- `sg` serves as idle and as the per-round reveal (the same for any result). The done still is `slide`.

**CL-07 Blind Pick (practice): fanned cards.** Plays in the practice room, its landing and each placement.

- Object: "three thick off-white clay playing cards fanned out and pressed together at their bottom corners, standing on edge, the front card face down showing a plain dark grey back"
- Extra: X1

```json
{"name":"bp","object":"<object>. <X1>",
 "states":[{"id":"rest"},{"id":"lift","change":"the front card is pushed up by half its height, still touching the other two cards"},{"id":"flip","change":"the front card is turned face up, showing a plain light grey face with three dark grey bars of different lengths pressed into it"}],
 "sequence":[["rest",2],["lift",4],["flip",18]]}
```

- `bp-idle`: `[["rest",6],["lift",6],["rest",12]]`. The done still is `flip`.

**CL-08 Speed Flags (practice): hourglass.** Plays in the practice room, its landing and as the live timer.

- Object: "a chunky clay hourglass with thick dark grey top and bottom caps joined by two thick dark grey pillars, off-white clay bulbs, the top bulb full of light grey clay sand"
- Extra: X1

```json
{"name":"sf","object":"<object>. <X1>",
 "states":[{"id":"full"},
  {"id":"t2","change":"the top bulb is two thirds full of light grey clay sand and a small heap of the same sand sits in the bottom bulb"},
  {"id":"t1","change":"the top bulb is one third full of light grey clay sand and a large heap of the same sand fills half the bottom bulb"},
  {"id":"empty","change":"the top bulb is empty and the bottom bulb is full of light grey clay sand"}],
 "sequence":[["full",6],["t2",6],["t1",6],["empty",6]]}
```

- In play, the state follows the remaining time: 30 to 21 s `full`, 20 to 11 `t2`, 10 to 1 `t1`, 0 `empty`.
- The jitter runs on twos. The visible seconds number is always UI text.

### 4.3 Cabinet job objects

These play in the Country Draft cabinet strip, the job sheet, R1's cabinet strip, R6 and the landing's "the five jobs" rows.

- **States.** Each has `rest` and `squash`. The plop on seating is `[["squash",2],["rest",2]]`, then `rest` holds.
- **Who sits in a seat** is shown by the UI portrait disc, never by clay.
- **The shared squash `change`:** "the object is squashed down to four fifths of its height and spread slightly wider, as if it had just been set down hard".

| ID | Job (full name, line, strip word) | Object | Extra |
|---|---|---|---|
| CL-10 | The Chair: "Leads the country". Leader | "a chunky high-backed off-white clay armchair with short dark grey clay legs and a thick dark grey clay seat cushion" | X1 |
| CL-11 | The Field: "Runs the army". Army | "a chunky dark grey clay soldier's helmet with a wide brim and a thick light grey clay chin strap pressed against its side, resting on the ground" | X1 |
| CL-12 | The Purse: "Runs the money". Money | "a chunky muted dark bottle-green clay coin purse with a thick dark grey clay clasp on top, sitting upright" | X2 |
| CL-13 | The Voice: "Speaks for the country". Voice | "a chunky off-white clay megaphone lying on its side with a dark grey clay mouthpiece and a thick dark grey clay handle pressed underneath it" | X1 |
| CL-14 | The Desk: "Builds and invents". Builder | "a chunky light grey clay cog wheel with thick rounded teeth standing upright in a small dark grey clay base" | X1 |

### 4.4 Outcome and system objects

**Result outcome mapping by game.** The outcome object stands in the R1 notch.

| Game | Trophy CL-20 | Rosette CL-21 | Hill CL-22 |
|---|---|---|---|
| Country Draft | 160+ | 80 to 159 | below 80 |
| GeoWordle | solved in 3 or fewer | solved in 4 to 6 | X |
| Pinpoint | 1,000+ | 600 to 999 | below 600 |
| Flag Quiz | 13 | 9 to 12 | 8 or fewer |
| Higher or Lower | 13 | 9 to 12 | 8 or fewer |
| Stat Guesser | 480+ | 300 to 479 | below 300 |
| Blind Pick | Perfect | +1 to +15 | +16 or more |
| Speed Flags | 25+ | 15 to 24 | below 15 |

**CL-20 Trophy.** Plays in the R1 notch (top band) and the Day complete card's notch.
- Object: "a chunky muted dark bottle-green clay trophy cup with two thick handles on a square dark grey clay base"
- Extra: X2

```json
{"name":"trophy","object":"<object>. <X2>",
 "states":[{"id":"rest"},{"id":"tip","change":"the trophy is tilted a little to the left as if just picked up, one edge of its base still touching the ground"}],
 "sequence":[["rest",2],["tip",4],["rest",4],["tip",4],["rest",10]]}
```

**CL-21 Rosette (mid band).** Still only.
- Object: "a chunky off-white clay rosette medal with a dark grey clay centre and two short thick light grey clay ribbon tails pressed against its bottom edge"
- Extra: X1

**CL-22 Hill with flag (low band; losing is not an error).** Still only.
- Object: "a small rounded light grey clay hill with a tiny clay flag planted on its top; the flag cloth is light grey with one wide dark grey stripe across its middle, on a thick dark grey clay pole"
- Extra: X1

**CL-23 Crate.** Covered means tomorrow, open means archive.
- Object: "a chunky off-white clay crate covered by a thick dark grey clay cloth draped over its top and hanging down its sides"
- Extra: X1

```json
{"name":"crate","object":"<object>. <X1>",
 "states":[{"id":"covered"},
  {"id":"peek","change":"the front corner of the cloth is lifted and folded back, showing the crate's light grey front"},
  {"id":"open","change":"the cloth has been pulled off and lies folded flat beside the crate, and the open top of the crate shows a dark grey inside"}],
 "sequence":[["covered",16],["peek",4],["covered",4]]}
```

- The `peek` loop sits on the tomorrow line of results and the Day complete card, one at a time.
- The `open` still appears on archive pages and on the footer shelf.

**CL-24 Globe.** Plays on the 404, `/sources`, `/about`, offline, the countries index header and the footer shelf (still).
- Object: "a chunky off-white clay globe with light grey clay continents pressed onto it, the Americas facing the camera, on a thick dark grey clay stand with a curved arm"
- Extra: X1

```json
{"name":"globe","object":"<object>. <X1>",
 "states":[{"id":"americas"},
  {"id":"afreu","change":"the globe ball has turned so Africa and Europe face the camera; the stand and arm stay exactly the same"},
  {"id":"asia","change":"the globe ball has turned so Asia faces the camera; the stand and arm stay exactly the same"},
  {"id":"pacific","change":"the globe ball has turned so the Pacific Ocean and Australia face the camera; the stand and arm stay exactly the same"},
  {"id":"cloth","change":"a thick dark grey clay cloth is draped over the top half of the globe ball"}],
 "sequence":[["americas",4],["afreu",4],["asia",4],["pacific",4],["americas",8]]}
```

- The 404 plays the spin. Offline holds `cloth`.
- Country dossiers show the still that faces the country's region. That is allowed, because the page is about that country.
- **Anti-leak:** the globe never appears on a GeoWordle or Pinpoint board before the reveal.

**CL-25 Podium.** Plays on the `/leaderboard` header, the board snippet head in R4 and the empty Countries today state. Still only.
- Object: "three chunky off-white clay blocks of different heights standing in a row and pressed together, the middle block tallest, on a thin light grey clay base slab"
- Extra: X1

**CL-26 Practice stamp.** A small overlay at 40 px (phone) or 56 px (desktop). It overlaps the bottom-left corner of the game's own notch object on practice cards, and stands beside "Practice" in the practice frame header. It is never a second object in a notch.
- Object: "a chunky clay rubber stamp with a round off-white clay handle on top of a thick dark grey clay block"
- Extra: X1

```json
{"name":"stamp","object":"<object>. <X1>",
 "states":[{"id":"rest"},{"id":"press","change":"the stamp is pressed down hard so its dark grey block is squashed slightly wider"}],
 "sequence":[["press",2],["rest",4]]}
```

- Plays once when a practice board is dealt.

**CL-27 Nameplate (practice and reference pages only).** Stands in for a missing portrait outside the daily. The person's name is set over it in Erode as UI text.
- Object: "a chunky off-white clay nameplate block with a slanted front face, plain and blank, standing on a dark grey clay foot"
- Extra: X1

### 4.5 Production order and count

- **Wave 1 (phase 1):** CL-01, 02, 04, 05, 06, 07, 10 to 14, 20 to 26. That is 19 objects and about 48 states, including `furled`.
- **Wave 2 (phase 2):** CL-03, CL-08, CL-27.
- **Total:** 22 objects, about 57 states, about 171 generations with three candidates each.
- **Clay data.** `scripts/build-clay.mjs` registers every asset in `src/data/clay.json`; it is never edited by hand. Each entry holds id, states, sequences, seed, sizes, byte sizes per format (CI fails over budget) and alt.

---

## 5. Game catalog

Every game follows one frame: card, play, commit, reveal, result.

- **Anti-leak.** "Hidden" lists what the client never receives before commit. That includes HTML, RSC flight data, server-action responses and prefetches (5.9).
- **Fact lines** come from the fact engine (8.4). In phases 1 and 2 the engine has only the generated rank-contrast kind. Example lines marked [verify] must be checked against source data before any copy is fixed.
- **Generation rules are never published.** That covers L3, P3, the FAQ and `/about`.

### 5.1 Country Draft (daily, flagship)

**Card copy:**
- Promise: "Draft five famous people. Conquer the world."
- Lines: "Pick a country, then one of its people." / "Give them a job in your cabinet." / "Points show only after you seat them."
- Meta: "About 3 minutes". "Par 140".

**Rules:**
- Five rounds.
- Each round, three countries are offered. You choose one and open it, and it shows three of its people. You seat one of them in one of the five jobs still open.
- Each person scores on two things:
  - **Fit**, 0 to 25: what they actually did that matches the job.
  - **Fame**, 0 to 10: how widely the world knows them.
- Three cabinet bonuses add up to 20. The maximum is 195: one point per country of the world.

**Round structure** (state machine; each step marked "server step" is written once in `run_steps`):
1. `choose-country`: three country cards. The player selects one, then taps "Open [country]" (server step: returns the three people).
2. `people`: three person cards.
3. `holding`: the job sheet is open with one person held. Put back is allowed.
4. `seated`: tapping "Seat …" commits (server step: returns fit, fame and the why line). The reveal plays, and a "Next country" button is pinned.
5. Back to step 1. After round 5, the result renders (R1 with the tally and the conquest map inside it, CD6 and CD7).

**What the player sees before commit:**
- **Country cards:** the flag (its normal named URL; names are on screen anyway), the English short name and the UN region (Africa, Americas, Asia, Europe, Oceania).
  - The three cards are identical in layout and shuffled by seed.
  - No outline map (29 states lack one, and size would hint), no people count, no numbers.
- **Person cards:**
  - portrait disc (uniform greyscale, crop and resolution)
  - name
  - "Active 1796 to 1815" (main activity years, which drive the ages bonus)
  - one identity line, in the person's own terms, never naming a seat
  - Shuffled by seed, never sorted by fame.
- **Identity line rule.**
  - It names the headline identity: "Emperor of the French", "Footballer, Ballon d'Or 1998".
  - People with a single role get general wording ("Banker", "Soldier and statesman"), never a title that names the seat ("Governor of the Bank of Italy", "Field marshal").
  - [measure] If daily seat-choice accuracy on non-crossover people is above 90%, the lines are too explicit and are rewritten.
- **Person detail sheet (CD3):** birthplace, active years, and a second neutral line about the headline role. It never mentions a second career.
- **Job sheet:** all five jobs, always in the same order, each with its clay object, full name and plain line ("The Field, runs the army").
  - Filled jobs are inert and show their occupant's portrait disc, points and fit word.
  - The copy is identical for every person.
- **Meters:** the region meter and the ages meter (3.10). These are the only visible scoring elements, and they are visible on purpose: choosing distant countries and mixing eras are geography and history decisions.
- **Rules text** (public): "Seat people from 3 different regions: +6. Mix the eras, one person active before 1900 and one active after 1950: +6. Every job at least a plausible fit: +8."

**Hidden until commit (anti-leak):**
- **Server only:**
  - a country's people, until that country is opened
  - every fit vector, fame value, why line and the ceiling
  - the other people's worth: names only until midnight, values after (R7)
- **Not on the client:** no archetype, standing, fit word or number in the DOM, data attributes, aria, RSC payload, action response, prefetch or cookie.
- **Not in the public repository.** Fit records, evidence and why lines live in the private `draft_records` table (7.1) and are loaded server side.
- **Same choreography.** The reveal takes the same 900 ms for a 35 and a 4.
- **No undo after a reveal.** "Put back" exists only while holding: closing the sheet, dragging it down or pressing Esc returns the person to the trio. The current `RESULT_REVEAL_MS` undo is removed.
- **Before midnight the result shows only your own five seats.** "Best possible today" and everything about passed-on people's values appear after 00:00.
- **Not in practice.** Practice pools exclude every person on today's board until midnight (1.2).
- **The landing** publishes principles, never the FIT table (8.1 gives the staged removal).
- **Portraits.** The daily pool is portrait-only, so a missing portrait cannot signal obscurity.

**Input:**
- **Phone:**
  1. Tap a country card to select it, then tap "Open France". The CD1 line warns once: "You can't switch after."
  2. Tap a person to open the job sheet.
  3. Tap a job row to select it. The pinned button now reads "Seat Napoleon in The Field".
  4. Tap the button to commit.
  5. Tap "Next country" when ready.

  That is about six taps per round. Every irreversible step has its own labelled button.
- **Desktop:**
  - 1 to 3 selects a country and Enter opens it.
  - 1 to 3 then picks a person, which opens the in-column job panel.
  - 1 to 5 selects a job and Enter seats.
  - Esc puts back. N or Enter goes to the next country.

**Feedback and reveal:**
- The portrait flies from the card to the seat (220 ms, smooth, starting at once).
- The server answers (400 ms p75 or less).
- The seat's clay object plops on twos. The seat's points tick (750 ms) and its fit word appears. The header total ticks.
- The reveal line appears under the strip, in two parts:
  - **Line 1, the number:** "+35 in The Field: natural fit 25, fame 10." The points come first, in Erode.
  - **Line 2, the reason:** "Won most of his pitched battles." [verify wording against source]
- **Fit words:**

  | Fit points | Word |
  |---|---|
  | 25 | Natural fit |
  | 18 | Strong fit |
  | 12 | Plausible fit |
  | 6 | Thin fit |
  | 0 | No fit |

- **Thin and no fit** set the points and the fit words in ember: "+9 in The Purse: no fit 0, fame 9." then "Never held a finance post." Every line pairs the number with words, never colour alone.
- **Meters.** If the country reached a new region, its mark fills on twos. If the era condition changes, the ages line updates.
- **Next round.**
  - The "Next country" button stays pinned until tapped; there is no auto-advance.
  - Round 1's three country cards deal on twos, one per beat, behind the skip layer.
  - Rounds 2 to 5 swap in with a single 2-frame stamp, and person cards no longer stagger.
  - When the next country opens, the previous reveal line is prefixed "Last round:" in mute until a new seat replaces it. Tapping any seated seat re-shows its line.

**Geography fact moment:**
- **Per seat:** the why line, from the person's own record. A second career is named when it is why they scored.
- **At the result (before midnight):** the true totals, "In real life, your five homelands hold 1.9 billion people and 11% of the land, across 4 regions." (computed), plus one generated fact about one of the homelands.
- **After midnight (R7 and the run page):** the best second career among the people you passed on, e.g. "You passed on Paderewski: concert pianist, then Prime Minister of Poland in 1919." [verify]

**Scoring:**
- **Fit per seat, 0 to 25.** Five authored levels per person per seat (25, 18, 12, 6, 0). Each level comes with an evidence line and a source.
  - Example vector (illustrative, pending the contested-fits review): Napoleon Chair 25, Field 25, Desk 18 (Civil Code), Purse 12 (founded the Banque de France in 1800 [verify]), Voice 12.
- **Fame per person, 0 to 10:** `fame = max(4, round(0.5 × B_global + 0.5 × B_country))`.
  - `B_global` is the Wikidata sitelink-count percentile across the daily pool, banded to 0 to 10.
  - `B_country` is the person's rank within their own country's pool, banded to 0 to 10.
  - The floor of 4 and the country blend stop African and Oceanian picks from being a penalty.
  - Frozen per `POOL_VERSION`.
- **Per seat maximum:** 25 + 10 = 35. `check-contracts` asserts that every why-line number is 35 or less.
- **Bonuses:**

  | Bonus | Points | Condition |
  |---|---|---|
  | Full cabinet | +8 | every fit 12 or more |
  | Three regions | +6 | three or more UN regions |
  | Across the ages | +6 | one person with `active_until` 1899 or earlier and one with `active_until` 1951 or later |

- **Total** = the sum over 5 seats of (fit + fame) + bonuses. The maximum is 175 + 20 = 195.
- **Bands:**

  | Score | Band |
  |---|---|
  | 0 to 39 | "A footnote" |
  | 40 to 79 | "A region" |
  | 80 to 119 | "A continent" |
  | 120 to 159 | "Most of the map" |
  | 160 to 195 | "The whole thing" |

  The band is always paired with the conquest caption and the true totals line.
- **Par** is 140, fixed [calibrate].
- **Best possible** is the board ceiling over all country paths and seatings. It is shown after midnight.
- **Rarity:** "12% of today's players seated him in The Field". It is shown only on this device's result, only about the people this device seated, after it finished, and only at 20 or more eligible runs that day (7.3). It never counts toward the score.

**Difficulty and generation** (server; built once per date and edition and stored in `daily_boards`):
- 15 countries per day, 3 per round. Each round's three span at least 2 UN regions. Round 1 includes at least one recognition tier A country.
- The best seats of each trio span at least 2 different jobs.
- Crossover people (best job differs from the headline): a seeded 1 to 3 per board.
- The ceiling is between 160 and 185. The famous-obvious line (always the most famous person in their best open job) is at least 12 below the ceiling.
- A path reaching 3 or more regions always exists.
- **Pool entry:** a country needs at least 4 portrait people with reviewed fits.
- **Minimum daily pool:** 36 countries, every UN region represented by at least 2. Oceania has only Australia and New Zealand until the pool grows.
- **Repeats (phase 1):** no country two days running, and no identical trio on consecutive appearances of the same country.
- **After the pool reaches about 150 countries (phase 3):** no country within 14 days, no identical trio within 30 days, and round 5 offers at least one tier C country.

**Daily vs practice.**
- Practice uses random seeds, the same rules, no board and no name, and never today's daily people (1.2).
- "Draft from [country]" seeds a practice draft whose round 1 includes that country. It exists only for countries with 6 or more portrait people, so three remain after excluding today's daily trio.
- In practice, R7 shows passed-on values at once, because practice never contains today's people. Practice teaches; it does not leak.

**Share:**
```
Countrivo Country Draft 12 Oct
162 of 195, Most of the map
🟩🟨🟩⬜🟩
4 regions
countrivo.com/games/country-draft
```
- The squares are in the order you seated people (round 1 to 5), not in seat order, so a public share never shows which jobs are rich today.
- 🟩 natural fit, 🟨 strong, ⬜ plausible, 🟥 thin or none.
- No names and no countries.

**Edge cases:**
- **Reload mid-round:** resumes from the server's step rows at the same state, including an opened country.
- **Holding state on reload:** returns to `people` (holding is not a server step).
- **Two seats left:** the job sheet still lists five rows; three are inert with occupants.
- **Last round:** only one job is open. The sheet preselects it, and the button reads "Seat [short name] in The Desk".
- **Server timeout during a seat:** the portrait stays in the seat with "Saving" (G7). Re-sending the same step returns the stored reveal. A different action for a written step is refused.
- **Two tabs:** the first commit for a step index wins. The other tab gets the current state and re-renders.
- **Missing portrait:** cannot happen in the daily. In practice, the clay nameplate CL-27 with the name set over it.
- **Names:** a stored `shortName` per figure is used in "Seat …" and "Give … a job". It handles family-name-first, Iberian and Arabic forms, and falls back to the full name.
- **Living people:** allowed in every seat their real record supports. Why lines are factual records, never jokes.

### 5.2 GeoWordle (daily)

**Card copy:**
- Promise: "Find the hidden country in six guesses."
- Lines: "Guess any country." / "Each guess shows how far and which way." / "Neighbours read 0 km."
- Meta: "About 2 minutes". "Par 4".

**Rules:**
- Six rows to find a hidden sovereign country.
- Each guess returns:
  - the distance between the nearest borders (0 km if they touch)
  - a direction arrow (centre to centre, eight directions)
  - a band word
- There is no starter hint. Every board starts equally blind.
- After your second miss you may use the outline clue. It uses one of your six rows.
- **Score** = rows used (1 to 6), or X if not found.

**Round structure:** `guessing` (rows 1 to 6), then `solved` or `lost`, then the bonus (neighbours, capital), then the fact, then the result. Every guess, the clue and each bonus answer is a server step.

**Seen before commit:**
- Your guess rows.
- The mini-map: guessed countries in their fills with ink outlines. The answer is never drawn.
- After miss 2, the control "Outline clue (uses a guess)". The label and confirm copy are identical for every answer, including those that get the subregion-and-size fallback.
- **Hidden:** the answer, its outline, its region, and the distance matrix (server only).

**Input:**
- **Phone:**
  - The search field is pinned above the keyboard, with prefix-ranked suggestions (flag and name) over all guessable entities plus aliases: Holland, Burma, Turkey, Ivory Coast, Swaziland, Czech Republic, East Timor, Cape Verde.
  - You can also tap a country on the mini-map, which opens the confirm row "Guess Kenya".
- **Desktop:** the field is autofocused. Up and Down move through suggestions, Enter guesses and Esc clears.
- **Without JavaScript:** the field uses a `<datalist>` and the form posts to the server action.
- Already-guessed countries are marked "Guessed" in suggestions and cannot be submitted again.
- Territories and partially recognised places with distance data are valid guesses. They are labelled in suggestions ("Territory of Denmark") and never rejected.
- **Entities without distance data** do not appear in suggestions at all until their data exists. That covers Taiwan before phase 2, and Kosovo if the owner approves adding it (section 10). They give no row and no free probe.

**Feedback and reveal:**
- The row slides in at once with the flag and name.
- The distance ticks down from 20,000 km to the true value in 750 ms, the house arrow rotates to its bearing, and the band word appears in ink.
- **Bands** (word, then the map fill per 3.4):

  | Distance | Word | Map fill |
  |---|---|---|
  | 0 km | Touching | ink |
  | 1 to 499 | Burning | ink |
  | 500 to 1,499 | Hot | ink |
  | 1,500 to 2,999 | Warm | mute |
  | 3,000 to 5,999 | Cool | paper |
  | 6,000+ | Cold | paper |

  Every guessed country has a 1.5 px ink outline.
- **On a solve:** `gw-solve` plays in the header, the answer fills ink with its label, and route lines draw from each guess to it.
- **On a loss:** the answer, its outline, flag and name are revealed. The answer is always shown.

**Bonus** (after a solve or a loss; not part of the score):
- Shown as "Bonus 2 of 2", with the copy "Bonus answers are just for you. They don't change your score."
1. **Neighbours.** "Tap every country that borders it." Six flag-and-name tiles mix true sovereign neighbours with nearby non-neighbours.
   - More than 6 sovereign neighbours: the round asks for "any three".
   - No land neighbours: replaced by "Which country is nearest by sea?" with 4 options.
2. **Capital.** "Pick its capital." Four options. Every entry in `capitalsAccepted[]` counts (Bolivia: Sucre or La Paz). Disputed capitals never appear as answers or distractors.
3. **Then the fact.** The country's fact (8.4) with its source.

**Geography fact moment.** The fact card at the end, plus a link to the country's dossier ("More about Bhutan").

**Scoring:**
- Rows used, where the clue counts as a row, or X. The maximum is 6, shown "4/6".
- Ties share a rank.
- Par 4, fixed.

**Clue for outline-poor answers.**
- Applies to the 29 states without an outline (until phase 2) and to atoll states (Kiribati, Marshall Islands, Micronesia, Tuvalu, Maldives, Nauru, Palau).
- The clue box shows "Its subregion and size" instead (e.g. "Micronesia, under 1,000 km²"), behind the same label.

**Difficulty and rotation** (soft weights, never published):
- Answers come from the 195 sovereign states only.
- Recognition tiers weight Monday to Thursday toward A and B, and Friday to Sunday toward B and C.
- No repeat within 45 days.
- The same UN region on consecutive days is down-weighted, not banned.
- Small states (under 5,000 km²) are down-weighted after one in the previous 7 days.

**Practice:** a random sovereign answer, never today's answer, same rules.

**Share:**
```
Countrivo GeoWordle 12 Oct
4/6
⬜🟨🟧🟩
Bonus 2/2
countrivo.com/games/geo-wordle
```
- One square per row: ⬜ cool or cold, 🟨 warm, 🟧 hot, burning or touching, 🟩 solved, ⬛ the row used for the clue.

**Edge cases:**
- **Typo with no match:** "No country by that name. Try another spelling."
- **The same country twice:** prevented in suggestions.
- **Reload:** rows replay from the server's steps without animation.

### 5.3 Pinpoint (daily, new)

**Card copy:**
- Promise: "Five countries. Tap where they are."
- Lines: "No borders, no labels." / "Closer taps score more." / "The last one counts double."
- Meta: "About 2 minutes". "Par 720".

**Rules:**
- Five rounds. A country's name appears; you place a pin on a blank world map and drop it.
- A pin inside the country, or within 25 km of it, scores 200. Otherwise the score falls with distance and with how many countries lie closer to your pin.
- Round 5 counts double. The maximum is 1,200.

**Seen before commit:**
- The country name in `.t-big`, subject to the fit-to-width rule (3.3), and the round pips. Round 5 shows "Counts double" under the name.
- A coastline-only map rendered as one merged land path. There are no per-country paths, ids or titles in the DOM.
- **Hidden:** the answer's geometry. After the drop, the server returns only that round's answer path, distance, count and points.

**Input:**
- **Phone:** tap to place the pin and drag to adjust. Pinch or double-tap to zoom, or use the zoom buttons. Then tap **Drop pin** (pinned, 56 px).
- **Desktop:** click to place; wheel or the buttons to zoom; drag to pan; Enter to drop.
- **Keyboard crosshair mode:** arrows move by 1° (Shift for 0.1°), Enter places, Enter again drops.

**Feedback and reveal:**
- The SVG pin drops in 4 steps on twos, and `pp-drop` plays in the header slot.
- The answer country fills ink with its name.
- A route line draws from the pin to the country's nearest border (400 ms).
- The score line ticks: "Inside. 200." or "640 km away, 2 countries closer to your pin. 108."
- One fact line about the country.

**Scoring:**
- `d` = the great-circle distance from the pin to the answer's nearest border.
- `away` = the number of the 195 **sovereign** states (excluding the answer) whose border is closer to the pin than the answer's border. Territories never count against you.
- `points` = 200 if inside or within 25 km. Otherwise `max(0, min(170 − 30 × away, round(170 × (1 − d / 3000))))`.
- Round 5 × 2.
- Why both terms:
  - The count keeps crowded regions fair: a miss in Europe and a miss in the Pacific are judged by countries passed.
  - The km term stops an empty-ocean pin from scoring well. Unit test: a pin 2,000 km off Chile in the Pacific scores 57, not 170.
- Par 720, fixed [calibrate after two weeks].

**Difficulty:**
- Rounds 1 to 3: area of at least 100,000 km², tiers A or B.
- Round 4: area of at least 10,000 km².
- Round 5: any sovereign state.
- At least three UN regions per board. At most one microstate (under 1,000 km²) per board, and always in round 5.
- No country repeats within 14 days, checked per round band. The generator asserts this and fails loudly instead of relaxing silently; `check-fairness.ts` tests it over 365 simulated days.

**Practice:** random, never today's countries.

**Share:**
```
Countrivo Pinpoint 12 Oct
914 of 1,200
🟩🟨🟩🟧🟩
countrivo.com/games/pinpoint
```
- Squares by round points (before doubling): 🟩 200, 🟨 120 to 199, 🟧 50 to 119, ⬜ below 50.

**Edge cases:**
- **Antimeridian countries** (Fiji, Kiribati, Russia): the map wraps and distance uses the shortest geodesic.
- **Pin in the ocean:** valid, and scored by the formula above.
- **Drop with no pin:** the button is disabled and reads "Tap the map to place your pin".
- **Before hydration:** the static map is in the first HTML; interaction starts on hydration.
- **Without JavaScript:** the map shows with one line under it: "Pinpoint needs JavaScript to place a pin." plus a link to today's other games.

### 5.4 Flag Quiz (daily)

**Card copy:**
- Promise: "Ten flags. Name them."
- Lines: "Four names per flag." / "It gets harder as you go." / "The last three count double."
- Meta: "About 90 seconds". "Par 9".

**Rules.**
- Ten flags of sovereign states, with four names each, from easy to hard.
- Flags 1 to 7 score 1 point each. Flags 8 to 10 (lookalikes) score 2 each. The maximum is 13.

**Seen before commit:**
- The flag at up to 320 px wide, in its true aspect ratio inside a fixed 3:2 box, so the layout never shifts.
- Four option rows in seeded order, and the pips 1 to 10.

**Hidden:**
- The correct index (server only).
- **The question image is never the named flag file.** It is served from a per-slot URL, `/q/{HMAC(secret, dateKey|edition|index|run_id)}`.
  - It answers only while that step is open on that run, with `Cache-Control: private, no-store`, and returns 404 after.
  - It is a WebP raster at 2× with a per-run sub-pixel offset, so its bytes never match any flag file elsewhere on the site.
  - `alt=""`, no `title`.

**Input:**
- **Phone:** tap an option. The tap is the commit; the card says "Four names per flag."
- **Desktop:** keys 1 to 4. Enter or Space continues early.

**Feedback and reveal:**
- The chosen row fills ink (right) or ember (wrong). The correct row gets an ink outline and a check.
- The clay flag flutters (right) or droops (wrong) in the header slot.
- One family line: "Chad and Romania: almost the same three bands. Chad's blue is darker." [verify]
- The reveal holds 1.2 s, then advances; a tap skips ahead. New options ignore input for 300 ms.

**Scoring.** Points of 13. No time element. Equal scores share a rank. Par 9.

**Difficulty:**
- **Flags 1 to 3:** the answer is tier A. All four options are the same recognition tier as the answer and come from four different subregions. `check-contracts` asserts that the answer is never the unique odd one out by tier or by distance to the other options.
- **Flags 4 to 7:** the distractors come from the same subregion as the answer.
- **Flags 8 to 10:** true lookalike sets from an authored list, scored by palette distance plus layout class [verify list]:
  - Chad and Romania
  - Indonesia and Monaco
  - Ireland and Côte d'Ivoire
  - Slovenia, Slovakia and Russia
  - Australia and New Zealand
  - Norway and Iceland
  - Senegal and Mali
- **Rotation:** no answer flag repeats within 21 days, and no lookalike set within 3 days.
- Distractors are always the same kind as the answer (sovereign states only). Territories appear only in practice with "Include territories".

**Practice:** random, never today's answer flags, with an optional "Include territories" switch in the practice frame.

**Share:**
```
Countrivo Flag Quiz 12 Oct
11 of 13
🟩🟩🟩🟩🟩🟩🟩🟥🟩🟩
countrivo.com/games/flag-quiz
```

**Edge cases:**
- **Double tap:** the first tap commits. The second is ignored until the next flag has been on screen for 300 ms.
- **Flags with unusual ratios** (Nepal, Switzerland, Vatican): centred in the 3:2 box, with the edge ring hugging the flag.

### 5.5 Higher or Lower (daily)

**Card copy:**
- Promise: "Ten calls on one number."
- Lines: "Is the next country higher or lower?" / "A wrong call doesn't end it." / "Today: population."
- Meta: "About 90 seconds". "Par 9".

**Rules:**
- One stat per day. Eleven countries form a chain.
- Each call compares the left country with a new right one. After the reveal, **the right country becomes the next left card**, whether you were right or wrong. The left value moves up and down, never only upward.
- Ten calls. Calls 1 to 7 score 1 point, calls 8 to 10 score 2. The maximum is 13.

**Seen before commit:**
- The left card: flag, name, value with unit and year, and the stat icon.
- The right card: flag, name, and a value slot showing "?" as an Erode numeral placeholder.
- From call 8, the meta "Counts double".
- **Hidden:** the right value. The server returns it after the call.

**Input:**
- **Phone:** two full-width 56 px buttons, "Higher" and "Lower", each with a rotated house arrow. The tap is the commit.
- **Desktop:** the Up arrow or H for Higher, the Down arrow or L for Lower.

**Feedback and reveal:**
- The right value ticks in over a fixed 900 ms whatever its size. Then the verdict: "Right" in ink or "Wrong" in ember.
- The clay blocks play `hl-right` or `hl-wrong`.
- One generated line from the data, with the same source year: "Mongolia: 3.48 million. Uruguay: 3.39 million." Never typed by hand.
- The right card slides to the left position (260 ms smooth) and the next challenger arrives. The new buttons ignore input for 300 ms.

**Scoring.** Points of 13. Par 9.

**Difficulty:**
- The seeded generator picks each challenger along the chain to meet two targets:
  - **Rank-gap ladder:** call 1 has a gap of at least 80 ranks; call 10 a gap of 3 to 8.
  - **Direction balance:** across the ten calls, "higher" is the answer 4 to 6 times, with no run of more than 3 in a row.
- `check-contracts.ts` asserts both per board over 365 seeds.
- Pairs closer than 3% in value are excluded.
- **Eligible stats** have at least 180 sovereign entries and no caveat flag: population, area, GDP, GDP per person, life expectancy, urban share, internet use, forest share and fertility. Tourist arrivals are excluded (163 sovereign entries).
- Ranks are recomputed over sovereign states only.
- **Rotation:** the same stat not within 6 days, and the same pair never within 60 days.

**Practice:** endless and sudden death on any eligible stat, never today's (country, stat) pairs. The streak is the score.

**Share:**
```
Countrivo Higher or Lower 12 Oct
11 of 13 on population
🟩🟩🟩🟩🟥🟩🟩🟩🟥🟩
countrivo.com/games/higher-or-lower
```

**Edge cases:**
- **Equal values after rounding:** cannot occur, because of the 3% rule.
- **Very large values:** formatted as "3.48 million" or "1.43 billion", with "km²" and "%" units.

### 5.6 Stat Guesser (daily)

**Card copy:**
- Promise: "Guess five numbers about the world."
- Lines: "Slide the pin to your guess." / "Two well-known countries are marked for scale." / "The last round counts double."
- Meta: "About 2 minutes". "Par 300".

**Rules.** Five rounds. Each round is one country and one stat. You drag a pin along a ruler on which two reference countries are already marked, then lock it.

**Seen before commit:**
- The country (flag and name), the stat with unit and year, and the ruler.
- **Two fixed reference countries per stat.** They are the same every day and authored in `src/content/stat-anchors.ts`: tier A countries near the stat's 25th and 75th percentiles, e.g. population: Kenya and Germany [verify which pair sits closest to those percentiles]. They never depend on the answer, and a reference country is never asked about its own stat.
- Your live value in `.t-big` above the pin ("about 84 million").

**Hidden:** the true value.

**Rulers:**
- **Magnitude stats** (population, area, GDP, GDP per person): a log ruler from the sovereign minimum to the maximum. The pin snaps to 1, 2 and 5 steps on each decade, with fine steps in between.
- **Percentage stats** (urban, internet, forest): a linear ruler from 0 to 100 that snaps to 1.
- Rounds 1 to 3 are magnitude stats. Rounds 4 and 5 can be either.

**Input:**
- **Phone:** drag the pin. The 44 px knob sits below the ruler, so the thumb never covers the value. Then tap **Lock it**.
- **Desktop:** drag, or use the arrow keys (Shift for a fine step), then Enter.
- **Without JavaScript:** a number field with a unit, posted as a form.

**Feedback and reveal:**
- The true marker drops onto the ruler on twos. The route line joins your pin to it.
- The gap prints as "1.4 times too high" or "6 points too low", and the points tick in.
- Three nearby countries appear on the same ruler for context, e.g. "and Kenya is here" (computed).
- After commit only, a personal comparison may appear, using the request's geo country: "That is 7.6 times Germany."

**Scoring:**
- **Magnitude:** `round(100 × max(0, 1 − |log10(guess / actual)|))`. It is symmetric: 10 times off either way scores 0, and 2 times off scores 70.
- **Percentage:** `round(100 × max(0, 1 − |guess − actual| / 25))`.
- Round 5 × 2. The maximum is 600.
- Par 300, fixed.

**Difficulty:**
- Round 1 is population for a tier A country. Round 5 is a less familiar stat for a tier B or C country.
- Stats need at least 180 sovereign entries and no caveat. No microstate under 100,000 people in round 1.
- **Rotation:** no (country, stat) pair within 60 days.

**Practice:** random, never today's pairs. It may include the beer, coffee and wine stats, labelled "among countries with data".

**Share:**
```
Countrivo Stat Guesser 12 Oct
412 of 600
🟩🟨🟩⬜🟩
countrivo.com/games/stat-guesser
```
- Squares by round points (before doubling): 🟩 80 or more, 🟨 50 to 79, ⬜ below 50.

**Edge cases:**
- **Lock without moving:** allowed. The pin starts at the ruler's centre, which is unrelated to the answer.
- **Negative values:** none in eligible stats (inflation is excluded).

### 5.7 Blind Pick (practice; interim daily in phase 1)

- **Rules.** Six countries arrive one at a time, and six stats wait. Put each country on the stat where it ranks highest among sovereign states, without seeing who comes next.
- **Seen before commit:** the arriving country (flag, name, region) and the six stat slots, each with its icon and label.
- **Hidden:** the country's ranks and the countries still to come.
- **Reveal.** The slot flips (`bp` on twos) to "#12 of 193" with a tier word: "Top 10", "Top 50", "Middle" or "Bottom half".
- **Scoring.** Golf: "Perfect" or "+N", where N is your sum of ranks minus the optimal assignment's sum. The result overlays your board on the perfect one and lists the swaps that would have fixed it.
- **Stats.** Only those with at least 180 sovereign entries. Wording is "most" or "largest", never "best". No caveated stats. The gap between the greedy and optimal lines is at least 8.
- **Input.** Tap a slot to place; the tap is the commit, and the card says "Tap a stat to place the country." Desktop: keys 1 to 6.
- **Layout.** Two columns of three slots on phones; one row of six on desktop.
- **Share (practice):** "Countrivo Blind Pick practice: Perfect" or "+14", plus the URL.

**Interim daily** (phase 1, slot 3, until Pinpoint launches). The same rules as above, plus:
- `sort_value = −over` (higher is better)
- outcome bands per 4.4
- Par "+10" (fixed)
- minimum duration 10 s
- each placement is a server step
- no repeat of the same six countries within 30 days

Result: R1 shows "Perfect" or "+6 over perfect" in `.t-score-xl`, and R6 shows the overlay and swaps.

Share:
```
Countrivo Blind Pick 12 Oct
+6 over perfect
🟩🟩🟨🟩⬜🟩
countrivo.com/games/blind-pick
```
Squares: 🟩 the placement matches the optimal assignment, 🟨 within 10 ranks of its optimal rank, ⬜ otherwise.

### 5.8 Speed Flags (practice)

- **Rules.**
  - 30 seconds. Each flag has two names; the distractor comes from the same subregion or a lookalike set.
  - The score is the number right. A wrong answer costs 3 seconds and moves on.
  - New flags ignore input for 150 ms.
- **Why the penalty.** Without it, random fast tapping (about 40 right) beats real knowledge (about 30).
- **Timer.** The hourglass (CL-08) plus the seconds in `.t-score`. The last 5 seconds turn ember. A penalty shows "−3 s" in ember beside the seconds for 600 ms.
- **Input.** Tap, or keys 1 and 2.
- **Reveal.** A 300 ms ink or ember fill, then the next flag.
- **End.** The time-up state shows the result with "Best on this device: 23" (from a local cookie) and the outcome object per 4.4.
- **Share:** "Countrivo Speed Flags practice: 21 in 30 seconds".

### 5.9 Shared anti-leak and integrity rules (all games)

1. **Secret seed.**
   - Daily boards use `seed = HMAC-SHA256(BOARD_SECRET, slug|dateKey|edition)`.
   - Practice uses `HMAC(BOARD_SECRET, "p:"|nonce)`.
   - `BOARD_SECRET` lives only in the Vercel environment.
   - `src/lib/daily-seed.ts` keeps the PRNG (mulberry32), but no longer derives seeds from public inputs.
2. **Private solution data.**
   - Draft fit records, evidence and why lines live in the private `draft_records` table and are loaded server side.
   - The answer rotation state (recent answers per game) lives in `daily_boards`.
   - The public repository holds only identity data (names, active years, headline lines, portraits) and public datasets.
   - CI fails if a solution-bearing file is tracked in git.
3. **Board snapshots.** Each daily board is built once and stored in `daily_boards`, with `engine_version` and `pool_version`. Every surface that shows a past board reads the snapshot and never rebuilds it.
4. **Split modules.** Each module exports `publicBoard(board)`, which is shipped, and `solution(board)`, which stays on the server. `reduce` runs on the server for both daily and practice runs: one path.
5. **Steps are written once.**
   - Each daily commit is a server action that inserts `run_steps(run_id, step, action)` with `unique(run_id, step)`.
   - The reveal is returned only from a successful insert.
   - Re-sending the same step returns the stored reveal. A different action for a written step is refused with the current state.
6. **No values on the client before commit.** None in the DOM, `data-*`, aria, alt, title, RSC flight payloads, server-action responses, prefetches, cookies, filenames or SVG ids.
   - Options are identical in markup and shuffled by seed.
   - Links into play and result routes use `prefetch={false}`.
   - A step's action response is asserted to contain only that step's reveal keys.
7. **Fixed durations** for every reveal and count-up.
8. **Per-slot question flags** for Flag Quiz (5.4). Named flags elsewhere keep their stable URLs.
9. **No undo after a reveal.**
10. **Archive date guard.** The server returns 404 for any `?date=` greater than or equal to `getTodayDateKey()`. A contract test requests today's and tomorrow's dates.
11. **Practice exclusion** of today's daily content until midnight (1.2).
12. **Leak check in CI.** `scripts/check-leaks.ts` drives 30 seeds per game through every pre-commit state. It captures:
    - the first HTML
    - RSC flight responses (`text/x-component`)
    - every server-action response body
    - prefetch requests and image bodies

    It greps for solution tokens (ISO codes, names, values, indices, fit numbers) of steps not yet committed, and fails CI on a hit.
13. **Server day key** for everything.
14. **Replay and timing before storing.** A finished daily is replayed from its step rows against the snapshot's solution. Minimum durations are measured between the first and last server commit timestamps (section 7).

---

## 6. Pane inventory

Every pane uses one template. IDs are stable and are used in code comments and tickets.

> **ID Name** `route`
> Purpose · Phone · Desktop · Elements and copy · Interactions · In and out · Animation · Edge states

Fields that do not apply are left out. "Desktop" is always given, even when it is "as phone in the 720 column".

### G. Global shell

**G1 Header** (every route)
- **Purpose.** Identity, streak and the way to the leaderboards.
- **Phone.** 52 px tall (48 in small-height mode), on paper.
  - Left: the wordmark `.t-wm`, with a 20 px gutter.
  - Right: the flame icon with the streak number in `.t-num` (dynamic routes, streak of 2 or more), then the board icon with the label "Leaderboard". Each is a 44 px target.
- **Desktop.** 64 px tall. The wordmark sits at the left of the 1200 container. On the right: "World", "Practice", "Leaderboard" as system 15 links, then the flame.
  - The bar is plain paper. It is "treated" by its strict alignment to the card column and by the live flame.
- **Elements.** The flame is the burning house flame (existing `flame.css`), shown only when there is a number to show. On the leaderboard route, "Leaderboard" is ink at weight 600; elsewhere it is ink 400.
- **Interactions.** The wordmark goes to `/`. The flame goes to `/about#streak`. Leaderboard goes to `/leaderboard`.
- **In and out.** Static. It never hides on scroll.
- **Animation.** The flame burns. On the first result of the day, the streak number ticks once on twos.
- **Edge states.**
  - Streak of 0 or 1, or a static route: no flame at all.
  - Inside play, P1 replaces it.

**G2 Today strip** (`/`, and `/practice` as a variant)
- **Purpose.** The day at a glance and quick navigation.
- **Phone.** 76 px tall (60 in small-height mode; not rendered below 520 px of height). Six items at 58 px across 348 px. Clay at 44 px (36 in small-height mode), then the state line at 12 px in mute.
- **Desktop.** 88 px tall, centred, 640 px wide, clay at 56.
- **Elements.**
  - Each item is an `<a href="#card-[slug]">` with:
    - the clay still for this device's state (rest, or the done still from 4.1)
    - the state line: nothing, "3/5", or the score in `.t-num` ink
    - an accessible name such as "GeoWordle, played, 4 of 6"
  - The focused item has the 2 px ink bar beneath it.
  - There is no seventh slot.
- **Interactions.** Tapping an item moves the deck to its card. Keyboard: Tab into the strip, then the arrow keys.
- **In and out.** Static. The focus bar slides over 220 ms.
- **Animation.** When a game finishes, its object swaps to its done still on twos. No idle loops in the strip.
- **Edge states.**
  - **Full set:** every item shows its done still and score, and the focus bar is hidden while H7 is the snapped card.
  - **Practice variant:** all eight games with no state, 464 px wide. On phones it scrolls inside itself, with the next item peeking at the edge.

**G3 Footer: the shelf** (every route except play)
- **Purpose.** Secondary navigation and legal, composed as part of the table rather than a link grid.
- **Phone.**
  - The page steps down onto a shelf: a card-fill band with 12 px radius on its top corners and the plinth notch mirrored at its top-left.
  - In the notch stand the open crate CL-23 and the globe CL-24, at 64 px each, rising above the edge.
  - Inside, 24 px padding, three sentences in body 15. Links are ink with a static 1 px underline, never animated:
    - "Play [today's games], [practice], or open [the archive]."
    - "Read about [countries], [stats] and [lists], and [the sources] behind them."
    - "[How Countrivo works], [credits], [privacy], [terms], [imprint] and [support]."
  - Then a meta line: "Free daily geography games. No accounts. New boards at midnight Berlin time." and "© 2026 Countrivo".
- **Desktop.** The shelf spans the 1200 container. The notch holds the two objects at 120 px. The three sentences sit in a 680 px column, aligned with the card above, in body 17. The meta lines follow in the same column.
- **Interactions.** Links only. Each link is a 44 px tall target by line-height and padding.
- **Edge states.** None. The shelf is the one deliberate hard colour step on the page.

**G4 Toast**
- **Purpose.** Confirmations that need no decision.
- **Phone.** Bottom centre, 16 px above the safe area.
- **Desktop.** Bottom centre of the play column, or of the viewport outside play.
- **Copy:**
  - "Copied. Paste it anywhere."
  - "You're on the leaderboard."
  - "Name changed."
  - "Taken off the leaderboard."
  - "Thanks. We'll look at that name."
  - "This device is forgotten."
- **Animation.** 2.4 s, with a 6 px rise in. `aria-live`.
- **Edge states.** A new toast replaces the current one.

**G5 Sheet container**
- **Purpose.** Hosts every sheet.
- **Phone.** A bottom sheet with a drag handle, the 45% scrim, at most 88% of the height, and the primary button pinned.
- **Desktop.** Per 2.6. Country Draft's job panel sits in the column; other sheets are a 400 px panel docked to the viewport's right edge over `scrim-light`, with a close icon at the top right.
- **Interactions.** It closes with a drag down, a scrim tap, Esc or the close icon. Focus is trapped while open and returned on close.
- **In and out.** A 220 ms slide on `--ease-out`. Under reduced motion it appears in place.

**G6 Midnight rollover banner**
- **Purpose.** Tell a tab left open past 00:00 Berlin that new boards exist.
- **Trigger.** A server action response or a navigation after midnight reports a new day key.
- **Phone.** Full width, card fill, 52 px tall, between the header and the strip. "New boards are out." and an ink button "See today's".
- **Desktop.** The same, in the 1200 container. The button sits at the right of the 680 card column.
- **Interactions.** The button reloads `/`, or the current landing.
- **Edge states.** If a run is in progress, P6 handles it instead.

**G7 Commit retry state** (any board)
- **Purpose.** A server round trip failed.
- **Phone and desktop.** Inline under the committed element.
  - The optimistic committed state stays visible with a mute "Saving" mark.
  - After 4 s, or on an error: "Couldn't reach the server." and a "Try again" button (control style, ink text on card fill).
- **Interactions.** Try again re-sends the same step. The server returns the stored reveal if the step was in fact written. After 3 failures, a line is added: "Your run is saved. Come back later today."
- **Edge states.** In the iOS app with no network, it shows the same copy; X4 is only for a failed app launch.

**G8 Reroll notice** (after an admin edition reroll)
- **Purpose.** Honesty when a broken board was replaced.
- **Phone and desktop.** One meta line on the affected card, the play header and that game's leaderboard: "Today's board was replaced at 09:14 because of an error. Runs on the first board are ranked separately."
- **Behaviour.**
  - Finished runs on the old edition keep their own ranked list, the "First board" tab in B1.
  - Unfinished runs restart on the new board: their steps are deleted and the run's edition is updated.

**G9 Place sheet** (opened from R2's "Change")
- **Purpose.** Pick or remove the place flag shown beside your name.
- **Phone.** A G5 sheet titled "Your place" in `.t-h3`.
  - A search field: placeholder "Search places", prefix-ranked like GW2.
  - The list of all entities in five region groups plus "Other places", in 48 px rows (flag 20, name).
  - A first row "No place" with no flag.
  - The current place carries a check icon.
- **Desktop.** The right-edge panel.
- **Interactions.** Tapping a row selects it and closes the sheet. The R2 row updates; nothing is submitted yet.
- **Edge states.** No match: "No place by that name."

**G10 Share fallback sheet**
- **Purpose.** The only on-screen view of the share text, shown only when native share and clipboard have both failed.
- **Phone.** A G5 sheet titled "Copy your result". The text sits in a read-only multi-line field with monospaced alignment avoided (system body). A "Copy" ink button is pinned. The meta line reads "Select the text and copy it if the button doesn't work."
- **Desktop.** The right-edge panel.
- **Interactions.** Copy retries the clipboard. The field selects all on focus.

**G11 Skip layer**
- **Purpose.** Lets players skip sequences without mis-taps (3.7).
- **Phone and desktop.** Invisible. It covers only the area of the sequence that is running.
- **Interactions.** The first tap or key ends the sequence and removes the layer.

### H. Home

**H1 Home, first visit** `/`
- **Purpose.** Get a stranger playing in one tap.
- **Phone.** G1, G2 (all items at rest), then the deck opened on Country Draft (H3) with the GeoWordle card peeking. Under the deck, the hint line "Swipe for the next game" in meta. Below the fold: H8, then G3.
- **Desktop.** G1, G2, then the stage with Country Draft centred, GeoWordle peeking on the right and the arrow buttons. Below the fold: H8, then G3. There is no hint line, because the arrows show the way.
- **Interactions.** Play on the card. Swipe or the arrows change the card.
- **Animation.** The focused card plays its idle every 8 s. The peek nudges once after 2 s untouched (phone only, once per day).
- **Edge states.** The hint line is rendered only when the request had no `cv_d`, so it is the server's final state on this visit and is never added or removed after load.

**H2 Home, returning** `/`
- **Purpose.** Show today's progress and the next thing to play.
- **Phone and desktop.** As H1, except:
  - the deck follows the 2.3 order rule
  - the strip shows states
  - there is no hint line
- **Edge states.**
  - All done: H7 is first.
  - A run in progress and last touched: its H4 card is first.
  - After "Forget this device": the next request has no `cv_d`, so home renders as H1, with no flame.

**H3 Game card, unplayed** (deck, landing hero, games index)
- **Purpose.** The game's front door.
- **Phone.** 322 px wide × the card height (2.3), card fill with the notch.
  - Clay box 104 stands in the notch. Content padding 20.
  - Title `.t-card` at the top left, inside its 158 px clear box, two lines at most.
  - Promise in body 17 ink.
  - Three lines in body 15 mute, 8 px apart, with no numbers or bullets. In small-height mode only the first two lines show.
  - A meta row at the bottom left: "About 3 minutes" and "Par 140" as two meta spans 16 px apart.
  - Play: ink, the paper label "Play", 112 × 44, overlapping the bottom-right edge.
- **Desktop.** 680 px wide × the card height (2.4). Clay box 200. Title at 44 px in its 408 px clear box. The text column is 340 px wide and holds at most 46 characters per line. The right half holds the empty-board preview (2.4).
- **Interactions.** Play, or a tap anywhere on the card, goes to `/games/[slug]/play`. Desktop: Enter on the focused card, or a click anywhere on it.
- **In and out.** It morphs into the board where view transitions are enabled (3.7); otherwise it is a plain navigation.
- **Animation.** Idle on the focused card only.
- **Edge states.** Long titles such as "Higher or Lower" fit in two lines at 32 px; the fit-to-width rule applies (3.3).

**H4 Game card, in progress**
- **Purpose.** Resume.
- **Phone and desktop.** As H3, with these changes:
  - The promise line is replaced by a miniature of the live state. For Country Draft that is the cabinet strip at 28 px showing 2 of 5 seated with their points. For the other games it is the pips plus the running score.
  - Meta: "Round 3 of 5".
  - The button reads "Continue".
  - The clay shows its rest still.
- **Edge states.** If the run's day has closed, opening it shows P6.

**H5 Game card, done**
- **Purpose.** The result at a glance, plus what to do next.
- **Phone.** The card with:
  - the game object's done still in the notch (4.1)
  - the title
  - the score in `.t-score-l` ("158 of 195") and the band or verdict word in body
  - meta: "Par 140" and, if 20 or more eligible runs exist, "Better than 71%"
  - the bottom-right ink button "See result", overlapping the edge
  - at the bottom left inside the card, the text action "Practice board" (control style, ink text, no fill)
- **Desktop.** As phone, at 680 px. The right half shows the device's own finished board in miniature (Draft: the five seated discs and points; GeoWordle: the rows) in place of the empty preview.
- **Interactions.** "See result" goes to `/games/[slug]/play`, which renders the result. "Practice board" goes to `?mode=practice`.

**H6 Peeking card**
- **Purpose.** Shows there is more; it is itself a target.
- **Phone.** 38 px of the next card, including part of its clay object.
- **Desktop.** 120 px of the next card at 88% scale, clipped by the container edge.
- **Interactions.** A tap moves the deck to that card. It never starts play.
- **Edge states.** On the last card there is no peek; the deck ends.

**H7 Day complete card: Today's atlas**
- **Purpose.** Close the day well, and bring the player back tomorrow.
- **Phone.** The same card silhouette, with the trophy CL-20 in the notch.
  - Title "Full set".
  - **From phase 2:** a world map 290 px wide. Every country this device met today is filled mute; homelands and answers are ink. One computed fact connects two of them: "You met Chile and Norway today: both longer than they are wide by more than ten to one." [verify]
  - **In phase 1:** no map; the fact line only.
  - Six rows (36 px each): clay at 28, game name, score in `.t-num`.
  - "New boards in 7 h 12 min" in meta, with ember numerals, and the crate CL-23 `peek` loop beside it.
  - The primary ink button on the card edge: "Share my day".
  - Inside the card at the bottom left, the text action "Practice while you wait", which goes to `/practice`.
- **Desktop.** At 680 px. The map is 400 px wide on the left, the rows on the right, with the same actions.
- **Edge states.** A partial day never shows H7.

**H8 Below the deck**
- **Purpose.** An indexable intro, proof of life, and yesterday's pull.
- **Phone.** Three blocks aligned to the card column. Each opens with plain content, never a kicker:
  1. **"Today on Country Draft"** in `.t-h3`, for the focused game. It shows Par and every named entry up to 10 (board rows), with the Par row in place. With no names it shows Par and the line "No names yet today. Finish Country Draft and put yours next to Par." Then "See the leaderboard".
  2. **"Yesterday's answers"**: one row per game, e.g. "GeoWordle: Bhutan" or "Country Draft best: 184". Each links to that landing's L4.
  3. **The intro paragraph** (indexable): "Countrivo is six short geography games, new every day at midnight Berlin time. Everyone gets the same boards. No accounts: finish a game and put your name on the leaderboard if you like."
- **Desktop.** At 680 px under the stage, blocks stacked with 32 px between them.
- **Interactions.** Block 1 follows the snapped card through a small client effect (`scrollsnapchange`, with an IntersectionObserver fallback).
- **Edge states.**
  - Before hydration and without JS, block 1 shows the first card's game, which is the opening card, so the first HTML is final.
  - First day: "Yesterday's answers" reads "Answers appear here every day after midnight."

### L. Game landings

Landing order: L1 card, L3 How it works, L2 Today on this game, L4 Yesterday's answers, L5 FAQ, L6 More games, L7 Archive link, then G3.

**L1 Landing hero** `/games/[slug]`
- **Purpose.** Rank in search and get the visitor playing in one tap.
- **Phone.** G1 (no strip), then the H3 card for this game. The card title is the page's `<h1>`, styled `.t-card`. Directly under the card, the meta line "Free, no account. New board every day."
  - Card height `clamp(360px, 100svh - 166px, 540px)`, so Play is visible at 375 × 553 and 320 × 568.
- **Desktop.** The stage holds only this card, centred, with its empty-board preview. No deck and no arrows.
- **Elements.** As H3. For Country Draft the H1 text stays "Country Draft", and the document title stays "Country Draft: Draft 5 People, Conquer 195 Countries".
- **Interactions.** Play goes to `/games/[slug]/play`. The play route decides between a new daily, resuming, or showing the result, so the landing stays static.
- **In and out.** Morph or plain navigation into the board.
- **Edge states.** Practice-only games (Blind Pick, Speed Flags) show the practice card with the stamp overlay and the button "Play practice".

**L2 Today on this game**
- **Purpose.** Proof of life without inflating it.
- **Phone.**
  - "Par today: 140" in `.t-score`, with the meta "Par is a good score for this game. Beat it."
  - Every named entry up to 10, as board rows, with the Par row in place.
  - With no names: "No names yet today. Finish the board and put yours next to Par."
  - With 100 or more eligible finishes: "1,204 boards finished today."
  - "See the leaderboard".
- **Desktop.** The same in the 680 column.
- **Rendering.** Static, revalidated on demand: `revalidateTag("board:[slug]")` runs when a name is submitted, changed or removed, and at 00:00. No viewer state, so there is no "you" ring here.

**L3 How it works**
- **Phone.** Three short paragraphs of principles in body 17.
  - For Country Draft, five compact rows follow (clay 40, full job name in `.t-h3`, line in mute).
  - **Country Draft copy:** "Every person is scored on what they actually did in their life, and on how widely they are known. A general fits The Field, a central banker The Purse. Many famous people had a second career: that is where the points hide. You never see points before you seat someone. Par is 140, a good score for this game."
- **Desktop.** Paragraphs in the 680 column. For Country Draft, the five jobs as one row of five at 72 px clay, each with its name and line.
- **Edge states.** No tables, and no generation rules.

**L4 Yesterday's answers**
- **Purpose.** Fresh daily indexable content, and the reason to come back.
- **Phone and desktop (680 column).** Per game, from yesterday's `daily_boards` snapshot:
  - **Country Draft:** the five countries offered per round, the best cabinet's five names and its total, and the best possible score. Why lines are not published here until the pool reaches about 150 countries, so regulars cannot memorise a small pool's fits.
  - **GeoWordle:** the country, its outline and its fact.
  - **Pinpoint:** the five countries.
  - **Flag Quiz:** the ten flags with names.
  - **Higher or Lower:** the stat and the eleven countries with values.
  - **Stat Guesser:** the five questions with answers.
- Each country links to its dossier.
- **Edge states.** First day after relaunch: "Yesterday's board was the first one. Answers appear here every day after midnight."

**L5 FAQ**
- **Phone and desktop.** Six to eight questions and answers per game, as `<details>` elements, with FAQPage JSON-LD.
- Existing ranking copy is kept and updated to cover:
  - no accounts
  - how scoring works, in principles
  - what Par means
  - when boards reset
  - how the leaderboard works and what it can promise (1.8)
- No mention of tables, Friends, sign-in or generation rules.

**L6 More games**
- **Phone.** "More games" in `.t-h3`, then the other games as Next rows (3.10) linking to their landings.
- **Desktop.** The same rows in a 2-column grid within 1200, with equal heights and Play anchored right.

**L7 Archive link**
- **Phone and desktop.** One row with the open crate still at 48: "Play past boards", linking to `/games/[slug]/archive`. Meta: "Every board since the relaunch. Free, never ranked."

**L8 Games index** `/games`
- **Purpose.** Lists all eight games.
- **Phone.** H1 "Geography games". The six dailies as H3 cards in one column, 56 px apart to leave room for the clay. Then "Practice games" in `.t-h2` with the two practice cards.
- **Desktop.** A 2-column grid of 576 px cards in the 1200 container. Equal heights, with Play anchored to the bottom edge of each, so every row lines up across columns.

### P. Play: shared frame

**P1 Play frame and header** `/games/[slug]/play`
- **Purpose.** Hold one game with no extra chrome.
- **Phone.** A 52 px header:
  - back chevron (44)
  - the game's clay at 32 (its title only in `aria-label`)
  - round pips: 8 px circles, ink filled, wait empty, filling on twos
  - the running score in `.t-score` with its scale ("37 of 195", "4/6", "640 of 1,200")
  - the "?" icon button (44)
- **Desktop.** A 64 px header across the 720 (or 960) column, which adds the game title in `.t-h3` after the clay.
- **Elements.** No strip and no footer inside play.
- **Interactions.** Back goes to `/` (2.6). "?" opens P3.
- **In and out.** In: morph or plain navigation from a card. Out: back, or the result rendered in place.

**P2 First-run hints**
- **Purpose.** Teach on the board, without a gate.
- **Phone and desktop.** One inline meta line above the active area, one per step, on this device's first run of the game (from `cv_h`):

  | Game | Hints |
  |---|---|
  | Country Draft | "Pick a country. Its people appear next." Then "Tap a person to give them a job." Then, in the sheet, "Pick a job, then Seat. Closing this changes nothing." |
  | GeoWordle | "Type any country. You'll see how far and which way." |
  | Pinpoint | "Tap the map where you think it is, then drop the pin." |
  | Flag Quiz | "Tap the name. Your first tap counts." |
  | Higher or Lower | "Is the bottom country's number higher or lower?" |
  | Stat Guesser | "Slide the pin, then lock it." |

- **Behaviour.** Each hint collapses (height to 0, smooth, 220 ms) after its step's first commit, and is never shown again for that step on this device. Under reduced motion it is removed instantly.
- **Decision.** No auto-opening rules sheet.

**P3 Rules sheet** (G5)
- **Phone.** The card's three lines in body 17, the scoring principles from L3, and for Country Draft the five job rows. A "Got it" button is pinned.
- **Desktop.** The right-edge panel, with the same content.
- **Interactions.** Opened only from "?". It closes back to the board, leaving state untouched.

**P4 Already played**
- **Purpose.** One shot.
- **Phone and desktop.** Opening `/play` for a finished daily renders the result (R1 and below) directly. The header shows "Played today" in meta in place of the pips.
- **Edge states.** A cleared cookie means a new device that may play again. The scouting rules in section 7 then apply.

**P5 Practice frame** (`?mode=practice`)
- **Phone.** The P1 header with the practice stamp CL-26 (28 px) and "Practice" in `.t-h3` in the title area, and "Nothing counts" in meta. The board sits on a card-tone ground instead of paper, so the room looks different.
- **Desktop.** The same in the 720 or 960 column, on the card-tone ground across the viewport.
- **Interactions.** Results offer "New board" as the primary action.
- **Animation.** The stamp's `press` plays once when a board is dealt.

**P6 Board closed at midnight**
- **Purpose.** A run from yesterday reopened today.
- **Phone and desktop.** The board in its saved state, with an inline note above it: "This board closed at midnight." Two actions:
  - "Finish as practice" (ink): continues the same board unranked, in the P5 frame. Yesterday's answers are public by then, so nothing leaks.
  - "Play today's" (text action).

**P7 Commit pending.** Uses G7.

**P8 Run timing (invisible).** There is no visible timer except in Speed Flags. Minimum durations (section 7) are enforced on the server from commit timestamps.

### CD. Country Draft panes

**CD1 Country choice**
- **Purpose.** Choice over the where.
- **Phone.**
  - The cabinet strip at the top: 5 seats at 70 px, each with the clay object at 56, the plain job word under it, and, once seated, the disc, points and fit word.
  - The region meter and ages meter lines under the strip.
  - The line: "Round 1 of 5: choose a country. You'll see three of its people. You can't switch after." From round 2: "Round 2 of 5: choose a country."
  - Three country cards stacked at full width × 88 px each: flag on the left, name `.t-h3`, region in meta.
  - "Open [country]" (ink, 56) pinned at the bottom. It reads "Choose a country" while disabled.
- **Desktop.** In the 960 column: the strip as a row of 5 seats at 160 px with full job names; the meters on one line; three country cards side by side at 296 × 120; "Open" under the cards on the right.
- **Interactions.**
  - A tap on a card selects it (2 px ink outline), and a second card replaces the selection.
  - "Open" commits (server step).
  - Desktop: 1 to 3 selects, Enter opens.
- **In.**
  - Round 1: the cards deal on twos, one per beat (3 beats), behind G11.
  - Rounds 2 to 5: one 2-frame stamp.
  - New cards ignore input for 300 ms.
- **Out.** The chosen card expands into the country header row, and the others slide away (220 ms).
- **Edge states.** A reload restores this state. A country is never offered twice in one board.

**CD2 People**
- **Purpose.** Show three people of the chosen country.
- **Phone.**
  - The strip and meters stay.
  - The country header row: flag 28 and name in `.t-h3`.
  - Three person cards stacked, each 112 px tall: portrait 72 on the left, name, "Active 1796 to 1815", a 2-line identity line, and the "i" button on the right.
  - The reveal line from the last round, if any, sits under the strip with the "Last round:" prefix.
- **Desktop.** In the 960 column, three person cards side by side at 296 × 220. When a person is held, the cards collapse into a 520 px left column of three 96 px rows, and CD4 opens on the right.
- **Interactions.** A tap on a card holds that person and opens CD4. "i" opens CD3. Desktop: 1 to 3 holds a person.
- **In.**
  - Round 1: the three cards flip in with a 120 ms stagger, identical for all three.
  - Later rounds: no stagger.
  - All content is in the DOM at once; the flip is a transform, never an opacity reveal.
- **Edge states.** Long names such as "Vigdís Finnbogadóttir" wrap to two lines inside the reserved slot.

**CD3 Person detail sheet**
- **Phone.** A G5 sheet:
  - portrait 120
  - name in `.t-h2`
  - "Active …", birthplace
  - the identity line, plus one more neutral line about the headline role
  - "Photo: [author], [licence]" in meta
  - "Choose [short name]" pinned, which goes to CD4
- **Desktop.** The same content in the right-hand panel area of the 960 column.
- **Never** shows seat words, numbers or second careers.

**CD4 Job sheet**
- **Purpose.** The seat decision and its confirmation.
- **Phone.** A G5 sheet:
  - Header: the held person's portrait disc 40 and name, then "Give [short name] a job", with the meta "Nothing is final until you tap Seat."
  - Five rows, 64 px each: clay job 48, full job name in `.t-h3`, job line in mute.
  - Filled rows are inert and show the occupant's disc, points and fit word.
  - The pinned button is disabled ("Choose a job") until a row is selected, then reads "Seat Napoleon in The Field".
- **Desktop.** A 400 px panel inside the 960 column, to the right of the collapsed people. Keys 1 to 5 select, Enter seats, Esc closes.
- **Interactions.** Selecting a row gives it a 2 px ink outline. Closing the sheet is the put-back; the person returns to the trio.
- **Edge states.** With one open job left, it is preselected and a single tap seats.

**CD5 Seat reveal**
- **Purpose.** The payoff.
- **Phone.**
  - The sheet closes.
  - The portrait flies to the seat at once. The clay plop plays. The seat's points tick and the fit word appears. The header total ticks.
  - Under the strip, the reveal line in two lines: "+35 in The Field: natural fit 25, fame 10." (points in Erode), then the why line in body 16.
  - The meters update. "Next country" (ink, 56) is pinned.
- **Desktop.** The same. The reveal line sits under the strip across the 960 column, and "Next country" sits at the bottom right of the column.
- **Interactions.** "Next country" (or N or Enter on desktop) deals CD1. There is no auto-advance. A tap on a seated seat re-shows its line.
- **Edge states.** A slow server: the portrait sits in the seat with "Saving" (G7).

**CD6 Final tally** (inside R1)
- **Purpose.** Build the total, once.
- **Phone and desktop.** Inside the R1 card under the score, all lines visible from the first frame:
  - "Full cabinet +8", or "No full-cabinet bonus: The Purse was only a thin fit (needs 12 or more)."
  - "Three regions +6", or "Two regions: no bonus."
  - "Across the ages +6", or "Across the ages: no one active after 1950."
- **Animation.** Each line gets a 2-frame ink-weight stamp in turn, about 1.2 s in all, behind G11. R1's single count-up runs alongside, from the seat sum to the total.

**CD7 Conquest map** (inside R1)
- **Purpose.** The fantasy, grounded in truth.
- **Phone.** Inside R1, under the tally, a world map at full card width.
  - Your five homelands fill ink, then other countries fill mute outward in great-circle order, stepping on twos, until `score` countries are filled. Route lines connect the homelands.
  - Caption in meta: "158 points: 158 of 195 countries painted."
  - Under it, the fact: "In real life, your five homelands hold 1.9 billion people and 11% of the land, across 4 regions."
- **Desktop.** The map at 616 px inside the 680 R1 card.
- **Animation.** About 2 s, behind G11, and skippable. The map's final state is in the DOM from the first frame; only the fill steps are painted.
- **Reduced motion.** The final map at once.

### GW. GeoWordle panes

**GW1 Guess board**
- **Phone.**
  - P1 header.
  - The mini-map, 350 × 180, Equal Earth, fills per 3.4.
  - Guess rows, two lines and 64 px each. Line 1: flag and name. Line 2: the distance in `.t-num`, the arrow icon and the band word in ink.
  - Empty rows show as wait pips with "Guess 3 of 6" in meta.
  - Once available, the clue button "Outline clue (uses a guess)" with the outline icon.
  - GW2 pinned at the bottom.
- **Desktop.** The 720 column: the map at 720 × 340, then one-line rows (flag, name, distance, arrow, band), then the search field under the rows.
- **Edge states.** With six rows used, the field is gone and GW4 shows.

**GW2 Country search**
- **Phone.** A field (card fill, radius 12, 52 px) with the placeholder "Type a country". The suggestions panel sits above the keyboard (bar fill, radius 6), with up to 6 rows: flag 20, name, the alias match in meta ("also Holland"), and the type label for territories.
- **Desktop.** The suggestions open below the field, at 720 wide.
- **Interactions.**
  - Ranking: prefix match first, then word-start, then contains. Accent- and case-insensitive.
  - Enter or a tap guesses (server step).
  - Already-guessed rows are disabled with the meta label "Guessed".
- **Edge states.** No match: "No country by that name. Try another spelling."

**GW3 Outline clue confirm**
- **Phone and desktop.** An inline confirm row replaces the clue button: "Use a guess to see the outline?" with "Show outline" (ink) and "Not now" (text action).
- **After confirming** (server step): the outline appears in a 120 px box above the rows. For outline-poor answers the box shows the subregion-and-size line instead. One empty row turns into a filled wait row reading "Clue".

**GW4 Solve or loss reveal**
- **Solve.** The row reads "Found it" in ink. `gw-solve` plays in the header. The answer fills ink with its label, and route lines draw from each guess. Headline in `.t-h2`: "Bhutan, in 4 guesses".
- **Loss.** "The answer was Bhutan", with its outline and flag. The answer fills ink. The clay rests (no error object; losing is not an error).
- **Then.** "Bonus: two quick questions" with "Start" (ink) and "Skip to result" (text action).
- **Desktop.** The same, in the 720 column, with the headline above the map.

**GW5 Bonus: neighbours**
- **Phone.** "Tap every country that borders Bhutan." (or "Tap any three…", or "Which country is nearest by sea?"). Six option tiles in two columns, 56 px tall (flag and name). "Done" is pinned.
- **Desktop.** Three columns of tiles, 720 wide.
- **Reveal.** Correct picks fill ink, missed correct tiles get an ink outline, and wrong picks fill ember. One line: "Bhutan borders 2 countries: China and India."

**GW6 Bonus: capital**
- **Phone and desktop.** Four option rows in the column.
- **Reveal.** Standard option states. For countries with more than one capital: "Bolivia has two: Sucre and La Paz."

**GW7 Fact card**
- **Phone and desktop.** One sourced fact in body 17, the source as a meta link, "More about Bhutan" (to the dossier) and "See result" (ink).

### PP. Pinpoint panes

**PP1 Map stage**
- **Phone.**
  - P1 header.
  - The country name in `.t-big`, centred, with "Round 2 of 5" in meta (and "Counts double" in round 5).
  - A full-bleed map, 390 × about 420.
  - Zoom buttons at the bottom right inside the map (44 each, bare icons).
  - "Drop pin" (ink, 56, full width minus the gutters) at the bottom. While disabled it reads "Tap the map to place your pin".
- **Desktop.** In the 960 column: the name above, the map at 960 × 540, the zoom buttons inside the map, and "Drop pin" under the map at the right.
- **Edge states.** Before hydration the map is static. Without JS, see 5.3.

**PP2 Round reveal**
- **Phone.** The pin, the answer fill, the route line, then under the map the score line ("Inside. 200." or "640 km away, 2 countries closer to your pin. 108.") and the fact line. "Next country" (ink) is pinned; in round 5 it reads "See result".
- **Desktop.** The same, with the score line and fact under the map and the button at the right.

### HL. Higher or Lower panes

**HL1 Call stage**
- **Phone.**
  - The stat label with its icon: "Population, 2023".
  - Two stacked cards, each 350 × 140, card fill:
    - top: flag, name, value in `.t-score-l`, unit and year in meta
    - bottom: flag, name, and "?" in `.t-score-l`
  - From call 8: "Counts double" in meta.
  - The two buttons, Higher and Lower, at 56 px, pinned.
- **Desktop.** The two cards side by side (2 × 340) in the 720 column, with the buttons under the right card.
- **Interactions.** Tap a button, or use Up/H and Down/L. The tap is the commit.

**HL2 Reveal**
- **Phone and desktop.** The value ticks in over 900 ms, then the verdict word, then the generated comparison line. After 1.2 s, the revealed card slides into the left (top) position and a new challenger arrives (260 ms). The new buttons ignore input for 300 ms. A tap skips the hold.
- **Edge states.** Call 10's reveal leads to the result.

### SG. Stat Guesser panes

**SG1 Ruler stage**
- **Phone.**
  - The country flag and name, then the stat line ("Population, 2023").
  - The live value in `.t-big`.
  - The ruler, 350 wide, with the two reference pins (mute) and their labels above them (flag 16 and short name).
  - Your pin (ink) with its 44 px knob below the ruler.
  - "Lock it" (ink, 56), pinned.
- **Desktop.** The ruler at 640 in the 720 column, with "Lock it" under it on the right.

**SG2 Reveal**
- **Phone and desktop.** The true marker, the route line, "1.4 times too high" in body, the points ticking, three context pins, the optional personal line, then "Next" (ink).

### FQ. Flag Quiz panes

**FQ1 Flag stage**
- **Phone.** The flag box (3:2, up to 320 wide, centred), then four option rows (56 px each, 8 px apart) in the bottom half. Pips in the header. From flag 8: "Counts double" in meta above the box.
- **Desktop.** The flag box at 400 wide, with the options in a 2 × 2 grid under it (each 352 wide) in the 720 column. The key hints "1 to 4" sit in the hint row for fine pointers.

**FQ2 Reveal**
- **Phone and desktop.** The option states, the clay flutter or droop in the header slot, and the family line under the options. It advances after 1.2 s; a tap skips. New options ignore input for 300 ms.

### PR. Practice-only boards

**BP1 Blind Pick board**
- **Phone.**
  - The incoming country card: plain rectangle, flag, name, region.
  - Six slots in 2 columns × 3 rows at 167 × 72, each with the stat icon and label.
  - The line "Tap a stat to place the country."
- **Desktop.** The incoming card above a row of six slots at 150 × 96 in the 960 column.
- **Behaviour.** A placed slot shows "#12 of 193", the tier word and the country's flag at 20. The next country slides in from the right (220 ms).

**RF1 Speed Flags board**
- **Phone.** The hourglass and the seconds in the header, the flag, and two option rows. At time up: "Time." in `.t-h2`, then the result.
- **Desktop.** The same in the 720 column, with the options side by side and the key hints "1 and 2".

### R. Results (all games)

Order under the header: R1 (the score card, containing the cabinet strip, tally and map for Country Draft), R2, R9, then R6, R7 and R8 as disclosures. Share lives inside R1.

**R1 Result card**
- **Purpose.** The score, first and big. It is in place from the first frame.
- **Phone.** The result card (game-card silhouette, card fill):
  - the outcome clay in the notch (trophy, rosette or hill, per 4.4)
  - the score in `.t-score-xl` ("158", with "of 195" in `.t-score`)
  - the band word (Country Draft) or the verdict line ("Found in 4")
  - "Par 140. You beat it by 18." or "Par 140. 12 short." in body
  - "Better than 71% of today's players" in meta, when there are 20 or more eligible runs
  - **Country Draft only:** the cabinet strip (five seats with discs, points and fit words), CD6 and CD7
  - Share at the card's bottom left: the share icon plus "Share", as a text action in ink
- **Desktop.** The card at 680 in the play column (centred in the 960 column for Country Draft and Pinpoint).
- **Animation.**
  - One count-up of the score (750 ms).
  - For the top band, the trophy's `tip` sequence.
  - For Country Draft, the CD6 and CD7 sequence (about 3.2 s) runs behind G11.
  - R2 and the rest sit below, already in the DOM. The skip layer covers only the R1 card, so no skip tap can reach R2.

**R2 Put me on the leaderboard**
- **Phone.** A full-width ink button (56) under R1: "Put me on the leaderboard". With a remembered name it reads "Put me on as Adam", with a "Change" text action beside it.
- **Expanded (inline):**
  - the name field (52 px, placeholder "Your name", maxlength 20)
  - the place row: flag 20, place name, and a "Change" text action that opens G9
  - "Put me on" (ink)
  - the meta "Your name and flag show on today's public leaderboard. No account."
- **Desktop.** The same at 680. The expanded row lays out the name field and place row side by side, with the button at the right.
- **Interactions.** Enter submits. On phones, the expanded row scrolls into view above the keyboard.
- **Edge states:**
  - Practice: absent.
  - Already named from this device: R4 shows instead.
  - The run cannot be named: R3's line replaces the button.

**R3 Name and eligibility messages**
- **Under the field** (ember text, the field outline ember):
  - "Pick a different name."
  - "Use 2 to 20 characters."
  - "Too many names from this network today. Try again tomorrow."
  - "Today's board closed at midnight." (after the 15-minute grace)
- **In place of the button** (body, mute, no ember, because nothing is wrong with the player):
  - "This run finished faster than we can verify, so it stays private. Your score still counts for you."
  - "Another new device on your network finished this board first today, so this run stays off the leaderboard. It still counts for your streak."

**R4 On the leaderboard**
- **Phone.** The button becomes a row: "You're #2 of 3 names today" in body 600, with "See the leaderboard" (to `/leaderboard?game=…`).
  - Under it, a board snippet: the podium clay CL-25 at 40 beside "Today's Country Draft" in `.t-h3`, then up to 5 rows centred on your row (ember-ringed flag), with the Par row where it falls.
  - Text actions: "Change name" and "Take me off".
- **Desktop.** The same at 680.
- **Change name (inline):** your row turns into the name field with the current name, "Save" (ink) and "Cancel" (text action). Validation as R3. The toast says "Name changed."
- **Take me off:** asks inline "Take your name off today's leaderboard?" with "Take it off" (ember text) and "Keep it". Confirming removes the name; the run still counts anonymously in the statistics. The toast says "Taken off the leaderboard."
- **Animation.** The rows shift over 220 ms and your rank ticks.

**R5 Share.** Lives in R1 (bottom left). Native share, clipboard or G10 per 1.6. In the iOS app, the Capacitor Share plugin.

**R6 How it went** (a `<details>` disclosure, closed by default)
- **Phone and desktop (column width):**
  - **Country Draft:** five rows, each with the seat clay at 40, the portrait disc, the fit word and points, the fame points, the why line and a source link. Then "Best possible today: shown after midnight", or after midnight "Best possible: 181".
  - **GeoWordle:** the guess list.
  - **Pinpoint:** five rounds with distances and points.
  - **Flag Quiz:** ten mini flags with right or wrong.
  - **Higher or Lower:** ten pairs.
  - **Stat Guesser:** five rulers.
  - **Blind Pick:** your board over the perfect board, and the swaps.

**R7 What you passed on** (Country Draft, a `<details>` disclosure)
- **Phone and desktop.**
  - **Before midnight:** the names of the people you passed on, per round, and "Countries you didn't open: Peru, Japan, …". The meta: "Their jobs and points appear after midnight."
  - **After midnight** (and always in practice): each person's best seat, points and why line, plus the people of the unopened countries.

**R8 One fact to keep**
- **Phone and desktop.** One fact tied to the player's picks, with its source, and a link "More about Peru" to the dossier.

**R9 Next and tomorrow**
- **Phone.** A Next row (3.10) for the next unplayed daily: "Next: GeoWordle", its promise, and an ink "Play". Then "New boards in 7 h 12 min" with the crate `peek` loop.
- **Desktop.** The same at 680 under R2.
- **Interactions.** Play goes to that game's play route.
- **Edge states.** After the last daily of the day, the row reads "Full set: see your day" and goes to `/`, where H7 is first.

**R10 Practice result**
- **Phone and desktop.** R1 without percentile; "Par 140" is still shown. No R2. "New board" (ink) replaces the Next row's Play. Share copies a practice line. R7 shows values at once.

**R11 Share my day** (from H7)
```
Countrivo 12 Oct, full set
Country Draft 162 of 195
GeoWordle 4/6
Pinpoint 914 of 1,200
Flag Quiz 11 of 13
Higher or Lower 11 of 13
Stat Guesser 412 of 600
countrivo.com
```

### B. Leaderboards and runs

**B1 Leaderboard, today** `/leaderboard`
- **Phone.**
  - G1.
  - The podium clay CL-25 (96) beside the H1 "Today's leaderboards" in `.t-h1`.
  - Game tabs: six items with clay at 40 and names, horizontally scrollable, with the sliding ink bar.
  - A Today / Yesterday segmented control (card track, ink knob, radius 9/12).
  - The list: every named entry up to 50, with the Par row in place, and your row pinned at the bottom if it is outside the top 50 ("You: #73").
- **Desktop.** The same in the 720 column, with the tabs on one row.
- **Primary state (0 to 3 names).** This is the common case today.
  - With 0 names: the Par row, "No names yet today. Finish today's [game] and put yours next to Par.", and an ink "Play".
  - With 1 to 3 names: those rows and Par, then the same line with Play.
- **Ranking.** Equal scores share a rank (1, 2, 2, 4).
- **Edge states.** After a reroll, a "First board / Replaced board" segmented control appears above the list (G8).

**B2 Leaderboard, yesterday**
- **Phone and desktop.** Yesterday's final standings, with the answers block (L4 short form) above the list. Read-only. Names can no longer be changed.

**B3 Countries today** (a section below B1, shown only when at least one place has 10 or more named entries)
- **Phone and desktop.** Rows: flag, place name, average score in `.t-num`, and "23 players" in meta. Sorted by average. Your place is ringed.
- **Edge states.** Absent entirely below the threshold; there is no empty state.

**B4 Run page** `/run/[id]`
- **Phone and desktop** (720 column).
  - **Before 00:00 Berlin of the run's day:** name, place flag, game, date, score, band, and "Full run visible after midnight", plus a "Play today's [game]" button.
  - **After midnight:** the full run (the cabinet with why lines, the guess list, and so on). An OG image with the score and the game's clay.
  - Always noindex (thin pages).
- **Edge states.** A run taken off the leaderboard, or never named: "This run isn't public."

**B5 Row actions** (inline, on B1, B2 and L2 snippets that link to B1)
- **Purpose.** Report a bad name without an account, and manage your own row.
- **Phone and desktop.** Tapping a row expands it by 44 px with text actions:
  - other people's rows on today's board: "Report name"
  - your own row: "Change name" and "Take me off"
  - Tapping again collapses it.
- **Report.** Writes `name_reports(run_id, ip_prefix_hash)`, one per prefix per run. The toast says "Thanks. We'll look at that name." Reports from 3 distinct prefixes auto-hide the name (`hidden = true`) until an admin reviews it in AD1.

### A. Archive

**A1 Archive** `/games/[slug]/archive`
- **Phone.** H1 "Past Country Draft boards" with the open crate still. A list grouped by month. Each row shows the date, the day's subtitle (the Higher or Lower stat; nothing for GeoWordle) and, if this device played it, "You: 158".
- **Desktop.** The list in the 720 column, months as `.t-h3` openers.
- **Interactions.** A row goes to `/games/[slug]/play?date=2026-10-11` in the P5 frame, with the meta "11 Oct board, practice". The board comes from its `daily_boards` snapshot.
- **Indexing.** The archive index is indexable. Archive play pages are noindex.
- **Edge states.**
  - Today's and future dates are never listed and return 404 (5.9).
  - The archive starts at the relaunch date.

### W. World pages

**W1 Countries index** `/countries`
- **Phone.** H1 "Countries of the world" with the globe still. A search field, then a world map (tap a country to open it). Then five region groups of sovereign states (flag, name, one hero fact in meta), and a separate group "Territories and other places" with type labels.
- **Desktop.** The map at 1200 wide, with the groups in three columns.

**W2 Country dossier** `/countries/[slug]`
- **Phone, top to bottom:**
  1. Hero: flag 120, name in `.t-h1`, region in meta, and the globe still facing its region.
  2. The editorial fact in body 19.
  3. A fixed comparison: "About the size of Japan" (the tier A country nearest in area) and "About X% of the world median income". It is not personal, because the page is static.
  4. "Where it ranks": its top 3 and bottom 3 positions among sovereign states, with "of N", source years and inline caveats.
  5. "Neighbours": sovereign neighbours with one contrast each (pairs on the sensitive blocklist show no contrast), and overseas notes where relevant.
  6. "People from here": portraits, names and identity lines, with credits.
  7. "Its flag family", with one line.
  8. "Play with Italy": "Draft from Italy" (practice; only for countries with 6 or more portrait people) and "Guess a stat" (practice).
  9. The answer capsule paragraphs (the existing indexable text, rewritten to answer questions).
- **Desktop.** The hero across 12 columns; sections 4 to 7 in a 2-column grid; sections 8 and 9 in the 680 column.
- **Edge states.**
  - Territories: the same page with "Territory of Denmark" under the name and no draft link.
  - Sparse stats: sections hide rather than show "No data".

**W3 Categories index** `/categories`
- **Phone.** Rows: stat icon, name, source and year, and coverage ("193 countries").
- **Desktop.** The rows in two columns in the 1200 container.

**W4 Category page** `/categories/[slug]`
- **Phone.** The ranked list over sovereign states (rank, flag, name, value), the source line, a caveat paragraph if flagged, "Surprising positions" (three generated contrasts), and "Guess this stat" (practice) plus the Higher or Lower card.
- **Desktop.** The list in the 720 column. "Surprising positions" and the game card sit in a side column within 1200 (columns 10 to 12).

**W5 Lists index** `/lists`
- **Phone and desktop.** Editorial lists as rows, each with a one-line question, in the 720 column.

**W6 List page** `/lists/[slug]`
- **Phone and desktop (720 column).** The title as a question ("Which countries border the most others?"), an answer paragraph with the method, the list with sources, and the relevant game card at the end.
- **Lists:**
  - existing ones, corrected (e.g. "greenest" carries the biomass caveat)
  - new:
    - doubly landlocked
    - more than one capital
    - longest land routes
    - biggest gaps across a border (sensitive pairs excluded, method stated)
    - beer, coffee and wine "among countries with data"

**W7 Continent list with Name Them All** `/lists/countries-in-africa` (phase 3)
- **Phone.** The list (54 sovereign states, territories labelled separately) and a map. An embedded practice quiz, "Name every country in Africa": a field pinned above the keyboard, the map kept visible above it (`visualViewport`), and "Give up" revealing the rest. Untimed and never daily.
- **Desktop.** The map at 720 with the field under it and the found list in a side column.

**W8 Sources** `/sources`
- **Phone and desktop (720 column).** Sections:
  - "Which 195": the 193 UN members plus the Holy See and Palestine
  - "How we name places": the naming policy and aliases
  - "Disputed places"
  - "Our data": each dataset with publisher, year, licence and coverage
  - "Caveats": the caveat table in plain words
  - "Corrections": an email address
- Anchors per stat (`#population`).

### S. Static and system

**S1 About** `/about`
- **Phone and desktop (720 column).** "How Countrivo works", with sections:
  - daily and practice
  - no accounts
  - the leaderboard
  - Par (`#par`)
  - streaks (`#streak`)
  - what the leaderboard can promise (`#fair`, the text in 1.8, including what "paused" means)
  - what is stored
- The globe spin plays once.

**S2 Privacy** `/privacy`
- **Phone and desktop (720 column).**
- **What is stored, and the legal basis for each:**
  - the device token hash (strictly necessary to run the daily game, § 25(2) TDDDG)
  - daily runs and their moves (legitimate interest: running and refereeing the game, Art. 6(1)(f) GDPR)
  - optional name and place (consent, by submitting)
  - the IP prefix hash for 24 h rate limits and for that day's statistics (legitimate interest)
  - anonymous, cookieless analytics
- **What is not stored:** no email, no account, no ad tracking.
- **The cookie line:** "No consent banner, because we set no non-essential cookies."
- **"Forget this device"** (ember text) with an inline confirm: "Delete everything this device has stored with Countrivo?" with "Delete" and "Cancel". Then the toast, and the next page renders as a first visit.

**S3 Terms, S4 Credits, S5 Support**
- **Phone and desktop.** Plain text pages in the 720 column. Credits lists portrait authors and licences, and data sources. Support gives the email address and an FAQ link.

**S6 Practice room** `/practice`
- **Phone.** G1, the practice strip (G2 variant), then a deck of practice cards: card-tone game cards with the game's clay and the stamp overlay, and the button "New board". Below: a meta line, "Practice boards never include today's daily content."
- **Desktop.** The stage model from 2.4, with the practice strip above.

**S7 Imprint** `/imprint`
- **Phone and desktop.** The operator's name, address and contact as required by § 5 DDG, in the 720 column, linked from the footer.

**X1 404**
- **Phone and desktop.** The globe spin. H1 "No country at this address." Body: "The page you wanted isn't on our map." An ink button "Today's games". Column width 680.

**X2 Error** (`error.tsx`)
- **Phone and desktop.** The globe still. "Something broke on our side." "Your run is saved." "Try again" (ink) re-renders.

**X3 Global error.** The same copy, rendered without the stylesheet (inline hex is allowed there).

**X4 Offline** (iOS app launch only, `capacitor/www/offline.html`)
- **Phone.** The globe with the cloth. "You're offline." "Boards need a connection. Your run is saved." "Try again".
- **Desktop.** Not applicable (the web has no offline shell); network errors during play use G7.

**X5 Reduced motion.** A mode, not a pane. See 3.7.

**X6 No JavaScript**
- Home, landings, results, leaderboards and world pages render fully.
- Play works through form posts to server actions for:
  - GeoWordle (`<datalist>`)
  - Flag Quiz
  - Higher or Lower
  - Stat Guesser (number field)
  - Country Draft (select and open, hold, seat, as separate forms)
  - Blind Pick
- Pinpoint shows its no-JS line (5.3). Speed Flags needs JavaScript and says so in one line.

**AD1 Admin** `/admin`
- **Gate.** A POST form takes the admin secret, compared in constant time. Success sets an httpOnly, Secure, 12-hour admin cookie. The secret never appears in a URL. noindex. This is an owner tool, not a player account.
- **Phone and desktop (720 column).**
  - Today's edition per game, with a "Replace board" button per game and an inline confirm.
  - Today's named entries with report counts, each with "Hide" and "Unhide".

---

## 7. Leaderboards without accounts

### 7.1 Data model (new; replaces the account tables for play)

```sql
create table daily_boards (
  game           text not null,
  date_key       date not null,
  edition        int  not null,
  engine_version int  not null,
  pool_version   int,
  public_board   jsonb not null,
  solution       jsonb not null,           -- never leaves the server
  ceiling        int,
  created_at     timestamptz not null default now(),
  primary key (game, date_key, edition)
);

create table daily_runs (
  id             uuid primary key default gen_random_uuid(),
  game           text not null,
  date_key       date not null,
  edition        int  not null,
  engine_version int  not null,
  device_hash    text not null,              -- sha256(token + pepper)
  device_first_seen date not null,           -- when this cv_d was issued
  ip_prefix_hash text,                       -- /24 or /64, nulled 24 h after the day
  status         text not null,              -- 'open' | 'finished' | 'closed'
  score_raw      int,
  score_max      int,
  sort_value     int,                        -- higher is better, per game
  score_display  text,
  result_json    jsonb,                      -- breakdown for run pages
  started_at     timestamptz not null,       -- first server commit
  completed_at   timestamptz,                -- last server commit
  paused         boolean not null default false,
  verified       boolean not null default false,  -- replay passed, duration ok
  scout_flag     boolean not null default false,
  name           text,
  place          text,                       -- iso3 or null
  named_at       timestamptz,
  hidden         boolean not null default false,
  unique (device_hash, game, date_key)
);
create index on daily_runs (game, date_key, edition, sort_value desc)
  where status = 'finished' and verified and not scout_flag and name is not null and not hidden;

create table run_steps (
  run_id       uuid references daily_runs(id) on delete cascade,
  step         int  not null,
  action       jsonb not null,
  reveal       jsonb not null,
  committed_at timestamptz not null default now(),
  hidden_ms    int  not null default 0,      -- page hidden while this step was open
  primary key (run_id, step)
);

create table draft_records (                -- private Country Draft scoring data
  figure_id   text not null,
  seat        text not null,
  level       int  not null,                 -- 25 | 18 | 12 | 6 | 0
  evidence    text not null,
  source      text not null,
  pool_version int not null,
  primary key (figure_id, seat, pool_version)
);

create table rate_events (ip_prefix_hash text, kind text, at timestamptz); -- pruned after 24 h
create table name_reports (run_id uuid, ip_prefix_hash text, at timestamptz,
  primary key (run_id, ip_prefix_hash));
```

**How it is used:**
- **RLS.** Row level security is on for every table, with no policies for `anon` or `authenticated`: no anonymous SELECT, INSERT, UPDATE or DELETE.
- **Server-only access.** All reads and writes go through server actions and server components using the service role.
- **RPCs.** The two RPCs are `security definer`, and EXECUTE is revoked from `anon` and `authenticated`:
  - `board(game, date_key, edition, limit)` returns only `rank, name, place, score_display, paused` for named, finished, verified, unflagged, unhidden runs.
  - `summary(game, date_key)` returns `N`, the percentile function and per-person seat counts, computed over eligible runs and called only by the result render for the device's own people.
- **Run lifecycle.**
  - A run row is created at the first commit with status `open`.
  - The last step sets `finished`, replays all steps against `daily_boards.solution`, and sets `verified` and `scout_flag`.
  - At midnight, open runs become `closed`.
- **Practice runs are never stored.**
- **Old tables.** `game_runs`, `profiles`, `friendships`, `friend_challenges` and `user_game_stats` are frozen at launch (no writes). Section 9 and open question 2 cover deletion.

### 7.2 Integrity and anti-abuse

| Threat | Control |
|---|---|
| Computing future boards from the public repo | Secret HMAC seed; solution data private and out of git (5.9, rules 1 and 2) |
| Answers read from the client | 5.9 rules plus the CI leak check over HTML, RSC flight data, action responses and prefetches |
| Undoing a move by restoring a cookie | Steps written once in `run_steps`; the cookie holds only the signed `run_id` |
| Playing today's board through the archive | 404 for any date from today onward |
| Looking up today's content in practice | Practice excludes today's daily content until midnight |
| Reading the database directly | No anonymous access; RPCs revoked from `anon` |
| Forged scores | The server replays the steps against the snapshot's solution. The stored score is the server's |
| Bots finishing instantly | Minimum durations between the first and last server commit: Country Draft 12 s, GeoWordle 8 s, Pinpoint 12 s, Flag Quiz 10 s, Higher or Lower 10 s, Stat Guesser 12 s, Blind Pick 10 s. Below that, `verified = false` |
| Scouting with a fresh device (incognito, cleared cookies), then playing on the main device | `scout_flag` when a run's device was first seen before today and it started after a device first seen today, on the same IP prefix, finished the same game within the previous 60 minutes. Flagged runs count for the streak and show privately, but cannot be named (R3) |
| Many entries | One row per device per game per day. Named entries per IP prefix: 60 per game per day (school classes and carrier NAT fit). Commits per IP prefix: 3,000 per hour |
| Statistics skewed by scouts and scripts | Percentile, rarity and Countries today use only the first eligible finished run per IP prefix per game per day |
| Looking things up in another tab | Cannot be prevented. `hidden_ms` per step; a run with any step open while the page was hidden for 15 s or more is `paused`, shown as the meta word "paused" on its board row and explained on `/about#fair` |
| Bad names | NFKC normalisation; zero-width and control characters stripped; spaces collapsed; 2 to 20 characters; letters of any script, digits, space and `. - _ '` only. No URLs or domains (dot-plus-TLD pattern) and no "@". Reserved: "Par", "Countrivo", "admin". `isAllowedHandle` extended with a leetspeak map and a multilingual list. Viewer reports (B5) and admin Hide (AD1) |
| Impersonation | Names are not unique and claim nothing. The place flag is the player's choice |
| Personal data | Name and place only on opt-in. "Take me off" and "Forget this device". IP prefix hashes are kept for 24 h after the day |

### 7.3 What the leaderboard shows

- **Rows:** rank, place flag (or none), name, score, and "paused" when it applies.
  - Ranks use standard competition ranking among named, finished, verified, unflagged and visible entries, per edition. Ties share a rank, and there is no hidden tiebreak.
  - Your device's row has the ember ring on its flag.
  - Every named entry up to 50 is shown. Your row is pinned when it falls lower.
  - "#2 of 3 names today" counts named entries.
- **Par row.** Always shown at its sort position, styled per 3.10. It is a fixed baseline, never presented as a player.
- **Percentile.** "Better than X% of today's players" = `(count below + 0.5 × ties) / N`, over the statistics set from 7.2. Shown when N is 20 or more, rounded and clamped to 1 to 99.
- **Rarity** (Country Draft). "12% of today's players seated him in The Field", over the statistics set, when N is 20 or more. Only on the device's own result and only for its own seated people.
- **Countries today.** The average per place over named entries, shown per place at 10 or more entries.
- **Counts.** "1,204 boards finished today" only at 100 or more.

---

## 8. SEO and growth surfaces

### 8.1 Keep what ranks

- **Country Draft.** `/games/country-draft` keeps its title "Country Draft: Draft 5 People, Conquer 195 Countries", its H1 and its FAQ copy (updated). It carries 83% of clicks, so its content changes are staged:
  1. **Phase 0.** Archetype labels come off the cards, which leaves the FIT table mapping to nothing visible. The new L3 prose and L4 yesterday's answers ship above the table.
  2. **14 days later.** After a Search Console check of impressions, position and clicks for "country draft" queries, the FIT table is removed. If clicks fall by more than 20% over the 14 days, the owner decides before removal.
- **Other URLs.** `/games/geo-wordle`, the 243 country pages, categories and lists keep their URLs. Sitemaps (sharded) and IndexNow stay. Pinpoint adds `/games/pinpoint`.
- **Structured data.** FAQPage on landings, `VideoGame` (or the existing WebApplication) per game, `Place` on dossiers and `ItemList` on lists.
- **Revalidation.** Landings are static with on-demand revalidation (L2), not time-based ISR, in line with the recent commit that stopped landings rewriting ISR every minute.

### 8.2 Every SEO page leads into play

- **Game landing.** The first element is the playable card, one tap away.
- **Country dossier.**
  - "Draft from [country]" (where available) and "Guess a stat" practice.
  - Dossier sections link to category pages, and yesterday's answers link to dossiers.
- **Lists.**
  - Continent lists embed Name Them All (phase 3).
  - Every list ends with the relevant game card, e.g. the Flag Quiz card on flag lists.
- **Category pages** end with "Guess this stat" practice and the Higher or Lower card.
- **Results.** The R8 fact links to a dossier, which links back to practice.

### 8.3 Making the world pages worth a click

- **Country pages become dossiers** (W2) that answer questions, with titles like "Argentina: how big, how rich, who's from there".
- **Lists become answers** with stated methods (W6).
- **`/sources` becomes the citable trust page.**

This is the geographer's plan, and it is how impressions at positions 25 to 80 convert into clicks.

### 8.4 The fact engine

The pure module `src/lib/facts/` returns `{text, numbers[], source, year, caveatId?, kind}` for a committed context: a country, a pair, a person or a seat.

**Fact kinds:**
- extreme
- rank contrast
- border contrast
- share of the world
- personal comparison (play routes only, after commit)
- consumption (with data-coverage wording)
- people
- route
- second career

**Phasing:**
- **Phases 1 and 2** ship only the generated **rank contrast** kind, plus the why lines from `draft_records`. Every surface that needs a fact uses it: PP2, GW7 (until editorial lines exist), the HL line, R8 and H7.
- **Phase 3** adds the other kinds and the editorial layer.

**Guardrails:**
- the caveat table (renewables, unemployment, inflation, Ireland and Luxembourg GDP)
- the sensitive-pair blocklist
- same-year comparisons only
- "the only" and "the first" claims require a source
- no fact about anything not yet committed

**Editorial layer.** One fact per sovereign state (195 lines), each with a source URL and a second reviewer. A script stores them in `src/data/facts.json`; they are never typed into UI copy.

**Display.** One line per commit. It replaces the previous line and carries an inline year and source.

### 8.5 The share loop

1. Finish a game.
2. Share the spoiler-free text, which carries the game URL.
3. A friend lands on the game landing, whose first element is the playable card.
4. They play.
5. Their result offers the next game, and a full set offers "Share my day".

Supporting pieces:
- **OG images** per game (clay object, title, "Today's board"). Run pages after midnight get an OG image with the name and score.
- **We do not chase rival keywords** ("195-0", "world draft"). The owner already 301s `/games/world-draft`.

### 8.6 Metrics

Recorded through `src/lib/play-events.ts`, extended with `card_next`, `name_submit`, `name_report`, `share`, `share_day`, `share_fallback`, `clue_used`, `bonus_done`, `paused` and `scout_flagged`.

| Metric | Target |
|---|---|
| Plays per visitor | 2.2 (about 1 today) |
| Daily completion per start | 80% |
| Name rate per finished daily | 15% (about 1% today) |
| Shares per finished daily | 8% |
| Day-2 and day-7 return by device | 15% and 6% [calibrate] |
| Country Draft runs at or below Par | 60% or less (if higher, identity lines are too thin) |
| Draft seat-choice accuracy on non-crossover people | 90% or less (if higher, identity lines are too explicit) |
| Scout-flagged share of finished runs | watch; above 5% means the rule needs review |

---

## 9. Migration notes and phased build plan

### 9.1 Delete

**Auth UI:**
- `src/features/auth/{auth-provider.tsx, auth-sheet-host.tsx, native-bootstrap.tsx}`
- `src/ui/auth-sheet.tsx`
- `src/app/(auth)/*`
- `src/app/auth/callback/route.ts`
- the session refresh in `src/proxy.ts` and `src/lib/supabase/session.ts` (the proxy now issues `cv_d`)
- `src/lib/native/session-fallback`
- `supabase/functions/apple-exchange`
- `scripts/migrate-oauth-users.ts`
- Sign in with Apple in the iOS app

**Social:**
- `src/app/(app)/friends/*` and `src/app/actions/friends.ts`
- `src/features/social/{friends-page, friend-search, friend-rows, add-friend-button, invite-row, friendship, head-to-head}.tsx`
- `src/ui/friends-strip.tsx`
- the Friends tab on boards, the Friends nav item and the friend line in `daily-pane.tsx`

**Challenges:**
- `src/app/actions/challenges.ts`
- `supabase/functions/send-challenge-email`
- writes to `friend_challenges`

**Profile:**
- `src/app/(app)/profile/*` and `src/app/actions/profile.ts`
- `src/features/social/{profile-page, profile-head, profile-edit, delete-account, signed-out}.tsx`
- `supabase/functions/delete-account`

**Account streaks:**
- `updateStreak` in `game-runs.ts`
- `src/ui/{streak, streak-week}.tsx`
- `supabase/functions/streak-reminder`

**Push:** `src/app/actions/push-tokens.ts` and `supabase/functions/send-push`.

**Leaks and jargon:**
- `src/features/seo/draft-tables.tsx` (staged per 8.1)
- the FIT copy in `src/content/draft.ts`
- the `RESULT_REVEAL_MS` undo path in `src/games/country-draft/module.ts`
- every "Shoot", "shot" and "shots" string
- `JoinRow`'s sign-in line
- the `cv_mode` Daily/Practice toggle
- the bottom tab bar
- seed derivation from public inputs in `src/lib/daily-seed.ts`
- solution-bearing fields in tracked JSON (moved to `draft_records`)

### 9.2 Keep

- The four-layer game architecture and `registry.ts` (append Pinpoint).
- Codecs and `cv_p_` cookies, now for practice only.
- `seeded-random.ts` (mulberry32), `daily-edition.ts`, Berlin day keys and edition reroll (moved behind AD1).
- `src/lib/share/*`, with updated formats.
- `play-events.ts`.
- `src/lib/profanity.ts`, extended.
- The data pipeline scripts, SEO routes and sitemaps, IndexNow and `RETIRED_GAMES`.
- Tokens (mute changed; motion and map tokens added), Erode, the house icons, `flame.css`, and the conquest map (rebuilt on the new map renderer).
- **`check:theme`, extended with:**
  - no `alt` built from answer data on boards
  - no `/flags/` paths inside Flag Quiz and Speed Flags question slots
  - no uppercase text-transform
  - no `opacity: 0` in the first frame of any keyframe
  - no text colour set to faint, wait or line
- **New scripts:**

  | Script | Purpose |
  |---|---|
  | `scripts/check-leaks.ts` | HTML, RSC flight data, action responses, prefetches, images |
  | `scripts/check-solution-files.ts` | fails if solution-bearing data is tracked in git |
  | `scripts/build-map.mjs` | Natural Earth 1:50m with 1:10m fill-ins, Equal Earth, antimeridian, outlines for the 29 missing states |
  | `scripts/build-distances.mjs` | the border distance matrix over all guessable entities, uploaded to private storage and not committed |
  | `scripts/build-clay.mjs` | with byte-budget checks |
  | `scripts/build-portraits.mjs` | uniform greyscale, crop and resolution |
  | `scripts/build-question-flags.mjs` | raster sources for per-slot question flags |
  | `scripts/fetch-wikidata-figures.ts` | sitelinks, active years, gender, positions held |
  | `scripts/fetch-pageviews.ts` | recognition tiers |
  | `scripts/check-fairness.ts` | regional spread of answers over 30 days (each region between 10% and 40%) and the repeat windows of every game over 365 simulated days |

### 9.3 Data work

**Draft figures.**
- `figures.json` (public) keeps identity: `name`, `shortName`, `headline`, `active_from`, `active_until`, `born`, `died`, `gender`, `sitelinks`, `portrait`.
- `draft_records` (private) holds `{seat, level, evidence, source}` per person.
- `build-draft-pool.mjs` derives fame bands and pool membership and bumps `POOL_VERSION`.
- **First pass** by LLM from Wikipedia and Wikidata P39/P166, then human review by country batch, plus a "contested fits" review. Napoleon and The Purse is the test case.

**What the repository holds today**, against what the draft needs:

| Item | Needed | In repo today |
|---|---|---|
| Draft pool | the daily pool, every region represented | 51 countries; Oceania 2 (AUS, NZL); Europe 21 |
| Portraits in the pool | portrait-only daily | 304 of 514 people matched by slug |
| Countries with enough portrait people | 4 or more to enter the pool | 42 with 3 or more; 9 below 3; 8 with exactly 3 (excluded until they reach 4) |
| Years | "Active …" and the ages bonus | only `era: historical/modern` |
| Fit and fame inputs | `sitelinks`, records, headline | none |
| Women target | about 30% women | no gender field |

**Portrait sweep.** Wikimedia Commons, to close the gap before the daily goes portrait-only.

**Phase 1a gate** (before the new Country Draft ships):
- at least 36 countries with 4 or more portrait people and reviewed fits
- every UN region at 2 or more
- fits reviewed for every country appearing in the first 30 boards

**Pool growth** (phase 3): from 51 to about 150 countries with 6 or more eligible people each. Targets: each UN region at 15% or more of the daily pool, about 30% women, and at least two crossover people possible on every board.

**Countries.** `countries.json` gains `bordersSovereign[]`, `capitalsAccepted[]`, `aliases[]`, `entityType`, display names per the naming policy and `recognitionTier`. Kosovo is added through `fetch-country-data.ts` only if the owner signs off (question 3). Copy reads counts from the data and never hard-codes "243".

**Caveats.** `categories.json` gains `caveatId` and `sovereignCoverage`. `ranks.json` is recomputed over sovereign states only. Tourist arrivals are marked ineligible for dailies (163 sovereign entries).

**Stat references.** `src/content/stat-anchors.ts` holds two fixed reference countries per Stat Guesser stat.

### 9.4 Phased plan

**Phase 0: stop the bleeding.** About one week, deployed just after 00:00 Berlin.
- Country Draft leak hotfix on the current game:
  - remove archetype and standing from cards
  - remove fit numbers on unseated seats
  - remove the undo after a reveal
  - fix the glued keyboard hint
  - shuffle trios by seed
- Seed boards with `BOARD_SECRET` (new edition salt at deploy).
- Ship L3 and L4 prose on the Country Draft landing above the FIT table (table removal follows in 14 days, per 8.1).
- "Shoot" becomes "Play" everywhere. Remove all sign-in cues and the Friends and You nav. Mute token to `#6a6b65`.
- Keyboard hints only for fine pointers.
- A fixed Par shown in place of "No shots yet".

**Phase 1a: data.** About 2 weeks, in parallel with phase 1 engineering.
- Recognition tiers (`fetch-pageviews`).
- Wikidata active years, gender and sitelinks; the portrait sweep and `build-portraits`.
- Fit records for the gate countries and the contested-fits review.
- The Phase 1a gate (9.3) must pass before the new Country Draft ships.

**Phase 1: the no-login core and the new home.** About 5 weeks.
- **Backend and integrity:**
  - `daily_boards`, `daily_runs`, `run_steps`, `draft_records`, `rate_events` and `name_reports` with RLS and revoked RPCs
  - the device token in the proxy
  - server-stepped commits with the `publicBoard`/`solution` split for all current dailies
  - the archive date guard and practice exclusion
  - per-slot question flags, the leak check and the solution-file check in CI
- **Leaderboard UI:** "Put me on the leaderboard" (R2 to R4), B1, B2, B4, B5, G9, the device streak on the flame.
- **Home and play shell:** home C-b (G1, G2, H1 to H8; H7 without the map), the result panes R1 to R11, G10, the practice room and frame, the archive, `/imprint` and the privacy rewrite.
- **Clay wave 1.**
- **Country Draft rebuilt:** country choice, hidden fits, the new scoring, both meters, CD1 to CD7, on the gate pool with the phase 1 repeat rules.
- **Games tuned on their current engines:**
  - Flag Quiz (weighted flags 8 to 10, the tier and distance rules for flags 1 to 3, the rotation windows)
  - Higher or Lower (the classic chain, weighted calls, direction balance)
  - Blind Pick moved to its 6 × 6 interim daily rules
- **Clean-up:** delete auth, friends, profile, challenges and push code; freeze the old tables.
- **The iOS app:** same night as the auth removal, ship the App Store metadata update and the privacy label "Identifiers: device ID, not linked to identity", because the app loads the live site.

**Phase 2: the map and the better games.** About 4 weeks.
- The map renderer and the distance matrix.
- GeoWordle: border distance, mini-map, outline clue, bonus. Taiwan becomes guessable.
- The conquest map with true totals, and the H7 atlas map.
- Pinpoint launches as daily slot 3; Blind Pick moves to practice.
- Stat Guesser on the ruler with fixed references. Flag Quiz lookalikes. Speed Flags penalty and input lock.
- Clay wave 2.
- iOS app update without login or push code.

**Phase 3: the world.** About 6 weeks, partly editorial.
- The full fact engine plus the 195 editorial lines with review.
- `/sources`, the country dossiers, the rewritten lists, and Name Them All on continent lists.
- B3 Countries today (it appears automatically at threshold).
- Draft pool growth to about 150 countries, the stricter repeat rules and the tier ramp.
- The fairness check covering every rotation.

**Every phase:**
- `npm run build`
- `check:theme`, `check-contracts`, `check-leaks`, `check-solution-files`, `check-render` (including the small-viewport Play check and the 3-line headline check)
- play every daily on a phone and on desktop
- deploy right after 00:00 Berlin

### 9.5 Blueprint amendments

These override `docs/REBUILD-BLUEPRINT.md` and the project `CLAUDE.md`. Update both files in phase 1, before the code lands, so `check:theme` and future sessions enforce the new rules.

1. **No accounts.** The Supabase auth, `profiles`, `friendships`, `friend_challenges` and `device_tokens` rows are removed from the "tables in use" list. New tables: `daily_boards`, `daily_runs`, `run_steps`, `draft_records`, `rate_events`, `name_reports`.
2. **Non-negotiable 5 is replaced.** "You" is the ember ring on your place flag. Friends do not exist. Country-outline crests are retired. People are shown as "portrait discs".
3. **The leaderboard** has game tabs and Today/Yesterday, not Global/Friends.
4. **The signature list is updated:**
   - the flame shows only with a streak of 2 or more on dynamic routes
   - the plinth notch with its clay object
   - the ink Play button, which replaces the "Shoot" anchor
   - the route line
   - Erode numerals
5. **Speed Flags** runs 30 s with a 3-second penalty for a wrong answer (was 20 s).
6. **Higher or Lower** daily is 10 calls scored out of 13 (was streak scoring). Practice keeps streak scoring.
7. **Blind Pick** is 6 × 6 golf (was 8 countries).
8. **The daily roster** gains Pinpoint; Blind Pick becomes practice-only from phase 2.
9. **New design allowances:**
   - green and burnt brick-orange only inside clay pixels
   - the map palette (3.4)
   - `scrim-light`
   - the shelf footer
   - the plinth notch
10. **`check:theme` rule changes:**
    - drop the "Friends tab" and "crest as you" assertions
    - add the five rules in 9.2
    - allow `<details>` disclosures on results
11. **Seed derivation** requires `BOARD_SECRET`; the "same date plus same edition equals the same board" rule still holds, but only on the server.

---

## 10. Open questions for the owner

1. **Lost streaks.** A device streak disappears when the browser is cleared. Is that acceptable? Or should a "carry code" exist: a 6-character code shown on `/about` that moves the streak and today's runs to another device, with no account? This document assumes no carry code.
2. **Old accounts.** About 19 players have accounts and runs in `game_runs`. Should all auth users and profiles be deleted 30 days after launch, with a notice on `/privacy` and only anonymised aggregates kept? Or deleted at launch?
3. **Naming, the "195" and Kosovo.** Please sign off once on:
   - the set: 193 UN members plus the Holy See and Palestine
   - the display names: Türkiye, Côte d'Ivoire, Czechia, Eswatini, Timor-Leste, DR Congo, Republic of the Congo
   - the labels for Taiwan, Kosovo, Western Sahara, Hong Kong and Macau
   - disputed capitals never being quiz answers
   - whether Kosovo is added to the dataset as a guessable "partially recognised" entity. It is not in `countries.json` today.

   The policy is published on `/sources`.
4. **Editorial review time.** The 195 facts and the contested-fit review of about 2,600 Country Draft judgements need a second human reviewer. Will you review, or should we hire a fact-checker? The phase 1a gate needs reviewed fits for about 36 countries within two weeks.
5. **Sound.** Clay foley on commit and reveal (off by default, with a footer toggle) would strengthen the stop-motion feel, but it needs recorded or licensed sounds. Should it be in v1, later, or never?
6. **The Figma pages.** "Varianten (ohne Login)" and "C ausgearbeitet" are no longer in file `ZKNzvFolKFKjU2EVzWpCBY`; only "Entwurf" can be read. Were they moved to another file? If they contain C-b details that differ from section 2, which wins?
7. **Public repository.** `aydamdonelly/countrivo` is public. This concept moves solution data out of git and seeds boards with a secret, so the repository can stay public. Making it private as well is the simplest extra safeguard. Do you want it private?

---

## Appendix A: Rejected critique points

Most findings were accepted in full. These were rejected, in whole or in part, and the reason is given for each.

1. **Leaks 2 (partly): step rows for archive practice runs.** Rejected. Archive boards are past boards whose answers are already public after midnight. Rolling back a practice cookie affects only unranked play. Daily runs do get server step rows.
2. **Leaks 5 (partly): excluding runs with a hidden tab from the top 50.** Rejected in favour of a visible "paused" label. On phones, switching apps for a notification is common; hiding those runs would push honest players off the board without telling anyone why. The pause is recorded per step and explained on `/about#fair`.
3. **Leaks 6, rule 3: cap finished daily runs at 3 per IP prefix.** Rejected. A school class or a family on one network would be pushed into practice after three players, and schools are a core geography audience. The scout-flag rule (rule 4), first-run-per-prefix statistics (finding 24) and a named-entry cap of 60 per prefix handle the same exploit without blocking groups.
4. **Leaks 7 (partly): re-serialised SVG with randomised precision.** Replaced by a per-run raster at 2× with a sub-pixel offset, which is simpler and has the same effect. Perceptual image matching against the public flags remains possible; we accept that residual risk, because it needs deliberate tooling and the leaderboard does not claim to be prize-grade (1.8).
5. **Leaks 21 (partly): GeoWordle tiebreak by first-guess proximity, and "no rank badge" for one-guess solves.** Rejected. A hidden tiebreak needs explaining and feels arbitrary; shared ranks for equal scores are honest and match Wordle's convention. There are no rank badges in this design. The weighted last rounds for Flag Quiz and Higher or Lower were accepted.
6. **Leaks 26 (partly): rarity only after midnight.** Rejected for rarity. Rarity is shown only to a device that has finished, only about the people it seated itself, so it reveals nothing about unopened content. Scouting is handled by the scout flag. "Best possible" moved to after midnight, as asked.
7. **Leaks 29: hide today's Higher or Lower stat on the card.** Rejected. The stat is shown at the first call anyway, so hiding it on the card buys almost nothing, and "Today: population" is the card's most concrete promise. Look-ups during play are covered by the "paused" record.
8. **Completeness 1 (partly): practice R7 should never show points.** Rejected. Practice boards never contain today's people, so practice values teach without leaking. Learning fits over time is knowledge, which is the skill the game rewards.
9. **Clarity 11 (in form): explain Par as "the always-pick-the-most-famous score".** Superseded. Leaks 13 required Par to be a fixed number per game, not a per-board value. Par is therefore explained as "a good score for this game. Beat it." The famous-picks line remains an internal generation constraint.
10. **Clarity 22, option B (keep the peek, make it scroll).** Not taken. Option A, a full-width Next row on results, was adopted, because a peek on a page without a deck reads as an overflow bug.
11. **Completeness 15 (in form): a separate "event" clay state per object.** Simplified. The in-progress state uses the rest still, and the strip's "3/5" text and H4's live miniature carry progress. This defines the slot without adding 8 generated states.

## Appendix B: Changelog from review

**Security and integrity (leaks critic):**
- Boards are seeded with `HMAC(BOARD_SECRET, …)`. Solution data is moved out of git into private storage (`draft_records`, private distance matrix), and CI fails on tracked solution files (0, 5.9, 7.1, 9.2, 10.7).
- Daily moves are written once in `run_steps`. The cookie holds only a signed `run_id`; re-sending a step returns the stored reveal (1.3, 5.9, 7.1).
- Archive `?date=` returns 404 for today and later, with a contract test (5.9, A1).
- No anonymous access to any table. RPCs are revoked from `anon`, and `board()` returns minimal fields (7.1).
- Practice excludes today's daily people, pairs, answers and flags until midnight, and "Draft from" requires 6 or more portrait people (1.2, 5.1, W2).
- Scout flag on runs that follow a fresh device on the same IP prefix. Statistics use the first run per prefix. The named cap is raised to 60 and the commit cap to 3,000 per hour per prefix (7.2).
- Before midnight, R7 shows names only. "Best possible" appears after midnight (5.1, R6, R7).
- Flag Quiz question images use per-slot, no-store raster URLs (5.4).
- Higher or Lower uses the classic chain with a direction-balance constraint (5.5).
- Pinpoint scoring: `away` over sovereign states only, plus a km term (Chile offshore test). The repeat window is 14 days, asserted. Share squares are mapped by points (5.3).
- GeoWordle: the starter line is removed. Rotation uses soft weights with a 45-day repeat window, and the rules are unpublished (5.2).
- Par is a fixed number per game for all games; per-board Par is gone (1.1, 5.x, 7.3).
- Stat Guesser uses two fixed reference countries per stat (5.6).
- Speed Flags: a 3-second penalty for a wrong answer and a 150 ms input lock (5.8).
- Flag Quiz options for flags 1 to 3 come from one tier and are far apart pairwise, with a contract test (5.4).
- The leak check covers RSC flight data, action responses and prefetches, and play links use `prefetch={false}` (5.9).
- Country Draft generation is loosened (best seats span 2 or more jobs, 1 to 3 crossovers), with general identity lines for single-role people and an accuracy metric (5.1, 8.6).
- A reroll splits the leaderboard per edition ("First board" / "Replaced board") (G8, B1, 7.3).
- Flag Quiz and Higher or Lower: the last three rounds count double (max 13) (5.4, 5.5).
- GeoWordle: entities without data are absent from suggestions, and the clue label is identical for all answers (5.2).
- Draft share squares are in round order (5.1).
- Portraits get a uniform build step (3.10, 9.2).
- An honesty statement and a "paused" record replace the claim that the leaderboard "stays honest" (0, 1.8, 7.2, S1).

**Clarity (first-visit critic):**
- Country choice is select, then "Open [country]", with a warning line (CD1).
- No auto-advance. "Next country" is pinned, a skip layer stops fall-through taps, and new options ignore input for 300 ms (3.7, CD5, G11).
- The strip is removed from landings. The card height maths includes the scroller padding, there is a small-height mode, and Play is checked at 320 × 568, 360 × 640 and 375 × 553 (2.2, 2.3, L1).
- The seat reveal splits fit and fame, with fit words. The "+37" example is corrected to 35 or less, with a contract check (5.1, CD5).
- Bonus lines name the failing job and threshold (CD6).
- Seats always show a plain job word (Leader, Army, Money, Voice, Builder) with points and fit word (3.10, 4.3).
- The region meter uses Af/Am/As/Eu/Oc and clear copy. An ages meter is added, and person cards show "Active …" years (3.10, 5.1).
- One first-run hint per step, server-rendered from `cv_h`. The job sheet says "Nothing is final until you tap Seat." (P2, CD4).
- The tally and conquest map play inside R1 with one count-up. Controls below cannot be hit by skip taps (R1, CD6, CD7).
- The conquest caption explains score as painted countries; the real totals are labelled as a fact (CD7).
- Par is explained (L2, L3, S1 `#par`).
- Back always goes to `/` (2.6, P1).
- The phone play header drops the title text, and the score shows its scale (P1).
- The minimum duration uses server timestamps (Draft 12 s), with non-accusing copy (7.2, R3).
- The desktop Draft job panel lives inside the 960 column (2.6, CD2, CD4).
- The cabinet strip is inside R1 (R1).
- "Last round:" prefix, and seats can be tapped to re-read their line (CD2, CD5).
- Landing order: card, How it works, Today, Yesterday (L).
- The flame appears only with a number on dynamic routes. "Board" is renamed "Leaderboard" (G1).
- R9 is a full-width Next row instead of a peek (R9, 3.10).
- The desktop card shows the game's empty first state (2.4, H3).
- Country cards are plain rectangles (3.5, 3.10).
- Deal and stagger only in round 1 (CD1, CD2).
- Round 1 always has a tier A country, which needs tiers in phase 1a (5.1, 9.4).
- The GeoWordle map has outlines and a 3-fill ladder that never equals land. Touching is ink (3.4, 5.2).
- GeoWordle phone rows use two lines, and proximity % is dropped (GW1).
- Bonus copy is "two quick questions" with a "just for you" note. The clue uses a row (no "7/6") (5.2, GW3, GW4).
- L3 jobs are compact rows on phones (L3).
- The Zidane Ballon d'Or year is corrected to 1998 (5.1).
- `shortName` per figure (5.1, 9.3).
- R2 meta mentions the flag (R2).
- L4 Draft why lines are held back until the pool grows (L4).
- Stamps act on visible content (3.7, CD6).

**Completeness:**
- `daily_boards` snapshots and `engine_version`. The archive starts at relaunch (1.7, 5.9, 7.1, A1).
- Every named entry is shown; thresholds apply only to statistics. "#2 of 3 names" is defined. B1 is designed for 0 to 3 names (B1, H8, L2, 7.3).
- Data feasibility table, phase 1a data gate, minimum pool and relaxed trio rule, and new schema fields (5.1, 9.3, 9.4).
- Deck geometry: notch = clay box + 16, scroller padding, the small-height breakpoint, no seventh strip slot, a scrollable practice strip (2.3, 3.5, G2).
- One deck-order rule, strip anchors, no wrap, and H8 via a client effect (2.3, H2, H6, H8).
- `/imprint`, privacy legal bases, the no-banner statement and the App Store label (S2, S7, 9.4).
- Kosovo absence noted and made an owner decision. Counts read from data (5.2, 9.3, 10.3).
- Phasing fixed: tiers in phase 1a, a fact fallback in phases 1 and 2, H7 without the map in phase 1, a Blind Pick interim daily spec (5.7, 8.4, 9.4).
- Clay: per-game state table, the outcome object owns the R1 notch, the stamp is an overlay, idle sequences for Higher or Lower and Flag Quiz, the `furled` done state, outcome bands for the practice games, realistic byte budgets (4.1 to 4.5).
- No-JS claims corrected: a Pinpoint line, a GeoWordle `<datalist>`, and `cv_d` issued in the proxy (1.3, 5.3, X6).
- The first-visit hint is keyed on `cv_d` (H1).
- Midnight edges: 15-minute naming grace, per-edition ranking, first commit wins across two tabs (1.7, 5.1, G8).
- Redirects for every live route (2.1).
- Desktop specs for every pane (section 6).
- New panes: the place sheet (G9), the share fallback (G10), the skip layer (G11), the change-name flow (R4), viewer reports (B5), the forget-device state (H2, S2), archive indexing (A1), iOS share (1.6), the offline scope (X4).
- Research section "What others do and what we take" (0.2).
- No text in faint, and the region labels fixed (3.4, 3.10).
- Shelf footer replaces the standard footer (G3).
- Share moved into R1, so no stacked full-width buttons (R1, R5).
- Route line removed from the Par row (3.5, 3.10).
- Blueprint amendments and `check:theme` changes (9.5). "Portrait disc" naming (3.10).
- Desktop grid: a free 680 card, and a stage with no maximum height (2.4).
- Tourist arrivals removed, sovereign-only ranks (5.5, 9.3).
- Rotation windows for Flag Quiz, Higher or Lower and Stat Guesser (5.4 to 5.6).
- "Draft from" only for eligible countries (W2).
- ViewTransition marked experimental, with plain navigation as the default (3.7).
- On-demand revalidation instead of ISR (L2, 8.1).
- Admin secret moved to a POST form with a cookie (AD1).
- iOS app update scheduled the same night as the auth removal (9.4).
- FIT table removal staged with a Search Console check (8.1, 9.4).

Sources consulted for 0.2:
- [195-0 World Draft](https://lovableapp.org/products/195-0-com)
- [The Cabinet Beta review](https://lovableapp.org/blog/the-cabinet-beta-vercel-app-2026)
- [Geotrivia: Geography Games](https://apps.apple.com/app/id6758594564)
- [Geo Trivia on GeoFunGames](https://www.geofungames.com/games/trivia)

Files referenced:
- `/Users/adamkahirov/Desktop/code/countrivo/src/styles/tokens.css`
- `/Users/adamkahirov/Desktop/code/countrivo/src/lib/daily-seed.ts`
- `/Users/adamkahirov/Desktop/code/countrivo/src/games/country-draft/module.ts`
- `/Users/adamkahirov/Desktop/code/countrivo/src/games/country-draft/board.tsx`
- `/Users/adamkahirov/Desktop/code/countrivo/src/features/seo/draft-tables.tsx`
- `/Users/adamkahirov/Desktop/code/countrivo/src/app/actions/game-runs.ts`
- `/Users/adamkahirov/Desktop/code/countrivo/src/data/figures.json`
- `/Users/adamkahirov/Desktop/code/countrivo/src/data/draft-pool.json`
- `/Users/adamkahirov/Desktop/code/countrivo/src/data/countries.json`
- `/Users/adamkahirov/Desktop/code/countrivo/next.config.ts`
- `/Users/adamkahirov/Desktop/code/countrivo/public/flags/`
- `/Users/adamkahirov/Desktop/code/clay_image_generation/clay.mjs`