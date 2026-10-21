import Link from "next/link";
import { Flag } from "@/ui/flag";
import { Portrait } from "@/ui/portrait";
import { BONUSES, fitWord } from "@/lib/game-logic/country-draft/tables";
import type { DraftReview } from "@/lib/game-logic/country-draft/public-view";
import { JOB_NAMES, safeDraftWhy } from "./presentation";

export function DraftReviewDetails({ review }: { review: DraftReview | null }) {
  if (!review) return null;
  return <>
    <details className="dr-result-detail"><summary className="t-body">What you passed on</summary>
      {!review.unlocked ? <p className="t-meta text-mute">Points unlock at midnight Berlin time.</p> : null}
      <div className="dr-review-rounds">{review.rounds.map((round) => <section key={round.round} className="dr-review-round">
        <h3 className="t-h3"><span className="t-meta">Round {round.round + 1}</span><Flag iso2={round.country.iso2} alt="" size="xs" /> {round.country.name}</h3>
        <p className="t-meta text-mute">You seated {round.seatedName}.</p>
        {round.passedPeople.map((person) => <div className="dr-passed-person" key={person.slug}><Portrait slug={person.slug} name={person.name} has={person.portrait} size={36} /><div><b className="t-body">{person.name}</b>{person.best ? <><p className="t-body">{JOB_NAMES[person.best.seat]}: {person.best.points} points.</p><p className="t-meta text-mute">{fitWord(person.best.fit)} fit {person.best.fit} + fame {person.best.fame}.</p><p className="t-body">{safeDraftWhy(person.best)} <a href={person.best.source} target="_blank" rel="noreferrer">Source</a></p></> : null}</div></div>)}
        <p className="t-meta text-mute">Unopened: {round.unopenedCountries.map((country, index) => <span key={country.iso3}>{index ? ", " : ""}<Link href={`/countries/${country.slug}`}>{country.name}</Link></span>)}.</p>
      </section>)}</div>
    </details>
    {review.optimal ? <details className="dr-result-detail"><summary className="t-body">Best draft: {review.optimal.score}</summary>
      <p className="t-body">{review.optimal.gap === 0 ? "Perfect line." : `${review.optimal.gap} points to the best line.`}</p>
      <div className="dr-rows">{review.optimal.seats.map((pick) => <div className="dr-appointment" key={pick.round}><Portrait slug={pick.person.slug} name={pick.person.name} has={pick.person.portrait} size={44} /><div><b className="t-h3">{pick.person.name}</b><p className="t-meta"><Flag iso2={pick.country.iso2} size="xs" alt="" />Round {pick.round + 1} · {pick.country.name} · {JOB_NAMES[pick.seat]}</p><p className="t-body">{fitWord(pick.fit)} fit {pick.fit} + fame {pick.fame} = {pick.points}.</p><p className="t-body">{safeDraftWhy(pick)} <a href={pick.source} target="_blank" rel="noreferrer">Source</a></p></div></div>)}</div>
      <div className="dr-tally t-body">{BONUSES.map((bonus) => <p key={bonus.key}><span>{bonus.name}</span><b className="num">{review.optimal?.bonuses[bonus.key] ? `+${bonus.points}` : "0"}</b></p>)}</div>
    </details> : null}
  </>;
}
