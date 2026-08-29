import { AnchorCard, GameList } from "@/ui";
import { DRAFT, type PracticeList as PracticeListData } from "./lists";

export interface PracticePaneProps {
  /** `user_game_stats.total_runs` for Country Draft; 0 or a guest omits the counter. */
  runs: number;
  /** The compact practice best ("790"); null omits the sentence. */
  best: string | null;
  list: PracticeListData;
}

/** The card-fill twin of the anchor (blueprint 3.6): a fresh board every time, nothing counts. */
export function PracticeAnchor({ runs, best }: PracticePaneProps) {
  return (
    <AnchorCard
      variant="practice"
      slug={DRAFT}
      title="A fresh board every time."
      kicker="PRACTICE · COUNTRY DRAFT"
      counter={runs > 0 ? `you've run ${runs}` : null}
      how={
        best
          ? `Your practice best is ${best}. Nothing here touches the leaderboard.`
          : "Nothing here touches the leaderboard."
      }
      cta={{ label: "New board", href: `/games/${DRAFT}/play?mode=practice` }}
    />
  );
}

/** Every playable game except Country Draft, main tier first (blueprint 7.1 item 5). */
export function PracticeList({ list }: PracticePaneProps) {
  return <GameList title="Practice any game" fact={list.counter} factHref="/games" rows={list.rows} fade />;
}
