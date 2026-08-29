"use client";

import { useState } from "react";
import { Button } from "@/ui/button";
import { CountUp } from "@/ui/count-up";
import { Flag } from "@/ui/flag";
import { SeatIcon } from "@/ui/icons/seat";
import { cn } from "@/lib/utils";
import { canUndo, figureAt, filledSeats, scoreState } from "@/lib/game-logic/country-draft/engine";
import {
  ARCHETYPE_LABELS,
  BONUSES,
  MAX_SCORE,
  ROUNDS,
  SEAT_NAMES,
  SEAT_WANTS,
  bandOf,
  fitQuality,
  fitWord,
} from "@/lib/game-logic/country-draft/tables";
import { fitOf } from "@/lib/game-logic/country-draft/scoring";
import type { DraftFigure, PoolIdx, SeatIdx } from "@/lib/game-logic/country-draft/types";
import type { BoardProps } from "@/games/types";
import type { CountryDraftAction, CountryDraftState } from "./module";
import "./draft.css";

/*
 * The Country Draft board. Five countries are on the plan line from the first second and
 * only the people arrive round by round, so holding a seat open is an informed decision
 * rather than a gamble. Everything is drawn from `state`: the server HTML is already the
 * board, and a resumed run arrives with its cabinet in place and nothing animating.
 *
 * The reveal after the fifth appointment is a swap in place, not a new screen. Every
 * region keeps its height (the round row becomes the band, the three people become the
 * three bonus rows, the cabinet stays exactly where it is), so nothing on screen moves.
 */

/** The plan line: five countries, the played ones down, the current one ink. */
function Plan({ names, round }: { names: readonly string[]; round: number }) {
  return (
    <p className="dr-plan t-meta">
      {names.map((name, i) => (
        <span key={name}>
          {i > 0 ? <span className="sep"> · </span> : null}
          <span className={i < round ? "past" : i === round ? "now" : undefined}>{name}</span>
        </span>
      ))}
    </p>
  );
}

function Person({
  figure,
  held,
  onHold,
}: {
  figure: DraftFigure;
  held: boolean;
  onHold: () => void;
}) {
  return (
    <button type="button" className="dr-card" aria-pressed={held} onClick={onHold}>
      <span className="who">
        <b className="t-list">{figure.name}</b>
        <small className="t-meta">{figure.note}</small>
      </span>
      <span className="what">
        <b className="t-body">{ARCHETYPE_LABELS[figure.archetype]}</b>
        <small className="t-meta">
          standing <span className="num">{figure.standing}</span>
        </small>
      </span>
    </button>
  );
}

export function Board({ state, dispatch, busy }: BoardProps<CountryDraftState, CountryDraftAction>) {
  const playing = state.phase === "playing";
  const round = playing && state.round < ROUNDS ? state.board.rounds[state.round] : null;
  const heldFigure = round && state.held !== null ? round.pool[state.held] : null;
  const filled = filledSeats(state);
  const scored = scoreState(state);
  const undoable = canUndo(state);

  // A board that arrives resumed or finished is settled: only what moves after mount
  // plays the round slide and the counting numeral (blueprint 6.3.1, 6.3.2).
  const [movesAtMount] = useState(state.moves);
  const moved = state.moves > movesAtMount;

  return (
    <div className="dr">
      <div className={cn("dr-round", moved && playing && "subj-in")} key={playing ? state.round : "reveal"}>
        {round ? (
          <>
            <Flag iso2={round.iso2} size="m" alt="" eager />
            <span className="txt">
              <b className="t-h3">{round.name}</b>
              <small className="t-meta">{round.region}</small>
            </span>
          </>
        ) : (
          <span className="txt">
            <b className="t-h3">{bandOf(scored.score).word}</b>
            <small className="t-meta">
              <span className="num">{scored.score}</span> of <span className="num">{MAX_SCORE}</span> · best possible{" "}
              <span className="num">{state.board.ceiling}</span>
            </small>
          </span>
        )}
      </div>

      <Plan names={state.board.rounds.map((r) => r.name)} round={playing ? state.round : ROUNDS} />

      <div className="dr-pool">
        {round
          ? round.pool.map((figure, i) => (
              <Person
                key={figure.name}
                figure={figure}
                held={state.held === i}
                onHold={() => dispatch({ t: "hold", i: i as PoolIdx, ui: true })}
              />
            ))
          : BONUSES.map((bonus) => (
              <div key={bonus.key} className="dr-card">
                <span className="who">
                  <b className="t-list">{bonus.name}</b>
                  <small className="t-meta">{bonus.needs}</small>
                </span>
                <span className="what">
                  <b className={cn("t-score num", scored.bonuses[bonus.key] ? "dr-q-good" : "dr-q-fair")}>
                    {scored.bonuses[bonus.key] ? `+${bonus.points}` : "0"}
                  </b>
                </span>
              </div>
            ))}
      </div>

      <div className="dr-cabinet">
        {SEAT_NAMES.map((seatName, i) => {
          const seat = i as SeatIdx;
          const pick = state.seats[seat];
          if (pick) {
            const figure = figureAt(state.board, pick);
            const source = state.board.rounds[pick.round];
            return (
              <div key={seatName} className="dr-seat">
                <Flag iso2={source.iso2} size="xs" alt="" />
                <span className="txt">
                  <b className="t-body">{figure.name}</b>
                  <small className="t-meta">
                    {seatName} · {fitWord(pick.fit)} · {source.name}
                  </small>
                </span>
                <b className={cn("t-score num pts", `dr-q-${fitQuality(pick.fit)}`)}>
                  <CountUp
                    value={pick.points}
                    duration={300}
                    animate={moved && state.lastSeat === seat}
                    pop={moved && state.lastSeat === seat}
                  />
                </b>
              </div>
            );
          }
          const fit = heldFigure ? fitOf(heldFigure.archetype, seat) : null;
          return (
            <button
              key={seatName}
              type="button"
              className="dr-seat"
              disabled={busy || state.held === null || !playing}
              onClick={() => state.held !== null && dispatch({ t: "appoint", i: state.held, s: seat })}
              aria-label={heldFigure ? `Seat ${heldFigure.name} as ${seatName}` : seatName}
            >
              <span className="mark">
                <SeatIcon seat={seat} size={22} />
              </span>
              <span className="txt">
                <b className="t-body">{seatName}</b>
                <small className="t-meta">{SEAT_WANTS[seat]}</small>
              </span>
              {fit === null ? (
                <span className="key t-num num">{seat + 1}</span>
              ) : (
                <b className={cn("t-body read", `dr-q-${fitQuality(fit)}`)}>
                  {fitWord(fit)} <span className="num">{fit}</span>
                </b>
              )}
            </button>
          );
        })}
      </div>

      {/*
        One row under the cabinet, 44 px whether it is full or empty, so the reveal swap
        and the take-back never move the board. Two actions side by side are one ink and
        one text; there is no outlined variant, so a filled-plus-outlined pair cannot occur.
      */}
      <div className="play-actions dr-act">
        {state.phase === "reveal" ? (
          <Button variant="ink" onClick={() => dispatch({ t: "seen" })}>
            See result
          </Button>
        ) : null}
        {undoable ? (
          <Button variant="text" icon="undo" onClick={() => dispatch({ t: "undo" })}>
            Take back last · 1 left
          </Button>
        ) : null}
        {filled === 0 ? (
          <p className="t-body play-line">Every seat wants a different kind of person.</p>
        ) : null}
      </div>
    </div>
  );
}
