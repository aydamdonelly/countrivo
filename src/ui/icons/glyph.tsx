import type { ReactNode } from "react";
import type { Tone } from "@/ui/types";
import { toneVar } from "@/ui/types";
import { cn } from "@/lib/utils";

export type IconColor = Tone | "currentColor";

export interface GlyphProps {
  /** Pixel size; the drawing is a 24 grid. */
  size?: number;
  /** Stroke colour: a token name or currentColor (default). */
  color?: IconColor;
  /** Seed dot colour; defaults to the stroke colour. The active tab passes "ember". */
  seed?: IconColor;
  /** Accessible name. Without it the icon is aria-hidden. */
  title?: string;
  className?: string;
}

export function colorValue(c: IconColor | undefined): string {
  return !c || c === "currentColor" ? "currentColor" : toneVar(c);
}

/**
 * House icon frame (blueprint 4.1): 24 grid, 2 px round stroke, no fill, plus one
 * filled seed circle (r 1.2 to 1.6) where the icon defines it. Chevrons and arrows
 * carry no seed.
 */
export function Glyph({
  size = 22,
  color,
  seed,
  title,
  className,
  seedAt,
  children,
}: GlyphProps & { seedAt?: readonly [number, number, number]; children: ReactNode }) {
  const stroke = colorValue(color);
  const seedFill = seed ? colorValue(seed) : stroke;
  return (
    <svg
      className={cn("ic", className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {children}
      {seedAt ? <circle className="s" cx={seedAt[0]} cy={seedAt[1]} r={seedAt[2]} fill={seedFill} stroke="none" /> : null}
    </svg>
  );
}
