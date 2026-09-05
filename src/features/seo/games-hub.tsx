import { getAllGames } from "@/lib/data/games";
import Link from "next/link";
import { GAMES_HUB, gamesHubFaq } from "@/content/hubs";
import { gameMeta } from "@/content/games";
import { TOTAL_COUNTRIES } from "@/content/entity";
import { EditorialHead, GameList, PageTitle, Prose, QaList, SiteFoot } from "@/ui";
import type { GameSlug } from "@/ui";
import { faqPage, jsonLdProps, node, SITE_URL } from "./breadcrumbs";
import "./seo.css";

/**
 * /games (blueprint 7.2): three lists and the three hub questions. Every count is read
 * from the registry, so the page cannot claim a game it does not have. Desktop puts the
 * dailies beside the practice games and runs the questions full width underneath.
 */
export function GamesHub() {
  const games = getAllGames();
  const dailies = games.filter((g) => g.availableModes.includes("daily"));
  const mainFirst = [...dailies].sort((a, b) => (a.tier === b.tier ? 0 : a.tier === "main" ? -1 : 1));
  const practiceOnly = games.filter(
    (g) => !g.availableModes.includes("daily") && g.availableModes.includes("practice"),
  );
  const soon = games.filter((g) => g.comingSoon);
  const gameCount = (n: number) => `${n} ${n === 1 ? "game" : "games"}`;
  const faq = gamesHubFaq(games.length, dailies.length);

  const itemList = node({
    "@type": "ItemList",
    name: "Countrivo Geography Games",
    numberOfItems: games.length,
    itemListElement: games.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: g.title,
      url: `${SITE_URL}${g.route}`,
    })),
  });

  return (
    <>
      <script {...jsonLdProps(itemList)} />
      <script {...jsonLdProps(node(faqPage(faq)))} />

      <PageTitle
        title={GAMES_HUB.h1}
        meta={`${gameCount(games.length)} · ${TOTAL_COUNTRIES} countries · one shot a day`}
      />

      <Prose>
        <p>
          Pick a free geography game and play in your browser. Follow distance clues in{" "}
          <Link href="/games/geo-wordle">GeoWordle, the country Wordle</Link>, name the flags
          of the world in <Link href="/games/flag-quiz">Flag Quiz</Link>, or compare country
          statistics in <Link href="/games/higher-or-lower">Higher or Lower</Link>.
          Each daily has the same board for everyone. Practice is unlimited, and no account
          or download is needed.
        </p>
      </Prose>

      <div className="two">
        <div>
          <GameList
            title="Dailies"
            fact={gameCount(dailies.length)}
            rows={mainFirst.map((g) => ({
              slug: g.slug as GameSlug,
              title: g.title,
              meta: gameMeta(g.slug, g.shortDescription),
              href: g.route,
              // The registry's own flag, so a game stops being NEW without a code change.
              ...(g.isNew ? { tag: "NEW" as const } : {}),
            }))}
          />
        </div>
        <div>
          <GameList
            title="Practice only"
            fact={gameCount(practiceOnly.length)}
            rows={practiceOnly.map((g) => ({
              slug: g.slug as GameSlug,
              title: g.title,
              meta: gameMeta(g.slug, g.shortDescription),
              href: g.route,
            }))}
          />
          {soon.length > 0 ? (
            <GameList
              title="In development"
              fact={gameCount(soon.length)}
              rows={soon.map((g) => ({
                slug: g.slug as GameSlug,
                title: g.title,
                meta: "draft 5 people · conquer 195",
                href: g.route,
                tag: "NEW" as const,
              }))}
            />
          ) : null}
        </div>
      </div>

      <EditorialHead title="Questions" />
      <QaList open="details" items={faq.map((f) => ({ q: f.q, a: f.a }))} />

      <SiteFoot />
    </>
  );
}
