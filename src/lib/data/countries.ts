import { countries } from "./loader";
import type { Country } from "@/types/country";

const byIso3 = new Map(countries.map((c) => [c.iso3, c]));
const bySlug = new Map(countries.map((c) => [c.slug, c]));

export function getAllCountries(): Country[] {
  return countries;
}

export function getCountryByIso3(iso3: string): Country | undefined {
  return byIso3.get(iso3);
}

export function getCountryBySlug(slug: string): Country | undefined {
  return bySlug.get(slug);
}

export function getCountriesByRegion(region: string): Country[] {
  return countries.filter((c) => c.region === region);
}

export function getCountriesByContinent(continent: string): Country[] {
  return countries.filter((c) => c.continent === continent);
}
