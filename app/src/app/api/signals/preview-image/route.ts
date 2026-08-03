import { NextResponse } from "next/server";
import { loadLocalSignalPacket } from "@/lib/signals/local-preview";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV !== "development") return new NextResponse(null, { status: 404 });
  const packet = await loadLocalSignalPacket();
  if (!packet?.heroImage) return new NextResponse(null, { status: 404 });

  try {
    const response = await fetch(packet.heroImage.imageUrl, {
      headers: { "User-Agent": "True North Map Signals local preview (+https://truenorthmap.ca/signals)" },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store"
    });
    if (!response.ok) return new NextResponse(null, { status: 502 });
    const contentType = response.headers.get("content-type")?.split(";")[0]?.trim();
    if (!contentType || !["image/jpeg", "image/png", "image/webp"].includes(contentType)) return new NextResponse(null, { status: 415 });
    const body = await response.arrayBuffer();
    if (body.byteLength > 10_485_760) return new NextResponse(null, { status: 413 });
    return new NextResponse(body, { status: 200, headers: { "Content-Type": contentType, "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
