import { getGameBySlug } from "@/lib/data/registry";
import { getGameCopy } from "@/lib/seo/game-copy";
import { getGameContent } from "@/content/games";
import { AnchorCard, EditorialHead, GameRow, Prose, QaList, SectionHead, SiteFoot } from "@/ui";
import "./seo.css";

/**
 * /games/world-draft (blueprint 7.4): the announced game. The card carries the conquest
 * map instead of chips and has no button, because there is nothing to play yet; the
 * "Meanwhile" row sends the visitor to today's Country Draft instead.
 */
export function WorldDraftPage() {
  const game = getGameBySlug("world-draft");
  const content = getGameContent("world-draft");
  const copy = getGameCopy("world-draft");
  const draft = getGameBySlug("country-draft");
  if (!game || !content) return null;

  return (
    <>
      <AnchorCard
        variant="world"
        slug="world-draft"
        title="World Draft"
        kicker="NEW · IN DEVELOPMENT"
        counter="draft 5 people · conquer 195"
        how={content.how}
        cta={null}
      />

      {draft ? (
        <section className="ls">
          <SectionHead title="Meanwhile" fact="today's board" />
          <GameRow
            slug="country-draft"
            title={draft.title}
            meta="one shot · same board for everyone"
            href="/games/country-draft/play?mode=daily"
            action="Shoot"
            prefetch
          />
        </section>
      ) : null}

      {copy && copy.about.length > 0 ? (
        <section aria-labelledby="what-it-will-be">
          <EditorialHead id="what-it-will-be" title="What World Draft will be" />
          <Prose paragraphs={copy.about} />
        </section>
      ) : null}

      {copy && copy.faq.length > 0 ? (
        <section aria-labelledby="wd-questions">
          <EditorialHead id="wd-questions" title="Questions" />
          <QaList open="details" items={copy.faq.map((f) => ({ q: f.q, a: f.a }))} />
        </section>
      ) : null}

      <SiteFoot />
    </>
  );
}
