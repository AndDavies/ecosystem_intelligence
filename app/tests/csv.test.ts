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
