import { getCategoryBySlug } from "@/lib/data/categories";
import { getAllCountries, getCountriesByContinent, getCountryByIso3 } from "@/lib/data/countries";
import { getStatValue } from "@/lib/data/ranks";
import { sovereignIso3 } from "@/lib/data/loader";
import { DiscoveryList } from "./discovery-list";
import { NameThemAll } from "./name-them-all";
import { formatStat } from "@/lib/utils";
import { getList, LISTS, type ListContent, type ListFact } from "@/content/lists";
import { EditorialHead } from "@/ui/editorial-head";
import { FactRow, type Fact } from "@/ui/fact-row";
import { GameRow } from "@/ui/game-row";
import { Icon } from "@/ui/icons";
import { PageTitle } from "@/ui/page-title";
import { QaList } from "@/ui/qa-list";
import { RankTable, type RankRow } from "@/ui/rank-table";
import { SectionHead } from "@/ui/section-head";
import { SiteFoot } from "@/ui/site-foot";
import { StatIcon } from "@/ui/icons/stat";
import { type GameSlug } from "@/ui/types";
import { breadcrumbList, faqPage, graph, jsonLdProps } from "./breadcrumbs";
import { ListItemJsonLd } from "./list-jsonld";
import "./seo.css";

const PLAY_ROWS: readonly { slug: GameSlug; title: string; meta: string }[] = [
  { slug: "blind-pick", title: "Blind Pick", meta: "put six countries on their best stat" },
  { slug: "higher-or-lower", title: "Higher or Lower", meta: "call which country ranks higher" },
  { slug: "stat-guesser", title: "Stat Guesser", meta: "guess the number, closest wins" },
  { slug: "country-draft", title: "Country Draft", meta: "five seats, five people, one map" },
];

const STAT_ROWS = 50;

function splitStat(raw: number, unit: string): { value: string; unit?: string } {
  const text = formatStat(raw, unit);
  const space = text.indexOf(" ");
  if (space === -1) return { value: text };
  return { value: text.slice(0, space), unit: text.slice(space + 1) };
}

interface Built {
  rows: RankRow[];
  /** The headline figure, its unit and its caption. */
  number: { value: string; unit?: string; caption: string };
  meta: string;
  facts: Fact[];
  faq: { q: string; a: string }[];
  columns: 3 | 4;
}

function buildStatList(list: ListContent, categorySlug: string): Built | null {
  const category = getCategoryBySlug(categorySlug);
  if (!category) return null;

  const sovereign = new Set(sovereignIso3);
  const covered = getAllCountries().filter(c=>sovereign.has(c.iso3)).flatMap(c=>{const value=getStatValue(c.iso3,categorySlug);return value!==null&&Number.isFinite(value)?[{iso3:c.iso3,value}]:[];}).sort((a,b)=>b.value-a.value);
  const ranked = covered.slice(0,STAT_ROWS).map((c,i)=>({iso3:c.iso3,rank:i+1}));
  const rows: RankRow[] = ranked
    .map(({ iso3, rank }): RankRow | null => {
      const country = getCountryByIso3(iso3);
      const raw = getStatValue(iso3, categorySlug);
      if (!country || raw === null) return null;
      const { value, unit } = splitStat(raw, category.unit);
      return { rank, iso2: country.iso2, name: country.displayName, href: `/countries/${country.slug}`, value, unit };
    })
    .filter((r): r is RankRow => r !== null);

  const leader = rows[0];
  const facts = list.quickFacts.map((fact) => statFact(fact, rows)).filter((f): f is Fact => f !== null);

  return {
    rows,
    number: {
      value: leader?.value ?? "",
      unit: leader?.unit,
      caption: leader ? `${leader.name}, ${list.numberCaption}` : list.numberCaption,
    },
    meta: `${covered.length} sovereign countries with data · ${category.source} ${category.sourceYear}`,
    facts,
    faq: [{q: `Which country leads this ${category.label.toLowerCase()} ranking?`,a: leader ? `${leader.name} leads the available sovereign-country records, with ${leader.value}${leader.unit ? ` ${leader.unit}` : ""}. The source year is ${category.sourceYear}. This is a comparison of countries with data, rather than a claim about missing countries.` : "There are no recorded values in this list."}, {q: "How is the ranking calculated?",a: `Recorded values from ${category.source}, ${category.sourceYear}, are sorted from highest to lowest. Territories are excluded, and missing values are not treated as zero. ${rows.length} of ${covered.length} countries with data are shown.`}],
    columns: 3,
  };
}

