import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ user: vi.fn(), reserve: vi.fn(), outcome: vi.fn(), organizations: vi.fn(), organization: vi.fn(), capability: vi.fn(), region: vi.fn(), pdf: vi.fn(), client: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/atlas/auth", () => ({ getAtlasUser: mocks.user }));
vi.mock("@/lib/export/access", () => ({ reserveExportRequest: mocks.reserve, recordExportOutcome: mocks.outcome }));
vi.mock("@/lib/atlas/repository", () => ({ getAtlasOrganizationsForExport: mocks.organizations, getAtlasOrganizationBySlug: mocks.organization, getAtlasCapabilityBySlug: mocks.capability, getAtlasRegionBySlug: mocks.region, getAtlasOrganizationsForCollection: vi.fn() }));
vi.mock("@/lib/export/atlas-pdf", () => ({ renderOrganizationDossierPdf: mocks.pdf, renderCapabilityDossierPdf: mocks.pdf, renderRegionReportPdf: mocks.pdf, renderCollectionLookbookPdf: mocks.pdf }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
import { GET } from "@/app/api/export/route";
const types = ["atlas-results", "organization-dossier", "capability-dossier", "region-report", "collection-lookbook"];
const request = (type: string, headers?: HeadersInit) => new Request(`https://truenorthmap.ca/api/export?type=${type}&slug=example&id=private`, { headers });
beforeEach(() => { vi.resetAllMocks(); mocks.user.mockResolvedValue(null); mocks.reserve.mockResolvedValue({ allowed: true, retryAfter: 0 }); mocks.organizations.mockResolvedValue([]); });
describe("export authorization before expensive work", () => {
  it.each(types)("rejects anonymous %s without loading records, quota or rendering", async (type) => {
    const response = await GET(request(type));
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.reserve).not.toHaveBeenCalled();
    for (const load of [mocks.organizations, mocks.organization, mocks.capability, mocks.region, mocks.pdf, mocks.client]) expect(load).not.toHaveBeenCalled();
    expect(mocks.outcome).toHaveBeenCalledWith(type, "authentication_required", 401, expect.any(Number));
  });
  it("preserves full download intent for browser sign-in and legacy CSV links", async () => {
    const req = new Request("https://truenorthmap.ca/api/export?export=atlas-results&type=company&organizationIds=a%2Cb", { headers: { accept: "text/html" } });
    const response = await GET(req);
    const location = new URL(response.headers.get("location")!);
    expect(response.status).toBe(303);
    expect(location.origin).toBe("https://truenorthmap.ca");
    expect(location.pathname).toBe("/sign-in");
    expect(location.searchParams.get("next")).toBe(new URL(req.url).pathname + new URL(req.url).search);
  });
  it.each(["member", "editor", "admin"])("allows a genuine %s account and records generation separately from a click", async (role) => {
    mocks.user.mockResolvedValue({ id: "verified-user", role });
    const response = await GET(request("atlas-results"));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(mocks.reserve).toHaveBeenCalledWith("verified-user");
    expect(mocks.outcome).toHaveBeenCalledWith("atlas-results", "generated", 200, expect.any(Number));
  });
  it("enforces the same quota across types before reading or rendering", async () => {
    mocks.user.mockResolvedValue({ id: "user" }); mocks.reserve.mockResolvedValue({ allowed: false, retryAfter: 600 });
    for (const type of types) {
      const response = await GET(request(type));
      expect(response.status).toBe(429); expect(response.headers.get("retry-after")).toBe("600");
    }
    expect(mocks.pdf).not.toHaveBeenCalled(); expect(mocks.organization).not.toHaveBeenCalled();
  });
  it("fails closed when authentication or atomic reservation is unavailable", async () => {
    mocks.user.mockRejectedValueOnce(new Error("auth failed"));
    expect((await GET(request("atlas-results"))).status).toBe(503);
    mocks.user.mockResolvedValue({ id: "user" }); mocks.reserve.mockRejectedValue(new Error("database failed"));
    expect((await GET(request("atlas-results"))).status).toBe(503);
    expect(mocks.organizations).not.toHaveBeenCalled();
  });
  it("retains shortlist ownership checks after authentication", async () => {
    mocks.user.mockResolvedValue({ id: "owner" });
    const eq = vi.fn().mockReturnThis(); const single = vi.fn().mockResolvedValue({ data: null, error: new Error("not owned") });
    mocks.client.mockResolvedValue({ from: () => ({ select: () => ({ eq, single }) }) });
    eq.mockReturnValue({ eq, single });
    expect((await GET(request("collection-lookbook"))).status).toBe(404);
    expect(eq).toHaveBeenCalledWith("owner_id", "owner"); expect(mocks.pdf).not.toHaveBeenCalled();
  });
});
