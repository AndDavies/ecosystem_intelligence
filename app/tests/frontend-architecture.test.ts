import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("frontend architecture contracts", () => {
  it("keeps discovery presentation separate from discovery orchestration", async () => {
    const explorer = await readFile(path.resolve("src/components/atlas/atlas-explorer.tsx"), "utf8");
    const results = await readFile(path.resolve("src/components/atlas/atlas-explorer-results.tsx"), "utf8");

    expect(explorer).toContain('from "@/components/atlas/atlas-explorer-results"');
    expect(explorer).not.toContain("function OrganizationRows(");
    expect(results).toContain("export function OrganizationRows(");
    expect(results).toContain("export function LookbookPeek(");
  });

  it("keeps published record editing in bounded action modules", async () => {
    const adminActions = await readFile(path.resolve("src/lib/actions/atlas-admin.ts"), "utf8");
    const organizationActions = await readFile(path.resolve("src/lib/actions/atlas-organizations.ts"), "utf8");
    const demandActions = await readFile(path.resolve("src/lib/actions/atlas-demand-signals.ts"), "utf8");

    expect(adminActions).not.toContain("editPublishedOrganization(");
    expect(adminActions).not.toContain("upsertPublishedDemandSignal(");
    expect(organizationActions).toContain("export async function editPublishedOrganization(");
    expect(demandActions).toContain("export async function upsertPublishedDemandSignal(");
  });

  it("uses shared editorial primitives and semantic palette roles", async () => {
    const primitives = [
      "src/components/ui/badge.tsx",
      "src/components/ui/flash-banner.tsx",
      "src/components/ui/form-field.tsx",
      "src/components/ui/section-card.tsx",
      "src/components/ui/status-chip.tsx"
    ];
    await Promise.all(primitives.map((file) => access(path.resolve(file))));

    const globals = await readFile(path.resolve("src/app/globals.css"), "utf8");
    const reviewPage = await readFile(path.resolve("src/app/admin/review/page.tsx"), "utf8");
    expect(globals).toContain("--admin-action:");
    expect(globals).toContain("--admin-evidence:");
    expect(globals).not.toContain('.atlas-admin-shell [class*=');
    expect(reviewPage).not.toMatch(/#[0-9a-fA-F]{6}/);
  });

  it("lets long discovery filters grow without overlapping map controls", async () => {
    const explorer = await readFile(path.resolve("src/components/atlas/atlas-explorer.tsx"), "utf8");

    expect(explorer).toContain("inline-flex min-h-9 max-w-full items-center");
    expect(explorer).toContain('className="min-w-0 break-words"');
    expect(explorer).not.toContain("inline-flex h-9 items-center gap-2 rounded-full border border-[var(--atlas-primary-border)]");
  });
});
