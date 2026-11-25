import { dateSeed } from "./daily-seed";
import { mulberry32 } from "./seeded-random";

export interface SimulatedRival { name: string; score: string; sort: number; isBot: true }

/**
 * Demonstration opponents are displayed separately and never counted as human players.
 * `flagFormat` is the rules a Flag Quiz day was frozen with: a ten-flag day keeps rivals in
 * points of 13, a sprint day counts flags.
 */
export function simulatedRivals(slug: string, dateKey: string, flagFormat: "sprint" | "quiz" = "sprint"): SimulatedRival[] {
  const rng = mulberry32(dateSeed(`demo-rivals|${slug}|${dateKey}`));
  const names = ["Atlas", "Meridian", "Juniper", "Orion", "Cassiopeia", "Sierra", "Delta", "Coral", "Cedar", "Compass", "Tundra", "Dune", "River", "Peak", "Acacia", "Harbour", "Ridge", "Cove", "Solstice", "Cirrus", "Pine", "Bay", "Tropic", "Vale"];
  return names.map<SimulatedRival>((name) => {
    const fraction = 0.35 + rng() * 0.55;
    if (slug === "geo-wordle") { const guesses = 2 + Math.floor(rng() * 4); return {name,score:`${guesses}/6`,sort:7-guesses,isBot:true}; }
    // The Flag Quiz sprint: 6 to 14 flags in twenty seconds.
    if (slug === "flag-quiz" && flagFormat === "sprint") { const flags = Math.round(16 * fraction); return { name, score: `${flags} flags`, sort: flags, isBot: true }; }
    const max = slug === "country-draft" ? 195 : slug === "pinpoint" ? 1200 : slug === "stat-guesser" ? 600 : 13;
    const score = Math.round(max * fraction);
    return { name, score: `${score} of ${max}`, sort: score, isBot: true };
  }).sort((a,b) => b.sort-a.sort);
}
