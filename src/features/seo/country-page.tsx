import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getAllCategories } from "@/lib/data/categories";
import { getCountriesByContinent, getCountryByIso3 } from "@/lib/data/countries";
import { getRanksForCountry, getStatValue } from "@/lib/data/ranks";
import { formatStat } from "@/lib/utils";
import bordersData from "@/data/borders.json";
import type { Country } from "@/types/country";
import {
  EditorialHead,
  Flag,
  GameRow,
  PageTitle,
  SectionHead,
  SiteFoot,
  StatIcon,
  StatRows,
  Icon,
  type GameSlug,
  type StatRow,
} from "@/ui";
import { buildCapsules } from "./capsules";
import { CapsuleList } from "./capsules-list";
import { Peers } from "./peers";
import { Standing } from "./standing";
import "./seo.css";

const borders: Record<string, string[]> = bordersData;

const PLAY_ROWS: readonly { slug: GameSlug; title: string; meta: (name: string) => string }[] = [
  { slug: "flag-quiz", title: "Flag Quiz", meta: (n) => `name ${n} from its flag` },
  { slug: "higher-or-lower", title: "Higher or Lower", meta: (n) => `is ${n} higher or lower` },
  { slug: "capital-match", title: "Capital Match", meta: (n) => `the capital of ${n}` },
  { slug: "country-draft", title: "Country Draft", meta: () => "put countries on their best stat" },
  { slug: "border-buddies", title: "Border Buddies", meta: (n) => `every neighbour of ${n}` },
];

const RANKING_ROWS: readonly { stat: string | null; title: string; href: string; meta: string }[] = [
  { stat: "population", title: "Most populated countries", href: "/lists/most-populated-countries", meta: "the 50 biggest by people" },
  { stat: "area-km2", title: "Largest countries", href: "/lists/largest-countries", meta: "the 50 biggest by area" },
  { stat: "gdp-per-capita", title: "Richest countries", href: "/lists/richest-countries", meta: "the 50 highest GDP per person" },
  { stat: null, title: "All 21 rankings", href: "/categories", meta: "every country ranked on every stat" },
];

/**
 * "Data updated" comes from the generated src/data/data-timestamps.json at build, so a
 * missing file degrades to no line instead of a build error. The date is never
 * hand-written; it only reflects when the data pipeline last rewrote the stats.
 */
function readDataUpdatedDate(): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(join(process.cwd(), "src/data/data-timestamps.json"), "utf8"));
  } catch {
    return null;
  }
  if (typeof parsed === "string") return formatDataDate(parsed);
  if (typeof parsed !== "object" || parsed === null) return null;
  const record = parsed as Record<string, unknown>;
  for (const key of ["generatedAt", "updatedAt", "lastUpdated", "dataUpdated", "date"]) {
    const value = record[key];
    if (typeof value === "string" && value.length > 0) return formatDataDate(value);
  }
  return null;
}

function formatDataDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

/** "124.5M people" split into the Erode value and the mute unit after it. */
function splitStat(raw: number, unit: string): { value: string; unit?: string } {
  const text = formatStat(raw, unit);
  const space = text.indexOf(" ");
  if (space === -1) return { value: text };
  return { value: text.slice(0, space), unit: text.slice(space + 1) };
}

/**
 * One country profile (blueprint 7.9): one column of meaning, not a stack of cards. The
 * flag, the standing, the six answers, the 21 rankings, then the links out. Static, 243
 * of them, no viewer state anywhere.
 */
