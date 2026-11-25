/**
 * Copy for the four hubs and the three legal pages (blueprint 7.2, 7.8, 7.10, 7.12,
 * 7.18). The lists-hub intro is verbatim from the deleted /lists page; the games-hub FAQ
 * is verbatim except the "daily challenge" wording (blueprint 10.1); the countries-hub
 * intro is new copy in the voice of section 10. Every number on a hub is computed from
 * the data at render, so nothing here states a count.
 */

/* ── /games ──────────────────────────────────────────────────────────────── */

export const GAMES_HUB = {
  title: "Free Geography Games: Daily Puzzles & Unlimited Practice",
  description:
    "Play free geography games: GeoWordle, Country Draft, Flag Quiz and country stats puzzles. New daily boards and unlimited practice, no signup or download.",
  h1: "Free geography games",
} as const;

/** The three hub FAQs; counts are filled in by the page (blueprint 7.2). */
export function gamesHubFaq(games: number, dailies: number): { q: string; a: string }[] {
  return [
    {
      q: "What are the best free geography games online?",
      a: `Countrivo has ${games} free geography games: Country Draft, GeoWordle, Pinpoint, Flag Quiz, Higher or Lower and Stat Guesser have daily boards. Blind Pick and the thirty-second Speed Flags are unlimited practice.`,
    },
    {
      q: "Do I need an account to play?",
      a: "No. There are no player accounts. Results save on this browser. Finish a daily game, then add a name to the leaderboard if you like.",
    },
    {
      q: "How does the daily work?",
      a: `${dailies} games have a daily board: one shot per day, the same board for everyone, results on the board until midnight Berlin time. Practice mode is unlimited and never counts.`,
    },
  ];
}

/* ── /countries ──────────────────────────────────────────────────────────── */

export const COUNTRIES_HUB = {
  title: "All 243 Countries | Flags, Capitals & World Rankings",
  description:
    "Explore 243 countries with flags, capitals, continents, and world statistics. Search, filter, and compare.",
  h1: "Countries",
  searchPlaceholder: "Search a country or capital",
} as const;

/** Two paragraphs; the page adds the sentence with the three game links after them. */
export const COUNTRIES_INTRO: readonly string[] = [
  "Every profile carries the flag, the capital, the continent and world rankings, from population and total area to forest cover and time spent online. Rankings include only countries with data.",
  "The figures come from the World Bank, the WHO, the UNWTO and REST Countries, and each one is dated on the page it sits on.",
];

/** Four fixed hooks into the index; every value is read from the data at build. */
export const COUNTRY_FACTS: readonly { iso3: string; stat: string; label: string }[] = [
  { iso3: "RUS", stat: "area-km2", label: "Russia, the largest" },
  { iso3: "IND", stat: "population", label: "India, the most people" },
  { iso3: "VAT", stat: "area-km2", label: "Vatican City, the smallest" },
  { iso3: "CHN", stat: "borders", label: "China, the most neighbours" },
];

/* ── /categories ─────────────────────────────────────────────────────────── */

export const CATEGORIES_HUB = {
  title: "World Rankings by Statistic | Population, GDP, Area & More",
  description:
    "Compare country statistics: population, GDP, area, life expectancy, tourism, forest cover and more. Sources and reference years appear with each ranking. Then test yourself in Higher or Lower.",
  h1: "Rankings",
} as const;

/* ── /lists ──────────────────────────────────────────────────────────────── */

export const LISTS_HUB = {
  title: "Country Lists & Rankings",
  description:
    "Explore curated country lists and rankings: largest countries, most populated nations, richest economies, and countries by continent.",
  h1: "Country lists",
} as const;

/** Verbatim from the deleted /lists page. */
export const LISTS_INTRO: readonly string[] = [
  "Explore countries by size, population, geography and other statistics. Each ranking shows its source and reference year. Missing values are left out, so coverage varies by statistic.",
  "Whether you are researching for school, settling a debate, or just curious about the world, these rankings give you a clear, sortable view of how countries compare on the metrics that matter most.",
];

/* ── /privacy, /terms, /support ──────────────────────────────────────────── */

