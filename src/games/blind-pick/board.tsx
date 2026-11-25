import { canUndo, currentIndex, isComplete, slotOwner, statDefinition, statLabel, statUnit, statWording, worldRankQuality } from "@/lib/game-logic/blind-pick/display";
import { cn } from "@/lib/utils";
import { PlusIcon } from "@/ui/icons/plus";
import { UndoIcon } from "@/ui/icons/undo";
import { Button } from "@/ui/button";
import { Clay } from "@/ui/clay";
import type { BoardProps } from "@/games/types";
import { BpFlag } from "./bp-flag";
import { CategoryArt } from "./category-art";
import { ScoringHelp } from "./scoring-help";
import type { BlindPickAction, BlindPickState } from "./module";
import "./blind-pick.css";

export interface BoardMoveFeedback {
  type: "place" | "undo";
  slot: number;
  revision: number;
  countryName: string;
}

function CategoryLabel({ slug }: { slug: string }) {
  return <span className="bp-category-heading">
    <CategoryArt slug={slug} />
    <span className="bp-category-copy"><span className="bp-slbl">{statLabel(slug)}</span><span className="bp-unit">{statUnit(slug)}</span></span>
  </span>;
}

export function Board({ state, dispatch, busy, pendingSlot, pendingUndo, feedback }: BoardProps<BlindPickState, BlindPickAction> & { pendingSlot?: number | null; pendingUndo?: boolean; feedback?: BoardMoveFeedback | null }) {
  const { g } = state;
  const cfg = g.config;
  const complete = isComplete(g);
  const idx = currentIndex(g);
  const country = cfg.countries[idx];
  const count = cfg.categories.length;
  const lastSlot = g.placements.at(-1);
  const lastCountry = g.placements.length ? cfg.countries[g.placements.length - 1] : null;
  const undoAvailable = canUndo(g);
  const stats = cfg.categories.map(category => category.slug);

  return <div className="bp" data-feedback-revision={feedback?.revision}>
    <div className="bp-arrive">
      {complete ? <div className="bp-card bp-complete"><Clay object="cl-07" state="flip" sizes="64px" loading="eager" /><span className="bp-who"><b>All countries placed</b><span>Ready to compare?</span></span><Button className="bp-mobile-result" variant="ink" disabled={busy} onClick={() => dispatch({t:'seen'})}>See result</Button></div> : <div className="bp-card">
        <BpFlag iso2={country.iso2} w={64} h={43} alt="" className={cn('bp-current-art', pendingSlot != null && 'bp-dealing', feedback?.type === 'place' && 'bp-arrived', feedback?.type === 'undo' && 'bp-returned')} />
        <span className="bp-who"><b key={country.iso2} className={country.displayName.length > 18 ? 'bp-long-name' : undefined}>{country.displayName}</b><span className="bp-instruction"><span className="bp-count">Country {idx + 1} of {count}</span><span className="bp-count-divider" aria-hidden="true"> · </span>Choose a category</span></span>
      </div>}
    </div>
    {count === 8 ? <div className="bp-undo"><Button variant="ink" block aria-label="Undo last pick" aria-describedby="bp-undo-allowance" disabled={busy || !undoAvailable || state.seen} onClick={() => dispatch({t:'undo'})}><span className="bp-undo-label"><UndoIcon size={18} />{g.undoUsed ? 'Undo used' : 'Undo last pick'}</span><span className="bp-undo-allowance" id="bp-undo-allowance">{g.undoUsed ? '0 left' : '1 left'}</span></Button></div> : null}
    <ScoringHelp stats={stats} />
    <p className="bp-rank-guide" id="bp-rank-guide">World rank · lower is better<span className="sr-only">. #1 is the highest value. Ranks compare countries with available data.</span></p>
    <div className="bp-slots" aria-label="Categories">
      {cfg.categories.map((cat, i) => {
        const label = statWording(cat.slug);
        const owner = slotOwner(g, i);
        const pending = pendingSlot === i;
        const placed = owner >= 0 ? cfg.countries[owner] : pending ? country : null;
        const effect = feedback?.slot === i ? feedback.type === 'place' ? 'placed' : 'undone' : undefined;
        if (placed) return <div key={cat.slug} className={cn('bp-slot', pending ? 'bp-slot-pending' : 'placed', pendingUndo && lastSlot === i && 'bp-lifting')} data-stat={cat.slug} data-slot={i} data-state={pending ? 'pending' : 'placed'} data-feedback={effect} aria-busy={pending || pendingUndo && lastSlot === i || undefined} role="group" aria-label={`${label}. ${statDefinition(cat.slug)}.`}>
          <CategoryLabel slug={cat.slug} />
          <span className="bp-slot-foot"><span className={cn('bp-placed-country', placed.displayName.length > 20 && 'bp-country-long')}><BpFlag iso2={placed.iso2} w={20} h={14} alt="" /><b>{placed.displayName}</b></span>
          <span className="bp-rank"><span className="bp-rank-number">{pending ? <span className="sr-only">Saving placement</span> : `#${cfg.costMatrix[owner][i]}`}</span><span className="bp-rank-meta"><span className="bp-rank-of">{pending ? null : `of ${cfg.of[i]}`}</span><span className="bp-rank-quality">{pending ? null : worldRankQuality(cfg.costMatrix[owner][i], cfg.of[i])}</span></span></span></span>
        </div>;
        return <button key={cat.slug} type="button" className="bp-slot open" data-stat={cat.slug} data-slot={i} data-state="open" data-feedback={effect} disabled={busy || complete} onClick={event => { if (event.detail < 2) dispatch({t:'place',s:i}); }} aria-label={`Put ${country.displayName} on ${label}. ${statDefinition(cat.slug)}.`} aria-describedby="bp-rank-guide">
          <CategoryLabel slug={cat.slug} /><span className="bp-slot-foot bp-slot-target"><PlusIcon size={20} /></span>
        </button>;
      })}
    </div>
    <div className="bp-controls">
      {complete ? <Button variant="ink" disabled={busy} onClick={() => dispatch({t:'seen'})}>See result</Button> : null}
    </div>
    <p className="bp-announcement sr-only" aria-live="polite">{pendingSlot != null ? `Placing ${country.displayName} on ${statWording(cfg.categories[pendingSlot].slug)}.` : pendingUndo ? `Returning ${lastCountry?.displayName ?? 'your last country'}.` : feedback?.type === 'undo' ? `${feedback.countryName} returned. Choose a category again. Undo used.` : feedback?.type === 'place' ? `${feedback.countryName} placed on ${statWording(cfg.categories[feedback.slot].slug)}. ${g.placements.length} of ${count} placed.` : ''}</p>
  </div>;
}
