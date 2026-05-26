"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const baseStyles: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5rem",
  fontWeight: 700,
  borderRadius: "var(--radius-xl)",
  border: "none",
  cursor: "pointer",
  textDecoration: "none",
  WebkitTapHighlightColor: "transparent",
  transition:
    "background-color var(--duration-fast) var(--ease-out), filter var(--duration-fast) var(--ease-out), transform var(--duration-instant) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)",
};

const sizeClass: Record<Size, string> = {
  sm: "px-3 py-2 min-h-9 text-sm",
  md: "px-5 py-3 min-h-11 text-base",
  lg: "px-6 py-3 min-h-13 text-lg",
};

const variantClass: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    className,
    disabled,
    children,
    style,
    type = "button",
    ...rest
  },
  ref,
) {
  const isDisabled = loading || disabled;
  const composed = [
    "countrivo-btn",
    variantClass[variant],
    sizeClass[size],
    fullWidth ? "w-full" : "",
    loading ? "opacity-70 pointer-events-none" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={composed}
      style={{ ...baseStyles, ...style }}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="inline-block w-4 h-4 rounded-full border-2 border-current border-r-transparent animate-spin"
        />
      ) : null}
      <span>{children}</span>
    </button>
  );
});
