import { getAllCategories } from "@/lib/data/categories";
import { getCountryByIso3 } from "@/lib/data/countries";
import { getStatValue, getTopCountries } from "@/lib/data/ranks";
import { formatStat, ordinal } from "@/lib/utils";
import type { Category } from "@/types/category";
import {
  EditorialHead,
  FactRow,
  GameRow,
  PageTitle,
  RankTable,
  SectionHead,
  SiteFoot,
  StatIcon,
  type Fact,
  type GameSlug,
  type RankRow,
} from "@/ui";
import "./seo.css";

const TEST_YOURSELF: readonly { slug: GameSlug; title: string; meta: string }[] = [
  { slug: "country-draft", title: "Country Draft", meta: "put eight countries on their best stat" },
  { slug: "higher-or-lower", title: "Higher or Lower", meta: "call which country ranks higher" },
  { slug: "population-sort", title: "Population Sort", meta: "put six countries in order" },
  { slug: "stat-guesser", title: "Stat Guesser", meta: "guess the number, closest wins" },
];

const DIRECTION: Record<string, string> = {
  higher_is_better: "Higher is better.",
  lower_is_better: "Lower is better.",
  neutral: "Neither direction is better; this is a descriptive ranking.",
};

/** "124.5M people" split into the Erode value and the mute unit after it. */
function splitStat(raw: number, unit: string): { value: string; unit?: string } {
  const text = formatStat(raw, unit);
  const space = text.indexOf(" ");
  if (space === -1) return { value: text };
  return { value: text.slice(0, space), unit: text.slice(space + 1) };
}

/**
 * One ranking, the world as a single board (blueprint 7.11): the top three as the fact
 * row, then every ranked country in one table with no pagination, because a crawler and
 * a curious reader both want the whole thing.
 */
export function CategoryPage({ category }: { category: Category }) {
  const ranked = getTopCountries(category.slug, 300);
  const others = getAllCategories()
    .filter((c) => c.slug !== category.slug)
    .slice(0, 12);

  const rows: RankRow[] = ranked
    .map(({ iso3, rank }): RankRow | null => {
      const country = getCountryByIso3(iso3);
      const raw = getStatValue(iso3, category.slug);
      if (!country || raw === null) return null;
      const { value, unit } = splitStat(raw, category.unit);
      return {
        rank,
        iso2: country.iso2,
        name: country.displayName,
        href: `/countries/${country.slug}`,
        value,
        unit,
      };
    })
    .filter((r): r is RankRow => r !== null);

  const facts: Fact[] = rows.slice(0, 3).map((r) => ({
    value: r.value,
    label: `${ordinal(r.rank)} · ${r.name}`,
    sub: r.unit,
    href: r.href,
  }));

  return (
    <>
      <div className="split">
        <div className="col">
          <div data-o="1">
            <PageTitle
              eyebrow={<StatIcon slug={category.slug} size={32} />}
              title={`${category.label} by Country`}
              meta={`${category.clarifier ?? category.description} · ${category.source} ${category.sourceYear} · ${rows.length} countries ranked`}
            />
          </div>

          <p data-o="2" className="t-row lead-line">
            {category.description}
          </p>

          <section data-o="4" aria-labelledby="full-ranking">
            <EditorialHead
              id="full-ranking"
              title="Full world ranking"
              fact={`${rows.length} countries`}
            />
            <RankTable rows={rows} caption={`${category.label} by country`} />
          </section>
        </div>

        <div className="col side">
          <div data-o="3" className="cat-facts">
            <FactRow facts={facts} />
          </div>

          <section data-o="5">
            <SectionHead title="Source" variant="strip" />
            <p className="t-body src-line">
              {category.source}, {category.sourceYear}. Coverage {category.coveragePercent} % of countries.{" "}
              {DIRECTION[category.direction]}
            </p>
          </section>

          <section data-o="6" className="ls">
            <SectionHead title="More rankings" fact={`${others.length} of ${getAllCategories().length}`} />
            {others.map((c) => (
              <GameRow
                key={c.slug}
                href={`/categories/${c.slug}`}
                title={c.label}
                meta={c.clarifier ?? c.description}
                lead={<StatIcon slug={c.slug} size={24} />}
              />
            ))}
          </section>

          <section data-o="7" className="ls">
            <SectionHead title="Test yourself" fact={`${TEST_YOURSELF.length} games`} />
            {TEST_YOURSELF.map((g) => (
              <GameRow key={g.slug} slug={g.slug} title={g.title} meta={g.meta} href={`/games/${g.slug}`} />
            ))}
          </section>
        </div>
      </div>

      <SiteFoot />
    </>
  );
}
