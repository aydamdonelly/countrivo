import { dateSeed } from "../src/lib/daily-seed";
import { createGame, appoint, openCountry, nextRound, scoreState, appointmentsOf, countryAt } from "../src/lib/game-logic/country-draft/engine";
import { draftReviewView, draftView } from "../src/lib/game-logic/country-draft/public-view";
import { fameOf, figureFit } from "../src/lib/game-logic/country-draft/scoring";
import { validateCountryDraftResult } from "../src/lib/game-logic/country-draft/server-validate";
import { gameModule, type CountryDraftAction } from "../src/games/country-draft/module";
import { codec } from "../src/games/country-draft/codec";
import { poolIndex, seatIndex } from "../src/lib/game-logic/country-draft/types";
import { fillOrder } from "../src/lib/game-logic/country-draft/fill-order";
import { POOL } from "../src/lib/game-logic/country-draft/roster";
import { MAX_SCORE } from "../src/lib/game-logic/country-draft/tables";
import { draftCareerRecord } from "../src/lib/data/loader";
import { careerRatings } from "../src/lib/game-logic/country-draft/career-ratings";
import { applyCareerEvidence } from "../src/lib/game-logic/country-draft/career-evidence";

let checks = 0;
let failures = 0;
function check(condition: boolean, message: string) { checks += 1; if (!condition) { failures += 1; console.error(`FAIL ${message}`); } }
const ceilings: number[] = [];
for (let day = 0; day < 120; day += 1) {
  const dateKey = new Date(Date.UTC(2026, 9, 13 + day)).toISOString().slice(0, 10);
  const seed = dateSeed(dateKey);
  let state = createGame(seed);
  const board = state.board;
  const countries = board.rounds.flatMap((round) => round.countries);
  check(board.rounds.length === 5, `${dateKey} five rounds`);
  check(countries.length === 15 && new Set(countries.map((c) => c.iso3)).size === 15, `${dateKey} fifteen distinct countries`);
  for (const round of board.rounds) {
    check(round.countries.length === 3, `${dateKey} three countries per round`);
    check(new Set(round.countries.map((c) => c.region)).size >= 2, `${dateKey} countries cross world regions`);
    for (const country of round.countries) {
      check(country.pool.length === 3 && country.pool.every((p) => p.portrait), `${dateKey} three portrait-ready people`);
      check(new Set(country.pool.map((p) => p.archetype)).size === 3, `${dateKey} three different career types`);
    }
  }
  check(JSON.stringify(createGame(seed)) === JSON.stringify(state), `${dateKey} same seed, same full board`);
  const initial = draftView(state);
  check(initial.people.length === 0 && initial.countries.length === 3, `${dateKey} unopened people absent`);
  check(initial.nextView === undefined, `${dateKey} country selection does not expose later rounds`);
  check(!JSON.stringify(initial).includes('"ceiling"') && !JSON.stringify(initial).includes('"standing"') && !JSON.stringify(initial).includes('"archetype"'), `${dateKey} public state has no solution fields`);
  check(appoint(state, 0, 0) === state, `${dateKey} cannot seat before opening country`);
  const log: CountryDraftAction[] = [];
  for (const best of board.best) {
    state = openCountry(state, best.countryIdx); log.push({ t: "open", c: best.countryIdx });
    const opened = draftView(state);
    check(opened.people.length === 3 && opened.countries.length === 0, `${dateKey} opened country exposes only its own people`);
    check(opened.nextView === undefined, `${dateKey} uncommitted people do not expose the next country selection`);
    check(openCountry(state, poolIndex((best.countryIdx + 1) % 3) ?? 0) === state, `${dateKey} country cannot change after opening`);
    check(opened.people.every((person) => !('fit' in person) && !('standing' in person) && !('archetype' in person) && !('note' in person)), `${dateKey} candidates have no score hints`);
    check(opened.people.every((person) => person.identity === "Public figure" || person.identity === "Historical figure"), `${dateKey} person details cannot reveal a hidden career category`);
    state = appoint(state, best.poolIdx, best.seat); log.push({ t: "appoint", i: best.poolIdx, s: best.seat });
    check(state.phase === "seated", `${dateKey} reveal waits for explicit next`);
    check(appoint(state, best.poolIdx, best.seat) === state, `${dateKey} cannot change an appointment after reveal`);
    check(draftView(state).seats[best.seat]?.points === best.points, `${dateKey} points revealed after seating`);
    const reveal = draftView(state);
    if (state.round < 4) {
      check(reveal.nextView?.phase === "country" && reveal.nextView.round === state.round + 1, `${dateKey} revealed appointment preloads exactly one next country choice`);
      check(reveal.nextView?.people.length === 0 && reveal.nextView.country === null && reveal.nextView.review === null && reveal.nextView.nextView === undefined, `${dateKey} preview contains no unopened people, review or later preview`);
      check(reveal.nextView?.score === reveal.score && JSON.stringify(reveal.nextView.seats) === JSON.stringify(reveal.seats), `${dateKey} preview changes no confirmed score or appointment`);
      check(JSON.stringify(reveal.nextView) === JSON.stringify(draftView(nextRound(state))), `${dateKey} preview exactly matches the canonical next public projection`);
    } else check(reveal.nextView === undefined, `${dateKey} final appointment cannot preview an unconfirmed result`);
    state = nextRound(state); log.push({ t: "next" });
  }
  check(state.phase === "done", `${dateKey} fifth manual next completes`);
  const todayReview = draftReviewView(state, { mode: "daily", dateKey, today: dateKey }).review;
  check(todayReview?.rounds.length === 5 && todayReview.optimal === null && !todayReview.unlocked, `${dateKey} today's review withholds the optimum`);
  check(todayReview?.rounds.every((round) => round.passedPeople.length === 2 && round.passedPeople.every((person) => person.best === null) && round.unopenedCountries.length === 2) === true, `${dateKey} today's review shows only two passed names and unopened countries per round`);
  const pastReview = draftReviewView(state, { mode: "daily", dateKey, today: "2099-01-01" }).review;
  check(pastReview?.optimal?.score === board.ceiling && pastReview.optimal.gap === 0, `${dateKey} expired optimum is recomputed exactly from the frozen board`);
  check(pastReview?.rounds.every((round) => round.passedPeople.every((person) => person.best && person.best.points === person.best.fit + person.best.fame && Boolean(person.best.why) && person.best.source.startsWith("https://"))) === true, `${dateKey} passed-on values carry arithmetic, evidence and sources after midnight`);
  check(draftReviewView(state, { mode: "practice", dateKey, today: dateKey }).review?.optimal?.score === board.ceiling, `${dateKey} practice unlocks its own complete review`);
  check(scoreState(state).score === board.ceiling, `${dateKey} computed optimum includes country paths and bonuses`);
  check(scoreState(state).score <= MAX_SCORE, `${dateKey} score capped at 195`);
  const scored = scoreState(state);
  const picks = appointmentsOf(state);
  const expectedBonus = (picks.every((p) => p.fit >= 12) ? 8 : 0) + (new Set(picks.map((p) => p.region)).size >= 3 ? 6 : 0) + (picks.some((p) => p.era === "early") && picks.some((p) => p.era === "recent") ? 6 : 0);
  check(expectedBonus === scored.bonusTotal, `${dateKey} independent bonus arithmetic`);
  check(scored.fitTotal + scored.standingTotal + scored.bonusTotal === scored.score, `${dateKey} visible tally sums exactly`);
  const payload = gameModule.payload(state, { mode: "daily", dateKey, startedAt: "2026-10-13T00:00:00.000Z" });
  check(validateCountryDraftResult(dateKey, payload.scoreRaw, payload.resultJson).valid, `${dateKey} real payload validates`);
  check(!validateCountryDraftResult(dateKey, payload.scoreRaw + 1, payload.resultJson).valid, `${dateKey} inflated score rejected`);
  const homes = picks.map((pick) => countryAt(board, pick).iso3);
  const order = fillOrder(homes);
  check(order.length === 195 && new Set(order).size === 195 && homes.every((home) => order.indexOf(home) < 5), `${dateKey} conquest starts at chosen homelands`);
  const encoded = codec.enc(log);
  check(encoded.length <= 32 && JSON.stringify(codec.dec(encoded)) === JSON.stringify(log), `${dateKey} complete log round-trips under cookie budget`);
  check(!('best' in payload.resultJson) && !('ceiling' in payload.resultJson) && !('poolNames' in payload.resultJson), `${dateKey} completed payload contains only chosen people`);
  ceilings.push(board.ceiling);
}

