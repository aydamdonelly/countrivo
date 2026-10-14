import { Button } from "@/ui/button";
import { CountUp } from "@/ui/count-up";
import { Flag } from "@/ui/flag";
import { Portrait } from "@/ui/portrait";
import { Sheet } from "@/ui/sheet";
import { cn } from "@/lib/utils";
import { LockIcon } from "@/ui/icons/lock";
import { MAX_SCORE, SEAT_NAMES, fitWord } from "@/lib/game-logic/country-draft/tables";
import type { DraftPersonView, DraftView } from "@/lib/game-logic/country-draft/public-view";
import type { PoolIdx, SeatIdx } from "@/lib/game-logic/country-draft/types";
import { poolIndex, seatIndex } from "@/lib/game-logic/country-draft/types";
import "./draft.css";

const JOB_SLUGS = ["chair", "field", "purse", "voice", "desk"];
export const JOB_NAMES = ["Leader", "Army", "Money", "Voice", "Builder"] as const;

export function ClayJob({ seat, animate = false }: { seat: number; animate?: boolean }) {
  return <span className={cn("dr-clay-job", animate && "plop")} aria-hidden="true">
    {/* eslint-disable-next-line @next/next/no-img-element -- small transparent clay stills */}
    <img src={`/clay/${JOB_SLUGS[seat]}.png`} alt="" width={56} height={56} />
    {animate ? <>
      {/* eslint-disable-next-line @next/next/no-img-element -- one stop-motion squash frame */}
      <img className="dr-clay-squash" src={`/clay/${JOB_SLUGS[seat]}-squash.png`} alt="" width={56} height={56} />
    </> : null}
  </span>;
}

export function Cabinet({ state, animate, onInspect }: { state: DraftView; animate?: boolean; onInspect?: (seat: SeatIdx) => void }) {
  return <div className="dr-cabinet-strip" aria-label="Your cabinet">
    {SEAT_NAMES.map((name, index) => {
      const seat = seatIndex(index);
      if (seat === null) return null;
      const pick = state.seats[seat];
      const content = <>
        <span className="dr-job-art"><ClayJob seat={seat} animate={animate && state.lastSeat === seat} />
          {pick ? <Portrait slug={pick.person.slug} name={pick.person.name} has={pick.person.portrait} size={30} className="dr-seated-face" /> : null}
        </span>
        <span className="dr-seat-short">{JOB_NAMES[seat]}</span>
        {pick ? <b className={cn("t-body num", pick.fit <= 6 && "text-ember")}><CountUp value={pick.points} duration={750} animate={animate && state.lastSeat === seat} /></b> : <span className="dr-seat-empty" />}
      </>;
      return pick && onInspect ? <button type="button" className="dr-cabinet-place" key={name} onClick={() => onInspect(seat)} aria-label={`${pick.person.name}, ${JOB_NAMES[seat]}, ${pick.points} points. View score details.`}>{content}</button> : <div className="dr-cabinet-place" key={name}>{content}</div>;
    })}
  </div>;
}

function yearLabel(year: number): string { return year < 0 ? `${Math.abs(year)} BC` : String(year); }
export function personYears(person: DraftPersonView): string {
  if (person.activeFrom !== null && person.activeUntil !== null) return `Active ${yearLabel(person.activeFrom)} to ${yearLabel(person.activeUntil)}`;
  if (person.activeFrom !== null) return `Active since ${yearLabel(person.activeFrom)}`;
  if (person.born !== null && person.died !== null) return `${yearLabel(person.born)} to ${yearLabel(person.died)}`;
  if (person.born !== null) return `Born ${yearLabel(person.born)}`;
  return person.era === "early" ? "Before 1900" : person.era === "recent" ? "Modern era" : "Historical figure";
}

export interface DraftSelection { country: PoolIdx | null; person: PoolIdx | null; seat: SeatIdx | null; detail: PoolIdx | null; revealSeat: SeatIdx | null; }
export interface DraftBoardProps {
  state: DraftView;
  selection: DraftSelection;
  busy: boolean;
  animate: boolean;
  onCountry: (index: PoolIdx) => void;
  onOpen: () => void;
  onPerson: (index: PoolIdx) => void;
  onSeat: (index: SeatIdx) => void;
  onCommit: () => void;
  onDrop: () => void;
  onNext: () => void;
  onDetail: (index: PoolIdx | null) => void;
  onReveal: (index: SeatIdx) => void;
}

