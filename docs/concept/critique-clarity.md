# Country Draft first-visit walkthrough: findings by severity

Three personas tested this route on a phone: the Teen (14), the Casual (45) and the Nerd. The path goes from Google to `/games/country-draft`, through the play panes CD1 to CD7, the results R1 to R9, and into the next game, GeoWordle. Desktop notes are marked "Desktop". Each finding gives the pane, what went wrong, and a concrete fix.

## Critical: wrong irreversible actions, or Play is hard to reach

1. **CD1: one tap on a country card commits for good, without any warning.** Desktop has the same problem: pressing 1, 2 or 3 commits.
   - The Teen taps France to "see who's in it" and is locked in.
   - This clashes with CD2 and CD4, where tapping a person only opens a preview and nothing is final until "Seat …". The player learns "tapping is safe" one step too late.
   - **Fix:**
     - The first tap only selects the card (2 px ink outline).
     - A pinned button reads "Open France". On desktop, pressing 1 to 3 selects and Enter opens.
     - CD1 line: "Round 1 of 5: choose a country. You'll see three of its people. You can't switch after."

2. **CD5 to CD1: auto-deal plus tap-to-skip leads to an accidental country commit.**
   - The "Next country" button only lasts 1.4 s. A Casual reaching for it hits a country card that has just dealt in under the thumb. "Tap anywhere skips" can also pass through to that card.
   - **Fix:**
     - Remove the auto-advance. "Next country" stays as a pinned button until it is tapped.
     - Skip taps are caught by a layer and never reach the cards.
     - Country cards ignore input for the first 300 ms after the deal.

3. **L1/H3 on small phones: Play falls below the fold.**
   - On an iPhone SE or a 360 × 640 Android with browser bars (about 550 px visible), the stack is header 52 + strip 76 + card at least 440 + 22 px Play overhang = 590 px.
   - The Casual sees no button. "Tap anywhere on the card" is never explained.
   - **Fix:**
     - Remove the strip on landings (L6 "More games" already covers it).
     - Lower the card minimum to `clamp(360px, 100svh - 120px, 560px)`.
     - Check at 320 × 568 and 375 × 553 that Play is fully visible.

4. **CD5: points cannot be explained from the screen.**
   - "+9 The Purse. Never held a finance post." makes the Casual ask why they got 9 points for something the person never did. The 9 is pure fame, and the line never says so.
   - The spec's own example "+37 The Field" is impossible: the maximum per seat is 25 fit + 10 reach = 35.
   - **Fix:**
     - Split every reveal into two parts: "+9 The Purse: 0 for the job (never held a finance post), +9 for fame."
     - Name the fit level in words: "Natural fit 25", "Strong 18", "Plausible 12", "Thin 6", "No fit 0".
     - Correct the example copy.

5. **CD6: the bonuses can't be learned.**
   - "Full cabinet: a job was thin" names neither the job nor the threshold. Fit was never shown apart from fame (see 4), so the player cannot connect the dots.
   - **Fix:**
     - Use "No full-cabinet bonus: The Purse was only a thin fit (needs 12 or more for the job)."
     - Show each seat's fit word on its seat once seated.

## High: unclear state or unclear next step

6. **CD1, CD4 and CD5: job names disappear once a seat is filled, and the names are cryptic.**
   - An empty seat shows "The Field". A filled one shows only clay, a 28 px greyscale crest and points.
   - Two rounds in, the Teen can't tell which seat is the army. "The Desk" reads as "office worker", not "builds and invents". "The Voice" reads as a TV show.
   - **Fix:**
     - Always print the job name under the clay, with the points beside it.
     - On the phone strip, use plain words: "Leader", "Army", "Money", "Voice", "Builder". The sheet keeps "The Field, runs the army".

7. **CD1 region meter: the initials collide and the goal is unclear.**
   - Africa, Americas and Asia all become "A".
   - Five circles next to "Regions 2 of 3 for +6" make the Casual think all five are needed.
   - **Fix:**
     - Use two-letter labels "Af Am As Eu Oc" on phones and full names on desktop.
     - Copy: "Seat people from 3 different regions: +6. You have 2."
     - After it is reached: "3 regions: +6 earned."

8. **P2: the hint disappears after the first commit**, which is the country pick, while steps 2 and 3 are the confusing ones.
   - Seeing three people, the Casual doesn't know a tap opens the jobs.
   - In the sheet, nobody knows that closing it is safe ("put back" is never said).
   - **Fix:**
     - Use one hint per step on the first run: "Pick a country. Its people appear next." Then "Tap a person to give them a job." Then "Pick a job, then Seat. Closing this changes nothing."
     - CD4 header meta: "Nothing is final until you tap Seat."

