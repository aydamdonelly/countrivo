import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AuthProvider } from "@/components/auth/auth-provider";
import { AuthModal } from "@/components/auth/auth-modal";
import { ToastProvider } from "@/components/ui/toast";
import Script from "next/script";
import { ADSENSE_CLIENT } from "@/lib/ads/config";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
  adjustFontFallback: true,
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
  alternates: {
    canonical: "https://countrivo.com",
    languages: { "en": "https://countrivo.com", "x-default": "https://countrivo.com" },
  },
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
      </head>
      <body className="min-h-full flex flex-col bg-bg text-cream font-sans">
        <Script
          id="adsbygoogle-init"
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8870420849024785"
          crossOrigin="anonymous"
        />
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
        <ToastProvider>
        <Header />
        <AuthModal />
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />
        <SpeedInsights />
        </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
