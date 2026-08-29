"use client";

import { useState } from "react";
import { formatStat } from "@/lib/utils";
import { Options, OptionButton } from "@/ui/options";
import type { BoardProps } from "@/games/types";
import { statLabel } from "@/games/_shared/format";
import { optionState } from "@/games/_shared/option-list";
import { PairSubject } from "@/games/_shared/pair";
import { CALLS, pairUnit, roundInView, type Call, type HoLAction, type HoLState } from "./module";

/**
 * The board (blueprint 8.8): the stat line over the pair, the left value shown and the
 * right one hidden, two option rows. A call opens the 1500 ms reveal the host holds `busy`
 * for: the hidden value counts up, the right call fills ink, a wrong one takes the ember
 * outline. Keys ArrowUp / ArrowDown; on touch, a vertical swipe on the pair.
 */
export function Board({ state, dispatch, busy }: BoardProps<HoLState, HoLAction>) {
  const round = roundInView(state);
  const [firstRound] = useState(state.g.currentRound);
  const revealed = state.pending !== null;
  const locked = revealed || busy;
  const unit = pairUnit(round.category.unit);
  const chosen = state.pending === null ? null : CALLS.indexOf(state.pending);
  const correct = CALLS.indexOf(round.answer);
  // The swipe handler stays mounted through the reveal, so its touch-only hint never
  // disappears under the pair and shoves the option rows up mid-answer.
  const call = (c: Call) => {
    if (!locked) dispatch({ t: "guess", c });
  };
  return (
    <div className="play-stack">
      <PairSubject
        key={state.g.currentRound}
        stat={{ slug: round.category.slug, label: statLabel(round.category.slug, round.category.label) }}
        left={{ iso2: round.left.iso2, name: round.left.displayName, value: formatStat(round.leftValue, unit) }}
        right={{
          iso2: round.right.iso2,
          name: round.right.displayName,
          value: revealed ? formatStat(round.rightValue, unit) : null,
          count: revealed ? { value: round.rightValue, unit } : undefined,
        }}
        onSwipe={call}
        animate={state.g.currentRound !== firstRound}
      />
      <Options busy={locked}>
        <OptionButton
          label="Higher"
          icon="arrow-up"
          aria-label={`Higher, ${round.right.displayName} ranks above ${round.left.displayName}`}
          state={optionState(0, chosen, correct, revealed)}
          onClick={() => call("higher")}
          disabled={locked}
        />
        <OptionButton
          label="Lower"
          icon="arrow-down"
          aria-label={`Lower, ${round.right.displayName} ranks below ${round.left.displayName}`}
          state={optionState(1, chosen, correct, revealed)}
          onClick={() => call("lower")}
          disabled={locked}
        />
      </Options>
    </div>
  );
}
