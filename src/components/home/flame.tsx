/**
 * The streak flame. Three tongues on three rhythms, a breathing core, two
 * embers that rise and fade. Keyframes live in globals.css (.fl-*), gated by
 * prefers-reduced-motion there.
 */
export function Flame({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      className={`flame ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ overflow: "visible" }}
      aria-hidden
    >
      <g className="fl-outer">
        <path d="M12 2.5c.6 3.2 4.4 5 4.4 9.4 0 2.6-1.3 4.6-3.1 5.7-.3-1.4-1-2.4-2-3.1-.9.9-1.6 2-1.8 3.3C7.6 16.7 6.4 14.6 6.4 12c0-2 .8-3.4 1.9-4.5.3 1.3 1 2.1 2 2.4C9.6 7.4 10 4.6 12 2.5z" fill="currentColor" />
      </g>
      <g className="fl-mid">
        <path d="M12 8.5c.5 2 2.6 3.1 2.6 5.6 0 1.6-.8 2.9-2 3.6-.2-.9-.6-1.6-1.2-2.1-.6.6-1 1.3-1.1 2.2-1.1-.7-1.9-2-1.9-3.5 0-1.3.5-2.2 1.2-2.9.2.8.6 1.3 1.2 1.5-.2-1.6.2-3.2 1.2-4.4z" fill="currentColor" opacity=".55" />
      </g>
      <g className="fl-core">
        <path d="M12 13.2c.4 1.2 1.5 1.9 1.5 3.3 0 1.1-.7 2-1.5 2.4-.8-.4-1.5-1.3-1.5-2.4 0-1.4 1.1-2.1 1.5-3.3z" fill="var(--color-bg)" opacity=".9" />
      </g>
      <circle className="fl-e1" cx="9.5" cy="9" r=".9" fill="currentColor" opacity="0" />
      <circle className="fl-e2" cx="15" cy="7.5" r=".7" fill="currentColor" opacity="0" />
    </svg>
  );
}
