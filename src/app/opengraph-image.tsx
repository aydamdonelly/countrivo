import { ImageResponse } from "next/og";

export const alt = "Countrivo · One puzzle a day";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  const today = new Date();
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = today.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fafaf8",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontSize: 168,
            fontWeight: 800,
            color: "#1a1a1a",
            letterSpacing: "-0.045em",
            lineHeight: 1,
          }}
        >
          <span>Coun</span>
          <span style={{ color: "#b8860b", margin: "0 6px" }}>·</span>
          <span>trivo</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginTop: 36,
            fontSize: 34,
            color: "#555",
            fontFamily: "monospace",
            letterSpacing: "0.02em",
          }}
        >
          <span>{dayName}</span>
          <span style={{ color: "#b8860b" }}>·</span>
          <span>{monthDay}</span>
          <span style={{ color: "#b8860b" }}>·</span>
          <span>One puzzle a day</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginTop: 28,
            fontSize: 22,
            color: "#999",
            fontFamily: "monospace",
          }}
        >
          <span>14 games</span>
          <span style={{ color: "#b8860b" }}>·</span>
          <span>243 countries</span>
          <span style={{ color: "#b8860b" }}>·</span>
          <span>countrivo.com</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
