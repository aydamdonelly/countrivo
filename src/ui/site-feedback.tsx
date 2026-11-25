"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { submitSiteFeedback } from "@/app/actions/site-feedback";
import { FEEDBACK_MAX_LENGTH, FEEDBACK_MIN_LENGTH, type FeedbackContext, type FeedbackReply, type FeedbackScope } from "@/lib/site-feedback";
import type { GameSlug } from "@/ui/types";
import { ArrowUpRightIcon } from "./icons/arrow-up-right";
import { CheckIcon } from "./icons/check";
import { CloseIcon } from "./icons/close";
import { Button } from "./button";
import { Clay } from "./clay";
import { Sheet } from "./sheet";
import { FeedbackFeed } from '@/features/feedback/feedback-feed';
import { trackUsage } from '@/lib/usage-events';
import "./site-feedback.css";

export interface SiteFeedbackProps {
  gameSlug?: GameSlug;
  context?: FeedbackContext;
  board?: boolean;
  /** One quiet line (clay, question, tertiary "Give feedback"); the default on result pages. */
  compact?: boolean;
  onSubmitted?: () => void;
}

function FeedbackArt({ stamp = false }: { stamp?: boolean }) {
  return <span className={`site-feedback-art${stamp ? " site-feedback-stamp" : " site-feedback-megaphone"}`} aria-hidden="true">
    <Clay object={stamp ? "cl-26" : "cl-13"} sizes={stamp ? "144px" : "112px"} loading="eager" />
    {stamp ? <span className="site-feedback-imprint"><CheckIcon size={24} /></span> : <svg className="site-feedback-waves" viewBox="0 0 36 48" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M4 16c5 4 5 12 0 16" />
      <path d="M14 10c9 8 9 20 0 28" />
      <path d="M24 4c13 12 13 28 0 40" />
    </svg>}
  </span>;
}

