import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SectionHead } from "@/ui/section-head";
import { Crest } from "@/ui/crest";

export interface StripFriend {
  username: string;
  /** `you` for the viewer. */
  name: string;
  crest: string | null;
  /** null = not shot yet (wait crest, mute name). */
  score: string | null;
  isMe?: boolean;
}

export interface FriendsStripProps {
  title?: ReactNode;
  /** `3 of 5 have shot` or `you're #2`, ember. */
  fact?: ReactNode;
  factHref?: string;
  friends: readonly StripFriend[];
  /** "Beat <b>610</b> and you're ahead of endy for the day." */
  note?: ReactNode;
  className?: string;
}

/**
 * K4/K5 `friendsK` (blueprint 3.10): a horizontally scrolling row of crest columns,
 * 40 px crests, 11 px names (600 ink) and scores (mute). Waiting = wait crest and
 * mute 500 name; me = ember ring on the crest.
 */
export function FriendsStrip({ title = "Friends today", fact, factHref, friends, note, className }: FriendsStripProps) {
  return (
    <section className={cn("fr", className)}>
      <SectionHead variant="strip" title={title} fact={fact} href={factHref} live />
      <div className="r">
        {friends.map((f) => {
          const waiting = f.score === null;
          return (
            <Link key={f.username} href={`/profile/${f.username}`} className={cn(waiting && "wait", f.isMe && "me")}>
              <Crest path={f.crest} size={40} muted={waiting} ring={f.isMe} />
              <b className="t-kicker">{f.name}</b>
              <i className="t-kicker">{f.score ?? "not yet"}</i>
            </Link>
          );
        })}
      </div>
      {note ? <p className="t-body">{note}</p> : null}
    </section>
  );
}
