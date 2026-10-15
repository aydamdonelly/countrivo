'use client';

import Link, { useLinkStatus } from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, type ReactNode } from 'react';
import { preloadGameHost } from '@/features/play/preload-game-host';

interface GamePlayLinkProps {
  slug: string;
  href: string;
  prefetch?: boolean;
  className?: string;
  pendingLabel?: string;
  preserveContent?: boolean;
  ariaLabel?: string;
  warmOnRender?: boolean;
  children: ReactNode;
}

export function GamePlayLink({ slug, children, pendingLabel, preserveContent, ariaLabel, warmOnRender, ...props }: GamePlayLinkProps) {
  const router = useRouter();
  const warmed = useRef<{href: string; at: number} | null>(null);
  useEffect(() => {
    // The single suggested next game can be warmed while the player reads their result.
    if (warmOnRender) void preloadGameHost(slug).catch(() => undefined);
  }, [slug, warmOnRender]);
  const warm = () => {
    const now = Date.now();
    if (warmed.current?.href === props.href && now - warmed.current.at < 30000) return;
    warmed.current = {href: props.href, at: now};
    void preloadGameHost(slug).catch(() => undefined);
    router.prefetch(props.href);
  };
  return <Link {...props} aria-label={ariaLabel} onMouseEnter={warm} onFocus={warm} onTouchStart={warm} onPointerDown={warm} onNavigate={warm}><PlayLabel pendingLabel={pendingLabel} preserveContent={preserveContent}>{children}</PlayLabel></Link>;
}

function PlayLabel({ children, pendingLabel, preserveContent }: { children: ReactNode; pendingLabel?: string; preserveContent?: boolean }) {
  const { pending } = useLinkStatus();
  if (preserveContent) return <>{children}<span className="tile-pending" role="status" aria-atomic="true">{pending ? pendingLabel ?? 'Opening…' : ''}</span></>;
  return <span aria-live="polite" aria-busy={pending || undefined}>{pending ? pendingLabel ?? 'Opening…' : children}</span>;
}
