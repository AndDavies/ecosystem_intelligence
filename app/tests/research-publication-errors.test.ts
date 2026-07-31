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
});
