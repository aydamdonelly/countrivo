import Link from "next/link";
import { getAllCountries, getCountriesByContinent } from "@/lib/data/countries";
import { getCategoryBySlug } from "@/lib/data/categories";
import { getRank, getStatValue } from "@/lib/data/ranks";
import { formatStat, ordinal } from "@/lib/utils";
import type { Country } from "@/types/country";

interface RelatedCountriesProps {
  country: Country;
  neighbors: Country[]; // bordering countries, resolved from borders.json
}

interface RelatedLink {
  href: string;
  label: string;   // the anchor itself — always descriptive, never "click here"
  detail: string;  // why this link is related
}

// Continent hubs that have a dedicated ranking page. Oceania has none, so the
// hub group falls back to the full country index instead of an empty heading.
const CONTINENT_HUBS: Record<string, string> = {
  Africa: "/lists/countries-in-africa",
  Americas: "/lists/countries-in-americas",
  Asia: "/lists/countries-in-asia",
  Europe: "/lists/countries-in-europe",
};

// Countries ordered by a stat, biggest first. Cached per category because the
// country page is statically generated 243 times at build.
const orderedCache = new Map<string, { country: Country; value: number }[]>();

function orderedByStat(categorySlug: string): { country: Country; value: number }[] {
  const cached = orderedCache.get(categorySlug);
  if (cached) return cached;

  const ordered = getAllCountries()
    .map((c) => ({ country: c, value: getStatValue(c.iso3, categorySlug) }))
    .filter((entry): entry is { country: Country; value: number } => entry.value !== null)
    .sort((a, b) => b.value - a.value);

  orderedCache.set(categorySlug, ordered);
  return ordered;
}

/** The two countries immediately above and the two immediately below by a stat. */
function statNeighbors(categorySlug: string, iso3: string): RelatedLink[] {
  const ordered = orderedByStat(categorySlug);
  const index = ordered.findIndex((entry) => entry.country.iso3 === iso3);
  if (index === -1) return [];

  const category = getCategoryBySlug(categorySlug);
  if (!category) return [];

  return [
    ...ordered.slice(Math.max(0, index - 2), index),
    ...ordered.slice(index + 1, index + 3),
  ].map((entry) => {
    const rank = getRank(entry.country.iso3, categorySlug);
    return {
      href: `/countries/${entry.country.slug}`,
      label: `${entry.country.displayName} ${category.shortLabel.toLowerCase()}`,
      detail: rank
        ? `${formatStat(entry.value, category.unit)} · ${ordinal(rank)} in the world`
        : formatStat(entry.value, category.unit),
    };
  });
}

function LinkGroup({ title, links }: { title: string; links: RelatedLink[] }) {
  if (links.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-cream-muted uppercase tracking-wide mb-3">
        {title}
      </h3>
      <ul className="flex flex-wrap gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex flex-col rounded-lg border border-border bg-surface px-3 py-2 hover:border-border-hover transition-colors"
            >
              <span className="text-sm font-medium">{link.label}</span>
              <span className="text-xs text-cream-muted tabular-nums">
                {link.detail}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The data-derived internal link graph for a country: land neighbors, the
 * continent hub, and the countries this one sits directly between by
 * population and by area. Every anchor names its destination and why it is
 * related, and a group with no members renders nothing at all.
 */
export function RelatedCountries({ country, neighbors }: RelatedCountriesProps) {
  const borderLinks: RelatedLink[] = neighbors.map((neighbor) => ({
    href: `/countries/${neighbor.slug}`,
    label: `${neighbor.displayName}`,
    detail: `Shares a land border with ${country.displayName}`,
  }));

  const hubLinks: RelatedLink[] = [];
  const continentHub = CONTINENT_HUBS[country.continent];
  if (continentHub) {
    hubLinks.push({
      href: continentHub,
      label: `All countries in ${country.continent}`,
      detail: `${getCountriesByContinent(country.continent).length} countries and territories`,
    });
  }
  hubLinks.push({
    href: "/countries",
    label: "Every country profile on Countrivo",
    detail: `${getAllCountries().length} countries and territories`,
  });

  const populationLinks = statNeighbors("population", country.iso3);
  const areaLinks = statNeighbors("area-km2", country.iso3);

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold mb-4">
        Where to go next from {country.displayName}
      </h2>
      <div className="flex flex-col gap-6">
        <LinkGroup
          title={`Countries bordering ${country.displayName}`}
          links={borderLinks}
        />
        <LinkGroup
          title={`Closest to ${country.displayName} by population`}
          links={populationLinks}
        />
        <LinkGroup
          title={`Closest to ${country.displayName} by land area`}
          links={areaLinks}
        />
        <LinkGroup title="Regional hubs" links={hubLinks} />
      </div>
    </section>
  );
}
