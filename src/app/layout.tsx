import type { Metadata } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { TopoBg } from "@/components/layout/topo-bg";
import Link from "next/link";
import { ADSENSE_CLIENT } from "@/lib/ads/config";
import { GoogleAdSenseScript } from "@/components/ads/google-adsense-script";

const serif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://countrivo.com"),
  title: {
    default: "Countrivo — Free Geography Games, Country Quizzes & Daily Challenges",
    template: "%s | Countrivo",
  },
  description:
    "Play 14 free geography games online. Daily challenges, flag quizzes, country rankings, capitals matching, and stat puzzles. 243 countries. No signup needed.",
  keywords: [
    "geography games", "country quiz", "flag quiz", "world quiz",
    "geography trivia", "country ranking game", "daily geography challenge",
    "capitals quiz", "population quiz", "free geography games online",
    "flag quiz online", "world capitals quiz", "geography quiz game",
    "guess the flag", "country flag quiz game",
  ],
  alternates: { canonical: "https://countrivo.com" },
  openGraph: {
    type: "website",
    siteName: "Countrivo",
    title: "Countrivo — Free Geography Games & Daily Challenges",
    description:
      "14 free geography games. Daily challenges, flag quizzes, country stats, and strategy puzzles. 243 countries. No signup.",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large" as const,
    "max-snippet": -1,
  },
  verification: {
    google: "PpK1QzA2nH6mTqcSPf_TcNsD7DCPXL6dcW1SEAoG9po",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable} font-sans`}
    >
      <head>
        <meta name="google-adsense-account" content={ADSENSE_CLIENT} />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </head>
      <body className="min-h-full flex flex-col bg-surface text-cream font-sans">
        <GoogleAdSenseScript />
        {/* Structured data for the website */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  name: "Countrivo",
                  url: "https://countrivo.com",
                  description:
                    "Free geography games online. Daily challenges, flag quizzes, country rankings, and strategy puzzles.",
                  potentialAction: {
                    "@type": "SearchAction",
                    target: "https://countrivo.com/countries?q={search_term_string}",
                    "query-input": "required name=search_term_string",
                  },
                },
                {
                  "@type": "Organization",
                  name: "Countrivo",
                  url: "https://countrivo.com",
                  logo: "https://countrivo.com/favicon.svg",
                  description:
                    "Free online geography games and quizzes to learn world capitals, flags, countries and statistics.",
                },
              ],
            }),
          }}
        />
        <TopoBg />
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border bg-bg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              <div>
                <h4 className="font-bold text-sm mb-3">Games</h4>
                <div className="space-y-2 text-sm text-cream-muted">
                  <Link href="/games/country-draft" className="block hover:text-cream transition-colors">Country Draft</Link>
                  <Link href="/games/flag-quiz" className="block hover:text-cream transition-colors">Flag Quiz</Link>
                  <Link href="/games/higher-or-lower" className="block hover:text-cream transition-colors">Higher or Lower</Link>
                  <Link href="/games/capital-match" className="block hover:text-cream transition-colors">Capital Match</Link>
                  <Link href="/games" className="block hover:text-cream transition-colors text-gold font-medium">All Games →</Link>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-sm mb-3">Explore</h4>
                <div className="space-y-2 text-sm text-cream-muted">
                  <Link href="/countries" className="block hover:text-cream transition-colors">All Countries</Link>
                  <Link href="/categories" className="block hover:text-cream transition-colors">Stat Rankings</Link>
                  <Link href="/lists/most-populated-countries" className="block hover:text-cream transition-colors">Most Populated</Link>
                  <Link href="/lists/largest-countries" className="block hover:text-cream transition-colors">Largest Countries</Link>
                  <Link href="/lists/richest-countries" className="block hover:text-cream transition-colors">Richest Countries</Link>
                  <Link href="/lists" className="block hover:text-cream transition-colors text-gold font-medium">All Lists →</Link>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-sm mb-3">Popular</h4>
                <div className="space-y-2 text-sm text-cream-muted">
                  <Link href="/countries/united-states" className="block hover:text-cream transition-colors">🇺🇸 United States</Link>
                  <Link href="/countries/germany" className="block hover:text-cream transition-colors">🇩🇪 Germany</Link>
                  <Link href="/countries/japan" className="block hover:text-cream transition-colors">🇯🇵 Japan</Link>
                  <Link href="/countries/brazil" className="block hover:text-cream transition-colors">🇧🇷 Brazil</Link>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-sm mb-3">Countrivo</h4>
                <div className="space-y-2 text-sm text-cream-muted">
                  <p>Free geography games. 243 countries. Daily challenges.</p>
                  <Link
                    href="/privacy"
                    className="block hover:text-cream transition-colors"
                  >
                    Privacy Policy
                  </Link>
                  <p className="text-xs mt-4">Data: World Bank, REST Countries, WHO, UNWTO</p>
                </div>
              </div>
            </div>
          </div>
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
