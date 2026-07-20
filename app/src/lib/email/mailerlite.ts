import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const API_BASE = "https://connect.mailerlite.com/api";

export type MailerLiteSubscriberStatus = "active" | "unsubscribed" | "unconfirmed" | "bounced" | "junk";

type MailerLiteSubscriber = {
  id: string;
  email: string;
  status: MailerLiteSubscriberStatus;
};

type MailerLiteResponse = {
  data?: MailerLiteSubscriber;
  message?: string;
};

export function hasMailerLiteEnv() {
  return Boolean(process.env.MAILERLITE_API_TOKEN?.trim() && process.env.MAILERLITE_GROUP_ID?.trim());
}

export function hasMailerLiteWebhookEnv() {
  return Boolean(process.env.MAILERLITE_WEBHOOK_SECRET?.trim());
}

export async function upsertMailerLiteSubscriber(email: string): Promise<MailerLiteSubscriber> {
  const token = process.env.MAILERLITE_API_TOKEN?.trim();
  const groupId = process.env.MAILERLITE_GROUP_ID?.trim();
  if (!token || !groupId) throw new Error("MailerLite is not configured.");

  const response = await fetch(`${API_BASE}/subscribers`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, groups: [groupId] }),
    signal: AbortSignal.timeout(8_000)
  });
  const payload = await response.json().catch(() => ({})) as MailerLiteResponse;
  if (!response.ok || !payload.data?.id || !payload.data.email || !payload.data.status) {
    throw new Error(safeProviderError(payload.message, response.status));
  }
  return payload.data;
}

export async function unsubscribeMailerLiteSubscriber(subscriberId: string) {
  const token = process.env.MAILERLITE_API_TOKEN?.trim();
  if (!token) throw new Error("MailerLite is not configured.");
  const response = await fetch(`${API_BASE}/subscribers/${encodeURIComponent(subscriberId)}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status: "unsubscribed" }),
    signal: AbortSignal.timeout(8_000)
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as MailerLiteResponse;
    throw new Error(safeProviderError(payload.message, response.status));
  }
}

export function verifyMailerLiteSignature(rawBody: string, signature: string | null, secret = process.env.MAILERLITE_WEBHOOK_SECRET?.trim()) {
  if (!secret || !signature || !/^[a-f\d]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const receivedBuffer = Buffer.from(signature.toLowerCase(), "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

export function parseMailerLiteWebhook(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;
  const email = typeof record.email === "string" ? record.email.trim().toLowerCase() : "";
  const id = typeof record.id === "string" || typeof record.id === "number" ? String(record.id) : "";
  const event = typeof record.event === "string" ? record.event : "";
  const status = typeof record.status === "string" ? record.status : "";
  if (!email || !id || !event.startsWith("subscriber.")) return null;

  const providerStatus = event === "subscriber.deleted"
    ? "deleted"
    : event === "subscriber.bounced"
      ? "bounced"
      : event === "subscriber.spam_reported"
        ? "junk"
        : event === "subscriber.unsubscribed"
          ? "unsubscribed"
          : status === "active" || status === "unsubscribed" || status === "unconfirmed" || status === "bounced" || status === "junk"
            ? status
            : null;

  if (!providerStatus) return null;
  return { email, id, event, providerStatus };
}

function safeProviderError(message: string | undefined, status: number) {
  const normalized = message?.replace(/\s+/g, " ").trim();
  return (normalized ? `MailerLite ${status}: ${normalized}` : `MailerLite request failed with status ${status}.`).slice(0, 1000);
}
