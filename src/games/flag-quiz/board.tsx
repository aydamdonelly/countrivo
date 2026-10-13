import type { QuickAction, FlagQuickView } from "@/games/quick-views";
import { Button } from "@/ui/button";
import { CheckIcon } from "@/ui/icons/check";
import { CrossIcon } from "@/ui/icons/cross";
import "./flag-quiz.css";

export function Board({ view, busy, send }: { view: FlagQuickView; busy: boolean; send: (action: QuickAction) => Promise<void> }) {
  const reveal = view.phase === "reveal";
  return <div className="fq qr-flag"><div className="fq-top"><p className="fq-meta t-meta">Flag {view.round + 1} of {view.total}{view.doubled ? " · Counts double" : ""}</p><div className="fq-box"><span className="flag">
    {/* eslint-disable-next-line @next/next/no-img-element -- opaque filename deliberately never identifies the flag */}
    <img src={view.flagSrc} alt="" width={640} height={480} decoding="async" /></span></div></div>
    <div className="fq-opts" role="group" aria-label="Which country has this flag?">{view.options.map((option, i) => {
      const status = !reveal ? "idle" : i === view.picked ? i === view.correctIndex ? "right" : "wrong" : i === view.correctIndex ? "answer" : "idle";
      return <button type="button" className="opt fq-opt t-list" key={`${view.round}-${option}`} disabled={busy || reveal} data-state={status} onClick={() => void send({ t: "answer", i })}><span className="lbl">{option}</span>{status === "right" || status === "answer" ? <CheckIcon size={20} /> : status === "wrong" ? <CrossIcon size={20} /> : null}</button>;
    })}</div>
    <div className="fq-family" role="status" aria-live="polite">{reveal ? <><p className="t-body">{view.picked === view.correctIndex ? "Right." : `It was ${view.correctIndex === null ? "" : view.options[view.correctIndex]}.`}</p>{view.fact ? <p className="t-list">{view.fact}</p> : null}{view.source ? <p className="t-meta text-mute">{view.source}</p> : null}</> : null}</div>
    {reveal ? <Button block variant="ink" className="qr-flag-next" disabled={busy} onClick={() => void send({ t: "next" })}>{view.round + 1 === view.total ? "See result" : "Next flag"}</Button> : null}
    <p className="qr-keyhint t-meta">{reveal ? "Enter for the next flag." : "Press 1 to 4 to choose."}</p>
  </div>;
}
