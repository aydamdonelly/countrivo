import { cn } from "@/lib/utils";

export interface FlameProps {
  /** 18 in the header, nudges and session lines; 36 on the profile. */
  size?: number;
  className?: string;
  /** Accessible name; the flame is decoration by default. */
  title?: string;
}

/**
 * The K3 flame, ported exactly (blueprint 4.4 and 6.1): three tongues with different
 * wobble rates, a core that breathes, two embers that rise. Fill is always ember, the
 * core is paper. It never turns grey and never goes out; reduced motion stops it.
 */
export function Flame({ size = 18, className, title }: FlameProps) {
  return (
    <svg
      className={cn("fl", className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <g className="fl-outer">
        <path
          d="M12 2.5c.6 3.2 4.4 5 4.4 9.4 0 2.6-1.3 4.6-3.1 5.7-.3-1.4-1-2.4-2-3.1-.9.9-1.6 2-1.8 3.3C7.6 16.7 6.4 14.6 6.4 12c0-2 .8-3.4 1.9-4.5.3 1.3 1 2.1 2 2.4C9.6 7.4 10 4.6 12 2.5z"
          fill="var(--color-ember)"
        />
      </g>
      <g className="fl-mid">
        <path
          d="M12 8.5c.5 2 2.6 3.1 2.6 5.6 0 1.6-.8 2.9-2 3.6-.2-.9-.6-1.6-1.2-2.1-.6.6-1 1.3-1.1 2.2-1.1-.7-1.9-2-1.9-3.5 0-1.3.5-2.2 1.2-2.9.2.8.6 1.3 1.2 1.5-.2-1.6.2-3.2 1.2-4.4z"
          fill="var(--color-ember)"
          opacity=".55"
        />
      </g>
      <g className="fl-core">
        <path
          d="M12 13.2c.4 1.2 1.5 1.9 1.5 3.3 0 1.1-.7 2-1.5 2.4-.8-.4-1.5-1.3-1.5-2.4 0-1.4 1.1-2.1 1.5-3.3z"
          fill="var(--color-paper)"
          opacity=".9"
        />
      </g>
      <circle className="fl-e1" cx="9.5" cy="9" r=".9" fill="var(--color-ember)" opacity="0" />
      <circle className="fl-e2" cx="15" cy="7.5" r=".7" fill="var(--color-ember)" opacity="0" />
    </svg>
  );
}
