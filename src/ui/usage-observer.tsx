'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { deferUsage, resumeUsage, trackNavigation, trackUsage } from '@/lib/usage-events';
import { usageRoute, type UsageAction, type UsageSource } from '@/lib/usage';

function sourceFor(element: Element): UsageSource {
  if (element.closest('.rp-wrap,.dr-result-card,.dr-result-actions,.result-followup,.site-feedback-result')) return 'result';
  if (element.closest('.table-header,.play-header')) return 'header';
  if (element.closest('footer')) return 'footer';
  if (element.closest('.table-home')) return 'home';
  if (element.closest('.leaderboard,.standing-list')) return 'leaderboard';
  return /\/games\/[^/]+\/play/.test(location.pathname) ? 'game' : 'other';
}

export function UsageObserver() {
  const pathname = usePathname();
  const lastPage = useRef<string | null>(null);
  useEffect(() => {
    if (pathname?.startsWith('/admin') || lastPage.current === pathname) return;
    lastPage.current = pathname;
    trackUsage('page_view', usageRoute(location.href, location.origin));
  }, [pathname]);

  useEffect(() => {
    resumeUsage();
    function click(event: MouseEvent) {
      if (!(event.target instanceof Element) || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const element = event.target.closest('a,button,summary');
      if (!element || element.getAttribute('aria-disabled') === 'true' || element.matches(':disabled') || location.pathname.startsWith('/admin')) return;
      const source = sourceFor(element);
      if (element instanceof HTMLAnchorElement) {
        if (element.download || element.target && element.target !== '_self') return;
        const url = new URL(element.href, location.href);
        if (url.origin !== location.origin || url.pathname === location.pathname && url.search === location.search) return;
        trackNavigation(url.href, source);
        return;
      }
      if (element.closest('.site-feedback-dialog,.site-feedback')) return;
      if (element.matches('.join-flag')) {
        trackUsage('disclosure', { source, action: 'country_flag', outcome: 'opened' });
        return;
      }
      // Match known controls locally; no DOM text or player-entered value is sent.
      const label = (element.textContent ?? '').trim();
      const entries: Record<string, UsageAction> = { 'Save': 'save_name', 'Save name': 'save_name', 'Change': 'change_name', 'Change name': 'change_name', 'Remove name': 'restore_guest', 'Keep it': 'cancel' };
      if (entries[label] && element.closest('.leaderboard-entry,.result-followup')) {
        trackUsage('entry_action', { source, action: entries[label] }); return;
      }
      const controls: Record<string, UsageAction> = { 'One more': 'replay', 'One more draft': 'replay', 'Next': 'next', 'Try again': 'retry', 'Skip animation': 'next', 'Outline · −1 guess': 'hint', 'Check': 'bonus' };
      if (controls[label] && /\/games\/[^/]+\/play/.test(location.pathname)) {
        trackUsage('game_control', { source, action: controls[label] }); return;
      }
      if (element.tagName === 'SUMMARY') {
        const details: Record<string, UsageAction> = { 'Score breakdown': 'score_details', 'Your picks explained': 'run_details', 'Your countries': 'run_details', 'Your week': 'week', 'Yesterday’s answers': 'yesterday', 'Your world today': 'world', 'Distance & direction': 'hint', 'Add a country flag (optional)': 'country_flag' };
        const action = details[label] ?? (element.closest('.gw-history') ? 'history' : undefined);
        if (action) trackUsage('disclosure', { source, action, outcome: element.parentElement?.hasAttribute('open') ? 'closed' : 'opened' });
      }
    }
    document.addEventListener('click', click, true);
    document.addEventListener('pointerdown', deferUsage, true);
    document.addEventListener('keydown', deferUsage, true);
    window.addEventListener('online', resumeUsage);
    window.addEventListener('pageshow', resumeUsage);
    return () => {
      document.removeEventListener('click', click, true);
      document.removeEventListener('pointerdown', deferUsage, true);
      document.removeEventListener('keydown', deferUsage, true);
      window.removeEventListener('online', resumeUsage);
      window.removeEventListener('pageshow', resumeUsage);
    };
  }, []);
  return null;
}
