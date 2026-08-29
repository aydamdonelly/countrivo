import { getCategoryBySlug } from "@/lib/data/categories";
import { LISTS } from "@/content/lists";
import { LISTS_HUB, LISTS_INTRO } from "@/content/hubs";
import { GameRow, Icon, PageTitle, Prose, SectionHead, SiteFoot, StatIcon } from "@/ui";
import "./seo.css";

/**
 * /lists (blueprint 7.12): the 15 curated rankings. The lead mark says what a list is
 * made of, the stat icon for a ranking and the globe for a continent.
 */
export function ListsHub() {
  return (
    <>
      <PageTitle title={LISTS_HUB.h1} meta={`${LISTS.length} curated rankings`} />
      <Prose paragraphs={LISTS_INTRO} />

      <section className="ls">
        {LISTS.map((list) => {
          const category = list.source.kind === "stat" ? getCategoryBySlug(list.source.category) : null;
          return (
            <GameRow
              key={list.slug}
              href={`/lists/${list.slug}`}
              title={list.hubTitle}
              meta={list.hubDescription}
              lead={category ? <StatIcon slug={category.slug} size={24} /> : <Icon name="globe" size={24} />}
            />
          );
        })}
      </section>

      <section className="ls">
        <SectionHead title="Test yourself" fact="4 games" />
        <GameRow slug="flag-quiz" title="Flag Quiz" meta="10 flags · 4 options" href="/games/flag-quiz" />
        <GameRow slug="country-draft" title="Country Draft" meta="8 picks, one shot" href="/games/country-draft" />
        <GameRow
          slug="higher-or-lower"
          title="Higher or Lower"
          meta="two countries, one stat"
          href="/games/higher-or-lower"
        />
        <GameRow
          href="/games"
          title="All games"
          meta="every daily and every drill"
          lead={<Icon name="play" size={24} />}
        />
      </section>

      <SiteFoot />
    </>
  );
}
