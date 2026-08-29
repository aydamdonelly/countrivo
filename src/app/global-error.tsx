"use client";

import { useEffect } from "react";

/*
 * The root error boundary (blueprint 7.18): it replaces the root layout itself, so it renders
 * its own html and body without the stylesheet. The four token values are mirrored inline
 * (paper, ink, mute, ember); this file is one of the three hex exemptions of section 1.
 */
const PAPER = "#fbfaf6";
const INK = "#17181a";
const MUTE = "#74756f";
const EMBER = "#b8432a";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Root error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: PAPER,
          color: INK,
          fontFamily: 'system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif',
          WebkitFontSmoothing: "antialiased",
          padding: "64px 20px",
        }}
      >
        <div style={{ maxWidth: 440, margin: "0 auto" }}>
          <p style={{ fontSize: 22, fontWeight: 600, lineHeight: 1, margin: 0, fontFamily: "Erode, Georgia, serif" }}>Countrivo</p>
          <h1 style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.1, margin: "40px 0 0", fontFamily: "Erode, Georgia, serif" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 13, lineHeight: 1.45, color: MUTE, margin: "12px 0 0" }}>
            Something broke at the app level. Try again, or head home.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 24, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                background: INK,
                color: PAPER,
                border: 0,
                borderRadius: 6,
                padding: "11px 16px",
                fontSize: 15,
                fontWeight: 600,
                lineHeight: 1,
                minHeight: 44,
                cursor: "pointer",
                font: "inherit",
              }}
            >
              Try again
            </button>
            {/* A plain anchor on purpose: after a root crash a full reload is the safe way home. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                color: EMBER,
                fontSize: 15,
                fontWeight: 600,
                lineHeight: 1,
                minHeight: 44,
                display: "inline-flex",
                alignItems: "center",
                textDecoration: "none",
              }}
            >
              Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
