import type { QuickAction, HigherQuickView } from "@/games/quick-views";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/button";
import { Flag } from "@/ui/flag";
import { CheckIcon } from "@/ui/icons/check";
import { CrossIcon } from "@/ui/icons/cross";
import { ArrowUpRightIcon } from "@/ui/icons/arrow-up-right";

export function Board({ view, busy, pendingChoice, send }: { view: HigherQuickView; busy: boolean; pendingChoice?: "higher" | "lower" | null; send: (action: QuickAction) => Promise<void> }) {
  const reveal = view.phase === "reveal";
  return <div className="qr-higher"><p className="t-body qr-stat">{view.stat}</p>{view.doubled ? <p className="t-meta text-mute">Counts double</p> : null}
    <div className="qr-pair">{[view.left, view.right].map((country, index) => <div className={cn("qr-country", index === 1 && reveal && "qr-country-reveal")} key={`${index}-${country.name}`}><div><Flag iso2={country.iso2} size="s" alt="" eager /><b className="t-h3">{country.name}</b>{index === 1 && reveal ? <span className={cn("qr-verdict t-body", !view.correct && "text-ember")}>{view.correct ? <CheckIcon size={18} /> : <CrossIcon size={18} />}{view.correct ? "Right" : "Wrong"}</span> : null}</div><b className="qr-value num">{country.value ?? "?"}</b><small className="t-meta">{view.unit}</small></div>)}</div>
    <p className="qr-question t-body">{reveal ? view.comparison : `Is ${view.right.name} higher or lower than ${view.left.name}?`}</p>
    {reveal ? <p className="t-meta text-mute">{view.source}</p> : null}
    <div className="qr-call-controls">{reveal ? <Button block variant="ink" disabled={busy} pending={busy} pendingLabel={view.round + 1 >= view.total ? "Opening result…" : "Next pair…"} onClick={(event) => { if (event.detail < 2) void send({ t: "next" }); }}>{view.round + 1 >= view.total ? "See result" : "Next pair"}</Button> : <>{["higher", "lower"].map((direction) => <button className="qr-call" key={direction} type="button" disabled={busy} aria-pressed={pendingChoice === direction} onClick={(event) => { if (event.detail < 2) void send({ t: "guess", c: direction === "higher" ? "higher" : "lower" }); }}><span className={direction === "higher" ? "up" : "down"} aria-hidden="true"><ArrowUpRightIcon size={18} /></span>{direction === "higher" ? "Higher" : "Lower"}</button>)}</>}</div>
    <p className="qr-keyhint t-meta">{reveal ? "Enter for the next pair." : "Up or H for Higher. Down or L for Lower."}</p>
  </div>;
}
