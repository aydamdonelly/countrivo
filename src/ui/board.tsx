"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import type { BoardRow, FriendRow, GameBoard } from "@/app/actions/home";
import { cn } from "@/lib/utils";
import { Flag } from "@/ui/flag";
import { Crest } from "@/ui/crest";
import { ArrowUpRightIcon } from "@/ui/icons/arrow-up-right";
import { BoardRowView, ScoreCell } from "@/ui/board-row";
import { requestAuth, type BoardTab, type GameSlug, type Viewer } from "@/ui/types";

/** A global row may carry its run id (leaderboards); the home rows do not. */
export type BoardRowWithRun = BoardRow & { runId?: number | null };
export type FriendRowWithRun = FriendRow & { runId?: number | null };
export type BoardData = Omit<GameBoard, "global" | "friends"> & { global: BoardRowWithRun[]; friends: FriendRowWithRun[] };

export interface BoardProps {
  slug: GameSlug;
  title: string;
  board: BoardData;
  viewer: Viewer;
  initialTab?: BoardTab;
  /** `full` = tabs, me-row, empty states; `public` = the static landing's top 3. */
  variant?: "full" | "public";
  /** Where `Full board` goes. */
  hrefFull: string;
  /** Global rows (default the top 3; the leaderboard passes 50). */
  limit?: number;
  /** Friends rows; every friend by default (the pane is the friends list). */
  friendsLimit?: number;
  /** Public variant: distinct countries among the day's runs. */
  countries?: number;
  /** The `Full board` foot (blueprint 3.7): shown when shots > 3 unless the page turns it off (K3's fold has none). */
  foot?: boolean;
  className?: string;
}

/** `41 shots`, `1 shot`, `no shots yet`. */
export function shotsLabel(n: number): string {
  if (n === 0) return "no shots yet";
  return n === 1 ? "1 shot" : `${n} shots`;
}

function runHref(slug: GameSlug, runId: number | null | undefined): string | undefined {
  return runId ? `/games/${slug}/run/${runId}` : undefined;
}

/**
 * The identity cell of a global row: the shooter's flag. A shooter who has not chosen a
 * country has no flag, and a flag is never faked or left as an empty box, so that row
 * wears the seed crest, the same answer the me-row gives (blueprint 5.2). The viewer's
 * own row always wears their crest.
 */
function globalIdentity(row: BoardRowWithRun, viewerCrest: string | null) {
  if (row.isMe) return <Crest path={viewerCrest} size={26} label="you" />;
  if (row.flag) return <Flag iso2={row.flag} size="xs" alt="" />;
  return <Crest path={null} size={24} />;
}

/**
 * The K3 signature (blueprint 3.7): one list with Global and Friends as tabs, the top
 * rows, and the me-row always present and last. Both panes are in the HTML; the tab
 * links work without JS and the client swaps the panes in place.
 */
