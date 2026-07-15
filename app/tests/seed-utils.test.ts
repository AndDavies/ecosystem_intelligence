import { describe, expect, it } from "vitest";
import { parseCsvContent } from "../scripts/seed-utils";

describe("seed csv parser", () => {
  it("parses quoted commas and escaped quotes", () => {
    const rows = parseCsvContent(
      'id,summary\nrow-1,"Uses ""quoted"" rationale, with commas"\n'
    );

    expect(rows).toEqual([
      ["id", "summary"],
      ["row-1", 'Uses "quoted" rationale, with commas']
    ]);
  });

  it("preserves multiline cells", () => {
    const rows = parseCsvContent('id,note\nrow-1,"line one\nline two"\n');

    expect(rows).toEqual([
      ["id", "note"],
      ["row-1", "line one\nline two"]
    ]);
  });
});
