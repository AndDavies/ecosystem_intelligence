import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("route resilience and accessibility contracts", () => {
  it("keeps recovery and loading boundaries on the core data routes", async () => {
    const boundaries = [
      "src/app/error.tsx",
      "src/app/loading.tsx",
      "src/app/organizations/loading.tsx",
      "src/app/demand/loading.tsx",
      "src/app/briefs/loading.tsx",
      "src/app/admin/review/loading.tsx"
    ];

    await Promise.all(boundaries.map((file) => access(path.resolve(file))));
  });

  it("provides a keyboard route past repeated navigation", async () => {
    const layout = await readFile(path.resolve("src/app/layout.tsx"), "utf8");
    const skipLink = await readFile(path.resolve("src/components/atlas/skip-link.tsx"), "utf8");
    expect(layout).toContain("<SkipLink />");
    expect(layout).toContain('id="main-content"');
    expect(layout).toContain("tabIndex={-1}");
    expect(skipLink).toContain('href="#main-content"');
    expect(skipLink).toContain('document.getElementById("main-content")');
  });

  it("keeps async form actions announced and prevents duplicate submissions", async () => {
    const pendingButton = await readFile(path.resolve("src/components/ui/pending-button.tsx"), "utf8");
    const reviewPage = await readFile(path.resolve("src/app/admin/review/page.tsx"), "utf8");
    expect(pendingButton).toContain('"aria-busy"');
    expect(pendingButton).toContain('"aria-disabled"');
    expect(pendingButton).toContain('aria-hidden="true"');
    expect(reviewPage).not.toContain("<button");
    expect(reviewPage).toContain("PendingButton");
  });

  it("uses focus-managed dialogs for public feedback and update signup", async () => {
    const experience = await readFile(path.resolve("src/components/atlas/public-beta-experience.tsx"), "utf8");
    expect(experience).toContain('import * as Dialog from "@radix-ui/react-dialog"');
    expect(experience).toContain('aria-modal="true"');
    expect(experience).toContain("onOpenAutoFocus");
    expect(experience).toContain('data-clarity-mask="true"');
    expect(experience).not.toContain('role="presentation"');
  });
});
