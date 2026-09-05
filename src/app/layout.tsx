import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { erode } from "./fonts";
import { getAllGames } from "@/lib/data/games";
import { AuthProvider } from "@/features/auth/auth-provider";
import { AuthSheetHost } from "@/features/auth/auth-sheet-host";
import { NativeBootstrap } from "@/features/auth/native-bootstrap";
import { ToastProvider } from "@/ui/toast";

/*
 * The root layout (blueprint 9.1 step 9): html, body, fonts, providers, metadata and the
 * site JSON-LD. Free of dynamic APIs, so the static route groups stay static; the chrome
 * (header, tab bar) and the viewer come from the route-group layouts.
 */

const GAME_COUNT = getAllGames().length;
const SITE = "https://countrivo.com";
/** --color-paper, written as rgb() so no hex literal lives outside tokens.css. */
const PAPER = "rgb(251, 250, 246)";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Countrivo | Free Geography Games, One Shot a Day",
    template: "%s | Countrivo",
  },
  description: `Play ${GAME_COUNT} free geography games online: GeoWordle, Country Draft, flag quizzes and country stats puzzles. Daily boards and unlimited practice. No signup.`,
  openGraph: {
    type: "website",
    siteName: "Countrivo",
    title: "Countrivo | Free Geography Games, One Shot a Day",
    description: `${GAME_COUNT} free geography games. One shot a day, flag quizzes, country stats and strategy puzzles. 243 countries. No signup.`,
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
    "max-image-preview": "large",
    "max-snippet": -1,
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  verification: {
    google: "PpK1QzA2nH6mTqcSPf_TcNsD7DCPXL6dcW1SEAoG9po",
  },
};

export const viewport: Viewport = {
  // One theme: one colour for the browser chrome, the same in every scheme.
  themeColor: PAPER,
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  // Draw under the notch and the home indicator so the safe-area insets can do their job.
  viewportFit: "cover",
};

const SITE_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "Countrivo",
      url: SITE,
      description: "Free geography games online. One shot a day, flag quizzes, country rankings, and strategy puzzles.",
    },
    {
      "@type": "Organization",
      name: "Countrivo",
      url: SITE,
      logo: `${SITE}/favicon.svg`,
      description: "Free online geography games and quizzes to learn flags, countries and statistics.",
    },
  ],
});

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={erode.variable}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: SITE_JSON_LD }} />
        <AuthProvider>
          <NativeBootstrap />
          <ToastProvider>
            <AuthSheetHost />
            <main>{children}</main>
            <Analytics />
            <SpeedInsights />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
