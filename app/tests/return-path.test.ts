import { describe, expect, it } from "vitest";
import { safeAtlasReturn } from "@/lib/atlas/return-path";

describe("atlas return paths", () => {
  it("keeps map context on the local route", () => {
    expect(safeAtlasReturn("/map?focus=testing")).toBe("/map?focus=testing");
    expect(safeAtlasReturn("/\\\\evil.example")).toBe("/map");
    expect(safeAtlasReturn("//evil.example")).toBe("/map");
    expect(safeAtlasReturn("/\u0000evil.example")).toBe("/map");
  });
});
