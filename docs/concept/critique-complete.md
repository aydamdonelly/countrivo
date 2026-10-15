# Completeness and consistency review: Countrivo concept v1.0

I checked the concept against the repo data (`src/data/*`, `draft-pool.json`, `portrait-slugs.json`, `capacitor.config.ts`, `next.config.ts`, `tokens.css`). Findings run from most to least severe.

## P0: breaks an owner rule, the core loop, or cannot be built

1. **5.1 / W2 "Draft from Italy" / R7 / R10 bring back the owner's tap-through exploit.**
   - **Problem:** Practice is unlimited and is seeded around any country. Its result shows the passed-over people with their best seat and points (R7 applies to practice too). A player can open a second tab, run practice drafts on today's daily countries, and read every person's points before seating them in the daily. That is the Napoleon problem again, one tab away.
   - **More leaks:**
     - Stat Guesser and Higher or Lower answers sit in the ranked tables on `/categories/[slug]`.
     - A second browser or incognito window is a new `cv_d`, so it can play the daily once to learn the board and the real device then plays it perfectly.
   - **Fix:**
     - Exclude today's 15 daily draft countries and their people from every practice draft until 00:00 Berlin.
     - Disable "Draft from X" for those countries for the day.
     - In practice, R7 shows names and why lines only, never points.
     - Rewrite section 0 and 7.2, which say the board "stays honest". Say what is true instead: the server stops forged scores, not looked-up answers. The board is for fun.
     - Optionally set `verified=false` on a second finished run of the same board from the same `ip_hash` within 10 minutes.

2. **5.5 Higher or Lower chain rule cannot be satisfied.**
   - **Problem:** "The country with the higher value stays as the next left card", so the left value only ever goes up. Combined with "bigger value left or right 50/50", "call 1 rank gap ≥80" and "call 10 gap 3 to 8":
     - After about three "higher" outcomes the left card sits near rank 1, so no valid challenger can be higher.
     - Players learn that "Lower" gets more and more likely, which is a strategy that needs no knowledge.
   - **Fix:** Use the classic rule (the right card always becomes the next left card), or draw an independent pair each call. Then write the generator constraint as rank-gap and direction balance per call, checked in `check-contracts.ts`.

3. **Section 7 data model has no board snapshot table.**
   - **Problem:** Several features rebuild past boards from `dateSeed(dateKey+edition)` plus the current data:
     - L4 Yesterday's answers, B2, A1 archive and B4 run pages
     - percentiles over yesterday's runs
     - P6 "finish as practice"

     But 1.7 tells deploys to bump `POOL_VERSION` and data at 00:00. After any data deploy, yesterday's and archived boards rebuild differently from what was played. The archive "every board since launch" also crosses engine rewrites (new Draft scoring, border distance in GeoWordle).
   - **Fix:**
     - Add `daily_boards(game, date_key, edition, engine_version, pool_version, public_board jsonb, solution jsonb, par, ceiling)`, written once at first build of the day. Every past-board surface reads from it.
     - Add `engine_version` to `daily_runs`.
     - The archive starts at the relaunch date.

4. **B1 / L2 / H8 "under 5 names show only Par" contradicts R4 and the real traffic.**
   - **Problem:** Traffic is about 33 visitors a day with about 1% naming today. A player who taps "Put me on" lands on a board that hides their own row. R4 then says "You're #1 of 1" with a 5-row snippet that does not exist on B1.
   - **Fix:**
     - Always show every named entry (1 to 4 included) plus Par.
     - Apply the threshold only to percentile and rarity (N≥20) and to counts.
     - Design B1 with 0 to 3 names as the primary state.
     - Define the denominator in "#14 of 63": named entries, or all verified runs?

