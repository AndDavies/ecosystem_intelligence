import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("admin responsiveness and public submissions", () => {
  it("deduplicates owner authentication and prevents private navigation prefetch fan-out", async () => {
    const [auth, nav, shell, header, experience] = await Promise.all([
      readFile(path.resolve("src/lib/atlas/auth.ts"), "utf8"),
      readFile(path.resolve("src/components/atlas/admin-nav.tsx"), "utf8"),
      readFile(path.resolve("src/components/atlas/public-page-shell.tsx"), "utf8"),
      readFile(path.resolve("src/components/atlas/public-atlas-header.tsx"), "utf8"),
      readFile(path.resolve("src/components/atlas/public-beta-experience.tsx"), "utf8")
    ]);

    expect(auth).toContain("export const getAtlasUser = cache(");
    expect(nav).toContain('{ href: "/admin/submissions", label: "Submissions"');
    expect(nav).toContain('href={item.href} prefetch={false}');
    expect(nav).toContain('label: "Insights"');
    expect(shell).toContain('<PublicAtlasHeader privateWorkspace={variant === "admin"}');
    expect(shell).toContain('variant === "admin" ? null : <PublicAtlasFooter />');
    expect(header).toContain('prefetch={!privateWorkspace}');
    expect(experience).toContain('if (!pathSupportsNorthSignal(pathname))');
  });

  it("removes the rich national snapshot from the five cold-slow admin routes", async () => {
    const routes = await Promise.all([
      "src/app/admin/page.tsx",
      "src/app/admin/organizations/page.tsx",
      "src/app/admin/demand-matches/page.tsx",
      "src/app/admin/briefs/page.tsx",
      "src/app/admin/coverage/page.tsx"
    ].map((file) => readFile(path.resolve(file), "utf8")));

    routes.forEach((route) => {
      expect(route).not.toContain("getAtlasSnapshot");
      expect(route).not.toContain("getAtlasDiscoverySnapshot");
    });
    expect(routes[1]).toContain("const pageSize = 50");
    expect(routes[1]).toContain('<PaginationNav path="/admin/organizations"');
    // Full field coverage and paging are exercised by admin-organization-search.test.ts.
    expect(routes[1]).toContain("findPublishedOrganizationIds");
    expect(routes[2]).toContain('.from("capabilities").select("id", { count: "exact", head: true })');
    expect(routes[3].match(/<DefenceBriefEditor/g) ?? []).toHaveLength(1);
    expect(routes[3]).toContain('selectedId === "new"');
    expect(routes[3]).toContain("createPublicClient");
    expect(routes[4]).toContain('rpc("get_admin_coverage_breakdown")');
    expect(routes[4]).toContain("visibleNarrativeRows");
  });

  it("keeps analytics aggregate-oriented and moves contribution review out of Insights", async () => {
    const insights = await readFile(path.resolve("src/app/admin/insights/page.tsx"), "utf8");

    expect(insights).toContain('admin.from("submissions").select("id", { count: "exact", head: true })');
    expect(insights).toContain('href="/admin/submissions" prefetch={false}');
    expect(insights).not.toContain('title="Profile contributions"');
    expect(insights).not.toContain('workflow="submission"');
    expect(insights).toContain("const concurrentPages = 4");
    expect(insights).toContain("Promise.all(pageStarts.slice");
    expect(insights).toContain("const upperBoundary");
    expect(insights).toContain('.order("id", { ascending: true })');
    expect(insights).toContain("[overflow-wrap:anywhere]");
  });

  it("provides a bounded, structured and auditable submissions queue", async () => {
    const [page, action, legacyAction, migration, briefVisibilityMigration] = await Promise.all([
      readFile(path.resolve("src/app/admin/submissions/page.tsx"), "utf8"),
      readFile(path.resolve("src/lib/actions/submissions-admin.ts"), "utf8"),
      readFile(path.resolve("src/lib/actions/beta-admin.ts"), "utf8"),
      readFile(path.resolve("supabase/migrations/20260829113000_review_public_submissions.sql"), "utf8"),
      readFile(path.resolve("supabase/migrations/20260829114500_enforce_defence_brief_record_visibility.sql"), "utf8")
    ]);

    expect(page).toContain("Approve for candidate preparation");
    expect(page).toContain("It does not create, alter, or publish an organization or capability.");
    expect(page).toContain("Open submitted evidence");
    expect(page).toContain("Prepare source-backed candidate");
    expect(page).toContain('const pageSize = 20');
    expect(page).not.toContain("JSON.stringify");
    expect(action).toContain('rpc("review_public_submission"');
    expect(action).toContain('rationale: z.string().trim().min(20).max(2000)');
    expect(legacyAction).not.toContain('workflow: z.literal("submission")');
    expect(migration).toContain("submissions_status_created_at_idx");
    expect(migration).toContain("for update");
    expect(migration).toContain("insert into public.review_decisions");
    expect(migration).toContain("insert into public.audit_events");
    expect(migration).toContain("'publication_changed', false");
    expect(migration).toContain("next_status = 'approved'");
    expect(migration).not.toContain("update public.organizations");
    expect(migration).not.toContain("insert into public.candidate_changes");
    expect(migration).not.toContain("set status = 'published'");
    expect(briefVisibilityMigration).toContain("wiki_page_record_links_validate_visibility");
    expect(briefVisibilityMigration).toContain('create policy "published defence brief links are public"');
    expect(briefVisibilityMigration).toContain('drop policy if exists "published defence brief links are public for authenticated"');
    expect(briefVisibilityMigration).toContain('create policy "published defence brief links are public for authenticated"');
    expect(briefVisibilityMigration).toContain("on public.wiki_page_record_links for select to anon");
    expect(briefVisibilityMigration).toContain("on public.wiki_page_record_links for select to authenticated");
    expect(briefVisibilityMigration).toContain("or (select private.is_atlas_staff())");
    expect(briefVisibilityMigration).toContain("before insert or update of page_id, record_type, record_id");
    expect(briefVisibilityMigration).toContain("Existing Defence Brief related-record links include a target outside the published boundary.");
    expect(briefVisibilityMigration).toContain("capability_record.publication_status = 'published'");
    expect(briefVisibilityMigration).toContain("demand_source_record.source_verified_at is not null");
  });
});
