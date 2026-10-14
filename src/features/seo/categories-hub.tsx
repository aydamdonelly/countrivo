import { getAllCategories } from "@/lib/data/categories";
import { getCountryByIso3 } from "@/lib/data/countries";
import { getTopCountries } from "@/lib/data/ranks";
import { CATEGORIES_HUB } from "@/content/hubs";
import { GameRow } from "@/ui/game-row";
import { PageTitle } from "@/ui/page-title";
import { SectionHead } from "@/ui/section-head";
import { SiteFoot } from "@/ui/site-foot";
import { StatIcon } from "@/ui/icons/stat";
import "./seo.css";

/**
 * /categories (blueprint 7.10): the 21 statistics as one list, each row carrying the
 * three flags at the top of that ranking so the page shows the world, not just labels.
 */
export function CategoriesHub() {
  const categories = getAllCategories();

  return (
    <>
      <PageTitle title={CATEGORIES_HUB.h1} meta={`${categories.length} statistics`} />

      <section className="ls">
        <div className="cols2">
          {categories.map((cat) => {
            const top3 = getTopCountries(cat.slug, 3)
              .map((t) => getCountryByIso3(t.iso3))
              .filter((c): c is NonNullable<typeof c> => Boolean(c));
            return (
              <GameRow
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                title={cat.label}
                meta={`${cat.source} ${cat.sourceYear}`}
                lead={<StatIcon slug={cat.slug} size={24} />}
                flags={top3.map((c) => c.iso2)}
              />
            );
          })}
        </div>
      </section>

      <section className="ls">
        <SectionHead title="Test yourself" />
        <GameRow
          slug="higher-or-lower"
          title="Higher or Lower"
          meta="Play"
          href="/games/higher-or-lower"
        />
      </section>

      <SiteFoot />
    </>
  );
}
