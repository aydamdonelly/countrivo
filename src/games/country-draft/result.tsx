"use client";

import { SectionHead } from "@/ui/section-head";
import { Flag } from "@/ui/flag";
import { cn } from "@/lib/utils";
import { scoreState } from "@/lib/game-logic/country-draft/engine";
import { MAX_SCORE, SEAT_NAMES, fitQuality, fitWord } from "@/lib/game-logic/country-draft/tables";
import type { ResultProps } from "@/games/types";
import { DraftMap } from "./draft-map";
import { bestRows, type CountryDraftState } from "./module";
import "./draft.css";

/**
 * What the finished board cannot say for itself. The board stays above this panel with the
 * band, the bonuses and the five seats already on it, so the result adds the two things
 * that need the whole run to exist: the map of what the cabinet took, and the line the
 * board would have allowed, appointment by appointment. That second block is what makes a
 * bad run readable in one screen: which seat you spent wrong, and what was there instead.
 */
export function Result({ state }: ResultProps<CountryDraftState>) {
  const scored = scoreState(state);
  const gap = state.board.ceiling - scored.score;
  const best = bestRows(state);
  return (
    <div>
      <DraftMap from={state.board.rounds.map((r) => r.iso3)} score={scored.score} />
      <p className="dr-lead t-meta">
        taken <span className="num">{scored.score}</span> of <span className="num">{MAX_SCORE}</span> · best possible{" "}
        <span className="num">{state.board.ceiling}</span> · gap <span className="num">{gap}</span>
      </p>

      <SectionHead title="The best line" fact={`${state.board.ceiling}`} variant="strip" />
      <p className="dr-lead t-body">The highest score today&apos;s board allows.</p>
      <div className="dr-rows t-row">
        {best.map((row) => (
          <div key={row.round} className="dr-row">
            <span className="fl">
              <Flag iso2={row.iso2} size="xs" alt="" />
            </span>
            <span className="txt">
              <b>{row.name}</b>
              <small className="t-meta">
                {SEAT_NAMES[row.seat]} · {fitWord(row.fit)} · standing {row.standing}
              </small>
            </span>
            <b className={cn("t-score num val", `dr-q-${fitQuality(row.fit)}`)}>{row.points}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
