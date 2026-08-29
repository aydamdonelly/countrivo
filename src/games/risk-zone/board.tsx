"use client";

import { formatStat } from "@/lib/utils";
import { riskMultiplier, RISK_CHAIN_COUNT, type RiskZoneState } from "@/lib/game-logic/risk-zone/engine";
import { Button } from "@/ui/button";
import { Options, OptionButton } from "@/ui/options";
import type { BoardProps } from "@/games/types";
import { optionState } from "@/games/_shared/option-list";
import { PairSubject } from "@/games/_shared/pair";
import { multiplierLabel, type RiskAction } from "./module";
import { statLabel } from "@/games/_shared/format";

/** Risk Zone (blueprint 8.8): the pair with the multiplier; guess, decide (Bank / Push), wiped or banked (Next chain). */
export function Board({ state, dispatch, busy }: BoardProps<RiskZoneState, RiskAction>) {
  const chain = state.chains[Math.min(state.chainIndex, state.chains.length - 1)];
  const unit = chain.category.unit;
  const guessing = state.phase === "guess";
  const step = guessing ? chain.steps[state.stepIndex] : state.lastReveal ?? chain.steps[Math.max(0, state.stepIndex - 1)];
  const stepIdx = chain.steps.indexOf(step);
  const anchor = stepIdx <= 0 ? chain.base : chain.steps[stepIdx - 1].challenger;
  const anchorValue = stepIdx <= 0 ? chain.baseValue : chain.steps[stepIdx - 1].challengerValue;
  const revealed = !guessing;
  const chosen = state.lastOutcome === null ? null : state.lastOutcome === "correct" ? (step.answer === "higher" ? 0 : 1) : step.answer === "higher" ? 1 : 0;
  const correct = step.answer === "higher" ? 0 : 1;
  const lastChain = state.chainIndex >= RISK_CHAIN_COUNT - 1;
  const nextMult = riskMultiplier(state.correctInChain + 1);
  return (
    <div className="play-stack">
      <PairSubject
        key={`${state.chainIndex}-${stepIdx}`}
        stat={{ slug: chain.category.slug, label: statLabel(chain.category.slug, chain.category.label) }}
        multiplier={multiplierLabel(state.correctInChain)}
        left={{ iso2: anchor.iso2, name: anchor.displayName, value: formatStat(anchorValue, unit) }}
        right={{ iso2: step.challenger.iso2, name: step.challenger.displayName, value: revealed ? formatStat(step.challengerValue, unit) : null, count: revealed ? { value: step.challengerValue, unit } : undefined }}
        onSwipe={guessing && !busy ? (c) => dispatch({ t: "guess", c }) : undefined}
        animate={stepIdx > 0}
      />
      {guessing ? (
        <Options busy={busy}>
          <OptionButton label="Higher" icon="arrow-up" onClick={() => dispatch({ t: "guess", c: "higher" })} />
          <OptionButton label="Lower" icon="arrow-down" onClick={() => dispatch({ t: "guess", c: "lower" })} />
        </Options>
      ) : state.phase === "decide" ? (
        <>
          <div className="play-actions">
            <Button variant="ink" onClick={() => dispatch({ t: "bank" })} disabled={busy}>
              Bank {state.pendingPot}
            </Button>
          </div>
          <Options busy={busy}>
            <OptionButton label={`Push to x${nextMult}`} small={`one wrong wipes ${state.pendingPot}`} onClick={() => dispatch({ t: "push" })} />
          </Options>
        </>
      ) : (
        <>
          <Options busy>
            <OptionButton label="Higher" icon="arrow-up" state={optionState(0, chosen, correct, true)} disabled />
            <OptionButton label="Lower" icon="arrow-down" state={optionState(1, chosen, correct, true)} disabled />
          </Options>
          <div className="play-actions">
            <Button variant="ink" onClick={() => dispatch({ t: "next" })} disabled={busy}>
              {lastChain ? "See result" : "Next chain"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
