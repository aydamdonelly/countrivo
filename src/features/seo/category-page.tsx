import Link from "next/link";
import { surprisingPositions } from "@/lib/data/surprising";
import { isGuessStat } from "@/lib/game-logic/stat-guesser/engine";
import { isHoLStat } from "@/lib/game-logic/higher-or-lower/stats";
import { Button } from "@/ui/button";
import { Clay } from "@/ui/clay";
import { sovereignIso3 } from "@/lib/data/loader";
import { getAllCategories } from "@/lib/data/categories";
import { getCountryByIso3 } from "@/lib/data/countries";
import { getStatValue, getTopCountries } from "@/lib/data/ranks";
import { formatStat, ordinal } from "@/lib/utils";
import type { Category } from "@/types/category";
import { EditorialHead } from "@/ui/editorial-head";
import { FactRow, type Fact } from "@/ui/fact-row";
import { GameRow } from "@/ui/game-row";
import { PageTitle } from "@/ui/page-title";
import { RankTable, type RankRow } from "@/ui/rank-table";
import { SectionHead } from "@/ui/section-head";
import { SiteFoot } from "@/ui/site-foot";
import { StatIcon } from "@/ui/icons/stat";
import { type GameSlug } from "@/ui/types";
import "./seo.css";
import "./category-discovery.css";

const TEST_YOURSELF: readonly { slug: GameSlug; title: string; meta: string }[] = [
  { slug: "blind-pick", title: "Blind Pick", meta: "put six countries on their best stat" },
  { slug: "country-draft", title: "Country Draft", meta: "five seats, five people, one map" },
  { slug: "higher-or-lower", title: "Higher or Lower", meta: "call which country ranks higher" },
  { slug: "stat-guesser", title: "Stat Guesser", meta: "guess the number, closest wins" },
];

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
  const ranked = getTopCountries(category.slug, 300).filter((row) => sovereignIso3.includes(row.iso3)).map((row, i) => ({...row, rank: i + 1}));
  const surprising = surprisingPositions(category.slug);
  const guessable = isGuessStat(category.slug), comparable = isHoLStat(category.slug);
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

  // Two lines per tile, never three, and no unit: the page title, the lead and every row
  // of the table below already say what is being counted, and three Erode values plus a
  // unit do not fit the 328 px rail.
  const facts: Fact[] = rows.slice(0, 3).map((r) => ({
    value: r.value,
    label: `${ordinal(r.rank)} · ${r.name}`,
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

          <section data-o="5" className="src-block">
            <SectionHead title="Source" variant="strip" />
            <p className="t-body src-line">
              {category.source}, {category.sourceYear}. {rows.length} of {sovereignIso3.length} sovereign countries with data. Values are ordered from highest to lowest.
            </p>
          </section>

          <section data-o="5" className="category-surprises" aria-labelledby="surprising-positions">
            <h2 id="surprising-positions" className="t-h3">Surprising positions</h2>
            {surprising.map((position)=>{const country=getCountryByIso3(position.iso3),comparison=getAllCategories().find(c=>c.slug===position.comparisonStat);return country ? <p className="t-body" key={position.iso3}><Link href={`/countries/${country.slug}`}>{country.displayName}</Link> ranks <b>{position.rank} of {position.count}</b> for {category.label.toLowerCase()}, and <b>{position.comparisonRank} of {position.comparisonCount}</b> for {comparison?.label.toLowerCase()}.</p> : null;})}
            <p className="t-meta text-mute">Method: the three largest gaps in relative ranking position, compared with {category.slug==='population'?'total area':'population'}. Only sovereign countries with both values count. This describes position, not whether a country is better.</p>
          </section>
          {guessable || comparable ? <section data-o="5" className="category-practice"><Clay object={guessable?"cl-06":"cl-04"}/><h3 className="t-h3">Try {category.label.toLowerCase()}</h3><p className="t-body">Practice with this statistic. The answers come after your choice.</p>{guessable?<Button variant="ink" href={`/games/stat-guesser/play?mode=practice&stat=${category.slug}`}>Guess this stat</Button>:null}{comparable?<Button variant="text" href={`/games/higher-or-lower/play?mode=practice&stat=${category.slug}`}>Higher or Lower</Button>:null}<p className="t-meta text-mute">Today’s daily content stays out of practice.</p></section> : null}

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
