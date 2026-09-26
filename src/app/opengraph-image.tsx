import { ImageResponse } from "next/og";

export const alt = "Injora — Full-Stack Developer · Open-Source Contributor";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "radial-gradient(ellipse at 70% 40%, #0d1a2e 0%, #030304 60%)",
          color: "#f2f3f6",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 6, color: "#8a8e98" }}>FULL-STACK DIVISION</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 200, fontWeight: 800, letterSpacing: -8, lineHeight: 1 }}>INJORA</div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 30, color: "#c9ccd3" }}>
            Full-Stack Developer <span style={{ color: "#4da3ff", margin: "0 18px" }}>/</span> Open-Source Contributor
          </div>
        </div>
        <div style={{ display: "flex", height: 3, width: 420, background: "linear-gradient(90deg, #4da3ff, transparent)" }} />
      </div>
    ),
    size
  );
}
