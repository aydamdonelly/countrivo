"use client";

import { useRef } from "react";
import { formatStat } from "@/lib/utils";
import { Options, OptionButton } from "@/ui/options";
import type { BoardProps } from "@/games/types";
import { optionState } from "@/games/_shared/option-list";
import { PairSubject } from "@/games/_shared/pair";
import type { Call, HoLAction, HoLState } from "./module";

const CALLS: Call[] = ["higher", "lower"];

/** Higher or Lower (blueprint 8.8): the stat line, the pair, Higher / Lower, the counted reveal, a swipe on touch. */
export function Board({ state, dispatch, busy }: BoardProps<HoLState, HoLAction>) {
  const g = state.g;
  const round = g.rounds[Math.min(g.currentRound, g.rounds.length - 1)];
  const first = useRef(g.currentRound);
  const revealed = state.pending !== null;
  const unit = round.category.unit;
  const chosen = state.pending === null ? null : CALLS.indexOf(state.pending);
  const correct = CALLS.indexOf(round.answer);
  return (
    <div className="play-stack">
      <PairSubject
        key={g.currentRound}
        stat={{ slug: round.category.slug, label: round.category.label }}
        left={{ iso2: round.left.iso2, name: round.left.displayName, value: formatStat(round.leftValue, unit) }}
        right={{ iso2: round.right.iso2, name: round.right.displayName, value: revealed ? formatStat(round.rightValue, unit) : null, count: revealed ? { value: round.rightValue, unit } : undefined }}
        onSwipe={revealed || busy ? undefined : (c) => dispatch({ t: "guess", c })}
        animate={g.currentRound !== first.current}
      />
      <Options busy={busy || revealed}>
        <OptionButton label="Higher" icon="arrow-up" state={optionState(0, chosen, correct, revealed)} onClick={() => dispatch({ t: "guess", c: "higher" })} disabled={revealed} />
        <OptionButton label="Lower" icon="arrow-down" state={optionState(1, chosen, correct, revealed)} onClick={() => dispatch({ t: "guess", c: "lower" })} disabled={revealed} />
      </Options>
    </div>
  );
}
