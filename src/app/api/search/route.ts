import { NextResponse } from "next/server";
import { searchRecords } from "@/lib/data/repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const results = await searchRecords(query);

  return NextResponse.json(results);
}
