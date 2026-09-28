// @vitest-environment jsdom
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ExecutiveOrganizationDossier } from "@/components/atlas/executive-organization-dossier";
import { DossierParagraphs } from "@/components/atlas/dossier-reading";
import { dossierParagraphs, organizationPresentationCopySchema, capabilityPresentationCopySchema, presentationCopyGuidance, reviewedPresentationDraft } from "@/lib/atlas/dossier-presentation-copy";
import { organizationDossierSources } from "@/lib/atlas/organization-dossier-sources";
import { profileFixture, fixtureRelated, type FixtureKey } from "@/app/dev/profile-design/fixtures";

vi.mock("@/components/atlas/public-page-shell", () => ({ PublicPageShell: ({ pageHeader, children }: { pageHeader: React.ReactNode; children: React.ReactNode }) => React.createElement("main", {}, pageHeader, children) }));
vi.mock("@/components/atlas/north-signal-signup", () => ({ NorthSignalInline: () => null }));
vi.mock("@/components/atlas/public-share", () => ({ PublicShare: () => React.createElement("button", {}, "Share") }));
vi.mock("server-only", () => ({}));
vi.stubGlobal("React", React);

function render(key: FixtureKey) {
  const organization = profileFixture(key);
  const doc = document.implementation.createHTMLDocument();
  doc.body.innerHTML = renderToStaticMarkup(React.createElement(ExecutiveOrganizationDossier, { organization, profilePath: `/organizations/${organization.slug}`, mapReturnTo: "/map?domain=autonomy", relatedIntelligence: fixtureRelated, trackEngagement: false }));
  return { doc, organization };
}

describe("optional reviewed presentation copy", () => {
  it("accepts qualified long copy with guidance, without shortening it or accepting narrative/assessment fields", () => {
    const long = `${"A scoped offering. ".repeat(40)}Qualification: this configuration has not entered service.`;
    expect(organizationPresentationCopySchema.parse({ displayLead: long }).displayLead).toBe(long);
    expect(presentationCopyGuidance({ displayLead: long })).toHaveLength(1);
    expect(organizationPresentationCopySchema.parse({})).toEqual({});
    expect(capabilityPresentationCopySchema.parse({})).toEqual({});
    expect(organizationPresentationCopySchema.safeParse({ description: long }).success).toBe(false);
    expect(capabilityPresentationCopySchema.safeParse({ executiveRelevanceSummary: long }).success).toBe(false);
    const draft = { organization: { displayLead: long }, capabilities: { known: { catalogueTeaser: long } } };
    expect(reviewedPresentationDraft(draft, ["known"], true).capabilities.known.catalogueTeaser).toBe(long);
    expect(() => reviewedPresentationDraft(draft, ["other"], true)).toThrow();
    expect(() => reviewedPresentationDraft(draft, ["known"], false)).toThrow();
  });

  it("preserves CRLF and blank-line paragraph boundaries as escaped text", () => {
    const input = "First paragraph.\r\n\r\nSecond paragraph.\n \n<script>unsafe()</script>";
    expect(dossierParagraphs(input)).toEqual(["First paragraph.", "Second paragraph.", "<script>unsafe()</script>"]);
    const doc = document.implementation.createHTMLDocument();
    doc.body.innerHTML = renderToStaticMarkup(React.createElement(DossierParagraphs, { text: input }));
    expect(doc.querySelectorAll("p")).toHaveLength(3);
    expect(doc.querySelector("script")).toBeNull();
    expect(doc.body.textContent).toContain("<script>unsafe()</script>");
    expect(renderToStaticMarkup(React.createElement(DossierParagraphs, { text: "   " }))).toBe("");
  });
});

