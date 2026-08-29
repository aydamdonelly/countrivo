import type { ReactNode } from "react";
import { PlayBar } from "@/ui/play-bar";
import type { Mode } from "@/ui/types";
import type { PlayableSlug } from "@/games/types";
import "./play.css";

export interface PlayFrameProps {
  slug: PlayableSlug;
  title: string;
  mode: Mode;
  children: ReactNode;
}

/** The play route's frame (blueprint 8.1): the PlayBar, then the host, in one 640/720 column. */
export function PlayFrame({ slug, title, mode, children }: PlayFrameProps) {
  return (
    <div className="play-root play-frame">
      <PlayBar slug={slug} title={title} mode={mode} />
      {children}
    </div>
  );
}
