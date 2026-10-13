import { dateSeed } from "./daily-seed";
import { mulberry32 } from "./seeded-random";

export interface SimulatedRival { name: string; score: string; sort: number; isBot: true }

/** Demonstration opponents are displayed separately and never counted as human players. */
export function simulatedRivals(slug: string, dateKey: string): SimulatedRival[] {
  const rng = mulberry32(dateSeed(`demo-rivals|${slug}|${dateKey}`));
  const names = ["Atlas", "Meridian", "Juniper", "Orion", "Cassiopeia", "Sierra", "Delta", "Coral", "Cedar", "Compass", "Tundra", "Dune", "River", "Peak", "Acacia", "Harbour", "Ridge", "Cove", "Solstice", "Cirrus", "Pine", "Bay", "Tropic", "Vale"];
  return names.map<SimulatedRival>((name) => {
    const fraction = 0.35 + rng() * 0.55;
    if (slug === "geo-wordle") { const guesses = 2 + Math.floor(rng() * 4); return {name,score:`${guesses}/6`,sort:7-guesses,isBot:true}; }
    const max = slug === "country-draft" ? 195 : slug === "pinpoint" ? 1200 : slug === "stat-guesser" ? 600 : 13;
    const score = Math.round(max * fraction);
    return { name, score: `${score} of ${max}`, sort: score, isBot: true };
  }).sort((a,b) => b.sort-a.sort);
}
