"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { submitSiteFeedback } from "@/app/actions/site-feedback";
import { FEEDBACK_MAX_LENGTH, FEEDBACK_MIN_LENGTH, type FeedbackContext, type FeedbackReply, type FeedbackScope } from "@/lib/site-feedback";
import type { GameSlug } from "@/ui/types";
import { Button } from "./button";
import "./site-feedback.css";

export interface SiteFeedbackProps {
  gameSlug?: GameSlug;
  context?: FeedbackContext;
}

export function SiteFeedback({ gameSlug, context = "site" }: SiteFeedbackProps) {
  const id = useId();
  const [message, setMessage] = useState("");
  const [scope, setScope] = useState<FeedbackScope>(gameSlug ? "game" : "site");
  const [pending, setPending] = useState(false);
  const [reply, setReply] = useState<FeedbackReply | null>(null);
  const submission = useRef<string | null>(null);
  const sending = useRef(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const sent = reply?.success === true;
  const error = reply && !reply.success ? reply : null;

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || sent) return;
    const website = new FormData(event.currentTarget).get("website");
    sending.current = true;
    setPending(true);
    setReply(null);
    try {
      submission.current ??= crypto.randomUUID();
      setReply(await submitSiteFeedback({ message, scope, gameSlug, context, website, submissionId: submission.current }));
    } catch {
      setReply({ success: false, code: "unavailable", error: "Could not save your feedback. Your text is still here. Try again." });
    } finally {
      sending.current = false;
      setPending(false);
    }
  }

  function editMessage(value: string) {
    setMessage(value);
    setReply(null);
    submission.current = null;
  }

  return (
    <details className={`site-feedback${context === "result" ? " site-feedback-result" : ""}`} open={context === "result"}>
      <summary>{context === "result" ? "What should we improve?" : "Feedback"}</summary>
      <form method="post" onSubmit={send}>
        {gameSlug ? (
          <fieldset disabled={pending || sent}>
            <legend>About</legend>
            <label><input type="radio" name={`${id}-scope`} checked={scope === "game"} onChange={() => { setScope("game"); setReply(null); submission.current = null; }} />This game</label>
            <label><input type="radio" name={`${id}-scope`} checked={scope === "site"} onChange={() => { setScope("site"); setReply(null); submission.current = null; }} />Whole site</label>
          </fieldset>
        ) : null}
        <label className={context === "result" ? "sr-only" : undefined} htmlFor={`${id}-message`}>What should we improve?</label>
        <textarea ref={textarea} id={`${id}-message`} name="message" rows={context === "result" ? 2 : 3} required minLength={FEEDBACK_MIN_LENGTH} maxLength={FEEDBACK_MAX_LENGTH} value={message}
          onChange={(event) => editMessage(event.target.value)} readOnly={pending || sent} aria-invalid={error?.code === "invalid" || undefined}
          aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`} />
        <p className="t-meta" id={`${id}-hint`}>Sent privately. 5–1,500 characters.</p>
        <div className="site-feedback-trap" aria-hidden="true">
          <label htmlFor={`${id}-website`}>Leave this blank</label>
          <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>
        <div className="site-feedback-actions">
          <Button type="submit" variant="quiet" pending={pending} pendingLabel="Sending…" disabled={pending || sent}>{error ? "Try again" : sent ? "Sent" : "Send feedback"}</Button>
          {sent ? <Button variant="text" onClick={() => { editMessage(""); textarea.current?.focus(); }}>Write another</Button> : null}
        </div>
        <div className="site-feedback-status">
          <p role="status">{pending ? "Sending your feedback…" : sent ? "Thanks. Your feedback is saved." : ""}</p>
          {error ? <p role="alert" id={`${id}-error`}>{error.error}</p> : null}
        </div>
      </form>
    </details>
  );
}