9. **CD6, CD7 and R1: a slow, repeated and jumpy ending.**
   - The total ticks up three times: the header score, the tally at `.t-score-xl`, then R1 again.
   - The tally takes about 2.4 s and the conquest about 2 s before R1 appears. R1 then sits *above* the map, so the map the player was watching jumps down.
   - Tapping to skip can land on "Put me on the leaderboard" as it appears.
   - **Fix:**
     - R1 is in place from the first frame, with the final number in the DOM.
     - The bonus lines and the map play *inside* R1 below the score, once.
     - Only one count-up.
     - Leaderboard and Share controls ignore taps until the sequence ends or is skipped.

10. **CD7: two maps of "the world" contradict each other.**
    - The animation fills 158 of 195 countries. The line underneath says "11% of the land".
    - The Nerd asks whether he conquered 158 countries or 11%. The Casual doesn't know what 195 counts.
    - **Fix:**
      - Caption the animation: "158 points = 158 of 195 countries painted."
      - Label the real numbers as a fact: "In real life, your five homelands hold 1.9 billion people and 11% of the land."
      - Card meta: "Score up to 195, one per country."

11. **"Par" is never explained** (H3 meta "Par 142", L2 "Par today: 142", R1 "Par 142. 12 short.", board Par row). The Teen and Casual don't know the golf term.
    - **Fix:**
      - Card meta "Par 142: the always-pick-the-most-famous score".
      - Short form elsewhere: "Par 142 (most-famous picks)".
      - L2: "Beat Par: the score you'd get by always picking the most famous person."

12. **P1 Back to L1: the landing says "Play" during a run, so it looks like the run is lost.** The landing is static, so it can't show H4 "Continue".
    - **Fix:**
      - When a run is in progress, Back goes to `/` (dynamic, shows H4 "Continue").
      - Or show a toast on back: "Saved. Tap Play to pick up where you left off." and label the landing button "Play or continue".

13. **P1 header overflows at 390 and breaks at 360.**
    - Back 44 + clay 32 + "Country Draft" in `.t-h3` (about 120) + 5 pips + score + "?" 44, plus gaps, comes to about 372 px in a 350 px column.
    - **Fix:**
      - On phones, drop the title text (the clay names the game; keep the title in `aria-label`).
      - Score reads "37 of 195" so the scale is clear.

14. **R3 and section 7.2: honest players get blocked with accusing copy.**
    - With "tap anywhere skips", the Nerd finishes in under 25 s and sees "This run couldn't be checked, so it can't go on the board."
    - A school class on one network hits the cap of 10 names per IP per game.
    - **Fix:**
      - Measure the minimum duration from server commit timestamps and set it to 12 s.
      - Raise the per-IP name cap to 60 and rely on device uniqueness.
      - Copy: "This run finished faster than we can verify, so it stays private. Your score still counts for you."

15. **G2 strip on L1: unlabeled clay with undefined taps.**
    - Above the H1 there are six mystery objects with no names. The landing has no deck, so "tap snaps the deck" does nothing.
    - **Fix:**
      - Remove the strip from landings.
      - If it is kept, add a 12 px game name under each item and link each one to its landing.

16. **Desktop, CD4: the side panel doesn't fit common laptops.**
    - A 960 px column plus a 400 px panel is 1360 px, more than 1280 and 1366 widths. The panel covers the people cards, against the spec's promise that they stay visible.
    - **Fix:** while a person is held, the people collapse into a 520 px left column of three rows, and the job panel sits inside the 960 column on the right.

## Medium

17. **R6: the "why" is hidden.**
    - The seat breakdown is a closed disclosure below the leaderboard, Share and Next. The Casual wants to know why 158 before deciding to post it.
    - **Fix:** keep the cabinet strip (five seats, crests, points, fit words) inside R1. Only the why lines and sources go in the disclosure.

18. **CD1, CD2 and CD6: "Across the ages" isn't tracked during play.**
    - Regions have a meter; eras don't.
    - The cards show *life* years ("1769 to 1821"), but the rule is about when the main activity ended, so the Nerd predicts it wrong.
    - **Fix:**
      - Add a second meter: "Before 1900: done. After 1950: not yet. +6."
      - Person meta shows "Active 1796 to 1815".

19. **CD2 on phone: last round's why line stays under the strip while the next country's people are on screen.** "+33 The Field. Won most of his pitched battles" sits above Italy's three people.
    - **Fix:**
      - When the next country opens, prefix the line "Last round:" in mute.
      - Make seats tappable to re-read their line.

