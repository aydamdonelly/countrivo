import { getCountryByIso3 } from "@/lib/data/countries";
import { Flag } from "@/ui/flag";
import { CheckIcon } from "@/ui/icons/check";
import { rankQuality } from "@/ui/slot";
import type { RunDetailProps } from "@/games/types";
import { GRADE_WORD, RANK_CELL } from "./module";
import type { DraftResult } from "@/lib/game-logic/country-draft/types";

interface Assignment {
  countryIdx: number;
  categoryIdx: number;
  rank: number;
}

function isAssignment(x: unknown): x is Assignment {
  if (typeof x !== "object" || x === null) return false;
  const a = x as Record<string, unknown>;
  return typeof a.countryIdx === "number" && typeof a.categoryIdx === "number" && typeof a.rank === "number";
}

function assignments(value: unknown): Assignment[] {
  return Array.isArray(value) ? value.filter(isAssignment) : [];
}

function gradeWord(value: unknown): string | null {
  return typeof value === "string" && value in GRADE_WORD ? GRADE_WORD[value as DraftResult["grade"]] : null;
}

/**
 * The rows behind a shared Draft run (blueprint 7.7): the grade and the three numbers, then
 * one row per country with the rank it was given and the rank the optimal draft would have
 * had. The saved resultJson keeps indices, not category slugs, so these rows carry the
 * numbers without the stat icons the live result shows.
 */
export function RunDetail({ run }: RunDetailProps) {
  const json = run.resultJson ?? {};
  const iso3s = Array.isArray(json.countryIso3s) ? (json.countryIso3s as unknown[]).filter((x): x is string => typeof x === "string") : [];
  const picks = assignments(json.assignments);
  if (picks.length === 0) return null;

  const optimalByCountry = new Map(assignments(json.optimalAssignments).map((o) => [o.countryIdx, o]));
  const grade = gradeWord(json.grade);
  const playerScore = typeof json.playerScore === "number" ? json.playerScore : null;
  const optimalScore = typeof json.optimalScore === "number" ? json.optimalScore : null;
  const gap = typeof json.gap === "number" ? json.gap : playerScore !== null && optimalScore !== null ? playerScore - optimalScore : null;

  return (
    <div>
      {grade || playerScore !== null ? (
        <div className="rhead">
          {grade ? <b className="t-h3">{grade}</b> : null}
          {playerScore !== null && optimalScore !== null && gap !== null ? (
            <span className="rfacts t-body">
              you <b className="num">{playerScore}</b> · optimal <b className="num">{optimalScore}</b> · gap <b className="num">{gap}</b>
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="rrows t-row">
        <div className="rrow cols4 border-t-0 min-h-0 pt-2 pb-1">
          <span />
          <span />
          <span className="v mute t-meta" style={{ width: RANK_CELL.width }}>
            pick
          </span>
          <span className="v mute t-meta" style={{ width: RANK_CELL.width }}>
            optimal
          </span>
        </div>
        {picks.map((a) => {
          const country = getCountryByIso3(iso3s[a.countryIdx] ?? "");
          const optimal = optimalByCountry.get(a.countryIdx);
          const same = optimal !== undefined && optimal.categoryIdx === a.categoryIdx;
          return (
            <div key={a.countryIdx} className="rrow cols4">
              <Flag iso2={country?.iso2 ?? null} size="xs" alt="" />
              <span className="nm">{country?.displayName ?? iso3s[a.countryIdx] ?? "Country"}</span>
              <span className="v" style={{ ...RANK_CELL, justifyContent: "flex-end" }}>
                <b className={`t-score num rank-${rankQuality(a.rank)}`}>#{a.rank}</b>
              </span>
              <span className="v mute t-meta" style={{ ...RANK_CELL, justifyContent: "flex-end" }}>
                {same ? <CheckIcon size={16} className="ic-ok" /> : optimal ? <span className="num">#{optimal.rank}</span> : null}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
