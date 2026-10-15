import Link from "next/link";
import { getCountryByIso3 } from "@/lib/data/countries";
import { submitGuess, type GeoWordleState } from "@/lib/game-logic/geo-wordle/engine";
import { EditorialHead } from "@/ui/editorial-head";
import { Prose } from "@/ui/prose";
import { Table } from "@/ui/table";
import { Flag } from '@/ui/flag';

// A fixed teaching example, independent of the daily seed and today's answer.
const EXAMPLE: GeoWordleState = { answerIso3: "POL", guesses: [], clueAt: null, phase: "playing" };
const rows = ["FRA", "DEU", "POL"].map((iso3) => {
  const country = getCountryByIso3(iso3);
  if (!country) throw new Error(`Missing GeoWordle example country: ${iso3}`);
  const guess = submitGuess(EXAMPLE, country).guesses[0];
  return {
    country: <span className="guide-country"><Flag iso2={country.iso2} size="xs" alt="" />{country.displayName}</span>,
    distance: `${guess.distanceKm.toLocaleString("en-US")} km`,
    direction: guess.correct ? "Solved" : guess.direction,
  };
});

export function GeoWordleGuide() {
  return (
    <section aria-labelledby="geowordle-clues">
      <EditorialHead id="geowordle-clues" title="How to read GeoWordle clues" />
      <Prose><p>Example answer: <b>Poland</b>. Follow the arrow from each guess and compare distances. This fixed example uses the real game engine, separate from today’s puzzle.</p></Prose>
      <Table
        caption="Example GeoWordle guesses when Poland is the hidden country"
        columns={[
          { key: "country", label: "Guess" },
          { key: "distance", label: "Distance", value: true },
          { key: "direction", label: "Answer lies" },
        ]}
        rows={rows}
      />
      <Prose>
        <p>Germany shows 0 km because it shares a border with Poland. Zero can mean a neighbour; only the correct country solves the puzzle.</p>
        <p><Link href="/games/geo-wordle/play?mode=practice">Try a practice round</Link> or <Link href="/countries">explore countries and neighbours</Link>.</p>
      </Prose>
      <details className="landing-scoring"><summary>How distance is measured</summary><Prose><p>Nearest mapped borders, approximated from Natural Earth 1:50m. Territories without mapped borders use reference centres and say so. Arrows point from the guessed country’s reference centre toward the answer’s reference centre.</p></Prose></details>
    </section>
  );
}
