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
  return Boolean(process.env.MAILERLITE_API_TOKEN?.trim() && mailerLiteGroups().master);
}

export function mailerLiteGroups() {
  return {
    master: process.env.MAILERLITE_MASTER_GROUP_ID?.trim() || process.env.MAILERLITE_GROUP_ID?.trim() || null,
    weekly: process.env.MAILERLITE_WEEKLY_GROUP_ID?.trim() || null,
    signalAlerts: process.env.MAILERLITE_SIGNAL_ALERTS_GROUP_ID?.trim() || null
  };
}

export function signalAlertsAreConfigured() {
  const groups = mailerLiteGroups();
  return process.env.NEXT_PUBLIC_DEFENCE_SIGNAL_ALERTS_ENABLED === "true"
    && process.env.MAILERLITE_PREFERENCE_CENTER_ENABLED === "true"
    && process.env.MAILERLITE_PREFERENCE_ACTIVITY_VERIFIED === "true"
    && Boolean(process.env.MAILERLITE_API_TOKEN?.trim() && groups.master && groups.weekly && groups.signalAlerts);
}

export function mailerLitePreferenceCenterIsConfigured() {
  return signalAlertsAreConfigured();
}

export function matchesMailerLitePreferenceCenterActivity(
  payload: unknown,
  groupId: string,
  occurredAt: string,
  toleranceMs = 5 * 60 * 1000
) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
  const rows = (payload as { data?: unknown }).data;
  if (!Array.isArray(rows)) return false;
  const eventTimestamp = explicitTimestamp(occurredAt);
  if (eventTimestamp === null) return false;
  return rows.slice(0, 20).some((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return false;
    const activity = row as Record<string, unknown>;
    if (activity.log_name !== "preference_center" && activity.log_name !== "marketing_preferences_change") return false;
    const properties = activity.properties && typeof activity.properties === "object" && !Array.isArray(activity.properties)
      ? activity.properties as Record<string, unknown>
      : {};
    const activityGroupId = typeof properties.group_id === "string" || typeof properties.group_id === "number"
      ? String(properties.group_id)
      : "";
    const activityTimestamp = explicitTimestamp(activity.created_at);
    return activityGroupId === groupId
      && activityTimestamp !== null
      && Math.abs(activityTimestamp - eventTimestamp) <= toleranceMs;
  });
}

export function isRecentMailerLitePreferenceEvent(
  occurredAt: string | null | undefined,
  receivedAt: string,
  toleranceMs = 5 * 60 * 1000
) {
  const eventTimestamp = explicitTimestamp(occurredAt);
  const receivedTimestamp = explicitTimestamp(receivedAt);
  return eventTimestamp !== null
    && receivedTimestamp !== null
    && Math.abs(receivedTimestamp - eventTimestamp) <= toleranceMs;
}

export async function verifyMailerLitePreferenceCenterGroupChange(subscriberId: string, groupId: string, occurredAt: string, receivedAt: string) {
  const token = process.env.MAILERLITE_API_TOKEN?.trim();
  if (!token || !mailerLitePreferenceCenterIsConfigured() || !isRecentMailerLitePreferenceEvent(occurredAt, receivedAt)) return false;
  for (const logName of ["preference_center", "marketing_preferences_change"]) {
    const url = new URL(`${API_BASE}/subscribers/${encodeURIComponent(subscriberId)}/activity-log`);
    url.searchParams.set("filter[log_name]", logName);
    url.searchParams.set("limit", "20");
    url.searchParams.set("page", "1");
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        cache: "no-store",
        signal: AbortSignal.timeout(8_000)
      });
      if (!response.ok) continue;
      const payload = await response.json().catch(() => ({}));
      if (matchesMailerLitePreferenceCenterActivity(payload, groupId, occurredAt)) return true;
    } catch {
      // Fail closed. An unverified provider activity never creates local consent.
    }
  }
  return false;
}

