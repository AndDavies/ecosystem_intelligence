import { ImageResponse } from "next/og";
import { brandCopy } from "@/lib/brand-copy";

export const runtime = "edge";
export const alt = "True North Map: Canada is building more than most people can see";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f7f7f3", color: "#242827", padding: "64px 72px", fontFamily: "sans-serif", borderTop: "12px solid #f5e900" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}><img src="https://truenorthmap.ca/apple-icon.png" width="54" height="54" alt="" /><div style={{ display: "flex", fontSize: 20, fontWeight: 900, lineHeight: 1, letterSpacing: 1.1 }}>TRUE NORTH MAP</div></div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 1020 }}><div style={{ display: "flex", color: "#126147", fontSize: 20, fontWeight: 800, letterSpacing: 1.2 }}>{brandCopy.categoryLabel}</div><div style={{ display: "flex", flexDirection: "column", marginTop: 18, fontSize: 58, lineHeight: 0.98, letterSpacing: -2.6, fontWeight: 900 }}><span style={{ display: "flex" }}>{brandCopy.headline}</span></div><div style={{ marginTop: 22, width: 120, height: 6, background: "#f5e900" }} /></div>
      <div style={{ display: "flex", justifyContent: "space-between", color: "#666965", fontSize: 18 }}><span>{brandCopy.promise}</span><span>{brandCopy.trustCompact}</span></div>
    </div>,
    size
  );
}
