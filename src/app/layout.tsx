import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { TopoBg } from "@/components/layout/topo-bg";
import { AuthProvider } from "@/components/auth/auth-provider";
import { AuthModal } from "@/components/auth/auth-modal";
import Link from "next/link";
import { ADSENSE_CLIENT } from "@/lib/ads/config";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://countrivo.com"),
  title: {
    default: "Countrivo | Free Geography Games, Quizzes & Daily Challenges",
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
    title: "Countrivo | Free Geography Games & Daily Challenges",
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
      className={`${sans.variable} font-sans`}
    >
      <head>
        <meta name="google-adsense-account" content={ADSENSE_CLIENT} />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <link rel="preconnect" href="https://fundingchoicesmessages.google.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="anonymous" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8870420849024785"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-cream font-sans">
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
        <AuthProvider>
        <TopoBg />
        <Header />
        <AuthModal />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border bg-surface-elevated">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* CTA row — pull back into the loop */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-8 border-b border-border">
              <div>
                <p className="font-extrabold text-lg">Ready for today&apos;s challenge?</p>
                <p className="text-sm text-cream-muted">Same puzzle. Every player. One shot.</p>
              </div>
              <Link
                href="/games/country-draft/play?mode=daily"
                className="cta-primary text-sm px-6 py-2.5 min-h-11 shrink-0"
              >
                Play now
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              <div>
                <h3 className="font-bold text-sm mb-3">Games</h3>
                <div className="space-y-2 text-sm text-cream-muted">
                  <Link href="/games/country-draft" className="block hover:text-cream transition-colors">Country Draft</Link>
                  <Link href="/games/flag-quiz" className="block hover:text-cream transition-colors">Flag Quiz</Link>
                  <Link href="/games/higher-or-lower" className="block hover:text-cream transition-colors">Higher or Lower</Link>
                  <Link href="/games/capital-match" className="block hover:text-cream transition-colors">Capital Match</Link>
                  <Link href="/games" className="block hover:text-cream transition-colors text-gold font-medium">All 14 games →</Link>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-sm mb-3">Rankings</h3>
                <div className="space-y-2 text-sm text-cream-muted">
                  <Link href="/categories" className="block hover:text-cream transition-colors">All Rankings</Link>
                  <Link href="/lists/most-populated-countries" className="block hover:text-cream transition-colors">Most Populated</Link>
                  <Link href="/lists/largest-countries" className="block hover:text-cream transition-colors">Largest Countries</Link>
                  <Link href="/lists/richest-countries" className="block hover:text-cream transition-colors">Richest (GDP/capita)</Link>
                  <Link href="/lists" className="block hover:text-cream transition-colors text-gold font-medium">All lists →</Link>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-sm mb-3">Countries</h3>
                <div className="space-y-2 text-sm text-cream-muted">
                  <Link href="/countries" className="block hover:text-cream transition-colors">All 243 countries</Link>
                  <Link href="/countries/united-states" className="block hover:text-cream transition-colors">🇺🇸 United States</Link>
                  <Link href="/countries/germany" className="block hover:text-cream transition-colors">🇩🇪 Germany</Link>
                  <Link href="/countries/japan" className="block hover:text-cream transition-colors">🇯🇵 Japan</Link>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-sm mb-3">Countrivo</h3>
                <div className="space-y-2 text-sm text-cream-muted">
                  <p className="text-xs">Competitive daily geography games with stats depth. 14 games, 243 countries.</p>
                  <Link href="/privacy" className="block hover:text-cream transition-colors">Privacy</Link>
                  <p className="text-[10px] text-cream-muted mt-3">Data: World Bank, REST Countries, WHO, UNWTO</p>
                </div>
              </div>
            </div>
          </div>
        </footer>
        <Analytics />
        <SpeedInsights />
        </AuthProvider>
      </body>
    </html>
  );
}