// Practice excludes today’s fifteen countries without seed rejection or private-pool clues.
for (let sample = 0; sample < 12; sample += 1) {
  const daily = createGame(dateSeed(`practice-sample-${sample}`));
  const excluded = daily.board.rounds.flatMap((round) => round.countries.map((country) => country.iso3));
  const first = POOL.find((country) => !excluded.includes(country.iso3) && country.groups.filter((group) => group.people.some((person) => person.portrait)).length >= 3);
  const practice = createGame(sample + 10, { excludeCountries: excluded, firstCountry: first?.iso3 });
  check(practice.board.rounds.every((round) => round.countries.every((country) => !excluded.includes(country.iso3))), "practice contains none of today's fifteen countries");
  check(practice.board.rounds[0].countries.some((country) => country.iso3 === first?.iso3), "requested eligible homeland is offered first");
}

const dateKey = "2026-10-13";
const portraits = POOL.flatMap((country) => country.groups.flatMap((group) => group.people)).filter((person) => person.portrait);
check(portraits.length >= 304 && portraits.every((person) => person.fits?.length === 5 && person.fitEvidence?.length === 5), "the portrait-backed roster never shrinks below the prior 304 people, and every person has five sourced ratings");
check(new Set(portraits.map((person) => person.fits?.join(","))).size > 30, "actual individual careers create diverse fit vectors");
for (const person of portraits) {
  check(person.fits?.every((value) => [0, 6, 12, 18, 25].includes(value)) === true, `${person.slug} five authored fit levels`);
  check(person.fitEvidence?.every((evidence) => evidence.line.length > 0 && evidence.source.startsWith("https://")) === true, `${person.slug} every rating has source-linked evidence or an explicit source limitation`);
  check(fameOf(person) >= 4 && fameOf(person) <= 10, `${person.slug} frozen fame bounded from 4 to 10`);
  check(figureFit({ ...person, archetype: 7 }, 4) === figureFit(person, 4), `${person.slug} changing a category does not change frozen individual fit`);
  check(fameOf({ ...person, standing: 0 }) === fameOf(person), `${person.slug} changing old standing does not change frozen sitelink fame`);
}
const siemens = portraits.find((person) => person.slug === "werner-von-siemens");
const churchill = portraits.find((person) => person.slug === "winston-churchill");
const blanchett = portraits.find((person) => person.slug === "cate-blanchett");
const newton = portraits.find((person) => person.slug === "isaac-newton");
check(Boolean(siemens) && siemens?.fits?.[4] === 25 && siemens.fits?.[2] === 25, "Siemens' inventor and industrialist careers count separately");
check(Boolean(churchill) && churchill?.fits?.[2] === 25 && churchill.fitEvidence?.[2].line.includes("Chancellor of the Exchequer") === true, "Churchill's documented finance office supplies its own Purse evidence");
check(Boolean(blanchett) && blanchett?.fits?.[0] !== 25, "a film jury president is not mistaken for a national president");
check(Boolean(newton) && newton?.fits?.[0] !== 25, "Royal Society presidency is not mistaken for a head of state");
const bySlug = (slug: string) => portraits.find((person) => person.slug === slug);
for (const slug of ["shaka", "leonidas-i", "joan-of-arc"]) {
  const person = bySlug(slug);
  check(person?.fits?.[1] === 25, `${slug} documented command is not lost to an incomplete occupation list`);
  check(person?.fitEvidence?.[1].source !== person?.source && !person?.fitEvidence?.[1].line.includes("Worked as a monarch"), `${slug} military rating cites the actual career evidence`);
}
const taytuRecord = draftCareerRecord("taytu-betul");
check(Boolean(taytuRecord), "Taytu's sourced record remains available even while her homeland lacks a complete portrait-backed pool");
if (taytuRecord) check(applyCareerEvidence("taytu-betul", careerRatings(taytuRecord, { archetype: 1, primaryNote: "empress who campaigned at Adwa" })).fits[1] === 18, "Taytu's documented Adwa involvement counts without inventing a formal rank");
check(bySlug("cristiano-ronaldo")?.fits?.[3] === 12 && bySlug("cristiano-ronaldo")?.fits?.[4] === 6, "a secondary acting credit does not turn Ronaldo into a professional communicator or inventor");
check(bySlug("cristiano-ronaldo")?.fitEvidence?.[3].line.includes("football player") === true, "equally strong primary career evidence takes precedence over an incidental acting credit");
check(bySlug("zinedine-zidane")?.fits?.[0] === 6 && bySlug("zinedine-zidane")?.fits?.[3] === 12, "a goodwill appointment is not a government office or a full diplomatic career");
for (const slug of ["sigmund-freud", "chris-hadfield"]) check(bySlug(slug)?.fits?.[4] === 25, `${slug} science career is recognised alongside writing or music credits`);
for (const slug of ["juan-sebastian-elcano", "ferdinand-magellan", "vasco-da-gama"]) check(bySlug(slug)?.fits?.[4] === 18, `${slug} exploration provides a plausible discovery connection`);
const shaka = bySlug("shaka");
if (shaka) {
  const frozen = { ...shaka, fits: [25, 6, 12, 18, 6], fitEvidence: shaka.fitEvidence?.map(evidence => ({ ...evidence, line: "Old board evidence" })) };
  check(figureFit(frozen, 1) === 6, "a preserved board keeps the rating it was played with after current roster corrections");
}
let edge = openCountry(createGame(dateSeed(dateKey)), 0);
edge = nextRound(appoint(edge, 0, 0));
edge = openCountry(edge, 1);
check(appoint(edge, 0, 0) === edge, "an occupied job cannot be used twice");
for (const malformed of ["u", "a9z", "o4", "o", "a00u"]) {
  let rejected = false; try { codec.dec(malformed); } catch { rejected = true; }
  check(rejected, `malformed or retired undo log ${malformed} rejected`);
}
check(poolIndex(3) === null && seatIndex(5) === null, "invalid input indices rejected");
console.log(`Country Draft: ${checks} checks, ${failures} failures. Ceiling range ${Math.min(...ceilings)} to ${Math.max(...ceilings)}.`);
process.exitCode = failures ? 1 : 0;
