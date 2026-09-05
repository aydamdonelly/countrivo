import Link from "next/link";
import { getCountryByIso3 } from "@/lib/data/countries";
import { submitGuess, type GeoWordleState } from "@/lib/game-logic/geo-wordle/engine";
import { EditorialHead, Prose, Table } from "@/ui";

// A fixed teaching example, independent of the daily seed and today's answer.
const EXAMPLE: GeoWordleState = { answerIso3: "POL", guesses: [], phase: "playing" };
const rows = ["FRA", "DEU", "POL"].map((iso3) => {
  const country = getCountryByIso3(iso3);
  if (!country) throw new Error(`Missing GeoWordle example country: ${iso3}`);
  const guess = submitGuess(EXAMPLE, country).guesses[0];
  return {
    country: country.displayName,
    distance: `${guess.distanceKm.toLocaleString("en-US")} km`,
    direction: guess.correct ? "Solved" : guess.direction,
  };
});

export function GeoWordleGuide() {
  return (
    <section aria-labelledby="geowordle-clues">
      <EditorialHead id="geowordle-clues" title="How to read GeoWordle clues" />
      <Prose>
        <p>
          Each arrow starts at the country you guessed and points toward the answer. Read it
          together with the distance: north-east and 600 km calls for a different next guess
          than north-east and 6,000 km.
        </p>
        <p>
          Here is a worked example with <b>Poland as the answer</b>. This is a fixed example,
          separate from today&apos;s puzzle. These clues use the same distance calculation as
          the game.
        </p>
      </Prose>
      <Table
        caption="Example GeoWordle guesses when Poland is the hidden country"
        columns={[
          { key: "country", label: "Guess" },
          { key: "distance", label: "Distance", value: true },
          { key: "direction", label: "Answer lies" },
        ]}
        rows={rows}
        rowKey={(row) => String(row.country)}
      />
      <Prose>
        <p>
          Germany is closer than France, so use the shorter distance to narrow your next
          guess. Keep the earlier clue in mind too: the answer must fit both. The map shows
          your guesses; it reveals the answer when the round ends.
        </p>
        <p>
          Distances use one reference point per country. Large countries, islands and
          territories can make the clues surprising, and neighbouring countries do not
          necessarily show a tiny distance. A compass bearing follows the initial direction
          of the shortest route around the globe, which can look curved on a flat map.
        </p>
        <p>
          Need a geography refresher? Browse the <Link href="/countries">country directory</Link>{" "}
          for names, regions and neighbours, or test recognition in the{" "}
          <Link href="/games/flag-quiz">Flag Quiz</Link>. To try the clues yourself, start{" "}
          <Link href="/games/geo-wordle/play?mode=practice">unlimited GeoWordle practice</Link>.
        </p>
      </Prose>
    </section>
  );
}
