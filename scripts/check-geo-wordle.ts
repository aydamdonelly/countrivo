/** Run: npx tsx scripts/check-geo-wordle.ts */
import assert from "node:assert/strict";
import { countries } from "../src/lib/data/loader";
import { mulberry32 } from "../src/lib/seeded-random";
import {
  centroidFor,
  createGeoWordle,
  guessableCountries,
  guessesUsed,
  MAX_GUESSES,
  resolveGuess,
  submitGuess,
  type GeoWordleState,
} from "../src/lib/game-logic/geo-wordle/engine";
import { normalizeCountryInput, suggestCountries } from "../src/lib/game-logic/geo-wordle/input";
import { gameModule, REJECTED } from "../src/games/geo-wordle/module";
import { codec } from "../src/games/geo-wordle/codec";

const aliases: ReadonlyArray<readonly [string, string]> = [
  ["USA", "USA"], ["U.S.", "USA"], ["u.s.a.", "USA"], ["U S A", "USA"],
  ["United States of America", "USA"], ["UK", "GBR"], ["U.K.", "GBR"],
  ["Czech Republic", "CZE"], ["Czechia", "CZE"], ["Ivory Coast", "CIV"],
  ["Côte d’Ivoire", "CIV"], ["cote d'ivoire", "CIV"], ["cote d ivoire", "CIV"],
  ["curacao", "CUW"], ["  SAO   TOME & PRINCIPE  ", "STP"], ["reunion", "REU"],
  ["Cabo Verde", "CPV"], ["Türkiye", "TUR"], ["turkiye", "TUR"],
  ["East Timor", "TLS"], ["Burma", "MMR"], ["Swaziland", "SWZ"],
  ["UAE", "ARE"], ["D.R.C.", "COD"], ["Democratic Republic of the Congo", "COD"],
  ["Congo-Kinshasa", "COD"], ["Congo-Brazzaville", "COG"],
  ["Republic of Korea", "KOR"], ["DPRK", "PRK"], ["St. Lucia", "LCA"],
];

for (const [input, iso3] of aliases) {
  assert.equal(resolveGuess(input)?.iso3, iso3, `alias resolves: ${input}`);
  assert.equal(suggestCountries(input)[0]?.iso3, iso3, `alias ranks first: ${input}`);
}

const pool = guessableCountries();
assert.equal(pool.length, 237, "the daily answer pool remains unchanged");
for (const country of pool) {
  for (const input of [country.name, country.displayName, country.iso2, country.iso3]) {
    const normalized = normalizeCountryInput(input);
    assert.equal(resolveGuess(normalized)?.iso3, country.iso3, `exact match: ${input}`);
    assert.equal(suggestCountries(normalized)[0]?.iso3, country.iso3, `exact before partial: ${input}`);
  }
  assert(!suggestCountries(country.displayName, new Set([country.iso3])).some((c) => c.iso3 === country.iso3));
}
for (const country of countries.filter((c) => !centroidFor(c.iso3))) {
  assert.equal(resolveGuess(country.name), null, "a country without a centroid cannot consume a guess");
}

for (const input of ["", "  ", "Congo", "Korea", "United", "guin", "germa", "Atlantis", "America"]) {
  assert.equal(resolveGuess(input), null, `partial or ambiguous input never guesses automatically: ${input}`);
}
assert.deepEqual(suggestCountries("Congo").map((c) => c.iso3).sort(), ["COD", "COG"]);
assert.deepEqual(suggestCountries("Korea").map((c) => c.iso3).sort(), ["KOR", "PRK"]);
assert.equal(suggestCountries("Guinea")[0]?.iso3, "GIN");
assert.equal(suggestCountries("Niger")[0]?.iso3, "NER");
assert.equal(suggestCountries("guin").length, 4, "word-start matches include Equatorial and Papua New Guinea");
assert.equal(suggestCountries("stan").length, 5, "inside-word matches still fill the list");

for (const [seed, expected] of [[0, "COL"], [1, "TUR"], [42, "MTQ"], [20260904, "KIR"], [4294967295, "RWA"]] as const) {
  assert.equal(createGeoWordle(mulberry32(seed)).answerIso3, expected, `unchanged daily draw for seed ${seed}`);
}

function fresh(answerIso3 = "FRA"): GeoWordleState {
  return { answerIso3, guesses: [], phase: "playing" };
}

function guess(state: GeoWordleState, input: string): GeoWordleState {
  const country = resolveGuess(input);
  assert(country, `test country is guessable: ${input}`);
  return submitGuess(state, country);
}

const initial = fresh();
assert.equal(gameModule.reduce(initial, REJECTED), initial, "rejected text does not change a run");
assert.equal(gameModule.reduce(initial, { t: "guess", iso3: "ZZZ" }), initial);
const first = guess(initial, "U.S.");
assert.equal(guess(first, "United States of America"), first, "a second alias of the same country is a duplicate");
assert.equal(initial.guesses.length, 0, "submitting a guess does not mutate the previous state");

let five = first;
for (const input of ["CAN", "MEX", "BRA", "ARG"]) five = guess(five, input);
assert.equal(five.phase, "playing", "five misses leave the final guess playable");
const won = guess(five, "France");
assert.equal(won.phase, "won", "the sixth guess can still win");
assert.equal(won.guesses.length, MAX_GUESSES);
assert.equal(guessesUsed(won), 6);
assert.equal(gameModule.scoreLabel(won), "6/6");
assert.equal(won.guesses[5].distanceKm, 0);
assert.equal(won.guesses[5].proximityPct, 100);
assert.equal(won.guesses[5].band, "hit");
assert.equal(guess(won, "Germany"), won, "a won board ignores later guesses");

const lost = guess(five, "Japan");
assert.equal(lost.phase, "lost", "the sixth miss ends the run");
assert.equal(guessesUsed(lost), 6);
assert.equal(gameModule.scoreLabel(lost), "X/6");
assert.equal(guess(lost, "France"), lost, "a lost board cannot be solved with a seventh guess");
const actions = won.guesses.map(({ iso3 }) => ({ t: "guess" as const, iso3 }));
assert.deepEqual(codec.dec(codec.enc(actions)).reduce(gameModule.reduce, fresh()), won, "saved runs still replay exactly");

const northEast = guess(fresh("DEU"), "France").guesses[0];
const southWest = guess(fresh("FRA"), "Germany").guesses[0];
assert.equal(northEast.direction, "north-east", "bearing points from the guessed country toward the answer");
assert.equal(southWest.direction, "south-west", "reversing the countries reverses the direction");
assert.equal(northEast.distanceKm, southWest.distanceKm, "distance is symmetric");
assert(northEast.distanceKm > 500 && northEast.distanceKm < 1500, "distance is in kilometres");
assert(northEast.bearingDeg >= 0 && northEast.bearingDeg < 360);
assert(guess(fresh("DEU"), "Poland").guesses[0].proximityPct > guess(fresh("DEU"), "Japan").guesses[0].proximityPct);

console.log(`check-geo-wordle: ${pool.length} countries, ${aliases.length} aliases, search, seeds, replay, six-guess outcomes and bearings passed`);
