import { describe, expect, it } from "vitest";
import { getApprovedNorthSignalSample } from "@/lib/north-signal/public-sample";
import { pathHasContextualNorthSignalSignup, showsContextualNorthSignalSignup } from "@/lib/north-signal/contextual-placement";

describe("newsletter presentation boundaries", () => {
  it("does not publish the private sample before editorial approval", () => {
    expect(getApprovedNorthSignalSample()).toBeNull();
  });
  it("offers the same inline signup on new and existing public profiles", () => {
    for (const slug of ["kraken-robotics", "a-future-published-record"]) {
      expect(showsContextualNorthSignalSignup("organization",slug)).toBe(true);
      expect(showsContextualNorthSignalSignup("capability",slug)).toBe(true);
      expect(pathHasContextualNorthSignalSignup(`/organizations/${slug}`)).toBe(true);
      expect(pathHasContextualNorthSignalSignup(`/capabilities/${slug}`)).toBe(true);
    }
    expect(pathHasContextualNorthSignalSignup("/sign-in")).toBe(false);
    expect(pathHasContextualNorthSignalSignup("/collections/private-id")).toBe(false);
  });
});
