import Link from "next/link";
import type { ReactNode } from "react";
import { Flag } from "@/ui/flag";
import { Portrait } from "@/ui/portrait";
import { CountUp } from "@/ui/count-up";
import { ShareButton } from "@/ui/share-button";
import { BONUSES, MAX_SCORE, bandOf, fitWord } from "@/lib/game-logic/country-draft/tables";
import type { DraftView } from "@/lib/game-logic/country-draft/public-view";
import { formatNumber } from "@/lib/utils";
import { Cabinet, JOB_NAMES } from "./board";
import { DraftMap } from "./draft-map";
import { DraftReviewDetails } from "./review";
import "./draft.css";

export function Result({ state, shareText, animate = false, children, onShare, challengeUrl }: { state: DraftView; shareText: string; animate?: boolean; children?: ReactNode; onShare?: () => void; challengeUrl?: string }) {
  const fiveSeats = state.fitTotal + state.fameTotal;
  const thinJobs = state.seats.flatMap((pick) => pick && pick.fit < 12 ? [JOB_NAMES[pick.seat]] : []);
  const bonusTotal = state.score - fiveSeats;
  return <>
    <section className="dr-result-card" aria-labelledby="draft-result-title">
      <div className="dr-result-art" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- finished clay trophy */}
        <img src="/clay/cl-20/rest.webp" alt="" width={128} height={128} />
      </div>
      <p className="dr-result-number"><CountUp value={state.score} animate={animate} duration={900} /> <span>/ {MAX_SCORE}</span></p>
      <h2 className="t-h2" id="draft-result-title">{bandOf(state.score).word.replace(/\.$/, "")}</h2>
      <p className="t-meta">Par 140 · {state.score > 140 ? `+${state.score - 140} above` : state.score === 140 ? "on par" : `${140 - state.score} to go`}</p>
      {children}
      <Cabinet state={state} />
      <div className="dr-tally-inline t-meta"><span>Seats <b className="num">{fiveSeats}</b></span><span>Bonuses <b className="num">+{bonusTotal}</b></span></div>
      <details className="dr-score-details"><summary className="t-meta">Score breakdown</summary><div className="dr-tally t-body"><p><span>Five seats</span><b className="num">{fiveSeats}</b></p>{BONUSES.map((bonus) => <p key={bonus.key}><span>{bonus.name}{bonus.key === "fullCabinet" && !state.bonuses.fullCabinet && thinJobs.length ? <small className="t-meta">{thinJobs.join(" and ")} needed a fit of 12 or more.</small> : null}</span><b className="num">{state.bonuses[bonus.key] ? `+${bonus.points}` : "0"}</b></p>)}</div></details>
      <DraftMap from={state.seats.flatMap((seat) => seat ? [seat.country.iso3] : [])} score={state.score} />
      <ShareButton text={shareText} challengeUrl={challengeUrl} onShare={onShare} />
    </section>
  </>;
}

export function DraftResultDetails({ state }: { state: DraftView }) {
  return <>
    <details className="dr-result-detail"><summary className="t-body">Your picks explained</summary><p className="t-meta text-mute">Fit ratings reflect recorded careers.</p><div className="dr-rows">{state.seats.map((pick) => pick ? <div className="dr-appointment" key={pick.seat}><Portrait slug={pick.person.slug} name={pick.person.name} has={pick.person.portrait} size={44} /><div><b className="t-h3">{pick.person.name}</b><p className="t-meta"><Flag iso2={pick.country.iso2} size="xs" alt="" /> {pick.country.name} · {JOB_NAMES[pick.seat]}</p><p className="t-body">{fitWord(pick.fit)} fit {pick.fit} + fame {pick.fame} = {pick.points}.</p><p className="t-body">{pick.why} <a href={pick.source} target="_blank" rel="noreferrer">Source</a></p></div></div> : null)}</div></details>
    <details className="dr-result-detail"><summary className="t-body">Your countries</summary><p className="t-body">{formatNumber(state.geography.population)} people · {state.geography.areaPercent.toFixed(1)}% of the world&apos;s country area · {state.regions.length} regions.</p><p className="t-meta text-mute">{state.regions.join(", ")} · {formatNumber(state.geography.area)} km². Countrivo 2023 dataset.</p><div className="dr-homeland-links">{state.seats.map((pick) => pick ? <Link key={pick.country.iso3} href={`/countries/${pick.country.slug}`} className="t-body">{pick.country.name}</Link> : null)}</div></details>
    <DraftReviewDetails review={state.review} />
  </>;
}
