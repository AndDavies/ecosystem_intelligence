import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildInternalLinkInventory,
  buildLaunchTargets,
  classifyDurableSourceProbes,
  extractMarkedDurableSourceLinks,
  extractNormalizedSameOriginLinks,
  inspectLaunchHtml,
  inspectNextStreamState,
  isLaunchOperationalFinding,
  launchAuditLockCanBeReplaced,
  launchAuditPressureExceeded,
  MAX_INTERNAL_LINK_TARGETS,
  MAX_OUTBOUND_DURABLE_SOURCE_TARGETS,
  MAX_SUPPORTING_AUDIT_PAGES,
  parseCanonicalSitemapPaths,
  publicOutboundUrlIssue,
  recoveredLaunchWarningsBlock,
  selectLaunchPaths,
  supportingAuditHealthProbeDue,
  supportingAuditStopReason
} from "@/lib/launch/release-gate";

const canonical = "https://truenorthmap.ca";
const sitemapPaths = [
  "/",
  "/organizations",
  "/map",
  "/signals",
  "/north-signal",
  "/organizations/example",
  "/capabilities/example",
  "/missions/example",
  "/demand/example",
  "/briefs/example",
  "/signals/latest-edition"
];

function sitemapXml(paths = sitemapPaths) {
  return `<urlset>${paths.map((path) => `<url><loc>${canonical}${path}</loc></url>`).join("")}</urlset>`;
}

