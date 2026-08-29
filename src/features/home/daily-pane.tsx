import { AnchorCard, Board, FriendsStrip, GameList } from "@/ui";
import type { AnchorResult, BoardData, BoardTab, StripFriend, Viewer } from "@/ui";
import { DRAFT, DRAFT_HOW, DRAFT_TITLE, type DailyLists as DailyListData } from "./lists";

export interface DailyPaneProps {
  viewer: Viewer;
  /** The board's opening tab, from `?tab=`. */
  tab: BoardTab;
  board: BoardData;
  /** The kicker's right side before the shot: `41 shots · top 635` or `no shots yet`. */
  counter: string;
  /** The eight chip labels of today's draft. */
  chips: readonly string[];
  /** Present once the viewer has shot: the card becomes the post variant. */
  result: AnchorResult | null;
  lists: DailyListData;
  /** Desktop rail only; empty for guests and for viewers without friends. */
  strip: readonly StripFriend[];
  stripFact: string;
  /** "Beat 610 and you're ahead of endy for the day." */
  target: { name: string; score: string } | null;
}

/** The ink card: today's draft before the shot, the score and the ranks after it (blueprint 3.6). */
export function DailyAnchor({ counter, chips, result }: DailyPaneProps) {
  if (result) {
    return (
      <AnchorCard
        variant="post"
        slug={DRAFT}
        title={DRAFT_TITLE}
        kicker="TODAY · YOUR SHOT"
        counter="holds till 00:00"
        result={result}
        cta={null}
      />
    );
  }
  return (
    <AnchorCard
      variant="pre"
      slug={DRAFT}
      title={DRAFT_TITLE}
      kicker="TODAY · COUNTRY DRAFT"
      counter={counter}
      how={DRAFT_HOW}
      chips={chips}
      cta={{ label: "Shoot", href: `/games/${DRAFT}/play?mode=daily` }}
    />
  );
}

/** The one board, Global and Friends, with the always-present `you` row (blueprint 3.7). */
export function DailyRail({ viewer, tab, board, strip, stripFact, target }: DailyPaneProps) {
  return (
    <>
      <p className="home-rail-head t-meta">Today · {DRAFT_TITLE}</p>
      <Board
        slug={DRAFT}
        title={DRAFT_TITLE}
        board={board}
        viewer={viewer}
        initialTab={tab}
        hrefFull={`/games/${DRAFT}/leaderboard`}
      />
      {strip.length > 0 ? (
        <FriendsStrip
          className="home-strip"
          friends={strip}
          fact={stripFact}
          note={
            target ? (
              <>
                Beat <b>{target.score}</b> and you&apos;re ahead of {target.name} for the day.
              </>
            ) : undefined
          }
        />
      ) : null}
    </>
  );
}

/** More dailies (World Draft first) and the drills, with the metas of 10.4. */
export function DailyLists({ lists }: DailyPaneProps) {
  return (
    <>
      <GameList title="More dailies" fact={lists.moreCounter} factHref="/games" rows={lists.more} />
      <GameList title="Drills" fact={lists.drillsCounter} factHref="/games" rows={lists.drills} fade />
    </>
  );
}
