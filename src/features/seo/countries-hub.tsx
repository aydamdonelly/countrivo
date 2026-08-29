import Link from "next/link";
import { getAllCountries } from "@/lib/data/countries";
import { getAllCategories } from "@/lib/data/categories";
import { getCountryByIso3 } from "@/lib/data/countries";
import { getStatValue } from "@/lib/data/ranks";
import { formatStat } from "@/lib/utils";
import bordersData from "@/data/borders.json";
import { COUNTRIES_HUB, COUNTRIES_INTRO, COUNTRY_FACTS } from "@/content/hubs";
import {
  FactRow,
  Flag,
  GameList,
  GameRow,
  PageTitle,
  Prose,
  SectionHead,
  SiteFoot,
  type Fact,
} from "@/ui";
import { CountriesSearch } from "./countries-search";
import "./seo.css";

const borders: Record<string, string[]> = bordersData;

const CONTINENT_ORDER = ["Africa", "Americas", "Asia", "Europe", "Oceania"] as const;

/**
 * /countries (blueprint 7.8): the whole index in the first HTML, grouped by continent
 * behind real anchors, with a filter that only ever hides rows. Nothing here is
 * viewer-specific and nothing rotates by date, so the page is fully static.
 */
export function CountriesHub() {
  const countries = getAllCountries();
  const categories = getAllCategories();

  const groups = CONTINENT_ORDER.map((continent) => ({
    continent,
    id: continent.toLowerCase(),
    rows: countries
      .filter((c) => c.continent === continent)
      .sort((a, b) => a.displayName.localeCompare(b.displayName)),
  })).filter((g) => g.rows.length > 0);

  const facts: Fact[] = COUNTRY_FACTS.map((f): Fact | null => {
    const country = getCountryByIso3(f.iso3);
    if (!country) return null;
    let value: string | null = null;
    if (f.stat === "borders") {
      value = String((borders[f.iso3] ?? []).length);
    } else {
      const raw = getStatValue(f.iso3, f.stat);
      const category = categories.find((c) => c.slug === f.stat);
      if (raw !== null && category) value = formatStat(raw, category.unit);
    }
    if (value === null) return null;
    return { value, label: f.label, href: `/countries/${country.slug}` };
  }).filter((f): f is Fact => f !== null);

  return (
    <>
      <PageTitle
        title={COUNTRIES_HUB.h1}
        meta={`${countries.length} countries and territories · flags, capitals, ${categories.length} rankings`}
      />

      <div className="split">
        <div className="col">
          <div data-o="1">
            <CountriesSearch total={countries.length} />
          </div>

          <div data-o="2">
            <Prose>
              <p>{COUNTRIES_INTRO[0]}</p>
              <p>
                {COUNTRIES_INTRO[1]} Every country here can turn up in{" "}
                <Link href="/games/flag-quiz">Flag Quiz</Link>,{" "}
                <Link href="/games/higher-or-lower">Higher or Lower</Link> and{" "}
                <Link href="/games/blind-pick">Blind Pick</Link>.
              </p>
            </Prose>
          </div>

          <div data-o="3" className="cx-facts">
            <FactRow facts={facts} />
          </div>

          <nav data-o="4" className="cx-anchors t-row" aria-label="Jump to a continent">
            {groups.map((g, i) => (
              <span key={g.id}>
                {i > 0 ? <span aria-hidden> · </span> : null}
                <a href={`#${g.id}`}>{g.continent}</a>
              </span>
            ))}
          </nav>
        </div>

        <div className="col side">
          <div data-o="5">
            <GameList
              title="Play with countries"
              fact="4 games"
              rows={[
                { slug: "country-draft", title: "Country Draft", meta: "five seats, one map", href: "/games/country-draft" },
                { slug: "flag-quiz", title: "Flag Quiz", meta: "10 flags · 4 options", href: "/games/flag-quiz" },
                { slug: "geo-wordle", title: "GeoWordle", meta: "1 country · 6 tries", href: "/games/geo-wordle" },
                { slug: "higher-or-lower", title: "Higher or Lower", meta: "2 countries · 1 stat", href: "/games/higher-or-lower" },
              ]}
            />
          </div>
        </div>
      </div>

      <div id="country-index" className="cx">
        {groups.map((g) => (
          <section key={g.id} id={g.id} className="ls">
            <SectionHead title={g.continent} fact={`${g.rows.length} countries`} />
            <div className="cols2">
              {g.rows.map((c) => (
                <GameRow
                  key={c.slug}
                  href={`/countries/${c.slug}`}
                  title={c.displayName}
                  meta={c.capital || "no capital"}
                  lead={<Flag iso2={c.iso2} size="xs" alt="" />}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <SiteFoot />
    </>
  );
}
