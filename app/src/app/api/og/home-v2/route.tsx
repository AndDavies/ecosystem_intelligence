import { ImageResponse } from "next/og";
import { brandCopy, rootSocialCard } from "@/lib/brand-copy";
import { absoluteUrl } from "@/lib/site";

export const runtime = "edge";

export async function GET() {
  const barlowExtraBold = await fetch(
    "https://fonts.gstatic.com/s/barlow/v13/7cHqv4kjgoGqM7E3q-0c4A.ttf",
    { cache: "force-cache" }
  ).then((response) => {
    if (!response.ok) throw new Error("Unable to load the approved social-card typeface.");
    return response.arrayBuffer();
  });

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#242827",
        color: "#ffffff",
        padding: "62px 72px 66px",
        borderTop: "14px solid #f5e900",
        fontFamily: "Barlow"
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse requires a directly renderable image element. */}
          <img
            src={absoluteUrl("/brand/north-signal-mark-light.svg")}
            width="92"
            height="92"
            alt=""
          />
          <div style={{ display: "flex", fontSize: 42, fontWeight: 900, lineHeight: 1, letterSpacing: 1.4 }}>
            TRUE NORTH MAP
          </div>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 30,
            color: "#e8f1f4",
            fontSize: 32,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: 1.5
          }}
        >
          {brandCopy.categoryLabel}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 102,
          fontWeight: 800,
          lineHeight: 0.94,
          letterSpacing: -3.8
        }}
      >
        <div style={{ display: "flex" }}>Make Canadian</div>
        <div style={{ display: "flex" }}>
          capability&nbsp;<span style={{ color: "#f5e900" }}>visible.</span>
        </div>
      </div>
    </div>,
    {
      width: rootSocialCard.width,
      height: rootSocialCard.height,
      fonts: [{ name: "Barlow", data: barlowExtraBold, weight: 800, style: "normal" }],
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=31536000, immutable"
      }
    }
  );
}
