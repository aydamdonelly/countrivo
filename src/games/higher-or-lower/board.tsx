import type { QuickAction, HigherQuickView } from "@/games/quick-views";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/button";
import { Flag } from "@/ui/flag";
import { CheckIcon } from "@/ui/icons/check";
import { CrossIcon } from "@/ui/icons/cross";
import { ArrowUpRightIcon } from "@/ui/icons/arrow-up-right";

export function Board({ view, busy, pendingChoice, send }: { view: HigherQuickView; busy: boolean; pendingChoice?: "higher" | "lower" | null; send: (action: QuickAction) => Promise<void> }) {
  const reveal = view.phase === "reveal";
  return <div className="qr-higher"><div className="qr-stage-title"><p className="t-body qr-stat">{view.stat}</p>{view.doubled ? <span className="qr-multiplier t-meta" aria-label="This round counts double">×2</span> : null}</div>
    <div className="qr-pair">{[view.left, view.right].map((country, index) => <div className={cn("qr-country", index === 1 && reveal && "qr-country-reveal")} key={`${index}-${country.name}`}><div><Flag iso2={country.iso2} size="s" alt="" eager /><b className="t-h3">{country.name}</b>{index === 1 && reveal ? <span className={cn("qr-verdict t-body", !view.correct && "text-ember")}>{view.correct ? <CheckIcon size={18} /> : <CrossIcon size={18} />}{view.correct ? "Right" : "Wrong"}</span> : null}</div><b className="qr-value num">{country.value ?? "?"}</b><small className="t-meta">{view.unit}</small></div>)}</div>
    <div className="qr-call-controls" role="group" aria-label={reveal ? "Next round" : `Is ${view.right.name} higher or lower than ${view.left.name}?`}>{reveal ? <Button block variant="ink" disabled={busy} pending={busy} pendingLabel={view.round + 1 >= view.total ? "Opening result…" : "Next…"} onClick={(event) => { if (event.detail < 2) void send({ t: "next" }); }}>{view.round + 1 >= view.total ? "Result" : "Next"}</Button> : <>{["higher", "lower"].map((direction) => <button className="qr-call" key={direction} type="button" disabled={busy} aria-pressed={pendingChoice === direction} onClick={(event) => { if (event.detail < 2) void send({ t: "guess", c: direction === "higher" ? "higher" : "lower" }); }}><span className={direction === "higher" ? "up" : "down"} aria-hidden="true"><ArrowUpRightIcon size={18} /></span>{direction === "higher" ? "Higher" : "Lower"}</button>)}</>}</div>
    {reveal ? <details className="qr-info"><summary className="t-meta">Why?</summary><p className="t-body">{view.comparison}</p><p className="t-meta text-mute">{view.source}</p></details> : null}
  </div>;
}