export interface LegalSection {
  h2: string;
  paragraphs: readonly string[];
}

export interface LegalPageCopy {
  title: string;
  description: string;
  h1: string;
  lead: string;
  sections: readonly LegalSection[];
}

export const PRIVACY: LegalPageCopy = {
  title: "Privacy", description: "What Countrivo stores, and how to forget this device.", h1: "Privacy", lead: "Play without an account. Results save automatically with a guest name unless you choose your own.",
  sections: [
    {h2: "Who operates Countrivo", paragraphs: ["Adam Kahirov, Lily-Braun-Straße 27, 12619 Berlin, Germany. Contact: countrivo@gmail.com."]},
    {h2: "Your device and games", paragraphs: ["A necessary browser cookie identifies this device so we can resume games and keep one daily result per game. It is protected against modification. We store game actions, results, dates and a generated guest name or the name you choose. Progress and streaks also use necessary browser storage. Clearing storage may lose access to this device's results."]},
    {h2: "Your public name", paragraphs: ["New daily results appear automatically on the leaderboard with a generated guest name. You can optionally choose a name and country instead. The displayed name, optional country, score, game and date are public. Practice results are saved with a name but stay outside the public daily leaderboard. Today's custom name can be changed or replaced with a guest name from your result screen on the same device. For an older result, use Forget this device or contact us. Other players see full run details only after that board's day has ended. Do not put private contact details in your name."]},
    {h2: "Your feedback", paragraphs: ["New posts submitted through the public feedback board are anonymous and visible to everyone. The message, game or site context, date and vote totals are public; no name or device identifier is shown. We privately use the existing browser identifier to save your upvote or downvote, prevent duplicate votes and safely retry submissions. Older messages submitted as private are not automatically published. Do not include personal contact details or sensitive information in a public post. Forget this device removes its public posts, private feedback and votes; you can also contact countrivo@gmail.com to request deletion."]},
    {h2: "Protecting players", paragraphs: ["To limit repeated naming and reports, we store a daily salted hash of the request's network address. The hash changes each day; the raw address is not stored in our game tables. A feedback report stores the post, a predefined reason, your device identifier, the daily network hash and its review status. These reports are private to the operator. Public feedback has an automated offensive-language check, which is not a substitute for reviewing reports. You can report a post or hide an author's feedback and leaderboard entries on your browser. We may hide posts or prevent an abusive device from publishing feedback and names. A moderation ban identifier may remain after saved results are removed, for as long as needed to prevent repeated abuse and handle appeals."]},
    {h2: "Analytics and hosting", paragraphs: ["Vercel hosts the site and provides aggregate, cookieless web analytics and performance measurements. Supabase stores game records and private usage statistics. We reuse the existing device identifier to understand page navigation, game starts and accepted actions, completions, leaderboard controls, sharing and the feedback flow. Interaction events contain only predefined categories, never typed guesses, player names, feedback messages, full URLs or network addresses. A small pending event queue uses this tab's session storage and retries after play or typing has settled. No extra tracking cookie is created. These services also process technical request information to deliver and protect the site. Countrivo has no advertising trackers."]},
    {h2: "How long we keep data", paragraphs: ["Saved game records remain available for daily locks, your progress and the archive until you remove them with Forget this device or request deletion. After 90 days, usage events are removed by a daily cleanup that runs when new usage data arrives or administration is opened. Forget this device removes its usage events as well as saved games and feedback. Reports, abuse-prevention records and historical account records are kept only while needed for their stated purpose or a legal requirement. We review moderation records when handling reports and appeals. Browser activity, streak and game instruction cookies expire after one year; the necessary device cookie expires after two years unless cleared earlier."]},
    {h2: "Sharing and reminders", paragraphs: ["Sharing a challenge exposes only its game, date, version and score, not your device identifier or answers. Anyone with its link can see that score. A calendar reminder is an optional file you choose to import into your own calendar; Countrivo does not receive your calendar or email address through this feature. In the iOS app you can turn on a daily reminder. We then store the app’s notification token, your time zone and the date of the last reminder, and send at most one notification a day in the early evening if this device has not played that day. Turn it off in iOS Settings or with Forget this device."]},
    {h2: "Historical accounts", paragraphs: ["Earlier versions offered accounts. New games no longer require or offer login. Historical account records remain in a separate database; email countrivo@gmail.com to ask about access or deletion of those records."]},
    {h2: "Your choices", paragraphs: ["Use Forget this device below to remove its saved games, names, feedback posts, votes, usage events and reports it submitted, along with its block relationships and Countrivo browser storage. Reports and votes attached to its deleted feedback posts are also removed. This does not remove retained moderation-ban identifiers, historical account records or hosting-provider records. Contact us to request information, correction or deletion of personal data. You may also complain to a data protection authority."]},
    {h2: "Cookies", paragraphs: ["Countrivo uses necessary cookies for this device, daily progress and the streak, plus one that remembers when you have finished your first Country Draft so its instructions stop showing. We do not use advertising cookies. Your browser can block or clear cookies, but daily progress and saved results may then be unavailable."]},
  ],
};

