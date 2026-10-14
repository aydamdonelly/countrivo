'use client';

import Link, { useLinkStatus } from 'next/link';
import type { ReactNode } from 'react';
import { preloadGameHost } from '@/features/play/preload-game-host';

interface GamePlayLinkProps {
  slug: string;
  href: string;
  prefetch?: boolean;
  className?: string;
  pendingLabel?: string;
  children: ReactNode;
}

export function GamePlayLink({ slug, children, pendingLabel, ...props }: GamePlayLinkProps) {
  const warm = () => { void preloadGameHost(slug).catch(() => undefined); };
  return <Link {...props} onMouseEnter={warm} onFocus={warm} onTouchStart={warm}><PlayLabel pendingLabel={pendingLabel}>{children}</PlayLabel></Link>;
}

function PlayLabel({ children, pendingLabel }: { children: ReactNode; pendingLabel?: string }) {
  const { pending } = useLinkStatus();
  return <span aria-live={pendingLabel ? 'polite' : undefined}>{pending && pendingLabel ? pendingLabel : children}</span>;
}
