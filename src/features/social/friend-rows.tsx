"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { removeFriend, respondToFriendRequest } from "@/app/actions/friends";
import { Button } from "@/ui/button";
import { Crest } from "@/ui/crest";
import { Mark } from "@/ui/mark";
import { SectionHead } from "@/ui/section-head";
import { useToast } from "@/ui/toast";
import { MinusIcon } from "@/ui/icons/minus";
import type { GameSlug } from "@/ui/types";

export interface FriendShot {
  slug: GameSlug;
  /** The short game word beside the mark (`draft`, `hol`, `wordle`). */
  label: string;
  score: string;
}

export interface FriendItem {
  friendshipId: number;
  username: string;
  name: string;
  crest: string | null;
  streak: number;
  shots: readonly FriendShot[];
}

export interface RequestItem {
  friendshipId: number;
  username: string;
  name: string;
  crest: string | null;
}

/** `3 shots today · streak 9`, `not played today`. */
function friendMeta(f: FriendItem): string {
  const parts: string[] = [];
  parts.push(f.shots.length === 0 ? "not played today" : f.shots.length === 1 ? "1 shot today" : `${f.shots.length} shots today`);
  if (f.streak > 0) parts.push(`streak ${f.streak}`);
  return parts.join(" · ");
}

/**
 * Incoming friend requests (blueprint 7.14): crest, name, Accept and Decline. Both answers
 * run in a transition and remove the row at once; a failure puts it back.
 */
export function FriendRequests({ requests }: { requests: readonly RequestItem[] }) {
  const router = useRouter();
  const [gone, setGone] = useState<readonly number[]>([]);
  const [pending, startTransition] = useTransition();
  const open = requests.filter((r) => !gone.includes(r.friendshipId));
  if (open.length === 0) return null;

  /* The row leaves at once; the refresh brings the rest of the page (the strip, the counts,
     the friends list) back in step with the server. */
  function answer(id: number, accept: boolean) {
    setGone((g) => [...g, id]);
    startTransition(async () => {
      const res = await respondToFriendRequest(id, accept);
      if (res.success) router.refresh();
      else setGone((g) => g.filter((x) => x !== id));
    });
  }

  return (
    <section className="sec">
      <SectionHead title="Requests" fact={String(open.length)} />
      {open.map((r) => (
        <div key={r.friendshipId} className="prow t-row">
          <Crest path={r.crest} size={26} label={r.name} />
          <span className="who">
            <span className="nm">{r.name}</span>
            <span className="sub t-meta">@{r.username}</span>
          </span>
          <span className="acts">
            <Button onClick={() => answer(r.friendshipId, true)} disabled={pending}>
              Accept
            </Button>
            <Button variant="text" onClick={() => answer(r.friendshipId, false)} disabled={pending}>
              Decline
            </Button>
          </span>
        </div>
      ))}
    </section>
  );
}

/**
 * The friends list (blueprint 7.14): crest 40, the name, the meta line, the day's shots as
 * mark and score pairs, and a 44 px Remove control. Removal is optimistic and toasts.
 */
export function FriendRows({ friends }: { friends: readonly FriendItem[] }) {
  const router = useRouter();
  const [gone, setGone] = useState<readonly number[]>([]);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const rows = friends.filter((f) => !gone.includes(f.friendshipId));

  function drop(f: FriendItem) {
    setGone((g) => [...g, f.friendshipId]);
    startTransition(async () => {
      const res = await removeFriend(f.friendshipId);
      if (res.success) {
        toast("Removed");
        router.refresh();
      } else {
        setGone((g) => g.filter((x) => x !== f.friendshipId));
      }
    });
  }

  return (
    <section className="sec">
      <SectionHead title="Friends" fact={String(rows.length)} />
      {rows.length === 0 ? (
        <p className="empty-row t-body">No friends yet. Search for players above to add them.</p>
      ) : (
        rows.map((f) => (
          <div key={f.friendshipId} className="prow t-list">
            <Crest path={f.crest} size={40} label={f.name} />
            <span className="who">
              <Link href={`/profile/${f.username}`} className="nm">
                {f.name}
              </Link>
              <span className="sub t-meta">{friendMeta(f)}</span>
              {f.shots.length > 0 ? (
                <span className="shots t-meta">
                  {f.shots.map((s) => (
                    <Link key={s.slug} href={`/games/${s.slug}/leaderboard?tab=friends`}>
                      <Mark slug={s.slug} size={18} />
                      {s.label}
                      <b className="t-score num">{s.score}</b>
                    </Link>
                  ))}
                </span>
              ) : null}
            </span>
            <button type="button" className="icon-btn" onClick={() => drop(f)} disabled={pending} aria-label={`Remove ${f.name}`}>
              <MinusIcon size={22} />
            </button>
          </div>
        ))
      )}
    </section>
  );
}
