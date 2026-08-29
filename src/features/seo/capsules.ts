import { getCountriesByContinent } from "@/lib/data/countries";
import { getStatValue } from "@/lib/data/ranks";
import { ordinal } from "@/lib/utils";
import type { Country } from "@/types/country";

/**
 * The six answer capsules of a country page, moved verbatim from
 * src/components/seo/answer-capsules.tsx (blueprint 12). Text is unchanged: these are
 * the strings Search Console already shows impressions for.
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

export function buildCapsules(
  country: Country,
  ranks: Record<string, number>,
  neighbors: Country[],
): Capsule[] {
  const name = country.displayName;
  const capsules: Capsule[] = [];

  if (country.capital) {
    capsules.push({
      question: `What is the capital of ${name}?`,
      answer: `The capital of ${name} is ${country.capital}. ${country.capital} is the seat of national government for ${name}, a country in ${country.subregion}.`,
    });
  }

  const population = getStatValue(country.iso3, "population");
  if (population !== null) {
    const rank = ranks["population"];
    const rankClause = rank
      ? `, the ${rank === 1 ? "" : `${ordinal(rank)} `}largest population in the world`
      : "";
    capsules.push({
      question: `What is the population of ${name}?`,
      answer: `${name} has a population of about ${spellCount(population)} people${rankClause}. Population figures come from World Bank estimates.`,
    });
  }

  const area = getStatValue(country.iso3, "area-km2");
  if (area !== null) {
    const rank = ranks["area-km2"];
    const rankClause = rank
      ? `, making ${name} the ${rank === 1 ? "" : `${ordinal(rank)} `}largest country in the world by area`
      : "";
    capsules.push({
      question: `How big is ${name}?`,
      answer: `${name} covers ${Math.round(area).toLocaleString("en-US")} square kilometers (${Math.round(area * 0.386102).toLocaleString("en-US")} square miles)${rankClause}.`,
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
    const rank = ranks["life-expectancy"];
    const rankClause = rank
      ? `, the ${rank === 1 ? "" : `${ordinal(rank)} `}highest of any country in the world`
      : "";
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
