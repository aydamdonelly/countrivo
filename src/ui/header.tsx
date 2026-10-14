import Link from 'next/link';
import Image from 'next/image';
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
        <Link href="/leaderboard" prefetch className="header-board"><Image src="/design/leaderboard.svg" width={24} height={24} alt="" unoptimized /><span>Leaderboard</span></Link>
        {streak >= 2 ? <Streak n={streak} /> : null}
      </nav>
    </header>
  );
}
