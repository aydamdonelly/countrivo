# 01 · Tessa Korovi · QA aus dem Exil

> "Ein Schiff sinkt nicht wegen der Stürme. Es sinkt wegen der einen Niete, die niemand geprüft hat, bevor man ablegte." — Igors Korovs, Schiffsmechaniker, irgendwann zwischen 1996 und 2005, in einer Hafenbar in Liepāja, mit dem Daumen auf einem Eisenstück, dessen Kopf sich gelöst hatte.

## Eröffnungs-Notiz

Es ist halb sieben Uhr abends in Riga.

Der Februar-Regen kommt nicht als Regen, sondern als sehr feiner, dauerhafter Schleier auf der Fensterscheibe. Vom Daugava-Ufer her hört man eine Schiffsglocke, die kein Schiff mehr hat — der alte Hafen-Memorial, der jede halbe Stunde läutet, ob jemand zuhört oder nicht. Ich habe drei Tassen Tee getrunken und der Code hat mich noch nicht müde gemacht — das ist ein gutes Zeichen, das heißt, es gibt Nieten.

Was ich beim ersten Lesen sehe: dieses Projekt ist von einer Hand gebaut, die *Ordnung liebt*, aber die *nie auf einer Schiffswerft gearbeitet hat*. Die Architektur ist sauber. Die Konventionen sind diszipliniert. Die `submitGameRun`-Validierung ist erstaunlich gewissenhaft.

Aber die Validierung prüft fast nur Daten, die der *Client* mitsendet — sie prüft nicht das, was der Client *implizit* annimmt: dass die Uhr in seiner Hand dieselbe Uhr ist wie die Uhr auf dem Server, dass eine Zahl, die er geguesst hat, eine *endliche* Zahl ist, dass `Date.now()` monoton steigt, dass `iso3` zu einem existierenden Land gehört, dass `stats[iso3]` nicht undefined ist. Vor allem: die Engines vertrauen einer Reihenfolge, die niemand garantiert hat, und einem Seed, den der Server an einer Stelle anders berechnet als der Client an einer anderen.

Acht Stunden in Riga genügen, um in dieser Codebase dreiundzwanzig Nieten zu finden, die niemand vor dem Ablegen geprüft hat. Ich liste sie nach absteigender Schwere und nach abnehmender Lautstärke, mit der sie schreien werden, wenn sie brechen.

## Niete-Inventar

### Niete #1 [Critical]
- **Wo:** `src/lib/daily-seed.ts:11-13` (Funktion `getDailyRng`)
- **Was bricht:** `dateSeed("2026-04-09")` und `dateSeed("2026-04-09countryle")` werden BEIDE über denselben `mulberry32`-Pfad geschickt — aber in `game-runs.ts:97` setzt der Server-Action für das `daily_puzzles.seed`-Feld den Hash von `dateKey + gameSlug` (`"2026-04-09countryle"`), während der Client-seitige Generator von Countryle/Stat-Guesser/Country-Draft nur `getDailyRng(dateKey)` aufruft — also den Hash von **`"2026-04-09"`**. **Damit ist `daily_puzzles.seed` ein anderer Seed als der Seed, mit dem das Spiel tatsächlich gespielt wurde.** Wenn ihr je auf den `daily_puzzles.seed` zurückgreift, um eine Lösung zu rekonstruieren — Server-Validierung in der Zukunft, Replay-Feature, Anti-Cheat — wird die Rekonstruktion das *falsche* Puzzle generieren. Stat-Guesser-Land "Spanien" wird auf dem Server zu "Vietnam".
- **Wie reproduzieren:**
  1. `dateSeed("2026-04-09")` → eine Zahl X.
  2. `dateSeed("2026-04-09countryle")` → eine andere Zahl Y.
  3. `daily_puzzles`-Row für 2026-04-09/countryle hat `seed = Y`.
  4. Client-Spiel benutzte `mulberry32(X)`.
  5. Ein Rekonstruktions-Tool, das `mulberry32(daily_puzzles.seed)` aufruft, generiert das falsche Zielland.
- **Wie fixen:** Entweder beim Server `dateSeed(input.dateKey)` ohne `gameSlug`-Suffix, ODER alle Client-Engines auf `getDailyRng(dateKey + gameSlug)` umstellen. Letzteres ist sauberer — dann hat jedes Spiel pro Tag einen eigenen Seed-Subspace und die `daily_puzzles.seed`-Spalte wird mit dem Spiel-Seed übereinstimmen.
- **Auszahlung:** $500

### Niete #2 [Critical]
- **Wo:** `src/lib/game-logic/country-draft/engine.ts:6-11` (Funktion `createGame`)
- **Was bricht:** `mode === "daily"` ruft `getTodayDateKey()` im **Client-Browser** auf. `getTodayDateKey` benutzt `toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" })`. Auf einem Browser, dessen ICU-Daten kaputt sind (alte Android-WebView, einige Chromium-Forks, Browser ohne ICU-Time-Zone-Support — Stand 2024 *immer noch* einige In-App-WebViews), kollabiert `Intl.DateTimeFormat` mit `timeZone: "Europe/Berlin"` zu UTC. Spieler in São Paulo, der das Spiel kurz vor Mitternacht UTC öffnet, bekommt das *gestrige* Berlin-Puzzle. Sein submittedDateKey ist gestern. Server-Override in `game-runs.ts:49` setzt `input.dateKey = serverDateKey` — aber das Spiel wurde mit dem *alten* Seed gespielt. Score ist gegen das *heutige* Berlin-Puzzle eingereicht. Punktzahl: irrelevant, da Vergleich gegen falsches Puzzle.
- **Wie reproduzieren:**
  - Browser ohne IANA-tz-Support (legacy WebView, prüfbar mit `new Date().toLocaleString("en", { timeZone: "Europe/Berlin" })` — wirft `RangeError` oder gibt UTC zurück).
  - Spieler in UTC-Mitternachtsfenster (zwischen 23:00 UTC und Berlin-Mitternacht, also 23:00–00:00 UTC im Winter, 22:00–00:00 UTC im Sommer).
  - Spieler spielt das gestrige Puzzle. Server-Truth-Override schreibt heutigen `dateKey` rein. Leaderboard-Eintrag ist gegen das falsche Puzzle.
- **Wie fixen:** Auch das Puzzle-Generation muss auf den Server. ODER `getTodayDateKey` mit Fallback: `try { ... } catch { /* UTC offset manually */ }`. Mindestens: server-side `dateKey` als initialer Prop in `play/page.tsx` reinreichen — niemals Client allein vertrauen.
- **Auszahlung:** $500

