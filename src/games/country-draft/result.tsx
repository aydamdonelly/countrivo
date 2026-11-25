import Link from "next/link";
import type { ReactNode } from "react";
import { Flag } from "@/ui/flag";
import { Portrait } from "@/ui/portrait";
import { ResultPanel, type ResultRank } from "@/ui/result-panel";
import type { DailyNextProps } from "@/ui/daily-next";
import { Button } from "@/ui/button";
import { BONUSES, MAX_FIT, MAX_SCORE, bandOf } from "@/lib/game-logic/country-draft/tables";
import type { DraftView } from "@/lib/game-logic/country-draft/public-view";
import { formatNumber } from "@/lib/utils";
import { Cabinet, JOB_NAMES } from "./board";
import { DraftMap } from "./draft-map";
import { DraftReviewDetails } from "./review";
import { cabinetStory, pointsLine, safeDraftWhy } from "./presentation";
import "./draft.css";

/** The daily target the result card measures against (the landing's Par). */
const DRAFT_TARGET = 140;

interface ResultProps {
  state: DraftView;
  mode: "daily" | "practice";
  shareText: string;
  reveal?: boolean;
  onRevealEnd?: () => void;
  children?: ReactNode;
  /** Daily only: today's progress and the next game, directly under the score card. */
  daily?: DailyNextProps;
  dateKey?: string;
  rank?: ResultRank | null;
  primaryAction?: ReactNode;
  feedback?: ReactNode;
  onShare?: () => void;
  challengeUrl?: string;
  onReplay?: () => void;
  replayBusy?: boolean;
}

/** The Draft result on the shared result screen: card, next game, leaderboard, then the cabinet. */
export function Result({ state, mode, shareText, reveal = false, onRevealEnd, children, daily, dateKey, rank, primaryAction, feedback, onShare, challengeUrl, onReplay, replayBusy = false }: ResultProps) {
  const fiveSeats = state.fitTotal + state.fameTotal;
  const thinJobs = state.seats.flatMap((pick) => pick && pick.fit < 12 ? [JOB_NAMES[pick.seat]] : []);
  const bonusTotal = state.score - fiveSeats;
  const story = cabinetStory(state.seats);
  const highlights = [{ pick: story.strongest, label: "Standout pick" }, { pick: story.weakest, label: story.weakestLabel }];
  const verdict = state.score > DRAFT_TARGET ? "above today's target" : state.score === DRAFT_TARGET ? "on today's target" : "below today's target";
  return <ResultPanel mode={mode} game="Country Draft" slug="country-draft" score={`${state.score} / ${MAX_SCORE}`} outcome={`${bandOf(state.score).word.replace(/\.$/, "")}, ${verdict}`}
    review={<PicksExplained state={state} open />}
    dateKey={dateKey} rank={rank} animateScore={reveal} daily={daily} primaryAction={primaryAction} feedback={feedback}
    share={{ text: shareText, challengeUrl, onShare, label: challengeUrl ? "Challenge a friend" : "Share result" }}
    actions={onReplay ? <Button onClick={onReplay} disabled={replayBusy} pending={replayBusy} pendingLabel="Opening" block>One more draft</Button> : undefined}>
    <section className="dr-result-card dr-result-body" aria-label="Your cabinet">
      <div className="dr-conquest-panel">
        <div className="dr-conquest-caption"><b className="t-h3">{story.title}</b>{reveal ? <button className="t-meta dr-skip-reveal" type="button" onClick={onRevealEnd}>Skip animation</button> : <span className="t-meta">{state.regions.length} regions</span>}</div>
        <DraftMap from={state.seats.flatMap((seat) => seat ? [seat.country.iso3] : [])} score={state.score} reveal={reveal} onRevealEnd={onRevealEnd} />
      </div>
      <div className="dr-campaign-highlights">{highlights.map(({ pick, label }) => pick ? <div className="dr-campaign-pick" key={pick.seat}>
        <Portrait slug={pick.person.slug} name={pick.person.name} has={pick.person.portrait} size={40} />
        <div><span className="t-meta">{label}</span><b className="t-body">{pick.person.name}</b><small className="t-meta">{JOB_NAMES[pick.seat]} · {pick.points} points</small></div>
      </div> : null)}</div>
      <Cabinet state={state} />
      <div className="dr-tally-inline t-meta"><span>Seats <b className="num">{fiveSeats}</b></span><span>Bonuses <b className="num">+{bonusTotal}</b></span></div>
    </section>
    <details className="dr-score-details"><summary>Score breakdown<span className="disclosure-count">{fiveSeats} + {bonusTotal}</span></summary><div className="dr-tally t-body"><p><span>Five seats</span><b className="num">{fiveSeats}</b></p>{BONUSES.map((bonus) => <p key={bonus.key}><span>{bonus.name}{bonus.key === "fullCabinet" && !state.bonuses.fullCabinet && thinJobs.length ? <small className="t-meta">{thinJobs.length > 1 ? `${thinJobs.slice(0, -1).join(", ")} and ${thinJobs[thinJobs.length - 1]}` : thinJobs[0]} needed a fit of 12 or more.</small> : null}</span><b className="num">{state.bonuses[bonus.key] ? `+${bonus.points}` : "0"}</b></p>)}</div></details>
    <DraftResultDetails state={state} picks={false} />
    {children}
  </ResultPanel>;
}

