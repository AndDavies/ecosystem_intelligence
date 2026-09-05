import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { assistantSubjectFingerprint, requestFingerprint } from "@/lib/product-insights/server";

const request = (ip?: string, userAgent = "Browser", extra: Record<string,string> = {}) => new Request("https://truenorthmap.ca", {
  headers: { ...(ip ? { "x-forwarded-for": ip } : {}), "user-agent": userAgent, ...extra }
});
describe("private abuse-control subject", () => {
  it("does not reset for different browser user agents", () => {
    expect(requestFingerprint(request("8.8.8.8", "Browser A"))).toBe(requestFingerprint(request("8.8.8.8", "Browser B")));
    expect(requestFingerprint(request("8.8.8.8"))).not.toBe(requestFingerprint(request("1.1.1.1")));
  });
  it("normalizes equivalent IPv6 and IPv4-mapped addresses", () => {
    expect(requestFingerprint(request("2001:4860:0000:0000:0000:0000:0000:8888"))).toBe(requestFingerprint(request("2001:4860::8888")));
    expect(requestFingerprint(request("::ffff:8.8.8.8"))).toBe(requestFingerprint(request("8.8.8.8")));
  });
  it("uses the Vercel origin header over an upstream forwarding value", () => {
    expect(requestFingerprint(request("1.1.1.1", "Browser", { "x-vercel-forwarded-for": "8.8.8.8" }))).toBe(requestFingerprint(request("8.8.8.8")));
  });
  it.each(["invalid", "8.8.8.8, 1.1.1.1", "2001:4860::1%eth0"])("puts malformed or missing origin addresses in one conservative bucket: %s", (ip) => {
    expect(requestFingerprint(request(ip))).toBe(requestFingerprint(request()));
  });
  it("keeps signed-in users stable across networks without storing their identifier", () => {
    const fingerprint = assistantSubjectFingerprint(request("8.8.8.8"), "member-123");
    expect(fingerprint).toBe(assistantSubjectFingerprint(request("1.1.1.1"), "member-123"));
    expect(fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(fingerprint).not.toBe(assistantSubjectFingerprint(request("8.8.8.8"), "member-456"));
  });
});
