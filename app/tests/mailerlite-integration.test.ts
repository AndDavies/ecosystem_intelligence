import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  isRecentMailerLitePreferenceEvent,
  matchesMailerLitePreferenceCenterActivity,
  parseMailerLiteWebhook,
  parseMailerLiteWebhookEvents,
  signalAlertsAreConfigured,
  upsertMailerLiteSubscriber,
  verifyMailerLitePreferenceCenterGroupChange,
  verifyMailerLiteSignature
} from "@/lib/email/mailerlite";
import { parseMailerLiteCampaignAggregate } from "@/lib/email/mailerlite-campaign-metrics";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("MailerLite subscriber integration", () => {
  it("verifies a signed raw webhook body", () => {
    const body = JSON.stringify({ id: "123", email: "person@example.ca", event: "subscriber.unsubscribed", status: "unsubscribed" });
    const signature = createHmac("sha256", "test-secret").update(body).digest("hex");
    expect(verifyMailerLiteSignature(body, signature, "test-secret")).toBe(true);
    expect(verifyMailerLiteSignature(`${body} `, signature, "test-secret")).toBe(false);
  });

  it("maps delivery events without confusing them with local consent", () => {
    expect(parseMailerLiteWebhook({ id: 123, email: " Person@Example.ca ", event: "subscriber.bounced", status: "bounced" })).toEqual({
      id: "123",
      email: "person@example.ca",
      event: "subscriber.bounced",
      providerStatus: "bounced",
      groupId: null,
      groupAction: null,
      occurredAt: null
    });
    expect(parseMailerLiteWebhook({ id: "123", email: "person@example.ca", event: "campaign.sent", status: "active" })).toBeNull();
  });

  it("accepts MailerLite batch payloads without dropping deletion events", () => {
    expect(parseMailerLiteWebhookEvents([
      { id: "123", email: "one@example.ca", event: "subscriber.deleted", status: "active" },
      { id: "456", email: "two@example.ca", event: "subscriber.unsubscribed", status: "unsubscribed" },
      { id: "789", email: "three@example.ca", event: "campaign.sent", status: "active" }
    ])).toEqual([
      { id: "123", email: "one@example.ca", event: "subscriber.deleted", providerStatus: "deleted", groupId: null, groupAction: null, occurredAt: null },
      { id: "456", email: "two@example.ca", event: "subscriber.unsubscribed", providerStatus: "unsubscribed", groupId: null, groupAction: null, occurredAt: null }
    ]);
  });

  it("accepts the provider's batch envelope and nested subscriber records", () => {
    expect(parseMailerLiteWebhookEvents({
      events: [
        {
          type: "subscriber.unsubscribed",
          subscriber: {
            id: 456,
            email: " Two@Example.ca ",
            // MailerLite documents this field as active on the unsubscribe
            // event, so the event type remains authoritative.
            status: "active"
          }
        },
        {
          type: "subscriber.deleted",
          subscriber: {
            id: "789",
            email: "three@example.ca",
            status: "active"
          }
        },
        { type: "campaign.open", subscriber: { id: "999", email: "ignored@example.ca", status: "active" } }
      ],
      total: 3
    })).toEqual([
      { id: "456", email: "two@example.ca", event: "subscriber.unsubscribed", providerStatus: "unsubscribed", groupId: null, groupAction: null, occurredAt: null },
      { id: "789", email: "three@example.ca", event: "subscriber.deleted", providerStatus: "deleted", groupId: null, groupAction: null, occurredAt: null }
    ]);
  });

  it("distinguishes group preference changes from a global unsubscribe", () => {
    expect(parseMailerLiteWebhook({
      type: "subscriber.removed_from_group",
      created_at: "2026-08-26T12:00:00Z",
      subscriber: { id: "123", email: "person@example.ca", status: "active" },
      group: { id: "weekly-group" }
    })).toEqual({
      id: "123",
      email: "person@example.ca",
      event: "subscriber.removed_from_group",
      providerStatus: "active",
      groupId: "weekly-group",
      groupAction: "removed",
      occurredAt: "2026-08-26T12:00:00.000Z"
    });
  });

  it("upserts a subscriber into only the configured group", async () => {
    vi.stubEnv("MAILERLITE_API_TOKEN", "private-token");
    vi.stubEnv("MAILERLITE_GROUP_ID", "tnm-group");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: { id: "subscriber-1", email: "person@example.ca", status: "active" } }), { status: 200 }));

    await expect(upsertMailerLiteSubscriber("person@example.ca")).resolves.toMatchObject({ id: "subscriber-1", status: "active" });
    expect(fetchMock).toHaveBeenCalledWith("https://connect.mailerlite.com/api/subscribers", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ email: "person@example.ca", groups: ["tnm-group"] })
    }));
  });

  it("keeps the optional alert surface inactive until every provider dependency is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_DEFENCE_SIGNAL_ALERTS_ENABLED", "true");
    vi.stubEnv("MAILERLITE_API_TOKEN", "private-token");
    vi.stubEnv("MAILERLITE_MASTER_GROUP_ID", "master");
    vi.stubEnv("MAILERLITE_WEEKLY_GROUP_ID", "weekly");
    expect(signalAlertsAreConfigured()).toBe(false);
    vi.stubEnv("MAILERLITE_SIGNAL_ALERTS_GROUP_ID", "alerts");
    expect(signalAlertsAreConfigured()).toBe(false);
    vi.stubEnv("MAILERLITE_PREFERENCE_CENTER_ENABLED", "true");
    expect(signalAlertsAreConfigured()).toBe(false);
    vi.stubEnv("MAILERLITE_PREFERENCE_ACTIVITY_VERIFIED", "true");
    expect(signalAlertsAreConfigured()).toBe(true);
  });

  it("requires an exact, recent Preference Center activity before group membership can evidence consent", () => {
    const eventTime = "2026-08-26T12:00:00Z";
    expect(matchesMailerLitePreferenceCenterActivity({ data: [{
      log_name: "preference_center",
      properties: { group_id: "alerts" },
      created_at: "2026-08-26T12:01:00Z"
    }] }, "alerts", eventTime)).toBe(true);
    expect(matchesMailerLitePreferenceCenterActivity({ data: [{
      log_name: "added_to_group",
      properties: { group_id: "alerts" },
      created_at: "2026-08-26T12:01:00Z"
    }] }, "alerts", eventTime)).toBe(false);
    expect(matchesMailerLitePreferenceCenterActivity({ data: [{
      log_name: "preference_center",
      properties: { group_id: "weekly" },
      created_at: "2026-08-26T12:01:00Z"
    }] }, "alerts", eventTime)).toBe(false);
    expect(matchesMailerLitePreferenceCenterActivity({ data: [{
      log_name: "preference_center",
      properties: { group_id: "alerts" },
      created_at: "2026-08-26 12:01:00"
    }] }, "alerts", eventTime)).toBe(false);
  });

  it("requires an explicit timezone-qualified webhook time that is fresh at receipt", () => {
    const receivedAt = "2026-08-26T12:04:00Z";
    expect(isRecentMailerLitePreferenceEvent("2026-08-26T12:00:00Z", receivedAt)).toBe(true);
    expect(isRecentMailerLitePreferenceEvent(null, receivedAt)).toBe(false);
    expect(isRecentMailerLitePreferenceEvent("2026-08-26 12:00:00", receivedAt)).toBe(false);
    expect(isRecentMailerLitePreferenceEvent("2026-08-26T11:50:00Z", receivedAt)).toBe(false);
    expect(parseMailerLiteWebhook({
      type: "subscriber.added_to_group",
      created_at: "2026-08-26 12:00:00",
      subscriber: { id: "123", email: "person@example.ca", status: "active" },
      group: { id: "alerts" }
    })?.occurredAt).toBeNull();
  });

  it("fails closed when the Preference Center activity lookup cannot be verified", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEFENCE_SIGNAL_ALERTS_ENABLED", "true");
    vi.stubEnv("MAILERLITE_API_TOKEN", "private-token");
    vi.stubEnv("MAILERLITE_MASTER_GROUP_ID", "master");
    vi.stubEnv("MAILERLITE_WEEKLY_GROUP_ID", "weekly");
    vi.stubEnv("MAILERLITE_SIGNAL_ALERTS_GROUP_ID", "alerts");
    vi.stubEnv("MAILERLITE_PREFERENCE_CENTER_ENABLED", "true");
    vi.stubEnv("MAILERLITE_PREFERENCE_ACTIVITY_VERIFIED", "true");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("provider unavailable"));
    await expect(verifyMailerLitePreferenceCenterGroupChange(
      "subscriber-1",
      "alerts",
      "2026-08-26T12:00:00Z",
      "2026-08-26T12:01:00Z"
    )).resolves.toBe(false);
  });

  it("reduces a sent campaign to bounded aggregate metrics without subscriber data", () => {
    expect(parseMailerLiteCampaignAggregate({
      data: {
        id: "campaign-42",
        status: "sent",
        finished_at: "2026-08-26T12:30:00Z",
        stats: {
          sent: 100,
          unique_opens_count: 45,
          unique_clicks_count: 12,
          unsubscribes_count: 2,
          hard_bounces_count: 3,
          soft_bounces_count: 1
        },
        subscribers: [{ email: "must-not-be-imported@example.ca" }]
      }
    })).toEqual({
      providerCampaignId: "campaign-42",
      status: "sent",
      completedAt: "2026-08-26T12:30:00.000Z",
      sent: 100,
      delivered: 96,
      estimatedUniqueOpens: 45,
      uniqueClicks: 12,
      bounces: 4,
      unsubscribes: 2
    });
    expect(parseMailerLiteCampaignAggregate({ data: { id: "draft-1", status: "draft", stats: { sent: 0 } } })).toBeNull();
  });
});
