import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { QuickAction, StatQuickView } from "@/games/quick-views";
import { cn, formatNumber } from "@/lib/utils";
import { Button } from "@/ui/button";
import { Flag } from "@/ui/flag";
import { CountUp } from "@/ui/count-up";
import { isGameHelpOpen } from "@/features/play/keys";
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
  const n = formatNumber(value).replace(/\.0(?=[KMBT]?$)/, "");
  return view.stat.startsWith("GDP") ? `$${n}` : view.stat.startsWith("Area") ? `${n} km²` : n;
}

/** A scale label as a person reads it: `1K`, `1.4B`, `$250`, never `10.0K` or `$250.63`. */
function scaleValue(view: StatQuickView, value: number): string {
  if (view.ruler.kind === "percent") return `${Math.round(value)}%`;
  const abs = Math.abs(value);
  const tiers: [number, string][] = [[1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]];
  const tier = tiers.find(([size]) => abs >= size);
  const body = tier ? `${Number((value / tier[0]).toPrecision(2))}${tier[1]}` : String(Math.round(value));
  return view.stat.startsWith("GDP") ? `$${body}` : body;
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

export function Board({ view, busy, commitBusy = busy, send, animate = false }: { view: StatQuickView; busy: boolean; commitBusy?: boolean; send: (action: QuickAction) => Promise<void>; animate?: boolean }) {
  const [pin, setPin] = useState(() => nearest(view.ruler, 0.5));
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const reveal = view.phase === "reveal";
  const guessed = reveal && view.guessValue !== null ? view.guessValue : view.ruler.steps[pin];
  const pinPos = position(view.ruler, guessed);
  const actualPos = view.actualValue === null ? null : position(view.ruler, view.actualValue);
  const live = !busy && !reveal;
  const decades = view.ruler.kind === "magnitude" ? Array.from({ length: Math.max(0, Math.floor(Math.log10(view.ruler.max)) - Math.floor(Math.log10(view.ruler.min))) }, (_, index) => 10 ** (Math.floor(Math.log10(view.ruler.min)) + index + 1)).filter(value => position(view.ruler, value) > 0.1 && position(view.ruler, value) < 0.9) : [];
  const scaleMarks = decades.filter((_, index) => decades.length <= 3 || index === 0 || index === Math.floor(decades.length / 2) || index === decades.length - 1);
  useLayoutEffect(() => { if (box.current) fitReferenceLabels(box.current); }, [view.refs]);
  useEffect(() => {
    const element = box.current;
    if (!element) return;
    let active = true;
    const observer = new ResizeObserver(() => fitReferenceLabels(element));
    observer.observe(element);
    for (const label of element.querySelectorAll<HTMLElement>(".qr-ref-label")) observer.observe(label);
    void document.fonts.ready.then(() => { if (active) fitReferenceLabels(element); });
    return () => { active = false; observer.disconnect(); };
  }, [view.refs]);
  function moveAt(clientX: number) { const bounds = box.current?.getBoundingClientRect(); if (bounds) setPin(nearest(view.ruler, (clientX - bounds.left) / bounds.width)); }
  function startDrag(event: PointerEvent<HTMLDivElement>) { if (!live || (event.pointerType === "mouse" && event.button !== 0)) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); dragging.current = true; moveAt(event.clientX); }
  function endDrag(event: PointerEvent<HTMLDivElement>) { dragging.current = false; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }
  function onKey(event: KeyboardEvent<HTMLSpanElement>) {
    if (isGameHelpOpen() || !live || event.ctrlKey || event.altKey || event.metaKey) return;
    let next: number | null = null;
    const upward = ["ArrowRight", "ArrowUp"].includes(event.key);
    const downward = ["ArrowLeft", "ArrowDown"].includes(event.key);
    if (upward || downward) next = event.shiftKey ? pin + (upward ? 1 : -1) : upward ? view.ruler.coarse.find((step) => step > pin) ?? view.ruler.steps.length - 1 : [...view.ruler.coarse].reverse().find((step) => step < pin) ?? 0;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = view.ruler.steps.length - 1;
    else if (event.key === "Enter" && !event.repeat && !commitBusy) { event.preventDefault(); void send({ t: "lock", i: pin }); }
    if (next !== null) { event.preventDefault(); setPin(Math.min(view.ruler.steps.length - 1, Math.max(0, next))); }
  }
  return <div className={cn("sg qr-stat-game", reveal && "is-reveal")}>
    <div className="sg-q"><div className="sg-name"><Flag iso2={view.country.iso2} size="s" alt="" eager /><b className="t-h2">{view.country.name}</b></div><div className="qr-stage-title"><p className="sg-stat t-body">{view.stat}</p>{view.doubled ? <span className="qr-multiplier t-meta" aria-label="This round counts double">×2</span> : null}</div></div>
    {reveal && view.actualValue !== null ? <div className="sg-live sg-compare">
      <span className="sg-you"><span className="cap t-meta"><i className="sg-key-pin" aria-hidden="true" />Your guess</span><b className="t-h2 num">{statValue(view, guessed)}</b></span>
      <span className="sg-answer"><span className="cap t-meta"><i className="sg-key-truth" aria-hidden="true" />Answer</span><b className="t-big num">{statValue(view, view.actualValue)}</b></span>
    </div> : <div className="sg-live"><span className="cap t-meta">Your guess</span><b className="t-big num">{statValue(view, guessed)}</b></div>}
    {reveal ? null : <p className="sg-hint t-meta">{view.ruler.kind === "magnitude" ? "Drag the pin to your estimate. The scale grows by multiples, so each mark is far bigger than the last." : "Drag the pin to your estimate, from 0 to 100%."}</p>}
    <div className={cn("sg-ruler", !live && "done")} onPointerDown={startDrag} onPointerMove={(event) => { if (dragging.current && live) moveAt(event.clientX); }} onPointerUp={endDrag} onPointerCancel={endDrag}><div className="sg-box" data-scale={view.ruler.kind} ref={box}>
      <span className="sg-line" aria-hidden="true" />{pinPos > 0.1 ? <span className="sg-end lo t-meta">{scaleValue(view, view.ruler.min)}</span> : null}{pinPos < 0.9 ? <span className="sg-end hi t-meta">{scaleValue(view, view.ruler.max)}</span> : null}
      {scaleMarks.map(value => <span className="sg-mark sg-scale-mark t-meta" key={value} style={{ left: `${position(view.ruler, value) * 100}%` }}>{scaleValue(view, value)}</span>)}
      {view.refs.map((ref, i) => <span className="sg-mark sg-ref" key={ref.name} style={{ left: `${position(view.ruler, ref.value) * 100}%` }}><span className="sg-tick" /><span className={cn("qr-ref-label t-meta", i === 0 ? "left" : "right")}><Flag iso2={ref.iso2} size="xs" alt="" /><span>{ref.name}<small className="num">{statValue(view, ref.value)}</small></span></span></span>)}
      {actualPos !== null ? <span className={cn("sg-mark sg-truth", animate && "drop")} style={{ left: `${actualPos * 100}%` }} aria-hidden="true"><span className="sg-tick" /><span className="sg-dot" /></span> : null}
      <span className="sg-mark sg-pin" style={{ left: `${pinPos * 100}%` }}><span className="sg-tick" /><span className="sg-knob" role="slider" tabIndex={live ? 0 : -1} aria-label={`Your guess for ${view.country.name}`} aria-valuemin={0} aria-valuemax={view.ruler.steps.length - 1} aria-valuenow={pin} aria-valuetext={statValue(view, guessed)} aria-disabled={!live} onKeyDown={onKey}><i /></span></span>
    </div></div>
    {reveal ? <div className="sg-foot"><div className="sg-out"><p className="gap t-body">{view.gap}</p><span className="pts"><CountUp value={(view.points ?? 0) * (view.doubled ? 2 : 1)} duration={400} animate={animate} className="t-h1" /><span className="of t-body">/ {view.doubled ? 200 : 100}</span></span>{view.context ? <p className="ctx t-body">{view.context}</p> : null}</div><div className="sg-act"><Button variant="primary" className="sg-cta" disabled={commitBusy} pending={commitBusy} pendingLabel={view.round + 1 === view.total ? "Opening result…" : "Next…"} onClick={(event) => { if (event.detail < 2) void send({ t: "next" }); }}>{view.round + 1 === view.total ? "Result" : "Next"}</Button></div></div> : <div className="sg-act"><Button variant="primary" className="sg-cta" disabled={commitBusy} pending={commitBusy} pendingLabel={busy ? "Guess locked…" : "Opening round…"} onClick={(event) => { if (event.detail < 2) void send({ t: "lock", i: pin }); }}>Lock in</Button></div>}
  </div>;
}
