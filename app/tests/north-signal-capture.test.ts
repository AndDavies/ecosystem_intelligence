import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("North Signal capture", () => {
  it("uses a one-action consent form with interaction-only verification", async () => {
    const [signup, turnstile, validation] = await Promise.all([
      readFile(path.resolve("src/components/atlas/north-signal-signup.tsx"), "utf8"),
      readFile(path.resolve("src/components/security/turnstile-field.tsx"), "utf8"),
      readFile(path.resolve("src/lib/product-insights/validation.ts"), "utf8")
    ]);

    expect(signup).toContain("Get North Signal");
    expect(signup).toContain("consent: true");
    expect(signup).not.toContain('type="checkbox"');
    expect(signup).toContain("newsletter_form_start");
    expect(signup).toContain("newsletter_submit");
    expect(signup).toContain("newsletter_error");
    expect(turnstile).toContain('appearance: "interaction-only"');
    expect(turnstile).toContain('size: "flexible"');
    expect(validation).toContain("north-signal-2026-07-v2");
    expect(signup).toContain("Weekly briefing");
    expect(signup).toContain("New on the map");
  });

  it("prompts automatically only after high-intent behaviour", async () => {
    const experience = await readFile(path.resolve("src/components/atlas/public-beta-experience.tsx"), "utf8");

    expect(experience).toContain("second_profile");
    expect(experience).toContain("ask_result_viewed");
    expect(experience).toContain("evidence_opened");
    expect(experience).toContain("brief_60_percent");
    expect(experience).toContain("newsletter_banner_mobile");
    expect(experience).not.toContain("75_000");
    expect(experience).not.toContain("fallbackTimer");
  });

  it("places contextual signup surfaces on the highest-intent public pages", async () => {
    const [landing, map, organization, brief, header, footer] = await Promise.all([
      readFile(path.resolve("src/app/page.tsx"), "utf8"),
      readFile(path.resolve("src/components/atlas/atlas-explorer.tsx"), "utf8"),
      readFile(path.resolve("src/app/organizations/[slug]/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/briefs/[slug]/page.tsx"), "utf8"),
      readFile(path.resolve("src/components/atlas/public-atlas-header.tsx"), "utf8"),
      readFile(path.resolve("src/components/atlas/public-atlas-footer.tsx"), "utf8")
    ]);

    expect(landing).toContain('placement="newsletter_inline_home"');
    expect(map).toContain('placement="newsletter_inline_map"');
    expect(organization).toContain('placement="newsletter_inline_profile"');
    expect(brief).toContain('placement="newsletter_inline_brief"');
    expect(header).toContain("North Signal");
    expect(footer).toContain("North Signal");
  });

  it("keeps subscriber identity out of bounded funnel events", async () => {
    const [signup, migration, insights] = await Promise.all([
      readFile(path.resolve("src/components/atlas/north-signal-signup.tsx"), "utf8"),
      readFile(path.resolve("supabase/migrations/20260730084549_north_signal_capture_funnel.sql"), "utf8"),
      readFile(path.resolve("src/app/admin/insights/page.tsx"), "utf8")
    ]);

    const metadataBuilder = signup.slice(signup.indexOf("function eventMetadata"), signup.indexOf("export function NorthSignalSignupForm"));
    expect(metadataBuilder).not.toContain("email");
    expect(migration).toContain("newsletter_impression");
    expect(migration).toContain("newsletter_dismiss");
    expect(migration).toContain("Subscriber email is never stored in event metadata");
    expect(insights).toContain("North Signal conversion");
  });
});
