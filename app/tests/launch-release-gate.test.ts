import { describe, expect, it } from "vitest";
import {
  buildLaunchTargets,
  inspectLaunchHtml,
  isLaunchOperationalFinding,
  launchAuditLockCanBeReplaced,
  launchAuditPressureExceeded,
  MAX_SUPPORTING_AUDIT_PAGES,
  parseCanonicalSitemapPaths,
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
    expect(isLaunchOperationalFinding({ url: "/organizations/example", issue: "Missing meta description" })).toBe(false);
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
    expect(supportingAuditHealthProbeDue(9)).toBe(false);
    expect(supportingAuditHealthProbeDue(10)).toBe(true);
    expect(supportingAuditHealthProbeDue(20)).toBe(true);
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
