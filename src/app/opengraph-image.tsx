import { ImageResponse } from "next/og";
import { getAllCountries } from "@/lib/data/countries";
import { getAllGames } from "@/lib/data/registry";
import { erodeFontData } from "@/lib/seo/erode-font";
import { EMBER, INK, INK_MUTED, PAPER, ogContentType, ogSize } from "@/lib/seo/og-image";

export const alt = "Countrivo · Free geography games, one shot a day";
export const size = ogSize;
export const contentType = ogContentType;

/**
 * The brand card. It opens with the same paper ground, ember rule and
 * "Countrivo / countrivo.com" line as every game card in the family, then gives
 * the whole frame to the promise: the flame, then the two lines, all hung on one
 * left axis, the way the offline screen is built. The flame is the site's
 * signature (blueprint 0.9), so on the one card that stands for the whole site it
 * is an object, not a detail.
 *
 * Counts come from the data, never from a number typed into the copy (the
 * "17 games" drift was a real audit finding).
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
        {/* the one ember rule, along the top edge of every card in the family */}
        <div style={{ display: "flex", height: 6, width: "100%", background: EMBER }} />

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            padding: "40px 64px 0 64px",
          }}
        >
          <div style={{ display: "flex", fontSize: 40, lineHeight: 1, color: INK }}>Countrivo</div>
          <div style={{ display: "flex", fontSize: 26, lineHeight: 1, color: INK_MUTED }}>
            countrivo.com
          </div>
        </div>

        <div style={{ display: "flex", flex: 1 }} />

        <div style={{ display: "flex", flexDirection: "column", padding: "0 64px" }}>
          {/* the K3 flame (blueprint 4.4) at rest: three tongues, a paper core. The
              viewBox is cropped to the drawing, so the mark sits on the same left
              axis as the type instead of floating inside its own padding. */}
          <svg width={82} height={136} viewBox="6.4 2.5 10.2 17" style={{ marginBottom: 26 }}>
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
          <div style={{ display: "flex", fontSize: 92, lineHeight: 1.06, color: INK }}>
            Free geography games.
          </div>
          <div style={{ display: "flex", fontSize: 92, lineHeight: 1.06, color: INK }}>
            One shot a day.
          </div>
        </div>

        <div style={{ display: "flex", flex: 1 }} />

        <div
          style={{
            display: "flex",
            fontSize: 28,
            lineHeight: 1.2,
            color: INK_MUTED,
            padding: "0 64px 56px 64px",
          }}
        >
          {`${games} games · ${countries} countries · no account needed`}
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [{ name: "Erode", data: erodeFontData(), weight: 600, style: "normal" }],
    }
  );
}
