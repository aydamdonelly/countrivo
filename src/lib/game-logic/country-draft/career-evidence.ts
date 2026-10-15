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
};

export function applyCareerEvidence(slug: string, ratings: { fits: number[]; fitEvidence: { line: string; source: string }[] }) {
  const fits = [...ratings.fits];
  const fitEvidence = [...ratings.fitEvidence];
  for (const evidence of CAREER_EVIDENCE[slug] ?? []) {
    if (evidence.fit <= fits[evidence.seat]) continue;
    fits[evidence.seat] = evidence.fit;
    fitEvidence[evidence.seat] = { line: evidence.line, source: evidence.source };
  }
  return { fits, fitEvidence };
}