5. **9.3 / 9.4 Phase 1 Country Draft cannot be built with today's data.** The concept's own constraints fail against what is in the repo:

   | Item | Needed | In repo today |
   |---|---|---|
   | Draft pool | Daily pool of countries, each region represented | 51 countries, Oceania = 2 (AUS, NZL), Europe = 21 |
   | Portraits in the pool | Portrait-only daily | 304 of 514 people by slug match |
   | Countries with ≥3 portrait people | Enough to vary trios | 42; 9 have fewer than 3 (unusable); 8 have exactly 3, so their trio is fixed and breaks "no identical trio within 30 days" |
   | Years | Person cards ("1769 to 1821") and the "Across the ages" bonus | Only `era: historical/modern` |
   | Fit and reach inputs | `sitelinks`, `record[]`, headline | None of these exist |
   | Women target | "About 30% women" | No gender field |

   - **Workload:** Fit authoring is about 2,570 judgements with evidence, plus human review, inside a 4-week phase that also holds the backend, home and clay wave 1.
   - **Fix:**
     - Make the data work its own Phase 1a with a gate: portraits ≥ X per country, and fits reviewed for the countries in the first 30 boards.
     - Relax the 30-day trio rule to "no identical trio on consecutive appearances" until the pool grows.
     - Add `born`, `died`, `gender` and `active_until` to the 9.3 schema.
     - State the minimum daily pool explicitly (for example ≥40 countries, ≥3 per UN region).

6. **5.1 / CD5 example "+37 The Field" exceeds the per-seat maximum.** Fit 25 plus reach 10 is 35.
   - **Fix:** Correct the example and add a copy check that the why-line number is ≤35.

7. **GW1 / 5.2 band tones are invisible on the mini-map.**
   - **Problem:**
     - "Cool" is `wait`, which is the same colour as unguessed land.
     - "Cold" is `line` #e9e8e1. That is 1.18:1 against the paper ocean and lighter than land, so a cold guess reads as a hole or water.
     - Ember means "wrong" everywhere else but means "Touching", the best non-solve, here.
   - **Fix:**
     - Change the map land fill (for example `card`), or make the cold and cool bands an outline or hatch.
     - Give "Touching" ink plus a check-style word, and keep ember for wrong.
     - Keep the band word in ink text, never in the tone colour.

8. **2.3 / 3.5 / H3 deck geometry clips the signature, and the strip overflows.**
   - **The scroller clips the clay:** A horizontal scroll container (`overflow-x:auto`) also clips on the y axis. The clay rising 40 px above the card and the Play button overhanging by 22 px get cut off unless the scroller has internal padding of at least 40 px on top and 22 px plus focus ring at the bottom. The 520 px phone budget has no room for those 40 px.
   - **The clay is wider than its notch:**
     - Phone: clay 160 px in a 30% notch (about 97 px at a 322 px card).
     - Desktop: clay 240 px in a 204 px notch.

     The object overhangs the title zone, which breaks "clear the cut".
   - **The Play button falls below the fold on small iPhones:** On an iPhone SE in Safari (svh about 553), the card clamp minimum of 440 + 128 of chrome + 22 = 590.
   - **The strip overflows:**
     - Phone strip: 6 × 58 = 348 px, but the 7th "Full set" slot (G2) needs 406, and the practice strip with 8 games needs 464, against 350 px of content.
   - **Fix:**
     - Set notch width = clay box + 16 px.
     - Put the scroller padding into the height math.
     - Add a `max-height:600px` breakpoint: clay 120, three lines become two, card minimum 380.
     - Show the "Full set" state in place of the focus bar, not as a 7th slot.
     - Make the practice strip scrollable, or drop it on phones.

9. **2.3 vs 3.7 vs H2 vs H6 vs H8: the deck order and behaviour contradict each other.**
   - **The contradictions:**
     - 2.3 sets the opening position with an "initial scrollLeft in an inline style-free attribute". HTML cannot set `scrollLeft`.
     - 3.7 says the deck is a rotation.
     - H2 orders unplayed, then in progress, then done, while also opening an in-progress card first. It also keeps the strip in fixed order, so the strip and deck orders differ and "tap strip item scrolls deck" needs a mapping.
     - H6 says the deck "wraps", but scroll-snap does not wrap.
     - H8 switches its block "by CSS :has() keyed by the snapped card". No cross-browser CSS can detect the snapped item (`scroll-state()` is Chromium-only).
   - **Fix:**
     - One rule: deck order = strip order rotated to start at the first unplayed card, with in-progress first if it was touched last.
     - Strip items are `<a href="#card-slug">` so they work without JS.
     - No wrap; the last card is H7 or nothing.
     - H8 updates through a small client effect (`scrollsnapchange`, or IntersectionObserver fallback). Before hydration all six blocks render, or only the first.

