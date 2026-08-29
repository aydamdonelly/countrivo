import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/button";
import { Chip } from "@/ui/chip";
import { ConquestMap } from "@/ui/conquest-map";
import type { GameSlug } from "@/ui/types";

export type AnchorVariant = "pre" | "steps" | "post" | "practice" | "landing" | "world";

export interface AnchorResult {
  /** The compact score ("612"). */
  score: string;
  /** null while the server rank is unknown: the line reads `– of 41 global`. */
  globalRank: number | null;
  /** 0 omits the global line (nobody has shot yet). */
  globalShots: number;
  friendRank: number | null;
  /** 0 omits the friends line. */
  friendCount: number;
}

export const DRAFT_STEPS = ["8 stats are on the board", "countries appear one by one", "put each where it ranks best"] as const;

export interface AnchorCardProps {
  variant: AnchorVariant;
  slug: GameSlug;
  title: string;
  /** Typed in caps: `TODAY · COUNTRY DRAFT`. */
  kicker: string;
  /** `41 shots · top 635`; null omits the right side. */
  counter?: string | null;
  /** The one-line how-text; replaced by `steps` when given. */
  how?: string;
  /** The three K2 steps (the `steps` variant defaults to DRAFT_STEPS). */
  steps?: readonly [string, string, string];
  /** The eight draft chips or a landing's three facts. */
  chips?: readonly string[];
  cta: { label: string; href: string } | null;
  /** The post variant's numbers. */
  result?: AnchorResult;
  /** Where "Practice a board" goes (post variant). */
  practiceHref?: string;
  /** Landings put the page h1 inside the card. */
  heading?: 1 | 2;
  /** World Draft: the taken countries on the conquest map. */
  taken?: readonly string[];
  className?: string;
}

/** `#9` once the server has ranked the run, a bare `–` while it has not (blueprint 3.6). */
function rank(value: number | null) {
  return value === null ? "–" : `#${value}`;
}

/**
 * The ink card (blueprint 3.6): radius 12, padding 18 18 20, margin-bottom 16, content
 * driven height, the Shoot button absolute bottom-right overlapping the chip block,
 * which reserves 110 px on the right. `practice` is the card-fill twin.
 */
export function AnchorCard({
  variant,
  slug,
  title,
  kicker,
  counter,
  how,
  steps,
  chips,
  cta,
  result,
  practiceHref = `/games/${slug}/play?mode=practice`,
  heading,
  taken,
  className,
}: AnchorCardProps) {
  const level = heading ?? (variant === "landing" || variant === "world" ? 1 : 2);
  const Heading = level === 1 ? "h1" : "h2";
  const stepList = steps ?? (variant === "steps" ? DRAFT_STEPS : undefined);
  const practice = variant === "practice";

  return (
    <section className={cn("anc", practice ? "prac" : "on-ink", className)} data-variant={variant}>
      <div className="k t-kicker">
        <span>{kicker}</span>
        {counter ? <span>{counter}</span> : null}
      </div>
      <Heading className="title t-card">{title}</Heading>

      {variant === "post" && result ? (
        <div className="res">
          <b className="t-score-xl num">{result.score}</b>
          {result.globalShots > 0 || result.friendCount > 0 ? (
            <span className="t-body">
              {result.globalShots > 0 ? (
                <>
                  <em className="num">{rank(result.globalRank)}</em> of {result.globalShots} global
                </>
              ) : null}
              {result.globalShots > 0 && result.friendCount > 0 ? <br /> : null}
              {result.friendCount > 0 ? (
                <>
                  <em className="num">{rank(result.friendRank)}</em> of {result.friendCount} friends
                </>
              ) : null}
            </span>
          ) : null}
        </div>
      ) : stepList ? (
        <div className="steps">
          {stepList.map((s, i) => (
            <span key={s}>
              <i className="t-num">{i + 1}</i>
              {s}
            </span>
          ))}
        </div>
      ) : how ? (
        <p className="how t-body">{how}</p>
      ) : null}

      {variant === "world" ? (
        <ConquestMap className="map" tone="ink" taken={taken} title="The world, five countries taken" />
      ) : chips && chips.length > 0 ? (
        <div className="chips">
          {chips.map((c) => (
            <Chip key={c}>{c}</Chip>
          ))}
        </div>
      ) : null}

      {variant === "post" ? (
        <p className="note t-body">
          Bad day? <Link href={practiceHref}>Practice a board</Link>, it won&apos;t count.
        </p>
      ) : null}

      {cta ? (
        <Button variant={practice ? "ink" : "shoot"} href={cta.href} prefetch className="cta">
          {cta.label}
        </Button>
      ) : null}
    </section>
  );
}
