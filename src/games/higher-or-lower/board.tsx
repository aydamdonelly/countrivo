"use client";

import { useState } from "react";
import { Options, OptionButton } from "@/ui/options";
import type { BoardProps } from "@/games/types";
import { statLabel } from "@/games/_shared/format";
import { optionState } from "@/games/_shared/option-list";
import { PairSubject } from "@/games/_shared/pair";
import { CALLS, pairUnit, pairValue, roundInView, type Call, type HoLAction, type HoLState } from "./module";

/**
 * The board (blueprint 8.8): the stat line over the pair, the left value shown and the right
 * one hidden, two stacked option rows. A call opens the 1500 ms reveal the host holds `busy`
 * for: the hidden value counts up from 0 (blueprint 6.3.5), the right call fills ink and a
 * wrong one takes the ember inset outline and shakes once. Keys ArrowUp / ArrowDown; on
 * touch, a vertical swipe of 40 px or more on the pair (blueprint 8.5).
 *
 * Everything here is derived from `state` and `busy`, so the server HTML is the live board
 * and a resumed daily paints its current pair in the first frame.
 */
export function Board({ state, dispatch, busy }: BoardProps<HoLState, HoLAction>) {
  const round = roundInView(state);
  // The round the board arrived on: the very first pair is already in the server HTML, so it
  // must not play the reveal motion on mount (blueprint 6.3.1 animates a CHANGE of subject).
  const [firstRound] = useState(state.g.currentRound);
  const revealed = state.pending !== null;
  const locked = revealed || busy;
  const unit = round.category.unit;
  const chosen = state.pending === null ? null : CALLS.indexOf(state.pending);
  const correct = CALLS.indexOf(round.answer);
  const call = (c: Call) => {
    if (!locked) dispatch({ t: "guess", c });
  };
  return (
    <div className="play-stack">
      <PairSubject
        // Re-keying on the round replays the subject motion; during the reveal the key holds,
        // so the pair stays put while its hidden value counts up.
        key={state.g.currentRound}
        stat={{ slug: round.category.slug, label: statLabel(round.category.slug, round.category.label) }}
        left={{ iso2: round.left.iso2, name: round.left.displayName, value: pairValue(round.leftValue, unit) }}
        right={{
          iso2: round.right.iso2,
          name: round.right.displayName,
          value: revealed ? pairValue(round.rightValue, unit) : null,
          count: revealed ? { value: round.rightValue, unit: pairUnit(unit) } : undefined,
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
