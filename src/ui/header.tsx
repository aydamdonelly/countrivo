import Link from "next/link";
import { Wordmark } from "@/ui/wordmark";
import { Nav } from "@/ui/nav";
import { Countdown } from "@/ui/countdown";
import { Streak } from "@/ui/streak";
import { Flame } from "@/ui/flame";
import type { Clock, Viewer } from "@/ui/types";

export type HeaderProps =
  | {
      /** Dynamic routes: countdown and streak from the viewer. */
      variant: "app";
      viewer: Viewer;
      clock: Clock;
      /** Overrides usePathname in the nav (the kit page). */
      pathname?: string;
    }
  | {
      /** Prerendered routes: zero viewer state, the flame and "Today's draft". */
      variant: "static";
      pathname?: string;
    };

export const TODAYS_DRAFT_HREF = "/games/country-draft/play?mode=daily";

/**
 * Height 64 (12 px top padding inside), flex space-between, on paper, not sticky, no
 * border, no blur, no avatar, no "Sign in" (blueprint 3.4). Left the wordmark (and the
 * desktop nav at >= 1024 with a 40 px gap); right the cluster by variant.
 */
export function Header(props: HeaderProps) {
  return (
    <header className="hd">
      <div className="hd-left">
        <Wordmark />
        <Nav viewer={props.variant === "app" ? props.viewer : null} pathname={props.pathname} />
      </div>
      <div className="hd-right">
        {props.variant === "app" ? (
          <>
            <Countdown resetAt={props.clock.resetAt} serverNow={props.clock.now} />
            <Streak n={props.viewer.streak} />
          </>
        ) : (
          <>
            <Flame size={18} />
            <Link href={TODAYS_DRAFT_HREF} prefetch className="today">
              Today&apos;s draft
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
