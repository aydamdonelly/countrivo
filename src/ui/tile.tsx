import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Flag } from "@/ui/flag";

export type GroupId = 0 | 1 | 2 | 3;

export interface TileProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
  iso2: string;
  name: string;
  selected?: boolean;
  /** Solved: the group tone (0 ink, 1 ember, 2 mute, 3 wait). */
  group?: GroupId | null;
  className?: string;
}

/**
 * A Cluster or Odd One Out tile (blueprint 3.22): card fill, radius 6, square, Flag xs
 * over a two-line name; selected = ink fill; solved = the group tone.
 */
export function Tile({ iso2, name, selected, group, className, type = "button", ...rest }: TileProps) {
  return (
    <button type={type} className={cn("tile t-kicker", selected && "sel", group != null && `g${group}`, className)} aria-pressed={selected} {...rest}>
      <Flag iso2={iso2} size="xs" alt="" eager />
      <span className="nm">{name}</span>
    </button>
  );
}

export interface GroupBandProps {
  group: GroupId;
  /** The trait label, so a group is never colour-only. */
  trait: string;
  members: readonly { iso2: string; name: string }[];
  /** `solved` or `missed` on the result rows. */
  status?: "solved" | "missed";
  className?: string;
}

/** A solved Cluster group: a full-width band in its tone with the trait label and four flags. */
export function GroupBand({ group, trait, members, status, className }: GroupBandProps) {
  return (
    <div className={cn("band t-body", `g${group}`, className)}>
      <span className="trait">{trait}</span>
      {status ? <span className="t-meta">{status}</span> : null}
      <span className="flags">
        {members.map((m) => (
          <Flag key={m.iso2} iso2={m.iso2} size="xs" alt={m.name} />
        ))}
      </span>
    </div>
  );
}
