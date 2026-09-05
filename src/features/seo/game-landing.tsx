import Link from "next/link";
import { getGameBySlug } from "@/lib/data/registry";
import { getGameCopy } from "@/lib/seo/game-copy";
import { buildGameJsonLd } from "@/lib/seo/game-metadata";
import { getPublicBoard } from "@/server/boards";
import { gameMeta, getGameContent, relatedSlugs } from "@/content/games";
import {
  AnchorCard,
  Board,
  EditorialHead,
  GameRow,
  GUEST_VIEWER,
  Prose,
  QaList,
  SectionHead,
  SiteFoot,
  type GameSlug,
} from "@/ui";
import { DraftTables } from "./draft-tables";
import { GeoWordleGuide } from "./geo-wordle-guide";
import { EntityBlock } from "./entity-block";
import { GameJsonLd } from "./game-jsonld";
import { faqPage, jsonLdProps, node } from "./breadcrumbs";
import "./seo.css";

/**
 * One game landing (blueprint 7.3): card first, exactly as the home. The card carries the
 * page h1, the public top three sits under it, and the editorial runs below. Nothing on
 * this page is viewer-specific, so it stays static (ISR 60 for the board).
 */
export async function GameLanding({ slug }: { slug: string }) {
  const game = getGameBySlug(slug);
  const content = getGameContent(slug);
  if (!game || !content) return null;

  const copy = getGameCopy(slug);
  const hasDaily = game.availableModes.includes("daily");
  // Country Draft publishes its whole scoring model on this page (SPEC 20.5); it is the
  // only unique content this URL can carry, and it is what makes the page worth reading.
  const isCabinetDraft = slug === "country-draft";
  const isGeoWordle = slug === "geo-wordle";
  const board = hasDaily ? await getPublicBoard(slug) : null;
  const leaderboard = `/games/${slug}/leaderboard`;
  const playDaily = `/games/${slug}/play?mode=daily`;
  const playPractice = `/games/${slug}/play?mode=practice`;
  const related = relatedSlugs(slug)
    .map((s) => getGameBySlug(s))
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  const jsonLd = buildGameJsonLd(slug);

  return (
    <>
      <GameJsonLd
        name={jsonLd.name}
        title={jsonLd.title}
        description={jsonLd.description}
        url={jsonLd.url}
        genre={jsonLd.genre}
        playMode={jsonLd.playMode}
      />
      {copy && copy.faq.length > 0 ? <script {...jsonLdProps(node(faqPage(copy.faq)))} /> : null}

      <div className="split">
        <div className="col">
          <div data-o="1">
            <AnchorCard
              variant="landing"
              slug={slug as GameSlug}
              title={game.title}
              kicker={`${hasDaily ? "DAILY" : "PRACTICE"} · ${game.title.toUpperCase()}`}
              counter={hasDaily ? "resets at midnight Berlin" : "unlimited"}
              how={content.steps ? undefined : content.how}
              steps={content.steps}
              chips={content.chips ?? content.facts}
              cta={{ label: isGeoWordle ? "Play daily" : hasDaily ? "Shoot" : "Play", href: hasDaily ? playDaily : playPractice }}
            />
          </div>

          <div data-o="2" className="under">
            {hasDaily ? (
              <>
                <p className="t-body">
                  or{" "}
                  <Link href={playPractice} className="ilink">
                    {isGeoWordle ? "play unlimited practice" : "practice a board"}
                  </Link>
                  {isGeoWordle ? ". Free, no account needed." : ", it won't count"}
                </p>
                <p className="t-body">
                  One shot per day, same board for everyone, on the global board till midnight Berlin
                  time.{" "}
                  <Link href={leaderboard} prefetch className="ilink">
                    Today&apos;s board
                  </Link>
                </p>
              </>
            ) : (
              <p className="t-body">Random boards, unlimited, nothing counts.</p>
            )}
          </div>

          <section data-o="4" aria-labelledby="how-it-works">
            <EditorialHead id="how-it-works" title="How it works" />
            <ol className="steps-ol t-body">
              {content.rules.slice(0, 4).map((rule, i) => (
                <li key={rule}>
                  <i className="t-num num">{i + 1}</i>
                  <span>{rule}</span>
                </li>
              ))}
            </ol>
          </section>

          {isCabinetDraft ? (
            <div data-o="5">
              <DraftTables />
            </div>
          ) : null}

          {isGeoWordle ? (
            <div data-o="5">
              <GeoWordleGuide />
            </div>
          ) : null}

          {copy && copy.about.length > 0 ? (
            <section data-o="6" aria-labelledby="what-it-is">
              <EditorialHead id="what-it-is" title={`What ${game.title} is`} />
              <Prose paragraphs={copy.about} />
            </section>
          ) : null}

          {copy && copy.faq.length > 0 ? (
            <section data-o="7" aria-labelledby="questions">
              <EditorialHead id="questions" title="Questions" />
              <QaList open="details" items={copy.faq.map((f) => ({ q: f.q, a: f.a }))} />
            </section>
          ) : null}

          <div data-o="9">
            <EntityBlock slug={slug} />
          </div>
        </div>

        <div className="col side pin">
          {board ? (
            <div data-o="3" className="rail-board">
              <Board
                slug={slug as GameSlug}
                title={game.title}
                board={board}
                viewer={GUEST_VIEWER}
                variant="public"
                hrefFull={leaderboard}
                countries={board.countries}
              />
            </div>
          ) : null}

          <section data-o="8" className="ls">
            <SectionHead title="More games" fact={`${related.length} games`} />
            {related.map((g) => (
              <GameRow
                key={g.slug}
                slug={g.slug as GameSlug}
                title={g.title}
                meta={gameMeta(g.slug, g.shortDescription)}
                href={g.route}
              />
            ))}
          </section>
        </div>
      </div>

      <SiteFoot />
    </>
  );
}
