'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { blockFeedbackAuthor, reportFeedback } from '@/app/actions/site-feedback';
import { FEEDBACK_REPORT_REASONS } from '@/lib/feedback-moderation';
import type { FeedbackBoardReply } from '@/lib/feedback-board';

interface Props {
  id: number;
  disabled: boolean;
  begin: () => boolean;
  end: () => void;
  blocked: (board: FeedbackBoardReply) => void;
}

export function FeedbackModeration({ id, disabled, begin, end, blocked }: Props) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [pending, setPending] = useState<'report' | 'block' | null>(null);
  const [error, setError] = useState('');
  const trigger = useRef<HTMLButtonElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const reason = useRef<HTMLSelectElement>(null);
  const confirmButton = useRef<HTMLButtonElement>(null);
  const blockButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (open) (confirm ? confirmButton.current : reported ? blockButton.current : form.current)?.focus({ preventScroll: true }); }, [open, confirm, reported]);
  function close() { setOpen(false); setConfirm(false); setError(''); trigger.current?.focus({ preventScroll: true }); }
  return <div className="feedback-moderation">
    <button ref={trigger} type="button" className="feedback-report-toggle" disabled={disabled} aria-expanded={open} aria-controls={panelId} onClick={() => open ? close() : setOpen(true)}>Report or block</button>
    {open ? <form ref={form} id={panelId} className="feedback-report-form" data-confirm={confirm || undefined} tabIndex={-1} aria-label="Report or block this feedback" aria-busy={!!pending || undefined}
      onKeyDown={event => { if (event.key === 'Escape' && !pending) { event.preventDefault(); event.stopPropagation(); close(); } }}
      onSubmit={async event => {
        event.preventDefault();
        if (disabled || pending || reported || confirm || !begin()) return;
        setPending('report'); setError('');
        try {
          const result = await reportFeedback({ feedbackId: id, reason: reason.current?.value });
          if (result.success) setReported(true);
          else setError(result.error);
        } catch { setError('Could not send this report. Try again.'); }
        finally { setPending(null); end(); }
      }}>
      {!confirm && (!reported ? <><label htmlFor={`${panelId}-reason`}>Reason for reporting</label><select ref={reason} id={`${panelId}-reason`} disabled={disabled || !!pending}>{FEEDBACK_REPORT_REASONS.map(value => <option key={value}>{value}</option>)}</select><button className="feedback-report-primary" type="submit" disabled={disabled || !!pending}>{pending === 'report' ? 'Sending…' : 'Send report'}</button></> : <p role="status">Report received. We’ll review it. You can also block this author.</p>)}
      {confirm ? <><p>Hide this author’s feedback and leaderboard entries on this device?</p><button ref={confirmButton} className="feedback-report-primary" type="button" disabled={disabled || !!pending} onClick={async () => {
        if (disabled || pending || !begin()) return;
        setPending('block'); setError('');
        try {
          const result = await blockFeedbackAuthor(id);
          if (result.success) blocked(result.board);
          else setError(result.error);
        } catch { setError('Could not block this author. Try again.'); }
        finally { setPending(null); end(); }
      }}>{pending === 'block' ? 'Blocking…' : 'Confirm block author'}</button></> : <button ref={blockButton} type="button" disabled={disabled || !!pending} onClick={() => { setError(''); setConfirm(true); }}>Block author</button>}
      <button className="feedback-report-cancel" type="button" disabled={disabled || !!pending} onClick={close}>Cancel</button>
      {error ? <p role="alert" className="text-ember">{error}</p> : null}
    </form> : null}
  </div>;
}
