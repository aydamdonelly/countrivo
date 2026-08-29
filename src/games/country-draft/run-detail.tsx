import { SectionHead } from "@/ui/section-head";
import { Flag } from "@/ui/flag";
import { cn } from "@/lib/utils";
import { getCountryByIso3 } from "@/lib/data/countries";
import { BONUSES, MAX_SCORE, SEAT_NAMES, bandOf, fitQuality, fitWord } from "@/lib/game-logic/country-draft/tables";
import type { RunDetailProps } from "@/games/types";
import { DraftMap } from "./draft-map";
import "./draft.css";

/*
 * The rows behind a shared Country Draft run (blueprint 7.7, SPEC 17). A server component
 * that reads resultJson and nothing else: the map is a pure function of the five round
 * countries and the score, so no seed, no edition and no roster lookup is needed to
 * redraw the exact picture the player shared.
 */

interface Row {
  round: number;
  seat: number;
  name: string;
  iso3: string;
  standing: number;
  fit: number;
  points: number;
}

function isRow(x: unknown): x is Row {
  if (typeof x !== "object" || x === null) return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.round === "number" &&
    typeof r.seat === "number" &&
    typeof r.name === "string" &&
    typeof r.iso3 === "string" &&
    typeof r.standing === "number" &&
    typeof r.fit === "number" &&
    typeof r.points === "number"
  );
}

function rows(value: unknown): Row[] {
  return Array.isArray(value) ? value.filter(isRow).sort((a, b) => a.round - b.round) : [];
}

function num(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

function AppointmentRows({ list, mute }: { list: Row[]; mute?: boolean }) {
  return (
    <div className="dr-rows t-row">
      {list.map((row) => {
        const country = getCountryByIso3(row.iso3);
        return (
          <div key={row.round} className="dr-row">
            <span className="fl">
              <Flag iso2={country?.iso2 ?? null} size="xs" alt="" />
            </span>
            <span className="txt">
              <b>{row.name}</b>
              <small className="t-meta">
                {SEAT_NAMES[row.seat] ?? "Seat"} · {fitWord(row.fit)} · standing {row.standing}
              </small>
            </span>
            <b className={cn("t-score num val", mute ? "dr-q-fair" : `dr-q-${fitQuality(row.fit)}`)}>{row.points}</b>
          </div>
        );
      })}
    </div>
  );
}

export function RunDetail({ run }: RunDetailProps) {
  const json = run.resultJson ?? {};
  const appointments = rows(json.appointments);
  if (appointments.length === 0) return null;
  const best = rows(json.best);
  const score = num(json.score) ?? run.scoreRaw;
  const ceiling = num(json.ceiling);
  const gap = num(json.gap) ?? (ceiling === null ? null : ceiling - score);
  const countries = Array.isArray(json.roundCountries)
    ? (json.roundCountries as unknown[]).filter((x): x is string => typeof x === "string")
    : appointments.map((a) => a.iso3);
  const bonuses = (json.bonuses ?? {}) as Record<string, unknown>;

  return (
    <div>
      <div className="rhead">
        <b className="t-h3">{bandOf(score).word}</b>
        <span className="rfacts t-body">
          you <b className="num">{score}</b>
          {ceiling === null ? null : (
            <>
              {" "}
              · best possible <b className="num">{ceiling}</b>
              {gap === null ? null : (
                <>
                  {" "}
                  · gap <b className="num">{gap}</b>
                </>
              )}
            </>
          )}
        </span>
      </div>

      <DraftMap from={countries} score={score} />
      <p className="dr-lead t-meta">
        taken <span className="num">{score}</span> of <span className="num">{MAX_SCORE}</span>
      </p>

      <AppointmentRows list={appointments} />

      <div className="dr-rows t-row">
        {BONUSES.map((bonus) => (
          <div key={bonus.key} className="dr-row">
            <span className="fl" />
            <span className="txt">
              <b>{bonus.name}</b>
              <small className="t-meta">{bonus.needs}</small>
            </span>
            <b className={cn("t-score num val", bonuses[bonus.key] === true ? "dr-q-good" : "dr-q-fair")}>
              {bonuses[bonus.key] === true ? `+${bonus.points}` : "0"}
            </b>
          </div>
        ))}
      </div>

      {best.length > 0 ? (
        <>
          <SectionHead title="The best line" fact={ceiling === null ? undefined : `${ceiling}`} variant="strip" />
          <p className="dr-lead t-body">The highest score that board allowed.</p>
          <AppointmentRows list={best} mute />
        </>
      ) : null}
    </div>
  );
}
