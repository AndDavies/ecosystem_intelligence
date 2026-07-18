import { describe, expect, it } from "vitest";
import { isAtlasAdminOwner } from "@/lib/atlas/admin-owner";
import { getAuthBaseUrl, isRecentSignIn, safeAuthNextPath } from "@/lib/auth-utils";

describe("public account safeguards", () => {
  it("accepts only the exact administrator identity and controlled role", () => {
    expect(isAtlasAdminOwner({ id: "b443c433-2a78-4ca7-8a19-a8f40b140049", email: "M.Andrew.Davies@gmail.com", role: "admin" })).toBe(true);
    expect(isAtlasAdminOwner({ id: "b443c433-2a78-4ca7-8a19-a8f40b140049", email: "m.andrew.davies@gmail.com", role: "reviewer" })).toBe(false);
    expect(isAtlasAdminOwner({ id: "00000000-0000-4000-8000-000000000000", email: "m.andrew.davies@gmail.com", role: "admin" })).toBe(false);
  });

  it("keeps authentication return paths local", () => {
    expect(safeAuthNextPath("/account?reauth=delete")).toBe("/account?reauth=delete");
    expect(safeAuthNextPath("https://example.com")).toBe("/collections");
    expect(safeAuthNextPath("//example.com")).toBe("/collections");
  });

  it("uses the canonical domain for production authentication callbacks", () => {
    expect(getAuthBaseUrl("https://truenorthmap.ca/", "production")).toBe("https://truenorthmap.ca");
    expect(getAuthBaseUrl(undefined, "production")).toBe("https://truenorthmap.ca");
    expect(getAuthBaseUrl("javascript:alert(1)", "production")).toBe("https://truenorthmap.ca");
    expect(getAuthBaseUrl("http://truenorthmap.ca", "production")).toBe("https://truenorthmap.ca");
    expect(getAuthBaseUrl(undefined, "development")).toBe("http://localhost:3000");
  });

  it("requires a recent sign-in for deletion", () => {
    expect(isRecentSignIn(new Date().toISOString())).toBe(true);
    expect(isRecentSignIn(new Date(Date.now() - 16 * 60 * 1000).toISOString())).toBe(false);
  });
});
