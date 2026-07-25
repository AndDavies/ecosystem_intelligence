import { ImageResponse } from "next/og";

export const runtime = "edge";

function clean(value: string | null, fallback: string, max: number) {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return (normalized || fallback).slice(0, max);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const title = clean(url.searchParams.get("title"), "Canada is building more than most people can see.", 120);
  const eyebrow = clean(url.searchParams.get("eyebrow"), "True North Map", 60);
  const detail = clean(url.searchParams.get("detail"), "Follow the evidence. Find the fit. Start the right conversation.", 140);

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden", background: "#f4f3ef", color: "#232725", padding: "64px 72px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", opacity: 0.5, backgroundImage: "radial-gradient(circle at 78% 38%, rgba(245,233,0,.55), transparent 31%), linear-gradient(135deg, transparent 55%, rgba(31,90,67,.10) 55%, rgba(31,90,67,.10) 56%, transparent 56%)" }} />
      <div style={{ position: "absolute", right: 58, top: 52, width: 238, height: 238, border: "1px solid rgba(31,90,67,.18)", borderRadius: 999, display: "flex" }} />
      <div style={{ position: "absolute", right: 98, top: 92, width: 158, height: 158, border: "1px solid rgba(31,90,67,.22)", borderRadius: 999, display: "flex" }} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 50, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 15, background: "#232725", color: "#f5e900", fontSize: 25, fontWeight: 900 }}>✦</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em" }}>TRUE NORTH MAP</span>
            <span style={{ marginTop: 4, fontSize: 12, fontWeight: 700, letterSpacing: "0.13em", color: "#52605a" }}>CANADIAN DEFENCE, CLEARLY MAPPED</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 970 }}>
          <span style={{ display: "flex", alignSelf: "flex-start", padding: "8px 14px", borderRadius: 999, background: "#f5e900", fontSize: 14, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>{eyebrow}</span>
          <div style={{ display: "flex", marginTop: 24, fontSize: title.length > 72 ? 51 : 60, lineHeight: 1.02, letterSpacing: "-0.045em", fontWeight: 900 }}>{title}</div>
          <div style={{ display: "flex", marginTop: 22, maxWidth: 850, fontSize: 22, lineHeight: 1.35, color: "#52605a" }}>{detail}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 15, fontWeight: 700, color: "#52605a" }}>
          <span>Reviewed public sources · transparent gaps · human review</span>
          <span style={{ color: "#1f5a43" }}>truenorthmap.ca</span>
        </div>
      </div>
    </div>,
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" } }
  );
}
