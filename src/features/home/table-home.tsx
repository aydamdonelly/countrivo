"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { type GamePresentation } from "@/content/table";
import { Clay } from "@/ui/clay";
import { GameCard } from "@/ui/game-card";
import { ChevronLeftIcon } from "@/ui/icons/chevron-left";
import { ChevronRightIcon } from "@/ui/icons/chevron-right";
import { CheckIcon } from "@/ui/icons/check";
import { ShareButton } from "@/ui/share-button";
import { Countdown } from "@/ui/countdown";

interface TableHomeProps {
  games: readonly GamePresentation[];
  done: Record<string, string>;
  progress: Record<string, string>;
  opening: string;
  dateKey: string;
  resetAt: number;
  serverNow: number;
  practice?: boolean;
  boards?: Record<string, ReactNode>;
  yesterday?: ReactNode;
  atlas?: ReactNode;
}

export function TableHome({ games, done, progress, opening, dateKey, resetAt, serverNow, practice, boards, yesterday, atlas }: TableHomeProps) {
  const deck = useRef<HTMLDivElement>(null);
  const fullSet = !practice && games.every((game) => Boolean(done[game.slug]));
  const [active, setActive] = useState(fullSet ? "fullset" : opening);
  const [dayClosed, setDayClosed] = useState(false);
  const move = (slug: string) => {
    const card = deck.current?.querySelector<HTMLElement>(`[data-game="${slug}"]`);
    if (card && deck.current) deck.current.scrollTo({left: card.offsetLeft - deck.current.offsetLeft, behavior: "smooth"});
    setActive(slug);
  };
  const step = (direction: number) => {
    const index = games.findIndex((game) => game.slug === active);
    const next = games[index + direction];
    if(next) move(next.slug);
  };
  useEffect(() => {
    const cards = deck.current?.querySelectorAll<HTMLElement>("[data-game]");
    if (!deck.current || !cards) return;
    const observer = new IntersectionObserver((entries) => {for(const entry of entries) if(entry.isIntersecting) setActive(entry.target.getAttribute("data-game") ?? opening);}, {root: deck.current, threshold: 0.6});
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [opening]);
  useEffect(() => {
    const id = window.setTimeout(() => setDayClosed(true), Math.max(0, resetAt - serverNow));
    return () => window.clearTimeout(id);
  }, [resetAt, serverNow]);
  const focused = games.find((game) => game.slug === active) ?? games[0];
  return (
    <div className="table-home" onKeyDown={(event) => {
      if(event.target instanceof HTMLElement && event.target.matches("input,textarea,select")) return;
      if(event.key === "ArrowRight") {event.preventDefault(); step(1);}
      if(event.key === "ArrowLeft") {event.preventDefault(); step(-1);}
    }}>
      {dayClosed && !practice ? <div className="rollover"><p>New boards are out.</p><Link href="/" className="btn btn-ink t-cta">See today&apos;s</Link></div> : null}
      <nav className="today-strip" aria-label={practice ? "Practice games" : "Today's games"}>
        {games.map((game) => <button key={game.slug} type="button" onClick={() => move(game.slug)} aria-label={`${game.title}${done[game.slug] ? `, finished, ${done[game.slug]}` : progress[game.slug] ? ", in progress" : ""}`} aria-current={active === game.slug ? "true" : undefined}><Clay object={game.clay} state={game.clay === "cl-08" ? "full" : done[game.slug] ? game.done : "rest"} /><span className="strip-state">{done[game.slug] ? <CheckIcon size={12} /> : progress[game.slug] ? "Playing" : <span className="sr-only">{game.title}</span>}</span></button>)}
      </nav>
      <div className="deck-stage">
        <button className="deck-arrow deck-prev" aria-label="Previous game" disabled={active === "fullset" || active === games[0]?.slug} onClick={() => step(-1)}><ChevronLeftIcon size={24} /></button>
        <div className="game-deck" ref={deck}>
          {fullSet ? <div className="deck-slide full-set" data-game="fullset"><article className="game-tray"><span className="tray-surface" /><Clay object="cl-20" alternate="tip" className="tray-clay" /><div className="tray-content"><h2 className="t-card">Full set</h2><p className="tray-promise">A little more of the world, all in one day.</p>{atlas}<div className="full-set-scores">{games.map((game) => <p key={game.slug}><Clay object={game.clay} state={game.done} /><span>{game.title}</span><b className="t-num">{done[game.slug]}</b></p>)}</div><Countdown resetAt={resetAt} serverNow={serverNow} /><ShareButton text={`Countrivo ${dateKey}\n${games.map((game) => `${game.title}: ${done[game.slug]}`).join("\n")}\ncountrivo.com`} label="Share your day" /></div></article></div> : null}
          {games.map((game) => <div className="deck-slide" data-game={game.slug} key={game.slug}><GameCard game={game} practice={practice} score={done[game.slug]} progress={progress[game.slug]} active={active === game.slug} /></div>)}
        </div>
        <button className="deck-arrow deck-next" aria-label="Next game" disabled={active === games.at(-1)?.slug} onClick={() => step(1)}><ChevronRightIcon size={24} /></button>
      </div>
      <p className="deck-hint t-meta">Swipe for the next game</p>
      <div className="below-deck">
        {practice ? <p className="t-body text-mute">Fresh boards, as many times as you like. Practice never counts on the daily leaderboard.</p> : focused ? <section aria-label={`Today on ${focused.title}`}><h2 className="t-h3">Today on {focused.title}</h2>{boards?.[focused.slug]}<Link href={`/games/${focused.slug}/leaderboard`} className="table-link">See the leaderboard <ChevronRightIcon size={18} /></Link></section> : null}
        {!practice ? yesterday : null}
        <p className="t-body text-mute">Countrivo is six short geography games, new every day at midnight Berlin time. Everyone gets the same boards. No accounts: finish a game and put your name on the leaderboard if you like.</p>
        <nav className="table-subnav" aria-label="Explore Countrivo"><Link href="/countries">World</Link><Link href="/practice">Practice</Link><Link href="/games">All games</Link><Link href="/archive">Past boards</Link></nav>
      </div>
    </div>
  );
}
