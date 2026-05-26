import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "transparent",
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#b8860b",
          fontSize: 26,
          fontWeight: 900,
          fontFamily: "Inter, system-ui, sans-serif",
          lineHeight: 1,
          letterSpacing: "-0.04em",
        }}
      >
        C
      </div>
    ),
    { ...size }
  );
}
