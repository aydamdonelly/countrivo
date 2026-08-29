"use client";

import { useState } from "react";
import type { RiskZoneState } from "@/lib/game-logic/risk-zone/engine";
import { Button } from "@/ui/button";
import { Options, OptionButton } from "@/ui/options";
import type { BoardProps } from "@/games/types";
import { statLabel } from "@/games/_shared/format";
import { optionState } from "@/games/_shared/option-list";
import { PairSubject } from "@/games/_shared/pair";
import { CALLS, multiplierLabel, pairUnit, pairValue, stepInView, type RiskAction } from "./module";

/**
 * Risk Zone (blueprint 8.8). One board, four beats, each drawn from `state` alone:
 *
 *  guess   the anchor country against a hidden challenger, two calls.
 *  decide  the challenger's value is out and counting up (blueprint 6.3.5); bank the pot,
 *          or push it onto the next reveal for the next rung of the ladder.
 *  wiped   the call that broke the chain stays on screen with the ember outline.
 *  banked  the chain is closed and the pot is in the score.
 *
 * The pot and the multiplier sit where the money is: the pot in the session line above, the
 * multiplier beside the stat the chain is played on. Keys ArrowUp / ArrowDown to call, b to
 * bank, p to push, Enter for the next chain; on touch, a 40 px vertical swipe on the pair.
 */
export function Board({ state, dispatch, busy }: BoardProps<RiskZoneState, RiskAction>) {
  const view = stepInView(state);
  const { chain, step, anchor, anchorValue, revealed } = view;
  const unit = chain.category.unit;
  const guessing = state.phase === "guess";
  const deciding = state.phase === "decide";
  const closed = state.phase === "wiped" || state.phase === "banked";
  const lastChain = state.chainIndex >= state.chains.length - 1;

  // The pair the board arrived on is already in the server HTML, so it must not play the
  // reveal motion on mount (blueprint 6.3.1 animates a CHANGE of subject).
  const stepKey = `${state.chainIndex}:${chain.steps.indexOf(step)}`;
  const [firstKey] = useState(stepKey);

  const chosen = state.lastOutcome === null ? null : CALLS.indexOf(state.lastOutcome === "correct" ? step.answer : step.answer === "higher" ? "lower" : "higher");
  const correct = CALLS.indexOf(step.answer);

  /*
   * The two calls come back after the chain closes on a call: on a wipe to carry the ember
   * outline, and on the seventh correct call, which banks the chain on its own with no
   * decide beat in between. A chain the player banked by hand has already shown its reveal.
   */
  const showCalls = state.phase === "wiped" || (state.phase === "banked" && view.last);

  function call(c: "higher" | "lower") {
    if (guessing && !busy) dispatch({ t: "guess", c });
  }

  return (
    <div className="play-stack">
      <PairSubject
        key={stepKey}
        stat={{ slug: chain.category.slug, label: statLabel(chain.category.slug, chain.category.label) }}
        multiplier={guessing || deciding ? multiplierLabel(state.correctInChain) : undefined}
        left={{ iso2: anchor.iso2, name: anchor.displayName, value: pairValue(anchorValue, unit) }}
        right={{
          iso2: step.challenger.iso2,
          name: step.challenger.displayName,
          value: revealed ? pairValue(step.challengerValue, unit) : null,
          count: revealed ? { value: step.challengerValue, unit: pairUnit(unit) } : undefined,
        }}
        onSwipe={guessing ? call : undefined}
        animate={stepKey !== firstKey}
      />

      {guessing || showCalls ? (
        <Options busy={busy || !guessing}>
          <OptionButton
            label="Higher"
            icon="arrow-up"
            aria-label={`Higher, ${step.challenger.displayName} is above ${anchor.displayName}`}
            state={optionState(0, chosen, correct, showCalls)}
            onClick={() => call("higher")}
            disabled={!guessing}
          />
          <OptionButton
            label="Lower"
            icon="arrow-down"
            aria-label={`Lower, ${step.challenger.displayName} is below ${anchor.displayName}`}
            state={optionState(1, chosen, correct, showCalls)}
            onClick={() => call("lower")}
            disabled={!guessing}
          />
        </Options>
      ) : null}

      {deciding ? (
        <>
          <Button variant="ink" block onClick={() => dispatch({ t: "bank" })} disabled={busy}>
            Bank {state.pendingPot}
          </Button>
          <Options busy={busy}>
            <OptionButton
              label={`Push to ${multiplierLabel(state.correctInChain + 1)}`}
              small={`one wrong wipes ${state.pendingPot}`}
              onClick={() => dispatch({ t: "push" })}
            />
          </Options>
        </>
      ) : null}

      {closed ? (
        <Button variant="ink" block onClick={() => dispatch({ t: "next" })} disabled={busy}>
          {lastChain ? "See result" : "Next chain"}
        </Button>
      ) : null}
    </div>
  );
}
