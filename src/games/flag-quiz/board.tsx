"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CheckIcon } from "@/ui/icons/check";
import { CrossIcon } from "@/ui/icons/cross";
import type { BoardProps } from "@/games/types";
import { ADVANCE, countsDouble, currentQuestion, QUIZ_OPTIONS, type QuizAction, type QuizState } from "./module";
import "./flag-quiz.css";

/** New options ignore input for this long, so a double tap cannot answer the next flag. */
const ARM_MS = 300;

type RowState = "idle" | "right" | "wrong" | "answer";

function rowState(i: number, picked: number | null, correct: number): RowState {
  if (picked === null) return "idle";
  if (i === picked) return i === correct ? "right" : "wrong";
  return i === correct ? "answer" : "idle";
}

function editable(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  return t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable;
}

/**
 * The Flag Quiz board (panes FQ1 and FQ2). The flag in a fixed 3:2 box (320 on phones, 400
 * on desktop), "Counts double" above it from flag 8, then four names: 56 px rows at the
 * bottom of the phone screen, a 2 x 2 grid of 352 on desktop. The tap is the commit.
 *
 * The reveal is drawn from `state.pending`: the picked row fills ink (right) or ember
 * (wrong), the right row gets an ink outline and a check, and a lookalike shows its family
 * line under the options in a room that is always reserved. The host advances after 1.2 s;
 * a tap anywhere on the board, or Enter or Space, skips ahead. Every new flag ignores input
 * for 300 ms. Keys 1 to 4 pick; they are bound here because the guard lives here.
 *
 * Everything is in the first HTML: a resumed run paints its current flag with no effect.
 */
export function Board({ state, dispatch }: BoardProps<QuizState, QuizAction>) {
  const index = state.g.currentQuestion;
  const q = currentQuestion(state);
  const picked = state.pending;
  const revealed = picked !== null;
  const [firstShown] = useState(index);
  const armedAt = useRef(0);

  // Re-arm on every new flag (and at mount); a skip re-arms at once, before the paint.
  useEffect(() => {
    armedAt.current = performance.now() + ARM_MS;
  }, [index]);

  // Warm the next flag during this one, so the box never shows empty on the advance.
  const nextIso2 = state.g.questions[index + 1]?.country.iso2;
  useEffect(() => {
    if (!nextIso2) return;
    const img = new Image();
    img.src = `/flags/${nextIso2.toLowerCase()}.svg`;
  }, [nextIso2]);

  const skip = useCallback(() => {
    armedAt.current = performance.now() + ARM_MS;
    dispatch(ADVANCE);
  }, [dispatch]);

  const pick = useCallback(
    (i: number) => {
      if (performance.now() < armedAt.current) return;
      dispatch({ t: "answer", i });
    },
    [dispatch],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || editable(e.target)) return;
      if (revealed) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          skip();
        }
        return;
      }
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= QUIZ_OPTIONS) {
        e.preventDefault();
        pick(n - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, skip, pick]);

  const right = revealed && picked === q.correctIndex;

  return (
    <div className="fq" onClick={revealed ? skip : undefined}>
      <div className="fq-top">
        <p className="fq-meta t-meta">{countsDouble(state) ? "Counts double" : null}</p>
        <div key={index} className={cn("fq-box", index !== firstShown && "subj-in")}>
          <span className="flag">
            {/* eslint-disable-next-line @next/next/no-img-element -- static SVG asset; alt stays empty, naming it would answer it */}
            <img src={`/flags/${q.country.iso2.toLowerCase()}.svg`} alt="" width={640} height={480} decoding="async" />
          </span>
        </div>
      </div>

      <div className="fq-opts" role="group" aria-label="Four names">
        {q.options.map((c, i) => {
          const st = rowState(i, picked, q.correctIndex);
          return (
            <button
              key={`${index}-${c.iso3}`}
              type="button"
              className="opt fq-opt t-list"
              data-state={st}
              aria-disabled={revealed || undefined}
              onClick={revealed ? undefined : () => pick(i)}
            >
              <span className="lbl">{c.displayName}</span>
              {st === "right" || st === "answer" ? <CheckIcon size={20} className="fq-ic" /> : st === "wrong" ? <CrossIcon size={20} className="fq-ic" /> : null}
            </button>
          );
        })}
      </div>

      <div className="fq-family">
        {revealed && q.family ? (
          <>
            <p className="ln t-list">{q.family.line}</p>
            <p className="src t-meta">{q.family.source}</p>
          </>
        ) : null}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {revealed ? (right ? "Right." : `Wrong. It was ${q.country.displayName}.`) : ""}
      </p>
    </div>
  );
}
