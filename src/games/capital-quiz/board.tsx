import { useEffect } from "react";
import { CAPITAL_REGIONS, REGION_LABELS, canChooseRegion, type CapitalRegion } from "@/lib/game-logic/capital-quiz/engine";
import { optionState } from "@/games/_shared/option-list";
import type { BoardProps } from "@/games/types";
import { Button } from "@/ui/button";
import { Clay } from "@/ui/clay";
import { Flag } from "@/ui/flag";
import { OptionButton, Options } from "@/ui/options";
import { gameModule, scopeName, type CapitalAction, type CapitalState } from "./module";
import "./capital-quiz.css";

/** The face of the clay globe (cl-24) that shows a country's region. */
export function globeFace(region: string): string {
  if (region === "Americas") return "americas";
  if (region === "Asia") return "asia";
  if (region === "Oceania") return "pacific";
  return "afreu";
}

/** The face for a filter button. */
const FILTER_FACE: Readonly<Record<CapitalRegion, string>> = {
  world: "americas",
  africa: "afreu",
  americas: "americas",
  asia: "asia",
  europe: "afreu",
  oceania: "pacific",
};

/**
 * Capital Quiz: the continent filter (before the first pick only), the country with its
 * flag, four cities, and after the pick the right answer with one sentence and Next. The
 * board renders entirely from `state`, so the first HTML is the first question.
 */
export function Board({ state, dispatch, busy }: BoardProps<CapitalState, CapitalAction>) {
  const { g } = state;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (busy || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      // Enter and Space on a focused button already press it.
      if ((event.key === "Enter" || event.key === " ") && target instanceof HTMLButtonElement) return;
      const run = gameModule.keys?.(state, dispatch)[event.key];
      if (!run) return;
      event.preventDefault();
      run();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, dispatch, busy]);

  if (g.phase === "results") return null;
  const q = g.questions[g.current];
  const reveal = g.phase === "reveal";
  const chosen = g.answers[g.current];
  const right = chosen === q.correctIndex;
  const last = g.current + 1 >= g.questions.length;
  const scope = scopeName(g.region);

  return (
    <div className="cq" data-phase={g.phase}>
      {canChooseRegion(g) ? (
        <div className="cq-regions" role="group" aria-label="Capitals from">
          {CAPITAL_REGIONS.map((r) => (
            <button key={r} type="button" className="cq-region" aria-pressed={g.region === r} onClick={() => dispatch({ t: "region", r })}>
              <Clay object="cl-24" state={FILTER_FACE[r]} sizes="24px" loading="eager" className="cq-region-globe" />
              {REGION_LABELS[r]}
            </button>
          ))}
        </div>
      ) : (
        <p className="cq-scope t-meta">{scope ? `Capitals of ${scope}` : "World capitals"}</p>
      )}

      <div className="cq-ask">
        <Clay object="cl-24" state={globeFace(q.region)} sizes="72px" loading="eager" className="cq-globe" />
        <p className="cq-lead t-meta">What is the capital of</p>
        <h2 className="cq-country t-h2">
          <Flag iso2={q.iso2} size="s" alt="" eager />
          <span>{q.country}</span>
        </h2>
        {q.prompt ? <p className="cq-note t-meta">{q.prompt}</p> : null}
      </div>

      <Options busy={busy || reveal} className="cq-opts">
        {q.options.map((city, i) => (
          <OptionButton
            key={`${g.current}-${city}`}
            label={city}
            keyHint={String(i + 1)}
            state={optionState(i, chosen, q.correctIndex, reveal)}
            disabled={reveal}
            onClick={() => dispatch({ t: "pick", i })}
          />
        ))}
      </Options>

      <p className="sr-only" role="status">
        {reveal ? `${right ? "Right. " : "Not quite. "}${q.explanation}` : ""}
      </p>
      {reveal ? (
        <div className="cq-reveal">
          <p className="cq-explain t-body" aria-hidden="true">
            <b>{right ? "Right." : "Not quite."}</b> {q.explanation}
          </p>
          <Button block onClick={() => dispatch({ t: "next" })}>
            {last ? "See result" : "Next"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
