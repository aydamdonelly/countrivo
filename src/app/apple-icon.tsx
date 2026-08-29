import { ImageResponse } from "next/og";
import { erodeFontData } from "@/lib/seo/erode-font";
import { INK, PAPER } from "@/lib/seo/og-image";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Home-screen icon: the same mark as the 32 px tab icon at 180, so the app on a
 * phone and the tab in a browser are visibly one thing. Full bleed and opaque on
 * purpose: iOS cuts its own squircle out of this square, and it composites any
 * transparency over black, so a rounded tile here would only add a sliver of the
 * wrong colour under the mask. The rounded version lives in the browser marks
 * (this route's 32 px sibling and public/favicon.svg).
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: INK,
          color: PAPER,
          fontFamily: "Erode",
        }}
      >
        {/* the glyph box sits low in its em box, so the bottom margin lifts it back
            onto the tile's true centre; measured, not eyeballed */}
        <div style={{ display: "flex", fontSize: 170, lineHeight: 1, marginBottom: 19, marginLeft: 4 }}>C</div>
      </div>
    ),
    { ...size, fonts: [{ name: "Erode", data: erodeFontData(), weight: 600, style: "normal" }] }
  );
}
