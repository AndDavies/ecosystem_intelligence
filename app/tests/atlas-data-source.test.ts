import { describe, expect, it } from "vitest";
import { resolveAtlasDataSource } from "@/lib/atlas/data-source";

describe("public atlas data-source selection", () => {
  it("accepts only the two intentional runtime modes", () => {
    expect(resolveAtlasDataSource("supabase")).toBe("supabase");
    expect(resolveAtlasDataSource(" VALIDATED_SEED ")).toBe("validated_seed");
    expect(resolveAtlasDataSource(undefined)).toBe("validated_seed");
  });

  it("fails closed instead of silently showing bundled data for malformed production input", () => {
    expect(() => resolveAtlasDataSource("supabase\\n")).toThrow("Unsupported atlas data source");
    expect(() => resolveAtlasDataSource("production")).toThrow("Unsupported atlas data source");
  });
});
