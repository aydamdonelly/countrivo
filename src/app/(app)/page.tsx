import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getHomeData } from "@/app/actions/home";
import { getAllGames } from "@/lib/data/games";
import { getClock } from "@/server/clock";
import { getEdition } from "@/server/edition";
import { getPracticeMetas } from "@/server/home-lists";
import { readDone } from "@/server/progress";
import { getViewer } from "@/server/viewer";
import type { AnchorResult, BoardTab, StripFriend } from "@/ui";
import { HomePage } from "@/features/home/home-page";
import {
  boardCounter,
  buildDailyLists,
  buildPracticeList,
  buildStrip,
  DRAFT,
  DRAFT_CHIPS,
  friendRankOf,
  MODE_COOKIE,
  readMode,
  shotOf,
  stripFact,
  stripTarget,
} from "@/features/home/lists";

/*
 * The home (blueprint 7.1): the arcade you land on. One pass on the server, both modes in the
 * HTML, no Suspense and no loading state; the switch, the anchor card, the one board with the
 * always-present `you` row and the two lists are the whole loop, on one screen.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Countrivo: Free Geography Games & Daily Country Puzzles" },
  description:
    "Play Country Draft, GeoWordle, Flag Quiz and more free geography games. A new puzzle every day, unlimited practice, no signup or download.",
  alternates: { canonical: "https://countrivo.com" },
};

const GAMES = getAllGames();

const ITEM_LIST_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Countrivo Geography Games",
  numberOfItems: GAMES.length,
  itemListElement: GAMES.map((g, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: g.title,
    url: `https://countrivo.com${g.route}`,
  })),
});

interface Props {
  searchParams: Promise<{ mode?: string; tab?: string }>;
}

export default async function Home({ searchParams }: Props) {
  // getViewer is cached per request, so this is the (app) layout's call, not a second one.
  const viewer = await getViewer();
  const [data, clock, edition, cookieStore, practiceMetas, params] = await Promise.all([
    getHomeData(),
    getClock(),
    getEdition(),
    cookies(),
    getPracticeMetas(viewer),
    searchParams,
  ]);

  // The proxy answers `GET /?mode=` with a redirect that sets the cookie, so the cookie is
  // normally the only source; the query is honoured when it reaches the page all the same.
  const mode = params.mode === "daily" || params.mode === "practice" ? params.mode : readMode(cookieStore.get(MODE_COOKIE)?.value);
  const tab: BoardTab = params.tab === "friends" ? "friends" : "global";

  const done = readDone(cookieStore, clock.dateKey, edition);
  const board = data.boards[DRAFT];
  const shot = shotOf(DRAFT, data.boards, done);
  const friends = board?.friends ?? [];

  const result: AnchorResult | null = shot
    ? {
        score: shot.score,
        globalRank: shot.rank,
        globalShots: board?.shots ?? 0,
        friendRank: friendRankOf(friends),
        friendCount: data.friendCount,
      }
    : null;

  const strip: StripFriend[] =
    viewer.signedIn && data.friendCount > 0 ? await buildStrip(friends, viewer.profile?.username ?? null) : [];

  const draftStats = practiceMetas[DRAFT];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ITEM_LIST_JSON_LD }} />
      <h1 className="sr-only">Countrivo: daily geography games</h1>
      <HomePage
        mode={mode}
        daily={{
          viewer,
          tab,
          board: board ?? { slug: DRAFT, shots: 0, top: null, global: [], me: null, friends: [] },
          counter: boardCounter(board),
          chips: DRAFT_CHIPS,
          result,
          lists: buildDailyLists(data.boards, done),
          strip,
          stripFact: stripFact(friends),
          target: stripTarget(friends),
        }}
        practice={{
          runs: draftStats?.runs ?? 0,
          best: draftStats && draftStats.runs > 0 ? draftStats.best : null,
          list: buildPracticeList(practiceMetas, viewer.signedIn),
        }}
      />
    </>
  );
}
