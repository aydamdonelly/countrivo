'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { loadFeedbackBoard, voteFeedback } from '@/app/actions/site-feedback';
import type { FeedbackBoardReply, FeedbackVote, PublicFeedback } from '@/lib/feedback-board';
import { getGameBySlug } from '@/lib/data/games';
import { ArrowUpIcon } from '@/ui/icons/arrow-up';
import { ArrowDownIcon } from '@/ui/icons/arrow-down';
import { Button } from '@/ui/button';
import { FeedbackModeration } from './feedback-moderation';
import { unblockLeaderboardPublishers } from '@/app/actions/anonymous-games';
import './feedback-board.css';

const PAGE_SIZE = 20;

interface FeedbackFeedProps {
  initial?: FeedbackBoardReply;
  refreshKey?: number;
  inDialog?: boolean;
  paused?: boolean;
}

export function FeedbackFeed({ initial, refreshKey = 0, inDialog = false, paused = false }: FeedbackFeedProps) {
  const id = useId();
  const [data, setData] = useState(initial?.success ? initial : null);
  const [error, setError] = useState(initial && !initial.success ? initial.error : '');
  const [busy, setBusy] = useState(false);
  const [pendingVote, setPendingVote] = useState<number | null>(null);
  const [moderating, setModerating] = useState(false);
  const [cursor, setCursor] = useState<number | undefined>();
  const [notice, setNotice] = useState('');
  const request = useRef(false);
  const writing = useRef(false);
  const generation = useRef(0);
  const lastInteraction = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const section = useRef<HTMLElement>(null);
  const initialized = useRef(initial !== undefined);
  const previousRefresh = useRef(refreshKey);
  const Heading = inDialog ? 'h2' : 'h1';

  const refresh = useCallback(async (beforeId?: number, manual = false) => {
    if (writing.current || request.current && !manual) return;
    request.current = true;
    const current = ++generation.current;
    if (manual) { setBusy(true); setError(''); }
    try {
      const reply = await loadFeedbackBoard({ beforeId, limit: PAGE_SIZE });
      if (current !== generation.current) return;
      if (reply.success) {
        setData(reply); setError(''); setCursor(beforeId);
        if (manual) setNotice('Feedback is up to date.');
      } else setError(reply.error);
    } catch { if (current === generation.current) setError('Could not refresh feedback. Your last view is still here. Try again.'); }
    finally { if (current === generation.current) { request.current = false; setBusy(false); } }
  }, []);

  useEffect(() => {
    if (initialized.current && previousRefresh.current === refreshKey) return;
    initialized.current = true;
    previousRefresh.current = refreshKey;
    void refresh(undefined, true);
  }, [refresh, refreshKey]);

  useEffect(() => {
    function interact() { lastInteraction.current = Date.now(); }
    function tick() {
      const dialog = document.querySelector('[role="dialog"]');
      if (paused || document.visibilityState !== 'visible' || !navigator.onLine || Date.now() - lastInteraction.current < 1500 || dialog && !dialog.contains(section.current) || document.activeElement?.matches('input,textarea,select')) return;
      void refresh(cursor);
    }
    const timer = setInterval(tick, 15000);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('online', tick);
    document.addEventListener('pointerdown', interact, true);
    document.addEventListener('keydown', interact, true);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('online', tick);
      document.removeEventListener('pointerdown', interact, true);
      document.removeEventListener('keydown', interact, true);
    };
  }, [cursor, paused, refresh]);

  async function vote(item: PublicFeedback, direction: FeedbackVote) {
    if (writing.current || paused) return;
    writing.current = true;
    generation.current++;
    const value = item.vote === direction ? 0 : direction;
    setPendingVote(item.id); setError(''); setNotice('');
    const optimistic = { ...item, vote: value,
      upvotes: item.upvotes - Number(item.vote === 1) + Number(value === 1),
      downvotes: item.downvotes - Number(item.vote === -1) + Number(value === -1) };
    function replace(next: PublicFeedback) { setData(current => current ? { ...current, items: current.items.map(row => row.id === item.id ? next : row) } : current); }
    replace({ ...optimistic, score: optimistic.upvotes - optimistic.downvotes });
    try {
      const reply = await voteFeedback({ feedbackId: item.id, value, requestId: crypto.randomUUID() });
      if (reply.success) { replace({ ...reply.item, own: item.own }); setNotice(value === 0 ? 'Vote removed.' : 'Vote saved.'); }
      else { replace(item); setError(reply.error); }
    } catch { replace(item); setError('Could not save your vote. Try again.'); }
    finally { request.current = false; writing.current = false; setPendingVote(null); }
  }

  async function page(beforeId?: number) {
    await refresh(beforeId, true);
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: 'start' });
  }

  return <section ref={section} aria-labelledby={`${id}-title`} className={`feedback-feed${inDialog ? ' feedback-feed-dialog' : ''}`}>
      <header className="feedback-feed-heading">
        <div><Heading id={`${id}-title`} className="t-h2" ref={heading} tabIndex={-1}>Community feedback</Heading><p className="t-meta">Newest first · updates automatically</p></div>
        <Button variant="text" disabled={paused || busy || moderating || pendingVote !== null} onClick={() => void refresh(cursor, true)}>Refresh</Button>
      </header>
      {error ? <div className="feedback-board-error" role="alert"><p>{error}</p><Button variant="text" disabled={paused || busy || pendingVote !== null} onClick={() => void refresh(cursor, true)}>Try again</Button></div> : null}
      {!data && !error ? <p className="feedback-board-opening t-meta" role="status">Opening public feedback…</p> : null}
      {data && !data.items.length ? <div className="feedback-empty"><h2 className="t-h3">Be the first to share an idea.</h2><p>What would make your next game better? Share it above. Your idea will appear here anonymously.</p></div> : null}
      {data?.items.length ? <ol className="feedback-posts" aria-label="Public feedback">{data.items.map(item => <li key={item.id} className="feedback-post" id={`${id}-feedback-${item.id}`} data-feedback-id={item.id} aria-busy={pendingVote === item.id || undefined}>
        <header><b>{item.source === 'reviewed' ? 'Earlier feedback · anonymous summary' : 'Anonymous'}{item.gameSlug ? ` · ${getGameBySlug(item.gameSlug)?.title ?? 'Game'}` : ' · Countrivo'}</b><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Europe/Berlin' })}</time></header>
        <p className="feedback-post-message" id={`${id}-feedback-${item.id}-message`}>{item.message}</p>
        <div className="feedback-votes" role="group" aria-label="Vote on this idea" aria-describedby={`${id}-feedback-${item.id}-message`}>
          <button type="button" aria-label={`Upvote, ${item.upvotes} votes`} aria-pressed={item.vote === 1} disabled={paused || busy || moderating || pendingVote !== null} onClick={() => void vote(item, 1)}><ArrowUpIcon size={20}/><span>{item.upvotes}</span></button>
          <button type="button" aria-label={`Downvote, ${item.downvotes} votes`} aria-pressed={item.vote === -1} disabled={paused || busy || moderating || pendingVote !== null} onClick={() => void vote(item, -1)}><ArrowDownIcon size={20}/><span>{item.downvotes}</span></button>
          {item.vote !== 0 ? <span className="feedback-your-vote">Your vote · tap again to undo</span> : null}
        </div>
        {!item.own ? <FeedbackModeration id={item.id} disabled={paused || busy || moderating || pendingVote !== null}
          begin={() => { if (writing.current || paused) return false; writing.current = true; generation.current++; setModerating(true); return true; }}
          end={() => { writing.current = false; request.current = false; setModerating(false); }}
          blocked={board => {
            generation.current++; setCursor(undefined); setData(board.success ? board : null);
            setError(board.success ? '' : 'Author blocked. Refresh to open the remaining feedback.');
            setNotice('Author blocked on this device.'); heading.current?.focus({ preventScroll: true });
          }} /> : <p className="feedback-board-note t-meta">Your post</p>}
      </li>)}</ol> : null}
      <p className="sr-only" role="status">{notice}</p>
      <nav className="feedback-pagination" aria-label="Feedback pages">
        {cursor ? <Button variant="text" disabled={paused || busy || moderating || pendingVote !== null} onClick={() => void page()}>Back to newest</Button> : null}
        {data?.nextBeforeId ? <Button variant="quiet" disabled={paused || busy || moderating || pendingVote !== null} onClick={() => void page(data.nextBeforeId ?? undefined)}>Older feedback</Button> : null}
      </nav>
      <p className="feedback-board-note t-meta">Ideas are public and anonymous. One vote per browser on each idea; you can change or remove it. Report harmful posts or block an author. For private concerns, email <a href="mailto:countrivo@gmail.com">countrivo@gmail.com</a>.</p>
      <Button variant="text" disabled={paused || busy || moderating || pendingVote !== null} onClick={async () => {
        if (writing.current) return;
        writing.current = true; generation.current++; setModerating(true); setError('');
        try {
          const result = await unblockLeaderboardPublishers();
          if (!result.success) setError(result.error ?? 'Could not unblock authors. Try again.');
          else { writing.current = false; await refresh(undefined, true); setNotice('All authors unblocked on this device.'); }
        } catch { setError('Could not unblock authors. Try again.'); }
        finally { writing.current = false; request.current = false; setModerating(false); }
      }}>Unblock all authors</Button>
  </section>;
}
