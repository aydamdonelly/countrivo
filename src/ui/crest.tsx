import { cn } from "@/lib/utils";

export interface CrestProps {
  /** The 100x100 silhouette path of the chosen country, or null for the seed crest. */
  path: string | null;
  /** 22 nav and bylines, 26 rows, 40 strips, 64 profile heads. */
  size?: number;
  /** Waiting friend: wait fill instead of ink. */
  muted?: boolean;
  /** The viewer's own crest where K3 shows it: an ember ring. */
  ring?: boolean;
  /** Accessible name (the person's name); decoration when omitted. */
  label?: string;
  className?: string;
}

/**
 * A person's crest (blueprint 3.16): the chosen country outline in an ink circle.
 * No country: the seed crest, one paper dot at the centre. Never an initial, never "?".
 */
export function Crest({ path, size = 26, muted, ring, label, className }: CrestProps) {
  const inner = Math.round(size * 0.62);
  // The seed dot is size * 0.1 px; the svg maps 100 units onto `inner` px.
  const seedR = ((size * 0.1) * 100) / inner;
  const name = path === null ? "no crest yet" : label;
  return (
    <span
      className={cn("crest", muted && "muted", ring && "crest-ring", className)}
      style={{ width: size, height: size }}
      role={name ? "img" : undefined}
      aria-label={name}
      aria-hidden={name ? undefined : true}
    >
      <svg viewBox="0 0 100 100" width={inner} height={inner} aria-hidden="true">
        {path === null ? (
          <circle cx="50" cy="50" r={seedR} fill="var(--color-paper)" />
        ) : (
          <path d={path} fill="var(--color-paper)" />
        )}
      </svg>
    </span>
  );
}
