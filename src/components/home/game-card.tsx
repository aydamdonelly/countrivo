import Link from "next/link";
import type { GameMeta } from "@/types/game";
import type { GameBoard } from "@/app/actions/home";
import { getSilhouettePath } from "@/lib/silhouettes";
import { Silhouette } from "./silhouette";
import { GameMark } from "./game-mark";

/** One line that says what you actually do. Registry copy is marketing; this is instructions. */
const HOW: Record<string, string> = {
  "country-draft": "Countries appear one at a time. Put each on the stat where it ranks highest in the world. Eight picks, one shot.",
  "higher-or-lower": "Two countries, one stat. Which ranks higher? Keep the streak alive.",
  "stat-guesser": "Five countries, five stats. Guess the exact number. Closest wins.",
  "geo-wordle": "One hidden country. Six guesses. Every miss tells you distance and direction.",
  "cluster": "Sixteen countries, four hidden groups of four. Find what connects them.",
  "risk-zone": "Answer, bank, or push your luck. One wrong call and the pot is gone.",
  "world-draft": "Draft five people. Give each a role. See how many of 195 countries your cabinet can take.",
};

function Art({ slug }: { slug: string }) {
  const sil = (iso: string, size: number, cls = "") => {
    const d = getSilhouettePath(iso);
    return d ? <Silhouette d={d} size={size} className={cls} /> : null;
  };
  switch (slug) {
    case "higher-or-lower":
      return (
        <div className="flex items-center gap-4 text-bg/90">
          {sil("NOR", 44)}
          <span className="font-display text-2xl text-bg/50">?</span>
          {sil("ARG", 44)}
        </div>
      );
    case "geo-wordle": {
      const d = getSilhouettePath("MDG");
      return (
        <div className="flex items-center gap-4 text-bg/90">
          {d && <Silhouette d={d} size={46} dashed />}
          <div className="grid grid-cols-6 gap-1" aria-hidden>
            {Array.from({ length: 6 }).map((_, i) => <span key={i} className={`w-3.5 h-3.5 rounded-sm ${i < 2 ? "bg-bg/70" : "bg-bg/15"}`} />)}
          </div>
        </div>
      );
    }
    case "cluster": {
      const isos = ["ITA", "JPN", "CHL", "NOR", "BRA", "EGY", "KEN", "PER", "IND", "AUS", "FRA", "MEX", "THA", "SWE", "NGA", "CAN"];
      return (
        <div className="grid grid-cols-8 gap-1.5 text-bg/80" aria-hidden>
          {isos.map((iso, i) => <span key={iso} className={i % 4 === 0 ? "text-bg" : "text-bg/45"}>{sil(iso, 18)}</span>)}
        </div>
      );
    }
    case "stat-guesser":
      return (
        <div className="flex items-end gap-1.5 h-10 text-bg" aria-hidden>
          {[40, 70, 100, 55, 25].map((h, i) => <span key={i} className={`w-3 rounded-sm ${i === 2 ? "bg-bg" : "bg-bg/35"}`} style={{ height: `${h}%` }} />)}
          <span className="ml-2 text-xs text-bg/60 self-center">closest wins</span>
        </div>
      );
    case "risk-zone":
      return (
        <div className="flex items-center gap-3 text-bg" aria-hidden>
          <GameMark slug="risk-zone" size={40} />
          <span className="text-xs text-bg/60">bank it or push it</span>
        </div>
      );
    case "world-draft": {
      const isos = ["BRA", "NGA", "AUS", "JPN", "CHL", "DEU", "CAN", "IND"];
      return (
        <div className="flex items-center gap-2 text-bg" aria-hidden>
          {isos.map((iso, i) => <span key={iso} className={i < 3 ? "text-gold-ink" : "text-bg/35"}>{sil(iso, 26)}</span>)}
        </div>
      );
    }
    default:
      return null;
  }
}

export function GameCard({ game, board, categories, comingSoon = false }: { game: GameMeta; board?: GameBoard; categories?: string[]; comingSoon?: boolean }) {
  const played = board?.me ?? null;
  const shots = board?.shots ?? 0;
  const top = board?.top ?? null;
  const kickerRight = comingSoon ? "IN DEVELOPMENT" : played ? "holds till 00:00" : `${shots} ${shots === 1 ? "shot" : "shots"}${top ? ` · top ${top}` : ""}`;

  return (
    <article className="relative w-full rounded-2xl bg-cream text-bg p-5 pb-6 min-h-[300px] flex flex-col overflow-hidden">
      <div className="flex justify-between text-[11px] tracking-[.02em] text-bg/60">
        <span>{comingSoon ? "NEW" : played ? "TODAY · YOUR SHOT" : `TODAY · ${game.title.toUpperCase()}`}</span>
        <span className="tabular-nums">{kickerRight}</span>
      </div>

      {played ? (
        <>
          <div className="mt-3 flex items-center gap-4">
            <b className="font-display font-semibold text-[56px] leading-none tabular-nums">{played.score}</b>
            <span className="text-[13px] text-bg/65 leading-relaxed">
              <em className="not-italic text-bg font-semibold">#{played.rank}</em> of {shots} global
              {board && board.friends.some((f) => !f.isMe) && (
                <><br /><em className="not-italic text-bg font-semibold">#{board.friends.filter((f) => f.score).findIndex((f) => f.isMe) + 1 || "–"}</em> of {board.friends.length} friends</>
              )}
            </span>
          </div>
          <p className="mt-4 text-[13px] text-bg/65">Bad day? <Link href={`${game.route}/play?mode=practice`} className="text-bg underline underline-offset-4">Practice a board</Link>, it won&apos;t count.</p>
          <span className="mt-auto pt-3 flex items-center gap-2 text-bg/90 font-display text-lg">{game.title}</span>
        </>
      ) : (
        <>
          <h2 className="mt-2 font-display font-semibold text-[28px] leading-tight">{game.title}</h2>
          <p className="mt-2 text-[13px] leading-snug text-bg/70 max-w-[300px]">{HOW[game.slug] ?? game.description}</p>
          {game.slug === "country-draft" && categories && categories.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5 pr-24">
              {categories.map((c) => (
                <span key={c} className="text-[11px] px-2 py-1 rounded bg-bg/10 text-bg/85">{c}</span>
              ))}
            </div>
          ) : (
            <div className="mt-4"><Art slug={game.slug} /></div>
          )}
          <div className="mt-auto pt-4 flex justify-end">
            {comingSoon ? (
              <Link href={game.route} className="px-4 py-2.5 rounded-md bg-bg/15 text-bg font-semibold text-sm">What it will be</Link>
            ) : (
              <Link href={`${game.route}/play?mode=daily`} className="shoot px-5 py-2.5 rounded-md bg-bg text-cream font-semibold text-[15px]">Shoot</Link>
            )}
          </div>
        </>
      )}
    </article>
  );
}
