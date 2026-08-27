import { describe, expect, it } from "vitest";
import {
  buildDefenceSignalAlertDescription,
  createDefenceSignalAlertBaseline,
  defenceSignalAlertTopics,
  defenceSignalAlertSchedule,
  defenceSignalEmailUtm,
  selectDefenceSignalAlertCandidates,
  type DefenceSignalFeedItem
} from "@/lib/email/defence-signal-alerts";

const editions: DefenceSignalFeedItem[] = [
  { guid: "https://truenorthmap.ca/signals/older", url: "https://truenorthmap.ca/signals/older", slug: "older", title: "Older", publishedAt: "2026-08-24T12:00:00Z" },
  { guid: "https://truenorthmap.ca/signals/current", url: "https://truenorthmap.ca/signals/current", slug: "current", title: "Current", publishedAt: "2026-08-25T12:00:00Z" }
];

describe("Defence Signal alert delivery contract", () => {
  it("baselines the current edition so the archive cannot become a backlog", () => {
    const baseline = createDefenceSignalAlertBaseline(editions);
    expect(baseline).toEqual({ latestGuid: editions[1].guid, latestPublishedAt: editions[1].publishedAt });
    expect(selectDefenceSignalAlertCandidates({ items: editions, baseline, deliveredGuids: new Set() })).toEqual([]);
  });

  it("uses stable GUIDs to prevent correction and delivery duplicates", () => {
    const baseline = createDefenceSignalAlertBaseline(editions);
    const newEdition = { guid: "https://truenorthmap.ca/signals/new", url: "https://truenorthmap.ca/signals/new", slug: "new", title: "New", publishedAt: "2026-08-26T12:00:00Z" };
    const correctedCurrent = { ...editions[1], title: "Corrected title" };
    expect(selectDefenceSignalAlertCandidates({ items: [...editions, correctedCurrent, newEdition], baseline, deliveredGuids: new Set() })).toEqual([newEdition]);
    expect(selectDefenceSignalAlertCandidates({ items: [...editions, newEdition], baseline, deliveredGuids: new Set([newEdition.guid]) })).toEqual([]);
  });

  it("does nothing for no-publish, draft, missing-feed or route-failure inputs", () => {
    const baseline = createDefenceSignalAlertBaseline(editions);
    expect(selectDefenceSignalAlertCandidates({ items: [], baseline, deliveredGuids: new Set() })).toEqual([]);
    expect(selectDefenceSignalAlertCandidates({ items: editions, baseline: { latestGuid: null, latestPublishedAt: null }, deliveredGuids: new Set() })).toEqual([]);
  });

  it("locks the Halifax schedule and bounded email attribution", () => {
    expect(defenceSignalAlertSchedule).toEqual({ localTime: "08:00", timeZone: "America/Halifax" });
    expect(defenceSignalEmailUtm("Edition One", "Read Signal")).toBe("utm_source=mailerlite&utm_medium=email&utm_campaign=defence_signal_alerts&utm_content=edition-one_read-signal");
  });

  it("builds the provider RSS body from concrete topics and a published limit", () => {
    const topics = defenceSignalAlertTopics([
      { title: "First development", links: [{ label: "Organization: Kraken Robotics" }, { label: "Capability: KATFISH" }] },
      { title: "Second development", links: [{ label: "Kraken Robotics" }, { label: "Public Need: Persistent underwater surveillance" }] }
    ]);
    expect(topics).toEqual(["Kraken Robotics", "KATFISH", "Persistent underwater surveillance"]);
    expect(buildDefenceSignalAlertDescription({
      executiveSummary: "A source-linked summary of what changed.",
      topics,
      principalLimit: "Delivery and operational acceptance are not established."
    })).toBe("A source-linked summary of what changed.\n\nTopics in this edition: Kraken Robotics; KATFISH; Persistent underwater surveillance.\n\nPrincipal limit: Delivery and operational acceptance are not established.");
  });
});
