import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import { NavigationLink } from "./navigation-link";
import { cn } from "@/lib/utils";
import { ArrowUpRightIcon } from "@/ui/icons/arrow-up-right";
import { ShareIcon } from "@/ui/icons/share";
import { UndoIcon } from "@/ui/icons/undo";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "on-ink";

interface BaseProps {
  /** primary (default): the one ink action of a view; secondary: paper with a wait ring;
   *  tertiary: underlined ink text; on-ink: paper fill inside an ink card. */
  variant?: ButtonVariant;
  /** Renders a <Link> with the same look. */
  href?: string;
  prefetch?: boolean;
  /** React 19 pending state: the label swaps to `pendingLabel`, aria-busy, no spinner. */
  pending?: boolean;
  pendingLabel?: string;
  /** Full-width block button (sheets, forms, result card footer). */
  block?: boolean;
  /** The only icons allowed inside a button. `share` leads the label; the others follow it. */
  icon?: "arrow-up-right" | "undo" | "share";
  /** Works for both the <button> and the <Link> form. */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  className?: string;
  children: ReactNode;
}

export type ButtonProps = BaseProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children" | "onClick">;

/**
 * One button, four variants (25 November 2026 design pass, `docs/decisions.md`): primary
 * 52 px ink, secondary 48 px paper with a 1 px wait ring, tertiary an underlined text link
 * with a 44 px hit area, on-ink a paper fill inside ink cards. Radius 10, gap 8, icons 20.
 * Pressed states move 1 px down unless the viewer prefers reduced motion. Never ember,
 * never a game colour.
 */
export function Button({
  variant = "primary",
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
  const cls = cn("btn", `btn-${variant}`, block && "btn-block", className);
  const label = pending && pendingLabel ? pendingLabel : children;
  const lead = icon === "share" ? <ShareIcon size={20} /> : null;
  const glyph = icon === "arrow-up-right" ? <ArrowUpRightIcon size={16} /> : icon === "undo" ? <UndoIcon size={16} /> : null;
  if (href) {
    return (
      <NavigationLink href={href} pendingLabel={pendingLabel} prefetch={prefetch} className={cls} aria-disabled={disabled || undefined} onClick={onClick}>
        {lead}
        {label}
        {glyph}
      </NavigationLink>
    );
  }
  return (
    <button type={type} className={cls} disabled={disabled} aria-busy={pending || undefined} onClick={onClick} {...rest}>
      {lead}
      {label}
      {glyph}
    </button>
  );
}
