import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: "#fafaf8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#b8860b",
          fontSize: 140,
          fontWeight: 900,
          fontFamily: "Inter, system-ui, sans-serif",
          lineHeight: 1,
          letterSpacing: "-0.05em",
        }}
      >
        C
      </div>
    ),
    { ...size }
  );
}
