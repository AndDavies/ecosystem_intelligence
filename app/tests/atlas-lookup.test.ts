import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeAtlasLookupText, queryAtlasLookupSnapshot } from "@/lib/atlas/lookup";
import type { AtlasDiscoverySnapshot, AtlasOrganization } from "@/types/atlas";
import { atlasTestSnapshot } from "./fixtures/atlas-snapshot";

const read = (file: string) => readFile(path.resolve(file), "utf8");

function withOrganization(
  snapshot: AtlasDiscoverySnapshot,
  overrides: Partial<AtlasOrganization>
): AtlasDiscoverySnapshot {
  const template = snapshot.organizations[0];
  return {
    ...snapshot,
    organizations: [
      ...snapshot.organizations,
      {
        ...template,
        id: overrides.id ?? `${template.id}-copy`,
        slug: overrides.slug ?? `${template.slug}-copy`,
        name: overrides.name ?? `${template.name} Copy`,
        capabilities: overrides.capabilities ?? [],
        ...overrides
      }
    ]
  };
}

describe("deterministic Atlas lookup", () => {
  const snapshot = atlasTestSnapshot as AtlasDiscoverySnapshot;

  it("normalizes punctuation, accents and whitespace without exposing a score", () => {
    expect(normalizeAtlasLookupText("  C-CORE & Défense  ")).toBe("c core and defense");
    const suggestions = queryAtlasLookupSnapshot(snapshot, "Dartmouth Systems Ltd.");
    expect(suggestions[0]).toMatchObject({
      kind: "organization",
      slug: "dartmouth-systems",
      label: "Dartmouth Systems"
    });
    expect(JSON.stringify(suggestions)).not.toMatch(/score|tier|distance|confidence|citation/i);
  });

  it("prioritizes exact, acronym and prefix name matches with stable ties", () => {
    const augmented = withOrganization(snapshot, {
      id: "mda-fixture",
      slug: "mda-corporation",
      name: "Maritime Defence Analytics Corporation"
    });
    expect(queryAtlasLookupSnapshot(augmented, "MDA")[0]).toMatchObject({ slug: "mda-corporation" });
    expect(queryAtlasLookupSnapshot(snapshot, "Dart")[0]).toMatchObject({ slug: "dartmouth-systems" });

    const first = queryAtlasLookupSnapshot(snapshot, "Canadian").map((item) => item.slug);
    const second = queryAtlasLookupSnapshot(snapshot, "Canadian").map((item) => item.slug);
    expect(second).toEqual(first);
  });

  it("allows bounded name typos but rejects unrelated short fragments", () => {
    expect(queryAtlasLookupSnapshot(snapshot, "Dartmoth Systems")[0]).toMatchObject({ slug: "dartmouth-systems" });
    expect(queryAtlasLookupSnapshot(snapshot, "Dz")).toEqual([]);
  });

  it("returns direct capabilities and structured discovery lenses", () => {
    const capability = queryAtlasLookupSnapshot(snapshot, "Underwater sensing");
    expect(capability.some((item) => item.kind === "capability" && item.slug === "dartmouth-systems-underwater-system")).toBe(true);

    const mission = queryAtlasLookupSnapshot(snapshot, "Underwater ISR");
    expect(mission).toContainEqual(expect.objectContaining({
      kind: "mission_area",
      slug: "underwater-isr",
      filter: { key: "mission", value: "underwater-isr" }
    }));

    const technology = queryAtlasLookupSnapshot(snapshot, "Sensing and ISR");
    expect(technology).toContainEqual(expect.objectContaining({
      kind: "technical_domain",
      slug: "sensing-and-isr",
      filter: { key: "domain", value: "sensing-and-isr" }
    }));
  });

  it("enforces the four-three-three presentation budget", () => {
    let augmented = snapshot;
    for (let index = 0; index < 8; index += 1) {
      augmented = withOrganization(augmented, {
        id: `sensor-org-${index}`,
        slug: `sensor-organization-${index}`,
        name: `Sensor Organization ${index}`,
        capabilities: [{
          ...snapshot.organizations[0].capabilities[0],
          id: `sensor-capability-${index}`,
          organizationId: `sensor-org-${index}`,
          slug: `sensor-capability-${index}`,
          name: `Sensor Capability ${index}`
        }]
      });
    }
    const suggestions = queryAtlasLookupSnapshot(augmented, "Sensor");
    expect(suggestions.filter((item) => item.kind === "organization")).toHaveLength(4);
    expect(suggestions.filter((item) => item.kind === "capability")).toHaveLength(3);
    expect(suggestions.length).toBeLessThanOrEqual(10);
  });

  it("keeps the endpoint read-only, bounded and private from intermediary caches", async () => {
    const [route, explorer, component, privacy] = await Promise.all([
      read("src/app/api/atlas/lookup/route.ts"),
      read("src/components/atlas/atlas-explorer.tsx"),
      read("src/components/atlas/atlas-record-lookup.tsx"),
      read("src/app/privacy/page.tsx")
    ]);
    expect(route).toContain("getAtlasDiscoverySnapshot()");
    expect(route).toContain("getAtlasOrganizationLogos(organizationIds)");
    expect(route).toContain("z.string().trim().min(2).max(120)");
    expect(route).toContain("privateJson(response)");
    expect(route).not.toContain("getAtlasSnapshot(");
    expect(route).not.toContain("pilot_searches");
    expect(component).toContain('fetch("/api/atlas/lookup"');
    expect(component).toContain("AbortController");
    expect(component).toContain('role="combobox"');
    expect(component).toContain('role="listbox"');
    expect(component).toContain('event.key === "Escape"');
    expect(component).not.toContain('/api/discover');
    expect(explorer).toContain('trackBetaEvent("filter_apply", { filter: "query", value: "set", placement: "map", measurement_version: "discovery_v2" }, { searchId: null })');
    expect(explorer).toContain('source: "atlas_lookup"');
    expect(privacy).toContain("direct record search matches the published catalogue without using OpenAI");
    expect(privacy).toContain("not retained as an Ask True North question");
  });
});
