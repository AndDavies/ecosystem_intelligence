import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Ecosystem Intelligence Canadian Public Beta";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#05052b", color: "white", padding: "72px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}><div style={{ width: 68, height: 68, borderRadius: 34, border: "2px solid #62d9e8", display: "flex", alignItems: "center", justifyContent: "center", color: "#62d9e8", fontSize: 34 }}>≈</div><div style={{ fontSize: 28, fontWeight: 700 }}>Ecosystem Intelligence</div></div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 980 }}><div style={{ color: "#62d9e8", fontSize: 22, letterSpacing: 4, textTransform: "uppercase", fontWeight: 700 }}>Canadian Public Beta</div><div style={{ marginTop: 18, fontSize: 58, lineHeight: 1.05, letterSpacing: -2, fontWeight: 800 }}>Make Canadian defence and dual-use capability easier to discover and connect.</div></div>
      <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.72)", fontSize: 20 }}><span>Independent project by Andrew Davies</span><span>Evidence-backed · Canada-wide · Free to explore</span></div>
    </div>,
    size
  );
}
