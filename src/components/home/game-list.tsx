import Link from "next/link";
import type { GameMeta } from "@/types/game";
import type { GameBoard } from "@/app/actions/home";
import { GameMark } from "./game-mark";

function Row({ game, meta, href, tag }: { game: GameMeta; meta: string; href: string; tag?: string }) {
  return (
    <Link href={href} className="list-row flex items-center gap-3 py-3 border-t border-border text-cream hover:bg-surface-elevated -mx-2 px-2 rounded-md transition-colors">
      <span className="w-11 flex justify-center text-cream shrink-0"><GameMark slug={game.slug} size={26} /></span>
      <span className="flex-1 min-w-0">
        <span className="block text-base leading-tight">
          {game.title}
          {tag && <em className="not-italic ml-1.5 text-[11px] font-bold text-gold-ink">{tag}</em>}
        </span>
        <small className="block text-xs text-cream-muted truncate">{meta}</small>
      </span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cream-dim shrink-0" aria-hidden><path d="M9 6l6 6-6 6" /></svg>
    </Link>
  );
}

export function DailyList({ games, boards }: { games: GameMeta[]; boards: Record<string, GameBoard> }) {
  return (
    <section className="mt-6" aria-label="More dailies">
      <h3 className="flex justify-between text-xs text-cream-muted mb-1">
        <span>More dailies</span>
        <span>{games.length} games</span>
      </h3>
      {games.map((g) => {
        const b = boards[g.slug];
        const meta = b?.me ? `your shot ${b.me.score} · #${b.me.rank} of ${b.shots}` : b && b.shots > 0 ? `${b.shots} ${b.shots === 1 ? "shot" : "shots"} · top ${b.top}` : "no shots yet today";
        return <Row key={g.slug} game={g} meta={meta} href={b?.me ? g.route : `${g.route}/play?mode=daily`} tag={g.isNew ? "NEW" : undefined} />;
      })}
    </section>
  );
}

export function PracticeList({ games }: { games: GameMeta[] }) {
  return (
    <section className="mt-6" aria-label="Practice any game">
      <h3 className="flex justify-between text-xs text-cream-muted mb-1">
        <span>Practice any game</span>
        <span>{games.length} games</span>
      </h3>
      {games.map((g) => (
        <Row key={g.slug} game={g} meta={g.shortDescription} href={`${g.route}/play?mode=practice`} tag={g.isNew ? "NEW" : undefined} />
      ))}
    </section>
  );
}

export function PracticeHero({ game }: { game: GameMeta }) {
  return (
    <article className="rounded-2xl bg-surface-elevated text-cream p-5 pb-6 relative">
      <div className="flex justify-between text-[11px] tracking-[.02em] text-cream-muted">
        <span>PRACTICE · {game.title.toUpperCase()}</span>
        <span>random board</span>
      </div>
      <h2 className="mt-2 font-display font-semibold text-[28px] leading-tight">A fresh board every time.</h2>
      <p className="mt-2 text-[13px] text-cream-muted max-w-[280px]">Unlimited runs, new countries each time. Nothing here touches the leaderboard.</p>
      <div className="mt-5 flex justify-end">
        <Link href={`${game.route}/play?mode=practice`} className="shoot px-5 py-2.5 rounded-md bg-cream text-bg font-semibold text-[15px]">New board</Link>
      </div>
    </article>
  );
}