20. **L1 to L3: the landing order is wrong for newcomers.** With current traffic, L2 (an almost empty board, "put your name next to Par") comes before L3 How it works.
    - **Fix:** on landings use the order card, L3, L2, L4. Home can keep its own order.

21. **G1: flame and Board.**
    - The flame burns with no label on the landing, which is a mystery to the Teen.
    - A returning player sees no number on static routes and thinks the streak is lost.
    - "Board" could mean the game board.
    - **Fix:**
      - Show the flame only once a streak of 2 or more exists, on dynamic routes only; static routes show nothing.
      - Rename the link "Leaderboard" to match the "Put me on the leaderboard" button.

22. **R9: the peeking card beside R1 looks like an overflow bug** to someone who never saw the deck. Tapping it plays the game, while H6's peek only scrolls the deck, so the same element behaves two ways.
    - **Fix:**
      - On result pages, replace the peek with a full-width card row: "Next: GeoWordle", one line, Play.
      - Or keep the peek with the hint "Next game" and make it scroll, not play.

23. **Desktop, L1: a lone 680 px card on a 1440 stage**, with about 380 px of empty paper on each side. It reads unfinished.
    - **Fix:** inside the card's right half, show the five empty cabinet seats (clay at 56 with job names) under the notch object. This previews the mechanic and fills the frame without a side rail.

24. **CD1: country cards share the plinth notch but have no object in it.** An empty bite out of each 96 px card looks broken.
    - **Fix:** use plain 12 px rectangles for country cards, or stand the flag in the notch.

25. **CD1 and CD2 animation tax: about 3.3 s of forced motion per round**, from the 3-beat deal, the 120 ms flip stagger, the 900 ms reveal and the 1.4 s wait. Over five rounds that is about 16 s; the Nerd feels slowed down.
    - **Fix:**
      - Deal on twos in round 1 only. Later rounds swap with a single 2-frame stamp.
      - Drop the flip stagger after round 1.

26. **CD1 data, phase 1: round 1 can offer three countries whose people the Teen can't name.** With the 51-country pool this happens, and the game then feels random.
    - **Fix:** pull forward the phase-3 rule now: round 1 always contains at least one tier-A country.

## GeoWordle, the next game in the path

27. **GW1 mini-map: some tones vanish.** Cool = `wait` is the same colour as land, so guessed Cool countries can't be told from unguessed ones. Cold = `line` on paper is near-invisible.
    - **Fix:** give every guessed country a 1.5 px ink outline, and use a tone ladder that never equals the land fill.

28. **GW1: the guess row overflows a 350 px row.** It holds flag, name, distance, arrow, band word and proximity %. "Central African Republic" alone breaks it.
    - **Fix:** on phones use two lines (name on line 1; km, arrow and band on line 2) and drop the %.

29. **GW4 and scoring copy.**
    - "Bonus: three quick questions" leads to two questions plus a fact.
    - "7/6" reads as a typo.
    - "+2 bonus" has no stated meaning.
    - **Fix:**
      - "Bonus: two quick questions".
      - Show "6/6 with clue".
      - "Bonus points are just for you and don't change your score."

## Low

30. **L3: the five-job row lays out 2 + 2 + 1 on phones**, leaving an orphan. **Fix:** five compact rows (clay 40, name, line) or one horizontal snap row.

31. **Copy facts.**
    - Zidane's Ballon d'Or was 1998, not 1995.
    - "+37" exceeds the 35 maximum.
    - **Fix:** correct both and run the [verify] pass on all example lines.

32. **CD4: "Give [first name] a job" fails for names written family name first** and for Iberian or Arabic forms. **Fix:** a stored `shortName` field per figure, falling back to the full name.

33. **R2: the place is prefilled from geo and published as a flag.** The Teen may not realise. **Fix:** meta reads "Your name and flag show on today's public board."

34. **L4: yesterday's answers publish why-lines** for people who will come back soon in a 51-country pool, so the Nerd memorises fits. **Fix:** show only the best cabinet's names and total until the pool reaches about 150 countries.

35. **CD6: the lines "appear on twos" while the law bans gated content.** The mechanism is unspecified. **Fix:** state that all lines are visible from frame 1 and that only a 2-frame ink-weight stamp plays on each.

36. **CD2: uniform greyscale portraits make living people (Zidane, Macron) look historical**, which confuses era judgement. **Fix:** keep greyscale for consistency, but always show years prominently, as "Active …" (see 18).