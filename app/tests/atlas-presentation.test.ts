import { describe, expect, it } from "vitest";
import {
  organizationOfferingGap,
  organizationOfferingTitle,
  organizationSnapshotTitle,
  organizationWebsiteLabel,
  publicContactFromProfileData
} from "@/lib/atlas/presentation";

describe("public profile language", () => {
  it("names a company's reviewed offering as its technology", () => {
    expect(organizationOfferingTitle("company", "Bell Textron Canada")).toBe("Bell Textron Canada’s Tech");
    expect(organizationSnapshotTitle("company")).toBe("Company snapshot");
    expect(organizationWebsiteLabel("company")).toBe("Visit company website");
  });

  it("uses language suited to non-company organizations", () => {
    expect(organizationOfferingTitle("research_test_centre", "DRDC Atlantic")).toBe("Facilities & Expertise");
    expect(organizationOfferingTitle("accelerator", "North Forge")).toBe("Programs & Support");
    expect(organizationOfferingTitle("investor_funder", "Fund")).toBe("Investment Focus");
    expect(organizationOfferingGap("investor_funder", "Fund")).toContain("investor’s focus or criteria");
    expect(organizationOfferingTitle("ecosystem_organization", "Network")).toBe("What Network Offers");
  });
});

describe("public contact presentation", () => {
  it("reads only valid public contact fields", () => {
    expect(publicContactFromProfileData({
      publicContact: {
        contactPageUrl: "https://example.ca/contact",
        publicEmail: "hello@example.ca",
        publicPhone: "+1 902 555 0100",
        linkedInUrl: "https://www.linkedin.com/company/example"
      }
    })).toEqual({
      contactPageUrl: "https://example.ca/contact",
      publicEmail: "hello@example.ca",
      publicPhone: "+1 902 555 0100",
      linkedInUrl: "https://www.linkedin.com/company/example"
    });
  });

  it("drops malformed, private, and unsafe values", () => {
    expect(publicContactFromProfileData({
      publicContact: {
        contactPageUrl: "javascript:alert(1)",
        publicEmail: "not-an-email",
        publicPhone: "x".repeat(81),
        linkedInUrl: "http://linkedin.com/company/example"
      }
    })).toEqual({ contactPageUrl: null, publicEmail: null, publicPhone: null, linkedInUrl: null });
  });
});