export function Board({ slug, title, board, viewer, initialTab = "global", variant = "full", hrefFull, limit = 3, friendsLimit, countries, foot = true, className }: BoardProps) {
  const [tab, setTab] = useState<BoardTab>(initialTab);

  function swap(next: BoardTab, e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    setTab(next);
    window.history.replaceState(window.history.state, "", `?tab=${next}`);
  }

  const meCrest = <Crest path={variant === "public" ? null : viewer.crest} size={26} label={variant === "public" ? undefined : "you"} />;
  const noShot = <b className="nos t-meta">no shot yet</b>;

  /* ── global pane ─────────────────────────────────────────────────────── */
  const globalRows = board.global.slice(0, limit);
  const meInGlobal = globalRows.some((r) => r.isMe);
  const globalPane = (
    <>
      {globalRows.length === 0 ? <p className="empty t-body">No shots yet today. Be the first.</p> : null}
      {globalRows.map((r) => (
        <BoardRowView
          key={r.userId}
          rank={r.rank}
          identity={globalIdentity(r, viewer.crest)}
          name={r.isMe ? "you" : r.name}
          score={<ScoreCell>{r.score}</ScoreCell>}
          me={r.isMe}
          href={runHref(slug, r.runId)}
          prefetch={r.runId ? true : undefined}
        />
      ))}
      {meInGlobal ? null : variant === "public" ? (
        <BoardRowView rank={null} identity={meCrest} name="you" score={<b className="nos t-meta">sign in to see your shot</b>} me href={`/games/${slug}/leaderboard`} prefetch />
      ) : board.me ? (
        <BoardRowView rank={board.me.rank} identity={meCrest} name="you" score={<ScoreCell>{board.me.score}</ScoreCell>} me />
      ) : (
        <BoardRowView rank={null} identity={meCrest} name="you" score={noShot} me />
      )}
    </>
  );

  /* ── friends pane ────────────────────────────────────────────────────── */
  const others = board.friends.filter((f) => !f.isMe);
  const played = others.filter((f) => f.score !== null).length;
  const meFriend = board.friends.find((f) => f.isMe);
  const ordered = [...board.friends.filter((f) => !(f.isMe && f.score === null))];
  const friendsFact = viewer.signedIn && others.length > 0 ? `${played} of ${others.length} have shot` : null;
  const friendsPane = (
    <>
      {!viewer.signedIn ? (
        <p className="empty t-body">
          See how your friends shot today.{" "}
          <button type="button" onClick={() => requestAuth("friends")}>
            Sign in
          </button>
        </p>
      ) : others.length === 0 ? (
        <p className="empty t-body">
          No friends yet. <Link href="/friends">Add a few</Link>
          {" "}and today&apos;s shots line up here.
        </p>
      ) : null}
      {viewer.signedIn
        ? (friendsLimit ? ordered.slice(0, friendsLimit) : ordered).map((f, i) => {
            const waiting = f.score === null;
            return (
              <BoardRowView
                key={f.userId}
                rank={waiting ? null : i + 1}
                identity={<Crest path={f.crest} size={26} muted={waiting} label={f.isMe ? "you" : f.name} />}
                name={f.isMe ? "you" : f.name}
                score={waiting ? <span className="later t-meta">not yet</span> : <ScoreCell>{f.score}</ScoreCell>}
                me={f.isMe}
                wait={waiting && !f.isMe}
                href={runHref(slug, f.runId)}
                prefetch={f.runId ? true : undefined}
              />
            );
          })
        : null}
      {meFriend && meFriend.score !== null ? null : <BoardRowView rank={null} identity={meCrest} name="you" score={noShot} me />}
    </>
  );

  /* ── public variant: no tabs ─────────────────────────────────────────── */
  if (variant === "public") {
    const distinct = countries ?? new Set(board.global.map((r) => r.flag).filter(Boolean)).size;
    return (
      <section className={cn("gb", className)} aria-label={`${title}, today's board`}>
        <h3 className="head t-meta">
          <span>Today · global</span>
          <span>{board.shots === 0 ? "no shots yet" : `${shotsLabel(board.shots)} · ${distinct} ${distinct === 1 ? "country" : "countries"}`}</span>
        </h3>
        {globalPane}
      </section>
    );
  }

  const ids = { global: `board-${slug}-global`, friends: `board-${slug}-friends` };
  return (
    <section className={cn("gb", className)} aria-label={`${title}, today's board`}>
      <div className="tabs t-body" role="tablist" aria-label="Global or friends">
        <a href="?tab=global" role="tab" id={`${ids.global}-tab`} aria-selected={tab === "global"} aria-controls={ids.global} onClick={(e) => swap("global", e)}>
          Global
        </a>
        <a href="?tab=friends" role="tab" id={`${ids.friends}-tab`} aria-selected={tab === "friends"} aria-controls={ids.friends} onClick={(e) => swap("friends", e)}>
          Friends
        </a>
        {tab === "global" ? <em>{shotsLabel(board.shots)}</em> : friendsFact ? <em>{friendsFact}</em> : null}
      </div>
      <div id={ids.global} role="tabpanel" aria-labelledby={`${ids.global}-tab`} hidden={tab !== "global"}>
        {globalPane}
      </div>
      <div id={ids.friends} role="tabpanel" aria-labelledby={`${ids.friends}-tab`} hidden={tab !== "friends"}>
        {friendsPane}
      </div>
      {foot && board.shots > 3 ? (
        <div className="gb-foot">
          <Link href={hrefFull} prefetch className="t-meta">
            Full board
            <ArrowUpRightIcon size={14} />
          </Link>
        </div>
      ) : null}
    </section>
  );
}
