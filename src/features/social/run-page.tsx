import Link from "next/link";
import { notFound } from "next/navigation";
import { getDailySummary, getRunDetail } from "@/app/actions/game-runs";
import { getGameBySlug } from "@/lib/data/registry";
import { createClient } from "@/lib/supabase/server";
import { getSilhouettePath, iso2ToIso3 } from "@/lib/silhouettes";
import { compactScore } from "@/server/boards";
import { RUN_DETAILS, isPlayable } from "@/games/registry";
import { Button, Crest, ResultPanel } from "@/ui";
import "@/features/play/play.css";
import "./social.css";

export interface RunPageProps {
  slug: string;
  runId: string;
}

/** `Sat 28 Aug` for the byline, `SAT 28 AUG` for the result kicker. */
export function runDate(dailyDate: string): string {
  return new Date(`${dailyDate}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

/**
 * One shared run (blueprint 7.7): the owner's crest and name, the result card in `shared`
 * mode, the game's own run rows and two actions. Noindex; `notFound()` when the run does not
 * belong to the slug.
 */
export async function RunPage({ slug, runId }: RunPageProps) {
  const id = Number(runId);
  const run = Number.isFinite(id) ? await getRunDetail(id) : null;
  /* `get_run_detail` answers for daily runs only; the null guard keeps a practice row from
     ever printing a date it does not have. */
  if (!run || run.gameSlug !== slug || !run.dailyDate) notFound();

  const game = getGameBySlug(slug);
  const title = game?.title ?? slug;
  const date = runDate(run.dailyDate);

  const [summary, crest] = await Promise.all([getDailySummary(slug, run.dailyDate), ownerCrest(run.userId)]);
  const shots = summary.playerCount;
  /* The kicker's right side is the standing itself (blueprint 7.7): `#9 of 41`, or the day's
     size when the rank never landed. A percentile is not printed beside it: with the rank and
     the field both on the card it says nothing new, and on a small board it reads `top 100 %`. */
  const counter = shots > 0 ? (run.rankDaily !== null ? `#${run.rankDaily} of ${shots}` : `${shots} ${shots === 1 ? "shot" : "shots"}`) : undefined;
  const Detail = isPlayable(slug) ? RUN_DETAILS[slug] : null;

  return (
    <div className="col-640">
      <div className="run-by">
        <Crest path={crest} size={40} label={run.displayName || run.username} />
        <span className="who t-row">
          <span className="nm">
            <Link href={`/profile/${run.username}`}>{run.displayName || run.username}</Link>
          </span>
          <span className="when t-meta">
            {title} · {date}
          </span>
        </span>
      </div>
      <ResultPanel
        mode="shared"
        game={title}
        score={compactScore(run.scoreDisplay, run.scoreRaw)}
        kicker={`${title.toUpperCase()} · ${date.toUpperCase()}`}
        counter={counter}
        actions={
          <>
            <Button href={`/games/${slug}`}>Play {title}</Button>
            <Button variant="text" href={`/games/${slug}/leaderboard?date=${run.dailyDate}`}>
              Board
            </Button>
          </>
        }
      >
        {Detail ? <Detail run={run} /> : null}
      </ResultPanel>
    </div>
  );
}

/** The owner's crest path: one profiles read (the run detail carries no country). */
async function ownerCrest(userId: string): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("profiles").select("country_code").eq("id", userId).maybeSingle();
    return getSilhouettePath(iso2ToIso3((data?.country_code as string | null) ?? null));
  } catch (err) {
    console.error("[run] crest read failed", err);
    return null;
  }
}
