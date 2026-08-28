import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { FooterGate } from "@/components/layout/footer-gate";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { NativeBootstrap } from "@/components/native/native-bootstrap";
import { AuthProvider } from "@/components/auth/auth-provider";
import { AuthModal } from "@/components/auth/auth-modal";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
  adjustFontFallback: true,
});

// Display face for game titles, hero H1, big scores and verdicts. Only the
// weights we actually render — keeps the payload tiny.
const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display-src",
  display: "swap",
  weight: ["500", "600", "700"],
  preload: true,
  fallback: ["system-ui", "arial"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://countrivo.com"),
  title: {
    default: "Countrivo | Free Geography Games, Quizzes & Daily Challenges",
    template: "%s | Countrivo",
  },
  description:
    "Play 17 free geography games online. Daily challenges, flag quizzes, country rankings, capitals matching, and stat puzzles. 243 countries. No signup needed.",
  keywords: [
    "geography games", "country quiz", "flag quiz", "world quiz",
    "geography trivia", "country ranking game", "daily geography challenge",
    "capitals quiz", "population quiz", "free geography games online",
    "flag quiz online", "world capitals quiz", "geography quiz game",
    "guess the flag", "country flag quiz game",
  ],
  openGraph: {
    type: "website",
    siteName: "Countrivo",
    title: "Countrivo | Free Geography Games & Daily Challenges",
    description:
      "17 free geography games. Daily challenges, flag quizzes, country stats, and strategy puzzles. 243 countries. No signup.",
  },
  twitter: {
    card: "summary_large_image",
  },
  appleWebApp: {
    capable: true,
    title: "Countrivo",
    statusBarStyle: "default",
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

export const viewport: Viewport = {
  // Themed status-bar / browser-chrome color, per scheme. Matches --color-bg.
  // Themed status-bar / browser-chrome color, per scheme. Matches --color-bg.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#10141b" },
  ],
  width: "device-width",
  initialScale: 1,
  // Draw under the notch / home indicator so safe-area insets can do their job.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${display.variable} font-sans`}
    >
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        {/* apple-touch-icon is auto-generated as a 180×180 PNG from
            app/apple-icon.tsx — iOS Safari ignores SVG touch icons. */}
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
        <NativeBootstrap />
        <ToastProvider>
        <Header />
        <AuthModal />
        <main className="flex-1">{children}</main>
        <FooterGate><Footer /></FooterGate>
        <BottomTabBar />
        <Analytics />
        <SpeedInsights />
        </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