export function Board(p: DraftBoardProps) {
  const { state, selection, busy } = p;
  const held = selection.person === null ? null : state.people[selection.person];
  const detail = selection.detail === null ? null : state.people[selection.detail];
  const revealIndex = selection.revealSeat ?? (state.phase === "seated" ? state.lastSeat : null);
  const reveal = revealIndex === null ? null : state.seats[revealIndex];
  const selectedCountry = selection.country === null ? null : state.countries[selection.country];
  const lastRound = state.phase !== "seated";
  return <div className={cn("dr", held && "dr-holding")}>
    <Cabinet state={state} animate={p.animate && state.phase === "seated"} onInspect={p.onReveal} />
    {reveal ? <div className={cn("dr-reveal", lastRound && "previous")} aria-live="polite">
      <div className="dr-reveal-score"><b className={cn("t-score num", reveal.fit <= 6 && "text-ember")}>+{reveal.points}</b><span className="t-body">{JOB_NAMES[reveal.seat]}</span><small className="t-meta">Fit {reveal.fit} + fame {reveal.fame}</small></div>
      <details className="dr-score-details"><summary className="t-meta">Why {reveal.points}?</summary><p className="t-body">{fitWord(reveal.fit)} fit. {reveal.why} <a href={reveal.source} target="_blank" rel="noreferrer" className="dr-source">Source</a></p></details>
    </div> : null}
    <div className="dr-meters t-meta">
      <div className="dr-bonus-progress" aria-label={`Three regions bonus: ${Math.min(3, state.regions.length)} of 3, ${state.regions.length >= 3 ? "6 points earned" : "worth 6 points"}`}><span>Regions</span><span className="dr-bonus-dots" aria-hidden="true">{[0, 1, 2].map(index => <i key={index} className={index < state.regions.length ? "earned" : undefined} />)}</span><b>+6</b></div>
      <div className="dr-bonus-progress" aria-label={`Across the ages bonus: before 1900 ${state.early ? "done" : "needed"}, after 1950 ${state.recent ? "done" : "needed"}, ${state.early && state.recent ? "6 points earned" : "worth 6 points"}`}><span className={cn("dr-era", state.early && "earned")} aria-hidden="true">&lt;1900</span><span className={cn("dr-era", state.recent && "earned")} aria-hidden="true">&gt;1950</span><b>+6</b></div>
    </div>
    {state.phase === "country" ? <>
      <div className="dr-stage-title"><h2 className="t-h3 dr-instruction">Pick a country</h2><span className="t-meta">{state.round + 1} / 5</span></div>
      <div className="dr-country-options" key={`countries-${state.round}`}>
        {state.countries.map((country, index) => {
          const i = poolIndex(index);
          if (i === null) return null;
          return <button type="button" key={country.iso3} className="dr-country-card" disabled={busy} aria-pressed={selection.country === i} onClick={() => p.onCountry(i)}>
            <Flag iso2={country.iso2} size="xl" alt="" eager /><span><b className="t-h3">{country.name}</b><small className="t-meta">{country.region}</small></span>
          </button>;
        })}
      </div>
      <div className="dr-pinned-action"><small className="dr-commit-note t-meta" id="draft-country-warning"><LockIcon size={14} />Country locks when opened</small><Button variant="ink" disabled={busy || selectedCountry === null} onClick={p.onOpen} pending={busy} pendingLabel="Opening…" aria-describedby="draft-country-warning">{selectedCountry ? `Open ${selectedCountry.name}` : "Choose a country"}</Button></div>
    </> : <>
      {state.country ? <div className="dr-round"><Flag iso2={state.country.iso2} size="m" alt="" eager /><b className="t-h3">{state.country.name}</b><small className="t-meta">Round {state.round + 1} of 5</small></div> : null}
      {state.phase === "people" ? <h2 className="t-h3 dr-person-prompt">Pick a person</h2> : null}
      <div className="dr-pool" key={`people-${state.round}`}>
        {state.people.map((person, index) => {
          const i = poolIndex(index);
          if (i === null) return null;
          const seated = state.seats.some((pick) => pick?.person.slug === person.slug);
          return <div className={cn("dr-person-card", seated && "seated")} key={person.slug}>
            <button type="button" className="dr-person-select" onClick={() => p.onPerson(i)} disabled={busy || state.phase !== "people"} aria-pressed={selection.person === i}>
              <Portrait slug={person.slug} name={person.name} has={person.portrait} size={72} /><span className="dr-person-copy"><b className="t-h3">{person.name}</b><small className="t-meta">{seated ? JOB_NAMES[state.lastSeat ?? 0] : personYears(person)}</small></span>
            </button>
            <button type="button" className="dr-info" aria-label={`About ${person.name}`} onClick={() => p.onDetail(i)}>i</button>
          </div>;
        })}
      </div>
      {state.phase === "seated" ? <div className="dr-pinned-action"><Button variant="ink" onClick={p.onNext} disabled={busy} pending={busy} pendingLabel="Continuing…">{state.round === 4 ? "See my result" : "Next country"}</Button></div> : null}
    </>}
    <Sheet open={held !== null} onClose={p.onDrop} labelledBy="draft-job-title" className="dr-job-sheet">
      {held ? <>
        <div className="dr-sheet-handle" />
        <div className="dr-sheet-top"><Portrait slug={held.slug} name={held.name} has={held.portrait} size={40} /><b className="t-h3">{held.name}</b><button type="button" className="dr-close" aria-label="Put person back" onClick={p.onDrop}>×</button></div>
        <h2 id="draft-job-title" className="t-h2">Pick a job</h2>
        <div className="dr-job-options">{SEAT_NAMES.map((name, index) => {
          const seat = seatIndex(index);
          if (seat === null) return null;
          const filled = state.seats[seat];
          return <button type="button" key={name} className="dr-job-option" disabled={busy || filled !== null} aria-pressed={!filled && selection.seat === seat} onClick={() => p.onSeat(seat)}>
            <ClayJob seat={seat} /><span className="dr-job-copy"><b className="t-h3">{JOB_NAMES[seat]}</b></span>
            {filled ? <span className="dr-job-filled"><Portrait slug={filled.person.slug} name={filled.person.name} has={filled.person.portrait} size={28} /><span className="t-meta">Filled</span></span> : null}
          </button>;
        })}</div>
        <small className="dr-commit-note t-meta" id="draft-seat-warning"><LockIcon size={14} />Final once seated</small><Button className="dr-seat-confirm" block variant="ink" disabled={busy || selection.seat === null} pending={busy} pendingLabel="Seating…" aria-describedby="draft-seat-warning" onClick={p.onCommit}>{selection.seat === null ? "Choose a job" : `Seat as ${JOB_NAMES[selection.seat]}`}</Button>
      </> : null}
    </Sheet>
    <Sheet open={detail !== null} onClose={() => p.onDetail(null)} labelledBy="draft-person-title" className="dr-detail-sheet">
      {detail ? <><div className="dr-sheet-top"><Portrait slug={detail.slug} name={detail.name} has={detail.portrait} size={96} /><button type="button" className="dr-close" aria-label="Close person details" onClick={() => p.onDetail(null)}>×</button></div><h2 id="draft-person-title" className="t-h2">{detail.name}</h2><p className="t-meta">{personYears(detail)}</p><p className="t-body">{detail.identity}</p><p className="t-meta">{detail.era === "early" ? "Counts toward the before 1900 era." : detail.era === "recent" ? "Counts toward the after 1950 era." : "From the period between the two bonus eras."}</p><p className="t-meta">Photo: <a href={detail.photoSource} target="_blank" rel="noreferrer">{detail.photoAuthor}</a>, {detail.photoLicence}.</p><Button block variant="ink" onClick={() => { if (selection.detail !== null) p.onPerson(selection.detail); p.onDetail(null); }} disabled={state.phase !== "people"}>Choose {detail.name.split(" ").at(-1)}</Button></> : null}
    </Sheet>
    <span className="sr-only">Maximum score {MAX_SCORE}.</span>
  </div>;
}
