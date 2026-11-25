'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { preloadGameHost } from '@/features/play/preload-game-host';
import { NavigationLink } from '@/ui/navigation-link';

interface GamePlayLinkProps {
  slug: string;
  href: string;
  prefetch?: boolean;
  className?: string;
  pendingLabel?: string;
  ariaLabel?: string;
  warmOnRender?: boolean;
  children: ReactNode;
}
export function GamePlayLink({ slug, children, pendingLabel, ariaLabel, warmOnRender, ...props }: GamePlayLinkProps) {
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
  };
  return <NavigationLink {...props} pendingLabel={pendingLabel} documentPending={documentPending} aria-label={ariaLabel} onMouseEnter={warm} onFocus={warm} onTouchStart={warm} onPointerDown={warm} onNavigate={event => {
    if (nativeMapNavigation(slug)) {
      // iPad WKWebView can strand map-host client transitions; direct document loads work.
      event.preventDefault();
      setDocumentPending(true);
      window.location.assign(props.href);
    } else warm();
  }}>{children}</NavigationLink>;
}

function nativeMapNavigation(slug: string): boolean {
  if (slug !== 'geo-wordle' && slug !== 'pinpoint' || typeof window === 'undefined') return false;
  const capacitor: unknown = Reflect.get(window, 'Capacitor');
  return !!capacitor && typeof capacitor === 'object' && 'isNativePlatform' in capacitor && typeof capacitor.isNativePlatform === 'function' && capacitor.isNativePlatform() === true;
}
