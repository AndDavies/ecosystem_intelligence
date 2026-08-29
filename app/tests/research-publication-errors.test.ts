import { describe, expect, it } from "vitest";
import { researchPublicationErrorRedirect } from "../src/lib/research/publication-errors";

describe("research publication diagnostics", () => {
  it("identifies the stale refresh without exposing candidate payloads", () => {
    expect(researchPublicationErrorRedirect({
      code: "P0001",
      message: "Refresh candidate 622647bd-e3e6-4caa-a56d-08dee4a61f05 (sample-organization) has a stale baseline."
    })).toBe("/admin/publish?error=stale-refresh&candidate=622647bd-e3e6-4caa-a56d-08dee4a61f05&record=sample-organization");
  });

  it("identifies timestamp precision failures and retains safe fallbacks", () => {
    expect(researchPublicationErrorRedirect({
      code: "22023",
      message: "Refresh candidate 622647bd-e3e6-4caa-a56d-08dee4a61f05 (sample-organization) has inconsistent timestamp precision."
    })).toContain("error=refresh-baseline");
    expect(researchPublicationErrorRedirect({ code: "XX000", message: "Unexpected database error" }))
      .toBe("/admin/publish?error=publication-failed");
  });

  it("identifies an unpaired current-activity refresh", () => {
    expect(researchPublicationErrorRedirect({
      code: "P0001",
      message: "Published current activity and its as-of date must remain paired."
    })).toBe("/admin/publish?error=activity-pair");
  });

  it("identifies stale child baselines and preserves only safe identifiers", () => {
    expect(researchPublicationErrorRedirect({
      code: "22023",
      message: "Refresh candidate 0f87e88c-0b09-44d2-917f-5e240d931bb7 has a stale child baseline for capability 72beb3c1-e557-4cab-a672-17b04ea056dd."
    })).toBe("/admin/publish?error=stale-child&candidate=0f87e88c-0b09-44d2-917f-5e240d931bb7&childType=capability&child=72beb3c1-e557-4cab-a672-17b04ea056dd");
  });

  it("identifies canonical program conflicts and keeps a single selected candidate recoverable", () => {
    expect(researchPublicationErrorRedirect({
      code: "P0001",
      message: "Existing program innovative-solutions-canada-testing-stream does not match the reviewed canonical program payload."
    }, "0f87e88c-0b09-44d2-917f-5e240d931bb7")).toBe("/admin/publish?error=canonical-program-conflict&program=innovative-solutions-canada-testing-stream&candidate=0f87e88c-0b09-44d2-917f-5e240d931bb7");
  });
});
