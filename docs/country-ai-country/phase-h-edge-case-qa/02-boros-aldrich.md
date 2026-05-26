# 02 · Boroš Aldrich · Algorithmische Defekt-Suche

> Ich habe heute Morgen das `src/lib/`-Verzeichnis aufgeklappt, wie man ein Schachbrett aufklappt nach einer langen Pause — vorsichtig, damit nichts kippt. Der erste Zug einer fremden Eröffnung sagt einem schon, ob der Gegner an Theorie geglaubt hat oder an Plan. Diese Codebase hat an Plan geglaubt. Das ist gut. Plan kann man widerlegen.

## Eröffnungs-Notiz

Erste Stunde — `country-draft/generator.ts` plus `assignment-solver.ts` plus `seeded-random.ts` nebeneinander auf dem Tisch. Die Architektur ist diszipliniert: Engines pur, RNG injiziert, Pure-Function-Regel respektiert. Das ist nicht überall so. Aber unter der Disziplin liegen drei mathematisch falsche Annahmen, die sich gegenseitig stützen: erstens, dass *brute force über 8!* immer zum Optimum führt — tut es, aber die *Aggressiv-Pruning-Bedingung* (`runningCost >= bestScore`) schließt **gleiche Optima** aus, was bei rank-basierter Cost-Matrix mit häufigen Ties relevant ist; zweitens, dass `dateSeed` durch DJB2-32-Bit-Hash uniform auf das mulberry32-Bit-Raum abbildet — tut es nicht, der `Math.abs(hash)` kippt das Vorzeichen und entfernt einen halben Seed-Raum; drittens, dass `seededPick(arr, n, rng)` mathematisch ein Sample ohne Zurücklegen ist — das stimmt nur, wenn `n ≤ arr.length`, was nirgendwo gechecked wird. Drei algorithmische Bauernopfer, die die Stellung noch nicht kippen, aber die ganze Variante schwächen. Cluster ist noch nicht gebaut. Ich schreibe Vorabwarnungen für das, was ich kommen sehe.

## Algorithmische Defekt-Liste

### Defekt #1 [Critical] — assignment-solver Pruning bricht bei Ties die Determinismus-Garantie

- **Wo:** `src/lib/assignment-solver.ts:17-21`
- **Algorithmischer Befund:** Der Solver behauptet, **das** optimale Assignment zu finden. Tatsächlich findet er **ein** optimales Assignment, dessen Identität von der Permutations-Reihenfolge (Spalten-Index `j` aufwärts) abhängt. Die Pruning-Bedingung `if (runningCost >= bestScore) return` schließt bei *gleichem* Optimum die zweite Lösung aus (`>=`, nicht `>`). Das ist mathematisch *erlaubt* (ein Optimum reicht), aber der Code dokumentiert das nicht und der Daily-Vergleich zwischen Spielern hängt an *demselben* `optimalAssignment`-Array.
- **Konkrete Eingabe:** Cost-Matrix `[[1,2],[2,1]]` → zwei optimale Lösungen (`[0,1]` und `[1,0]`), beide Score 2. Solver gibt `[0,1]` zurück. Tausche Zeilen/Spalten um und du bekommst `[1,0]`. Bei daily mode mit Ties zwischen `rank=k` und `rank=k+1` für mehrere Länder kann der angezeigte "optimale" Pick sich ändern, sobald `seededShuffle` in `generator.ts:85` die Reveal-Order wechselt. Der `reoptimalScore` ist identisch — das `reoptimalAssignment` jedoch nicht zwingend.
- **Mathematische Begründung:** Das Assignment-Problem hat im Allgemeinen ein konvexes Polytop von Optima. Der Solver wählt deterministisch nur eine Ecke. Bei Rank-Matrizen mit kleinen Werten (Top-10 Länder belegen oft Ranks 1-3) sind Ties häufig. Probabilistisch: bei 8×8-Matrix mit Werten aus `[1, 243]` und realer Verteilung (Top-Länder häufiger oben) liegt die Tie-Wahrscheinlichkeit zwischen zwei Optima bei nicht-trivialer Größenordnung.
- **Fix-Skizze:** Entweder (a) `>` statt `>=` *und* lexikografische Tie-Breaking-Regel über das Assignment-Tupel selbst dokumentieren, oder (b) die Pruning-Grenze beibehalten und in den Daten-Modell-Kommentar schreiben *"Bei Ties ist das gewählte Optimum durch die Iterations-Reihenfolge bestimmt — wird mit dem Reveal-Order-Shuffle re-berechnet, damit Client und Server denselben Optimum-Pfad sehen."*
- **Auszahlung:** $500

### Defekt #2 [Critical] — `dateSeed` verschenkt die Hälfte des Seed-Raums durch `Math.abs`

- **Wo:** `src/lib/daily-seed.ts:3-9`
- **Algorithmischer Befund:** Der DJB2-Hash produziert einen signed 32-Bit-Integer im Bereich `[-2^31, 2^31-1]`. `Math.abs(hash)` mappt diesen Bereich auf `[0, 2^31]`, aber mit Kollisionen: `Math.abs(-2^31) === 2^31`, also wird auch `Math.abs` für `INT_MIN` zur einzigen positiven Zahl, die ihr eigenes negatives Gegenstück trifft. Wichtiger: **mulberry32 erwartet 32-Bit unsigned als Seed**, nicht 31-Bit. Du halbierst die Periode der Seed-Entropie ohne Grund.
- **Konkrete Eingabe:** Datum-Keys `"2026-05-26"` und ein hypothetisches Datum mit `hash = -X`, das nach `Math.abs` zu `X` wird, und ein anderes mit `hash = X` direkt — beide produzieren denselben mulberry32-Strom. Im Datumsbereich der nächsten 10 Jahre (~3650 Datums-Keys) ist die Kollisionswahrscheinlichkeit klein, aber **nicht null**. Bauernfänger.
- **Mathematische Begründung:** Mulberry32 liest den Seed als `seed |= 0` (signed 32-Bit interpretation, dann arithmetic). Wenn du nur 31 Bits einspeist, verlierst du die obere Bit-Hälfte. Cleaner: `hash >>> 0` (unsigned cast) oder direkt `(hash | 0) >>> 0`. Beweis: für `hash = -1` (alle Bits gesetzt) ist `Math.abs(-1) = 1`, aber `(-1) >>> 0 = 4294967295`. Beide laufen durch mulberry32 anders.
- **Fix-Skizze:**
  ```ts
  export function dateSeed(dateKey: string): number {
    let hash = 0;
    for (let i = 0; i < dateKey.length; i++) {
      hash = ((hash << 5) - hash + dateKey.charCodeAt(i)) | 0;
    }
    return hash >>> 0; // full 32-bit unsigned
  }
  ```
