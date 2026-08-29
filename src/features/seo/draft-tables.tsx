import type { ReactNode } from "react";
import {
  ARCHETYPES,
  BANDS,
  BONUSES,
  FIT_WORDS,
  MAX_BASE,
  MAX_BONUS,
  MAX_CEILING,
  MAX_SCORE,
  MIN_CEILING,
  SEAT_SHORT,
  SEATS,
  STANDING_POINTS,
} from "@/content/draft";
import { EditorialHead, Prose, Table } from "@/ui";

/**
 * The whole scoring model of Country Draft, printed on its landing page (SPEC 20.5).
 * The competitor keeps this behind a separate guide; publishing it is the only content
 * this URL can carry that nobody else has, and a player who reads it plays the first
 * board better. Every value comes from src/content/draft.ts, never typed twice.
 */
const COUNT_WORDS = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];

export function DraftTables() {
  const ARCHETYPE_COUNT_WORD = COUNT_WORDS[ARCHETYPES.length] ?? String(ARCHETYPES.length);
  const seatRows = SEATS.map((s) => ({
    seat: s.name,
    wants: s.wants,
    natural: s.natural,
  }));

  const fitRows = ARCHETYPES.map((a) => {
    const row: Record<string, ReactNode> = { who: a.label };
    a.fit.forEach((points, i) => {
      row[SEAT_SHORT[i]] = <span className={points === 25 ? "nat" : undefined}>{points}</span>;
    });
    return row;
  });

  const bonusRows = BONUSES.map((b) => ({
    bonus: (
      <>
        {b.name}
        <span className="sub t-meta">{b.needs}</span>
      </>
    ),
    points: `+${b.points}`,
  }));

  // "the sovereign who held real power over a state, the commander who led armies ..."
  const archetypeLine = `The ${ARCHETYPE_COUNT_WORD} archetypes are ${ARCHETYPES.map(
    (a, i) =>
      `${i === ARCHETYPES.length - 1 ? "and " : ""}the ${a.label.toLowerCase()} who ${a.means}`,
  ).join(", ")}.`;

  const standingLine = STANDING_POINTS.map((p, i) => `${i + 1} pays ${p}`).join(" · ");

  // "40 is a region, 80 a continent, 120 most of the map, 160 the whole thing"
  const bandLine = [...BANDS]
    .reverse()
    .filter((b) => b.from > 0)
    .map((b, i) => `${b.from} ${i === 0 ? "is " : ""}${b.word.replace(/\.$/, "").toLowerCase()}`)
    .join(", ");

  return (
    <>
      <section aria-labelledby="the-seats">
        <EditorialHead id="the-seats" title="The seats" fact="five chairs, one each" />
        <Table
          className="seats"
          caption="The five seats and the kind of person each one wants"
          columns={[
            { key: "seat", label: "Seat" },
            { key: "wants", label: "What it wants" },
            { key: "natural", label: "Natural fit" },
          ]}
          rows={seatRows}
          rowKey={(row) => String(row.seat)}
        />
      </section>

      <section aria-labelledby="the-points">
        <EditorialHead id="the-points" title="How the points work" />
        <Prose
          paragraphs={[
            `Every appointment scores the fit plus the standing. The fit comes from the archetype the person carries and the seat you give them. Five appointments make ${MAX_BASE} points, three bonuses add ${MAX_BONUS} more, and the cabinet is scored out of ${MAX_SCORE}.`,
            archetypeLine,
          ]}
        />

        <Table
          className="fit"
          caption="Points scored by each archetype in each seat"
          columns={[
            { key: "who", label: "Archetype" },
            ...SEAT_SHORT.map((s) => ({ key: s, label: s, value: true })),
          ]}
          rows={fitRows}
          rowKey={(_row, i) => ARCHETYPES[i].label}
        />
        <p className="fit-legend t-meta">{FIT_WORDS.map((f) => `${f.points} ${f.word}`).join(" · ")}</p>

        <p className="t-prose after-table">
          Standing runs 1 to 5 and is printed on every card. It adds on top of the fit: {standingLine}.
          A standing 2 sovereign in the Chair pays 27, and a standing 5 firebrand in the same chair
          pays 28, which is why the natural fit is not always the right call.
        </p>

        <Table
          className="bonus"
          caption="The three bonuses"
          columns={[
            { key: "bonus", label: "Bonus" },
            { key: "points", label: "Points", value: true },
          ]}
          rows={bonusRows}
          rowKey={(_row, i) => BONUSES[i].name}
        />
        <p className="t-prose after-table">
          The score is graded with one word: {bandLine}.
        </p>

        <p className="t-prose after-table">
          Nothing in the score is random. Two identical cabinets always score the same number, and
          every board is generated until the best line it allows falls between {MIN_CEILING} and{" "}
          {MAX_CEILING} out of {MAX_SCORE}, and until taking the biggest name in front of you lands
          well short of it. Par holds from one day to the next, and greed does not pay.
        </p>
      </section>
    </>
  );
}
