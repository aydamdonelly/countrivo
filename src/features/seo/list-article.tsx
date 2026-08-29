import { getCategoryBySlug } from "@/lib/data/categories";
import { getCountriesByContinent, getCountryByIso3 } from "@/lib/data/countries";
import { getStatValue, getTopCountries } from "@/lib/data/ranks";
import { formatStat } from "@/lib/utils";
import { getList, LISTS, type ListContent, type ListFact } from "@/content/lists";
import {
  EditorialHead,
  FactRow,
  GameRow,
  Icon,
  PageTitle,
  QaList,
  RankTable,
  SectionHead,
  SiteFoot,
  StatIcon,
  type Fact,
  type GameSlug,
  type RankRow,
} from "@/ui";
import { breadcrumbList, faqPage, graph, jsonLdProps } from "./breadcrumbs";
import { ListItemJsonLd } from "./list-jsonld";
import "./seo.css";

const PLAY_ROWS: readonly { slug: GameSlug; title: string; meta: string }[] = [
  { slug: "country-draft", title: "Country Draft", meta: "put eight countries on their best stat" },
  { slug: "higher-or-lower", title: "Higher or Lower", meta: "call which country ranks higher" },
  { slug: "population-sort", title: "Population Sort", meta: "put six countries in order" },
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

  const ranked = getTopCountries(categorySlug, STAT_ROWS);
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
    meta: `${rows.length} countries · ${category.source} ${category.sourceYear}`,
    facts,
    faq: [...list.faq],
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
  return {
    value: row.value,
    label: `${row.name}, ${fact.label}`,
    sub: row.unit,
    href: row.href,
  };
}

function buildContinentList(list: ListContent, continent: string, sovereign: number): Built {
  const population = getCategoryBySlug("population");
  const area = getCategoryBySlug("area-km2");
  const countries = getCountriesByContinent(continent)
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
  const biggest = [...countries].sort((a, b) => (b.area ?? 0) - (a.area ?? 0))[0];
  const mostPeople = countries[0];

  const facts: Fact[] = list.quickFacts
    .map((fact): Fact | null => {
      if (fact.kind === "count") return { value: String(rows.length), label: fact.label };
      if (fact.kind === "sum" && population)
        return { value: formatStat(totalPopulation, population.unit), label: fact.label };
      if (fact.kind === "top" && fact.stat === "population" && mostPeople && population)
        return {
          value: formatStat(mostPeople.pop, population.unit),
          label: `${mostPeople.country.displayName}, ${fact.label}`,
          href: `/countries/${mostPeople.country.slug}`,
        };
      if (fact.kind === "top" && fact.stat === "area-km2" && biggest && biggest.area !== null && area)
        return {
          value: formatStat(biggest.area, area.unit),
          label: `${biggest.country.displayName}, ${fact.label}`,
          href: `/countries/${biggest.country.slug}`,
        };
      return null;
    })
    .filter((f): f is Fact => f !== null);

  const faq = list.faq.map((item, i) =>
    i === 0
      ? {
          q: item.q,
          a: `There are ${sovereign} sovereign countries in ${continent === "Americas" ? "the Americas" : continent}; this list also shows the ${rows.length - sovereign} territories Countrivo tracks, ${rows.length} entries in all.`,
        }
      : item,
  );

  return {
    rows,
    number: { value: String(rows.length), caption: list.numberCaption },
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
  const built =
    list.source.kind === "stat"
      ? buildStatList(list, list.source.category)
      : buildContinentList(list, list.source.continent, list.source.sovereign);
  if (!built) return null;

  const intro = list.intro.map((p) => p.replace("{n}", String(built.rows.length)));
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
              title="The ranking"
              fact={list.source.kind === "stat" ? `top ${built.rows.length}` : `${built.rows.length} countries`}
            />
            <RankTable
              rows={built.rows}
              columns={built.columns}
              wide={built.columns === 4}
              caption={list.listName}
            />
          </section>

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
