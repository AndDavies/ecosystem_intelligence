import { timingSafeEqual } from "node:crypto";
import { observeNewsletter } from "@/lib/email/observe-newsletter";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (!secret || received.length !== expected.length || !timingSafeEqual(received, expected)) return Response.json({error: "Unauthorized"}, {status: 401, headers: {"Cache-Control": "private, no-store"}});
  try {
    const summary = await observeNewsletter();
    return Response.json(summary, {status: summary.status === "available" ? 200 : 503, headers: {"Cache-Control": "private, no-store"}});
  } catch { return Response.json({error: "Newsletter observation failed"}, {status: 503, headers: {"Cache-Control": "private, no-store"}}); }
}
