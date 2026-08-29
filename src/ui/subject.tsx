import { cn } from "@/lib/utils";
import { Flag } from "@/ui/flag";
import { StatIcon } from "@/ui/icons/stat";
import { CountUp } from "@/ui/count-up";

export interface PairSide {
  /** null draws the wait box (Supremacy's hidden AI card). */
  iso2: string | null;
  name: string;
  /** null = hidden, rendered as `?` in wait. */
  value: string | null;
  /** The reveal (blueprint 6.3.5): the value counts up from 0 over 400 ms, printed as formatStat(n, unit). */
  count?: { value: number; unit: string };
}

export type SubjectProps = { animate?: boolean; className?: string } & (
  | {
      /** Flag l, the country name in Erode 30, a mute region line. */
      variant?: "default";
      iso2: string;
      name: string;
      meta?: string;
      /** Empty when the name sits beside the flag (default). */
      alt?: string;
    }
  | {
      /** Flag hero, no name: Flag Quiz, Country Streak, Speed Flags, Blitz. */
      variant: "flag-only";
      iso2: string;
    }
  | {
      /** StatIcon 28 + the category label + a mute clarifier. */
      variant: "stat";
      slug: string;
      label: string;
      clarifier?: string;
    }
  | {
      /** Two default subjects side by side at Flag m. */
      variant: "pair";
      left: PairSide;
      right: PairSide;
    }
);

/**
 * The thing in play (blueprint 3.20). `animate` plays the reveal (translateY 6 to 0,
 * 220 ms) on mount; the host re-keys the subject on change. Opacity never animates.
 */
export function Subject(props: SubjectProps) {
  const { animate, className } = props;
  const variant = props.variant ?? "default";

  if (variant === "pair" && props.variant === "pair") {
    return (
      <div className={cn("subj-pair", animate && "subj-in", className)}>
        {[props.left, props.right].map((side, i) => (
          <div key={i} className="side">
            <Flag iso2={side.iso2} size="m" alt="" eager />
            <span className="nm t-list">{side.name}</span>
            <b className={cn("val t-score-l num", side.value === null && "hidden-val")}>
              {side.count && side.value !== null ? <CountUp value={side.count.value} duration={400} kind="stat" unit={side.count.unit} /> : side.value ?? "?"}
            </b>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "stat" && props.variant === "stat") {
    return (
      <div className={cn("subj stat", animate && "subj-in", className)}>
        <StatIcon slug={props.slug} size={28} />
        <b className="t-card">{props.label}</b>
        {props.clarifier ? <span className="meta t-meta">{props.clarifier}</span> : null}
      </div>
    );
  }

  if (variant === "flag-only" && props.variant === "flag-only") {
    return (
      <div className={cn("subj", animate && "subj-in", className)}>
        <Flag iso2={props.iso2} size="hero" alt="" eager />
      </div>
    );
  }

  if (props.variant === undefined || props.variant === "default") {
    return (
      <div className={cn("subj", animate && "subj-in", className)}>
        <Flag iso2={props.iso2} size="l" alt={props.alt ?? ""} eager />
        <b className="t-card">{props.name}</b>
        {props.meta ? <span className="meta t-body">{props.meta}</span> : null}
      </div>
    );
  }
  return null;
}
