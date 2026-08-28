import { getCountryByIso3 } from "@/lib/data/countries";
import type { RunDetail } from "@/types/server";
import { IconCheck } from "@/components/icons";

interface Props {
  run: RunDetail;
  colors: { bg: string; text: string };
}

/** Server component that renders the player's decisions for a single daily run. */
export function RunDetailBody({ run, colors }: Props) {
  switch (run.gameSlug) {
    case "border-buddies":
      return <BorderBuddiesBody run={run} colors={colors} />;
    case "country-draft":
      return <CountryDraftBody run={run} colors={colors} />;
    case "stat-guesser":
      return <StatGuesserBody run={run} colors={colors} />;
    default:
      return <GenericBody run={run} colors={colors} />;
  }
}

/* ----------------------------------------------------------------------- */
/* Shared helpers                                                          */
/* ----------------------------------------------------------------------- */

function FlagName({ iso3, className }: { iso3: string; className?: string }) {
  const country = getCountryByIso3(iso3);
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <span className="text-xl leading-none">{country?.flagEmoji ?? "🏳️"}</span>
      <span className="truncate">{country?.displayName ?? iso3}</span>
    </span>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface-elevated p-5 sm:p-6">
      <h2 className="text-sm font-bold text-cream-muted label-caps mb-4">{title}</h2>
      {children}
    </section>
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((v) => typeof v === "number");
}

/* ----------------------------------------------------------------------- */
/* Border Buddies                                                          */
/* ----------------------------------------------------------------------- */

