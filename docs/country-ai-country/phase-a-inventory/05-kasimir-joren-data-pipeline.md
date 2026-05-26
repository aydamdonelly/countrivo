# 05 · Kasimir Joren · Pipeline · Datenfluss-Bericht

> Vesi leiab alati tee. Das Wasser hier sucht sich seinen Weg — über drei
> Loader, sieben JSON-Dateien, dreiundzwanzig Engines. An ein paar Stellen
> tropft es neben die Rinne. Linda hätte es sofort gehört.

## Quelle

Die Pipeline beginnt extern. Zwei Quellen, ein Skript.

- **REST Countries v3.1** — `https://restcountries.com/v3.1/all?fields=cca2,cca3,name,region,subregion,capital,borders,flag,area,population`
  Liefert das Skelett: ISO-Codes, Namen, Region, Subregion, Hauptstadt, Nachbarn, Fläche, Bevölkerung, Flag-Emoji.
- **World Bank Indicators API** — `https://api.worldbank.org/v2/country/all/indicator/{INDICATOR}?date=YEAR&format=json&per_page=1000`
  Liefert 20 Stat-Indikatoren (siehe Skript). Versucht 2023 → 2019 rückwärts, nimmt den ersten Treffer.
  Aggregat-Codes (EU, OECD, „Arab World" …) werden über eine harte Blacklist (`WB_AGGREGATES`, 31 Einträge) gefiltert, damit "Europäische Union" nicht plötzlich Top-Rank in Population landet.

Eine dritte Quelle ist im Skript versteckt und nicht eingebettet, sondern hartkodiert:

- **UNWTO Tourism Override** — `tourismOverrides` (50 Länder, `fetch-country-data.ts:251–262`).
  Begründung im Kommentar: World Bank `ST.INT.ARVL` mischt Übernachtungen und Grenzüberschreitungen, also wird der Indikator nach dem Fetch überschrieben.
- **Niche Stats (curated, hartkodiert)** — `beerConsumption` (68), `coffeeConsumption` (68), `wineConsumption` (60), Quellen: Kirin Holdings/WHO, ICO, OIV. `fetch-country-data.ts:269–313`.

Es gibt keine API-Keys, keine `.env`-Werte, keine Schlüssel in den Quellen. Reine öffentliche APIs.

## Skripte

`scripts/` enthält drei Dateien. Zwei für die Datenpipeline, eine für SEO.

| Skript | Zeilen | Liest | Schreibt |
|---|---|---|---|
| `fetch-country-data.ts` | 351 | REST Countries API, World Bank API, hartkodierte Overrides | `countries.json`, `stats.json`, `borders.json`, `capitals.json` |
| `compute-ranks.ts` | 65 | `stats.json`, `categories.json` | `ranks.json` |
| `submit-indexnow.ts` | 92 | `countries.json`, `categories.json`, `game-registry.json` | (Bing IndexNow API, kein File-Output) |

Die Ausführungsreihenfolge ist nicht dokumentiert, aber implizit zwingend:

```
fetch-country-data.ts   →   compute-ranks.ts   →   submit-indexnow.ts (optional, SEO)
```

`compute-ranks.ts` ist abhängig von `stats.json` UND `categories.json`. Wenn jemand `categories.json` von Hand erweitert, ohne `compute-ranks.ts` erneut zu laufen, werden Ranks und Kategorien auseinanderlaufen.

Keine package.json-Scripts vorhanden (`npm run` deckt sie nicht ab). Aufruf muss manuell sein: `npx tsx scripts/fetch-country-data.ts` etc.

**Was fehlt:**

- Kein Skript für `categories.json` — wird komplett von Hand gepflegt. Auch das `coveragePercent` ist von Hand eingetragen und driftet (siehe „Lücken").
- Kein Skript für `game-registry.json` — von Hand gepflegt.
- Kein Skript für `ranks.json`-Validierung gegen `stats.json`: wenn `stats` neu ist und `compute-ranks` nicht läuft, friert `ranks.json` ein und referenziert tote Slugs.

## Bestände

`src/data/` — sieben JSON-Dateien, alle 243-zentriert.

| Datei | Bytes | Rows | Struktur | Schema-Skizze |
|---|---:|---:|---|---|
| `countries.json` | 88 058 | **243** | Array<Country> | `{iso2,iso3,name,displayName,slug,region,subregion,continent,flagEmoji,flagSvgPath,capital,borders[]}` |
| `categories.json` | 6 673 | 21 | Array<Category> | `{slug,label,shortLabel,unit,description,direction,source,sourceYear,coveragePercent,emoji}` |
| `stats.json` | 148 036 | 243 | `Record<iso3, Record<slug, number\|null>>` | flach, alle Werte unverschachtelt |
| `ranks.json` | 111 487 | 243 | `Record<iso3, Record<slug, number>>` | 1 = höchster Wert, gleiche Werte = gleicher Rank (`compute-ranks.ts:46–53`) |
| `borders.json` | 10 617 | 243 | `Record<iso3, string[]>` | Nachbarn als iso3-Liste; 79 Einträge leer |
| `capitals.json` | 5 146 | 243 | `Record<iso3, string>` | **Vollständig identisch mit `countries.json.capital`** — null Mismatches |
| `game-registry.json` | 7 303 | **15** | Array<GameMeta> | `{slug,title,shortDescription,description,emoji,difficulty,estimatedTime,category,isNew,isFlagship,availableModes[],route}` |

Drei Auffälligkeiten:

1. **15 Spiele in Registry**, aber `CLAUDE.md` sagt `14 games` und `layout.tsx` SEO-Text wirft mit „14 free geography games" um sich. Stille Drift. Die Spiele: `country-draft, flag-quiz, higher-or-lower, capital-match, population-sort, country-streak, border-buddies, continent-sprint, stat-guesser, speed-flags, odd-one-out, supremacy, borderline, blitz, countryle`. Tatsächlich 15.
2. **`capitals.json` ist redundant**. Jedes Country in `countries.json` hat das Feld `capital` mit exakt demselben Wert. Geschrieben vom selben Skript, beide Quellen sind synchron, aber halt doppelt.
3. **`surface-area` Stat ist verwaist**. 215 Länder haben den Wert in `stats.json`, aber keine Kategorie in `categories.json`. `compute-ranks.ts` sortiert ihn deswegen nicht — er existiert in `stats.json`, aber niemand kann ihn ranken.

### Coverage-Drift in `categories.json`

Die deklarierten `coveragePercent`-Werte sind systematisch zu optimistisch:

| Slug | declared | actual | drift |
|---|---:|---:|---:|
| military-spending-pct | 80% | 63% | -17 |
| wine-consumption-per-capita | 35% | 23% | -12 |
| internet-users-pct | 90% | 79% | -11 |
| unemployment-rate | 88% | 77% | -11 |
| beer-consumption-per-capita | 40% | 29% | -11 |
| coffee-consumption-per-capita | 35% | 24% | -11 |
| inflation-rate | 85% | 76% | -9 |
| life-expectancy | 95% | 89% | -6 |
| (… plus 7 weitere, alle negativ …) | | | |

**Kein einziger Slug ist unter-deklariert.** Das ist menschlich gepflegt, optimistisch geschätzt, und es gibt kein Skript, das das überprüft. Die Werte werden in der UI nicht prominent angezeigt — aber sobald jemand auf Basis dieser Zahlen Filter baut („zeige nur Kategorien mit ≥ 80% Coverage"), schlägt der Filter fehl.

### Länderfeld-Lücken

In `countries.json`:

- `MAC` (Macau) ohne `capital`. Einziger Fall.
- 79 Länder ohne `borders` — Inseln und Inselstaaten, aufgeschlüsselt:
  - Americas: 28 (Karibik)
  - Oceania: 26 (Pazifik)
  - Europe: 9 (Island, Malta, Zypern, Britische Inseln …)
  - Africa: 9 (Madagaskar, Komoren, Cabo Verde …)
  - Asia: 7

Das sind echte Lücken — keine Datenfehler. Aber die Border-Spiele (`border-buddies`, `borderline`) müssen das wissen: 32% der Länder sind unspielbar in border-zentrierten Modi.

## Loader

`src/lib/data/` enthält fünf Dateien, gemeinsam 4 588 Bytes.

```
loader.ts       — eager imports + lazy async (countries, categories, gameRegistry, getRanks, getStats)
countries.ts    — getAllCountries / getCountryByIso3 / getCountryBySlug / getCountriesByRegion / getCountriesByContinent
categories.ts   — getAllCategories / getCategoryBySlug
games.ts        — getAllGames / getGameBySlug / getFlagshipGame
ranks.ts        — getRank / getRanksForCountry / getStatValue / getTopCountries
```

`loader.ts` ist die offizielle Schicht. `countries.json`, `categories.json`, `game-registry.json` werden eager importiert (klein genug, Bundler legt sie ein). `ranks.json` und `stats.json` sollen laut Kommentar `// These are loaded dynamically since they're large` lazy geladen werden:

```ts
let _ranks: Record<string, Record<string, number>> | null = null;
export async function getRanks(): Promise<Record<...>> {
  if (!_ranks) _ranks = (await import("@/data/ranks.json")).default;
  return _ranks!;
}
```

**Aber: `getRanks()` und `getStats()` werden in der gesamten Codebase nicht aufgerufen.** Stale code. Der Lazy-Pfad existiert auf dem Papier, niemand benutzt ihn.

Der reale Pfad geht über `ranks.ts`:

```ts
import ranksData from "@/data/ranks.json";    // eager
import statsData from "@/data/stats.json";    // eager
```

Damit landen `ranks.json` (111 KB) und `stats.json` (148 KB) ohnehin im Bundle. Die Lazy-Funktion in `loader.ts` ist Theater. Linda hätte gesagt: das ist eine Rinne, die nirgendwo hinführt.

## Konsum

Wer importiert woher? 17 Engines + 1 Page + 1 Component ziehen aus `src/data/`.

**Sauber über `@/lib/data/loader`** (countries / categories): 17 Stellen — alle Engines plus Profile-Edit-Form, Border-Board, Continent-Sprint, Countryle-Board.

**Sauber über `@/lib/data/ranks`** (getStatValue / getTopCountries / getRanksForCountry): 11 Listen-Pages + 1 Country-Detail-Page.

**Direktimport JSON (Loader-Bypass)** — 12 Stellen:

| Datei | Importiert | Kategorie |
|---|---|---|
| `src/app/countries/[slug]/page.tsx:16` | `@/data/borders.json` | **Page-Bypass** |
| `src/components/games/population-sort/sort-board.tsx:20` | `@/data/stats.json` | **Component-Bypass** (UI-Layer!) |
| `src/lib/game-logic/stat-guesser/engine.ts:2` | `@/data/stats.json` | Engine-Bypass |
| `src/lib/game-logic/supremacy/engine.ts:2` | `@/data/stats.json` | Engine-Bypass |
| `src/lib/game-logic/border-buddies/engine.ts:2` | `@/data/borders.json` | Engine-Bypass |
| `src/lib/game-logic/higher-or-lower/engine.ts:2-3` | `ranks.json` + `stats.json` | Engine-Bypass |
| `src/lib/game-logic/population-sort/engine.ts:2` | `@/data/stats.json` | Engine-Bypass |
| `src/lib/game-logic/borderline/engine.ts:1` | `@/data/borders.json` | Engine-Bypass |
| `src/lib/game-logic/country-draft/generator.ts:2` | `@/data/ranks.json` | Engine-Bypass |
| `src/lib/game-logic/capital-match/engine.ts:2` | `@/data/capitals.json` | Engine-Bypass |
| `src/lib/game-logic/countryle/engine.ts:2` | `@/data/stats.json` | Engine-Bypass |
| `src/lib/data/ranks.ts:1-2` | `ranks.json` + `stats.json` | **Loader selbst** (genehmigt) |

Die Architektur-Regel sagt (`.claude/rules/architecture.md`):

> Never import JSON directly in components — use the loader

Es gibt also formale Verletzungen — aber sie sind systemisch, nicht versehentlich. Für `stats`, `ranks`, `borders`, `capitals` existiert **kein einziger benannter Getter im Loader, der nicht ranks-getter wäre**. Engines müssen direkt importieren, weil `loader.ts` für `borders` und `capitals` gar keine API anbietet. Die Component-Verletzung in `population-sort/sort-board.tsx:20` ist die einzige echte UI-Bypass — und sie würde mit einem ordentlichen Getter im Loader (`getStatBySlug(iso3, slug)`) verschwinden.

Der `ranks.ts`-Loader ist halb gemacht: er hat Getter für stats und ranks, aber Engines nutzen ihn nicht, weil sie über die ganzen Maps brauchen, nicht punktuelle Lookups.

## Daily-Seed

`src/lib/daily-seed.ts` — 43 Zeilen, vier Funktionen.

```
getTodayDateKey()           → "YYYY-MM-DD" in Europe/Berlin (toLocaleDateString en-CA)
dateSeed(dateKey)           → 32-bit hash via String-Walk
getDailyRng(dateKey)        → mulberry32(dateSeed(dateKey))
msUntilReset()              → ms bis 00:00 Europe/Berlin (Date-Roundtrip)
formatTimeUntilReset(ms)    → "3h 42m" oder "42m"
```

`mulberry32` ist eine 32-bit Xorshift-Variante in `src/lib/seeded-random.ts` mit zwei Helfern: `seededShuffle` (Fisher-Yates) und `seededPick` (shuffle + slice). Solide.

**Datum → Puzzle:**

- Berlin-Zeit als Single Source of Truth. Alle Spieler weltweit kriegen dasselbe „Heute".
- `dateSeed("2026-05-26") = 1928…` (deterministischer Hash).
- `mulberry32(seed)` ist eine reine Funktion. Gleicher Seed → identischer RNG-Stream.
- Server (`src/app/actions/game-runs.ts:97`) bildet `seed = dateSeed(input.dateKey + input.gameSlug)` — pro Spiel ein anderer Seed am selben Tag. Verhindert, dass alle Spiele am selben Tag dieselbe RNG-Sequenz teilen.

**Wo's konsumiert wird:** mindestens 30 Stellen. Pages, Server-Actions, Boards, Hooks, Headers, Daily-Hero, Lockout-Guards. Praktisch jedes Daily-Game.

**Subtile Schwäche:** `getTodayDateKey()` benutzt `Date.now()` + `toLocaleDateString`. Auf einem Client mit verstellter Systemuhr (oder zwischen ~23:59 und 00:01 Berlin durch Netzwerk-Latenz) kann der Client einen anderen `dateKey` halten als der Server. Server-Action `submitGameRun` validiert das (`game-runs.ts:48`): wenn `input.dateKey !== serverDateKey`, wird der Run abgelehnt oder umgeleitet. Das ist die richtige Bremse — aber der Browser kann währenddessen eine Animation für gestern abspielen, die niemand mehr submitten kann.

## Lücken

Wo das Wasser hängenbleibt:

1. **Loader-API ist halb gebaut.**
   `loader.ts` exportiert `getRanks()`/`getStats()` async — niemand benutzt sie. `ranks.ts` exportiert punktuelle Getter — Engines benutzen sie nicht, sondern importieren die ganzen Maps direkt. Resultat: drei parallele Wege, keiner kanonisch.

   **Fix:** `loader.ts` sollte synchron-eager auch `borders`, `capitals`, `stats`, `ranks` typed exportieren, oder `ranks.ts` zur kanonischen API erklären und Engines refactoren. Heute ist beides halb.

2. **`capitals.json` ist tot.** Identisch zu `countries.json.capital`. Nur `capital-match/engine.ts:2` importiert ihn — könnte auf `country.capital` umgestellt werden. Datei kann weg.

3. **`surface-area` Stat ist verwaist.** 215 Werte in `stats.json`, keine Category, kein Rank, kein Spiel kann es nutzen. Entweder Category dafür anlegen (Sourcing-Kommentar im Skript ergänzt das mit `AG.SRF.TOTL.K2`) oder Stat löschen.

4. **`coveragePercent` driftet.** Bis -17 Punkte zu optimistisch. Kein Validierungs-Skript. Wenn dieses Feld irgendwo in der UI live wäre, würden Nutzer falsch informiert.

5. **`compute-ranks.ts` ist nicht idempotent gegen Schema-Änderungen.** Wenn jemand eine Category umbenennt (`gdp-per-capita` → `wealth-per-capita`), muss `stats.json` und `ranks.json` neu generiert werden. Keine Schema-Migrationen.

6. **`fetch-country-data.ts` hat keinen Fail-Fast.** Wenn World Bank für einen Indikator alle fünf Jahre ablehnt, läuft das Skript weiter mit `// Skip failed years` und schreibt ein silently-incomplete `stats.json`. Validierung am Ende prüft nur Top-10-Plausibilität, nicht Coverage-Untergrenzen.

7. **`game-registry.json` hat `versus`-Modi**, aber `GameMeta.availableModes` ist typisiert als `("daily"|"practice"|"archive"|"custom")[]`. Das ist Type-Drift. `versus` wird in Pages/Boards real benutzt (`game-runs.ts:11`, board-components), aber im Type-System abwesend. Die JSON-Casts in `loader.ts` (`as GameMeta[]`) verschlucken den Mismatch.

8. **Drift „14 vs 15 Spiele".** `CLAUDE.md` und `layout.tsx`-SEO-Texte sagen 14. Registry hat 15 (`countryle` ist der jüngste, vermutlich nach dem SEO-Text dazugekommen).

9. **Borders-Daten:** 79 Länder ohne Nachbarn — meist legitim (Inseln). Aber kein Skript validiert die Spielbarkeit für `border-buddies`/`borderline`. Wenn der Daily-Seed an einem Tag eine Insel als Target wählt, fällt das Spiel um — Engine müsste Insel-Targets ausschließen. Lohnt Spot-Check.

10. **Keine Tests.** Kein `*.test.ts` für die Pipeline. `npx tsx scripts/...` läuft, kein Sicherheitsnetz für „was wäre wenn World Bank umzieht".

## Schluss

Die Rinne läuft. Sie läuft sogar mit Würde: ein Skript ruft zwei APIs, ein zweites Skript baut Ranks daraus, ein Loader stellt typisierte Maps bereit, Engines konsumieren mit seeded RNG, Berlin-Zeit synchronisiert die Welt.

Wo es tropft: am Loader, der halb leer ist; an `capitals.json`, die niemand braucht; an `surface-area`, das niemand kennt; an `coveragePercent`, das niemand prüft; an dem 15. Spiel, das niemand zählt; an `versus`-Modus, den niemand typisiert hat.

Linda hätte gesagt: „Vesi leiab alati tee — aga sina pead aitama." Das Wasser findet seinen Weg, aber du musst helfen. Hier helfen heißt: `loader.ts` zur einzigen API erheben, `capitals.json` schlachten, `surface-area` entscheiden, `coveragePercent` ein Skript verpassen, und den Type für `GameMode` um `"versus"` ergänzen. Eine halbe Stunde Arbeit. Die Pipeline würde dann nicht mehr nur funktionieren — sie würde zuhören.

Bericht-Pfad: `/Users/adamkahirov/Desktop/code/countrivo/docs/country-ai-country/phase-a-inventory/05-kasimir-joren-data-pipeline.md`
