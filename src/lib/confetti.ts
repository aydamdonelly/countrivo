/**
 * Dependency-free canvas confetti burst for celebration moments (a great score,
 * a personal best). Reduced-motion safe. Presentational only — not game logic,
 * so Math.random is fine here.
 */
const COLORS = ["#d4a017", "#16a34a", "#f3f1ea", "#b8860b", "#e8b923"];

interface Particle {
  x: number; y: number; vx: number; vy: number; g: number;
  size: number; color: string; rot: number; vr: number;
}

export function fireConfetti(durationMs = 2200): void {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const W = window.innerWidth;
  const H = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const canvas = document.createElement("canvas");
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  Object.assign(canvas.style, {
    position: "fixed", inset: "0", width: "100%", height: "100%",
    pointerEvents: "none", zIndex: "9999",
  } as Partial<CSSStyleDeclaration>);
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) { canvas.remove(); return; }
  ctx.scale(dpr, dpr);

  const parts: Particle[] = Array.from({ length: 150 }, () => {
    const fromLeft = Math.random() < 0.5;
    return {
      x: fromLeft ? W * 0.12 : W * 0.88,
      y: H * 0.3,
      vx: (fromLeft ? 1 : -1) * (Math.random() * 6 + 2) + (Math.random() - 0.5) * 4,
      vy: -(Math.random() * 11 + 7),
      g: 0.3 + Math.random() * 0.12,
      size: Math.random() * 6 + 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
    };
  });

  const start = performance.now();
  function frame(now: number) {
    const t = now - start;
    ctx!.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.vy += p.g; p.vx *= 0.99;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rot);
      ctx!.globalAlpha = Math.max(0, 1 - t / durationMs);
      ctx!.fillStyle = p.color;
      ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx!.restore();
    }
    if (t < durationMs) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}