export const TERMS: LegalPageCopy = {
  title: "Terms", description: "Rules for playing Countrivo and publishing a leaderboard name.", h1: "Terms", lead: "Free games. Play fair and be kind.",
  sections: [
    {h2: "Playing", paragraphs: ["Countrivo provides geography games for general information and entertainment. Daily boards share one set of rules and one result per device, game and day. Practice does not count on the daily leaderboard."]},
    {h2: "Names on the leaderboard", paragraphs: ["Daily scores are listed automatically under a generated guest name; choosing your own name is optional. Do not impersonate others or use hateful, harassing or obscene names. We may hide names reported for abuse. Names need not be unique and do not establish a verified identity."]},
    {h2: "Public feedback", paragraphs: ["Feedback posts are visible to everyone under an anonymous label. Be constructive: no harassment, hate, sexual or graphic content, threats, spam, impersonation or other people's private information. Do not post contact details or sensitive information. Automated checks may reject offensive language; we also review reports and may hide posts or block authors from publishing. Use Report or block on a post to flag a concern or hide its author's posts on this device. Contact countrivo@gmail.com for private concerns, deletion requests or moderation appeals. Forget this device removes its posts and votes. Older messages submitted privately are not automatically made public."]},
    {h2: "Fair use", paragraphs: ["Do not send fabricated scores, automate competitive submissions, attack the service or disrupt games for others. Simulated practice rivals are labelled as bots and do not affect human rankings."]},
    {h2: "Data and availability", paragraphs: ["Statistics describe particular source years and coverage. Borders and map positions are simplified. The game may change or be unavailable; it is not a source of professional advice. Mandatory consumer rights remain unaffected."]},
    {h2: "Questions", paragraphs: ["For a correction, report or question, email countrivo@gmail.com. You can remove your public name or forget this device at any time."]},
  ],
};

export const SUPPORT = {
  title: "Support", description: "Get help with Countrivo games, scores and device progress.", h1: "Support",
  faq: [
    {q: "When does the daily reset?", a: "At midnight Europe/Berlin time. One daily result per game and device, the same board for everyone. Practice is unlimited."},
    {q: "Do I need an account?", a: "No. There is no login. Every completed game saves automatically under a guest name. Daily results join the leaderboard automatically; you can add your own name if you like."},
    {q: "How do I remove my name?", a: "For today's result, open the finished game on the same device and choose Remove my name. To remove all this device's results and names, use Forget this device on the Privacy page. You can also contact support."},
    {q: "How do I report a name?", a: "Use Report name on its leaderboard row, or email countrivo@gmail.com with the game and date."},
    {q: "Why did my streak disappear?", a: "The streak belongs to this browser. Clearing its cookies, switching browsers or forgetting the device starts a new streak."},
    {q: "A score did not save", a: "Keep the game tab open and use Try again if shown. Send us the game and date if it still fails. Never send passwords or private identifiers."},
    {q: "What happened to my old account?", a: "The relaunch no longer offers login. Historical records remain separate. Email us if you need help with them."},
  ],
} as const;
export const SUPPORT_EMAIL = "countrivo@gmail.com";
