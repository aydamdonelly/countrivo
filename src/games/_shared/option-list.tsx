"use client";

import { Options, OptionButton, type OptionState } from "@/ui/options";

export interface AnswerOption {
  label: string;
  /** A Flag xs lead (Flag s on tiles); null draws the wait box. */
  iso2?: string | null;
}

export interface AnswerOptionsProps {
  options: readonly AnswerOption[];
  /** The picked index, once picked. */
  chosen: number | null;
  correctIndex: number;
  /** True while the answer is shown (the feedback window or the explicit-next phase). */
  revealed: boolean;
  busy: boolean;
  onPick: (index: number) => void;
  grid?: "1" | "2";
  /** 72 px tiles with the flag above the name (Odd One Out). */
  tile?: boolean;
  /** 60 px rows (Speed Flags). */
  tall?: boolean;
  /** Key hints 1..n, hidden on touch. */
  keyHints?: boolean;
}

/** The option state a quiz row takes (blueprint 3.21): chosen-right, chosen-wrong, answer (when missed), dim. */
export function optionState(i: number, chosen: number | null, correctIndex: number, revealed: boolean): OptionState {
  if (!revealed) return "idle";
  if (i === chosen) return i === correctIndex ? "chosen-right" : "chosen-wrong";
  if (i === correctIndex) return "answer";
  return "dim";
}

/** Four (or two) answer rows with the revealed states derived from the pick. */
export function AnswerOptions({ options, chosen, correctIndex, revealed, busy, onPick, grid = "1", tile, tall, keyHints = true }: AnswerOptionsProps) {
  return (
    <Options grid={grid} busy={busy || revealed} tall={tall}>
      {options.map((o, i) => (
        <OptionButton
          key={`${i}-${o.label}`}
          label={o.label}
          iso2={o.iso2 ?? undefined}
          tile={tile}
          keyHint={keyHints ? String(i + 1) : undefined}
          state={optionState(i, chosen, correctIndex, revealed)}
          onClick={() => onPick(i)}
          disabled={revealed}
        />
      ))}
    </Options>
  );
}
