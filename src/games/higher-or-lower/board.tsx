import type { QuickAction, HigherQuickView } from "@/games/quick-views";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/button";
import { Flag } from "@/ui/flag";
import { CheckIcon } from "@/ui/icons/check";
import { CrossIcon } from "@/ui/icons/cross";
import { ArrowUpRightIcon } from "@/ui/icons/arrow-up-right";
import { ArrowUpIcon } from "@/ui/icons/arrow-up";
import { ArrowDownIcon } from "@/ui/icons/arrow-down";
import { useEffect, useRef } from "react";

export function Board({ view, busy, pendingChoice, send }: { view: HigherQuickView; busy: boolean; pendingChoice?: "higher" | "lower" | null; send: (action: QuickAction) => Promise<void> }) {
  const reveal = view.phase === "reveal";
  const controls = useRef<HTMLDivElement>(null);
  const keyboardChoice = useRef(false);
  useEffect(() => {
    if (!busy && keyboardChoice.current) controls.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
  }, [reveal, busy]);
  return <div className="qr-higher"><div className="qr-stage-title"><p className="t-body qr-stat">{view.stat}</p>{view.doubled ? <span className="qr-multiplier t-meta" aria-label="This round counts double">×2</span> : null}</div>
    <div className="qr-pair">{[view.left, view.right].map((country, index) => <div className={cn("qr-country", index === 1 && reveal && "qr-country-reveal")} key={`${index}-${country.name}`}><div><Flag iso2={country.iso2} size="s" alt="" eager /><b className="t-h3">{country.name}</b>{index === 1 && reveal ? <span className={cn("qr-verdict t-body", !view.correct && "text-ember")}>{view.correct ? <CheckIcon size={18} /> : <CrossIcon size={18} />}{view.correct ? "Right" : "Wrong"}</span> : null}</div><b className="qr-value num">{country.value ?? "?"}{index === 1 && reveal && view.correct !== null ? <span className="qr-direction" aria-hidden="true">{(view.chosen === "higher") === view.correct ? <ArrowUpIcon size={22} /> : <ArrowDownIcon size={22} />}</span> : null}</b><small className="t-meta">{view.unit}</small></div>)}</div>
    {reveal ? <p className={cn("qr-verdict-line t-body", !view.correct && "is-wrong")}>{view.comparison}</p> : <p className="qr-question t-h3">{view.question}</p>}
    <p className="sr-only" role="status" aria-atomic="true">{reveal ? view.comparison ?? "" : ""}</p>
    <div ref={controls} className="qr-call-controls" role="group" aria-label={reveal ? "Next round" : view.question}>{reveal ? <Button block variant="primary" disabled={busy} pending={busy} pendingLabel={view.round + 1 >= view.total ? "Opening result…" : "Next…"} onClick={(event) => { if (event.detail < 2) { keyboardChoice.current = event.detail === 0; void send({ t: "next" }); } }}>{view.round + 1 >= view.total ? "Result" : "Next"}</Button> : <>{["higher", "lower"].map((direction) => <button className="qr-call" key={direction} type="button" disabled={busy} aria-pressed={pendingChoice === direction} onClick={(event) => { if (event.detail < 2) { keyboardChoice.current = event.detail === 0; void send({ t: "guess", c: direction === "higher" ? "higher" : "lower" }); } }}><span className={direction === "higher" ? "up" : "down"} aria-hidden="true"><ArrowUpRightIcon size={18} /></span>{direction === "higher" ? "Higher" : "Lower"}</button>)}</>}</div>
    {reveal ? <div className="qr-info"><details><summary className="t-meta">Source</summary><p className="t-meta text-mute">{view.source}</p></details></div> : null}
  </div>;
}
