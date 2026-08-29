import { ImageResponse } from "next/og";
import { getAllCountries } from "@/lib/data/countries";
import { getAllGames } from "@/lib/data/games";
import { erodeFontData } from "@/lib/seo/erode-font";
import { EMBER, INK, INK_MUTED, PAPER, ogContentType, ogSize } from "@/lib/seo/og-image";

export const alt = "Countrivo · Free geography games, one shot a day";
export const size = ogSize;
export const contentType = ogContentType;

/**
 * The brand card, and the site's own header at poster scale: the Erode wordmark
 * on paper with the flame burning beside it, the promise in the middle, the
 * counts along the bottom. It shares the 6 px ember rule with every game card in
 * the family. Counts come from the data, never from a number typed into the copy
 * (the "17 games" drift was a real audit finding).
 *
 * Hex literals are imported from src/lib/seo/og-image.tsx, the one file allowed to
 * mirror the tokens for Satori (blueprint section 1).
 */
export default function OGImage() {
  const games = getAllGames().length;
  const countries = getAllCountries().length;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: PAPER,
          fontFamily: "Erode",
          color: INK,
        }}
      >
        <div style={{ display: "flex", height: 6, width: "100%", background: EMBER }} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "58px 72px 56px 72px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", fontSize: 64, lineHeight: 1, color: INK }}>
              Countrivo
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ display: "flex", fontSize: 28, lineHeight: 1, color: INK_MUTED }}>
                resets at midnight Berlin
              </div>
              {/* the K3 flame (blueprint 4.4), frozen at rest: three tongues, a paper core */}
              <svg width={52} height={52} viewBox="0 0 24 24">
                <path
                  d="M12 2.5c.6 3.2 4.4 5 4.4 9.4 0 2.6-1.3 4.6-3.1 5.7-.3-1.4-1-2.4-2-3.1-.9.9-1.6 2-1.8 3.3C7.6 16.7 6.4 14.6 6.4 12c0-2 .8-3.4 1.9-4.5.3 1.3 1 2.1 2 2.4C9.6 7.4 10 4.6 12 2.5z"
                  fill={EMBER}
                />
                <path
                  d="M12 8.5c.5 2 2.6 3.1 2.6 5.6 0 1.6-.8 2.9-2 3.6-.2-.9-.6-1.6-1.2-2.1-.6.6-1 1.3-1.1 2.2-1.1-.7-1.9-2-1.9-3.5 0-1.3.5-2.2 1.2-2.9.2.8.6 1.3 1.2 1.5-.2-1.6.2-3.2 1.2-4.4z"
                  fill={EMBER}
                  opacity="0.55"
                />
                <path
                  d="M12 13.2c.4 1.2 1.5 1.9 1.5 3.3 0 1.1-.7 2-1.5 2.4-.8-.4-1.5-1.3-1.5-2.4 0-1.4 1.1-2.1 1.5-3.3z"
                  fill={PAPER}
                  opacity="0.9"
                />
              </svg>
            </div>
          </div>

          <div style={{ display: "flex", flex: 1 }} />

          <div style={{ display: "flex", flexDirection: "column", fontSize: 92, lineHeight: 1.1, color: INK }}>
            <div style={{ display: "flex" }}>Free geography games.</div>
            <div style={{ display: "flex" }}>One shot a day.</div>
          </div>

          <div style={{ display: "flex", flex: 1 }} />

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              fontSize: 28,
              lineHeight: 1.2,
              color: INK_MUTED,
            }}
          >
            <div style={{ display: "flex" }}>
              {`${games} games · ${countries} countries · no account needed`}
            </div>
            <div style={{ display: "flex" }}>countrivo.com</div>
          </div>
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [{ name: "Erode", data: erodeFontData(), weight: 600, style: "normal" }],
    }
  );
}