export function CountryPage({ country }: { country: Country }) {
  const categories = getAllCategories();
  const ranks = getRanksForCountry(country.iso3);
  const dataUpdated = readDataUpdatedDate();

  const neighbours = (borders[country.iso3] ?? [])
    .map((iso3) => getCountryByIso3(iso3))
    .filter((c): c is Country => Boolean(c))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  const continentAll = getCountriesByContinent(country.continent).filter((c) => c.iso3 !== country.iso3);
  const continentRows = continentAll.slice(0, 12);

  const statRows: StatRow[] = categories.map((cat) => {
    const raw = getStatValue(country.iso3, cat.slug);
    const rank = ranks[cat.slug];
    if (raw === null) return { slug: cat.slug, label: cat.label, clarifier: cat.clarifier, value: null, rank: null };
    const { value, unit } = splitStat(raw, cat.unit);
    return { slug: cat.slug, label: cat.label, clarifier: cat.clarifier, value, unit, rank: rank ?? null };
  });

  const capsules = buildCapsules(country, ranks, neighbours);
  const name = country.displayName;

  return (
    <>
      <div className="split">
        <div className="col">
          <div data-o="1">
            <PageTitle
              eyebrow={<Flag iso2={country.iso2} size="xl" alt="" />}
              title={name}
              meta={`${country.continent} · ${country.subregion} · ${country.capital ? `capital ${country.capital}` : "no capital"}`}
            />
          </div>

          <section data-o="3" aria-labelledby="about">
            <EditorialHead id="about" title={`About ${name}`} />
            <CapsuleList capsules={capsules} />
          </section>

          <section data-o="4" aria-labelledby="all-stats">
            <EditorialHead
              id="all-stats"
              title="All statistics and world rankings"
              fact={dataUpdated ? `Data updated ${dataUpdated}` : undefined}
            />
            <StatRows rows={statRows} caption={`Statistics and world rankings for ${name}`} />
          </section>

          <section data-o="5" className="ls">
            <SectionHead
              title={`Borders ${name}`}
              fact={neighbours.length === 1 ? "1 country" : `${neighbours.length} countries`}
            />
            {neighbours.length === 0 ? (
              <p className="t-body empty-row">
                No land borders. {name} is an island or an exclave state.
              </p>
            ) : (
              neighbours.map((n) => (
                <GameRow
                  key={n.slug}
                  href={`/countries/${n.slug}`}
                  title={n.displayName}
                  meta="shares a land border"
                  lead={<Flag iso2={n.iso2} size="xs" alt="" />}
                />
              ))
            )}
          </section>

          <div data-o="6">
            <Peers country={country} />
          </div>

          <p data-o="10" className="t-meta entity-line">
            ISO 3166-1 alpha-2 {country.iso2} · alpha-3 {country.iso3} · {country.subregion}
          </p>
        </div>

        <div className="col side pin">
          <div data-o="2" className="standing">
            <Standing iso3={country.iso3} name={name} ranks={ranks} />
          </div>

          <section data-o="8" className="ls">
            <SectionHead title={`Play with ${name}`} fact={`${PLAY_ROWS.length} games`} />
            {PLAY_ROWS.map((g) => (
              <GameRow
                key={g.slug}
                slug={g.slug}
                title={g.title}
                meta={g.meta(name)}
                href={`/games/${g.slug}`}
              />
            ))}
          </section>

          <section data-o="7" className="ls">
            <SectionHead title={`More in ${country.continent}`} fact={`${continentAll.length} countries`} />
            {/* Twelve rows on the phone, the first six in the desktop rail (blueprint 7.9);
                all twelve stay in the HTML, so the link graph is the same either way. */}
            {continentRows.map((c, i) => (
              <GameRow
                key={c.slug}
                href={`/countries/${c.slug}`}
                title={c.displayName}
                meta={c.capital || "no capital"}
                lead={<Flag iso2={c.iso2} size="xs" alt="" />}
                className={i >= 6 ? "rail-hidden" : undefined}
              />
            ))}
          </section>

          <section data-o="9" className="ls">
            <SectionHead title="Rankings" />
            {RANKING_ROWS.map((r) => (
              <GameRow
                key={r.href}
                href={r.href}
                title={r.title}
                meta={r.meta}
                lead={r.stat ? <StatIcon slug={r.stat} size={24} /> : <Icon name="trophy" size={24} />}
              />
            ))}
          </section>
        </div>
      </div>

      <SiteFoot />
    </>
  );
}
