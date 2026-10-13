import { BONUSES, MAX_SCORE, SEATS } from "@/content/draft";
import { EditorialHead, Prose, Table } from "@/ui";

export function DraftTables() {
  return <>
    <section aria-labelledby="the-seats"><EditorialHead id="the-seats" title="The five jobs" fact="one person in each" /><Table caption="Five different jobs in your cabinet" columns={[{ key: "name", label: "Job" }, { key: "wants", label: "What they do" }]} rows={SEATS.map((seat) => ({ name: seat.name, wants: seat.wants }))} rowKey={(row) => String(row.name)} /></section>
    <section aria-labelledby="the-points"><EditorialHead id="the-points" title="How the points work" /><Prose paragraphs={[
      "Each round offers three countries. Open one, choose one of its three famous people, then give that person a job that is still free. Every country choice and every appointment is final when you confirm it.",
      `Every appointment earns up to 25 for the job and up to 10 for fame. Points appear after you seat the person, alongside a short explanation. Five appointments and three cabinet bonuses can reach ${MAX_SCORE}.`,
      "Choosing someone involves more than their most familiar role. Several people in the pool crossed between politics, science, business and culture. Keep a job free when a later country could offer a better fit.",
    ]} /><Table caption="Three cabinet bonuses" columns={[{ key: "name", label: "Bonus" }, { key: "needs", label: "How to earn it" }, { key: "points", label: "Points", value: true }]} rows={BONUSES.map((bonus) => ({ name: bonus.name, needs: bonus.needs, points: `+${bonus.points}` }))} rowKey={(row) => String(row.name)} /><p className="t-prose after-table">Par is 140. Everyone gets the same daily choices, and your decisions set the score. You can play without an account and add your name to the leaderboard after you finish.</p></section>
  </>;
}
