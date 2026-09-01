import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildEditorialRecordContinuationLinks,
  buildExploreNextGroups,
  capabilityRelatedOrganizationEdge,
  canonicalOrganizationRelationshipEdge,
  editorialIntelligenceRelationship,
  internalLinkMetadata,
  type InternalLinkEdge
} from "@/lib/atlas/internal-link-graph";
import {
  analyzeRenderedInternalLinkGraph,
  inspectStoredEditorialLink,
  internalLinkRouteFamily,
  isGenericInternalAnchor
} from "@/lib/launch/internal-link-graph";

function edge(overrides: Partial<InternalLinkEdge> & Pick<InternalLinkEdge, "href" | "targetType" | "targetSlug">): InternalLinkEdge {
  return {
    label: `Explore ${overrides.targetSlug}`,
    relationshipKind: "shared_domain",
    provenance: "discovery",
    ...overrides
  };
}

describe("public internal-link presentation graph", () => {
  it("bounds continuation groups to three organizations, three context paths, two editorial records, and eight total", () => {
    const links: InternalLinkEdge[] = [
      ...Array.from({ length: 5 }, (_, index) => edge({ href: `/organizations/org-${index}`, targetType: "organization", targetSlug: `org-${index}` })),
      ...Array.from({ length: 5 }, (_, index) => edge({ href: `/missions/mission-${index}`, targetType: "mission_area", targetSlug: `mission-${index}` })),
      ...Array.from({ length: 4 }, (_, index) => edge({ href: `/signals/signal-${index}`, targetType: "signal", targetSlug: `signal-${index}`, relationshipKind: "editorial_record", provenance: "editorial" }))
    ];
    const groups = buildExploreNextGroups(links);
    expect(groups.map((group) => [group.key, group.links.length])).toEqual([
      ["organizations", 3],
      ["context", 3],
      ["intelligence", 2]
    ]);
    expect(groups.flatMap((group) => group.links)).toHaveLength(8);
  });

  it("deduplicates query variants, removes self/external links, and keeps the strongest relationship for a destination", () => {
    const groups = buildExploreNextGroups([
      edge({ href: "/organizations/alpha?returnTo=%2Fmap", targetType: "organization", targetSlug: "alpha", relationshipKind: "shared_domain" }),
      edge({ href: "/organizations/alpha", targetType: "organization", targetSlug: "alpha", relationshipKind: "organization_relationship", provenance: "direct", label: "Explore Alpha's reviewed relationship" }),
      edge({ href: "/organizations/current?returnTo=%2Fmap", targetType: "organization", targetSlug: "current" }),
      edge({ href: "https://example.com/organizations/external", targetType: "organization", targetSlug: "external" }),
      edge({ href: "", targetType: "organization", targetSlug: "empty" })
    ], { currentHref: "/organizations/current" });
    expect(groups).toHaveLength(1);
    expect(groups[0].links).toEqual([expect.objectContaining({
      href: "/organizations/alpha",
      relationshipKind: "organization_relationship",
      label: "Explore Alpha's reviewed relationship"
    })]);
  });

  it("emits only the approved anonymous analytics dimensions", () => {
    const link = edge({ href: "/organizations/alpha", targetType: "organization", targetSlug: "alpha", relationshipKind: "ownership", provenance: "direct" });
    expect(internalLinkMetadata(link, "capability_profile", 4)).toEqual({
      presentation: "internal_link_graph_v1:capability_profile",
      target: "ownership",
      position_band: "4-6",
      destination: "organization:alpha"
    });
  });

  it("distinguishes explicit editorial links from derived discovery paths", () => {
    expect(editorialIntelligenceRelationship(true)).toEqual({
      relationshipKind: "editorial_record",
      provenance: "editorial"
    });
    expect(editorialIntelligenceRelationship(false)).toEqual({
      relationshipKind: "shared_capability",
      provenance: "derived"
    });
  });

  it("labels capability-adjacent organizations as discovery rather than partnership", () => {
    expect(capabilityRelatedOrganizationEdge({
      slug: "beta-systems",
      name: "Beta Systems",
      reason: "Shared reviewed Mission Areas and technical domains"
    })).toEqual({
      href: "/organizations/beta-systems",
      label: "Explore Beta Systems in similar areas of work",
      detail: "Shared reviewed Mission Areas and technical domains. Discovery path only; not a partnership or endorsement.",
      targetType: "organization",
      targetSlug: "beta-systems",
      relationshipKind: "shared_mission",
      provenance: "discovery"
    });
  });

  it("reserves a continuation slot for every populated group before filling one lane", () => {
    const groups = buildExploreNextGroups([
      edge({ href: "/organizations/a", targetType: "organization", targetSlug: "a", relationshipKind: "ownership" }),
      edge({ href: "/organizations/b", targetType: "organization", targetSlug: "b" }),
      edge({ href: "/organizations/c", targetType: "organization", targetSlug: "c" }),
      edge({ href: "/missions/arctic", targetType: "mission_area", targetSlug: "arctic", relationshipKind: "reviewed_mission" }),
      edge({ href: "/signals/edition", targetType: "signal", targetSlug: "edition", relationshipKind: "editorial_record", provenance: "editorial" })
    ], { maximum: 3 });

    expect(groups.map((group) => group.key)).toEqual(["organizations", "context", "intelligence"]);
    expect(groups.flatMap((group) => group.links)).toHaveLength(3);
  });

  it("never turns a name-only organization relationship into a public edge", () => {
    expect(canonicalOrganizationRelationshipEdge({
      relationshipType: "partner",
      publicSummary: "Name-only source text.",
      relatedOrganization: null
    })).toBeNull();

    expect(canonicalOrganizationRelationshipEdge({
      relationshipType: "programme_operator",
      publicSummary: "Reviewed canonical relationship.",
      relatedOrganization: { slug: "canonical-operator", name: "Canonical Operator" }
    })).toMatchObject({
      href: "/organizations/canonical-operator",
      relationshipKind: "organization_relationship",
      provenance: "direct"
    });
  });

  it("bounds and deduplicates mixed Signal and Brief record continuations", () => {
    const links = buildEditorialRecordContinuationLinks([
      ...Array.from({ length: 5 }, (_, index) => ({
        recordType: "organization" as const,
        recordId: `organization-${index}`,
        href: `/organizations/organization-${index}`,
        label: `Organization ${index}`
      })),
      {
        recordType: "organization",
        recordId: "organization-0",
        href: "/organizations/organization-0?returnTo=%2Fsignals%2Fedition",
        label: "Duplicate Organization 0"
      },
      ...Array.from({ length: 3 }, (_, index) => ({
        recordType: "capability" as const,
        recordId: `capability-${index}`,
        href: `/capabilities/capability-${index}`,
        label: `Capability ${index}`
      })),
      {
        recordType: "capability",
        recordId: "capability-0",
        href: "/capabilities/capability-0?returnTo=%2Fbriefs%2Farticle",
        label: "Duplicate Capability 0"
      },
      { recordType: "demand_requirement", recordId: "need-0", href: "/demand/need-0", label: "Public Need 0" },
      { recordType: "mission_area", recordId: "mission-0", href: "/missions/mission-0", label: "Mission Area 0" }
    ]);

    expect(links).toHaveLength(6);
    expect(links.filter((link) => link.targetType === "organization")).toHaveLength(3);
    expect(links.filter((link) => link.targetType !== "organization")).toHaveLength(3);
    expect(links.filter((link) => link.targetSlug === "organization-0")).toHaveLength(1);
    expect(links.filter((link) => link.targetSlug === "capability-0")).toHaveLength(1);
    expect(links.map((link) => link.targetType)).toEqual([
      "organization",
      "organization",
      "organization",
      "capability",
      "capability",
      "capability"
    ]);
  });
});

