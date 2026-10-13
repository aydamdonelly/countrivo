import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Clay } from '@/ui/clay';
export function SiteFoot({ className }: { className?: string }) {
  return <footer className={cn('table-foot', className)}>
    <div className="foot-objects"><Clay object="cl-23" state="open" /><Clay object="cl-24" state="americas" alternate="afreu" /></div>
    <div className="foot-copy">
      <p>Play <Link href="/">today&apos;s games</Link>, <Link href="/practice">practice</Link>, or open <Link href="/archive">the archive</Link>.</p>
      <p>Read about <Link href="/countries">countries</Link>, <Link href="/categories">stats</Link> and <Link href="/lists">lists</Link>, and <Link href="/sources">the sources</Link> behind them.</p>
      <p><Link href="/about">How Countrivo works</Link>, <Link href="/credits">credits</Link>, <Link href="/privacy">privacy</Link>, <Link href="/terms">terms</Link>, <Link href="/imprint">imprint</Link> and <Link href="/support">support</Link>.</p>
      <p className="t-meta text-mute">Free daily geography games. No accounts. New boards at midnight Berlin time.</p>
      <p className="t-meta text-mute">Copyright 2026 Countrivo</p>
    </div>
  </footer>;
}
