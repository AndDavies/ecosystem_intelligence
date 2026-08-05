import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFile(path.resolve(file), "utf8");

describe("shared public language and trust foundation", () => {
  it("keeps the canonical evidence terms in one presentation dictionary", async () => {
    const [presentation, legend, answer] = await Promise.all([
      read("src/lib/atlas/presentation.ts"),
      read("src/components/atlas/evidence-legend.tsx"),
      read("src/components/atlas/assistant-answer.tsx")
    ]);

    expect(presentation).toContain('sourceFact: "Source-backed fact"');
    expect(presentation).toContain('assessment: "Our assessment"');
    expect(presentation).toContain('coverageGap: "What remains unknown"');
    expect(presentation).toContain('coverageGapInternal: "Coverage gap"');
    expect(presentation).toContain('evidenceStrength: "Evidence strength"');
    expect(presentation).toContain('lastReviewed: "Last reviewed"');
    expect(legend).toContain("publicLanguage.evidenceStrength");
    expect(legend).toContain("publicLanguage.lastReviewed");
    expect(answer).toContain("label: publicLanguage.coverageGap");
  });

  it("collapses route-level evidence guidance while retaining the complete reference", async () => {
    const legend = await read("src/components/atlas/evidence-legend.tsx");

    expect(legend).toContain('if (compact) return <EvidenceLegendDisclosure');
    expect(legend).toContain('mode="inline"');
    expect(legend).toContain("<details");
    expect(legend).toContain("How these records are assessed");
    expect(legend).toContain("Read the evidence before the conclusion.");
  });

  it("uses shared breadcrumbs instead of a generic public back link", async () => {
    const shell = await read("src/components/atlas/public-page-shell.tsx");

    expect(shell).toContain('variant === "public"');
    expect(shell).toContain('aria-label="Breadcrumb"');
    expect(shell).toContain("breadcrumbParentLabel(backLabel, backHref)");
    expect(shell).not.toContain('backLabel = "Back to map"');
  });

  it("uses the current trust statement and shared geometry tokens", async () => {
    const [footer, styles, header] = await Promise.all([
      read("src/components/atlas/public-atlas-footer.tsx"),
      read("src/app/globals.css"),
      read("src/components/atlas/public-atlas-header.tsx")
    ]);

    expect(footer).toContain("Independent project by Andrew Davies.");
    expect(footer).not.toContain("transparent gaps");
    expect(styles).toContain("--atlas-radius-card: 18px");
    expect(styles).toContain("--atlas-radius-control: 12px");
    expect(header).toContain("font-[family-name:var(--font-inter)]");
  });
});
