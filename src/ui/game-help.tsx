import { gamePresentation } from '@/content/table';
import { Clay } from '@/ui/clay';
import { CloseIcon } from '@/ui/icons/close';
import './game-help.css';

export function GameHelp({slug, title}: {slug: string; title: string}) {
  const game = gamePresentation(slug);
  if (!game) return null;
  const id = `game-help-${slug}`;
  return <>
    <button type="button" className="game-help-trigger" popoverTarget={id} aria-label={`How to play ${title}`}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4m0 3v1" /></svg></button>
    <div id={id} popover="auto" className="game-help-panel" aria-labelledby={`${id}-title`}>
      <button type="button" className="game-help-close" popoverTarget={id} popoverTargetAction="hide" aria-label="Close help"><CloseIcon size={22} /></button>
      <Clay object={game.clay} state={game.clay === 'cl-08' ? 'full' : 'rest'} sizes="64px" />
      <h2 className="t-h2" id={`${id}-title`}>{title}</h2>
      <ol>{game.steps.map((step, index) => <li key={step}><span aria-hidden="true">{index + 1}</span>{step}</li>)}</ol>
    </div>
  </>;
}
