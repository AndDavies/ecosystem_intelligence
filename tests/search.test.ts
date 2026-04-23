import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { searchRecords } from "@/lib/data/repository";
import { mergeUniqueById, rankSearchResults, scoreTextMatch } from "@/lib/search";

describe("search helpers", () => {
  it("prefers stronger name matches over weaker summary matches", () => {
    const results = rankSearchResults(
      [
        {
          id: "cap-1",
          name: "Autonomy Planner",
          summary: "Operational planning workspace"
        },
        {
          id: "cap-2",
          name: "Mission Console",
          summary: "Autonomy support for distributed systems"
        }
      ],
      "autonomy",
      [
        { label: "Name", weight: 4, value: (item) => item.name },
        { label: "Summary", weight: 1, value: (item) => item.summary }
      ]
    );

    expect(results[0]?.item.id).toBe("cap-1");
    expect(results[0]?.matchContext).toBe("Matched name");
  });

  it("deduplicates merged search rows by id while preserving first result order", () => {
    expect(
      mergeUniqueById(
        [
          { id: "use-case-1", name: "Cold Weather Monitoring" },
          { id: "use-case-2", name: "Remote Communications" }
        ],
        [
          { id: "use-case-2", name: "Remote Communications" },
          { id: "use-case-3", name: "Coastal Sensing" }
        ]
      )
    ).toEqual([
      { id: "use-case-1", name: "Cold Weather Monitoring" },
      { id: "use-case-2", name: "Remote Communications" },
      { id: "use-case-3", name: "Coastal Sensing" }
    ]);
  });

  it("scores exact matches above partial matches", () => {
    expect(scoreTextMatch("autonomy", "autonomy")).toBeGreaterThan(
      scoreTextMatch("autonomy", "autonomy-enabled platform")
    );
  });

  it("returns domains and richer record context in search results", async () => {
    const domainResults = await searchRecords("sensing");
    expect(domainResults.domains.some((item) => item.slug === "isr-sensing")).toBe(true);

    const companyResults = await searchRecords("polar");
    const capability = companyResults.capabilities.find((item) => item.id === "capability-2");
    expect(capability?.companyName).toBe("Polar Mesh");
    expect(capability?.domainName).toBe("Cyber & Data");

    const company = companyResults.companies.find((item) => item.id === "company-2");
    expect(company?.domainNames).toContain("Cyber & Data");
    expect(company?.useCaseCount).toBeGreaterThan(0);
  });
});
