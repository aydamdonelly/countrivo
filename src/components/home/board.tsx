"use client";

import { useState } from "react";
import Link from "next/link";
import type { GameBoard } from "@/app/actions/home";
import { useAuth } from "@/components/auth/auth-provider";

type Tab = "global" | "friends";

function CrestDot({ d, label, muted }: { d: string | null; label: string; muted?: boolean }) {
  return (
    <span className={`inline-flex items-center justify-center w-[26px] h-[26px] rounded-full shrink-0 ${muted ? "bg-cream-dim" : "bg-cream"} text-bg`} aria-hidden>
      {d ? (
        <svg viewBox="0 0 100 100" width="16" height="16"><path d={d} fill="currentColor" /></svg>
      ) : (
        <span className="text-[11px] font-semibold font-display leading-none">{label.slice(0, 1).toUpperCase()}</span>
      )}
    </span>
  );
}

function Flag({ iso2, label }: { iso2: string | null; label: string }) {
  if (!iso2) return <CrestDot d={null} label={label} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/flags/${iso2}.svg`} alt="" width={26} height={18} className="w-[26px] h-[18px] rounded-[3px] object-cover" loading="lazy" />;
}

/**
 * Today's board for the active game. Global shows real origin flags; Friends
 * shows crests (everyone in a friend group tends to live in the same country).
 */
export function Board({ board, title, signedIn, friendCount, meCrest = null }: { board: GameBoard; title: string; signedIn: boolean; friendCount: number; meCrest?: string | null }) {
  const [tab, setTab] = useState<Tab>("global");
  const { openAuthModal } = useAuth();
  const meInTop = board.global.some((r) => r.isMe);

  return (
    <section className="mt-5 lg:mt-0" aria-label={`Today's board for ${title}`}>
      <div className="flex items-baseline gap-4 text-[13px] text-cream-muted border-b border-border">
        {(["global", "friends"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`relative pb-2 -mb-px capitalize transition-colors ${tab === t ? "text-cream font-semibold" : "hover:text-cream"}`}
          >
            {t}
            <span className={`absolute left-0 right-0 -bottom-px h-0.5 bg-cream rounded-full origin-left transition-transform duration-300 ease-[var(--ease-emphasis)] ${tab === t ? "scale-x-100" : "scale-x-0"}`} aria-hidden />
          </button>
        ))}
        <span className="ml-auto text-xs font-semibold text-gold-ink tabular-nums">
          {board.shots === 1 ? "1 shot" : `${board.shots} shots`} today
        </span>
      </div>

      <div key={`${board.slug}-${tab}`} className="board-rows">
        {tab === "global" ? (
          <>
            {board.global.length === 0 && (
              <p className="py-4 text-sm text-cream-muted">No shots yet today. Be the first.</p>
            )}
            {board.global.map((r) => (
              <div key={r.userId} className={`grid grid-cols-[18px_26px_1fr_auto] items-center gap-2.5 py-2 text-sm border-t border-border first:border-t-0 ${r.isMe ? "bg-surface-elevated -mx-2 px-2 rounded-md" : ""}`}>
                <i className="not-italic text-xs text-cream-muted tabular-nums">{r.rank}</i>
                <Flag iso2={r.flag} label={r.name} />
                <span className="truncate">{r.isMe ? "you" : r.name}</span>
                <b className="font-display font-semibold tabular-nums">{r.score}</b>
              </div>
            ))}
            {!meInTop && (
              <div className="grid grid-cols-[18px_26px_1fr_auto] items-center gap-2.5 py-2 text-sm bg-surface-elevated -mx-2 px-2 rounded-md mt-1">
                <i className="not-italic text-xs text-cream-muted tabular-nums">{board.me ? board.me.rank : "–"}</i>
                <CrestDot d={meCrest} label={signedIn ? "you" : "?"} muted={!signedIn} />
                <span>you</span>
                {board.me ? (
                  <b className="font-display font-semibold tabular-nums">{board.me.score}</b>
                ) : (
                  <span className="text-xs text-cream-muted">no shot yet</span>
                )}
              </div>
            )}
          </>
        ) : !signedIn ? (
          <div className="py-4 text-sm text-cream-muted">
            <p>See how your friends shot today.</p>
            <button type="button" onClick={() => openAuthModal()} className="mt-2 text-cream font-semibold underline underline-offset-4">Sign in</button>
          </div>
        ) : friendCount === 0 ? (
          <div className="py-4 text-sm text-cream-muted">
            <p>No friends yet. Add a few and today&apos;s shots line up here.</p>
            <Link href="/friends" className="mt-2 inline-block text-cream font-semibold underline underline-offset-4">Add friends</Link>
          </div>
        ) : (
          board.friends.map((f, i) => (
            <div key={f.userId} className={`grid grid-cols-[18px_26px_1fr_auto] items-center gap-2.5 py-2 text-sm border-t border-border first:border-t-0 ${f.isMe ? "bg-surface-elevated -mx-2 px-2 rounded-md" : ""}`}>
              <i className="not-italic text-xs text-cream-muted tabular-nums">{f.score ? i + 1 : "–"}</i>
              <CrestDot d={f.crest} label={f.name} muted={!f.score} />
              <span className={`truncate ${f.score ? "" : "text-cream-muted"}`}>{f.name}</span>
              {f.score ? (
                <b className="font-display font-semibold tabular-nums">{f.score}</b>
              ) : (
                <span className="text-xs text-cream-muted">not yet</span>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
