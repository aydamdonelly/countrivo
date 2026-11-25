import type { SeatIdx } from "./types";

interface CareerEvidence { seat: SeatIdx; fit: number; line: string; source: string; }

// An incomplete occupation list must not erase a documented main career.
const CAREER_EVIDENCE: Readonly<Record<string, readonly CareerEvidence[]>> = {
  shaka: [{ seat: 1, fit: 25,
    line: "Commanded forces and reorganised the Zulu military. Military leadership is a main part of his recorded career.",
    source: "https://sahistory.org.za/people/shaka-zulu" }],
  "leonidas-i": [{ seat: 1, fit: 25,
    line: "Led the Greek force at Thermopylae in 480 BCE. His kingship included direct military command.",
    source: "https://www.worldhistory.org/Leonidas_I/" }],
  "joan-of-arc": [{ seat: 1, fit: 25,
    line: "Helped lead the French campaign that lifted the siege of Orléans in 1429. Her role went beyond the source record's general military label.",
    source: "https://www.orleans.fr/fileadmin/orleans/MEDIA/kiosque/ville_art_histoire/vdh_jeannedarc_GB.pdf" }],
  "taytu-betul": [{ seat: 1, fit: 18,
    line: "Brought her own troops to Adwa and directed support during the battle. This counts as strong military experience alongside her role as empress.",
    source: "https://blogs.loc.gov/international-collections/2022/03/taytu-betul-the-cunning-empress-of-ethiopia/" }],
  // The source lists "sport cyclist", which the athlete rule does not name. Rated like every other athlete.
  "eddy-merckx": [{ seat: 3, fit: 12,
    line: "Won the Tour de France five times as a professional cyclist. Sporting fame counts as supporting experience in public communication, as for other athletes.",
    source: "https://en.wikipedia.org/wiki/Eddy_Merckx" }],
  // The source lists "zoologist" and "polar explorer", which the science and exploration rules do not name.
  "fridtjof-nansen": [{ seat: 4, fit: 25,
    line: "Worked as a zoologist and oceanographer, crossed Greenland and led the Fram expedition toward the North Pole. Science and exploration are a main part of his recorded career.",
    source: "https://en.wikipedia.org/wiki/Fridtjof_Nansen" }],
  // The source lists "anatomist", which the science rule does not name.
  "andreas-vesalius": [{ seat: 4, fit: 25,
    line: "Wrote De humani corporis fabrica in 1543, the founding work of modern anatomy. Scientific research is the main part of his recorded career.",
    source: "https://en.wikipedia.org/wiki/Andreas_Vesalius" }],
};

// A source label can also overstate a career: an honorary rank, a degree subject or a side
// project is not a main career. These limits were added with pool 4 and name only people who
// joined in pool 4, so no earlier board changes.
const CAREER_LIMITS: Readonly<Record<string, readonly CareerEvidence[]>> = {
  "kwame-nkrumah": [
    { seat: 1, fit: 18,
      line: "Oversaw Ghana's armed forces as head of state and minister of defence. He did not lead troops in the field.",
      source: "https://en.wikipedia.org/wiki/Kwame_Nkrumah" },
    { seat: 2, fit: 12,
      line: "Studied economics, but his recorded career was in politics, not finance. This game rates it as some experience in finance.",
      source: "https://en.wikipedia.org/wiki/Kwame_Nkrumah" },
  ],
  "margrethe-ii": [
    { seat: 1, fit: 6,
      line: "Her command of the Danish armed forces was the ceremonial role of a constitutional monarch. This game rates the connection as thin.",
      source: "https://en.wikipedia.org/wiki/Margrethe_II" },
    { seat: 4, fit: 6,
      line: "The source record does not establish a career in science, invention and exploration. This game rates the connection as thin.",
      source: "https://www.wikidata.org/wiki/Q102139" },
  ],
  "dua-lipa": [
    { seat: 2, fit: 6,
      line: "Her fashion credits are collaborations alongside her music career. The source record does not establish a career in finance.",
      source: "https://en.wikipedia.org/wiki/Dua_Lipa" },
    { seat: 4, fit: 12,
      line: "Her fashion credits are collaborations alongside her music career. Like other performers, she counts as supporting experience in science, invention and exploration.",
      source: "https://en.wikipedia.org/wiki/Dua_Lipa" },
  ],
};

export function applyCareerEvidence(slug: string, ratings: { fits: number[]; fitEvidence: { line: string; source: string }[] }) {
  const fits = [...ratings.fits];
  const fitEvidence = [...ratings.fitEvidence];
  for (const evidence of CAREER_EVIDENCE[slug] ?? []) {
    if (evidence.fit <= fits[evidence.seat]) continue;
    fits[evidence.seat] = evidence.fit;
    fitEvidence[evidence.seat] = { line: evidence.line, source: evidence.source };
  }
  for (const limit of CAREER_LIMITS[slug] ?? []) {
    if (limit.fit >= fits[limit.seat]) continue;
    fits[limit.seat] = limit.fit;
    fitEvidence[limit.seat] = { line: limit.line, source: limit.source };
  }
  return { fits, fitEvidence };
}
