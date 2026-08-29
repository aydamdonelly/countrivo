import { getGameBySlug } from "@/lib/data/registry";
import { Mark } from "@/ui/mark";
import { SectionHead } from "@/ui/section-head";
import { isGameSlug, type GameSlug } from "@/ui/types";
import { shotScore } from "./labels";

export interface HeadToHeadProps {
  wins: number;
  losses: number;
  draws: number;
  recent: readonly { gameSlug: string; dailyDate: string; myScore: string; theirScore: string; mySort: number; theirSort: number }[];
}

/** `27 Aug`. */
function dayLabel(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * The same dailies, last 30 days (blueprint 7.16): one line of numbers and up to ten rows.
 * No win and loss colours, no dots: the two scores side by side say it.
 */
export function HeadToHead({ wins, losses, draws, recent }: HeadToHeadProps) {
  if (wins + losses + draws === 0) return null;
  return (
    <section className="sec">
      <SectionHead title="Same dailies, last 30 days" />
      <p className="line t-body">
        you <b className="num">{wins}</b> · them <b className="num">{losses}</b> · {draws} {draws === 1 ? "draw" : "draws"}
      </p>
      <div className="h2h">
        {recent.map((r) => {
          const slug: GameSlug | null = isGameSlug(r.gameSlug) ? r.gameSlug : null;
          const title = getGameBySlug(r.gameSlug)?.title ?? r.gameSlug;
          return (
            <div key={`${r.gameSlug}-${r.dailyDate}`} className="row t-row">
              <span className="lead">{slug ? <Mark slug={slug} size={18} /> : null}</span>
              <span className="nm">
                {title}
                <small className="t-meta">{dayLabel(r.dailyDate)}</small>
              </span>
              <span className="v t-score num">
                {shotScore(r.myScore)}
                <span className="vs t-meta">vs</span>
                <span className="them">{shotScore(r.theirScore)}</span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
