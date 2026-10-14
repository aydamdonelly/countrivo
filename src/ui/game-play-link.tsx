'use client';

import Link, { useLinkStatus } from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { preloadGameHost } from '@/features/play/preload-game-host';

interface GamePlayLinkProps {
  slug: string;
  href: string;
  prefetch?: boolean;
  className?: string;
  pendingLabel?: string;
  preserveContent?: boolean;
  ariaLabel?: string;
  children: ReactNode;
}

export function GamePlayLink({ slug, children, pendingLabel, preserveContent, ariaLabel, ...props }: GamePlayLinkProps) {
  const router = useRouter();
  const warm = () => {
    void preloadGameHost(slug).catch(() => undefined);
    router.prefetch(props.href);
  };
  return <Link {...props} aria-label={ariaLabel} onMouseEnter={warm} onFocus={warm} onTouchStart={warm}><PlayLabel pendingLabel={pendingLabel} preserveContent={preserveContent}>{children}</PlayLabel></Link>;
}

function PlayLabel({ children, pendingLabel, preserveContent }: { children: ReactNode; pendingLabel?: string; preserveContent?: boolean }) {
  const { pending } = useLinkStatus();
  if (preserveContent) return <>{children}<span className="tile-pending" role="status">{pending ? pendingLabel : ''}</span></>;
  return <span aria-live={pendingLabel ? 'polite' : undefined}>{pending && pendingLabel ? pendingLabel : children}</span>;
}
