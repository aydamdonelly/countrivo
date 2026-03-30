import { ImageResponse } from "next/og";

export const alt = "Countrivo — Free Geography Games";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #1c1917 0%, #0c0a09 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 30 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 48, fontWeight: 900, color: "white" }}>C</span>
          </div>
          <span style={{ fontSize: 64, fontWeight: 900, color: "white" }}>
            Countr<span style={{ color: "#f59e0b" }}>ivo</span>
          </span>
        </div>
        <p style={{ fontSize: 32, color: "rgba(255,255,255,0.7)", marginTop: 0 }}>
          Free Geography Games & Daily Challenges
        </p>
        <div
          style={{
            display: "flex",
            gap: 40,
            marginTop: 40,
            color: "rgba(255,255,255,0.5)",
            fontSize: 24,
          }}
        >
          <span>11 Games</span>
          <span>243 Countries</span>
          <span>21 Stats</span>
          <span>Daily Challenges</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