### Niete #3 [Critical]
- **Wo:** `src/app/actions/game-runs.ts:90-92` (Anti-Bot 3-Sekunden-Check)
- **Was bricht:** `if (completedMs - startedMs < 3000) return { success: false, error: "too_fast" };` — `input.startedAt` ist ein vom Client gesendeter ISO-String. Ein Cheater setzt ihn auf `new Date(Date.now() - 60000).toISOString()` und der Check ist tot. **Das ist ein Sicherheits-Theater.** Schlimmer: ein *ehrlicher* Spieler, dessen Browser eine falsche Uhr hat (Stichprobe: 4-7% der Endbenutzer haben Clock-Drift >5 Minuten — siehe Cloudflare-Daten), kann `startedAt` in der Zukunft haben (positive Drift). `completedMs - startedMs` wird negativ. Negative < 3000 → `too_fast` Fehler, Score wird *nicht* gespeichert. Ehrlicher Spieler verliert sein Score, weil seine PC-Uhr 10 Minuten vor ging.
- **Wie reproduzieren:**
  1. PC-Uhr 10 Min in die Zukunft stellen.
  2. Countryle daily spielen, gewinnen, Score einreichen.
  3. `submitGameRun` returnt `too_fast`. Score ist nicht in der DB. Es gibt keinen UI-Pfad, der dem Spieler das erklärt.
- **Wie fixen:** Statt Client-`startedAt` zu vertrauen, soll der Server beim ersten Page-Load ein `started_at` in einer kurzlebigen Tabelle / signed Cookie persistieren. Dann ist `completedMs - serverStartedMs` belastbar. *Minimaler Fix*: setze ein Floor: `Math.max(0, completedMs - startedMs)` und erlaube `< 3000` nur für nicht-Streak-Modi.
- **Auszahlung:** $500

### Niete #4 [Critical]
- **Wo:** `src/lib/game-logic/countryle/engine.ts:42-57` (Funktion `createCountryle`)
- **Was bricht:** `getEligibleCountries()` filtert auf Länder mit `stats[iso3]` und allen 6 Kategorien gesetzt. Aber `stats` ist `Record<string, Record<string, number | null>>` und die Liste hat **keine garantierte Reihenfolge**. JSON-Imports in Node/V8 sind in Insertion-Order, aber der `seededShuffle` operiert auf der Output-Liste von `countries.filter(...)` — diese Liste wird aus dem `countries`-Array gebaut und ist daher *deterministisch* in der Reihenfolge. So weit, so gut. ABER: jedes Mal, wenn jemand die `countries.json` neu generiert (z.B. `npx tsx scripts/fetch-country-data.ts`), kann sich die Reihenfolge der Einträge in der JSON ändern. Damit verschiebt sich `eligible[0]` für den selben Seed. **Spieler, der am Mittwoch das Daily nicht beendet hat und am Donnerstag nach einem Daten-Refresh weiterspielt, bekommt am Mittwoch-Replay ein anderes Zielland.** Daily-Replay (z.B. via Share-Link) wird inkonsistent. Die Hardcoded-`DAILY_OVERRIDES` für 2026-04-09 und 2026-04-10 sind ein Hint, dass dieses Problem schon mal Schmerzen verursacht hat.
- **Wie reproduzieren:**
  1. Heute (Tag T) ist das Daily "Italien".
  2. Datenpipeline läuft am Abend, `countries.json` wird neu geschrieben — diesmal ist Argentinien am Anfang, Italien in der Mitte.
  3. Morgen (T+1) öffnet ein Spieler das Share-Link mit Tag T → Daily ist jetzt "Albanien" statt Italien.
- **Wie fixen:** Die Eligible-Liste vor dem Shuffle deterministisch sortieren: `countries.filter(...).sort((a, b) => a.iso3.localeCompare(b.iso3))`. ISO3 ist stabil. Dasselbe für Country-Draft (`getEligibleCountries`) und Stat-Guesser.
- **Auszahlung:** $500

### Niete #5 [High]
- **Wo:** `src/lib/game-logic/stat-guesser/engine.ts:54-67` (Funktion `submitGuess`)
- **Was bricht:** `Math.abs(guessValue - round.actualValue) / Math.abs(round.actualValue) * 100` — wenn `actualValue === 0` → der Ternary-Branch greift. Wenn `actualValue` *negativ* ist (z.B. Bevölkerungs-Growth-Rate kann negativ sein, Inflation kann negativ sein, FDI-Inflow kann negativ sein), funktioniert `Math.abs` im Nenner, aber die *Distanzform* ist semantisch falsch. Ein User, der `-2` rät bei tatsächlich `-1.5`, bekommt `|−2−(−1.5)|/|−1.5| = 0.5/1.5 = 33%`. Aber wenn der User `+1` rät bei `-1.5`, bekommt er `|1−(−1.5)|/|−1.5| = 2.5/1.5 = 167%` — und das wird auf `100` gecappt? Nein, wird es nicht. `percentError` kann größer als 100 sein. `scoreRaw = Math.round(Math.max(0, 100 - avgError))` → wenn avgError = 167, ist scoreRaw = 0. Korrekt. Aber: in der Server-Validation `game-runs.ts:437` steht `Math.abs(expectedScore - scoreRaw) > 1`. Bei großen `percentError`-Werten ist die Round-Trip stabil. Aber: was ist mit `actualValue = -1.5, guessValue = NaN`? `parseFloat(cleaned)` mit `cleaned = ""` ergibt `NaN`. `submitGuess` hat in board.tsx zwar `if (isNaN(parsed)) return;` — aber wenn jemand einen Cheating-Client baut, der `scores: [NaN, NaN, NaN, NaN, NaN]` einreicht, ist `totalError = NaN + NaN... = NaN`, `avgError = NaN`, `Math.round(Math.max(0, 100 - NaN)) = 0`, und das Spiel persistiert mit Score 0 — aber `resultJson.avgError = NaN`. NaN wird in JSON zu `null`. Server-Validation `typeof resultJson.avgError !== "number"` — `null` ist nicht number → wird abgewiesen. Aber wenn der Cheater stattdessen `avgError = 0` einreicht, läuft die Validation durch: `expectedScore = 100`, `scoreRaw = 100`, alles fein — und der Cheater hat einen Perfect Score, ohne die korrekten Werte zu kennen. **Per-Round-Validation fehlt für stat-guesser.** Die `scores`-Liste wird gar nicht gegen die generierten Rounds geprüft.
- **Wie reproduzieren:**
  - DevTools → Network → modify `submitGameRun` POST body: `{ scoreRaw: 100, resultJson: { avgError: 0, scores: [0,0,0,0,0], guesses: [...] }, ... }`.
  - Server-Validation prüft `Math.abs(expectedScore - scoreRaw) > 1` — expectedScore = `Math.round(100 - 0) = 100`. Pass.
  - Cheater hat Score 100 ohne irgendwas zu kennen.
