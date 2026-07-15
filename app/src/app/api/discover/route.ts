import { NextResponse } from "next/server";
import { z } from "zod";
import { discoverAtlas } from "@/lib/atlas/repository";

const requestSchema = z.object({
  query: z.string().trim().min(1).max(500)
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Enter an English discovery question between 1 and 500 characters."
      },
      { status: 400 }
    );
  }

  return NextResponse.json(await discoverAtlas(parsed.data.query), {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
