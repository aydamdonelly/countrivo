import type { ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "@/ui/icons/chevron-down";

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "className" | "id"> {
  id: string;
  label?: string;
  hideLabel?: boolean;
  hint?: string;
  /** Plain-name options, never decorated. */
  children: ReactNode;
  className?: string;
}

/** The same box as Field with a native select, appearance none and a faint chevron (blueprint 3.33). */
export function Select({ id, label, hideLabel, hint, children, className, ...rest }: SelectProps) {
  return (
    <div className={cn("select", className)}>
      {label ? (
        <label htmlFor={id} className={cn("lbl t-meta", hideLabel && "sr-only")}>
          {label}
        </label>
      ) : null}
      <div className="box">
        <select id={id} className="t-list" aria-describedby={hint ? `${id}-hint` : undefined} {...rest}>
          {children}
        </select>
        <ChevronDownIcon size={18} className="chev" />
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="hint t-meta">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
