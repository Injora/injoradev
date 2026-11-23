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
          background: "linear-gradient(180deg, #03111f 0%, #0b3a4a 52%, #0b4f66 53%, #021420 100%)",
          color: "#e6f3f1",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, color: "#6ff0d8" }}>Full-stack developer and open-source contributor</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 200, fontWeight: 800, letterSpacing: -8, lineHeight: 1 }}>INJORA</div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 30, color: "#b4ccd3" }}>Merged work in cBioPortal and Sugar Labs</div>
        </div>
        <div style={{ display: "flex", height: 3, width: 420, background: "linear-gradient(90deg, #6ff0d8, transparent)" }} />
      </div>
    ),
    size
  );
}
