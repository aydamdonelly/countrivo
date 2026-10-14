import type { QuickAction, FlagQuickView } from "@/games/quick-views";
import { Button } from "@/ui/button";
import { CheckIcon } from "@/ui/icons/check";
import { CrossIcon } from "@/ui/icons/cross";
import "./flag-quiz.css";

export function Board({ view, busy, pendingChoice, send }: { view: FlagQuickView; busy: boolean; pendingChoice?: number | null; send: (action: QuickAction) => Promise<void> }) {
  const reveal = view.phase === "reveal";
  return <div className="fq qr-flag"><div className="fq-top">{view.doubled ? <span className="qr-multiplier t-meta" aria-label="This round counts double">×2</span> : null}<div className="fq-box"><span className="flag">
    {/* eslint-disable-next-line @next/next/no-img-element -- opaque filename deliberately never identifies the flag */}
    <img src={view.flagSrc} alt="" width={640} height={480} decoding="async" /></span></div></div>
    <div className="fq-opts" role="group" aria-label="Which country has this flag?">{view.options.map((option, i) => {
      const status = !reveal ? "idle" : i === view.picked ? i === view.correctIndex ? "right" : "wrong" : i === view.correctIndex ? "answer" : "idle";
      return <button type="button" className="opt fq-opt t-list" key={`${view.round}-${option}`} disabled={busy || reveal} aria-pressed={pendingChoice === i} data-state={status} onClick={(event) => { if (event.detail < 2) void send({ t: "answer", i }); }}><span className="lbl">{option}</span>{status === "right" || status === "answer" ? <CheckIcon size={20} /> : status === "wrong" ? <CrossIcon size={20} /> : null}</button>;
    })}</div>
    <span className="sr-only" role="status">{reveal ? view.picked === view.correctIndex ? "Correct." : `The answer is ${view.correctIndex === null ? "" : view.options[view.correctIndex]}.` : ""}</span>
    {reveal ? <Button block variant="ink" className="qr-flag-next" disabled={busy} pending={busy} pendingLabel={view.round + 1 === view.total ? "Opening result…" : "Next…"} onClick={(event) => { if (event.detail < 2) void send({ t: "next" }); }}>{view.round + 1 === view.total ? "Result" : "Next"}</Button> : null}
    {reveal && view.fact ? <details className="qr-info"><summary className="t-meta">Spot the difference</summary><p className="t-body">{view.fact}</p>{view.source ? <p className="t-meta text-mute">{view.source}</p> : null}</details> : null}
  </div>;
}
