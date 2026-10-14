'use client';

import { useEffect, useRef, useState } from 'react';
import { gamePresentation } from '@/content/table';
import { Clay } from '@/ui/clay';
import { CloseIcon } from '@/ui/icons/close';
import './game-help.css';

export function GameHelp({slug, title}: {slug: string; title: string}) {
  const [open, setOpen] = useState(false);
  const [fallback, setFallback] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const fallbackOpen = fallback && open;
  useEffect(() => {
    if (!fallbackOpen) return;
    const overflow = document.body.style.overflow;
    const previous = trigger.current;
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => close.current?.focus({preventScroll: true}));
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
      } else if (event.key === 'Tab') {
        event.preventDefault();
        close.current?.focus({preventScroll: true});
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus({preventScroll: true});
    };
  }, [fallbackOpen]);
  const game = gamePresentation(slug);
  if (!game) return null;
  const id = `game-help-${slug}`;
  return <>
    <button ref={trigger} type="button" className="game-help-trigger" popoverTarget={fallback ? undefined : id} aria-expanded={open} aria-controls={id} aria-label={`How to play ${title}`} onClick={(event) => {
      if (typeof HTMLElement.prototype.showPopover === 'function') return;
      event.preventDefault();
      setFallback(true);
      setOpen(true);
    }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4m0 3v1" /></svg></button>
    {fallbackOpen ? <div className="game-help-scrim" role="presentation" onClick={() => setOpen(false)} /> : null}
    <div id={id} popover={fallback ? undefined : 'auto'} className={`game-help-panel${fallbackOpen ? ' fallback-open' : ''}`} role="dialog" aria-modal={fallbackOpen || undefined} aria-labelledby={`${id}-title`} data-game-help-open={open || undefined} onToggle={(event) => {
      if (fallback) return;
      setOpen(event.newState === 'open');
      if (event.newState === 'closed' && (document.activeElement === document.body || event.currentTarget.contains(document.activeElement))) trigger.current?.focus({preventScroll: true});
    }}>
      <button ref={close} type="button" className="game-help-close" popoverTarget={fallback ? undefined : id} popoverTargetAction="hide" aria-label="Close help" onClick={() => { if (fallback) setOpen(false); }}><CloseIcon size={22} /></button>
      <Clay object={game.clay} state={game.clay === 'cl-08' ? 'full' : 'rest'} sizes="64px" />
      <h2 className="t-h2" id={`${id}-title`}>{title}</h2>
      <ol>{game.steps.map((step, index) => <li key={step}><span aria-hidden="true">{index + 1}</span>{step}</li>)}</ol>
    </div>
  </>;
}