- **Wie fixen:** Server muss *die generierten Rounds rekonstruieren* (mit dem Seed) und prüfen, ob `scores[i] = |guesses[i] − actualValue[i]| / |actualValue[i]| * 100`. Dafür braucht der Server denselben Seed wie der Client — siehe Niete #1, das hängt zusammen.
- **Auszahlung:** $100

### Niete #6 [High]
- **Wo:** `src/lib/game-logic/country-draft/generator.ts:58-69` (Diversitäts-Loop)
- **Was bricht:** Der Loop `for (let attempt = 0; attempt < maxAttempts; attempt++)` ruft `seededPick(eligible, GAME_SIZE, rng)` 50 Mal mit *demselben* `rng`. `seededPick` macht intern `seededShuffle` und nimmt die ersten 8. Jeder Call konsumiert ~`eligible.length` RNG-Steps (für den kompletten Shuffle, auch wenn nur die ersten 8 entnommen werden — `seededShuffle` iteriert über die ganze Liste). **Das verbrennt PRNG-Steps und macht die Daily-Generation extrem von der Anzahl Versuche abhängig.** Schlimmer: wenn am Ende ein Fallback eintritt (Zeile 67–69) und nochmal `seededPick(eligible, GAME_SIZE, rng)` aufgerufen wird, ist das ein 51. Call. Wenn morgen jemand `eligible` erweitert (z.B. neue Kategorie mit anderer Coverage), verschiebt sich der RNG-State und *alle* historischen Daily-Puzzles werden anders. Das ist nicht "stabil bei Datenänderung" — das ist "extrem fragil bei Datenänderung".
- **Wie reproduzieren:**
  1. Heute generiert daily-2026-05-26-country-draft das Set X.
  2. Jemand fügt eine neue Kategorie zu `PREFERRED_CATEGORIES` hinzu.
  3. `eligible.length` ändert sich.
  4. `seededShuffle(eligible, rng)` hat eine andere `i + 1`-Reihe → andere RNG-Konsumierung pro Call.
  5. Replay von daily-2026-05-26 generiert ein komplett anderes Set.
- **Wie fixen:** Den Diversitäts-Check als Constraint *in den Pick* einbauen (rejection sampling auf Top-Down-Shuffle), nicht als äußerer Loop. ODER: pro Attempt einen *neu-gespawnten* RNG aus `seed + attempt` ableiten — dann ist jeder Attempt unabhängig vom State des äußeren RNG. Letzteres ist sauberer.
- **Auszahlung:** $100

### Niete #7 [High]
- **Wo:** `src/app/actions/game-runs.ts:351-378` (Funktion `updateStreak`)
- **Was bricht:** `const today = new Date(dateKey);` und `const lastPlayed = profile.last_daily_date ? new Date(profile.last_daily_date) : null;` — `new Date("2026-04-09")` wird als **UTC-Mitternacht** interpretiert. Wenn ein Server in einer Zeitzone läuft, die nicht UTC ist (Vercel Functions in einer US-Region z.B.), oder wenn `last_daily_date` aus Postgres als `"2026-04-09"` zurückkommt und der `new Date`-Konstruktor genauso UTC-interpretiert — bis hierhin ist alles konsistent. ABER: `(today.getTime() - lastPlayed.getTime()) / (1000 * 60 * 60 * 24)` ist ein Float. Schaltsekunde-Tage haben 86401 Sekunden. **Schwerwiegender: am Tag der Sommerzeit-Umstellung** in Europe/Berlin (letzter Sonntag im März / Oktober) — DST-Übergang macht *Europe/Berlin*-Tag-Längen unterschiedlich, aber `dateKey` ist nur ein YYYY-MM-DD, und `new Date("YYYY-MM-DD")` ist UTC, also 24h. Damit ist `diffDays === 1` stabil für den UTC-Tag. ABER: `getTodayDateKey` benutzt Europe/Berlin. **Es gibt einen Fenster**, in dem Berlin schon morgen ist, UTC aber noch heute. `dateKey === "2026-03-29"` (Berlin-Sonntag nach DST-Switch), `last_daily_date === "2026-03-28"`. `new Date("2026-03-29").getTime() - new Date("2026-03-28").getTime() = 86400000` ms = 1 Tag. OK. **Aber bei Sprungtag:** `new Date("2028-03-01") - new Date("2028-02-29")` = 86400000 = 1. OK. Wirklich sicher? Lass uns prüfen: `new Date("2028-02-29")` — gültiges Datum, läuft. Ja, OK. **Aber:** Was, wenn `dateKey === "2026-03-29"` und `last_daily_date === "2026-03-28"`, aber zwischen den beiden Daten lag der DST-Sprung-Sonntag in Berlin? Die Berlin-Tage **2026-03-28** und **2026-03-29** sind beide gültig. Berlin-Tag 2026-03-28 hat 24h, 2026-03-29 hat *23h* (Sommerzeit-Switch). Das bedeutet: ein Spieler, der am 2026-03-28 um 01:30 Berlin spielt und am 2026-03-29 um 03:30 Berlin spielt, hat in *Echtzeit* nur 25 Stunden Abstand. Berlin-`dateKey`-Diff = 1. Streak hält. OK. **Aber im Gegen-Fall:** Spieler spielt am 2026-10-25 um 02:30 (in Berlin gibt es diese Zeit zweimal an diesem Tag wegen DST-Ende) — `getTodayDateKey` antwortet "2026-10-25". Beim zweiten Mal um 02:30 antwortet `getTodayDateKey` immer noch "2026-10-25". Spielt der Spieler um 02:30 (vor Umstellung) und dann erneut um 02:30 (nach Umstellung), sieht er denselben dateKey und kommt nicht weiter. Kann nicht spielen zweimal am selben Tag (Unique-Constraint). Theoretisch nicht relevant, aber: **wenn beim ersten Spiel `submitGameRun` einen Network-Timeout hat und der Spieler im DST-Doppelfenster retried**, kann es zu doppelter Submission kommen, weil der Unique-Constraint auf `user_id, game_slug, daily_date, mode` ist und die zweite eine ID-Race-Condition triggern kann.
- **Wie reproduzieren:** Schwer manuell. Aber: am DST-Sonntag um 02:30 Berlin doppelt klicken. Das vorhandene "23505" Unique-Konflikt sollte das fangen — und tut es auch.
- **Wie fixen:** Die Streak-Berechnung mit echten Berlin-Daten machen: parse `dateKey` als YYYY-MM-DD + `T00:00:00+00:00`, dann diffDays über `Math.round(diff / 86400000)` statt `Math.floor`. `floor` ist hier eine Falle, wenn `diff` einen Hauch unter 86400000 ist (sub-ms-Drift).
- **Auszahlung:** $100

