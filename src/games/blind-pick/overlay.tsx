import { statLabel, statUnit, statWording } from "@/lib/game-logic/blind-pick/display";
import { BLIND_PICK_PAR, overLabel, swapCycles } from "@/lib/game-logic/blind-pick/scoring";
import { CheckIcon } from "@/ui/icons/check";
import { BpFlag } from "./bp-flag";
import { CategoryArt } from "./category-art";
import { ScoringHelp } from "./scoring-help";
import "./blind-pick.css";

/** A finished board in plain arrays: what the live result and the saved run both carry. */
export interface OverlayData {
  /** Stat slugs in slot order. */
  stats: readonly string[];
  /** Countries in arrival order. */
  countries: readonly { iso2: string; name: string }[];
  /** Per country: the slot the player chose, its rank, the perfect slot, its rank. */
  placements: readonly number[];
  ranks: readonly number[];
  perfect: readonly number[];
  perfectRanks: readonly number[];
  over: number;
  par?: number;
}

/** "Par +10. You beat it by 4." and its siblings. */
export function parLine(over: number, par: number = BLIND_PICK_PAR): string {
  if (over === 0) return `Par +${par}. Nothing to swap.`;
  if (over < par) return `Par +${par}. You beat it by ${par - over}.`;
  if (over === par) return `Par +${par}. Level with par.`;
  return `Par +${par}. ${over - par} over par.`;
}

/**
 * R6 for Blind Pick: the head line ("+6 over perfect", the par line), then the player's board
 * laid over the perfect one, slot by slot (your country and rank beside the perfect country and
 * rank, a check where they agree), then the swaps that would have fixed it. No hooks, so the
 * live result (client) and the run page (server) render the same rows.
 */
export function BoardOverlay({ d, inPanel = false }: { d: OverlayData; inPanel?: boolean }) {
  const par = d.par ?? BLIND_PICK_PAR;
  const swaps = swapCycles(d.placements, d.perfect, d.ranks, d.perfectRanks);
  const name = (c: number) => d.countries[c]?.name ?? "Country";
  // Per category: your country's rank there minus the best fit's rank there. The two
  // costliest rows are marked; a negative row is the best fit giving a little back here.
  const costs = d.stats.map((_, slot) => {
    const mine = d.placements.indexOf(slot), best = d.perfect.indexOf(slot);
    return (d.ranks[mine] ?? 0) - (d.perfectRanks[best] ?? 0);
  });
  const costly = new Set([...costs.keys()].filter((slot) => costs[slot] > 0).sort((a, b) => costs[b] - costs[a]).slice(0, 2));
  const gives = costs.some((cost) => cost < 0);

  const swapRows = swaps.map((s) => {
            const text =
              s.moves.length === 2
                ? <>Swap {name(s.moves[0].countryIdx)} and {name(s.moves[1].countryIdx)}</>
                : <ol className="bp-moves">{s.moves.map((m) => <li key={m.countryIdx}>Move {name(m.countryIdx)} to {statWording(d.stats[m.toSlot] ?? "")}</li>)}</ol>;
            return (
              <div key={s.moves.map((m) => m.countryIdx).join("-")} className="bp-swap">
                <span className="t-body">{text}</span>
                <span className="t-meta bp-saved">
                  <b className="t-num num">{s.saved}</b> {s.saved === 1 ? "rank" : "ranks"}
                </span>
              </div>
            );
          });

  return (
    <div className="bp-ov">
      {inPanel ? (d.over === 0 ? null : <p className="t-body bp-ov-lead">The best fit places the same countries so their ranks add up lowest. The two rows that cost you most are marked.</p>) : <div className="rhead">
        <b className="t-h3">{d.over === 0 ? "Perfect board" : `${overLabel(d.over)} over perfect`}</b>
        <span className="rfacts t-body">{parLine(d.over, par)}</span>
      </div>}

      <div className="rrows t-row">
        <div className="rrow bp-ovrow bp-ovhead">
          <span />
          <span />
          <span className="t-meta">You</span>
          <span className="t-meta">Best fit</span>
          <span className="t-meta">Cost</span>
        </div>
        {d.stats.map((slug, slot) => {
          const mine = d.placements.indexOf(slot);
          const best = d.perfect.indexOf(slot);
          const same = mine === best;
          const mineC = d.countries[mine];
          const bestC = d.countries[best];
          return (
            <div key={slug} className="rrow bp-ovrow" data-costly={costly.has(slot) || undefined}>
              <CategoryArt slug={slug} size={32} />
              <span className="nm">{statLabel(slug)}<span className="bp-unit">{statUnit(slug)}</span></span>
              <span className="bp-cell">
                <span className="bp-cell-name">{mineC?.name}</span>
                {mineC?.iso2 ? <BpFlag iso2={mineC.iso2} w={20} h={15} alt={mineC.name} /> : null}
                <b className="t-num num">#{d.ranks[mine]}</b>
              </span>
              <span className="bp-cell mute">
                <span className="bp-cell-name">{bestC?.name}</span>
                {same ? (
                  <CheckIcon size={16} className="ic-ok" title="Same as perfect" />
                ) : (
                  <>
                    {bestC?.iso2 ? <BpFlag iso2={bestC.iso2} w={20} h={15} alt={bestC.name} /> : null}
                    <span className="t-num num">#{d.perfectRanks[best]}</span>
                  </>
                )}
              </span>
              <b className={`bp-cost t-num num${costs[slot] > 0 ? " is-cost" : ""}`} aria-label={costs[slot] === 0 ? "No cost" : costs[slot] > 0 ? `${costs[slot]} ranks lost` : `${-costs[slot]} ranks better than the best fit`}>{costs[slot] > 0 ? `+${costs[slot]}` : costs[slot] < 0 ? `−${-costs[slot]}` : "0"}</b>
            </div>
          );
        })}
      </div>
      {gives ? <p className="t-meta text-mute bp-ov-note">A minus row is fine: the best fit can be worse in one category to win more elsewhere.</p> : null}
      <ScoringHelp stats={d.stats} />

      {swaps.length > 0 ? (
        inPanel ? <div className="bp-swaps"><p className="t-meta bp-swaps-title">Better swaps</p>{swapRows}</div> : <details className="bp-swaps">
          <summary className="t-meta bp-swaps-h">Better swaps</summary>{swapRows}
        </details>
      ) : null}
    </div>
  );
}
