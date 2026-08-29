import { getAllCountries, getCountriesByContinent } from "@/lib/data/countries";
import { getCategoryBySlug } from "@/lib/data/categories";
import { getRank, getStatValue } from "@/lib/data/ranks";
import { formatStat, ordinal } from "@/lib/utils";
import type { Country } from "@/types/country";
import { Flag, GameRow, Icon, SectionHead } from "@/ui";

/**
 * The data-derived internal link graph of a country page (blueprint 7.9 step 6), moved
 * from src/components/seo/related-countries.tsx. The link logic is verbatim: the two
 * countries immediately above and the two immediately below by a stat, then the regional
 * hubs. Every anchor names its destination and why it is related, and a group with no
 * members renders nothing at all.
 */

interface PeerLink {
  href: string;
  iso2: string;
  /** The anchor itself, always descriptive, never "click here". */
  label: string;
  /** Why this link is related. */
  detail: string;
}

// Continent hubs that have a dedicated ranking page. Oceania has none, so the hub group
// falls back to the full country index instead of an empty heading.
const CONTINENT_HUBS: Record<string, string> = {
  Africa: "/lists/countries-in-africa",
  Americas: "/lists/countries-in-americas",
  Asia: "/lists/countries-in-asia",
  Europe: "/lists/countries-in-europe",
};

// Countries ordered by a stat, biggest first. Cached per category because the country
// page is statically generated 243 times at build.
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
export function statNeighbours(categorySlug: string, iso3: string): PeerLink[] {
  const ordered = orderedByStat(categorySlug);
  const index = ordered.findIndex((entry) => entry.country.iso3 === iso3);
  if (index === -1) return [];

  const category = getCategoryBySlug(categorySlug);
  if (!category) return [];

  return [...ordered.slice(Math.max(0, index - 2), index), ...ordered.slice(index + 1, index + 3)].map(
    (entry) => {
      const rank = getRank(entry.country.iso3, categorySlug);
      return {
        href: `/countries/${entry.country.slug}`,
        iso2: entry.country.iso2,
        label: `${entry.country.displayName} ${category.shortLabel.toLowerCase()}`,
        detail: rank
          ? `${formatStat(entry.value, category.unit)} · ${ordinal(rank)} in the world`
          : formatStat(entry.value, category.unit),
      };
    },
  );
}

export function Peers({ country }: { country: Country }) {
  const links = [
    ...statNeighbours("population", country.iso3),
    ...statNeighbours("area-km2", country.iso3),
  ];
  if (links.length === 0) return null;

  const continentHub = CONTINENT_HUBS[country.continent];
  const continentSize = getCountriesByContinent(country.continent).length;

  return (
    <section className="ls">
      <SectionHead title={`Close to ${country.displayName}`} fact="by population · by area" />
      {links.map((l) => (
        <GameRow
          key={`${l.href}-${l.label}`}
          href={l.href}
          title={l.label}
          meta={l.detail}
          lead={<Flag iso2={l.iso2} size="xs" alt="" />}
        />
      ))}
      <SectionHead title="Regional hubs" />
      {continentHub ? (
        <GameRow
          href={continentHub}
          title={`All countries in ${country.continent}`}
          meta={`${continentSize} countries and territories`}
          lead={<Icon name="globe" size={24} />}
        />
      ) : null}
      <GameRow
        href="/countries"
        title="Every country profile on Countrivo"
        meta={`${getAllCountries().length} countries and territories`}
        lead={<Icon name="search" size={24} />}
      />
    </section>
  );
}
