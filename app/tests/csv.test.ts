import { describe, expect, it } from "vitest";
import { atlasResultsCapabilityExportScope, buildCsv, escapeCsvValue, organizationLevelProgramExportNote } from "@/lib/export/csv";

describe("csv export", () => {
  it("escapes commas, quotes, and multiline text", () => {
    const csv = buildCsv(
      ["name", "notes"],
      [["Arctic, Sensor", 'Uses "quoted" rationale\nwith newline']]
    );

    expect(csv).toBe(
      'name,notes\n"Arctic, Sensor","Uses ""quoted"" rationale\nwith newline"'
    );
  });

  it("leaves simple values untouched", () => {
    expect(escapeCsvValue("plain text")).toBe("plain text");
    expect(escapeCsvValue(42)).toBe("42");
    expect(escapeCsvValue(-42)).toBe("-42");
    expect(escapeCsvValue(null)).toBe("");
    expect(escapeCsvValue("  ordinary text")).toBe("  ordinary text");
  });

  it.each(["=1+1", "+1", "-1", "@SUM(A1)", "  =1+1", "\t=1+1", "\r=1+1", "\n=1+1", "\u0000=1+1", "\ufeff=1+1"])("keeps formula-leading strings inert: %j", (value) => {
    const encoded = escapeCsvValue(value);
    expect(encoded.startsWith("'") || encoded.startsWith("\"'")).toBe(true);
  });

  it("preserves always-quoted subscriber exports and delimiter escaping", () => {
    expect(escapeCsvValue("person@example.com", { alwaysQuote: true })).toBe('"person@example.com"');
    expect(escapeCsvValue('=HYPERLINK("https://example.com","link")', { alwaysQuote: true })).toBe('"\'=HYPERLINK(""https://example.com"",""link"")"');
  });

  it("keeps program-filtered exports at the organization participation level", () => {
    expect(atlasResultsCapabilityExportScope({ program: "reviewed-program" })).toEqual({
      includeCapabilities: false,
      note: organizationLevelProgramExportNote
    });
    expect(atlasResultsCapabilityExportScope({ mission: "underwater-isr" })).toEqual({
      includeCapabilities: true,
      note: ""
    });
  });
});