10. **Missing legal pane: Impressum (§5 DDG, German operator).**
    - **Fix:**
      - Add `/imprint`, footer-linked.
      - S2 Privacy names the legal basis for `cv_d`, the IP hash and the stored runs (strictly necessary, legitimate interest), and states "no consent banner because no non-essential cookies".
      - The App Store privacy nutrition label is updated to "Identifiers: device, not linked to identity".

## P1: an inconsistency that will cause a wrong build

11. **5.2 GeoWordle clue scoring contradicts itself.**
    - **Problem:** GW3 says the clue consumes a row (⬛ "Clue"), so rows used ≤6 and a score of 7 can never happen. 5.2 says a 6th-guess solve with the clue scores 7 and shows as "7/6".
    - **Fix:** Pick one. Either the clue takes a row (max 6, the score is rows used), or the clue is +1 penalty with 6 real guesses kept. Align the share squares to match.

12. **5.2 / 10.3 Kosovo is not in the dataset.** `countries.json` has 243 entities without XKX. Taiwan, Hong Kong, Macau and Western Sahara are present.
    - **Fix:** Add Kosovo through `fetch-country-data.ts` (244, and update every "243" in the copy), or drop it from 5.2 and section 10.

13. **5.3 Pinpoint scoring has gaps.**
    - **Gaps:**
      - The share mapping has no square for `away = 0` when not inside (170 points).
      - `away` counts all 243 entities including territories, while answers are sovereign. A tap near Cocos or Christmas Island is penalised.
      - In sparse oceans a miss of about 2,500 km can still score 170, so "region-fair" over-rewards vague taps in Oceania and Africa.
      - Natural Earth 1:50m admin-0 does not match the 243 list one to one (micro-territories) [verify coverage].
      - `.t-big` at 56 px wraps "Saint Vincent and the Grenadines" to 3 or more lines, which the concept forbids.
    - **Fix:**
      - Define `away` over sovereign states only.
      - Add a km term, for example `points = min(170 − 30·away, 170·(1 − d/3000))`.
      - Map `away 0` to 🟨.
      - Use 1:10m geometry for entities missing at 50m.
      - Add a fit-to-width rule: step down to `.t-score-l`, and allow at most 2 lines.

14. **9.4 phase sequencing breaks the dependencies.**
    - **The dependencies:**
      - Recognition tiers (`fetch-pageviews`, phase 3) are required by the Phase 1/2 rotations of Flag Quiz, Stat Guesser round 1, Pinpoint rounds 1 to 3, GeoWordle Mon to Thu, and Draft.
      - The fact engine (phase 3) is required by principle 5 and by PP2, GW7, H7, R8 and the HL line in phases 1 and 2.
      - The map renderer (phase 2) is required by the H7 atlas in phase 1.
      - Blind Pick stays daily through phase 1, but it has no outcome band (4.4), no minimum duration (7.2), no Par, no daily share format and no result spec.
    - **Fix:**
      - Move tiers to phase 1. They are a one-script job.
      - Define the phase 1/2 fact fallback (generated rank contrast only).
      - Ship H7 without the map until phase 2.
      - Add a "Blind Pick interim daily" spec block.

15. **4.x clay inventory is incomplete.**
    - **Gaps:**
      - The "event" state used by G2 and H4 is never defined per object.
      - Idle sequences are missing for Higher or Lower (`hl-right` is a reveal) and Flag Quiz (`fq` is the right-answer flutter).
      - Done stills exist only for Draft (coins) and Flag Quiz (rosette), yet G2 needs a done still for all six.
      - R1 puts the outcome object (trophy, rosette or hill) in the notch while `cd-done` and `gw-solve` also claim the finish moment. Which one plays is undefined.
      - S6 puts "the stamp in the notch next to each game's clay", which is two objects in one notch.
      - Blind Pick and Speed Flags have no outcome band.
    - **Budget:**
      - Home carries 6 heroes × 2 to 3 states at 12 KB, 6 strip stills, the trophy and the crate. That is roughly 200 KB, over the 150 KB route budget.
      - 12 KB WebP with alpha at 512 px is unrealistic.
    - **Fix:**
      - A per-game state table with columns rest / idle / event / done / reveal-good / reveal-bad.
      - Rule: the outcome object owns the R1 notch, and the game object plays its done state in the header slot.
      - The practice stamp becomes a small overlay on the game's own notch object, not a second object.
      - Budget per state: AVIF 12 KB, WebP 20 KB. Lazy-load the idle states of non-focused cards and count only state 1 toward the budget.

