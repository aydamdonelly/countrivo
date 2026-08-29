"use client";

import { formatStat } from "@/lib/utils";
import type { SupremacyState } from "@/lib/game-logic/supremacy/engine";
import { Flag } from "@/ui/flag";
import { StatIcon } from "@/ui/icons/stat";
import { Options, OptionButton } from "@/ui/options";
import { Subject } from "@/ui/subject";
import type { BoardProps } from "@/games/types";
import { statLabel } from "@/games/_shared/format";
import type { SupremacyAction } from "./module";

/** `5.5M`, or `n/a` where the card has no value for that stat. */
function statValue(value: number | null | undefined, unit: string): string {
  return value === null || value === undefined ? "n/a" : formatStat(value, unit);
}

/** Supremacy (blueprint 8.8): your card against the AI card, five stats, five rounds. */
export function Board({ state, dispatch, busy }: BoardProps<SupremacyState, SupremacyAction>) {
  const round = state.rounds[state.currentRound];
  const stat = round.chosenStat ? state.categories.find((c) => c.slug === round.chosenStat) ?? null : null;
  const shown = state.phase === "reveal" && round.winner !== null;
  const yourTurn = state.phase === "picking" && state.isPlayerTurn;
  return (
    <div className="play-stack">
      <Subject
        key={state.currentRound}
        variant="pair"
        animate={state.currentRound > 0}
        left={{ iso2: round.playerCard.country.iso2, name: round.playerCard.country.displayName, value: stat ? statValue(round.playerCard.stats[stat.slug], stat.unit) : "" }}
        right={{ iso2: shown ? round.aiCard.country.iso2 : null, name: shown ? round.aiCard.country.displayName : "AI", value: shown && stat ? statValue(round.aiCard.stats[stat.slug], stat.unit) : null }}
      />
      {yourTurn ? (
        <Options busy={busy}>
          {state.categories.map((c, i) => (
            <OptionButton
              key={c.slug}
              label={
                <span className="opt-stat">
                  <StatIcon slug={c.slug} size={18} />
                  <span className="nm">{statLabel(c.slug, c.shortLabel)}</span>
                  <b className="v t-score num">{statValue(round.playerCard.stats[c.slug], c.unit)}</b>
                </span>
              }
              keyHint={String(i + 1)}
              onClick={() => dispatch({ t: "pick", slug: c.slug })}
            />
          ))}
        </Options>
      ) : state.phase === "picking" ? (
        <p className="play-center t-body play-line">AI picks in a moment.</p>
      ) : (
        <p className="play-center t-body play-line">
          <b>{stat ? statLabel(stat.slug, stat.shortLabel) : ""}</b>
        </p>
      )}
      <div className="hand">
        {state.playerHand.map((card, i) => (
          <Flag key={card.country.iso3} iso2={card.country.iso2} size="xs" alt="" className={i < state.currentRound ? "played" : undefined} />
        ))}
      </div>
    </div>
  );
}
