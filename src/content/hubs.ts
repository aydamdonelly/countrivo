/**
 * Copy for the four hubs and the three legal pages (blueprint 7.2, 7.8, 7.10, 7.12,
 * 7.18). The lists-hub intro is verbatim from the deleted /lists page; the games-hub FAQ
 * is verbatim except the "daily challenge" wording (blueprint 10.1); the countries-hub
 * intro is new copy in the voice of section 10. Every number on a hub is computed from
 * the data at render, so nothing here states a count.
 */

/* ── /games ──────────────────────────────────────────────────────────────── */

export const GAMES_HUB = {
  title: "All Geography Games: Daily Puzzles, Flag & Capital Quizzes, Country Draft",
  description:
    "Every Countrivo game in one place: daily one-shot puzzles like Country Draft, GeoWordle and Cluster, plus flag, capital and border quizzes to practice. Free, no signup.",
  h1: "All games",
} as const;

/** The three hub FAQs; counts are filled in by the page (blueprint 7.2). */
export function gamesHubFaq(games: number, dailies: number): { q: string; a: string }[] {
  return [
    {
      q: "What are the best free geography games online?",
      a: `Countrivo has ${games} free geography games: daily one-shot puzzles such as Country Draft, GeoWordle, Higher or Lower and Cluster, plus flag, capital and border quizzes for practice. No signup is needed to play.`,
    },
    {
      q: "Do I need an account to play?",
      a: "No. Every game is free and playable without an account. Sign in only if you want your daily shot on the global and friends boards.",
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
  "Every profile carries the flag, the capital, the continent and the same 21 world rankings, from population and land area to coffee, forest cover and time spent online. Where a number is missing the row says so instead of guessing.",
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
    "Every country ranked on 21 statistics: population, GDP, area, life expectancy, tourism, forest cover and more. Sources: World Bank, WHO, UNWTO. Then test yourself in Higher or Lower.",
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
  "Browse curated lists of countries organized by size, population, wealth, and geography. Each list includes up-to-date statistics sourced from the World Bank, the United Nations, and other authoritative datasets covering all 243 recognized countries and territories.",
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
  title: "Privacy Policy",
  description: "Privacy policy for Countrivo, covering analytics and optional account data.",
  h1: "Privacy Policy",
  lead: "Countrivo is a free geography games and country data website. This page explains what limited data may be collected when you use the site, how analytics services may process it, and what optional account data is stored.",
  sections: [
    {
      h2: "Information we collect",
      paragraphs: [
        "Countrivo does not require an account to play games or browse country pages. We may collect basic usage information such as page views, device and browser details, rough location derived from IP address, referring pages, and interaction data needed to understand how the site is used and improve performance.",
      ],
    },
    {
      h2: "Analytics",
      paragraphs: [
        "Countrivo uses Vercel Web Analytics, and Vercel Speed Insights for performance, to understand traffic, popular pages, and general product usage. These privacy-friendly tools process technical information such as IP address, browser metadata, and pages visited. They do not track you across other apps or websites, and Countrivo runs no advertising trackers.",
        "Account data (email, username, scores, streaks, friends, and any iOS notification token) is stored and processed by Supabase, our backend and database provider, acting as our data processor.",
      ],
    },
    {
      h2: "Accounts",
      paragraphs: [
        "Playing is free and needs no account. If you choose to create one, we store your email address and a username so we can save your scores, streaks, and friends. You can delete your account and all associated data at any time from your profile, deletion is immediate and permanent. Countrivo shows no ads and does not sell your data.",
        "You can sign in with your Apple ID. In the iOS app, if you allow notifications we store a device token so we can send daily reminders; the token is removed when you turn notifications off or delete your account.",
      ],
    },
    {
      h2: "Cookies",
      paragraphs: [
        "Cookies and local browser storage may be used to keep the site functional, remember gameplay preferences, and measure traffic. Most browsers let you block or delete cookies in settings, although some site features may work less reliably if you do so.",
      ],
    },
    {
      h2: "Third-party links",
      paragraphs: [
        "Countrivo may link to third-party websites. Their privacy practices are governed by their own policies, not this one.",
      ],
    },
    {
      h2: "Policy updates",
      paragraphs: [
        "This policy may be updated as the site evolves, including when new features or analytics tools are introduced.",
      ],
    },
  ],
};

export const TERMS: LegalPageCopy = {
  title: "Terms of Service",
  description: "Terms of Service for Countrivo, the rules for using the free geography game.",
  h1: "Terms of Service",
  lead: "Countrivo is a free daily geography game. By playing or creating an account you agree to these terms. Play fair and be kind.",
  sections: [
    {
      h2: "Eligibility",
      paragraphs: ["You must be at least 13 years old to create an account. Anyone may play without one."],
    },
    {
      h2: "Your account and username",
      paragraphs: [
        "You are responsible for activity on your account. Usernames and display names must not impersonate others or contain hateful, harassing, or obscene content. We may rename, suspend, or remove accounts that break these rules. You can delete your account and all its data at any time from your profile.",
      ],
    },
    {
      h2: "Acceptable use",
      paragraphs: [
        "Do not cheat (for example by submitting fabricated scores), abuse other players, scrape or attack the service, or attempt to disrupt the daily board for others.",
      ],
    },
    {
      h2: "Friends and reporting",
      paragraphs: [
        "The social features let you add friends and compare scores. You can block and report other players; we may act on reports at our discretion.",
      ],
    },
    {
      h2: "Service provided as is",
      paragraphs: [
        "Countrivo is provided free, without warranties, and may change or be unavailable at any time. We are not liable for any loss arising from use of the game to the extent permitted by law.",
      ],
    },
    {
      h2: "Changes and termination",
      paragraphs: [
        "We may update these terms or the game as it evolves. You may stop using Countrivo and delete your account at any time; we may suspend accounts that violate these terms.",
      ],
    },
  ],
};

export const SUPPORT = {
  title: "Support",
  description: "Get help with Countrivo, contact, FAQ, and how to manage your account.",
  h1: "Support",
  faq: [
    {
      q: "When does the daily reset?",
      a: "Every day at midnight Europe/Berlin time. One shot per game, the same board for every player in the world. Practice mode is unlimited and never counts.",
    },
    {
      q: "How do I delete my account?",
      a: "Open your profile and use Delete my account. Deletion is immediate and permanent and removes all your data.",
    },
    {
      q: "How do I turn off notifications?",
      a: "Turn them off in your device settings, under Countrivo, then Notifications. We only send a daily reminder.",
    },
    {
      q: "How do I report a player?",
      a: "Email us the username and what happened. We review every report, rename or remove abusive accounts, and you can remove anyone from your friends list at any time.",
    },
    {
      q: "I lost my streak, or a score did not save",
      a: "Scores save when you finish a run. If something looks wrong, email us with the date and the game and we will look it up.",
    },
  ],
} as const;

export const SUPPORT_EMAIL = "countrivo@gmail.com";
