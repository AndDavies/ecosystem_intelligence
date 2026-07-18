import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Ecosystem Intelligence Canadian Public Beta";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f5f3ed", color: "#1e2320", padding: "72px", fontFamily: "sans-serif", borderTop: "14px solid #d65f4c" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1 }}>Ecosystem Intelligence</div><div style={{ border: "1px solid #b8cfbd", borderRadius: 999, background: "#dde8de", color: "#1f5a43", padding: "10px 18px", fontSize: 18, fontWeight: 700 }}>Canadian Public Beta</div></div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 1020 }}><div style={{ color: "#1f5a43", fontSize: 22, fontWeight: 700 }}>Canada’s public capability atlas</div><div style={{ marginTop: 18, fontSize: 58, lineHeight: 1.05, letterSpacing: -2.4, fontWeight: 800 }}>Make Canadian defence and dual-use capability easier to discover and connect.</div></div>
      <div style={{ display: "flex", justifyContent: "space-between", color: "#626964", fontSize: 20 }}><span>Independent project by Andrew Davies</span><span>Evidence-backed · Canada-wide · Free to explore</span></div>
    </div>,
    size
  );
}
