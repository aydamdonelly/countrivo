import Link from "next/link";
import type { ResultProps } from "@/games/types";
import { Flag } from "@/ui/flag";
import { CheckIcon } from "@/ui/icons/check";
import { CrossIcon } from "@/ui/icons/cross";
import { scopeName, type CapitalState } from "./module";
import "./capital-quiz.css";

/**
 * Under the score: the ten countries in board order, each with its capital, a mark for the
 * pick, and the city that was picked when it was wrong. Each row links to the country page.
 */
export function Result({ state }: ResultProps<CapitalState>) {
  const { g } = state;
  const scope = scopeName(g.region);
  return (
    <section className="cq-review" aria-labelledby="cq-review-title">
      <h2 id="cq-review-title" className="t-h3">{scope ? `Capitals of ${scope}` : "World capitals"}, your answers</h2>
      <ol className="cq-review-list">
        {g.questions.map((q, i) => {
          const a = g.answers[i];
          const hit = a === q.correctIndex;
          return (
            <li key={q.iso3}>
              <Link href={`/countries/${q.slug}`} className="cq-review-row" data-hit={hit || undefined}>
                <Flag iso2={q.iso2} size="xs" alt="" />
                <span className="cq-review-body">
                  <span className="cq-review-country">{q.country}</span>
                  <span className="cq-review-city">
                    {q.options[q.correctIndex]}
                    {!hit && a !== null ? <small className="t-meta">You picked {q.options[a]}</small> : null}
                  </span>
                </span>
                <span className="cq-review-mark">{hit ? <CheckIcon size={18} /> : <CrossIcon size={18} />}<span className="sr-only">{hit ? "Right" : "Wrong"}</span></span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
