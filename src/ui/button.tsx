import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowUpRightIcon } from "@/ui/icons/arrow-up-right";
import { UndoIcon } from "@/ui/icons/undo";

export type ButtonVariant = "shoot" | "ink" | "quiet" | "text";

interface BaseProps {
  /** shoot on ink surfaces, ink (default) on paper, quiet for secondary, text for inline. */
  variant?: ButtonVariant;
  /** Renders a <Link> with the same look. */
  href?: string;
  prefetch?: boolean;
  /** React 19 pending state: the label swaps to `pendingLabel`, aria-busy, no spinner. */
  pending?: boolean;
  pendingLabel?: string;
  /** Full-width block button (auth sheet, forms). */
  block?: boolean;
  /** The only icons allowed inside a button. */
  icon?: "arrow-up-right" | "undo";
  /** Works for both the <button> and the <Link> form. */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  className?: string;
  children: ReactNode;
}

export type ButtonProps = BaseProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children" | "onClick">;

/**
 * One button, four variants, no outlined variant (blueprint 3.14). All: min-height 44,
 * inline-flex, gap 8, radius 6, 15/600 label, background-colour transition only; no
 * transform, no shadow. Two actions side by side are one ink/shoot plus one text.
 */
export function Button({
  variant = "ink",
  href,
  prefetch,
  pending,
  pendingLabel,
  block,
  icon,
  onClick,
  className,
  children,
  type = "button",
  disabled,
  ...rest
}: ButtonProps) {
  const cls = cn("btn", `btn-${variant}`, "t-cta", block && "btn-block", className);
  const label = pending && pendingLabel ? pendingLabel : children;
  const glyph = icon === "arrow-up-right" ? <ArrowUpRightIcon size={16} /> : icon === "undo" ? <UndoIcon size={16} /> : null;
  if (href) {
    return (
      <Link href={href} prefetch={prefetch} className={cls} aria-disabled={disabled || undefined} onClick={onClick}>
        {label}
        {glyph}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} disabled={disabled} aria-busy={pending || undefined} onClick={onClick} {...rest}>
      {label}
      {glyph}
    </button>
  );
}