export function SiteFeedback({ gameSlug, context = "site", board = false, compact = context === "result", onSubmitted }: SiteFeedbackProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [scope, setScope] = useState<FeedbackScope>(gameSlug ? "game" : "site");
  const [pending, setPending] = useState(false);
  const [reply, setReply] = useState<FeedbackReply | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const submission = useRef<string | null>(null);
  const sending = useRef(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const successHeading = useRef<HTMLHeadingElement>(null);
  const sent = reply?.success === true;
  const error = reply && !reply.success ? reply : null;
  const close = useCallback(() => { trackUsage('feedback_close', { game: gameSlug, source: context === 'result' ? 'result' : 'other' }); setOpen(false); }, [gameSlug, context]);

  useEffect(() => {
    if (!open || !sent) return;
    successHeading.current?.focus({ preventScroll: true });
  }, [open, sent]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || sent) return;
    const website = new FormData(event.currentTarget).get("website");
    sending.current = true;
    setPending(true);
    setReply(null);
    trackUsage('feedback_submit', { game: gameSlug, action: scope, source: context === 'result' ? 'result' : 'other' });
    try {
      submission.current ??= crypto.randomUUID();
      const response = await submitSiteFeedback({ message, scope, gameSlug, context, website, submissionId: submission.current, visibility: 'public' });
      setReply(response);
      if (response.success) { setRefreshKey(value => value + 1); onSubmitted?.(); }
      trackUsage('feedback_result', { game: gameSlug, action: scope, outcome: response.success ? 'saved' : response.code, source: context === 'result' ? 'result' : 'other' });
    } catch {
      setReply({ success: false, code: "unavailable", error: "Could not save your feedback. Your text is still here. Try again." });
      trackUsage('feedback_result', { game: gameSlug, action: scope, outcome: 'unavailable', source: context === 'result' ? 'result' : 'other' });
    } finally {
      sending.current = false;
      setPending(false);
    }
  }

  function openSheet() {
    trackUsage('feedback_open', { game: gameSlug, source: context === 'result' ? 'result' : 'other' });
    setOpen(true);
  }

  function editMessage(value: string) {
    setMessage(value);
    setReply(null);
    submission.current = null;
  }

  function writeAnother() {
    editMessage("");
    requestAnimationFrame(() => textarea.current?.focus());
  }

  return <>
    {compact ? <button type="button" className="site-feedback-line" data-game={gameSlug} aria-label="Give feedback" aria-haspopup="dialog" onClick={openSheet}>
      <Clay object="cl-13" sizes="36px" />
      <span className="site-feedback-line-question">{context === "result" ? "How was this game?" : "Ideas for Countrivo?"}</span>
      <span className="site-feedback-line-cta">Give feedback</span>
    </button> : <div className={`site-feedback-invite${board ? ' site-feedback-board-invite' : ''}`} data-game={gameSlug}><button type="button" className={`site-feedback${context === "result" ? " site-feedback-result" : ""}`} data-game={gameSlug}
      aria-label="Give feedback" aria-haspopup="dialog" onClick={openSheet}>
      <FeedbackArt />
      <span className="site-feedback-copy">
        <span className="site-feedback-title">{board ? 'Make Countrivo better.' : context === "result" ? "How was this game?" : "Help shape Countrivo"}</span>
        <span className="site-feedback-description">Share an idea anonymously. Vote on what matters to you.</span>
      </span>
      <span className="site-feedback-cta">Give feedback<ArrowUpRightIcon size={18} /></span>
    </button></div>}
    <Sheet open={open} onClose={close} labelledBy={`${id}-title`} className="site-feedback-dialog">
      <div className="site-feedback-dialog-content" data-game={gameSlug}>
      <div className="site-feedback-dialog-topbar"><button type="button" className="site-feedback-close" aria-label="Close feedback" onClick={close}><CloseIcon size={20} /></button></div>
      <div className="site-feedback-composer" data-game={gameSlug} data-state={sent ? "sent" : pending ? "pending" : "editing"}>
        {sent ? <div className="site-feedback-success">
          <FeedbackArt stamp />
          <div className="site-feedback-success-copy">
          <h2 ref={successHeading} id={`${id}-title`} className="site-feedback-dialog-title" tabIndex={-1} data-autofocus>That’s in. Thank you.</h2>
          <p className="site-feedback-description">Your idea is now on the board below. Everyone can read it and vote.</p>
          </div>
          <div className="site-feedback-success-actions">
            <Button variant="tertiary" onClick={writeAnother}>Write another</Button>
            {!board ? <Button variant="tertiary" onClick={close}>Back to games</Button> : null}
          </div>
        </div> : <>
          <header className="site-feedback-dialog-heading">
            <FeedbackArt />
            <div><h2 id={`${id}-title`} className="site-feedback-dialog-title" tabIndex={-1} data-autofocus>We’re listening.</h2>
              <p className="site-feedback-description">Share an idea. Vote on others.</p></div>
          </header>
          <form method="post" onSubmit={send}>
            {gameSlug ? <fieldset disabled={pending}>
              <legend>About</legend>
              <label><input type="radio" name={`${id}-scope`} checked={scope === "game"} onChange={() => { setScope("game"); setReply(null); submission.current = null; }} />This game</label>
              <label><input type="radio" name={`${id}-scope`} checked={scope === "site"} onChange={() => { setScope("site"); setReply(null); submission.current = null; }} />Whole site</label>
            </fieldset> : null}
            <label htmlFor={`${id}-message`}>What should we improve?</label>
            <textarea ref={textarea} id={`${id}-message`} name="message" placeholder="I liked… / It would be better if…" rows={3} required minLength={FEEDBACK_MIN_LENGTH} maxLength={FEEDBACK_MAX_LENGTH}
              value={message} onChange={(event) => editMessage(event.target.value)} readOnly={pending} aria-invalid={error?.code === "invalid" || undefined}
              aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`} />
            <p className="site-feedback-hint" id={`${id}-hint`}>Public and anonymous. Leave out personal information. 5–1,500 characters.</p>
            <div className="site-feedback-trap" aria-hidden="true">
              <label htmlFor={`${id}-website`}>Leave this blank</label>
              <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>
            <Button className="site-feedback-submit" type="submit" variant="primary" icon="arrow-up-right" pending={pending} pendingLabel="Sending…" disabled={pending}>{error ? "Try again" : "Send feedback"}</Button>
            <div className="site-feedback-status">
              <p role="status">{pending ? "Sending your feedback…" : ""}</p>
              {error ? <p role="alert" id={`${id}-error`}>{error.error}</p> : null}
            </div>
          </form>
        </>}
      </div>
      <FeedbackFeed inDialog refreshKey={refreshKey} paused={pending}/>
      </div>
    </Sheet>
  </>;
}