16. **X6 / 5.3 no-JS claims are impossible.**
    - **Problem:**
      - The Pinpoint keyboard crosshair "works without JS through a form" cannot work, because arrow keys need JS.
      - GeoWordle suggestions need JS.
      - `cv_d` "issued on the first request that renders a dynamic route" cannot be set during RSC render in Next 16.
    - **Fix:**
      - Pinpoint no-JS is a lat/lon select or a "not available without JavaScript" line.
      - GeoWordle uses `<datalist>`.
      - Issue `cv_d` in `src/proxy.ts`, scoped to dynamic paths.

17. **H1 hint line hides through localStorage, which shifts layout for returning visitors.**
    - **Problem:** The server cannot know the localStorage flag, so the hint renders and is then removed after hydration.
    - **Fix:** Key it on `cv_d` existing or a `cv_seen` cookie, so the server renders the final state.

18. **Midnight edges are underspecified.**
    - **Gaps:**
      - A run finished at 23:59:50 and named at 00:00:10 gets "Today's board closed" (R3). That is hostile.
      - An admin reroll (G8) mixes two editions' scores in one ranking and one Par.
      - Two tabs committing the same step is undefined.
    - **Fix:**
      - Add a 15-minute naming grace window onto the run's own `date_key`.
      - Rank per edition, or show "old board" runs in a separate group.
      - First commit per step index wins; the other tab receives the current state and re-renders.

19. **2.1 redirects miss routes that are live today.** These exist and are not covered:
    - `/games/[slug]/leaderboard`
    - `/games/[slug]/run/[runId]`
    - `/friends/add/[username]`
    - `/profile/[username]`
    - `/vs/:code`, which already goes to `/games`

    "/friends and /profile 301" needs `:path*`.
    - **Fix:** Add explicit 301s to `/leaderboard?game=slug` and `/run/[id]` (or `/`).

20. **Desktop specs are missing for most panes.** The task requires desktop for each pane. These have no desktop spec:
    - Country Draft: CD3, CD5, CD6, CD7
    - GeoWordle: GW3 to GW7
    - Pinpoint: PP2
    - Higher or Lower: HL2
    - Stat Guesser: SG2
    - Flag Quiz: FQ1, FQ2
    - Speed Flags: RF1
    - Results: R1 to R11, apart from R1's width
    - Boards and archive: B2, B3, B4, A1
    - World pages: W3 to W8
    - Static and system: S1 to S6, X1 to X4
    - Global and play shell: G6, G7, G8, P2 to P6
    - Admin: AD1

    - **Fix:** Add a desktop line to each pane: column width, sheet as side panel, and where the next-card peek sits on the result page (R9 on desktop has no defined container).

21. **Panes the owner asked for are missing.**
    - Place sheet (opened by R2 "Change").
    - The Change name flow: inline edit, validation, toast.
    - Share fallback for when `navigator.share` is cancelled or the clipboard is denied. The concept forbids any preview, so a failure shows nothing. Show the text in a selectable sheet only on failure.
    - The state after "Forget this device": home becomes a first visit, and the streak shows 0.
    - Viewer "report a name" (AD1 Hide alone needs the admin to notice).
    - Whether the archive is indexed (A1 noindex or index).
    - The iOS share route (Capacitor Share plugin).
    - The in-app first-run with no web offline page. The web has no X4 equivalent; state that G7 covers it.

22. **Section 10 open question 6 and the owner request: no research section.**
    - **Problem:** The owner explicitly asked to research GeoTrivia and others. The concept cites no competitors (GeoGuessr, Worldle, Globle, Travle, Flagle, 195-0 World Draft, Seterra, Geotastic) and does not say which mechanics were taken or rejected.
    - **Fix:** Add a section "What others do and what we take", one row per product, linked to the decisions (border distance, bonus chain, Pinpoint).

## P2: anti-slop law and house rules

23. **3.4 / G2: text set in faint.** Inactive strip state lines are faint #b9b8b1, which is 1.91:1 and is text. That contradicts "No text is set in faint", and G2 says those lines are mute.
    - **Fix:** Use mute.

