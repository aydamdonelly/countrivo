"use client";

import { useId, useRef, useState, type InputHTMLAttributes, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { Flag } from "@/ui/flag";

export interface SuggestItem {
  key: string;
  iso2?: string | null;
  name: string;
}

export interface SuggestProps extends Pick<InputHTMLAttributes<HTMLInputElement>, "inputMode" | "autoCapitalize" | "enterKeyHint" | "autoComplete" | "autoFocus" | "disabled" | "maxLength"> {
  id: string;
  label?: string;
  hideLabel?: boolean;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  /** The already-filtered suggestions; the component shows the first `max`. */
  items: readonly SuggestItem[];
  onSelect: (item: SuggestItem) => void;
  /** Enter with no active suggestion submits the raw text. */
  onSubmit?: (raw: string) => void;
  /** False requires an explicit arrow or pointer selection before Enter chooses an item. */
  autoSelectFirst?: boolean;
  max?: number;
  error?: string | null;
  tall?: boolean;
  className?: string;
}

/**
 * A Field with a listbox (blueprint 3.33) that opens above the field on phones and
 * below at >= 768: bar fill, radius 6, rows 44 tall with a Flag xs, the active row card
 * fill. ArrowUp/Down cycle, Enter submits the active suggestion (or the raw text),
 * Tab fills, Escape closes; mousedown on the list keeps the focus.
 */
export function Suggest({ id, label, hideLabel, placeholder, value, onChange, items, onSelect, onSubmit, autoSelectFirst = true, max = 5, error, tall, className, ...input }: SuggestProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const initialActive = autoSelectFirst ? 0 : -1;
  const [active, setActive] = useState(initialActive);
  const inputRef = useRef<HTMLInputElement>(null);
  const shown = items.slice(0, max);
  const expanded = open && value.length > 0 && shown.length > 0;
  const activeIdx = Math.min(active, Math.max(0, shown.length - 1));

  function choose(item: SuggestItem) {
    onSelect(item);
    setOpen(false);
    setActive(initialActive);
    inputRef.current?.focus();
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "ArrowDown" && shown.length) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % shown.length);
    } else if (e.key === "ArrowUp" && shown.length) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i <= 0 ? shown.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (expanded && shown[activeIdx]) choose(shown[activeIdx]);
      else onSubmit?.(value);
    } else if (e.key === "Tab" && expanded) {
      e.preventDefault();
      onChange(shown[Math.max(0, activeIdx)].name);
      setOpen(false);
      setActive(initialActive);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(initialActive);
    }
  }

  return (
    <div className={cn("suggest", className)}>
      <div className={cn("field", tall && "tall")}>
        {label ? (
          <label htmlFor={id} className={cn("lbl t-meta", hideLabel && "sr-only")}>
            {label}
          </label>
        ) : null}
        <input
          ref={inputRef}
          id={id}
          className="t-list"
          role="combobox"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={expanded && activeIdx >= 0 ? `${listId}-${activeIdx}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActive(initialActive);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setOpen(false);
            setActive(initialActive);
          }}
          onKeyDown={onKey}
          {...input}
        />
        {error ? (
          <p id={`${id}-error`} className="hint err t-meta" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      {expanded ? (
        <ul id={listId} role="listbox" className="list t-row" onMouseDown={(e) => e.preventDefault()}>
          {shown.map((item, i) => (
            <li key={item.key} id={`${listId}-${i}`} role="option" aria-selected={i === activeIdx} onMouseEnter={() => setActive(i)} onClick={() => choose(item)}>
              {item.iso2 !== undefined ? <Flag iso2={item.iso2} size="xs" alt="" /> : null}
              <span>{item.name}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