function statFact(fact: ListFact, rows: readonly RankRow[]): Fact | null {
  if (fact.kind !== "row") {
    if (fact.kind === "count") return { value: String(rows.length), label: fact.label };
    return null;
  }
  const row = rows.find((r) => r.rank === fact.rank);
  if (!row) return null;
  return { value: valueWithUnit(row.value, row.unit), label: `${row.name}, ${fact.label}`, href: row.href };
}

/** The unit sits on the value line in the system face, so every tile is two lines tall. */
function valueWithUnit(value: string, unit?: string) {
  if (!unit) return value;
  return (
    <>
      {value}
      <span className="fact-unit">{unit}</span>
    </>
  );
}

/** "742.3M people" split the same way as a table value. */
function statTile(raw: number, unit: string, label: string, href?: string): Fact {
  const { value, unit: suffix } = splitStat(raw, unit);
  return { value: valueWithUnit(value, suffix), label, ...(href ? { href } : {}) };
}

function buildContinentList(list: ListContent, continent: string): Built {
  const population = getCategoryBySlug("population");
  const area = getCategoryBySlug("area-km2");
  const sovereign = new Set(sovereignIso3);
  const countries = getCountriesByContinent(continent).filter(c=>sovereign.has(c.iso3))
    .map((c) => ({ country: c, pop: getStatValue(c.iso3, "population") ?? 0, area: getStatValue(c.iso3, "area-km2") }))
    .sort((a, b) => b.pop - a.pop);

  const rows: RankRow[] = countries.map((entry, i) => {
    const { value, unit } = splitStat(entry.pop, population?.unit ?? "people");
    return {
      rank: i + 1,
      iso2: entry.country.iso2,
      name: entry.country.displayName,
      href: `/countries/${entry.country.slug}`,
      capital: entry.country.capital || "no capital",
      value,
      unit,
      area: entry.area !== null && area ? formatStat(entry.area, area.unit) : undefined,
    };
  });

  const totalPopulation = countries.reduce((sum, c) => sum + c.pop, 0);
  const withArea = countries.filter((c) => c.area !== null && c.area > 0);
  const byArea = [...withArea].sort((a, b) => (b.area ?? 0) - (a.area ?? 0));
  const biggest = byArea[0];
  const smallest = byArea[byArea.length - 1];
  const mostPeople = countries[0];

  const facts: Fact[] = list.quickFacts
    .map((fact): Fact | null => {
      if (fact.kind === "count") return { value: String(rows.length), label: fact.label };
      if (fact.kind === "sum" && population) return statTile(totalPopulation, population.unit, fact.label);
      if (fact.kind === "top" && fact.stat === "population" && mostPeople && population)
        return statTile(
          mostPeople.pop,
          population.unit,
          `${mostPeople.country.displayName}, ${fact.label}`,
          `/countries/${mostPeople.country.slug}`,
        );
      if (fact.kind !== "top" && fact.kind !== "bottom") return null;
      const areaPick = fact.kind === "top" ? biggest : smallest;
      if (areaPick && fact.stat === "area-km2" && areaPick.area !== null && area)
        return statTile(
          areaPick.area,
          area.unit,
          `${areaPick.country.displayName}, ${fact.label}`,
          `/countries/${areaPick.country.slug}`,
        );
      return null;
    })
    .filter((f): f is Fact => f !== null);

  const faq = list.faq.map((item, i) =>
    i === 0
      ? {
          q: item.q,
          a: `There are ${countries.length} sovereign countries in ${continent === "Americas" ? "the Americas" : continent}; territories and other places are listed separately.`,
        }
      : item,
  );

  return {
    rows,
    number: { value: String(rows.length), caption: `sovereign countries in ${continent === "Americas" ? "the Americas" : continent}` },
    meta: `${rows.length} countries · ${population?.source ?? "World Bank"} ${population?.sourceYear ?? ""}`.trim(),
    facts,
    faq,
    columns: 4,
  };
}

/**
 * One curated list (blueprint 7.13). The headline number, the prose and the facts are
 * all read from the data at build, so the page and the ranking under it can never drift
 * apart. One template renders all 15.
 */
