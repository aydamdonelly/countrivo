import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import type { QuickAction, StatQuickView } from "@/games/quick-views";
import { cn, formatNumber } from "@/lib/utils";
import { Button } from "@/ui/button";
import { Flag } from "@/ui/flag";
import { CountUp } from "@/ui/count-up";
import "./ruler.css";

function position(ruler: StatQuickView["ruler"], value: number): number {
  const raw = ruler.kind === "magnitude" ? Math.log(Math.max(value, ruler.min) / ruler.min) / Math.log(ruler.max / ruler.min) : (value - ruler.min) / (ruler.max - ruler.min);
  return Math.max(0, Math.min(1, raw));
}
function nearest(ruler: StatQuickView["ruler"], point: number): number {
  let index = 0; let distance = Infinity;
  ruler.steps.forEach((value, i) => { const d = Math.abs(position(ruler, value) - point); if (d < distance) { index = i; distance = d; } });
  return index;
}
function statValue(view: StatQuickView, value: number): string {
  if (view.ruler.kind === "percent") return `${Number(value.toFixed(1))}%`;
  const n = formatNumber(value);
  return view.stat.startsWith("GDP") ? `$${n}` : view.stat.startsWith("Area") ? `${n} km²` : n;
}

function fitReferenceLabels(box: HTMLDivElement): void {
  const width = box.clientWidth;
  const boxLeft = box.getBoundingClientRect().left;
  const positions: {label: HTMLElement; left: number}[] = [];
  for (const label of box.querySelectorAll<HTMLElement>(".qr-ref-label")) {
    const mark = label.parentElement;
    if (!mark) continue;
    const point = mark.getBoundingClientRect().left - boxLeft;
    const labelWidth = label.getBoundingClientRect().width;
    const wanted = label.classList.contains("left") ? point - labelWidth - 6 : point + 6;
    const clamped = Math.max(0, Math.min(width - labelWidth, wanted));
    positions.push({label, left: clamped - point});
  }
  for (const {label, left} of positions) {
    label.style.left = `${left}px`;
    label.style.right = "auto";
  }
}

export function Board({ view, busy, send, animate = false }: { view: StatQuickView; busy: boolean; send: (action: QuickAction) => Promise<void>; animate?: boolean }) {
  const [pin, setPin] = useState(() => nearest(view.ruler, 0.5));
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const reveal = view.phase === "reveal";
  const guessed = reveal && view.guessValue !== null ? view.guessValue : view.ruler.steps[pin];
  const pinPos = position(view.ruler, guessed);
  const actualPos = view.actualValue === null ? null : position(view.ruler, view.actualValue);
  const live = !busy && !reveal;
  useLayoutEffect(() => { if (box.current) fitReferenceLabels(box.current); }, [view.refs]);
  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(() => fitReferenceLabels(element));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  function moveAt(clientX: number) { const bounds = box.current?.getBoundingClientRect(); if (bounds) setPin(nearest(view.ruler, (clientX - bounds.left) / bounds.width)); }
  function startDrag(event: PointerEvent<HTMLDivElement>) { if (!live || (event.pointerType === "mouse" && event.button !== 0)) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); dragging.current = true; moveAt(event.clientX); }
  function endDrag(event: PointerEvent<HTMLDivElement>) { dragging.current = false; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }
  const onKey = useCallback((event: KeyboardEvent) => {
    if (!live || event.ctrlKey || event.altKey || event.metaKey || event.target instanceof HTMLElement && event.target.closest("input,textarea,select")) return;
    let next: number | null = null;
    const upward = ["ArrowRight", "ArrowUp"].includes(event.key);
    const downward = ["ArrowLeft", "ArrowDown"].includes(event.key);
    if (upward || downward) next = event.shiftKey ? pin + (upward ? 1 : -1) : upward ? view.ruler.coarse.find((step) => step > pin) ?? view.ruler.steps.length - 1 : [...view.ruler.coarse].reverse().find((step) => step < pin) ?? 0;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = view.ruler.steps.length - 1;
    else if (event.key === "Enter" && !(event.target instanceof HTMLElement && event.target.closest("button,a"))) { event.preventDefault(); void send({ t: "lock", i: pin }); }
    if (next !== null) { event.preventDefault(); setPin(Math.min(view.ruler.steps.length - 1, Math.max(0, next))); }
  }, [live, pin, view.ruler, send]);
  useEffect(() => { window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [onKey]);
  return <div className={cn("sg qr-stat-game", reveal && "is-reveal")}>
    <div className="sg-q"><div className="sg-name"><Flag iso2={view.country.iso2} size="s" alt="" eager /><b className="t-h2">{view.country.name}</b></div><p className="sg-stat t-body">{view.stat}</p>{view.doubled ? <p className="t-meta text-mute">Counts double</p> : null}</div>
    <div className="sg-live"><span className="cap t-body">{reveal ? "The answer" : "about"}</span><b className="t-big num">{statValue(view, view.actualValue ?? guessed)}</b></div>
    <div className={cn("sg-ruler", !live && "done")} onPointerDown={startDrag} onPointerMove={(event) => { if (dragging.current && live) moveAt(event.clientX); }} onPointerUp={endDrag} onPointerCancel={endDrag}><div className="sg-box" ref={box}>
      <span className="sg-line" aria-hidden="true" /><span className="sg-end lo t-meta">{statValue(view, view.ruler.min)}</span><span className="sg-end hi t-meta">{statValue(view, view.ruler.max)}</span>
      {view.refs.map((ref, i) => <span className="sg-mark sg-ref" key={ref.name} style={{ left: `${position(view.ruler, ref.value) * 100}%` }}><span className="sg-tick" /><span className={cn("qr-ref-label t-meta", i === 0 ? "left" : "right")}><Flag iso2={ref.iso2} size="xs" alt="" />{ref.name}</span></span>)}
      {actualPos !== null ? <><span className={cn("sg-mark sg-truth", animate && "drop")} style={{ left: `${actualPos * 100}%` }} aria-hidden="true"><span className="sg-tick" /><span className="sg-dot" /></span><span className="qr-truth-label t-meta">{view.country.name}: {statValue(view, view.actualValue ?? 0)}</span></> : null}
      <span className="sg-mark sg-pin" style={{ left: `${pinPos * 100}%` }}><span className="sg-tick" /><span className="sg-knob" role="slider" tabIndex={live ? 0 : -1} aria-label={`Your guess for ${view.country.name}`} aria-valuemin={0} aria-valuemax={view.ruler.steps.length - 1} aria-valuenow={pin} aria-valuetext={statValue(view, guessed)} aria-disabled={!live}><i /></span></span>
    </div></div>
    {reveal ? <div className="sg-foot"><div className="sg-out"><p className="gap t-body">{view.gap}</p><span className="pts"><CountUp value={(view.points ?? 0) * (view.doubled ? 2 : 1)} duration={400} animate={animate} className="t-h1" /><span className="of t-body">of {view.doubled ? 200 : 100}</span></span><p className="ctx t-meta">{view.context}</p></div><div className="sg-act"><Button variant="ink" className="sg-cta" disabled={busy} pending={busy} pendingLabel={view.round + 1 === view.total ? "Opening result…" : "Next…"} onClick={(event) => { if (event.detail < 2) void send({ t: "next" }); }}>{view.round + 1 === view.total ? "See result" : "Next"}</Button></div></div> : <div className="sg-act"><Button variant="ink" className="sg-cta" disabled={busy} pending={busy} pendingLabel="Guess locked…" onClick={(event) => { if (event.detail < 2) void send({ t: "lock", i: pin }); }}>Lock it</Button></div>}
  </div>;
}