export function hasMailerLiteWebhookEnv() {
  return Boolean(process.env.MAILERLITE_WEBHOOK_SECRET?.trim());
}

export async function upsertMailerLiteSubscriber(
  email: string,
  preferences: { weekly?: boolean; signalAlerts?: boolean } = { weekly: true, signalAlerts: false }
): Promise<MailerLiteSubscriber> {
  const token = process.env.MAILERLITE_API_TOKEN?.trim();
  const configuredGroups = mailerLiteGroups();
  if (!token || !configuredGroups.master) throw new Error("MailerLite is not configured.");
  if (preferences.signalAlerts && !configuredGroups.signalAlerts) throw new Error("Defence Signal Alerts group is not configured.");
  const groups = [
    configuredGroups.master,
    preferences.weekly ? configuredGroups.weekly : null,
    preferences.signalAlerts ? configuredGroups.signalAlerts : null
  ].filter((group): group is string => Boolean(group));

  const response = await fetch(`${API_BASE}/subscribers`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, groups: Array.from(new Set(groups)) }),
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

export type MailerLiteWebhookEvent = {
  email: string;
  id: string;
  event: string;
  providerStatus: "active" | "unsubscribed" | "unconfirmed" | "bounced" | "junk" | "deleted" | null;
  groupId: string | null;
  groupAction: "added" | "removed" | null;
  occurredAt: string | null;
};

function asWebhookRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export function parseMailerLiteWebhook(payload: unknown): MailerLiteWebhookEvent | null {
  const record = asWebhookRecord(payload);
  if (!record) return null;
  const data = asWebhookRecord(record.data);
  const subscriber = asWebhookRecord(record.subscriber) ?? asWebhookRecord(data?.subscriber) ?? data ?? record;
  const group = asWebhookRecord(record.group) ?? asWebhookRecord(data?.group);
  const email = typeof subscriber.email === "string" ? subscriber.email.trim().toLowerCase() : "";
  const id = typeof subscriber.id === "string" || typeof subscriber.id === "number" ? String(subscriber.id) : "";
  const event = typeof record.event === "string"
    ? record.event
    : typeof record.type === "string"
      ? record.type
      : "";
  const status = typeof subscriber.status === "string" ? subscriber.status : "";
  if (!email || !id || !event.startsWith("subscriber.")) return null;
  const groupIdValue = group?.id;
  const groupId = typeof groupIdValue === "string" || typeof groupIdValue === "number" ? String(groupIdValue) : null;
  const groupAction = event === "subscriber.added_to_group"
    ? "added"
    : event === "subscriber.removed_from_group"
      ? "removed"
      : null;
  const occurredValue = record.created_at ?? record.occurred_at ?? record.timestamp ?? data?.created_at ?? data?.occurred_at;
  const occurredTimestamp = explicitTimestamp(occurredValue);
  const occurredAt = occurredTimestamp === null ? null : new Date(occurredTimestamp).toISOString();

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

  if (!providerStatus && !(groupAction && groupId)) return null;
  return { email, id, event, providerStatus, groupId, groupAction, occurredAt };
}

export function parseMailerLiteWebhookEvents(payload: unknown): MailerLiteWebhookEvent[] {
  const envelope = asWebhookRecord(payload);
  const records = Array.isArray(payload)
    ? payload
    : Array.isArray(envelope?.events)
      ? envelope.events
      : [payload];
  return records
    .slice(0, 50)
    .map((record) => parseMailerLiteWebhook(record))
    .filter((event): event is MailerLiteWebhookEvent => event !== null);
}

function safeProviderError(message: string | undefined, status: number) {
  const normalized = message?.replace(/\s+/g, " ").trim();
  return (normalized ? `MailerLite ${status}: ${normalized}` : `MailerLite request failed with status ${status}.`).slice(0, 1000);
}

function explicitTimestamp(value: unknown) {
  if (typeof value !== "string" || !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}