export function ListArticle({ list }: { list: ListContent }) {
  if (list.source.kind === "editorial") return <DiscoveryList list={list}/>;
  const built =
    list.source.kind === "stat"
      ? buildStatList(list, list.source.category)
      : buildContinentList(list, list.source.continent);
  if (!built) return null;

  const sourceCategory = list.source.kind === "stat" ? getCategoryBySlug(list.source.category) : null;
  const territoryRows: RankRow[] = list.source.kind === "continent" ? getCountriesByContinent(list.source.continent).filter(c=>!sovereignIso3.includes(c.iso3)).map((c,i)=>({rank:i+1,iso2:c.iso2,name:c.displayName,href:`/countries/${c.slug}`,capital:c.capital,value:"Other place"})) : [];
  const intro = list.source.kind === "continent" ? [`The list includes ${built.rows.length} sovereign countries in ${list.source.continent === "Americas" ? "the Americas" : list.source.continent}, sorted by population. Territories and other places appear separately and do not count in the practice quiz. Population and area values use the source years shown with their datasets.`] : list.intro.map((p) => p.replace("{n}", String(built.rows.length)));
  const seeAlso = list.seeAlso
    .map((slug) => LISTS.find((l) => l.slug === slug))
    .filter((l): l is ListContent => Boolean(l));

  const jsonLd = graph([
    breadcrumbList([
      { name: "Home", path: "" },
      { name: "Lists", path: "/lists" },
      { name: list.shortName, path: `/lists/${list.slug}` },
    ]),
    faqPage(built.faq),
  ]);

  return (
    <>
      <script {...jsonLdProps(jsonLd)} />
      <ListItemJsonLd
        name={list.listName}
        description={list.listDescription}
        url={`/lists/${list.slug}`}
        items={built.rows.map((r) => ({ position: r.rank, name: r.name, url: r.href }))}
      />

      <div className="split">
        <div className="col">
          <div data-o="1">
            <PageTitle title={list.h1} meta={built.meta} />
          </div>

          <div data-o="2" className="figure">
            <b className="t-score-xl num">
              {built.number.value}
              {built.number.unit ? <span className="unit">{built.number.unit}</span> : null}
            </b>
            <span className="t-body">{built.number.caption}</span>
          </div>

          {list.source.kind === "continent" ? <NameThemAll continent={list.source.continent} /> : null}

          <div data-o="3" className="intro">
            <div className="prose t-prose">
              {intro.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>
          </div>

          <section data-o="5" aria-labelledby="the-ranking">
            <EditorialHead
              id="the-ranking"
              title={list.source.kind === "continent" ? "Sovereign countries" : "The ranking"}
              fact={list.source.kind === "stat" ? `top ${built.rows.length}` : `${built.rows.length} countries`}
            />
            <RankTable
              rows={built.rows}
              columns={built.columns}
              wide={built.columns === 4}
              caption={list.listName}
            />
          </section>

          {territoryRows.length ? <section data-o="5" className="mt-8" aria-labelledby="other-places"><EditorialHead id="other-places" title="Territories and other places"/><RankTable rows={territoryRows} columns={3} caption="Territories and other places, excluded from the practice quiz"/></section> : null}
          {sourceCategory ? <p data-o="5" className="t-meta text-mute mt-4">Source: {sourceCategory.source}, {sourceCategory.sourceYear}. Only sovereign countries with recorded values are ranked. Missing values do not mean zero. <a href={`/sources#${sourceCategory.slug}`}>Source and caveats</a></p> : null}

          <section data-o="6" aria-labelledby="list-questions">
            <EditorialHead id="list-questions" title="Questions" />
            <QaList open="all" items={built.faq.map((f) => ({ q: f.q, a: f.a }))} />
          </section>
        </div>

        <div className="col side pin">
          <div data-o="4" className="list-facts">
            <FactRow facts={built.facts} />
          </div>

          <section data-o="7" className="ls">
            <SectionHead title="Play the ranking" fact={`${PLAY_ROWS.length} games`} />
            {PLAY_ROWS.map((g) => (
              <GameRow key={g.slug} slug={g.slug} title={g.title} meta={g.meta} href={`/games/${g.slug}`} />
            ))}
          </section>

          <section data-o="8" className="ls">
            <SectionHead title="See also" fact={`${seeAlso.length} lists`} />
            {seeAlso.map((l) => {
              const category = l.source.kind === "stat" ? getCategoryBySlug(l.source.category) : null;
              return (
                <GameRow
                  key={l.slug}
                  href={`/lists/${l.slug}`}
                  title={l.hubTitle}
                  meta={l.hubDescription}
                  lead={category ? <StatIcon slug={category.slug} size={24} /> : <Icon name="globe" size={24} />}
                />
              );
            })}
          </section>
        </div>
      </div>

      <SiteFoot />
    </>
  );
}

export function getListBySlug(slug: string): ListContent | null {
  return getList(slug);
}