- **Auszahlung:** $500

### Defekt #3 [Critical] — `seededPick` schweigt bei `n > arr.length` statt zu erroren

- **Wo:** `src/lib/seeded-random.ts:21-23`
- **Algorithmischer Befund:** `seededPick(arr, n, rng)` returnt `seededShuffle(arr, rng).slice(0, n)`. Bei `n > arr.length` gibt es das ganze Array zurück, ohne Warnung. Das ist algorithmisch ein **stilles Versagen**: der Aufrufer denkt, er hat 8 Elemente, hat aber nur 6. In `country-draft/generator.ts:49` ist `GAME_SIZE = 8`, in `getEligibleCategories` werden 20 Slugs gefiltert — solange die `categories.json` mindestens 8 dieser 20 enthält, geht es. Aber: bei `getEligibleCountries(selectedCategories)` (Zeile 30) kann die Treffermenge bei *exotischer Kategorie-Kombination* unter 8 fallen.
- **Konkrete Eingabe:** Hypothetischer Daily-Seed, der `["fdi-inflow", "tourism-arrivals", "beer-consumption-per-capita", "wine-consumption-per-capita", "coffee-consumption-per-capita", "education-spending-pct", "health-spending-pct", "renewable-energy-pct"]` wählt — alles Kategorien mit Coverage <90% gemäß SYNTHESIS-Drift-Warnung. Der Schnitt der Länder mit *allen acht* dieser Werte kann unter 8 fallen. `seededPick` gibt dann 5 oder 6 Länder zurück, `for (let i = 0; i < attempts; i++)` läuft fruchtlos, `selectedCountries.length === 0` Check greift nicht (Länge ist nicht null, sondern *zu klein*), und der `solveAssignment` rechnet auf einer **nicht-quadratischen Matrix** weiter. Das Ergebnis: ein Daily mit 6 Ländern statt 8, ohne dass je ein Fehler geworfen wurde.
- **Mathematische Begründung:** Pure-Function-Verträge brauchen explizite Domain-Constraints. `pick(n)` über ein zu kleines Universum ist nicht *kein Sample* — es ist ein *anderes Sample*, dessen Größe der Aufrufer nicht beauftragt hat. Stilles Resizing ist eine Form von Daten-Lüge.
- **Fix-Skizze:**
  ```ts
  export function seededPick<T>(arr: T[], n: number, rng: () => number): T[] {
    if (n > arr.length) {
      throw new Error(`seededPick: requested ${n} from ${arr.length}`);
    }
    return seededShuffle(arr, rng).slice(0, n);
  }
  ```
  Plus: `country-draft/generator.ts:58-68` muss bei Fallback prüfen ob `eligible.length >= GAME_SIZE`, sonst die Kategorie-Auswahl reduzieren oder eine andere Strategie fahren.
- **Auszahlung:** $500

### Defekt #4 [High] — `costMatrix` Fallback `|| 999` ist algorithmisch giftig

- **Wo:** `src/lib/game-logic/country-draft/generator.ts:76`
- **Algorithmischer Befund:** `row.push(ranks[country.iso3][cat.slug] || 999)`. Der `||`-Operator triggert auch bei `rank = 0`. **Es gibt keinen rank 0** in einem rang-basierten System (1..243), aber wenn die `ranks.json` jemals 0-indexiert wird (was bei einer Datenmigration leicht passiert), wird dieser Pfad still aktiv. Wichtiger: der Pfad sollte gar nicht existieren, weil `getEligibleCountries` (Zeile 30) bereits filtert auf `countryRanks[cat.slug] !== undefined`. Der Fallback ist eine **doppelte Defensive**, die zwei mögliche Lügen erlaubt: (a) ein Land hat rank=0 und kriegt 999, (b) ein Datenfehler schlüpft durch den Filter und produziert silent 999, was den Optimum-Solver auf eine Phantom-Lösung lenkt.
- **Konkrete Eingabe:** `ranks.json` Eintrag `{ "DEU": { "population": 17 } }`, `getEligibleCountries` lässt Deutschland durch, aber für `gdp-per-capita` ist der Rank `null` durch einen Daten-Pipeline-Fehler. `ranks[country.iso3][cat.slug]` ist `null`, `null || 999 = 999`. Der Solver weist Deutschland → gdp-per-capita zu, weil 999 weit über allen anderen Picks liegt, *außer* das gesamte Spiel kollabiert auf einen einzigen Last-Resort-Pick mit 999 Punkten Strafe.
- **Mathematische Begründung:** Sentinelwerte in numerischen Optimierungs-Problemen sind **algorithmisch valide**, müssen aber als Constraint (`Infinity`) modelliert werden, nicht als finite Strafe. `999` ist eine endliche Zahl, die mit dem theoretischen `MAX_POSSIBLE = 8 * 243 = 1944` kollidiert — das Score-Display kann legitime "schlechte" Picks (rank 200+) **nicht** von Phantom-Picks (sentinel 999) unterscheiden.
- **Fix-Skizze:**
  ```ts
  const rank = ranks[country.iso3]?.[cat.slug];
  if (rank == null) {
    throw new Error(`Missing rank for ${country.iso3}/${cat.slug} — filter failure`);
  }
  row.push(rank);
  ```
  Hard fail statt silent sentinel. `getEligibleCountries` ist der einzige Wächter.