function BorderBuddiesBody({ run, colors }: Props) {
  const r = run.resultJson ?? {};
  const target = typeof r.country === "string" ? r.country : null;
  const found = isStringArray(r.found) ? r.found : [];
  const allBorders = isStringArray(r.borders) ? r.borders : [];

  if (!target) return <GenericBody run={run} colors={colors} />;

  const foundSet = new Set(found);
  const missed = allBorders.filter((iso3) => !foundSet.has(iso3));

  return (
    <div className="space-y-5">
      <SectionCard title="Target country">
        <div className="flex flex-col items-center text-center py-2">
          <span className="text-6xl mb-2">
            {getCountryByIso3(target)?.flagEmoji ?? "🏳️"}
          </span>
          <p className="text-xl font-extrabold">
            {getCountryByIso3(target)?.displayName ?? target}
          </p>
          <p
            className="mt-2 text-lg font-bold"
            style={{ color: colors.text }}
          >
            Found {found.length} of {allBorders.length} neighbors
          </p>
        </div>
      </SectionCard>

      <SectionCard title={`Found (${found.length})`}>
        {found.length === 0 ? (
          <p className="text-sm text-cream-muted">No neighbors found.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {found.map((iso3) => (
              <li
                key={iso3}
                className="flex items-center gap-2 rounded-xl px-3 py-2 bg-green-500/10 border border-green-500/20"
              >
                <IconCheck className="w-4 h-4 text-correct shrink-0" />
                <FlagName iso3={iso3} className="text-sm font-medium" />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {missed.length > 0 && (
        <SectionCard title={`Missed (${missed.length})`}>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {missed.map((iso3) => (
              <li
                key={iso3}
                className="flex items-center gap-2 rounded-xl px-3 py-2 bg-black/5 border border-transparent"
              >
                <FlagName iso3={iso3} className="text-sm text-cream-muted" />
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Country Draft                                                           */
/* ----------------------------------------------------------------------- */

interface DraftAssignment {
  rank: number;
  countryIdx: number;
  categoryIdx: number;
}

function isDraftAssignmentArray(value: unknown): value is DraftAssignment[] {
  return (
    Array.isArray(value) &&
    value.every(
      (v): v is DraftAssignment =>
        typeof v === "object" &&
        v !== null &&
        typeof (v as DraftAssignment).rank === "number" &&
        typeof (v as DraftAssignment).countryIdx === "number" &&
        typeof (v as DraftAssignment).categoryIdx === "number",
    )
  );
}

function CountryDraftBody({ run, colors }: Props) {
  const r = run.resultJson ?? {};
  const iso3s = isStringArray(r.countryIso3s) ? r.countryIso3s : [];
  const assignments = isDraftAssignmentArray(r.assignments) ? r.assignments : [];
  const optimal = isDraftAssignmentArray(r.optimalAssignments)
    ? r.optimalAssignments
    : [];

  if (iso3s.length === 0 || assignments.length === 0) {
    return <GenericBody run={run} colors={colors} />;
  }

  const gap = typeof r.gap === "number" ? r.gap : null;
  const grade = typeof r.grade === "string" ? r.grade : null;
  const stars = typeof r.stars === "number" ? r.stars : null;
  const playerScore =
    typeof r.playerScore === "number" ? r.playerScore : null;
  const optimalScore =
    typeof r.optimalScore === "number" ? r.optimalScore : null;

  const byCountryIdx = (list: DraftAssignment[]) =>
    new Map(list.map((a) => [a.countryIdx, a]));
  const playerByIdx = byCountryIdx(assignments);
  const optimalByIdx = byCountryIdx(optimal);

  return (
    <div className="space-y-5">
      <SectionCard title="Result">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          {grade && (
            <span
              className="text-2xl font-extrabold capitalize"
              style={{ color: colors.text }}
            >
              {grade}
            </span>
          )}
          {stars !== null && (
            <span className="text-lg" aria-label={`${stars} stars`}>
              {"★".repeat(Math.max(0, stars))}
              <span className="text-cream-muted opacity-40">
                {"★".repeat(Math.max(0, 3 - stars))}
              </span>
            </span>
          )}
          {gap !== null && (
            <span className="text-sm text-cream-muted">
              Gap to optimal:{" "}
              <span className="font-mono font-bold">{gap}</span>
            </span>
          )}
          {playerScore !== null && optimalScore !== null && (
            <span className="text-sm text-cream-muted">
              Your rank total{" "}
              <span className="font-mono font-bold">{playerScore}</span> vs best{" "}
              <span className="font-mono font-bold">{optimalScore}</span>
            </span>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Your picks (lower rank = better)">
        <ul className="space-y-2">
          {iso3s.map((iso3, idx) => {
            const player = playerByIdx.get(idx);
            const best = optimalByIdx.get(idx);
            if (!player) return null;
            const isOptimal =
              best !== undefined && player.categoryIdx === best.categoryIdx;
            const delta =
              best !== undefined ? player.rank - best.rank : null;
            const quality =
              isOptimal || delta === 0
                ? "optimal"
                : delta !== null && delta <= 5
                  ? "close"
                  : "far";
            const qualityClass =
              quality === "optimal"
                ? "bg-green-500/10 border-green-500/20 text-correct"
                : quality === "close"
                  ? "bg-amber-500/10 border-amber-500/20 text-warning"
                  : "bg-red-500/10 border-red-500/20 text-incorrect";

            return (
              <li
                key={`${iso3}-${idx}`}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 bg-surface border border-border"
              >
                <FlagName iso3={iso3} className="text-sm font-medium min-w-0" />
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-cream-muted hidden sm:inline">
                    best stat for this country
                  </span>
                  <span className="font-mono text-sm">
                    #{player.rank}
                    {best !== undefined && (
                      <span className="text-cream-muted">
                        {" "}
                        / best #{best.rank}
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-xs font-bold rounded-full px-2 py-0.5 border ${qualityClass}`}
                  >
                    {isOptimal ? <span className="flex items-center gap-1"><IconCheck className="w-3 h-3" />optimal</span> : quality === "close" ? "close" : "off"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </SectionCard>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Stat Guesser                                                            */
/* ----------------------------------------------------------------------- */

function StatGuesserBody({ run, colors }: Props) {
  const r = run.resultJson ?? {};
  const targets = isStringArray(r.targetIso3s)
    ? r.targetIso3s
    : typeof r.targetIso3 === "string"
      ? [r.targetIso3]
      : [];
  const guesses = isNumberArray(r.guesses) ? r.guesses : [];
  const scores = isNumberArray(r.scores) ? r.scores : [];
  const avgError =
    typeof r.avgError === "number" ? r.avgError : null;

  if (targets.length === 0) return <GenericBody run={run} colors={colors} />;

  const errColor = (err: number) =>
    err <= 10
      ? "text-correct"
      : err <= 30
        ? "text-warning"
        : "text-incorrect";

  return (
    <div className="space-y-5">
      <SectionCard title="Accuracy">
        <p className="text-lg font-bold" style={{ color: colors.text }}>
          {avgError !== null
            ? `Average error ${avgError.toFixed(1)}%`
            : "Per-round breakdown"}
        </p>
      </SectionCard>

      <SectionCard title="Rounds">
        <ul className="space-y-2">
          {targets.map((iso3, i) => {
            const guess = guesses[i];
            const err = scores[i];
            return (
              <li
                key={`${iso3}-${i}`}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 bg-surface border border-border"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono text-cream-muted w-6 shrink-0">
                    R{i + 1}
                  </span>
                  <FlagName iso3={iso3} className="text-sm font-medium min-w-0" />
                </span>
                <div className="flex items-center gap-4 shrink-0 text-sm">
                  {typeof guess === "number" && (
                    <span className="font-mono text-cream-muted">
                      guess {formatGuess(guess)}
                    </span>
                  )}
                  {typeof err === "number" && (
                    <span className={`font-mono font-bold ${errColor(err)}`}>
                      {err.toFixed(1)}% off
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </SectionCard>
    </div>
  );
}

function formatGuess(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-US");
}

/* ----------------------------------------------------------------------- */
/* Generic fallback                                                        */
/* ----------------------------------------------------------------------- */

const GENERIC_LABELS: Record<string, string> = {
  score: "Score",
  total: "Total",
  streak: "Streak",
  bestStreak: "Best streak",
  avgError: "Avg error",
  accuracy: "Accuracy",
  correct: "Correct",
  rounds: "Rounds",
};

function GenericBody({ run, colors }: Props) {
  const r = run.resultJson ?? {};

  const aggregates = Object.entries(GENERIC_LABELS)
    .map(([key, label]) => {
      const value = r[key];
      if (typeof value !== "number" && typeof value !== "string") return null;
      const display =
        key === "avgError" || key === "accuracy"
          ? `${Number(value).toFixed(1)}%`
          : String(value);
      return { label, display };
    })
    .filter((x): x is { label: string; display: string } => x !== null);

  const completed = new Date(run.completedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <SectionCard title="Summary">
      <div className="flex flex-col items-center text-center py-2">
        <p className="text-5xl font-extrabold" style={{ color: colors.text }}>
          {run.scoreDisplay}
        </p>
        <div className="flex items-center gap-3 mt-3 text-sm text-cream-muted">
          {run.rankDaily !== null && (
            <span className="font-bold">Rank #{run.rankDaily}</span>
          )}
          {run.percentile !== null && (
            <span>Top {Math.max(1, Math.round(100 - run.percentile))}%</span>
          )}
        </div>
      </div>

      {aggregates.length > 0 && (
        <dl className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {aggregates.map(({ label, display }) => (
            <div
              key={label}
              className="rounded-xl bg-surface border border-border px-3 py-3 text-center"
            >
              <dt className="text-xs text-cream-muted label-caps">{label}</dt>
              <dd className="text-lg font-bold font-mono mt-0.5">{display}</dd>
            </div>
          ))}
        </dl>
      )}

      <p className="mt-5 text-xs text-cream-muted text-center">
        Completed {completed}
      </p>
    </SectionCard>
  );
}
