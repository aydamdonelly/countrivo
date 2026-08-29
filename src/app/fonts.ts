import localFont from "next/font/local";

/**
 * Erode, the only display face (blueprint section 2). Self-hosted from src/fonts,
 * exposed as --font-erode for the tokens' --font-display. The root layout puts
 * `erode.variable` on <html>. Only the 600 weight is loaded: every Erode class in
 * type.css is 600, and the OG routes embed their own copy (src/lib/seo/erode-font.ts).
 */
export const erode = localFont({
  src: [
    { path: "../fonts/erode-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-erode",
  display: "block",
  preload: true,
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
});
