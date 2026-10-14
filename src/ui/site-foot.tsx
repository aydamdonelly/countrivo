import Link from 'next/link';
import { cn } from '@/lib/utils';
import './site-foot.css';
export function SiteFoot({ className }: { className?: string }) {
  return <footer className={cn('table-foot', 'site-foot-compact', className)}>
    <nav className="site-foot-links" aria-label="Footer">
      <Link href="/practice">Practice</Link><Link href="/archive">Archive</Link><Link href="/countries">Countries</Link>
      <details className="site-foot-more"><summary>More</summary><div><Link href="/categories">Stats</Link><Link href="/lists">Lists</Link><Link href="/sources">Sources</Link><Link href="/about">About</Link><Link href="/credits">Credits</Link><Link href="/terms">Terms</Link><Link href="/support">Support</Link></div></details>
    </nav>
    <div className="site-foot-legal t-meta"><span>2026 Countrivo</span><Link href="/privacy">Privacy</Link><Link href="/imprint">Imprint</Link></div>
  </footer>;
}