describe("rendered internal-link audit graph", () => {
  const base = "https://truenorthmap.ca";
  const canonicalUrls = [
    `${base}/`,
    `${base}/organizations`,
    `${base}/organizations/alpha`,
    `${base}/capabilities/radar`,
    `${base}/signals/update`
  ];

  it("classifies families and separates contextual degree from global navigation", () => {
    expect(internalLinkRouteFamily(`${base}/organizations/alpha`)).toBe("organization");
    expect(internalLinkRouteFamily(`${base}/organizations`)).toBe("organization_collection");
    expect(internalLinkRouteFamily(`${base}/about`)).toBe("about");
    expect(internalLinkRouteFamily(`${base}/north-signal`)).toBe("north-signal");
    const graph = analyzeRenderedInternalLinkGraph({
      canonicalUrls,
      occurrences: [
        { sourceUrl: `${base}/`, targetUrl: `${base}/organizations`, label: "Organizations", role: "global", module: "site_header" },
        { sourceUrl: `${base}/organizations`, targetUrl: `${base}/organizations/alpha`, label: "Explore Alpha's organization profile", role: "contextual", module: "organization_directory" },
        { sourceUrl: `${base}/organizations/alpha`, targetUrl: `${base}/capabilities/radar`, label: "Review Radar", role: "contextual", module: "organization_dossier" },
        { sourceUrl: `${base}/organizations/alpha`, targetUrl: `${base}/capabilities/radar`, label: "Review Radar", role: "contextual", module: "organization_dossier" },
        { sourceUrl: `${base}/organizations/alpha`, targetUrl: `${base}/organizations/alpha`, label: "Here", role: "contextual", module: "bad" }
      ]
    });
    expect(graph.contextualOrphanCandidates).toContain(`${base}/signals/update`);
    expect(graph.nearOrphanCandidates).toContain(`${base}/capabilities/radar`);
    expect(graph.deadEndCandidates).toContain(`${base}/organizations/alpha`);
    expect(graph.duplicateEdges).toContainEqual(expect.objectContaining({ targetUrl: `${base}/capabilities/radar`, count: 2 }));
    expect(graph.selfLinks).toContainEqual(expect.objectContaining({ sourceUrl: `${base}/organizations/alpha` }));
    expect(graph.genericAnchorLinks).toContainEqual(expect.objectContaining({ label: "Here" }));
    expect(graph.pageMetrics.find((page) => page.url === `${base}/capabilities/radar`)).toMatchObject({ contextualInboundReferrers: 1 });
  });

  it("counts shaped action links as useful onward paths without counting global navigation", () => {
    const graph = analyzeRenderedInternalLinkGraph({
      canonicalUrls: [
        `${base}/organizations/alpha`,
        `${base}/map`,
        `${base}/signals`,
        `${base}/about`
      ],
      occurrences: [
        { sourceUrl: `${base}/organizations/alpha`, targetUrl: `${base}/map`, label: "View Alpha on the map", role: "action", module: "organization_actions" },
        { sourceUrl: `${base}/organizations/alpha`, targetUrl: `${base}/signals`, label: "Explore Defence Signals connected to Alpha", role: "action", module: "organization_actions" },
        { sourceUrl: `${base}/organizations/alpha`, targetUrl: `${base}/about`, label: "About", role: "global", module: "site_footer" }
      ]
    });

    expect(graph.deadEndCandidates).not.toContain(`${base}/organizations/alpha`);
    expect(graph.pageMetrics.find((page) => page.url === `${base}/organizations/alpha`)).toMatchObject({
      contextualOutboundTargets: 2
    });
  });

  it("recognizes generic anchors without rejecting descriptive action labels", () => {
    for (const label of [
      "Read more",
      "Read the article",
      "Read the Signal",
      "Read Brief",
      "Read the latest Brief",
      "Explore profile",
      "Open technology profile"
    ]) {
      expect(isGenericInternalAnchor(label)).toBe(true);
    }
    for (const label of [
      "Read Defence Brief: Arctic surveillance procurement",
      "Read Canadian Defence Signal: New testing pathway opens",
      "Explore Kraken Robotics' organization profile"
    ]) {
      expect(isGenericInternalAnchor(label)).toBe(false);
    }
  });

  it("keeps source links visibly identifiable and card anchors destination-specific", async () => {
    const [alignment, signalDetail, briefCollection, briefDetail, missionDetail, publicNeedDetail, organizationCard, organizationDossier] = await Promise.all([
      readFile(path.resolve("src/components/atlas/alignment-match-card.tsx"), "utf8"),
      readFile(path.resolve("src/app/signals/[slug]/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/briefs/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/briefs/[slug]/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/missions/[slug]/page.tsx"), "utf8"),
      readFile(path.resolve("src/app/demand/[slug]/page.tsx"), "utf8"),
      readFile(path.resolve("src/components/atlas/organization-card.tsx"), "utf8"),
      readFile(path.resolve("src/components/atlas/executive-organization-dossier.tsx"), "utf8")
    ]);

    expect(alignment).toContain('className="atlas-prose-link inline-flex items-center gap-1 font-semibold"');
    expect(signalDetail).toContain('href="/methodology" className="atlas-prose-link font-semibold"');
    expect(signalDetail).toContain('href="/contact" className="atlas-prose-link font-semibold"');
    expect(signalDetail).toContain('text-white underline decoration-2 underline-offset-4');
    expect(briefCollection).toContain('<span className="sr-only">: {featured.title}</span>');
    expect(briefCollection).toContain('<span className="sr-only">: {brief.title}</span>');
    expect(briefDetail).toContain('<span className="sr-only">: {relatedBrief.title}</span>');
    expect(missionDetail).toContain('<span className="sr-only">: {signal.title}</span>');
    expect(missionDetail).toContain('<span className="sr-only">: {brief.title}</span>');
    expect(publicNeedDetail).toContain('<span className="sr-only">: {signal.title}</span>');
    expect(organizationCard).toContain("Explore {organization.name}");
    expect(organizationDossier).toContain("Explore {capability.name}");
    expect(`${briefCollection}\n${briefDetail}\n${missionDetail}\n${publicNeedDetail}\n${organizationCard}\n${organizationDossier}`).not.toMatch(/Read the article|Read the Signal|Explore profile|Open technology profile/);
  });

  it("does not let a noncanonical source hide an orphaned sitemap page", () => {
    const graph = analyzeRenderedInternalLinkGraph({
      canonicalUrls: [`${base}/`, `${base}/capabilities/radar`],
      occurrences: [{
        sourceUrl: `${base}/capabilities`,
        targetUrl: `${base}/capabilities/radar`,
        label: "Explore Radar",
        role: "contextual",
        module: "phantom_collection"
      }]
    });

    expect(graph.contextualOrphanCandidates).toContain(`${base}/capabilities/radar`);
    expect(graph.pageMetrics.find((page) => page.url === `${base}/capabilities/radar`)).toMatchObject({ contextualInboundReferrers: 0, clickDepth: null });
  });

  it("reports stored editorial href drift and unpublished targets instead of reconstructing them silently", () => {
    expect(inspectStoredEditorialLink({
      baseUrl: base,
      storedHref: "/organizations/old-slug#profile",
      canonicalTargetUrl: `${base}/organizations/current-slug`
    })).toEqual({
      storedTargetUrl: `${base}/organizations/old-slug`,
      findings: ["stored_href_differs_from_canonical_target"]
    });
    expect(inspectStoredEditorialLink({
      baseUrl: base,
      storedHref: "https://example.com/company",
      canonicalTargetUrl: null
    })).toEqual({
      storedTargetUrl: null,
      findings: ["invalid_or_external_public_href", "target_not_public_or_not_canonical"]
    });
  });
});