describe("bounded launch release gate", () => {
  it("selects core routes, one representative per public family and explicit affected paths", () => {
    const parsed = parseCanonicalSitemapPaths(sitemapXml(), canonical);
    expect(selectLaunchPaths(parsed, canonical, ["/signals/latest-edition"])).toEqual(sitemapPaths);
  });

  it("rewrites candidate fetches without weakening production canonicals", () => {
    const targets = buildLaunchTargets(
      ["/north-signal", "/signals/latest-edition"],
      "http://127.0.0.1:3000",
      canonical
    );
    expect(targets).toEqual([
      {
        path: "/north-signal",
        fetchUrl: "http://127.0.0.1:3000/north-signal",
        canonicalUrl: "https://truenorthmap.ca/north-signal"
      },
      {
        path: "/signals/latest-edition",
        fetchUrl: "http://127.0.0.1:3000/signals/latest-edition",
        canonicalUrl: "https://truenorthmap.ca/signals/latest-edition"
      }
    ]);
  });

  it("rejects mixed sitemap and requested-route origins", () => {
    expect(() => parseCanonicalSitemapPaths(
      `<urlset><url><loc>https://example.com/north-signal</loc></url></urlset>`,
      canonical
    )).toThrow("unexpected origin");
    expect(() => selectLaunchPaths(sitemapPaths, canonical, ["https://example.com/north-signal"]))
      .toThrow("must remain on");
  });

  it("rejects an affected route that is absent from the public sitemap", () => {
    expect(() => selectLaunchPaths(sitemapPaths, canonical, ["/not-released"]))
      .toThrow("absent from the sitemap");
  });

  it("keeps the gate bounded and requires one route from every public family", () => {
    expect(() => selectLaunchPaths(sitemapPaths, canonical, Array.from({ length: 11 }, (_, index) => `/extra-${index}`)))
      .toThrow("at most 10 explicit paths");
    expect(() => selectLaunchPaths(sitemapPaths.filter((path) => !path.startsWith("/briefs/")), canonical))
      .toThrow("route family is absent");
  });

  it("separates operational blockers from site-audit inventory", () => {
    expect(isLaunchOperationalFinding({ url: "/organizations?page=2", issue: "Supporting list page returned HTTP 500" })).toBe(true);
    expect(isLaunchOperationalFinding({ url: "/organizations/example", issue: "Rendered application error document" })).toBe(true);
    expect(isLaunchOperationalFinding({ url: "/organizations/example", issue: "Missing meta description" })).toBe(true);
    expect(isLaunchOperationalFinding({ url: "/organizations/example", issue: "Missing title" })).toBe(true);
    expect(isLaunchOperationalFinding({ url: "/about", issue: "Missing title" })).toBe(false);
  });

  it("fails closed on streamed RSC errors and unresolved loading boundaries", () => {
    expect(inspectNextStreamState('<template id="B:1"></template><script>$RC("B:1","S:1")</script>', "/organizations/healthy")).toEqual([]);
    expect(inspectNextStreamState('<template id="B:1"></template>', "/organizations/pending")).toContainEqual({
      url: "/organizations/pending",
      issue: "Unresolved streamed loading boundary"
    });
    expect(inspectNextStreamState('<template id="B:1"></template><script>$RX("B:1","","digest-123")</script>', "/organizations/broken"))
      .toContainEqual({ url: "/organizations/broken", issue: "React Server Component error digest" });
    const errorRow = JSON.stringify('1:E{"digest":"digest-456"}\n');
    expect(inspectNextStreamState(`<script>self.__next_f.push([1,${errorRow}])</script>`, "/organizations/flight-error"))
      .toContainEqual({ url: "/organizations/flight-error", issue: "React Server Component error digest" });
    const healthyMetadata = JSON.stringify('1:{"error":null,"digest":"$undefined"}\n');
    expect(inspectNextStreamState(`<script>self.__next_f.push([1,${healthyMetadata}])</script>`, "/organizations/healthy-metadata"))
      .toEqual([]);
  });

  it("distinguishes an unresolved route shell from a healthy streamed fallback", () => {
    const loading = '<main aria-busy="true"><p>Loading published organizations…</p></main>';
    expect(inspectNextStreamState(loading, "/organizations/example")).toContainEqual({
      url: "/organizations/example",
      issue: "Unresolved route loading shell"
    });
    const resolved = `${loading}<title>Example</title><link rel="canonical" href="https://truenorthmap.ca/organizations/example"><h1>Example</h1>`;
    expect(inspectNextStreamState(resolved, "/organizations/example")).toEqual([]);
  });

  it("stops a full audit after repeated pressure and preserves a live lock", () => {
    expect(launchAuditPressureExceeded([false, true, false, true, false, true])).toBe(true);
    expect(launchAuditPressureExceeded([false, true, false, false, true])).toBe(false);
    const now = Date.parse("2026-08-11T12:00:00Z");
    expect(launchAuditLockCanBeReplaced({ heartbeatAt: "2026-08-11T09:00:00Z" }, now, now - 3 * 60 * 60 * 1_000, true, 2 * 60 * 60 * 1_000)).toBe(false);
    expect(launchAuditLockCanBeReplaced({ heartbeatAt: "2026-08-11T11:59:00Z" }, now, now - 60_000, false, 2 * 60 * 60 * 1_000)).toBe(true);
    expect(launchAuditLockCanBeReplaced({}, now, now - 3 * 60 * 60 * 1_000, null, 2 * 60 * 60 * 1_000)).toBe(true);
  });

  it("stops optional supporting pagination on its first recovery or operational failure", () => {
    const healthy = { status: 200, findings: [], warnings: [] };
    expect(supportingAuditStopReason(healthy)).toBeUndefined();
    expect(supportingAuditStopReason({
      ...healthy,
      warnings: [{ url: "/organizations?page=2", issue: "Recovered after initial HTTP 503" }]
    })).toContain("required a retry");
    expect(supportingAuditStopReason({
      status: 500,
      findings: [{ url: "/organizations?page=2", issue: "Supporting list page returned HTTP 500" }],
      warnings: []
    })).toContain("operational failure");
    expect(supportingAuditStopReason({
      status: 200,
      findings: [{ url: "/organizations?page=2", issue: "Supporting list page did not return HTML" }],
      warnings: []
    })).toContain("operational failure");
    expect(supportingAuditStopReason({
      status: 200,
      findings: [{ url: "/organizations?page=2", issue: "Supporting list page rendered an application error document" }],
      warnings: []
    })).toContain("operational failure");
  });

  it("bounds supporting pagination and schedules health checks during it", () => {
    expect(MAX_SUPPORTING_AUDIT_PAGES).toBe(50);
    expect(MAX_INTERNAL_LINK_TARGETS).toBe(2_500);
    expect(MAX_OUTBOUND_DURABLE_SOURCE_TARGETS).toBe(1_500);
    expect(supportingAuditHealthProbeDue(9)).toBe(false);
    expect(supportingAuditHealthProbeDue(10)).toBe(true);
    expect(supportingAuditHealthProbeDue(20)).toBe(true);
  });

  it("extracts only explicitly marked external durable-source anchors", () => {
    const links = extractMarkedDurableSourceLinks(`
      <a href="https://example.ca/report?utm_source=signals&amp;b=2&amp;a=1#finding" data-launch-durable-source="true">Source</a>
      <a data-launch-durable-source="true" href="https://example.ca/report?a=1&amp;b=2">Duplicate</a>
      <a href="https://social.example/post">Social</a>
      <a data-launch-durable-source="true" href="/methodology">Same-origin</a>
    `, canonical);
    expect(links).toEqual(["https://example.ca/report?a=1&b=2"]);
  });

  it("classifies outbound durable-source probes without turning access limits or uncertainty into broken links", () => {
    const probe = (status: number, finalUrl = "https://example.ca/source", redirected = false, transportError?: string) => ({
      status,
      finalUrl,
      redirected,
      ...(transportError ? { transportError } : {})
    });
    const source = "https://example.ca/source";
    expect(classifyDurableSourceProbes(source, [probe(200)])).toBe("healthy");
    expect(classifyDurableSourceProbes(source, [probe(200, "https://example.ca/current", true)])).toBe("redirected");
    expect(classifyDurableSourceProbes(source, [probe(404)])).toBe("transport_unknown");
    expect(classifyDurableSourceProbes(source, [probe(410)])).toBe("transport_unknown");
    expect(classifyDurableSourceProbes(source, [probe(404), probe(404)])).toBe("confirmed_broken");
    expect(classifyDurableSourceProbes(source, [probe(404), probe(410)])).toBe("confirmed_broken");
    expect(classifyDurableSourceProbes(source, [probe(503)])).toBe("transport_unknown");
    expect(classifyDurableSourceProbes(source, [probe(503), probe(502)])).toBe("confirmed_broken");
    expect(classifyDurableSourceProbes(source, [probe(503), probe(200)])).toBe("healthy");
    expect(classifyDurableSourceProbes(source, [probe(503), probe(0, source, false, "timeout")])).toBe("transport_unknown");
    expect(classifyDurableSourceProbes(source, [probe(403)])).toBe("bot_restricted");
    expect(classifyDurableSourceProbes(source, [probe(429)])).toBe("bot_restricted");
    expect(classifyDurableSourceProbes(source, [probe(0, source, false, "timeout")])).toBe("transport_unknown");
  });

  it("rejects private outbound source targets and every private DNS answer", () => {
    expect(publicOutboundUrlIssue("https://example.ca/report", ["8.8.8.8", "2606:4700:4700::1111"]))
      .toBeUndefined();
    expect(publicOutboundUrlIssue("http://127.0.0.1/report")).toContain("Private or reserved");
    expect(publicOutboundUrlIssue("http://[::1]/report")).toContain("Private or reserved");
    expect(publicOutboundUrlIssue("http://[::ffff:127.0.0.1]/report")).toContain("Private or reserved");
    expect(publicOutboundUrlIssue("http://[::127.0.0.1]/report")).toContain("Private or reserved");
    expect(publicOutboundUrlIssue("http://[fec0::1]/report")).toContain("Private or reserved");
    expect(publicOutboundUrlIssue("https://source.example.ca/report", ["10.0.0.8"]))
      .toContain("DNS resolved");
    expect(publicOutboundUrlIssue("https://source.local/report")).toContain("Private or reserved");
    expect(publicOutboundUrlIssue("file:///etc/passwd")).toContain("HTTP or HTTPS");
    expect(publicOutboundUrlIssue("https://user:password@example.ca/report")).toContain("credentials");
  });

  it("pins outbound assurance to validated DNS and handles redirects manually", async () => {
    const script = await readFile(join(process.cwd(), "scripts/audit-public-launch.ts"), "utf8");
    expect(script).toContain("resolvePinnedPublicAddress");
    expect(script).toContain("hostname: address.address");
    expect(script).toContain("publicOutboundUrlIssue(nextUrl)");
    expect(script).toContain("maxOutboundResponseBytes = 16_384");
    expect(script).toContain("withOutboundDeadline");
    expect(script).toContain("deadline = setTimeout");
    expect(script).toContain("response.destroy()");
    expect(script).not.toContain('redirect: "follow"');
  });

  it("marks only the public evidence renderers enrolled in outbound assurance", async () => {
    const files = await Promise.all([
      "src/components/atlas/evidence-list.tsx",
      "src/app/signals/[slug]/page.tsx",
      "src/app/briefs/[slug]/page.tsx"
    ].map((path) => readFile(join(process.cwd(), path), "utf8")));
    for (const source of files) {
      expect(source.match(/data-launch-durable-source="true"/g)).toHaveLength(1);
    }
    const additionalRenderers = await Promise.all([
      "src/components/atlas/executive-organization-dossier.tsx",
      "src/components/atlas/alignment-match-card.tsx",
      "src/components/atlas/atlas-explorer-results.tsx",
      "src/app/demand/[slug]/page.tsx"
    ].map((path) => readFile(join(process.cwd(), path), "utf8")));
    for (const source of additionalRenderers) {
      expect(source).toContain('data-launch-durable-source="true"');
    }
  });

  it("normalizes same-origin anchors before building a target-to-referrer inventory", () => {
    const first = extractNormalizedSameOriginLinks(`
      <a href="../capabilities/example?utm_source=nav&amp;b=2&amp;a=1#evidence">Capability</a>
      <a href="https://truenorthmap.ca/capabilities/example?a=1&amp;b=2">Duplicate</a>
      <a href="mailto:hello@truenorthmap.ca">Email</a>
      <a href="https://example.com/capabilities/example">External</a>
    `, `${canonical}/organizations/example`, canonical);
    const second = extractNormalizedSameOriginLinks(
      '<a href="/capabilities/example?b=2&amp;a=1#overview">Capability</a>',
      `${canonical}/signals/example`,
      canonical
    );

    expect(first).toEqual([`${canonical}/capabilities/example?a=1&b=2`]);
    expect(second).toEqual([`${canonical}/capabilities/example?a=1&b=2`]);
    expect(buildInternalLinkInventory([
      { url: `${canonical}/organizations/example`, internalLinks: first },
      { url: `${canonical}/signals/example`, internalLinks: second },
      { url: `${canonical}/organizations/example`, internalLinks: first }
    ])).toEqual([{
      targetUrl: `${canonical}/capabilities/example?a=1&b=2`,
      referrers: [`${canonical}/organizations/example`, `${canonical}/signals/example`]
    }]);
  });

  it("collapses navigation-only return paths and map state cross-products without losing each deep-link class", () => {
    const links = extractNormalizedSameOriginLinks(`
      <a href="/capabilities/radar?returnTo=%2Fmap%3Fmission%3Darctic%26selected%3Dorg-1">Capability</a>
      <a href="/map?selected=org-1">Selected record</a>
      <a href="/map?mission=arctic&amp;selected=org-1">Mission and record</a>
      <a href="/map?mission=arctic&amp;selected=org-2">Equivalent mission and record</a>
      <a href="/map?domain=sensing&amp;selected=org-1">Domain and record</a>
    `, `${canonical}/organizations/example`, canonical);

    expect(links).toEqual([
      `${canonical}/capabilities/radar`,
      `${canonical}/map?selected=org-1`,
      `${canonical}/map?mission=arctic`,
      `${canonical}/map?domain=sensing`
    ]);
  });

  it("allows one advisory recovery but blocks repeated launch-gate recovery", () => {
    expect(recoveredLaunchWarningsBlock(0)).toBe(false);
    expect(recoveredLaunchWarningsBlock(1)).toBe(false);
    expect(recoveredLaunchWarningsBlock(2)).toBe(true);
    expect(recoveredLaunchWarningsBlock(1, 0)).toBe(true);
  });

  it("validates metadata against the canonical origin while fetching a candidate origin", () => {
    const [target] = buildLaunchTargets(["/north-signal"], "http://127.0.0.1:3000", canonical);
    const html = `<!doctype html><html><head>
      <title>North Signal</title>
      <meta name="description" content="Weekly decision brief" />
      <link rel="canonical" href="https://truenorthmap.ca/north-signal" />
      <meta property="og:title" content="North Signal" />
      <meta property="og:image" content="https://truenorthmap.ca/og.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <script type="application/ld+json">{"@type":"WebPage"}</script>
    </head><body><img alt="" width="1600" height="900" /></body></html>`;
    expect(inspectLaunchHtml(html, target)).toEqual([]);
    expect(inspectLaunchHtml(html.replace(
      "https://truenorthmap.ca/north-signal",
      "https://truenorthmap.ca/signals"
    ), target).some((finding) => finding.issue.includes("Canonical mismatch"))).toBe(true);
    expect(inspectLaunchHtml(html.replace(
      "https://truenorthmap.ca/north-signal",
      "http://[invalid"
    ), target).some((finding) => finding.issue.includes("Invalid canonical"))).toBe(true);
  });
});
