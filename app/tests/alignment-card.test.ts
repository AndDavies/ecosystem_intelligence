import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

async function source(file: string) {
  return readFile(path.resolve(file), "utf8");
}

describe("reviewed alignment presentation", () => {
  it("keeps capability alignment shared while the executive dossier uses its editorial connection rows", async () => {
    const [card, organization, capability] = await Promise.all([
      source("src/components/atlas/alignment-match-card.tsx"),
      source("src/components/atlas/executive-organization-dossier.tsx"),
      source("src/app/capabilities/[slug]/page.tsx")
    ]);

    expect(organization).toContain("ConnectionCard");
    expect(capability).toContain("AlignmentMatchCard");
    expect(card).toContain("publicLanguage.assessment");
    expect(card).toContain("alignmentTypeLabel(matchType)");
    expect(card).toContain('matchType === "public_source_alignment"');
    expect(card).toContain("citations.slice(0, 2)");
    expect(capability).toContain("matchType={match.matchType}");
    expect(capability).toContain('caveat="Public-source alignment only; not eligibility or endorsement."');
    expect(organization).toContain("They do not indicate procurement direction, eligibility, endorsement or customer interest.");
    expect(organization).toContain('href={`/missions/${match.missionArea.slug}`}');
    expect(organization).toContain('href={`/demand/${match.demandSlug}`}');
  });

  it("keeps alignment visual confidence at or below source support", async () => {
    const card = await source("src/components/atlas/alignment-match-card.tsx");

    // The card surface stays neutral. Direct public-source connections may
    // use Evidence Green in their icon, while derived matches use Signal Wash.
    expect(card).toContain('bg-[var(--atlas-surface-muted)]/60');
    expect(card).not.toContain("border-[var(--atlas-amber)]");
    expect(card).not.toContain("border-[var(--atlas-evidence)]");
    expect(card).toContain('bg-[var(--atlas-evidence-soft)] text-[var(--atlas-evidence)]');
    expect(card).toContain('high: "bg-[var(--atlas-evidence-soft)]');
    expect(card).toContain('needs_review: "bg-[var(--atlas-amber-soft)]');
  });

  it("keeps the capability profile aligned with the organization profile", async () => {
    const capability = await source("src/app/capabilities/[slug]/page.tsx");

    expect(capability).not.toContain("EvidenceLegend");
    expect(capability).toContain("Request an introduction");
    expect(capability.indexOf("Add to Working List")).toBeLessThan(capability.indexOf("Request an introduction"));
    expect(capability).toContain("Capability profile");
    expect(capability).toContain('title="What it enables"');
    expect(capability).toContain('eyebrow: "Canadian capability profile"');
    expect(capability).toContain("Last reviewed");
    expect(capability).toContain("Who is building it");
    expect(capability).toContain('title="What supports this profile"');
    expect(capability).not.toContain('title="What remains unknown"');
    // The onward organization link is internal, so it must not carry the
    // external-link affordance.
    expect(capability).not.toContain("ExternalLink");
  });
});