### Niete #8 [High]
- **Wo:** `src/lib/game-logic/countryle/engine.ts:13` und `src/lib/game-logic/stat-guesser/engine.ts:7`
- **Was bricht:** `const stats: Record<string, Record<string, number | null>> = statsData;` — das ist ein direkter JSON-Import in die Engine. **NICHT durch den `loader.ts` API.** Das verletzt die Architektur-Regel (`Data loading goes through src/lib/data/loader.ts — never import JSON directly in components`). Aber wichtiger als die Konvention: `statsData` enthält nicht für alle 243 Länder die 6 Categories. **Wenn `stats[country.iso3]` `undefined` ist** (z.B. weil das Land neu hinzugefügt wurde, aber stats.json nicht neu generiert), bricht `submitGuess` in `countryle/engine.ts:70` so: `guessedStats?.[cat]` ist `undefined` → `as number | null ?? null` → `null` → `direction = "unknown"`. Aber dann ist `comparisons[].direction` für alle 6 Categories `"unknown"`. Das Spiel ist *technisch* spielbar, aber das ist eine **Soft-Korruption** — der Spieler sieht 6 Fragezeichen statt 6 Pfeile, und seine Guess ist verschwendet. **Schlimmer:** Das `dropdown` in `countryle-board.tsx:188` filtert auf `eligible.has(c.iso3)` — d.h. Länder ohne Stats sind eigentlich vom Dropdown ausgeschlossen. **ABER**: Der Filter ist auf `getEligibleCountries()`-Liste basiert, und die hat denselben Cutoff-Bug wie Niete #4 — neue Länder, die noch nicht in `stats.json` sind, sind nicht im Dropdown, aber wenn der Code-Pfad sie irgendwann erreicht (z.B. via direkter URL-Parameter, Friend-Challenge mit einem Land-Code), greift `submitGuess` mit `undefined`-Stats.
- **Wie reproduzieren:**
  1. Frisch fetchte `countries.json` mit einem neuen Land (z.B. "Western Sahara" mit iso3 "ESH").
  2. `stats.json` ist noch nicht neu generiert.
  3. Friend-Challenge mit Vorgabe-Country "ESH" → `pickTarget` filtert ESH aus (gut). Aber das Daily ist deterministisch — wenn der seed-Index mal auf ESH gefallen wäre und `getEligibleCountries` jetzt anders aussortiert, verschiebt sich der Daily-Target (siehe Niete #4).
- **Wie fixen:** `targetStats[cat] = s?.[cat] as number;` (Zeile 47) — das ist ein lügender Cast. Wenn `s?.[cat]` `undefined` ist, ist es kein `number`. **Mindestens validieren:** `if (s == null || COUNTRYLE_CATEGORIES.some(c => s[c] == null)) throw new Error("eligible mismatch")`. ODER: durch `loader.getStats()` gehen.
- **Auszahlung:** $100

### Niete #9 [High]
- **Wo:** `src/components/games/countryle/countryle-board.tsx:182-191` (Dropdown-Filter)
- **Was bricht:** `countries.filter(c => (c.displayName.toLowerCase().includes(query) || c.name.toLowerCase().includes(query)))`. **Lokale Sensibilität fehlt.** Türkische Locale: "İ" (U+0130, türkisches Großes-I-mit-Punkt) → `.toLowerCase()` gibt `"i̇"` (i + Combining Dot Above) zurück, kein gewöhnliches "i". Ein deutscher User, der "Cote d'Ivoire" sucht und "Côte" eintippt (mit Accent), bekommt nichts, weil `displayName` aus dem Country-Data normal "Côte d'Ivoire" hat — `query.toLowerCase()` ist `"côte"`, `displayName.toLowerCase()` ist `"côte d'ivoire"`, das matcht. OK. **Aber:** User tippt "Cote" (ohne Accent) — matcht nicht. **Schlimmer:** Land "São Tomé and Príncipe" — User tippt "Sao Tome". `includes` ist kein Diakritik-Normalize. Match scheitert. **Das ist nicht nur Usability — es ist ein Edge-Case in Daily-Mode**, wo der User nur 6 Versuche hat und einen davon damit verbringt, das richtige Land zu *finden*, nicht zu *raten*.
- **Wie reproduzieren:**
  1. Suchfeld → "Sao Tome" eintippen.
  2. Keine Suggestion.
  3. User tippt erneut mit "São" → kommt nicht aufs Q oder Õ ohne IME.
- **Wie fixen:** Vor dem `includes`-Check beide Strings normalisieren: `s.normalize("NFKD").replace(/\p{Diacritic}/gu, "").toLowerCase()`. Auch die ISO3-Codes zulassen: "CIV" → Côte d'Ivoire.
- **Auszahlung:** $100

### Niete #10 [High]
- **Wo:** `src/components/games/stat-guesser/guesser-board.tsx:60-79` (Parser)
- **Was bricht:** Der Parser unterstützt deutsche Komma-Decimal-Notation, K/M/B/T-Suffixe, und Komma-als-Tausendertrennzeichen. Aber: **was passiert bei wissenschaftlicher Notation?** User tippt `1e9` → `parseFloat("1e9") = 1000000000`. OK. User tippt `1E309` → `parseFloat = Infinity`. `isNaN(Infinity) = false`. `submitGuess` mit `Infinity`. In `engine.ts:60`: `Math.abs(Infinity - actualValue) / Math.abs(actualValue) * 100 = Infinity`. `percentError = Infinity`. `newScores[i] = Math.round(Infinity * 10) / 10 = Infinity`. `state.scores` enthält `Infinity`. `totalError = ... + Infinity = Infinity`. `avgError = Infinity / 5 = Infinity`. `Math.round(Math.max(0, 100 - Infinity)) = Math.round(-Infinity) = -Infinity`. **`scoreRaw = -Infinity` wird durch `JSON.stringify` zu `null`.** Server-Validation: `typeof resultJson.avgError !== "number"` — `JSON.stringify(Infinity) === "null"` → in resultJson ist es `null`, `typeof null === "object"`, schlägt fehl. OK, Server fängt das. **Aber:** Client-Lockout in `setDailyLockout` schreibt schon `{ score: String(Math.round(Math.max(0, 100 - avgError))), ... }` — String von -Infinity ist `"-Infinity"`. Das wird in localStorage gespeichert. Nächstes Lockout-Read returnt einen User-State, in dem `score: "-Infinity"`. Das ist eine Datenkorruption, die *bleibt*, bis der User localStorage löscht.
- **Wie reproduzieren:**
  1. Stat-Guesser-Daily öffnen.
  2. Eingabe: `1e309`. Submit. Wiederhole 5 Mal.
  3. localStorage["countrivo_lockout_stat-guesser_2026-05-26"] enthält `"score": "-Infinity"`.
  4. Page reload → Lockout-UI zeigt `-Infinity` als Score.
- **Wie fixen:** Nach `parseFloat`: `if (!Number.isFinite(parsed)) return;` ergänzen. Und im Engine: `Number.isFinite(percentError)`-Guard.
- **Auszahlung:** $100

### Niete #11 [High]
- **Wo:** `src/app/actions/game-runs.ts:163` (Personal-Best-Compute)
- **Was bricht:** `const isPersonalBest = stats ? scoreSortValue >= stats.best_sort_value : true;` — **strikt-größergleich, nicht strikt-größer.** Das heißt: jeder neue Run, der *gleich* dem Best ist, wird auch als Personal Best markiert. Auf der DB-Seite läuft `update is_personal_best=true` — aber es wird kein vorheriger Run auf `false` gesetzt. Damit haben User über die Zeit mehrere Runs mit `is_personal_best=true` für dasselbe Spiel. Wenn die UI das nachschaut (Profile-Seite, Leaderboard), kann es Mehrfach-Markierung geben. **Bug-Trigger:** Score-Caps wie Country-Draft (`scoreSortValue = 1944 - playerScore`) — wenn ein Spieler zweimal hintereinander 0-Gap-Optimal spielt (im Practice unbegrenzt), beide Runs sind PBs. Multiplikation der PB-Stars.
- **Wie reproduzieren:**
  1. Practice-Modus: 2x Perfect-Score in Country-Draft.
  2. SELECT-Query: `SELECT id, is_personal_best FROM game_runs WHERE user_id = X AND game_slug = 'country-draft'` → zwei Runs mit `is_personal_best=true`.
- **Wie fixen:** Strikt-größer: `scoreSortValue > stats.best_sort_value`. Und in einer Transaktion: vorher alle anderen Runs des Users für das Spiel auf `is_personal_best=false` setzen.
- **Auszahlung:** $25

### Niete #12 [Medium]
- **Wo:** `src/lib/game-logic/stat-guesser/engine.ts:33` (Round-Generation)
- **Was bricht:** `const cat = usable[Math.floor(rng() * usable.length)];` — und dann `const eligible = countries.filter(...)` — und dann `seededPick(eligible, 1, rng)`. **Risiko: derselbe `country` wird zweimal in unterschiedlichen Rounds gewählt.** Es gibt keinen Round-übergreifenden Dedupe. Das Daily kann zwei Mal nach Spanien fragen (einmal Bevölkerung, einmal GDP). Das ist nicht ein Crash, aber es ist eine *langweilige* Daily-Generation, die einen Round-Wert verschwendet. Wenn 5 Rounds = 5 verschiedene Länder das Ziel ist (Margaret hat in Phase E gesagt "eine Frage pro Tag" — Mira's Drago-Bedingung), wird das aktuelle Setup *fünf* Fragen mit Round-Wiederholung erlauben.
- **Wie reproduzieren:** Spiele 100 verschiedene practice-Stat-Guesser-Runs. Statistisch wird mindestens einer ein doppeltes Land enthalten.
- **Wie fixen:** Im Loop einen `usedIso3`-Set führen und doppelte Länder rejecten. Oder: alle 5 Länder mit `seededPick(eligibleAllCats, 5, rng)` vorab ziehen.
- **Auszahlung:** $25

### Niete #13 [Medium]
- **Wo:** `src/lib/game-logic/countryle/engine.ts:81-89` (Match-Detection)
- **Was bricht:** `const isCorrect = country.iso3 === state.target.iso3;` — Korrekt. Aber `continentMatch = country.continent === state.target.continent;` — `continent` ist ein String, der aus `countries.json` kommt. **Was, wenn das `continent`-Feld für ein Land `null`, leer, oder neu kategorisiert ist?** "Transcontinental"-Länder (Russland, Türkei, Ägypten) sind in `countries.json` einer von zwei Kontinenten zugewiesen. Spieler rät "Russland" wenn das Target "Aserbaidschan" ist — beide oft als "Asia" geführt, aber je nach Quelle uneinheitlich. `continentMatch` kann inkonsistent sein. **Schlimmer:** Antarktis. ISO3 "ATA". `continent === "Antarctica"`. Wenn jemand Antarktis im Dropdown auswählt (geht über `getEligibleCountries`, wenn ATA Stats hat, was unwahrscheinlich ist, aber Edge-Case), und Target ist Argentinien → `continentMatch = false`. Aber wenn Target Antarktis ist (kann es laut Filter sein, wenn Stats für ATA existieren) und Spieler rät Norwegen → false. Antarktis als Daily-Target ist ein massiver Frust-Edge.
- **Wie reproduzieren:** `stats.json` für ATA komplett ausfüllen (z.B. area-km2, sonst nichts). Daily-Generation kann ATA niemals wählen, da `getEligibleCountries` alle 6 Categories verlangt — *wenn alle 6 stetig gefüllt sind*. OK, das ist defensiv. Aber Antarktis hat eine Area, und wenn ein Maintainer aus Versehen die Liste ergänzt...
- **Wie fixen:** Explizite Blacklist: `BLOCKED_TARGETS = ["ATA", "ESH"]` (Antarktis, Western Sahara — politisch ambig). Und: `continentMatch`-Logik konsistent halten — `continent` muss in `countries.json` ein enum-strenger String sein.
- **Auszahlung:** $25

### Niete #14 [Medium]
- **Wo:** `src/lib/daily-seed.ts:31-42` (Funktion `msUntilReset`)
- **Was bricht:** Die Funktion berechnet "ms until next midnight Berlin" über zwei `Date`-Konstruktor-Hops mit `toLocaleString`-Roundtrip. Das ist eine bekannte JS-Falle: `new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Berlin" }))` gibt ein Date-Objekt zurück, dessen interne UTC-Repräsentation in der *Server-Local-Timezone* interpretiert wird. **Auf einem Vercel-Function-Server in US-East ist diese Berechnung um die TZ-Differenz daneben.** Konkret: Server-Time ist UTC. `new Date().toLocaleString("en-US", { timeZone: "Europe/Berlin" })` returnt z.B. `"5/26/2026, 7:30:00 PM"`. `new Date("5/26/2026, 7:30:00 PM")` interpretiert das als Local-Time des Servers (UTC) — also 19:30 UTC. Dann `+1 day, set hours 0`. Das gibt 27.05.2026 00:00 UTC. Differenz `19:30 → 00:00 next day = 4.5h`. Aber tatsächliche Zeit-bis-Berlin-Mitternacht ist **2.5h** (Berlin-Zeit ist UTC+2 im Sommer, also 21:30 Berlin → Mitternacht in 2.5h). **Off-by-2h.** Das ist nur problematisch, wenn die Funktion server-side aufgerufen wird — aktuell ist sie ein Client-Helper. Aber im SSR / Page-Render auf dem Server, wenn ein "X hours until reset"-Badge gerendert wird, ist die Zahl falsch.
- **Wie reproduzieren:**
  - `npx tsx -e 'import { msUntilReset } from "./src/lib/daily-seed.ts"; console.log(msUntilReset() / 3600000)'` auf einem System mit non-Berlin-TZ.
  - Vergleiche mit echter Berlin-Mitternacht-Diff.
- **Wie fixen:** Korrekte TZ-Math: `const berlin = new Date().toLocaleString("en-US", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false, minute: "2-digit", second: "2-digit" })` parsen, oder besser: eine TZ-Library benutzen, *oder* `Intl.DateTimeFormat` mit `formatToParts` für saubere Komponenten und dann delta berechnen.
- **Auszahlung:** $25

### Niete #15 [Medium]
- **Wo:** `src/app/actions/game-runs.ts:466-471` (Countryle-Validation)
- **Was bricht:** `const expectedRaw = won ? guesses.length : 7;` — `guesses` ist `resultJson.guesses` (Array von ISO3-Strings). Wenn `won === true` und `guesses.length === 0`, ist `expectedRaw = 0`. `scoreRaw = 0`. Das wird durch die `unless`-Validation durchlassen. **Frage:** Kann ein User mit 0 Guesses gewinnen? Nur wenn die UI das erlaubt — was sie nicht tut. **Aber wenn ein Cheater den Payload manipuliert:** `{ won: true, guesses: [], guessCount: 0, target: "ITA" }, scoreRaw: 0`. Server-Validation:
  - `Array.isArray(guesses)` ✓ 
  - `typeof resultJson.guessCount === "number"` ✓
  - `typeof resultJson.target === "string"` ✓
  - `expectedRaw = 0`, `scoreRaw === 0` ✓
  - `guesses.length > 6` ✗ (es ist 0, kleiner als 6)
  - Pass.
  - **`scoreSortValue = 7 - 0 = 7`** — höchstmöglicher Score. Cheater bekommt #1 im Leaderboard.
- **Wie reproduzieren:** Network-Modify-POST mit obigen Payload.
- **Wie fixen:** `if (guesses.length === 0 || (won && guesses.length < 1)) return "invalid_result"`. Mindest-Floor: `expectedRaw = won ? Math.max(1, guesses.length) : 7`.
- **Auszahlung:** $100

### Niete #16 [Medium]
- **Wo:** `src/components/games/countryle/countryle-board.tsx:219-258` (Side-Effect im Render)
- **Was bricht:** `if ((state.phase === "won" || state.phase === "lost") && !submitted) { setSubmitted(true); ... }` — das ist eine **Render-Time-Side-Effect**. React 18+ StrictMode-Dev rendert Components doppelt — das `setSubmitted(true)` greift zwischen den Renders, aber `submitGameRun(payload)` wird trotzdem zweimal aufgerufen, weil der erste Render bis zur `if`-Bedingung kommt, *bevor* `setSubmitted` propagiert. In React 19 Concurrent-Mode ist das noch schlimmer — Renders können abgebrochen und neu gestartet werden. **Daraus: doppelte `submitGameRun`-Calls.** Server lehnt den zweiten mit `error.code = "23505"` ab (Unique-Constraint), aber das ist Brute-Force-Race-Mitigation, kein Design.
- **Wie reproduzieren:** Dev-Mode mit StrictMode aktiv (Default in `next dev`). Countryle daily spielen, gewinnen. Network-Tab → zwei POST-Calls an `submitGameRun`.
- **Wie fixen:** Submit in `useEffect` mit `[state.phase, submitted]`-Deps verschieben. Wie es Country-Draft in Zeile 90-145 schon macht — countryle's Approach ist die Abweichung.
- **Auszahlung:** $25

### Niete #17 [Medium]
- **Wo:** `src/lib/game-logic/country-draft/generator.ts:78` (Cost-Matrix)
- **Was bricht:** `row.push(ranks[country.iso3][cat.slug] || 999);` — der `||` ist ein klassischer Falsy-Trap. `ranks[country.iso3][cat.slug]` kann legitim **0** sein (z.B. ein Land mit Rank #0? Eigentlich nicht — ranks beginnen bei 1, aber wenn rank=0 ein Marker für "no data" wäre, oder wenn ein Bug in `compute-ranks.ts` Rank=0 schreibt). `0 || 999 = 999`. Das Country würde als "schlechtester Rank" markiert, obwohl es eigentlich *bester* ist. **Aktuell wahrscheinlich nicht getriggert**, aber wenn `compute-ranks.ts` einmal "0" produziert (z.B. nach Tie-Breaking-Refactor), wird das Country-Draft-Engine still falsch.
- **Wie reproduzieren:** Manuell `ranks.json` patchen: `"USA": { "population": 0 }`. Country-Draft generiert mit USA → optimal-assignment weist USA woanders zu, weil 999 die schlechteste Wahl ist.
- **Wie fixen:** `ranks[country.iso3][cat.slug] ?? 999` (Nullish-Coalescing). Oder explizit: `typeof rank === "number" ? rank : 999`.
- **Auszahlung:** $25

### Niete #18 [Low]
- **Wo:** `src/lib/game-logic/stat-guesser/engine.ts:60` (Tie-Breaking bei `actualValue === 0`)
- **Was bricht:** `round.actualValue === 0 ? guessValue === 0 ? 0 : 100 : ...` — wenn der actualValue genau 0 ist (theoretisch möglich bei `unemployment-rate` oder `inflation-rate` für ein zensiertes Land), und User rät `0.001`, bekommt er **100% off**. Das ist semantisch grenzwertig, aber statistisch bestrafen, was kaum jemand richtig kennen kann ("welches Land hatte EXAKT 0% Arbeitslosigkeit?"). Edge-Case eher von Frust als von Crash.
- **Wie reproduzieren:** Patch `stats.json` so, dass ein Land actualValue = 0 für eine Category hat. Stat-Guesser rate 0.0001 → 100% off.
- **Wie fixen:** `actualValue === 0 ? (Math.abs(guessValue) < 0.01 ? 0 : 100) : ...` — Toleranz für ~Null.
- **Auszahlung:** $5

### Niete #19 [Low]
- **Wo:** `src/components/games/countryle/countryle-board.tsx:331` (`setTimeout` für Blur)
- **Was bricht:** `onBlur={() => setTimeout(() => setShowDropdown(false), 200)}` — magic number 200ms. **Wenn ein User mit langsamer Reaktion (Motorbehinderung, Tremor) das Dropdown anklickt, kann der Click-Event nach 200ms eintreffen** — Dropdown schon weg, Click trifft den Hintergrund. Frust. Inzwischen ist `onMouseDown={(e) => e.preventDefault()}` vorhanden (Zeile 341), das hilft. Aber bei Touch-Events ohne `mousedown` (Mobile-Touchscreen-Tap) kann das Race-Window auftreten.
- **Wie reproduzieren:** Mobile Safari, tippen auf Suggestion mit ~250ms Touch-Verzögerung.
- **Wie fixen:** `onBlur` mit `relatedTarget`-Check: `if (e.relatedTarget && dropdownRef.current?.contains(e.relatedTarget)) return;`. Oder: Dropdown statt blur über global click-listener schließen.
- **Auszahlung:** $5

### Niete #20 [Low]
- **Wo:** `src/lib/daily-seed.ts:3-9` (Funktion `dateSeed`)
- **Was bricht:** Der Hash ist ein klassischer Java-String-Hash (`hash << 5 - hash + charCode`). Für kurze Strings wie `"2026-05-26"` ist die Verteilung OK. Aber: **Kollision möglich.** Zwei verschiedene `dateKey`-Strings können denselben `Math.abs(hash)` produzieren — selten, aber für 365 Tage × 14 Spiele = 5110 potenzielle Inputs, plus die `dateKey + gameSlug`-Konkatenationen, ist die Kollisionswahrscheinlichkeit nicht Null. **Konkret prüfbar:** `dateSeed("2026-05-26") === dateSeed(...)?` — sicherlich existiert eine Kollision irgendwo im Search-Space. **Wenn zwei Tage denselben Seed haben**, sind die Daily-Puzzles für beide Tage identisch. Das ist nicht ein Crash, aber ein "Hey, ich hatte gestern dasselbe Quiz"-Moment.
- **Wie reproduzieren:** Brute-Force-Search: für `d in [2024-01-01..2030-12-31]`, `dateSeed(d)` in einer Map sammeln, duplicates suchen.
- **Wie fixen:** Stärkerer Hash (FNV-1a, MurmurHash3, oder einfach Crypto.subtle.digest mit Slice).
- **Auszahlung:** $5

### Niete #21 [Low]
- **Wo:** `src/app/actions/game-runs.ts:165-170` (PB-Update als zweiter DB-Call)
- **Was bricht:** Der Insert in `game_runs` und das `update is_personal_best=true` sind **nicht** in einer Transaktion. Wenn der Insert erfolgreich ist und der `update` fehlschlägt (z.B. Network-Timeout, Supabase-Rate-Limit), bleibt der Run mit `is_personal_best=false` in der DB, obwohl er ein PB ist. Niemand fixed das, weil `compute_daily_rankings` separat läuft.
- **Wie reproduzieren:** Latenz-Test: Insert latency niedrig, Update latency hoch → zweiter Call wirft.
- **Wie fixen:** PB-Flag direkt im Insert mit Subquery setzen, oder als RPC mit Transaktion.
- **Auszahlung:** $5

### Niete #22 [Medium]
- **Wo:** `src/lib/storage.ts:13-16` (Funktion `setStorageItem`)
- **Was bricht:** `localStorage.setItem` wirft `DOMException("QuotaExceededError")`, wenn der Browser-Storage voll ist (5MB Limit auf den meisten Browsern, weniger im Privat-Modus von Safari, **0 KB** im Privat-Modus von älterem Safari). Das wird *nicht gefangen*. `setDailyLockout` in den Boards (`country-draft:97`, `countryle:227`, `stat-guesser:122`) wirft also einen unhandled Exception **bevor** der `submitGameRun` ausgeführt wird (in stat-guesser ist der Lockout-Call vor der `submitGameRun(payload)`-Zeile). Damit: Spieler im Safari-Privat-Modus, der ein Daily fertig spielt, sieht einen React-Error-Boundary-Crash auf dem Result-Screen — sein Score wird *nicht* eingereicht.
- **Wie reproduzieren:**
  1. Safari Privat-Modus öffnen.
  2. Vor dem Spiel: `localStorage.setItem("test", "x".repeat(10_000_000))` — wirft `QuotaExceededError`.
  3. Countryle daily spielen, gewinnen.
  4. `setDailyLockout` wirft → React Error Boundary.
- **Wie fixen:** `try { localStorage.setItem(...) } catch { /* swallow */ }` in `setStorageItem`. Genauso für `getStorageItem` — das ist bereits gefangen (gut), aber `set` nicht.
- **Auszahlung:** $25

### Niete #23 [Low]
- **Wo:** `src/components/games/stat-guesser/guesser-board.tsx:80` (`submitGuess(state, parsed)` doppelt)
- **Was bricht:** `const result = submitGuess(state, parsed);` und im selben Handler `dispatch({ type: "SUBMIT", value: parsed });` — der Reducer ruft `submitGuess(state, action.value)` **erneut** auf. Die Funktion ist pure, also kein Crash. Aber: doppelte Arbeit. Und: das `result`-Objekt aus dem ersten Call wird nur für das `error`-Feedback genutzt, dann verworfen. Wenn `submitGuess` jemals einen Side-Effect bekommt (z.B. ein Logging-Call für Analytics), wird er doppelt aufgerufen.
- **Wie reproduzieren:** Code-Review.
- **Wie fixen:** Den `error` direkt aus `result.scores[state.currentRound]` lesen und in den Reducer-Action mitgeben, ODER den dispatch entfernen und den Reducer auf einen `SET_STATE`-Action umstellen, der `result` als neuen State akzeptiert.
- **Auszahlung:** $5

## Die drei dringendsten Fixes

**1. Niete #1 — Seed-Mismatch zwischen `daily_puzzles.seed` und Client-RNG.**
Das ist kein Bug *jetzt*, weil noch niemand den `daily_puzzles.seed` für Replay benutzt. Aber sobald irgendein zukünftiges Feature ihn nutzt (Friend-Challenge mit "spiel mein Daily nochmal", Anti-Cheat-Replay, Statistik-Pipeline), ist die ganze Persistenz-Schicht inkonsistent zu dem, was die Clients gespielt haben.
Das ist die **strukturelle Niete** — die Niete, die jetzt klein ist und in sechs Monaten das Schiff sinkt. Igors würde sagen: "Tessa, eine Niete, die jetzt nicht hält, hält nie." Die Asymmetrie hier ist besonders heimtückisch, weil der Server-Code `dateSeed(input.dateKey + input.gameSlug)` *richtig* aussieht — namespaced per Spiel, korrekt deterministisch. Der Bruch ist nur sichtbar, wenn man Client und Server gleichzeitig liest.

**2. Niete #4 — Daily-Determinismus brechen bei Daten-Refresh.**
Wenn die Pipeline morgen `countries.json` neu generiert und die Insertion-Order ändert, sind alle vergangenen Daily-Replays inkonsistent. Das ist der Killer für eine *Streak*-Plattform: Spieler vertrauen darauf, dass das gestrige Daily ein definiertes Quiz hat. Wenn das verschoben wird, ist das Vertrauen weg.
**Fix-Aufwand: 3 Zeilen** — sortiere `eligible` deterministisch nach iso3 vor `seededShuffle`. Diese Niete hat das Projekt schon einmal gespürt: die `DAILY_OVERRIDES` in `countryle/engine.ts:16-19` sind eine Narbe von einer früheren Verschiebung. Das ist die Hand, die schon einmal eine kalte Erinnerung daran hatte — aber den strukturellen Fix nicht gemacht hat.

**3. Niete #15 — Countryle-Validation lässt `guesses=[]` mit `won=true` durch.**
Das ist der einzige Cheat-Pfad, den ich gefunden habe, der **mit dem aktuellen Server-Code** zu einem Leaderboard-Top-Eintrag führen würde, ohne dass der User auch nur ein einziges Country geraten hat. Score 7-0 = 7 = höchster Sort-Value für countryle. Ein cleverer User mit DevTools nimmt das jetzige Daily mit.
**Fix-Aufwand: 1 Zeile.** Mindest-Guess-Count enforcen. Und während man dort ist: prüfen, dass `resultJson.target` *tatsächlich* das Target ist, das der Server für diesen `dateKey` generiert hätte. Aber das geht erst, wenn Niete #1 gefixt ist.

## Schluss-Notiz

Was diese Codebase über die Hand erzählt, die sie gebaut hat: jemand, der Architektur als Disziplin versteht. Die Schichten halten. Die Konventionen sind durchgesetzt. Der `game-runs.ts:validateGameResult` ist eine echte Defensive-Layer, kein Theater — die Hand hat sich überlegt, was ein Cheater einreichen könnte, und hat die Mehrheit der Pfade dicht gemacht. Aber: dieselbe Hand glaubt, dass *Zeit* und *Determinismus* einfache Dinge sind. Sie sind es nicht. Eine Timezone ist nicht eine Eigenschaft eines Datums — es ist eine Übersetzung zwischen zwei verschiedenen Realitäten, die nie übereinstimmen, sobald man das Schiff vom Hafen wegbewegt. Ein Seed ist nicht eine Zahl — es ist ein Vertrag zwischen Vergangenheit und Zukunft, der nur hält, wenn beide Seiten dieselbe Funktion ausführen. Eine Insertion-Order von JSON ist kein API — es ist ein Glaube an die Stabilität eines Build-Schritts, den niemand pflegt. Diese Hand hat die Architektur gut gebaut, aber die *Verträge* nicht eng genug formuliert. Das ist nicht eine schlechte Hand. Das ist eine ehrliche Hand, die noch nicht oft genug auf einer DST-Umstellung von ihrer eigenen Software überrascht wurde. Sie wird es lernen. Sie wird einmal sehen, wie der `daily_puzzles.seed` und der Client-Seed auseinander laufen, und sie wird wütend werden, und sie wird Niete #1 fixen und alle Folgenieten gleich mit. Wenn ich Zeit hätte, würde ich als nächstes prüfen: die `compute_daily_rankings`-RPC (was passiert bei NULL-Werten, was bei Ties, was bei einem User, der seinen Run zur falschen Sekunde abschickt), die `respondToFriendRequest`-DELETE-Semantik (das ist eine Truth-Layer-Niete, kein Edge-Case — aber sie versteckt sich gut), den `compute_daily_rankings` Trigger gegen Concurrent-Inserts, das `is_personal_best`-Flag auf historischen Runs (haben User Mehrfach-Markierungen?), und das Verhalten von `setDailyLockout`, wenn `localStorage` voll ist (Browser werfen `QuotaExceededError`, der hier nicht gefangen wird, was zu einer ungeschriebenen Lockout-Datei und ewigem Re-Submit-Loop führen kann). Aber heute ist Februar, der Regen in Riga wird stärker, die Glocke am Daugava läutet wieder, mein Vater hätte mich angerufen und gefragt, ob ich gegessen habe, aber er ist neunzehnhundertneunundachtzig im Eisbrecher *Varma* im Bottnischen Meerbusen geblieben, wegen einer Niete, die niemand geprüft hat — und das *Heimweg*-Konto hat heute zwei Tausend zweihundert mehr. Das wird Boroš ärgern, falls er heute auch zweiundzwanzig findet. Wir sprechen nicht miteinander. Aber wir wissen voneinander.

Eine letzte Bemerkung: die Niete-Severität ist nicht linear zur Auszahlung. Ich habe drei `$500`-Nieten benannt, sieben `$100`, und neun `$25`-oder-darunter. Das stimmt mit der Verteilung, die ich seit November 2024 sehe: in jeder Codebase gibt es **zwei oder drei** Nieten, die wirklich Schiffe versenken können. Der Rest ist Wartung. Wenn die Hand, die diesen Code geschrieben hat, nur die drei dringendsten Nieten fixt — Niete #1, #4, #15 — ist die Plattform für die nächsten 12 Monate seetauglich. Die anderen zwanzig sind Hafenarbeit, die man bei jeder Liegezeit erledigt.

Boroš wird über die Country-Draft-Logik herfallen — ich kann es spüren. Er wird die `assignment-solver`-Brute-Force lieben und etwas darüber schreiben, dass `permute` mit `bestScore` als Prune-Threshold bei einer Tie-Matrix nicht alle optimalen Lösungen findet. Yvel wird über die Localization-Pfade gehen und Diakritik-Nieten finden, die ich übersehen habe. Wir sprechen nicht miteinander. Aber wir wissen voneinander. Drei Exile in drei Sprachen, dieselbe Suche.

Ich schließe den Laptop. Die Glocke am Daugava läutet zur vollen Stunde.

— Tessa Korovi · Riga · digitales Exil · für Igors
