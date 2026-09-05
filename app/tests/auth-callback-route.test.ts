import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ exchange: vi.fn(), configured: true }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { exchangeCodeForSession: state.exchange } }) }));
vi.mock("@/lib/supabase/env", () => ({ hasSupabasePublicEnv: () => state.configured }));
import { GET } from "@/app/auth/callback/route";

const origin = "https://truenorthmap.ca";
function request(next?: string, extra: Record<string, string> = {}) {
  const url = new URL("/auth/callback", origin);
  if (next !== undefined) url.searchParams.set("next", next);
  Object.entries(extra).forEach(([key, value]) => url.searchParams.set(key, value));
  return new Request(url);
}

describe("authentication callback return boundary", () => {
  beforeEach(() => {
    state.configured = true;
    state.exchange.mockReset().mockResolvedValue({ error: null });
  });

  it.each([undefined, "//example.com", "/\\example.com", "/\\\\example.com", "/\u0000example.com", "/\nexample.com", "https://example.com"])("rejects decoded external or unsafe next values: %j", async (next) => {
    const response = await GET(request(next));
    expect(response.headers.get("location")).toBe(`${origin}/collections`);
    expect(state.exchange).not.toHaveBeenCalled();
  });

  it("preserves a legitimate map return including query and fragment after sign-in", async () => {
    const next = "/map?domain=maritime&selected=record#results";
    const response = await GET(request(next, { code: "valid-code" }));
    expect(response.headers.get("location")).toBe(origin + next);
    expect(state.exchange).toHaveBeenCalledWith("valid-code");
  });

  it.each(["provider", "exchange"])("keeps the %s error branch local and its return value safe", async (branch) => {
    if (branch === "exchange") state.exchange.mockResolvedValue({ error: { message: "invalid code" } });
    const response = await GET(request("/\\example.com", branch === "provider" ? { error: "access_denied" } : { code: "invalid-code" }));
    const destination = new URL(response.headers.get("location")!);
    expect(destination.origin).toBe(origin);
    expect(destination.pathname).toBe("/sign-in");
    expect(destination.searchParams.get("next")).toBe("/collections");
  });

  it("retains the unconfigured-environment home redirect", async () => {
    state.configured = false;
    expect((await GET(request("/collections"))).headers.get("location")).toBe(`${origin}/`);
  });
});
