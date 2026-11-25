import type { Metadata } from "next";
import { notSovereignPhrase, type WorldStanding } from "@/lib/data/world";
import { formatStat, ordinal } from "@/lib/utils";
import type { Country } from "@/types/country";

/**
 * Title and description of a country page. Search Console shows size questions ("how big
 * is Latvia", "french guiana square miles") ranking far better than population ones, so
 * the title names size next to population and capital, and a territory's description
 * opens with its area. Ranks are the page's own sovereign-state standings
 * (src/lib/data/world.ts); a territory gets no world rank, because it is not one of the
 * ranked states.
 */

/** The layout template appends " | Countrivo". */
const BRAND_LENGTH = " | Countrivo".length;
/** Roughly what a search result shows before it cuts the title off. */
const TITLE_BUDGET = 65;

/** A subregion inside a sentence: `in the Caribbean`, `in Western Europe`. */
export function regionName(subregion: string): string {
  return subregion === "Caribbean" ? "the Caribbean" : subregion;
}

function joinWords(words: readonly string[]): string {
  if (words.length <= 1) return words.join("");
  return `${words.slice(0, -1).join(", ")} & ${words[words.length - 1]}`;
}

/**
 * `Germany: Population, Size, Capital & World Rankings | Countrivo`. A longer name keeps
 * the full template and drops the brand; a name too long even for that drops "World
 * Rankings", then the capital, so the words that answer the query always fit.
 */
export function countryTitle(name: string, facts: { population: boolean; area: boolean; capital: boolean }): Metadata["title"] {
  const parts = [facts.population && "Population", facts.area && "Size", facts.capital && "Capital"].filter((part): part is string => Boolean(part));
  const candidates = parts.length
    ? [`${name}: ${joinWords([...parts, "World Rankings"])}`, `${name}: ${joinWords(parts)}`, `${name}: ${joinWords(parts.slice(0, 2))}`]
    : [`${name}: World Rankings & Facts`];
  for (const text of candidates) {
    if (text.length + BRAND_LENGTH <= TITLE_BUDGET) return text;
    if (text.length <= TITLE_BUDGET) return { absolute: text };
  }
  return { absolute: candidates[candidates.length - 1] };
}

/** The title as plain text, for Open Graph. */
export function titleText(title: Metadata["title"]): string {
  if (typeof title === "string") return title;
  if (title && typeof title === "object" && "absolute" in title && typeof title.absolute === "string") return title.absolute;
  return "";
}

function areaPhrase(area: number): string {
  return `${Math.round(area).toLocaleString("en-US")} km² (${Math.round(area * 0.386102).toLocaleString("en-US")} sq mi)`;
}

export function countryDescription(country: Country, standings: readonly WorldStanding[], sovereign: boolean): string {
  const name = country.displayName;
  const population = standings.find(({ category }) => category.slug === "population");
  const area = standings.find(({ category }) => category.slug === "area-km2");
  const capitalPart = country.capital ? ` Its capital is ${country.capital}.` : "";
  const where = country.subregion ? regionName(country.subregion) : country.continent;

  if (!sovereign) {
    // A territory leads with its size: that is the question people search it for.
    const areaPart = area ? `${name} covers ${areaPhrase(area.value)} in ${where}.` : `${name} is in ${where}.`;
    const status = `${name} ${notSovereignPhrase(country.iso3)}`;
    const populationPart = population ? ` ${status}, with a population of about ${formatStat(population.value, population.category.unit)} (${population.category.source} ${population.category.sourceYear}).` : ` ${status}.`;
    const count = area?.count ?? population?.count;
    return `${areaPart}${populationPart}${capitalPart}${count ? ` Compare it with the ${count} sovereign states in ${standings.length} statistics.` : ""}`;
  }

  const highlights = [...standings]
    .sort((a, b) => a.rank / a.count - b.rank / b.count)
    .slice(0, 3)
    .map(({ category, rank }) => `${ordinal(rank)} in ${category.label}`)
    .join(", ");
  const populationPart = population
    ? `${name} has a population of about ${formatStat(population.value, population.category.unit)} (${population.category.source} ${population.category.sourceYear}), ${ordinal(population.rank)} of ${population.count} countries.`
    : `${name} is in ${where}.`;
  const areaPart = area ? ` It covers ${areaPhrase(area.value)}, ${ordinal(area.rank)} by area.` : "";
  return `${populationPart}${areaPart}${capitalPart}${highlights ? ` Rankings: ${highlights}.` : ""}`;
}