describe("Option A dossier content and handoffs", () => {
  it("keeps all eight capabilities and full paragraphs, with navigation only to rendered targets", () => {
    const { doc, organization } = render("long");
    const rows = doc.querySelectorAll("#capabilities > article");
    expect(rows).toHaveLength(8);
    organization.capabilities.forEach((capability, i) => {
      expect(rows[i].querySelector("h3 a")?.getAttribute("href")).toBe(`/capabilities/${capability.slug}`);
      for (const paragraph of dossierParagraphs(capability.summary)) expect(rows[i].textContent).toContain(paragraph);
      expect(rows[i].querySelector("details")?.hasAttribute("open")).toBe(false);
    });
    expect(doc.querySelector("#capabilities")!.compareDocumentPosition(doc.querySelector("#company-context")!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    for (const anchor of doc.querySelectorAll("nav[aria-label='On this page'] a")) expect(doc.querySelector(anchor.getAttribute("href")!)).not.toBeNull();
    expect(doc.querySelector("#profile")).not.toBeNull();
    expect(doc.querySelector("#geography")).not.toBeNull();
    expect(doc.querySelector("#commercial-context")).not.toBeNull();
  });

  it("omits absent short copy and optional modules while retaining the full narrative and neutral identity", () => {
    const { doc, organization } = render("sparse");
    expect(doc.querySelector("header")?.textContent).not.toContain(organization.description);
    expect(doc.querySelector("#company-context")?.textContent).toContain(organization.description);
    for (const id of ["why-now", "operating-context", "commercial", "public-record", "connections", "questions", "sources"]) expect(doc.getElementById(id)).toBeNull();
    expect(doc.querySelector("header img")).toBeNull();
    const centre = render("centre").doc;
    expect(centre.querySelector("#company-context h2")?.textContent).toBe("Organization context");
    expect(centre.querySelector("#commercial h2")?.textContent).toBe("Operating model and access");
  });

  it("keeps source scope, distinct passages, public-record context and guarded actions", () => {
    const { doc, organization } = render("connections");
    const source = organization.citations[0];
    organization.citations.push({ ...source, id: "second-passage", excerpt: "A different qualified passage.", sourceLocator: "Annex B" });
    const grouped = organizationDossierSources(organization).find(row => row.source.sourceUrl === source.sourceUrl)!;
    expect(grouped.evidence.map(item => item.citation.id)).toContain("second-passage");
    expect(doc.querySelectorAll("#source-library > li").length).toBeLessThanOrEqual(4);
    for (const row of organizationDossierSources(organization).flatMap(row => row.evidence).filter(row => row.citation.id !== "second-passage")) expect(doc.getElementById(`citation-${row.citation.id}`)).not.toBeNull();
    expect(doc.querySelector("#connections")?.textContent).toContain(organization.capabilities[0].missionMatches[0].alignmentSummary);
    expect(doc.querySelector("#public-record")?.textContent).toContain(organization.programs[0].programName);
    const save = doc.querySelector("a[href^='/collections?']")!;
    const query = new URL(save.getAttribute("href")!, "https://truenorthmap.ca").searchParams;
    expect(query.get("addType")).toBe("organization");
    expect(query.get("addId")).toBe(organization.id);
    expect(doc.querySelector("a[data-export-download]")?.textContent).toContain("Sign in to download");
    expect(doc.querySelector("a[data-profile-action='map_open']")?.getAttribute("href")).toContain("domain=autonomy");
    expect(doc.querySelector("a[data-profile-action='mission_open']")).not.toBeNull();
  });
});


it("uses content density, not a capability-count maximum, for supporting panels", async () => {
 const {catalogueSupportsAside,featuresSupportAside}=await import("@/lib/atlas/dossier-layout");
 const {profileFixture}=await import("@/app/dev/profile-design/fixtures");
 const org=profileFixture("kraken");
 const noTeaser=org.capabilities.map(cap=>({...cap,presentationCopy:undefined}));
 expect(catalogueSupportsAside(noTeaser,"A long qualified assessment. ".repeat(35),3)).toBe(false);
 expect(catalogueSupportsAside(Array.from({length:12},(_,i)=>({...org.capabilities[0],id:`many-${i}`})),"A bounded assessment.",2)).toBe(true);
 expect(catalogueSupportsAside([],"Assessment only",1)).toBe(false);
 expect(featuresSupportAside([],['Application'])).toBe(false);
 expect(featuresSupportAside(['Feature'],['Long qualified application. '.repeat(50)])).toBe(false);
});