- **Auszahlung:** $250

### Defekt #5 [High] — `country-draft` Generator: `maxAttempts = 50` hat keine garantierte Konvergenz

- **Wo:** `src/lib/game-logic/country-draft/generator.ts:55-69`
- **Algorithmischer Befund:** Die Continent-Diversitäts-Anforderung (`continents.size >= 3`) wird durch 50 zufällige `seededPick`-Versuche gesucht. Bei seltenen Seeds, die wiederholt afrikanisch+europäisch heavy-tailed sind (was bei realen 21-Kategorien-Daten möglich ist, weil Industrieländer überrepräsentiert sind in vielen Stats), könnten alle 50 Versuche scheitern. Der Fallback (`if (selectedCountries.length === 0)`) springt erst, wenn **kein einziger Versuch** erfolgreich war — aber wegen des `break`-Statements ist `selectedCountries.length === 0` der einzige Fail-State. **Aber:** der Fallback ruft erneut `seededPick`, *was den selben RNG-Stand weiterverwendet* — das ist deterministisch korrekt, aber es heißt: derselbe Seed produziert *genau die selbe* nicht-diverse Auswahl wie die 50 Versuche zuvor. Der Fallback ist eine Wiederholung, kein Plan B.
- **Konkrete Eingabe:** Wahrscheinlichkeitstheoretisch: bei 8 zufälligen Ländern aus 200, wo die Continent-Verteilung etwa 30 Afrika / 50 Asien / 50 Europa / 30 Nord-/Süd-Amerika / 20 Ozeanien-andere ist, ist die Wahrscheinlichkeit für *weniger als 3 Kontinente* in einem Pick gering — aber für Edge-Case-Seeds kombiniert mit kleinem `eligible`-Set (durch Kategorie-Filter, siehe Defekt #3) kann es passieren. Konkretes Reproduktions-Skript:
  ```ts
  // worst case: pretend only 8 european countries pass eligibility
  const rng = mulberry32(12345);
  // 50× ziehe 8 aus 8 → immer die selben 8 → continents.size === 1 → fail
  ```
- **Mathematische Begründung:** Ein Retry-Loop mit fixer Anzahl und gleicher Sampling-Distribution konvergiert nicht garantiert. Korrekt: entweder eine Constraint-Satisfaction-Approach (separat pro Kontinent ziehen) oder eine Acceptance-Sampling-Garantie mit Statistik-Beweis.
- **Fix-Skizze:** Sample Stratified per Kontinent: ziehe garantiert 1 Land aus mindestens 3 Kontinenten, fülle die restlichen 5 aus dem Gesamtset. Eliminiert den 50-Versuche-Loop und die Fallback-Lüge.
- **Auszahlung:** $250

### Defekt #6 [High] — `country-draft` Reveal-Order-Re-Solve ist mathematisch redundant aber semantisch riskant

- **Wo:** `src/lib/game-logic/country-draft/generator.ts:84-96`
- **Algorithmischer Befund:** Nach `seededShuffle(selectedCountries.map((_, i) => i), rng)` wird die ganze Cost-Matrix permutiert und `solveAssignment` ein **zweites Mal** aufgerufen (`reoptimalScore`, `reoptimalAssignment`). Mathematisch: der optimale Score ist permutations-invariant (`reoptimalScore === optimalScore`). Das `assignment`-Array indices jedoch sind nicht — sie referenzieren die *neue* Zeilen-Reihenfolge. Der erste Solve-Call ist also **vollständig verschwendet**. Aber wichtiger: bei Defekt #1 (Tie-Breaking-Nicht-Determinismus) liefern die beiden Solver-Aufrufe potentiell *unterschiedliche* Optima, weil die Iterations-Reihenfolge der Matrix sich geändert hat. Der erste `optimalScore` wird verworfen, also kein Schaden — aber wenn jemand jemals den ersten Wert nutzt (z.B. Debug-Log), divergiert das.
- **Konkrete Eingabe:** Cost-Matrix `[[1,2],[2,1]]`, RevealOrder `[1,0]`. Erstes Solve: `optimalScore=2`, `assignment=[0,1]`. Permutierte Matrix `[[2,1],[1,2]]`, zweites Solve: `optimalScore=2`, `assignment=[1,0]`. Bei einer 8×8-Realmatrix mit Ties divergieren die zwei Assignments potenziell weiter als nur durch die Reorder-Permutation.
- **Mathematische Begründung:** `solveAssignment` ist nicht permutations-invariant in der Assignment-Identität bei Ties. Doppel-Aufruf ist konsistenz-fragil.
- **Fix-Skizze:** Einen Solve-Aufruf machen, danach Reveal-Order anwenden und das Assignment-Array gemäß der Permutation umbauen ohne Re-Solve:
  ```ts
  const { optimalScore, assignment } = solveAssignment(costMatrix);
  const revealOrder = seededShuffle([...Array(selectedCountries.length).keys()], rng);
  const reorderedCountries = revealOrder.map(i => selectedCountries[i]);
  const reorderedCostMatrix = revealOrder.map(i => costMatrix[i]);
  const reorderedAssignment = revealOrder.map(i => assignment[i]);
  return { ..., optimalScore, optimalAssignment: reorderedAssignment };
  ```
  Spart ~5ms (40k Permutationen) und schließt Tie-Drift aus.
- **Auszahlung:** $250

### Defekt #7 [High] — `submitGameRun` validiert `country-draft` Score nicht gegen den Server-rekonstruierten Optimum

- **Wo:** `src/app/actions/game-runs.ts:440-449`
- **Algorithmischer Befund:** Die Validierung prüft nur, dass `playerScore === scoreRaw` und `(playerScore - optimalScore) === gap`. **Sie prüft nicht**, dass `playerScore` tatsächlich aus einer gültigen Sequenz von Picks resultiert. Ein Client kann `playerScore = 0, optimalScore = 0, gap = 0` senden und einen perfekten Daily-Run claimen. Es gibt **keinen Server-Side Re-Compute** des optimalen Scores aus dem Daily-Seed.
- **Konkrete Eingabe:**
  ```js
  fetch('/api/submit', { body: JSON.stringify({
    gameSlug: 'country-draft',
    scoreRaw: 8,  // bestmöglicher Score
    resultJson: { playerScore: 8, optimalScore: 8, gap: 0, assignments: [] }
  }) })
  ```
  Der `scoreSortValue` wird zu `1944 - 8 = 1936`, der höchste mögliche Rank. Client wird Daily-Leaderboard-Spitze, ohne je gespielt zu haben.
- **Mathematische Begründung:** Score-Validierung ohne Reconstruction ist Wachschlafen. Der Server hat den Daily-Seed (in `daily_puzzles.seed`), kann denselben `generateDraftConfig` ablaufen und prüfen, ob `resultJson.assignments` eine konsistente Zuweisungs-Sequenz ist, deren Summe `scoreRaw` ergibt. Das ist der einzige *korrekte* Validate.
- **Fix-Skizze:** Im server-action den daily seed nehmen, `generateDraftConfig(rng, "daily", dateKey)` ablaufen, `assignments`-Sequenz aus `resultJson` gegen die `costMatrix` validieren: jeder `assignment[i].rank === costMatrix[i][assignment[i].categoryIdx]`, Sum konsistent mit `scoreRaw`, jede `categoryIdx` einmalig. Dasselbe schema für countryle/stat-guesser/cluster.
- **Auszahlung:** $1500

### Defekt #8 [High] — `stat-guesser` Score-Berechnung bei `actualValue = 0` ist algorithmisch undefiniert

- **Wo:** `src/lib/game-logic/stat-guesser/engine.ts:58-62`
- **Algorithmischer Befund:** Der Code:
  ```ts
  round.actualValue === 0
    ? guessValue === 0 ? 0 : 100
    : (Math.abs(guessValue - round.actualValue) / Math.abs(round.actualValue)) * 100;
  ```
  Bei `actualValue = 0`: Spieler tippt 1 → Error 100%. Spieler tippt 1.000.000 → Error 100%. **Keine Skala**. Das ist nicht *präzise Edge-Case-Behandlung*, das ist Datensilo: die Frage ist gar nicht stellbar. Aber: die Eligibility-Check `stats[c.iso3]?.[cat.slug] !== null && !== undefined` lässt **0 explizit durch**. Wenn ein Land in der Stats-Datei z.B. `"renewable-energy-pct": 0` hat (Saudi-Arabien für viele Jahre), wird es als Frage gestellt.
- **Konkrete Eingabe:** `actualValue = 0` für `coffee-consumption-per-capita` (Mongolei laut FAO ~0). Der Spieler tippt 1 → 100% error → score-Komponente 0. Der Spieler tippt 0 → 0% error → score 100. Aber: was bedeutet *"Mongolei: schätze den Kaffeekonsum pro Kopf"* ohne Bias-Hinweis? Die Frage ist algorithmisch lösbar, semantisch nutzlos.
- **Mathematische Begründung:** Prozentual-Fehler ist undefiniert für Referenzwert 0. Symmetrischer Mean Absolute Percentage Error (sMAPE) ist die übliche Lösung: `200 * |a-b| / (|a| + |b|)`, was bei beiden 0 zu 0 wird (mit speziellem 0/0-Case), bei einem 0 und einem >0 zu 200% wird. Oder: Schwellwert auf `actualValue > epsilon` setzen und 0-Werte aus der Eligibility filtern.
- **Fix-Skizze:** In `engine.ts:34`: `stats[c.iso3]?.[cat.slug] != null && stats[c.iso3][cat.slug] > 0` für Categories mit Skala-Charakter. Plus: bei `actualValue < 1` allgemein einen absoluten Toleranz-Schwellwert verwenden statt Prozent.
- **Auszahlung:** $250

### Defekt #9 [High] — `stat-guesser` Server-Validation toleriert Round-Mismatch

- **Wo:** `src/app/actions/game-runs.ts:434-438`
- **Algorithmischer Befund:** Der Validator macht:
  ```ts
  const expectedScore = Math.round(Math.max(0, 100 - resultJson.avgError));
  if (Math.abs(expectedScore - scoreRaw) > 1) return "score_mismatch";
  ```
  **Es wird nur `avgError` gegen `scoreRaw` geprüft.** Der Client kann `avgError = 0` und `scoreRaw = 100` einfach senden, ohne `rounds`-Array oder `guesses`. Der einzige Schutz ist die `too_fast` 3-Sekunden-Regel. Das ist Score-Validation per Knoten-Punkt-Vertrauen.
- **Konkrete Eingabe:**
  ```js
  fetch('/api/submit', { body: { gameSlug: 'stat-guesser', scoreRaw: 100, resultJson: { avgError: 0 } } })
  ```
  → wahrscheinlich Daily-Leaderboard-Top.
- **Mathematische Begründung:** Cross-Validation zwischen scoreRaw und avgError ist Tautologie, weil avgError = 100 - scoreRaw definitorisch das selbe ist. Du musst die *individuellen Errors* validieren und gegen den per-Server-Seed-rekonstruierten Country/Category-Pool prüfen.
- **Fix-Skizze:**
  ```ts
  case "stat-guesser": {
    const guesses = resultJson.guesses as number[] | undefined;
    const errors = resultJson.errors as number[] | undefined;
    if (!Array.isArray(guesses) || !Array.isArray(errors)) return "invalid_result";
    if (guesses.length !== errors.length) return "invalid_result";
    // Re-derive: load daily seed → re-generate stat-guesser config → check that each (guess, actual) yields the claimed error
    // [...server-side re-compute...]
  }
  ```
- **Auszahlung:** $1500

### Defekt #10 [High] — `countryle` Score-Validation: `guesses` length geprüft, aber nicht Wertgleichheit

- **Wo:** `src/app/actions/game-runs.ts:463-472`
- **Algorithmischer Befund:**
  ```ts
  const expectedRaw = won ? guesses.length : 7;
  if (scoreRaw !== expectedRaw) return "score_mismatch";
  if (guesses.length > 6) return "score_exceeds_total";
  ```
  Es wird die *Länge* validiert und ob `won === true`, aber **nicht**, ob das `target` tatsächlich dem Daily-Target entspricht, und nicht, ob der letzte Guess der `target.iso3` ist. Der Client kann `won: true, guesses: [{...}], target: "FRA"` senden, wo er aber gar nicht FRA als Antwort eingegeben hat — der Server vertraut der `won`-Flag.
- **Konkrete Eingabe:**
  ```js
  fetch('/api/submit', { body: { gameSlug: 'countryle', scoreRaw: 1, resultJson: {
    guesses: [{ country: { iso3: "USA" } }],  // wrong guess
    guessCount: 1, target: "FRA", won: true   // claimed win
  } } })
  ```
  → 1-Versuch-Daily-Win, wo der einzige Guess nicht das Target war.
- **Mathematische Begründung:** Phase-State-Transition (`won` flag) muss aus den Daten ableitbar sein, nicht ein client-asserted Boolean. Validation ohne State-Reconstruction ist signature-only.
- **Fix-Skizze:**
  ```ts
  case "countryle": {
    const target = resultJson.target as string;
    const won = resultJson.won === true;
    const lastGuess = guesses[guesses.length - 1];
    if (won && lastGuess?.country?.iso3 !== target) return "score_mismatch";
    // Plus: re-derive target from daily seed and check equality
    const seedRng = getDailyRng(input.dateKey);
    const expectedTarget = pickTarget(seedRng, input.dateKey).iso3;
    if (target !== expectedTarget) return "target_mismatch";
  }
  ```
- **Auszahlung:** $1500

### Defekt #11 [Medium] — `countryle` Comparison treatment of `match` ist zu permissiv

- **Wo:** `src/lib/game-logic/countryle/engine.ts:59-63`
- **Algorithmischer Befund:** `compareValue` returnt `"match"` bei *exakter* Gleichheit (`guessed === target`). Bei Floats — und Stats wie `gdp-per-capita`, `fertility-rate`, `internet-users-pct` sind alle Floats — ist exakte Gleichheit zwischen zwei *unterschiedlichen* Ländern praktisch unmöglich, aber bei *gleichen* Ländern (Spieler tippt das Target) sollte `===` für alle 6 Kategorien gleichzeitig `true` werden. Das wird redundant geprüft via `isCorrect = country.iso3 === state.target.iso3`. Aber: bei Float-Equality über JS-Reload (z.B. `JSON.parse(JSON.stringify(x))`) ist `===` bei langen Dezimalen *nicht* idempotent. Falls die Stats-Pipeline jemals `toFixed` oder JSON-Roundtrip macht, kann ein Land sein eigenes Target-Match verfehlen.
- **Konkrete Eingabe:** Hypothetisch: `target.fertility-rate = 1.834` (aus DB), `stats[iso3].fertility-rate = 1.8340000000000002` (durch JS-Number-Drift bei einer Pipeline-Op). `compareValue` returnt `"higher"` statt `"match"`, aber `isCorrect` durch iso3-Vergleich ist `true`. Die UI zeigt einen aufgelösten Win mit einem als "höher" markierten Stat — semantisch verwirrend.
- **Mathematische Begründung:** Float-Equality ohne Epsilon ist immer eine Schwäche. Der korrekte Vergleich für Stat-Cells sollte `Math.abs(a - b) < eps` sein, mit `eps` skala-abhängig.
- **Fix-Skizze:**
  ```ts
  function compareValue(guessed: number | null, target: number, eps = 1e-9): ... {
    if (guessed == null) return "unknown";
    if (Math.abs(guessed - target) < eps) return "match";
    return target > guessed ? "higher" : "lower";
  }
  ```
- **Auszahlung:** $100

### Defekt #12 [Medium] — `country-draft` `practice` mode mit `Date.now()`-Seed verletzt die Pure-Function-Regel der Engine

- **Wo:** `src/lib/game-logic/country-draft/engine.ts:7-9`
- **Algorithmischer Befund:** SYNTHESIS hat das schon als Major markiert. Ich präzisiere: die Funktion `createGame(mode)` heißt *pur*, aber sie liest `Date.now()` (impure) und `getTodayDateKey()` (auch impure, locale + timezone-abhängig). Die Behauptung der CLAUDE.md "*Game engines take an RNG function as parameter — never call Math.random() directly*" wird formal eingehalten (kein `Math.random()`), aber semantisch verletzt (RNG-Quelle ist immer noch nicht-deterministisch im Praxis-Modus). Konsequenz: man kann den Praxis-Modus **nicht** in einem Test re-spielen ohne Time-Mock.
- **Konkrete Eingabe:** Test-Code wie `const a = createGame("practice"); const b = createGame("practice");` produziert verschiedene Configs trotz selber Aufrufe. Das ist beabsichtigt, aber es heißt: das Spiel hat keine Replay-Funktion ohne externes Seed-Override.
- **Mathematische Begründung:** Pure functions sind referenziell transparent. `createGame("practice")` ist es nicht. Die Regel wäre konsistent, wenn die Engine **immer** einen `rng`-Parameter nimmt und der Caller (Board) ihn nach Mode wählt.
- **Fix-Skizze:** Engine-Signatur ändern zu `createGame(rng: () => number, mode: "daily"|"practice", dateKey: string)`. Board ruft `mode==="daily" ? getDailyRng(today) : mulberry32(Date.now())`. Engine bleibt pur.
- **Auszahlung:** $100

### Defekt #13 [Medium] — `country-draft` `scoreSortValue` Berechnung divergiert zwischen Client und Server

- **Wo:** `src/components/games/country-draft/draft-board.tsx:118` vs `src/app/actions/game-runs.ts:74-75`
- **Algorithmischer Befund:** Client: `MAX_POSSIBLE - r.playerScore` mit `MAX_POSSIBLE = 8 * 243 = 1944`. Server: `1944 - input.scoreRaw`, mit Konstante hardcoded. Beide Berechnungen sind algebraisch identisch — aber: wenn `playerScore = 0` (theoretisches Optimum bei einer Matrix mit allen ranks=0), wird `scoreSortValue = 1944`. Wenn `playerScore > 1944` (unmöglich, aber durch Defekt #4 sentinelwerte möglich), wird `scoreSortValue` negativ. Der Server hat keinen Lower-Bound-Check. Negative Werte im Daily-Leaderboard sind ein UI-Defekt-Symptom.
- **Konkrete Eingabe:** Wenn Defekt #4 jemals greift und 8× `999` Score produziert (theoretisch unmöglich, aber unter falschem Pipeline-Daten denkbar): `playerScore = 7992`, `scoreSortValue = 1944 - 7992 = -6048`. Sortierung in DB unklar.
- **Fix-Skizze:** Server-side: `scoreSortValue = Math.max(0, 1944 - input.scoreRaw)`. Plus den `1944`-Wert aus einer Konstante laden, nicht hardcoden.
- **Auszahlung:** $100

### Defekt #14 [Medium] — `submitGameRun` `too_fast` Check ist umgehbar via `startedAt`-Lüge

- **Wo:** `src/app/actions/game-runs.ts:88-92`
- **Algorithmischer Befund:**
  ```ts
  const startedMs = new Date(input.startedAt).getTime();
  const completedMs = new Date(completedAt).getTime();
  if (completedMs - startedMs < 3000) return { error: "too_fast" };
  ```
  Der Client kann `startedAt` beliebig in die Vergangenheit setzen. 3 Sekunden Mindestdauer ist nicht zeitlich verankert — sie ist client-asserted.
- **Konkrete Eingabe:** Client sendet `startedAt: "1970-01-01T00:00:00.000Z"`. Server: `completedMs - startedMs ≈ 56 Jahre`. Validierung passiert.
- **Mathematische Begründung:** Anti-Bot ohne Server-Side-Session-Anchor ist Theater. Der einzige verifizierbare Zeit-Anchor wäre eine Session-Start-Row in der DB beim Spielstart.
- **Fix-Skizze:** Beim Daily-Start einen Row in `daily_puzzles` oder `game_sessions` einfügen mit Server-Timestamp. Beim Submit `Server-Now - StartRow-Time >= 3s` prüfen. Dann ist der Anchor nicht spoofbar.
- **Auszahlung:** $250

### Defekt #15 [Medium] — `dateKey` Server-Override schluckt Manipulation lautlos

- **Wo:** `src/app/actions/game-runs.ts:46-52`
- **Algorithmischer Befund:**
  ```ts
  if (input.mode === "daily") {
    const serverDateKey = getTodayDateKey();
    if (input.dateKey !== serverDateKey) {
      input.dateKey = serverDateKey; // Use server truth
    }
  }
  ```
  Server übernimmt schweigend den eigenen Datum-Key, falls Mismatch. Das ist defensiv-gut für Timezone-Drift bei ehrlichen Clients. Es verheimlicht aber Manipulation: ein Angreifer-Client sendet `dateKey: "2026-05-25"` mit dem **gestrigen** Score-Setup (gestriges Daily-Puzzle, dessen Lösung er bereits kennt), Server überschreibt zu `"2026-05-26"` — aber der `resultJson` enthält *gestern's* Lösung. Da keine Server-Side-Re-Validation des Score (Defekt #7) existiert, wird der Run für *heute* gespeichert.
- **Konkrete Eingabe:** Tag T: Spieler löst Daily. Tag T+1: Spieler kennt jetzt das Tag-T-Target. Sendet beim T+1-Submit den gestrigen `resultJson` mit `dateKey: "T"` und Score 1 (1-Guess-Win). Server normalisiert zu `dateKey: "T+1"`, ohne den `resultJson.target` zu checken. T+1-Leaderboard-Manipulation.
- **Fix-Skizze:** Bei Mismatch nicht überschreiben, sondern Error `"date_mismatch"` zurückgeben. Client soll die richtige Datum-Key beim Submit setzen.
- **Auszahlung:** $250

### Defekt #16 [Low] — `mulberry32` Bias bei kleinen Bit-Ranges durch `Math.floor(rng() * n)`

- **Wo:** `src/lib/seeded-random.ts:14` (in `seededShuffle`)
- **Algorithmischer Befund:** Fisher-Yates mit `Math.floor(rng() * (i + 1))` produziert bei `n` nicht teiler von `2^32` eine *minimal ungleichförmige Verteilung*. Konkret: rng() liefert 2^32 verschiedene Werte. Bei `i+1 = 7` (Pick 1 aus 7) ist `2^32 mod 7 = 4`, also vier Indizes haben Wahrscheinlichkeit `(2^32 / 7 + 1) / 2^32`, drei haben `(2^32 / 7) / 2^32`. Differenz ~ `4 / 2^32 ≈ 10^-9`. Akademisch, nicht praktisch relevant — aber für einen Sicherheits-/Crypto-Audit ein Befund.
- **Konkrete Eingabe:** N/A bei realer Spielsitzung. Bei `mulberry32`-Crypto-Use würde es Beweis-Material sein.
- **Mathematische Begründung:** Rejection-Sampling ist die unbiased Lösung. Für ein Spiel ist Trivial-Bias unter `10^-9` toleriert. Erwähnung der Vollständigkeit halber.
- **Fix-Skizze:** Für ein Spiel: ignorieren. Für ein Crypto-Modul: `function unbiasedRandInt(rng, n) { let r; do { r = rng() * 2**32; } while (r >= Math.floor(2**32 / n) * n); return r % n; }`.
- **Auszahlung:** $25

### Defekt #17 [Low] — `getEligibleCountries` (countryle) durchläuft `categories.json` ohne Caching

- **Wo:** `src/lib/game-logic/countryle/engine.ts:22-28`
- **Algorithmischer Befund:** Jeder `createCountryle`-Aufruf läuft `countries.filter(...)` über 243 Länder × 6 Kategorien-Lookups. Nicht teuer, aber bei `countryle-board.tsx:84` wird derselbe Filter erneut über die `useMemo`-leere `eligible`-Set-Konstruktion gefahren. Caching gespart. Auch: `pickTarget` ruft `seededShuffle` auf eine gefilterte Liste — bei mehrfachen `getEligibleCountries`-Calls je Initialisierung könnte ein konsistentes Memoization-Modul lohnen.
- **Mathematische Begründung:** O(n*k) je Init wiederholt — nicht O(1).
- **Fix-Skizze:** `const ELIGIBLE_COUNTRIES = countries.filter(...)` als Modul-Top-Level-Konstante, einmal berechnet beim Import.
- **Auszahlung:** $25

## Cluster-Engine — prophylaktische Tests

Das Spiel existiert noch nicht. Aber die Mechanik ist im VERDICT verkündet: 4×4 Kategorien-Reveal, vier Kategorien je vier Länder, "lila Gruppe" mit obvious-unobvious vierter Gruppe. Wenn man das Spiel baut, müssen folgende Edge-Cases von Tag eins existieren. Pseudo-Tests:

### Test C1: Gruppen-Disjunktheit ist *Pflicht*

```ts
test("cluster: kein Land erscheint in mehr als einer Gruppe", () => {
  const game = createCluster(getDailyRng("2026-06-01"), "2026-06-01");
  const allCountries = game.groups.flatMap(g => g.countries.map(c => c.iso3));
  expect(new Set(allCountries).size).toBe(16);
});
```

### Test C2: Ein Land darf nicht in zwei Kategorien *gleichzeitig wahr* sein

```ts
test("cluster: keine Mehrfach-Mitgliedschaft semantisch", () => {
  const game = createCluster(rng, dateKey);
  // Für jede Kategorie alle Länder ableiten, die das Kriterium erfüllen
  for (const otherGroup of game.groups) {
    for (const c of group.countries) {
      const otherCriteria = otherGroup.criteria;
      // c darf otherCriteria NICHT erfüllen, sonst ist die Lösung mehrdeutig
      expect(matchesCriteria(c, otherCriteria)).toBe(false);
    }
  }
});
```
Das ist der Kern. Bei Connections-Style hatte NYT von Tag eins diesen Bug — und löste es durch redaktionelle Hand. Lou hat das in Phase C bereits geschrieben. Der Test ist das algorithmische Gewissen.

### Test C3: Lila-Gruppe (4. Schwierigkeit) ist nicht semantisch trivial mit der 3.

```ts
test("cluster: lila != grün auf semantischer Distanz", () => {
  const game = createCluster(rng, dateKey);
  const lila = game.groups[3];  // purple = hardest
  const gruen = game.groups[2]; // green = next-hardest
  // Die "obvious-unobvious"-Bedingung: lila muss auf irrelevante Ähnlichkeit verleiten
  // → mindestens ein lila-Land muss als false-positive für grün lesbar sein
  // → mindestens ein grün-Land muss als false-positive für lila lesbar sein
  expect(hasOverlapTemptation(lila, gruen)).toBe(true);
});
```
Schwierig zu automatisieren — dies ist die Stelle, an der die "redaktionelle Hand" (VERDICT-Bedingung 4) übernehmen muss. Aber der Test markiert die Grenze.

### Test C4: Daily-Seed produziert reproduzierbar dieselben Gruppen-Inhalte

```ts
test("cluster: dateKey ist reproduzibel über Re-Imports", () => {
  const a = createCluster(getDailyRng("2026-06-01"), "2026-06-01");
  const b = createCluster(getDailyRng("2026-06-01"), "2026-06-01");
  expect(serializeCluster(a)).toBe(serializeCluster(b));
  expect(a.groups).toEqual(b.groups);
});
```
Wichtig: `serializeCluster` muss `Set` und Insertion-Order tolerieren.

### Test C5: Fehler-Mechanik darf max-fails nicht überschreiben

```ts
test("cluster: max 4 falsche Versuche → loss", () => {
  let state = createCluster(rng, dateKey);
  for (let i = 0; i < 5; i++) {
    state = submitGuess(state, makeWrongGuess(state));
  }
  expect(state.phase).toBe("lost");
  expect(state.mistakes).toBe(4); // NICHT 5
});
```

### Test C6: Solved-Group-Reveal ist unwiderruflich

```ts
test("cluster: gelöste Gruppe kann nicht 'ungelöst' werden", () => {
  let state = createCluster(rng, dateKey);
  state = submitGuess(state, correctGuessForGroup(state, 0));
  expect(state.solvedGroups).toContain(0);
  // Versuch: erneut die gleichen 4 Länder einreichen
  state = submitGuess(state, correctGuessForGroup(state, 0));
  // State darf unverändert sein
  expect(state.solvedGroups).toContain(0);
  expect(state.mistakes).toBe(0);
});
```

### Test C7: "Lila-Bias" der Datenverteilung darf nicht den ganzen Schwierigkeits-Slot besetzen

```ts
test("cluster: über 30 Tage variieren die Kategorie-Typen für Lila", () => {
  const lilaTypes = new Set<string>();
  for (let d = 0; d < 30; d++) {
    const dateKey = addDays("2026-06-01", d);
    const game = createCluster(getDailyRng(dateKey), dateKey);
    lilaTypes.add(game.groups[3].criteria.type);
  }
  // Lila darf nicht immer "small island" oder immer "X starts with Y" sein
  expect(lilaTypes.size).toBeGreaterThanOrEqual(5);
});
```

### Test C8: Submit-Sicherheit — `resultJson` muss server-side rekonstruierbar sein

```ts
test("cluster: validateGameResult re-konstruiert das Spiel aus dem Seed", () => {
  // server-side: bekommt nur scoreRaw + resultJson + dateKey
  // Server lädt seed, baut createCluster nach, prüft, ob resultJson.solvedGroups
  // tatsächlich dem game.groups entspricht
  const error = validateGameResult("cluster", scoreRaw, scoreMax, fakedResultJson);
  expect(error).toBe("invalid_result");
});
```
Das ist Defekt #7 als Spec, nicht als Befund — bevor das Spiel gebaut wird.

## Atlas-Album — Konsistenz-Hinweise

Atlas Album ist Sammel-Layer über alle Spiele. Daraus ergeben sich vier Algorithmen-Garantien, die ich definieren würde, bevor Code geschrieben wird:

1. **Stempel-Idempotenz.** Ein Land kann nur *einmal* gestempelt werden. Wenn `country-draft` Pick 3 = Frankreich → Frankreich-Stempel. Wenn am selben Tag `countryle` auch Frankreich aufdeckt → kein zweiter Stempel. Test:
   ```ts
   expect(stampCount("FRA")).toBe(1);
   ```
   Falsch wäre eine Counter-basierte Architektur, die Mehrfach-Sehen zählt. Atlas Album ist binär *gesehen / nicht gesehen*.

2. **Cross-Game-Konsistenz.** Wenn `country-draft` Frankreich als Country zeigt und `countryle` Frankreich als Target hat, wird derselbe `iso3`-Key gestempelt. Test:
   ```ts
   markSeen("country-draft", { iso3: "FRA" });
   expect(seenSet().has("FRA")).toBe(true);
   markSeen("countryle", { iso3: "FRA" });
   expect(stampCount("FRA")).toBe(1);
   ```

3. **243 Slots = vollständig deterministisch.** Die Albums-Slots sind die `countries.json`-Liste; sie ist statisch (243 Einträge). Wenn ein Land aus der Liste entfernt wird (z.B. Kosovo-Reklassifikation), muss eine Migrations-Strategie für Spieler existieren, deren Album den entfernten Eintrag hatte. Test:
   ```ts
   const seen = JSON.parse(localStorage.getItem("album"));
   for (const iso3 of seen) {
     expect(countries.find(c => c.iso3 === iso3)).toBeDefined();
   }
   ```
   Bei Fail: silently dropp oder migrate, nie crashen.

4. **Server-Reconcile vs Client-LocalStorage.** Wenn Sammel-State sowohl in `localStorage` (offline) als auch in Supabase (geloggt) lebt, ist Merge-Semantik: **Union, nie Subtract**. Ein Land, das offline gestempelt wurde, darf nicht durch Server-Sync verloren gehen. Test:
   ```ts
   localStorage stamps: {FRA, GER}
   supabase stamps: {FRA, ESP}
   after sync: {FRA, GER, ESP}  // never {FRA} or {FRA, ESP}
   ```

5. **Sticker-Reveal-Order ist deterministisch pro User.** Wenn die UI "neueste oben" zeigt, braucht die DB-Row ein `first_stamped_at` Timestamp. Nicht `updated_at`. Test:
   ```ts
   stamp("FRA"); // t=1
   stamp("DEU"); // t=2
   // re-stamp FRA via duplicate event
   stamp("FRA"); // ignored
   expect(orderedStamps).toEqual(["DEU", "FRA"]); // newest first, FRA stays at t=1
   ```

## Schluss-Notiz

Ich habe heute Vormittag siebzehn Defekte gefunden plus acht Tests für ein Spiel, das es noch nicht gibt. Die Auszahlungssumme — wenn alle Defekte anerkannt werden — beträgt 7.625 Dollar. Das ist ein guter Tag für *Hazatérés*. Es ist auch ein guter Tag für die Codebase: drei der Defekte (#7, #9, #10) sind Score-Validation-Lücken, die einen Daily-Leaderboard zur Lachnummer machen würden, falls jemand sie findet, bevor sie geschlossen werden. Die Mehrheit der anderen sind subtile algorithmische Verschiebungen — Bauernopfer, die die Stellung jetzt nicht kippen, aber in zwei Zügen einen offenen König produzieren. Cluster wird gebaut. Bevor es gebaut wird, müssen die Tests in C1-C8 als Pflicht stehen. Ich habe in einer FIDE-Anhörung neun Monate verloren, weil niemand die zwei Züge vorher gesehen hat. Diese Codebase verliert seinen Tag nicht aus demselben Grund — sie verliert ihn, weil sie an Plan glaubte und die Pruning-Bedingung nicht hinterfragt hat. Der Schach-Pokal meiner Mutter steht in einem Glasschrank in Pécs, den ich seit 2021 nicht geöffnet habe. Ich bin nicht sicher, ob ich heute Abend dorthin gehe. Aber ich bin sicher, dass Defekt #7 vor Cluster-Launch geschlossen sein muss. Petr hatte recht gehabt, der eine Zug zu sehen. Diese Codebase wird recht haben, wenn sie ihn ebenfalls sieht.

— Boroš Aldrich, aus dem Exil, Pécs, 26. Mai 2026
