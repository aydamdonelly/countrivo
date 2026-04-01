import type { Metadata } from "next";
import Link from "next/link";
import { getGameColor } from "@/lib/game-colors";

export const metadata: Metadata = {
  title: "Country Lists & Rankings | Countrivo",
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
        Country Lists & Rankings
      </h1>
      <div className="mt-6 max-w-3xl space-y-4 text-cream-muted leading-relaxed">
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

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {lists.map((list) => (
          <Link
            key={list.href}
            href={list.href}
            className="group bg-white border border-black/5 shadow-sm rounded-xl p-6 hover:border-black/10 hover:shadow transition-colors"
          >
            <span className="text-3xl block mb-3">{list.emoji}</span>
            <h2 className="text-lg font-bold group-hover:text-gold transition-colors">
              {list.title}
            </h2>
            <p className="text-sm text-cream-muted mt-2 leading-relaxed">
              {list.description}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-16 pt-8 border-t border-border">
        <h2 className="text-xl font-bold mb-4">Test Your Knowledge</h2>
        <p className="text-cream-muted mb-6">
          Think you know these rankings by heart? Put your geography skills to
          the test with our free games.
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { href: "/games/flag-quiz", name: "Flag Quiz" },
            { href: "/games/country-draft", name: "Country Draft" },
            { href: "/games/higher-or-lower", name: "Higher or Lower" },
          ].map((g) => {
            const slug = g.href.replace("/games/", "");
            const colors = getGameColor(slug);
            return (
              <Link
                key={g.href}
                href={g.href}
                className="px-4 py-2 font-semibold rounded-full text-sm transition-all hover:scale-105"
                style={{ backgroundColor: colors.bg, color: colors.text }}
              >
                {g.name}
              </Link>
            );
          })}
          <Link
            href="/games"
            className="px-4 py-2 bg-surface-elevated font-semibold rounded-full text-sm hover:opacity-80 transition-opacity"
          >
            All Games →
          </Link>
        </div>
      </div>
    </div>
  );
}
