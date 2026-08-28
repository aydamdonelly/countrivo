import Link from "next/link";
import { GameMark } from "@/components/home/game-mark";

interface GameShellProps {
  title: string;
  backHref: string;
  mode?: string;
  children: React.ReactNode;
}

/** Play-screen frame: back, the game's mark and title, and what this run counts for. */
export function GameShell({ title, backHref, mode, children }: GameShellProps) {
  const slug = backHref.replace(/^\/games\//, "").split("/")[0];
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-between mb-6 gap-3">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-medium text-cream-muted hover:text-cream transition-colors" aria-label={`Back to ${title}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 6l-6 6 6 6" /></svg>
          Back
        </Link>
        <span className="inline-flex items-center gap-2 min-w-0">
          <span className="text-cream shrink-0"><GameMark slug={slug} size={22} /></span>
          <span className="font-display font-semibold text-base truncate">{title}</span>
        </span>
        {mode ? (
          <span className={`text-xs font-medium whitespace-nowrap ${mode === "daily" ? "text-cream" : "text-cream-muted"}`}>
            {mode === "daily" ? "Daily · one shot" : "Practice · doesn't count"}
          </span>
        ) : <span />}
      </div>
      {children}
    </div>
  );
}
