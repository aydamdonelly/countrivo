import { getCountryByIso3 } from "@/lib/data/countries";
import { Flag } from "@/ui/flag";
import { CheckIcon } from "@/ui/icons/check";
import { rankQuality } from "@/ui/slot";
import type { RunDetailProps } from "@/games/types";

interface Assignment {
  countryIdx: number;
  categoryIdx: number;
  rank: number;
}

function isAssignment(x: unknown): x is Assignment {
  return typeof x === "object" && x !== null && typeof (x as Assignment).countryIdx === "number" && typeof (x as Assignment).rank === "number";
}

/** The Draft run rows from resultJson (countryIso3s, assignments, optimalAssignments): country, your rank, the optimal rank. */
export function RunDetail({ run }: RunDetailProps) {
  const json = run.resultJson ?? {};
  const iso3s = Array.isArray(json.countryIso3s) ? (json.countryIso3s as unknown[]).filter((x): x is string => typeof x === "string") : [];
  const picks = Array.isArray(json.assignments) ? (json.assignments as unknown[]).filter(isAssignment) : [];
  const optimal = Array.isArray(json.optimalAssignments) ? (json.optimalAssignments as unknown[]).filter(isAssignment) : [];
  if (picks.length === 0) return null;
  const optimalByCountry = new Map(optimal.map((o) => [o.countryIdx, o]));
  return (
    <div>
      {typeof json.playerScore === "number" && typeof json.optimalScore === "number" ? (
        <p className="rhead t-body">
          <span className="facts">
            you <b>{json.playerScore}</b> · optimal <b>{json.optimalScore}</b> · gap <b>{typeof json.gap === "number" ? json.gap : json.playerScore - json.optimalScore}</b>
          </span>
        </p>
      ) : null}
      <div className="rrows t-row">
        {picks.map((a) => {
          const c = getCountryByIso3(iso3s[a.countryIdx] ?? "");
          const opt = optimalByCountry.get(a.countryIdx);
          const same = opt !== undefined && opt.categoryIdx === a.categoryIdx;
          return (
            <div key={a.countryIdx} className="rrow cols4">
              <Flag iso2={c?.iso2 ?? null} size="xs" alt="" />
              <span className="nm">{c?.displayName ?? iso3s[a.countryIdx] ?? "country"}</span>
              <b className={`v t-score num rank-${rankQuality(a.rank)}`}>#{a.rank}</b>
              {same ? <CheckIcon size={16} className="ic-ok" /> : <span className="v mute t-meta">{opt ? `#${opt.rank}` : ""}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
