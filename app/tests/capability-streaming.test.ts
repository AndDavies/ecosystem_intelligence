import React from "react";
import { describe, expect, it, vi } from "vitest";
import { previewOrganization } from "@/lib/atlas/dossier-preview-fixtures";

const mocks = vi.hoisted(() => ({ core: vi.fn(), related: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.stubGlobal("React", React);
vi.mock("@/lib/atlas/repository", () => ({ getAtlasCapabilityBySlug: mocks.core }));
vi.mock("@/components/atlas/capability-related-content", () => ({ CapabilityRelatedContent: mocks.related }));
import CapabilityPage from "@/app/capabilities/[slug]/page";

it("returns the real core and an independent Suspense boundary without invoking related reads", async () => {
  mocks.core.mockResolvedValue({ organization: previewOrganization, capability: previewOrganization.capabilities[0] });
  mocks.related.mockImplementation(() => new Promise(() => {}));
  const page = await CapabilityPage({ params: Promise.resolve({ slug: "fixture" }), searchParams: Promise.resolve({ returnTo: "https://invalid.example" }) });
  expect(page.props.capability).toBe(previewOrganization.capabilities[0]);
  expect(page.props.mapReturnTo).toBe("/map");
  expect(page.props.relatedContent.type).toBe(React.Suspense);
  expect(mocks.related).not.toHaveBeenCalled();
});

describe("core access boundary", () => {
  it("does not render the dossier when a published capability is missing", async () => {
    mocks.core.mockResolvedValue(null);
    await expect(CapabilityPage({ params: Promise.resolve({ slug: "missing" }), searchParams: Promise.resolve({}) })).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });
});
