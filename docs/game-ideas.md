# Game & Category Ideas Backlog

## New Games

### Capital Blitz
- **Concept:** Type as many capitals as possible in 60 seconds. Pure typing, no multiple choice.
- **Mechanics:** Country name shown → type the capital → Enter → next. Score = how many correct.
- **SEO target:** "world capitals quiz speed", "type the capital game", "capitals quiz timed"
- **Difficulty:** Medium-Hard

### Shape Guesser
- **Concept:** Country silhouette shown → guess which country it is. 4 options.
- **Mechanics:** Black filled outline of country shape, no borders shown. 4 MC options.
- **SEO target:** "country shape quiz", "guess country by shape", "country outline quiz"
- **Difficulty:** Hard
- **Data needed:** SVG country outlines (can generate from TopoJSON)

### Region Recall
- **Concept:** Which continent/region does this country belong to? 4 options. Fast loop.
- **Mechanics:** Country name shown → pick continent → immediate feedback → next. 20 questions.
- **SEO target:** "which continent quiz", "country continent game", "geography region quiz"
- **Difficulty:** Easy

### Currency Quiz
- **Concept:** Name the currency of a given country. 4 MC options.
- **Mechanics:** Standard MC format. Include currency symbol and name in correct answer feedback.
- **SEO target:** "country currency quiz", "world currency game", "guess the currency"
- **Difficulty:** Medium
- **Data needed:** Add currency field to country data

### Timeline Rank
- **Concept:** Sort 5 countries by independence year from oldest to newest.
- **Mechanics:** Drag-to-sort (or arrow keys). Show year after submit.
- **SEO target:** "country history quiz", "independence year quiz", "geography timeline game"
- **Difficulty:** Hard
- **Data needed:** Add `independence_year` to country data

### Flag Memory
- **Concept:** Classic pairs/matching game with country flags.
- **Mechanics:** 16 face-down cards (8 pairs). Flip 2, match flags to country names.
- **SEO target:** "flag memory game online", "country flag matching game"
- **Difficulty:** Easy-Medium

### Neighbor Chain
- **Concept:** Name a country that borders the last named country. Endless chain.
- **Mechanics:** Computer names a country → you type a neighbor → computer gives another → ...
- **SEO target:** "geography chain game", "bordering countries game", "country neighbor chain"
- **Difficulty:** Hard

### Population Guesser
- **Concept:** Two countries shown — guess the combined population. Closest wins.
- **Mechanics:** Show two country flags + names. Slider or number input. Reveals exact numbers.
- **SEO target:** "population quiz game", "guess population game"

---

## New Stat Categories

### Olympic Medals Total
- **Slug:** `olympic-medals-total`
- **Label:** "All-Time Olympic Medals"
- **Unit:** medals
- **Direction:** higher_is_better
- **Data source:** Wikipedia / IOC
- **Coverage:** ~100 countries that have won medals

### Coastline Length
- **Slug:** `coastline-length-km`
- **Label:** "Coastline Length"
- **Unit:** km
- **Direction:** higher_is_better
- **Note:** Canada has the longest (202,080 km), Norway is 2nd

### Independence Year
- **Slug:** `independence-year`
- **Label:** "Year of Independence"
- **Unit:** year
- **Direction:** lower_is_better (older = higher rank)
- **Note:** San Marino (301 AD), Liechtenstein (1806), etc.

### Number of Official Languages
- **Slug:** `official-languages-count`
- **Label:** "Official Languages"
- **Unit:** languages
- **Direction:** higher_is_better
- **Note:** South Africa (11), Zimbabwe (16), Bolivia (37)

### Highest Elevation
- **Slug:** `highest-elevation-m`
- **Label:** "Highest Point (m)"
- **Unit:** meters
- **Direction:** higher_is_better
- **Note:** Nepal has Everest (8849m), China also claims Everest

### Human Development Index
- **Slug:** `hdi`
- **Label:** "Human Development Index"
- **Unit:** score (0-1)
- **Direction:** higher_is_better
- **Data source:** UNDP

### CO2 Emissions Per Capita
- **Slug:** `co2-per-capita`
- **Label:** "CO₂ Emissions per Person"
- **Unit:** tonnes/year
- **Direction:** lower_is_better
- **Data source:** World Bank

---

## Category Page Ideas

- `/categories/world-records` — countries with world records (largest, smallest, highest, etc.)
- `/categories/extremes` — most isolated, highest altitude capital, longest coastline

---

## SEO Cluster Opportunities

- "free geography games" — homepage, /games
- "flag quiz online" — /games/flag-quiz
- "world capitals quiz" — /games/capital-match, new Capital Blitz
- "country shape quiz" — Shape Guesser (new)
- "geography trivia" — /categories, /lists
- "countries by population" — /lists/most-populated-countries, /categories/population
- "largest countries in the world" — /lists/largest-countries
- "which continent is X in" — Region Recall (new)
