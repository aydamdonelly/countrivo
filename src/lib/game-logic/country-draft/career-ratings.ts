import type { DraftCareerClaim, DraftCareerRecord } from "@/lib/data/draft";

interface CareerRule { matches: RegExp; ratings: readonly number[]; excludes?: RegExp; }

// These are game-design judgments about documented work, not measurements of a person's ability.
const OCCUPATIONS: readonly CareerRule[] = [
  { matches: /^(monarch|ruler|head of state|head of government|prime minister)$/, ratings: [25, 6, 12, 18, 6] },
  { matches: /^(politician|statesperson|minister|member of parliament|jurist|lawyer|barrister)$/, ratings: [18, 6, 12, 18, 6] },
  { matches: /^(diplomat|ambassador)$/, ratings: [18, 0, 6, 25, 6] },
  { matches: /^(military leader|military commander|general|admiral)$/, ratings: [18, 25, 6, 12, 12] },
  { matches: /^(military officer|army officer|naval officer|military personnel|soldier|military theorist)$/, ratings: [12, 18, 6, 6, 12] },
  { matches: /^(banker|financier|investment banker|economist|central banker)$/, ratings: [12, 0, 25, 12, 12] },
  { matches: /^(entrepreneur|businessperson|industrialist|manufacturer|chief executive officer|merchant)$/, ratings: [12, 0, 25, 12, 18] },
  { matches: /^(inventor|engineer|civil engineer|electrical engineer|mechanical engineer|architect|physicist|chemist|mathematician|scientist|computer scientist|biologist|botanist|astronomer|naturalist|researcher)$/, ratings: [6, 0, 12, 6, 25] },
  { matches: /^(physician|surgeon|ecologist|geographer|agronomist|pharmacist|designer|fashion designer|industrial designer)$/, ratings: [6, 0, 12, 12, 18] },
  { matches: /writer|author|poet|novelist|journalist|essayist|playwright|philosopher|orator|editor|lyricist|songwriter/, ratings: [6, 0, 6, 25, 12] },
  { matches: /actor|singer|musician|composer|comedian|pianist|conductor|guitarist|recording artist|filmmaker|film director|theatre director/, ratings: [6, 0, 6, 25, 12] },
  { matches: /^(political activist|revolutionary|trade unionist|social activist|human rights activist)$/, ratings: [18, 6, 6, 18, 6] },
  { matches: /player|athlete|competitor|sprinter|racing automobile driver|coach|cricketer|boxer|mountaineer/, ratings: [6, 0, 6, 12, 6] },
];
const OFFICES: readonly CareerRule[] = [
  { matches: /chancellor of the exchequer|minister.*(finance|treasury|econom|budget)|treasurer|central bank|bank.*governor/, ratings: [18, 0, 25, 18, 12] },
  { matches: /minister.*(foreign|external)|ambassador|secretary of state for foreign|goodwill ambassador/, ratings: [18, 0, 6, 25, 6] },
  { matches: /minister.*(defen|war)|secretary of state for defence|lord of the admiralty/, ratings: [18, 18, 12, 12, 12] },
  { matches: /prime minister|head of government|emperor|king of|queen of|president of|chancellor of germany|imperial chancellor/, excludes: /vice president|jury|royal society|société|university|academy|association|club|senate|supreme court|united nations|constituent assembly|national convention|dáil|state council|privy council/, ratings: [25, 6, 12, 18, 12] },
  { matches: /member of.*(parliament|assembly|congress|senate|house)|governor|minister|speaker/, ratings: [18, 6, 12, 18, 6] },
];
const RANKS: readonly CareerRule[] = [
  { matches: /general|marshal|admiral/, ratings: [18, 25, 6, 12, 12] },
  { matches: /colonel|major|captain|lieutenant|commander/, ratings: [12, 18, 6, 6, 12] },
];
const JOBS = ["leadership", "military command", "finance", "public communication", "building and invention"];

export function careerRatings(record: DraftCareerRecord) {
  const fits = [6, 0, 6, 6, 6];
  const fitEvidence = fits.map((points, seat) => ({ line: `The source record does not establish a career in ${JOBS[seat]}. This game rates the connection ${points === 0 ? "as no fit" : "as thin"}.`, source: record.source }));
  function apply(claims: readonly DraftCareerClaim[], rules: readonly CareerRule[], kind: "occupation" | "office" | "rank") {
    for (const claim of claims) for (const rule of rules) {
      if (!rule.matches.test(claim.label.toLowerCase()) || rule.excludes?.test(claim.label.toLowerCase())) continue;
      rule.ratings.forEach((rating, seat) => {
        if (rating <= fits[seat]) return;
        fits[seat] = rating;
        const article = /^(?:[aeio]|u(?!ni))/i.test(claim.label) ? "an" : "a";
        const career = kind === "office" ? `Served as ${claim.label}` : kind === "rank" ? `Held the military rank of ${claim.label}` : claim.label === "military personnel" ? "Worked in the military" : `Worked as ${article} ${claim.label}`;
        fitEvidence[seat] = { line: `${career}. That experience connects to ${JOBS[seat]}.`, source: claim.source };
      });
    }
  }
  apply(record.occupations, OCCUPATIONS, "occupation");
  apply(record.offices, OFFICES, "office");
  apply(record.militaryRanks, RANKS, "rank");
  return { fits, fitEvidence };
}

export function fameRating(record: DraftCareerRecord, all: readonly DraftCareerRecord[], homeland: readonly DraftCareerRecord[]): number {
  const band = (group: readonly DraftCareerRecord[]) => group.length <= 1 ? 10 : 10 * group.filter((person) => person.sitelinks <= record.sitelinks).length / group.length;
  return Math.max(4, Math.round((band(all) + band(homeland)) / 2));
}