24. **3.10 region meter initials collide.** Africa, Americas and Asia are all "A".
    - **Fix:** Label with the full region name in meta, or use five small region shapes.

25. **G3 is the "standard footer" slop pattern.** It is an about line plus three link columns aligned to the grid.
    - **Fix:** Compose it from the brand, for example the clay crate and globe standing on a footer "shelf" with links as one sentence line. Or keep a single row.

26. **R2 + R5 form the stacked primary/secondary template:** a full-width ink button directly over a full-width card-fill button.
    - **Fix:** Make Share an icon-plus-word inline action in the R1 card corner, not a second full-width bar.

27. **3.5 route line:** it is defined as "only distance or a path" but is also used as decoration above the Par row.
    - **Fix:** Drop it from Par. Mark Par by Erode "Par" and tone alone.

28. **Governing docs contradicted, not amended.** CLAUDE.md and the REBUILD-BLUEPRINT still mandate:
    - Global and Friends tabs
    - crests (the country outline) as "you"
    - Speed Flags at 20 s
    - Higher or Lower streak scoring
    - the "Shoot" anchor card

    The concept also reuses "crest" for portraits. `check:theme` may enforce the old rules.
    - **Fix:** Add a "Blueprint amendments" list to the concept, rename the portrait token to "portrait disc", and list the `check:theme` rule changes.

29. **2.4 desktop grid arithmetic is wrong.**
    - Columns 3 to 9 of a 12-column grid are 7 columns at 690 px and are not centred: 2 columns left, 3 right.
    - "Below-fold begins exactly at 100svh" fails on tall screens once the stage hits its 640 max (64 + 88 + 640 = 792 < 900).
    - **Fix:** Use columns 3 to 10 (8 columns, 792 px) or a free 680 centred. Let the stage fill `100svh − 152` with no max, and cap card content height inside it.

## P3: smaller data and verification items

30. **Stat eligibility.** `tourism-arrivals` has 163 sovereign entries, so it fails the ≥180 rule. Remove it from the 5.5 list. `ranks.json` must be recomputed over sovereign states only.
31. **Flag delivery and rotation.** 5.4 says the flag path is "opaque per-board". 5.9 says it is `sha256(FLAG_SALT+iso)`, which is static and learnable over days. Pick per-board salting. No-repeat windows are missing for Flag Quiz (including lookalike sets, of which there are only about 10), Higher or Lower stats and pairs, and Stat Guesser questions.
32. **W2 "Draft from [country]".** It can only exist for the 51 pool countries (later about 150), not all 195. Hide it otherwise.
33. **React `<ViewTransition>`.** It is still experimental in React 19.2 / Next 16 (`experimental.viewTransition`). Mark it [verify] with the plain-navigation fallback as the default.
34. **L2 ISR every 120 s on every landing.** This conflicts with the recent commit that cut landing ISR rewrites. Use on-demand revalidation when a name is submitted.
35. **AD1 token in the URL path.** It leaks into logs and referrers. Use a POST form with the secret plus an httpOnly admin cookie.
36. **Phase 1 deletion of auth affects the iOS app.** The app loads the live site, so removing auth and push changes the shipped binary's behaviour at once. Schedule the App Store metadata and privacy-label update for the same night.
37. **SEO risk on `/games/country-draft`.** It carries 83% of clicks. Removing the FIT table and putting the card first changes the ranking content. Ship L3 and L4 prose first, watch Search Console for 14 days, then remove the table.

Files checked:
- `/Users/adamkahirov/Desktop/code/countrivo/src/data/draft-pool.json`
- `/Users/adamkahirov/Desktop/code/countrivo/src/data/figures.json`
- `/Users/adamkahirov/Desktop/code/countrivo/src/data/portrait-slugs.json`
- `/Users/adamkahirov/Desktop/code/countrivo/src/data/countries.json`
- `/Users/adamkahirov/Desktop/code/countrivo/src/data/stats.json`
- `/Users/adamkahirov/Desktop/code/countrivo/src/data/silhouettes.json`
- `/Users/adamkahirov/Desktop/code/countrivo/src/styles/tokens.css`
- `/Users/adamkahirov/Desktop/code/countrivo/next.config.ts`
- `/Users/adamkahirov/Desktop/code/countrivo/capacitor.config.ts`