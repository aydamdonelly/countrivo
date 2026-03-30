import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://countrivo.com"),
  title: {
    default: "Countrivo — Free Geography Games, Country Quizzes & Daily Challenges",
    template: "%s | Countrivo",
  },
  description:
    "Play free geography games online. Daily challenges, flag quizzes, country rankings, capital matching, and strategy puzzles. Test your world knowledge with 11+ games covering 243 countries. No signup needed.",
  keywords: [
    "geography games", "country quiz", "flag quiz", "world quiz",
    "geography trivia", "country ranking game", "daily geography challenge",
    "capitals quiz", "population quiz", "free geography games online",
  ],
  openGraph: {
    type: "website",
    siteName: "Countrivo",
    title: "Countrivo — Free Geography Games & Daily Challenges",
    description:
      "11+ free geography games. Daily challenges, flag quizzes, country stats, and strategy puzzles. 243 countries. No signup.",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface text-text font-sans">
        {/* Structured data for the website */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Countrivo",
              url: "https://countrivo.com",
              description: "Free geography games online. Daily challenges, flag quizzes, country rankings, and strategy puzzles.",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://countrivo.com/countries?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border bg-surface-muted">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              <div>
                <h4 className="font-bold text-sm mb-3">Games</h4>
                <div className="space-y-2 text-sm text-text-muted">
                  <Link href="/games/country-draft" className="block hover:text-text transition-colors">Country Draft</Link>
                  <Link href="/games/flag-quiz" className="block hover:text-text transition-colors">Flag Quiz</Link>
                  <Link href="/games/higher-or-lower" className="block hover:text-text transition-colors">Higher or Lower</Link>
                  <Link href="/games/capital-match" className="block hover:text-text transition-colors">Capital Match</Link>
                  <Link href="/games" className="block hover:text-text transition-colors text-brand font-medium">All Games →</Link>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-sm mb-3">Explore</h4>
                <div className="space-y-2 text-sm text-text-muted">
                  <Link href="/countries" className="block hover:text-text transition-colors">All Countries</Link>
                  <Link href="/categories" className="block hover:text-text transition-colors">Stat Rankings</Link>
                  <Link href="/categories/population" className="block hover:text-text transition-colors">Population Ranking</Link>
                  <Link href="/categories/gdp-per-capita" className="block hover:text-text transition-colors">GDP per Capita</Link>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-sm mb-3">Popular</h4>
                <div className="space-y-2 text-sm text-text-muted">
                  <Link href="/countries/united-states" className="block hover:text-text transition-colors">🇺🇸 United States</Link>
                  <Link href="/countries/germany" className="block hover:text-text transition-colors">🇩🇪 Germany</Link>
                  <Link href="/countries/japan" className="block hover:text-text transition-colors">🇯🇵 Japan</Link>
                  <Link href="/countries/brazil" className="block hover:text-text transition-colors">🇧🇷 Brazil</Link>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-sm mb-3">Countrivo</h4>
                <div className="space-y-2 text-sm text-text-muted">
                  <p>Free geography games. 243 countries. Daily challenges.</p>
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
