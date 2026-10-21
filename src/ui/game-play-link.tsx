'use client';

import Link, { useLinkStatus } from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
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
  const [documentPending, setDocumentPending] = useState(false);
  useEffect(() => {
    if (!documentPending) return;
    const resume = () => setDocumentPending(false);
    window.addEventListener('pageshow', resume);
    return () => window.removeEventListener('pageshow', resume);
  }, [documentPending]);
  useEffect(() => {
    // The single suggested next game can be warmed while the player reads their result.
    if (warmOnRender && !nativeMapNavigation(slug)) void preloadGameHost(slug).catch(() => undefined);
  }, [slug, warmOnRender]);
  const warm = () => {
    if (nativeMapNavigation(slug)) return;
    const now = Date.now();
    if (warmed.current?.href === props.href && now - warmed.current.at < 30000) return;
    warmed.current = {href: props.href, at: now};
    void preloadGameHost(slug).catch(() => undefined);
    router.prefetch(props.href);
  };
  return <Link {...props} aria-label={ariaLabel} onMouseEnter={warm} onFocus={warm} onTouchStart={warm} onPointerDown={warm} onNavigate={event => {
    if (nativeMapNavigation(slug)) {
      // iPad WKWebView can strand map-host client transitions; direct document loads work.
      event.preventDefault();
      setDocumentPending(true);
      window.location.assign(props.href);
    } else warm();
  }}><PlayLabel pendingLabel={pendingLabel} preserveContent={preserveContent} documentPending={documentPending}>{children}</PlayLabel></Link>;
}

function nativeMapNavigation(slug: string): boolean {
  if (slug !== 'geo-wordle' && slug !== 'pinpoint' || typeof window === 'undefined') return false;
  const capacitor: unknown = Reflect.get(window, 'Capacitor');
  return !!capacitor && typeof capacitor === 'object' && 'isNativePlatform' in capacitor && typeof capacitor.isNativePlatform === 'function' && capacitor.isNativePlatform() === true;
}

function PlayLabel({ children, pendingLabel, preserveContent, documentPending }: { children: ReactNode; pendingLabel?: string; preserveContent?: boolean; documentPending?: boolean }) {
  const { pending: linkPending } = useLinkStatus();
  const pending = documentPending || linkPending;
  if (preserveContent) return <>{children}<span className="tile-pending" role="status" aria-atomic="true">{pending ? pendingLabel ?? 'Opening…' : ''}</span></>;
  return <span aria-live="polite" aria-busy={pending || undefined}>{pending ? pendingLabel ?? 'Opening…' : children}</span>;
}
