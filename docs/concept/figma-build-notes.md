# Figma build notes (12 October 2026)

File: https://www.figma.com/design/ZKNzvFolKFKjU2EVzWpCBY, page "Start hier" first.
281 phone/desktop frames on pages 01 to 08 plus the design system page. Fonts in Figma are stand-ins
(Source Serif 4 for Erode 600, Inter for system-ui). Clay assets: docs/concept/clay-manifest.json.

## Concept contradictions found while building, and how the frames resolve them

Home and shell
- The phone peek shows the next card's left 38 px, but clay sits in its top-right notch, so the peek can never show clay (2.3).
- The card height formula gives 540 px at 844 px, the concept example and component use 446. Frames use 446.
- H7 Day complete needs about 608 px on phone, more than the card cap; the H7 card is taller.
- Strip "in progress" line is undefined; frames show steps done ("2/5"), the card meta shows the round.
- G8 reroll notice is only specified on the card, not in the play header or that game's leaderboard.

Country Draft
- Napoleon is neither in the draft pool nor in public/figures; examples use Dangote, de Gaulle, Hugo, Chanel.
- Route lines are mute, but conquered countries are mute too (3.4/3.5): on the conquest map lines are ink.
- Disabled text on disabled fill is about 1.6:1; disabled labels use mute on card.
- Practice cards in card tone vanish on the card-tone practice ground; practice cards use paper.
- The tally adds a "Five seats 133" row so the total adds up visibly.

GeoWordle and Pinpoint
- "Route lines converging" can only appear after the answer is known; lines show only on the solve frame.
- The running GeoWordle score during guessing is undefined; frames show rows used ("3/6").
- Wording for the doubled Pinpoint round 5 is undefined; frames say "110, counted double: 220."
- "Pick its capital." needs the country on screen; a flag and name row was added.

Quick games
- The Higher or Lower example Mongolia vs Uruguay is 2.7% apart, against the 3% exclusion rule.
- Stat Guesser anchors Kenya and Germany are not the 25th/75th percentiles; frames use Jamaica and Australia.
- Flag Quiz asks for each flag's true aspect ratio, but public/flags are all 4:3.
- Blind Pick "of 193" assumes 193 states; real counts differ per stat (195, 194, 190).

Results and leaderboards
- Names are not unique (1.4), so "name taken" cannot happen; R3 covers reserved and blocked names only.
- B1 with 1 to 3 names repeats "No names yet today"; the sentence is dropped there.
- R10 practice: the Next row title is undefined; frames use "One more".
- The archive's relaunch date is not given; placeholder 14 September 2026.

World pages
- Kosovo is already in countries.json (UNK), the concept says it is not.
- The Area stat is labelled "Land Area" but holds total area (China ranks ahead of the US).
- Taiwan and Western Sahara labels wait on open question 3.

Static and system
- Imprint address is unknown: "Street and number / Postcode and city" placeholder on S7.
- Blind Pick and Speed Flags have no card copy in the concept; copy was derived from 5.7 and 5.8.
- X4 offline is iOS only; the desktop frame is a "not applicable" note.

Clay
- The concept says 22 objects but defines 21 ids. Some states drifted (four chairs instead of three,
  mirrored globe arm in afreu/asia/pacific, faint squash states on CL-10 to CL-14); pick finals by eye.
