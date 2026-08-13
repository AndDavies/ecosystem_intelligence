import { describe, expect, it } from "vitest";
import { publicProfileData } from "@/lib/atlas/public-profile-data";

describe("public organization profile projection", () => {
  it("retains role-appropriate public fields and sanitized contact details", () => {
    expect(publicProfileData({
      portfolioScope: "Published sensing and integration systems.",
      mandate: "Not a company field.",
      publicContact: {
        contactPageUrl: "https://example.ca/contact",
        publicEmail: "INFO@EXAMPLE.CA",
        publicPhone: "+1 613 555 0100",
        linkedInUrl: "javascript:alert(1)"
      }
    }, "company")).toEqual({
      portfolioScope: "Published sensing and integration systems.",
      publicContact: {
        contactPageUrl: "https://example.ca/contact",
        publicEmail: "INFO@EXAMPLE.CA",
        publicPhone: "+1 613 555 0100"
      }
    });
  });

  it("removes internal lineage and fields belonging to another organization role", () => {
    expect(publicProfileData({
      mandate: "Supports Canadian dual-use founders.",
      reviewed_candidate_id: "candidate-private",
      reviewed_by: "reviewer-private",
      research_schema_version: "private-schema",
      ingestion_batch_id: "batch-private",
      portfolioScope: "Not an accelerator field."
    }, "accelerator")).toEqual({ mandate: "Supports Canadian dual-use founders." });
  });
});
