/*
 * The Flag Quiz answer pools (concept 5.4). Three disjoint pools of sovereign states, so an
 * answer flag can only ever come from one of them and the rotation of each pool alone keeps
 * a flag from repeating:
 *
 *   KNOWN       flags 1 to 3. An authored list of widely recognised flags. It stands in for
 *               the concept's recognition tier A, which no dataset in the repo measures yet.
 *   LOOKALIKES  flags 8 to 10. Authored families of flags that are genuinely confused with
 *               each other (same palette, same layout class). `core` members can be the
 *               answer and the family line tells them apart; `kin` fill the four options.
 *   the rest    flags 4 to 7: every other sovereign state (see engine.ts).
 *
 * No territory is in any pool: the daily is sovereign states only.
 */

export interface LookalikeSet {
  /** A stable id, used for the rotation and in tests. */
  id: string;
  /** iso3 of the members that can be the answer. Never in KNOWN. */
  core: readonly string[];
  /** iso3 of the look-alikes that fill the options up to four. */
  kin: readonly string[];
  /** The one family line shown on the reveal. Names as the options print them. */
  line: string;
}

/** The source line under every family line. Each line restates the Factbook's flag note. */
export const FAMILY_SOURCE = "Source: CIA World Factbook";

export const LOOKALIKES: readonly LookalikeSet[] = [
  { id: "chad-romania", core: ["TCD", "ROU"], kin: ["MDA", "AND"], line: "Chad's blue is darker than Romania's." },
  { id: "indonesia-monaco", core: ["IDN", "MCO"], kin: ["POL", "SGP"], line: "Same red over white. Indonesia's flag is longer than Monaco's." },
  {
    id: "orange-white-green",
    core: ["IRL", "CIV", "IND", "NER"],
    kin: [],
    line: "Ireland has green at the hoist, Ivory Coast has orange. Niger's disc is orange, India's is a blue wheel.",
  },
  {
    id: "slav-tricolours",
    core: ["SVN", "SVK", "RUS"],
    kin: ["SRB"],
    line: "Slovakia's shield spans all three bands, Slovenia's sits high by the hoist, Russia has none.",
  },
  { id: "australia-new-zealand", core: ["AUS", "NZL"], kin: ["TUV", "FJI"], line: "New Zealand has four red stars, Australia six white ones." },
  { id: "norway-iceland", core: ["NOR", "ISL"], kin: ["DNK", "FIN"], line: "Norway's cross is blue on red, Iceland's is red on blue." },
  {
    id: "senegal-mali-guinea",
    core: ["SEN", "MLI", "GIN"],
    kin: ["CMR"],
    line: "Mali runs green to red from the hoist, Guinea red to green, and Senegal adds a green star.",
  },
  { id: "netherlands-luxembourg", core: ["NLD", "LUX"], kin: ["PRY", "HRV"], line: "The Netherlands uses a darker blue than Luxembourg." },
  { id: "colombia-ecuador", core: ["COL", "ECU"], kin: ["VEN", "BOL"], line: "Same yellow, blue and red. Ecuador adds a coat of arms, Colombia has none." },
  {
    id: "arab-tricolours",
    core: ["EGY", "SYR", "IRQ", "YEM"],
    kin: [],
    line: "All red, white and black: Egypt has an eagle, Syria two green stars, Iraq green script, Yemen nothing.",
  },
  {
    id: "central-american-bands",
    core: ["HND", "NIC", "SLV"],
    kin: ["GTM"],
    line: "Honduras has five blue stars. Nicaragua and El Salvador carry an emblem ringed by words.",
  },
  { id: "qatar-bahrain", core: ["QAT", "BHR"], kin: ["LVA", "AUT"], line: "Qatar's maroon has nine white points, Bahrain's red has five." },
  {
    id: "jordan-palestine-sudan",
    core: ["JOR", "PSE", "SDN"],
    kin: ["KWT"],
    line: "Jordan's red triangle holds a white star, Palestine's is plain, and Sudan's triangle is green.",
  },
];

/**
 * Flags 1 to 3: widely recognised flags, none of them a lookalike core member. 65 of them,
 * so three a day can hold the 21-day no-repeat window (3 x 21 = 63).
 */
export const KNOWN: readonly string[] = [
  "USA", "CAN", "MEX", "GBR", "FRA", "DEU", "ITA", "ESP", "PRT", "BEL", "CHE", "AUT", "SWE",
  "DNK", "FIN", "POL", "UKR", "GRC", "TUR", "ISR", "SAU", "ARE", "IRN", "PAK", "BGD", "CHN",
  "JPN", "KOR", "PRK", "VNM", "THA", "PHL", "MYS", "SGP", "BRA", "ARG", "CHL", "PER", "URY",
  "CUB", "JAM", "ZAF", "NGA", "KEN", "ETH", "MAR", "KAZ", "CZE", "HUN", "HRV", "SRB", "LKA",
  "NPL", "KHM", "LBN", "GHA", "VAT", "BTN", "CYP", "TUN", "DZA", "PAN", "VEN", "GEO", "ALB",
];
