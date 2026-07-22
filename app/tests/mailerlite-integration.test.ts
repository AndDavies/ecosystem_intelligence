import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  parseMailerLiteWebhook,
  parseMailerLiteWebhookEvents,
  upsertMailerLiteSubscriber,
  verifyMailerLiteSignature
} from "@/lib/email/mailerlite";

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
      providerStatus: "bounced"
    });
    expect(parseMailerLiteWebhook({ id: "123", email: "person@example.ca", event: "campaign.sent", status: "active" })).toBeNull();
  });

  it("accepts MailerLite batch payloads without dropping deletion events", () => {
    expect(parseMailerLiteWebhookEvents([
      { id: "123", email: "one@example.ca", event: "subscriber.deleted", status: "active" },
      { id: "456", email: "two@example.ca", event: "subscriber.unsubscribed", status: "unsubscribed" },
      { id: "789", email: "three@example.ca", event: "campaign.sent", status: "active" }
    ])).toEqual([
      { id: "123", email: "one@example.ca", event: "subscriber.deleted", providerStatus: "deleted" },
      { id: "456", email: "two@example.ca", event: "subscriber.unsubscribed", providerStatus: "unsubscribed" }
    ]);
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
});
