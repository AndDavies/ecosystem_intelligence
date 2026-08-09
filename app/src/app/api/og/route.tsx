import { ImageResponse } from "next/og";

export const runtime = "edge";

function clean(value: string | null, fallback: string, max: number) {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return (normalized || fallback).slice(0, max);
}

function trustedOrganizationLogo(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && url.hostname === "facoactpdckkhciamflk.supabase.co"
      && url.pathname.startsWith("/storage/v1/object/public/atlas-public-media/")
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const title = clean(url.searchParams.get("title"), "Canada is building more than most people can see.", 120);
  const eyebrow = clean(url.searchParams.get("eyebrow"), "True North Map", 60);
  const detail = clean(url.searchParams.get("detail"), "Follow the evidence. Find the fit. Start the right conversation.", 140);
  const location = clean(url.searchParams.get("location"), "Canada", 100);
  const logo = trustedOrganizationLogo(url.searchParams.get("logo"));

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden", background: "#f7f7f3", color: "#242827", padding: "58px 68px", fontFamily: "Arial, sans-serif", borderTop: "12px solid #f5e900" }}>
      <div style={{ position: "absolute", right: 0, top: 0, width: 20, height: "100%", background: "#242827", display: "flex" }} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse requires a directly renderable image element. */}
          <img src={`${url.origin}/apple-icon.png`} width="52" height="52" alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em" }}>TRUE NORTH MAP</span>
            <span style={{ marginTop: 4, fontSize: 12, fontWeight: 700, letterSpacing: "0.13em", color: "#666965" }}>EVIDENCE-LED ECOSYSTEM DISCOVERY</span>
          </div>
          {logo ? <div style={{ marginLeft: "auto", width: 178, height: 82, borderRadius: 14, background: "white", border: "1px solid #d7d9d6", display: "flex", alignItems: "center", justifyContent: "center", padding: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse requires a directly renderable image element. */}
            <img src={logo} width="148" height="54" alt="" style={{ objectFit: "contain" }} />
          </div> : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 970 }}>
          <span style={{ display: "flex", alignSelf: "flex-start", padding: "8px 14px", borderRadius: 999, background: "#f5e900", fontSize: 14, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>{eyebrow}</span>
          <div style={{ display: "flex", marginTop: 24, fontSize: title.length > 72 ? 51 : 60, lineHeight: 1.02, letterSpacing: "-0.045em", fontWeight: 900 }}>{title}</div>
          <div style={{ display: "flex", marginTop: 22, maxWidth: 850, fontSize: 22, lineHeight: 1.35, color: "#666965" }}>{detail}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 15, fontWeight: 700, color: "#666965" }}>
          <span>Reviewed public evidence · {location} · Human review</span>
          <span style={{ color: "#126147" }}>truenorthmap.ca</span>
        </div>
      </div>
    </div>,
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" } }
  );
}
