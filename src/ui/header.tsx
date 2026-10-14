import Link from 'next/link';
import { Wordmark } from '@/ui/wordmark';
import { Streak } from '@/ui/streak';
import type { Clock, Viewer } from '@/ui/types';

export interface HeaderProps {
  variant?: 'app' | 'static';
  viewer?: Viewer;
  clock?: Clock;
  pathname?: string;
  streak?: number;
}
export const TODAYS_DRAFT_HREF = '/games/country-draft/play?mode=daily';

export function Header({ streak = 0 }: HeaderProps) {
  return (
    <header className="table-header">
      <Wordmark />
      <nav aria-label="Primary">
        <Link href="/countries" className="header-world">World</Link>
        <Link href="/practice" className="header-practice">Practice</Link>
        <Link href="/leaderboard" prefetch className="header-board">
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size public SVG needs no image loader */}
          <img src="/design/leaderboard.svg" width={24} height={24} alt="" decoding="async" />
          <span>Leaderboard</span>
        </Link>
        {streak >= 2 ? <Streak n={streak} /> : null}
      </nav>
    </header>
  );
}
