import type { InputHTMLAttributes, Ref } from "react";
import { cn } from "@/lib/utils";

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "id"> {
  id: string;
  /** Shown above in 12 px mute, or visually hidden with `hideLabel`. */
  label?: string;
  hideLabel?: boolean;
  hint?: string;
  /** Ember hint text, no red border. */
  error?: string | null;
  /** 48 px on phones for typed games. */
  tall?: boolean;
  /** Blitz: a wrong answer rings the field in ember for 500 ms. */
  emberRing?: boolean;
  ref?: Ref<HTMLInputElement>;
  className?: string;
}

/**
 * A text field (blueprint 3.33): 44 tall, radius 6, card fill, no border, 16 px ink so
 * iOS never zooms, placeholder mute, the global focus ring.
 */
export function Field({ id, label, hideLabel, hint, error, tall, emberRing, className, ref, ...rest }: FieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cn("field", tall && "tall", emberRing && "ember-ring", className)}>
      {label ? (
        <label htmlFor={id} className={cn("lbl t-meta", hideLabel && "sr-only")}>
          {label}
        </label>
      ) : null}
      <input id={id} ref={ref} className="t-list" aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...rest} />
      {error ? (
        <p id={`${id}-error`} className="hint err t-meta" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="hint t-meta">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
