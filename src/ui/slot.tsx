import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Flag } from "@/ui/flag";
import { StatIcon } from "@/ui/icons/stat";
import { CountUp } from "@/ui/count-up";

export type RankQuality = "good" | "ok" | "bad";

/** Country Draft rank quality (blueprint section 1): <= 5 ink, <= 30 mute, else ember. */
export function rankQuality(rank: number): RankQuality {
  return rank <= 5 ? "good" : rank <= 30 ? "ok" : "bad";
}

interface SlotBase {
  className?: string;
}

export type SlotProps = SlotBase &
  (
    | ({
        /** An open category slot: StatIcon 22, the chip label, the clarifier, the key numeral. */
        state: "open";
        slug: string;
        label: string;
        clarifier?: string;
        keyHint?: string;
      } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">)
    | {
        /** A filled slot: Flag xs, the country, the rank coloured by quality. */
        state: "assigned";
        iso2: string;
        country: string;
        rank: number;
        label?: string;
        /** The pick that just landed: the rank counts from 0 over 300 ms and pops once (blueprint 6.3.2). */
        animate?: boolean;
      }
    | {
        /** Not available for this pick: wait text. */
        state: "off";
        slug: string;
        label: string;
        clarifier?: string;
      }
  );

/**
 * A Country Draft slot (blueprint 3.22): card fill, radius 6, min-height 64, padding 10 12.
 * Keyboard focus shows the global ring.
 */
export function Slot(props: SlotProps) {
  if (props.state === "assigned") {
    const { iso2, country, rank, label, animate, className } = props;
    return (
      <div className={cn("slot assigned", className)} data-state="assigned">
        <span className="lbl t-body">
          <Flag iso2={iso2} size="xs" alt="" eager />
          <span className="nm">{country}</span>
          <b className={cn("rank t-num num", `rank-${rankQuality(rank)}`)}>
            #{animate ? <CountUp value={rank} duration={300} pop /> : rank}
          </b>
        </span>
        {label ? <span className="clar t-meta">{label}</span> : null}
      </div>
    );
  }
  if (props.state === "off") {
    const { slug, label, clarifier, className } = props;
    return (
      <div className={cn("slot off", className)} data-state="off" aria-disabled="true">
        <span className="lbl t-body">
          <StatIcon slug={slug} size={22} />
          <span className="nm">{label}</span>
        </span>
        {clarifier ? <span className="clar t-meta">{clarifier}</span> : null}
      </div>
    );
  }
  const { slug, label, clarifier, keyHint, className, type = "button", ...rest } = props;
  return (
    <button type={type} className={cn("slot", className)} data-state="open" {...rest}>
      <span className="lbl t-body">
        <StatIcon slug={slug} size={22} />
        <span className="nm">{label}</span>
      </span>
      {clarifier ? <span className="clar t-meta">{clarifier}</span> : null}
      {keyHint ? <span className="key t-num">{keyHint}</span> : null}
    </button>
  );
}
