import { describe, expect, it } from "vitest";
import { getFeaturedUseCase, resolveUseCaseConfig } from "@/lib/use-case-config";

describe("use-case configuration", () => {
  it("applies slug-specific overrides for configured use cases", () => {
    const config = resolveUseCaseConfig(
      {
        slug: "distributed-sensor-networks",
        name: "Distributed Sensor Networks"
      },
      [{ name: "ISR & Sensing" }]
    );

    expect(config.cardBadge).toBe("Networked monitoring");
    expect(config.detail.topTargetsTitle).toBe("Priority Network Targets");
    expect(config.insightCopy.deploymentReadyLabel).toBe("rollout-ready");
  });

  it("falls back to generic defaults for unknown use cases", () => {
    const config = resolveUseCaseConfig({
      slug: "future-mission-area",
      name: "Future Mission Area"
    });

    expect(config.cardBadge).toBe("Strategic lens");
    expect(config.detail.decisionGuideTitle).toBe("Recommended Actions");
    expect(config.detail.orientation.exampleQuestion).toBe("Who should we engage first for Future Mission Area, and why now?");
    expect(config.homeActionLabel).toBe("Export Top Targets CSV");
  });

  it("selects the configured featured use case when available", () => {
    const featured = getFeaturedUseCase([
      {
        id: "use-case-1",
        slug: "distributed-sensor-networks",
        name: "Distributed Sensor Networks"
      },
      {
        id: "use-case-2",
        slug: "arctic-domain-awareness",
        name: "Arctic Domain Awareness"
      }
    ]);

    expect(featured?.useCase.slug).toBe("arctic-domain-awareness");
    expect(featured?.config.featured).toBe(true);
  });
});