/** Each appointment with its fit, fame and reason; the weakest seat and any better free job named. */
export function PicksExplained({ state, open = false }: { state: DraftView; open?: boolean }) {
  const picks = state.seats.flatMap((pick) => pick ? [pick] : []);
  const weakest = picks.reduce<(typeof picks)[number] | null>((low, pick) => !low || pick.points < low.points ? pick : low, null);
  return <details className="dr-result-detail" open={open || undefined}><summary className="t-body">Your picks explained</summary>
    {weakest ? <p className="t-body dr-weakest">Weakest seat: {JOB_NAMES[weakest.seat]}, {weakest.points} points.{weakest.better ? ` ${JOB_NAMES[weakest.better.seat]} was still free and fit ${weakest.person.name} better (${weakest.better.fit} of ${MAX_FIT}).` : weakest.fit < 12 ? ` ${weakest.person.name}'s recorded career is far from this job.` : ""}</p> : null}
    <p className="t-meta text-mute">Fit ratings reflect recorded careers.</p><div className="dr-rows">{picks.map((pick) => <div className="dr-appointment" key={pick.seat}><Portrait slug={pick.person.slug} name={pick.person.name} has={pick.person.portrait} size={44} /><div><b className="t-h3">{pick.person.name}</b><p className="t-meta"><Flag iso2={pick.country.iso2} size="xs" alt="" /> {pick.country.name} · {JOB_NAMES[pick.seat]}</p><p className="t-body">{pointsLine(pick.fit, pick.fame)} = {pick.points}.</p><p className="t-body">{safeDraftWhy(pick)} <a href={pick.source} target="_blank" rel="noreferrer">Source</a></p>{pick.better ? <p className="t-meta dr-better">Free at the time and a better fit: {JOB_NAMES[pick.better.seat]}, fit {pick.better.fit} of {MAX_FIT}.</p> : null}</div></div>)}</div></details>;
}

export function DraftResultDetails({ state, picks = true }: { state: DraftView; picks?: boolean }) {
  return <>
    {picks ? <PicksExplained state={state} /> : null}
    <details className="dr-result-detail"><summary className="t-body">Your countries</summary><p className="t-body">{formatNumber(state.geography.population)} people · {state.geography.areaPercent.toFixed(1)}% of the world&apos;s country area · {state.regions.length} regions.</p><p className="t-meta text-mute">{state.regions.join(", ")} · {formatNumber(state.geography.area)} km². Countrivo 2023 dataset.</p><div className="dr-homeland-links">{state.seats.map((pick) => pick ? <Link key={pick.country.iso3} href={`/countries/${pick.country.slug}`} className="t-body">{pick.country.name}</Link> : null)}</div></details>
    <DraftReviewDetails review={state.review} />
  </>;
}
