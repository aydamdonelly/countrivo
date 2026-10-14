import { statWording } from "@/lib/game-logic/blind-pick/display";
import { BLIND_PICK_PAR, overLabel, swapCycles } from "@/lib/game-logic/blind-pick/scoring";
import { CheckIcon } from "@/ui/icons/check";
import { StatIcon } from "@/ui/icons/stat";
import { BpFlag } from "./bp-flag";
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

function joinMoves(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/**
 * R6 for Blind Pick: the head line ("+6 over perfect", the par line), then the player's board
 * laid over the perfect one, slot by slot (your country and rank beside the perfect country and
 * rank, a check where they agree), then the swaps that would have fixed it. No hooks, so the
 * live result (client) and the run page (server) render the same rows.
 */
export function BoardOverlay({ d }: { d: OverlayData }) {
  const par = d.par ?? BLIND_PICK_PAR;
  const swaps = swapCycles(d.placements, d.perfect, d.ranks, d.perfectRanks);
  const name = (c: number) => d.countries[c]?.name ?? "Country";

  return (
    <div className="bp-ov">
      <div className="rhead">
        <b className="t-h3">{d.over === 0 ? "Perfect board" : `${overLabel(d.over)} over perfect`}</b>
        <span className="rfacts t-body">{parLine(d.over, par)}</span>
      </div>

      <div className="rrows t-row">
        <div className="rrow bp-ovrow bp-ovhead">
          <span />
          <span />
          <span className="t-meta">You</span>
          <span className="t-meta">Perfect</span>
        </div>
        {d.stats.map((slug, slot) => {
          const mine = d.placements.indexOf(slot);
          const best = d.perfect.indexOf(slot);
          const same = mine === best;
          const mineC = d.countries[mine];
          const bestC = d.countries[best];
          return (
            <div key={slug} className="rrow bp-ovrow">
              <StatIcon slug={slug} size={18} />
              <span className="nm">{statWording(slug)}</span>
              <span className="bp-cell">
                {mineC?.iso2 ? <BpFlag iso2={mineC.iso2} w={20} h={15} alt={mineC.name} /> : null}
                <b className="t-num num">#{d.ranks[mine]}</b>
              </span>
              <span className="bp-cell mute">
                {same ? (
                  <CheckIcon size={16} className="ic-ok" title="Same as perfect" />
                ) : (
                  <>
                    {bestC?.iso2 ? <BpFlag iso2={bestC.iso2} w={20} h={15} alt={bestC.name} /> : null}
                    <span className="t-num num">#{d.perfectRanks[best]}</span>
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {swaps.length > 0 ? (
        <details className="bp-swaps">
          <summary className="t-meta bp-swaps-h">Better swaps</summary>
          {swaps.map((s) => {
            const text =
              s.moves.length === 2
                ? `Swap ${name(s.moves[0].countryIdx)} and ${name(s.moves[1].countryIdx)}`
                : `Move ${joinMoves(s.moves.map((m) => `${name(m.countryIdx)} to ${statWording(d.stats[m.toSlot] ?? "")}`))}`;
            return (
              <div key={s.moves.map((m) => m.countryIdx).join("-")} className="bp-swap">
                <span className="t-body">{text}</span>
                <span className="t-meta bp-saved">
                  <b className="t-num num">{s.saved}</b> {s.saved === 1 ? "rank" : "ranks"}
                </span>
              </div>
            );
          })}
        </details>
      ) : null}
    </div>
  );
}
