// @vitest-environment jsdom
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CapabilityDossier } from "@/components/atlas/capability-dossier";
import { capabilitySources } from "@/lib/atlas/capability-presentation";
import { previewOrganization } from "@/lib/atlas/dossier-preview-fixtures";
import { safeAtlasReturn } from "@/lib/atlas/return-path";

vi.mock("@/components/atlas/public-page-shell", () => ({ PublicPageShell: ({ pageHeader, children }: { pageHeader: React.ReactNode; children: React.ReactNode }) => React.createElement("main", {}, pageHeader, children) }));
vi.mock("@/components/atlas/north-signal-signup", () => ({ NorthSignalInline: () => null }));
vi.mock("@/components/atlas/public-share", () => ({ PublicShare: () => React.createElement("button", {}, "Share") }));
vi.stubGlobal("React", React);

function render(capability = previewOrganization.capabilities[0], mapReturnTo = "/map?mission=underwater-isr") {
  const html = renderToStaticMarkup(React.createElement(CapabilityDossier, {
    organization: previewOrganization, capability, mapReturnTo,
    relatedSignals: [], relatedBriefs: [], relatedOrganizations: []
  }));
  const doc = document.implementation.createHTMLDocument();
  doc.body.innerHTML = html;
  return doc;
}

describe("editorial capability dossier", () => {
  it("labels sibling capabilities accurately without mislabelling mixed related destinations", () => {
    const capability = previewOrganization.capabilities[0];
    const siblingsOnly = render({ ...capability, missionMatches: [], demandMatches: [], technicalDomains: [] });
    expect(siblingsOnly.querySelector("#related-context")?.textContent).toBe(`Other capabilities from ${previewOrganization.name}`);
    expect(siblingsOnly.querySelector("#related-context")?.parentElement?.querySelectorAll("a[href^='/capabilities/']").length).toBeGreaterThan(0);
    expect(render().querySelector("#related-context")?.textContent).toBe("Other capabilities and related paths");
  });

  it("groups source rows without losing distinct passages, locators or connection associations", () => {
    const capability = structuredClone(previewOrganization.capabilities[0]);
    const original = capability.citations[0];
    original.sourceLocator = "operations.op-private.value.summary";
    capability.citations.push({ ...original, id: "second-excerpt", fieldName: "maturity", excerpt: "The second configuration is pre-operational.", sourceLocator: "Annex B, table 4" });
    const sources = capabilitySources(capability);
    expect(sources).toHaveLength(2);
    expect(sources[0].evidence).toHaveLength(2);
    expect(sources[1].evidence[0].associations).toHaveLength(2);
    const doc = render(capability);
    expect(doc.querySelectorAll("#source-library > li")).toHaveLength(2);
    expect(doc.querySelector("#evidence")?.textContent).toContain("The second configuration is pre-operational.");
    expect(doc.querySelector("#evidence")?.textContent).toContain("Annex B, table 4");
    expect(doc.querySelector("#evidence")?.textContent).not.toContain("operations.op-private");
    expect(doc.querySelector("#evidence")?.textContent).not.toContain("Executive dossier profile evidence");
    expect(doc.querySelector("#evidence")?.textContent).not.toContain("Programme evidence");
    expect(doc.querySelectorAll("#evidence details[open]")).toHaveLength(0);
    expect(doc.querySelectorAll("#source-library > li > a[target='_blank']")).toHaveLength(2);
  });

  it("retains rich connection explanations and only navigates to rendered sections", () => {
    const doc = render();
    expect(doc.querySelector("#mission-areas")?.textContent).toContain(previewOrganization.capabilities[0].missionMatches[0].alignmentSummary);
    expect(doc.querySelector("#defence-needs")?.textContent).toContain(previewOrganization.capabilities[0].demandMatches[0].alignmentSummary);
    expect(doc.querySelector("#mission-areas")?.textContent).toContain("Our assessment");
    const missionOnly = render({ ...previewOrganization.capabilities[0], demandMatches: [] });
    expect(missionOnly.querySelector("#mission-areas")?.textContent).toContain("not procurement eligibility");
    expect(doc.querySelector("aside[aria-label='Capability record']")?.textContent).toContain("Organization reviewed");
    expect(doc.querySelector("#defence-needs")?.textContent).toContain("eligibility");
    const targets = [...doc.querySelectorAll("nav[aria-label='On this page'] a")].map(anchor => doc.querySelector(anchor.getAttribute("href")!)!);
    expect(targets.every(Boolean)).toBe(true);
    for (let i = 1; i < targets.length; i++) expect(targets[i - 1].compareDocumentPosition(targets[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(doc.querySelector("#overview")!.compareDocumentPosition(doc.querySelector("#technical-profile")!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(doc.querySelector("#maturity")?.closest("#use-integration")).not.toBeNull();
    const before = doc.body.textContent;
    doc.querySelectorAll("details").forEach(details => { details.open = true; });
    expect(doc.body.textContent).toBe(before);
    const sparse = render(previewOrganization.capabilities[1]);
    expect(sparse.querySelector("#mission-areas")).toBeNull();
    expect(sparse.querySelector("#defence-needs")).toBeNull();
    expect(sparse.querySelector("a[href='#mission-areas']")).toBeNull();
    expect(sparse.querySelector("#evidence-limits")?.textContent).toContain("Commercial availability is not established");
  });

  it("keeps capability identity and safe map state through save and correction handoffs", () => {
    const capability = previewOrganization.capabilities[0];
    const mapReturnTo = safeAtlasReturn("https://malicious.example/");
    const doc = render(capability, mapReturnTo);
    const saves = [...doc.querySelectorAll("a[href^='/collections?']")];
    expect(saves).toHaveLength(2);
    for (const save of saves) {
      const query = new URL(save.getAttribute("href")!, "https://truenorthmap.ca").searchParams;
      expect(query.get("addType")).toBe("capability");
      expect(query.get("addId")).toBe(capability.id);
      expect(query.get("returnTo")).toBe(`/capabilities/${capability.slug}`);
    }
    expect(doc.querySelector("a[href^='/submit?']")?.getAttribute("href")).toContain(`targetType=capability&targetId=${capability.id}`);
    const download = doc.querySelector("a[data-export-download]")!;
    expect(download.textContent).toBe("Sign in to download");
    expect(new URL(download.getAttribute("href")!, "https://truenorthmap.ca").searchParams.get("next")).toBe(`/api/export?type=capability-dossier&slug=${capability.slug}`);
  });
});
