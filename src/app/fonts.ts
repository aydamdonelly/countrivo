import localFont from "next/font/local";

/**
 * Erode, the only display face (blueprint section 2). Self-hosted from src/fonts,
 * exposed as --font-erode for the tokens' --font-display. The root layout puts
 * `erode.variable` on <html>. Erode 500 is loaded for the OG fallback only; drop it
 * from this list if the build shows it unused.
 */
export const erode = localFont({
  src: [
    { path: "../fonts/erode-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/erode-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-erode",
  display: "block",
  preload: true,
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
});
