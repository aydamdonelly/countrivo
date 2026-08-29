import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Flag } from "@/ui/flag";
import { ArrowUpIcon } from "@/ui/icons/arrow-up";
import { ArrowDownIcon } from "@/ui/icons/arrow-down";

export type OptionState = "idle" | "chosen-right" | "chosen-wrong" | "answer" | "dim";

export interface OptionsProps {
  /** `2` renders a 2x2 grid (Odd One Out tiles, Speed Flags rows). */
  grid?: "1" | "2";
  /** Disables pointer events without changing the look (a feedback window). */
  busy?: boolean;
  /** 60 px rows (Speed Flags). */
  tall?: boolean;
  children: ReactNode;
  className?: string;
}

/** Full-width stack of options, gap 8 (blueprint 3.21). */
export function Options({ grid = "1", busy, tall, children, className }: OptionsProps) {
  return (
    <div className={cn("opts", grid === "2" && "grid2", busy && "busy", tall && "tall", className)} role="group">
      {children}
    </div>
  );
}

export interface OptionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
  label: ReactNode;
  /** A Flag xs lead (Flag s on tiles). */
  iso2?: string;
  /** `1`..`4`, hidden on touch. */
  keyHint?: string;
  state?: OptionState;
  /** Higher or Lower and Risk Zone. */
  icon?: "arrow-up" | "arrow-down";
  /** A second mute line (`one wrong wipes 225`). */
  small?: string;
  /** A 72 px tile with the flag above the name (Odd One Out). */
  tile?: boolean;
  className?: string;
}

/**
 * One option (blueprint 3.21): 52 tall, card fill, radius 6, 16 px 500 ink. States:
 * chosen-right and answer = ink fill, paper text (answer adds `the answer`);
 * chosen-wrong = 2 px inset ember outline and one shake; dim = wait text.
 */
export function OptionButton({ label, iso2, keyHint, state = "idle", icon, small, tile, className, type = "button", ...rest }: OptionButtonProps) {
  return (
    <button
      type={type}
      className={cn("opt t-list", state === "chosen-right" && "right", state === "chosen-wrong" && "wrong", state === "answer" && "answer", state === "dim" && "dim", tile && "tile", className)}
      data-state={state}
      {...rest}
    >
      {icon === "arrow-up" ? <ArrowUpIcon size={18} /> : icon === "arrow-down" ? <ArrowDownIcon size={18} /> : null}
      {iso2 ? <Flag iso2={iso2} size={tile ? "s" : "xs"} alt="" eager /> : null}
      <span className="lbl">
        {label}
        {small ? <small className="t-meta">{small}</small> : null}
      </span>
      {state === "answer" ? <span className="tail t-meta">the answer</span> : keyHint ? <span className="key t-meta">{keyHint}</span> : null}
    </button>
  );
}
