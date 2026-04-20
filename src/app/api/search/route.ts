import { NextResponse } from "next/server";
import { searchRecords } from "@/lib/data/repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const results = await searchRecords(query);

  return NextResponse.json({
    useCases: results.useCases.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug
    })),
    capabilities: results.capabilities.map((item) => ({
      id: item.id,
      name: item.name
    })),
    companies: results.companies.map((item) => ({
      id: item.id,
      name: item.name
    }))
  });
}
