import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "Country Lists & Rankings",
  alternates: { canonical: "https://countrivo.com/lists" },
  description:
    "Explore curated country lists and rankings: largest countries, most populated nations, richest economies, and countries by continent.",
};

const lists = [
  {
    href: "/lists/largest-countries",
    title: "Largest Countries by Area",
    description: "The 50 biggest countries in the world ranked by total land and water area in square kilometers.",
    emoji: "🗺️",
  },
  {
    href: "/lists/most-populated-countries",
    title: "Most Populated Countries",
    description: "The 50 most populated countries in the world ranked by total population.",
    emoji: "👥",
  },
  {
    href: "/lists/richest-countries",
    title: "Richest Countries by GDP per Capita",
    description: "The 50 wealthiest countries ranked by GDP per capita in current US dollars.",
    emoji: "💰",
  },
  {
    href: "/lists/countries-in-europe",
    title: "Countries in Europe",
    description: "Complete list of all European countries with capitals, population, and area.",
    emoji: "🇪🇺",
  },
  {
    href: "/lists/countries-in-asia",
    title: "Countries in Asia",
    description: "Complete list of all Asian countries with capitals, population, and area.",
    emoji: "🌏",
  },
  {
    href: "/lists/countries-in-africa",
    title: "Countries in Africa",
    description: "Complete list of all African countries with capitals, population, and area.",
    emoji: "🌍",
  },
  {
    href: "/lists/countries-in-americas",
    title: "Countries in the Americas",
    description: "Complete list of all countries in North and South America with capitals, population, and area.",
    emoji: "🌎",
  },
  {
    href: "/lists/most-visited-countries",
    title: "Most Visited Countries",
    description: "The 50 most visited countries ranked by international tourist arrivals per year.",
    emoji: "✈️",
  },
  {
    href: "/lists/highest-life-expectancy",
    title: "Highest Life Expectancy",
    description: "Countries with the longest average lifespan ranked by life expectancy in years.",
    emoji: "❤️",
  },
  {
    href: "/lists/highest-gdp-countries",
    title: "Largest Economies by GDP",
    description: "The 50 largest economies in the world ranked by total GDP in US dollars.",
    emoji: "💵",
  },
  {
    href: "/lists/most-forested-countries",
    title: "Most Forested Countries",
    description: "Countries with the highest percentage of forest coverage.",
    emoji: "🌲",
  },
  {
    href: "/lists/most-connected-countries",
    title: "Most Connected Countries",
    description: "Countries ranked by percentage of population using the internet.",
    emoji: "🌐",
  },
  {
    href: "/lists/highest-fertility-rate",
    title: "Highest Fertility Rate",
    description: "Countries ranked by fertility rate (births per woman).",
    emoji: "👶",
  },
  {
    href: "/lists/biggest-military-spenders",
    title: "Biggest Military Spenders",
    description: "Countries ranked by military spending as percentage of GDP.",
    emoji: "🎖️",
  },
  {
    href: "/lists/greenest-countries",
    title: "Greenest Countries",
    description: "Countries ranked by share of energy from renewable sources.",
    emoji: "♻️",
  },
];

export default function ListsIndexPage() {
  return (
    <div className="max-w-md sm:max-w-lg lg:max-w-2xl mx-auto px-5 sm:px-6 pt-3 pb-12">
      <h1 className="font-display font-semibold text-[30px] leading-tight mt-2">
        Country lists
      </h1>
      <div className="mt-2 max-w-3xl space-y-3 text-[14px] text-cream-muted leading-relaxed">
        <p>
          Browse curated lists of countries organized by size, population, wealth,
          and geography. Each list includes up-to-date statistics sourced from the
          World Bank, the United Nations, and other authoritative datasets covering
          all 243 recognized countries and territories.
        </p>
        <p>
          Whether you are researching for school, settling a debate, or just
          curious about the world, these rankings give you a clear, sortable view
          of how countries compare on the metrics that matter most.
        </p>
      </div>

      <div className="mt-6">
        {lists.map((list) => (
          <Link
            key={list.href}
            href={list.href}
            className="flex items-center gap-3 py-3.5 border-t border-border -mx-2 px-2 rounded-md hover:bg-surface-elevated transition-colors"
          >
            <span className="flex-1 min-w-0">
              <h2 className="text-base leading-tight font-normal">{list.title}</h2>
              <p className="text-xs text-cream-muted mt-0.5 truncate">{list.description}</p>
            </span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cream-dim shrink-0" aria-hidden><path d="M9 6l6 6-6 6" /></svg>
          </Link>
        ))}
      </div>

      <div className="mt-10 pt-6 border-t border-border">
        <h2 className="font-display font-semibold text-xl mb-3">Test your knowledge</h2>
        <p className="text-cream-muted mb-6">
          Think you know these rankings by heart? Put your geography skills to
          the test with our free games.
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { href: "/games/flag-quiz", name: "Flag Quiz" },
            { href: "/games/country-draft", name: "Country Draft" },
            { href: "/games/higher-or-lower", name: "Higher or Lower" },
          ].map((g) => (
            <Link
              key={g.href}
              href={g.href}
              className="px-4 py-2 bg-surface-elevated border border-border font-semibold rounded-full text-sm transition-colors [@media(hover:hover)]:hover:border-border-hover"
            >
              {g.name}
            </Link>
          ))}
          <Link
            href="/games"
            className="px-4 py-2 bg-surface-elevated font-semibold rounded-full text-sm border border-border [@media(hover:hover)]:hover:border-border-hover transition-colors"
          >
            All Games →
          </Link>
        </div>
      </div>
    </div>
  );
}
