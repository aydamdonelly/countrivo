"use client";

import { useCallback, useRef, useSyncExternalStore, type ReactNode } from "react";

/**
 * Horizontal snap carousel. Native scroll (momentum, swipe, keyboard), so the
 * cards are real content at all times. Reports the centred card so the board
 * underneath can follow.
 */
export function GameCarousel({
  cards, slugs, active, onChange,
}: { cards: ReactNode[]; slugs: string[]; active: number; onChange: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef<number | null>(null);
  const hasMouse = useSyncExternalStore(
    (cb) => { const mq = window.matchMedia("(hover: hover) and (pointer: fine)"); mq.addEventListener("change", cb); return () => mq.removeEventListener("change", cb); },
    () => window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    () => false,
  );

  const measure = useCallback(() => {
    const el = ref.current; if (!el) return;
    const mid = el.scrollLeft + el.clientWidth / 2;
    let best = 0, dist = Infinity;
    Array.from(el.children).forEach((c, i) => {
      const h = c as HTMLElement; const centre = h.offsetLeft + h.offsetWidth / 2;
      const d = Math.abs(centre - mid); if (d < dist) { dist = d; best = i; }
    });
    if (best !== active) onChange(best);
  }, [active, onChange]);

  const onScroll = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(measure);
  };

  const scrollTo = (i: number) => {
    const el = ref.current; if (!el) return;
    const child = el.children[i] as HTMLElement | undefined; if (!child) return;
    el.scrollTo({ left: child.offsetLeft - (el.clientWidth - child.offsetWidth) / 2, behavior: "smooth" });
  };

  return (
    <div className="relative -mx-5 sm:mx-0">
      <div
        ref={ref}
        onScroll={onScroll}
        className="carousel flex gap-3 overflow-x-auto snap-x snap-mandatory px-5 sm:px-0 pb-1 no-scrollbar"
        role="region"
        aria-roledescription="carousel"
        aria-label="Today's games"
      >
        {cards.map((card, i) => (
          <div
            key={slugs[i]}
            className={`snap-center shrink-0 flex w-[calc(100%-2.5rem)] sm:w-full transition-[transform,opacity] duration-300 ease-[var(--ease-emphasis)] ${i === active ? "scale-100 opacity-100" : "scale-[0.97] opacity-70"}`}
            inert={i !== active}
          >
            {card}
          </div>
        ))}
      </div>

      {/* Progress: the active segment stretches, the rest stay as dots. */}
      <div className="mt-3 flex items-center justify-center gap-1.5" role="tablist" aria-label="Game">
        {slugs.map((s, i) => (
          <button
            key={s}
            role="tab"
            aria-selected={i === active}
            aria-label={s.replace(/-/g, " ")}
            onClick={() => scrollTo(i)}
            className="py-3 px-2.5 -my-2 -mx-1"
          >
            <span className={`block h-1.5 rounded-full transition-[width,background-color] duration-300 ease-[var(--ease-emphasis)] ${i === active ? "w-6 bg-cream" : "w-1.5 bg-cream-dim hover:bg-cream-muted"}`} />
          </button>
        ))}
      </div>

      {hasMouse && (
        <>
          <button
            type="button"
            aria-label="Previous game"
            onClick={() => scrollTo(Math.max(0, active - 1))}
            className={`absolute left-1 sm:-left-5 top-[40%] w-9 h-9 rounded-full bg-surface text-cream flex items-center justify-center transition-opacity ${active === 0 ? "opacity-0 pointer-events-none" : "opacity-90 hover:opacity-100"}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <button
            type="button"
            aria-label="Next game"
            onClick={() => scrollTo(Math.min(slugs.length - 1, active + 1))}
            className={`absolute right-1 sm:-right-5 top-[40%] w-9 h-9 rounded-full bg-surface text-cream flex items-center justify-center transition-opacity ${active === slugs.length - 1 ? "opacity-0 pointer-events-none" : "opacity-90 hover:opacity-100"}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </>
      )}
    </div>
  );
}
