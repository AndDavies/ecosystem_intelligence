// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DownloadLink } from "@/components/atlas/download-link";
const href = "/api/export?export=atlas-results&organizationIds=a%2Cb&type=company";
afterEach(() => { vi.unstubAllGlobals(); });
describe("download sign-in controls", () => {
  it.each([false, true])("shows the correct label and destination for signedIn=%s", async signedIn => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ signedIn }) }));
    const container = document.createElement("div"); const root = createRoot(container);
    await act(async () => { root.render(React.createElement(DownloadLink, { href }, "Download profile")); });
    const link = container.querySelector("a")!;
    expect(link.textContent).toBe(signedIn ? "Download profile" : "Sign in to download");
    expect(link.getAttribute("href")).toBe(signedIn ? href : `/sign-in?next=${encodeURIComponent(href)}`);
    await act(async () => { root.unmount(); });
  });
  it("fails safely to sign-in if session lookup is unavailable", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const container = document.createElement("div"); const root = createRoot(container);
    await act(async () => { root.render(React.createElement(DownloadLink, { href }, "Download")); });
    expect(container.textContent).toBe("Sign in to download");
    await act(async () => { root.unmount(); });
  });
});
