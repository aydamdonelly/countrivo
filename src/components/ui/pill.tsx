import type { HTMLAttributes, ReactNode } from "react";

type Variant = "default" | "gold" | "muted";

interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  children: ReactNode;
}

const variantClass: Record<Variant, string> = {
  default: "bg-black/5 text-cream",
  gold: "bg-gold text-white",
  muted: "bg-black/10 text-cream-muted",
};

export function Pill({ variant = "default", className, children, ...rest }: PillProps) {
  const composed = [
    "inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xxs font-mono font-bold whitespace-nowrap leading-none",
    variantClass[variant],
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={composed} {...rest}>
      {children}
    </span>
  );
}
