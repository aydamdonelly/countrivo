import { getCountriesByContinent } from "@/lib/data/countries";
import { getStatValue } from "@/lib/data/ranks";
import { isSovereign, notSovereignPhrase, type WorldStanding } from "@/lib/data/world";
import { regionName } from "@/lib/seo/country-metadata";
import { ordinal } from "@/lib/utils";
import type { Country } from "@/types/country";

/**
 * The six answer capsules of a country page, moved from
 * src/components/seo/answer-capsules.tsx (blueprint 12).
 *
 * Ranks come from the page's own world standings (src/lib/data/world.ts), the same
 * sovereign-state ranking the description, the spotlight and the rankings show. They used
 * to come from ranks.json, which also counts territories, so a page could say 171st in its
 * description and 185th in its answer. A territory is never called a country or given a
 * world rank: its answer says where it would place among the sovereign states.
 *
 * Deliberately capped at six questions. Google treats "separate content for every
 * possible variation of how people might search" as scaled content abuse, so this covers
 * the handful of genuinely-asked questions and stops. Answers name the country
 * explicitly instead of using a pronoun, carry no links, and any question whose data is
 * missing is skipped rather than answered with "unknown".
 */
export interface Capsule {
  question: string;
  answer: string;
}

/**
 * Spelled-out magnitudes ("124.5 million") read better inside a sentence than the
 * compact "124.5M" used in the stat table, and are what a snippet or an answer engine
 * lifts verbatim.
 */
function spellCount(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} billion`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} million`;
  return Math.round(n).toLocaleString("en-US");
}

function listNames(names: string[]): string {
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** `the 19th largest`, or `the largest` for first place. */
function placed(rank: number, word: string): string {
  return `the ${rank === 1 ? "" : `${ordinal(rank)} `}${word}`;
}

/** A territory's honest position: where it would place among the sovereign states. */
function wouldPlace(country: Country, standing: WorldStanding, measure: string): string {
  const name = country.displayName;
  return ` ${name} ${notSovereignPhrase(country.iso3)}; ranked by ${measure} with the ${standing.count} sovereign states, ${name} would place ${ordinal(standing.rank)}.`;
}

export function buildCapsules(
  country: Country,
  standings: readonly WorldStanding[],
  neighbors: Country[],
): Capsule[] {
  const name = country.displayName;
  const capsules: Capsule[] = [];
  const standing = (slug: string) => standings.find((row) => row.category.slug === slug);
  const sovereign = isSovereign(country.iso3);

  if (country.capital) {
    capsules.push({
      question: `What is the capital of ${name}?`,
      answer: sovereign
        ? `The capital of ${name} is ${country.capital}. ${country.capital} is the seat of national government for ${name}, a country in ${regionName(country.subregion)}.`
        : `The capital of ${name} is ${country.capital}. ${country.capital} is the main seat of government of ${name}, in ${regionName(country.subregion)}.`,
    });
  }

  const population = getStatValue(country.iso3, "population");
  if (population !== null) {
    const row = standing("population");
    const rankClause = row && row.sovereign ? `, ${placed(row.rank, "largest")} population in the world` : "";
    capsules.push({
      question: `What is the population of ${name}?`,
      answer: `${name} has a population of about ${spellCount(population)} people${rankClause}. Population figures come from World Bank estimates.${row && !row.sovereign ? wouldPlace(country, row, "population") : ""}`,
    });
  }

  const area = getStatValue(country.iso3, "area-km2");
  if (area !== null) {
    const row = standing("area-km2");
    const rankClause = row && row.sovereign ? `, making ${name} ${placed(row.rank, "largest")} country in the world by area` : "";
    capsules.push({
      question: `How big is ${name}?`,
      answer: `${name} covers ${Math.round(area).toLocaleString("en-US")} square kilometers (${Math.round(area * 0.386102).toLocaleString("en-US")} square miles)${rankClause}.${row && !row.sovereign ? wouldPlace(country, row, "area") : ""}`,
    });
  }

  if (neighbors.length === 0) {
    capsules.push({
      question: `Which countries border ${name}?`,
      answer: `${name} shares no land border with any other country. No neighboring state can be reached from ${name} overland.`,
    });
  } else if (neighbors.length === 1) {
    capsules.push({
      question: `Which countries border ${name}?`,
      answer: `${name} borders exactly one country: ${neighbors[0].displayName}. No other nation shares a land frontier with ${name}.`,
    });
  } else {
    capsules.push({
      question: `Which countries border ${name}?`,
      answer: `${name} borders ${neighbors.length} countries: ${listNames(neighbors.map((n) => n.displayName))}.`,
    });
  }

  const lifeExpectancy = getStatValue(country.iso3, "life-expectancy");
  if (lifeExpectancy !== null) {
    const row = standing("life-expectancy");
    const rankClause = row && row.sovereign ? `, ${placed(row.rank, "highest")} of any country in the world` : "";
    capsules.push({
      question: `What is the life expectancy in ${name}?`,
      answer: `Life expectancy at birth in ${name} is ${lifeExpectancy.toFixed(1)} years${rankClause}.`,
    });
  }

  const continentSize = getCountriesByContinent(country.continent).length;
  capsules.push({
    question: `What continent is ${name} in?`,
    answer: `${name} is in ${country.continent}, in the ${country.subregion} region. ${name} is one of ${continentSize} countries and territories in ${country.continent}.`,
  });

  return capsules;
}
