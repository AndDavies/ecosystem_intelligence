import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFile(path.resolve(file), "utf8");

describe("system states and supporting-page metadata", () => {
  it("uses the approved loading, empty, error, and 404 language", async () => {
    const [organizations, organizationDirectory, publicNeeds, signals, error, notFound] = await Promise.all([
      read("src/app/organizations/loading.tsx"),
      read("src/components/atlas/organization-directory-loading.tsx"),
      read("src/app/demand/loading.tsx"),
      read("src/components/atlas/signal-archive-browser.tsx"),
      read("src/app/error.tsx"),
      read("src/app/not-found.tsx")
    ]);

    expect(organizations).toContain("<PublicPageShell");
    expect(organizations).toContain("Find Canadian organizations worth examining.");
    expect(organizations).toContain("<OrganizationDirectoryLoading />");
    expect(organizationDirectory).toContain("Loading published organizations…");
    expect(organizationDirectory).not.toContain("Array.from({ length: 6 }");
    expect(publicNeeds).toContain("Loading published Defence needs…");
    expect(signals).toContain("No Signals match this search.");
    expect(error).toContain("We could not load this view.");
    expect(error).toContain("Explore the map");
    expect(notFound).toContain("We could not find that page.");
    expect(notFound).toContain("Go to homepage");
    expect(notFound).toContain("index: false");
  });

  it("keeps supporting pages canonical, shareable, and connected to Home", async () => {
    const pages = await Promise.all([
      read("src/app/about/page.tsx"),
      read("src/app/how-it-works/page.tsx"),
      read("src/app/methodology/page.tsx"),
      read("src/app/contact/page.tsx"),
      read("src/app/privacy/page.tsx"),
      read("src/app/terms/page.tsx")
    ]);

    for (const page of pages) {
      expect(page).toContain("backHref=\"/\"");
      expect(page).toContain("backLabel=\"Home\"");
    }
    for (const page of pages.slice(2)) {
      expect(page).toContain("socialMetadata");
    }
  });

  it("uses a borderless tonal empty state without changing its interface", async () => {
    const shell = await read("src/components/atlas/public-page-shell.tsx");

    expect(shell).toContain("export function EmptyCoverage");
    expect(shell).toContain('rounded-2xl bg-[var(--atlas-surface-muted)]');
    expect(shell).not.toContain("border-dashed");
  });
});
