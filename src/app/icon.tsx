import { ImageResponse } from "next/og";
import { erodeFontData } from "@/lib/seo/erode-font";
import { INK, PAPER } from "@/lib/seo/og-image";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * The tab mark: the wordmark's own first letter, Erode 600 in paper on an ink
 * tile. Ink because a paper tile disappears into a light browser chrome, and the
 * letterform because it is the one shape that belongs to this brand alone.
 * Colours come from the Satori palette mirror (blueprint section 1).
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: INK,
          borderRadius: 8,
          color: PAPER,
          fontFamily: "Erode",
        }}
      >
        {/* the glyph box sits low in its em box, so the bottom margin lifts it back
            onto the tile's true centre; measured, not eyeballed */}
        <div style={{ display: "flex", fontSize: 30, lineHeight: 1, marginBottom: 5 }}>C</div>
      </div>
    ),
    { ...size, fonts: [{ name: "Erode", data: erodeFontData(), weight: 600, style: "normal" }] }
  );
}
