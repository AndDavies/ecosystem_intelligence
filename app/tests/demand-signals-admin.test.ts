import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("demand signal administration", () => {
  it("provides a private editor and navigation route", async () => {
    const [page, nav] = await Promise.all([
      readFile(path.resolve("src/app/admin/demand-signals/page.tsx"), "utf8"),
      readFile(path.resolve("src/components/atlas/admin-nav.tsx"), "utf8")
    ]);
    expect(page).toContain('requireAtlasStaff("admin")');
    expect(page).toContain("DemandSignalEditor");
    expect(page).toContain("demand_source_issuers");
    expect(nav).toContain('/admin/demand-signals');
  });

  it("preserves requirement identifiers and dependent demand matches", async () => {
    const migration = await readFile(path.resolve("supabase/migrations/20260719195957_manage_published_demand_signals.sql"), "utf8");
    expect(migration).toContain("existing.id = requirement_id");
    expect(migration).toContain("existing.demand_source_id = managed_demand_source_id");
    expect(migration).not.toContain("delete from public.demand_requirements");
    expect(migration).toContain("relationship_ids_preserved");
  });

  it("requires and maintains the canonical issuing-authority relationship", async () => {
    const [editor, relationshipMigration] = await Promise.all([
      readFile(path.resolve("src/components/atlas/demand-signal-editor.tsx"), "utf8"),
      readFile(path.resolve("supabase/migrations/20260719211500_link_demand_signal_issuers.sql"), "utf8")
    ]);
    expect(editor).toContain("Issuing authority");
    expect(relationshipMigration).toContain("from public.demand_issuers");
    expect(relationshipMigration).toContain("insert into public.demand_source_issuers");
    expect(relationshipMigration).toContain("delete from public.demand_source_issuers");
    expect(relationshipMigration).not.toContain("delete from public.demand_requirements");
  });
});
