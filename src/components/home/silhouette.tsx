/**
 * Country outline (real Natural Earth geometry) and the "crest": a player's
 * chosen country as a mark inside an ink circle. Friends usually live in the
 * same country, so the crest is an identity, not an address.
 */
export function Silhouette({
  d, size = 28, className = "", dashed = false, title,
}: { d: string; size?: number; className?: string; dashed?: boolean; title?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden={title ? undefined : true} role={title ? "img" : undefined}>
      {title && <title>{title}</title>}
      {dashed ? (
        <path d={d} fill="none" stroke="currentColor" strokeWidth={5} strokeDasharray="7 6" strokeLinecap="round" />
      ) : (
        <path d={d} fill="currentColor" />
      )}
    </svg>
  );
}

export function Crest({
  d, label, size = 40, muted = false, className = "",
}: { d: string | null; label: string; size?: number; muted?: boolean; className?: string }) {
  return (
    <span
      className={`crest inline-flex items-center justify-center rounded-full shrink-0 ${muted ? "bg-cream-dim text-bg" : "bg-cream text-bg"} ${className}`}
      style={{ width: size, height: size }}
      aria-label={label}
    >
      {d ? (
        <Silhouette d={d} size={Math.round(size * 0.62)} />
      ) : (
        <span className="font-display font-semibold" style={{ fontSize: Math.round(size * 0.44), lineHeight: 1 }}>
          {label.slice(0, 1).toUpperCase()}
        </span>
      )}
    </span>
  );
}
