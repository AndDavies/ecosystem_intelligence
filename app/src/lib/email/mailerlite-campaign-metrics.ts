import "server-only";

const API_BASE = "https://connect.mailerlite.com/api";

type MailerLiteCampaignStats = {
  sent?: unknown;
  unique_opens_count?: unknown;
  unique_clicks_count?: unknown;
  unsubscribes_count?: unknown;
  hard_bounces_count?: unknown;
  soft_bounces_count?: unknown;
};

type MailerLiteCampaignPayload = {
  data?: {
    id?: unknown;
    status?: unknown;
    finished_at?: unknown;
    stats?: MailerLiteCampaignStats;
  };
  message?: unknown;
};

export type MailerLiteCampaignAggregate = {
  providerCampaignId: string;
  status: "sent";
  completedAt: string | null;
  sent: number;
  delivered: number;
  estimatedUniqueOpens: number;
  uniqueClicks: number;
  bounces: number;
  unsubscribes: number;
};

export function parseMailerLiteCampaignAggregate(payload: unknown): MailerLiteCampaignAggregate | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const campaign = (payload as MailerLiteCampaignPayload).data;
  if (!campaign || typeof campaign !== "object" || campaign.status !== "sent") return null;
  const providerCampaignId = typeof campaign.id === "string" || typeof campaign.id === "number"
    ? String(campaign.id)
    : "";
  if (!providerCampaignId || providerCampaignId.length > 120) return null;
  const stats = campaign.stats;
  if (!stats || typeof stats !== "object") return null;
  if (![stats.sent, stats.unique_opens_count, stats.unique_clicks_count, stats.hard_bounces_count, stats.soft_bounces_count, stats.unsubscribes_count].every(isCount)) return null;
  const sent = boundedCount(stats.sent);
  const estimatedUniqueOpens = Math.min(sent, boundedCount(stats.unique_opens_count));
  const uniqueClicks = Math.min(sent, boundedCount(stats.unique_clicks_count));
  const bounces = Math.min(sent, boundedCount(stats.hard_bounces_count) + boundedCount(stats.soft_bounces_count));
  const unsubscribes = Math.min(sent, boundedCount(stats.unsubscribes_count));
  return {
    providerCampaignId,
    status: "sent",
    completedAt: explicitProviderTimestamp(campaign.finished_at),
    sent,
    delivered: Math.max(0, sent - bounces),
    estimatedUniqueOpens,
    uniqueClicks,
    bounces,
    unsubscribes
  };
}

export async function readMailerLiteCampaignAggregate(campaignId: string): Promise<MailerLiteCampaignAggregate> {
  const token = process.env.MAILERLITE_API_TOKEN?.trim();
  if (!token) throw new Error("MailerLite is not configured.");
  const response = await fetch(`${API_BASE}/campaigns/${encodeURIComponent(campaignId)}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000)
  });
  const payload = await response.json().catch(() => ({})) as MailerLiteCampaignPayload;
  if (!response.ok) {
    const message = typeof payload.message === "string" ? payload.message.replace(/\s+/g, " ").trim() : "";
    throw new Error((message ? `MailerLite ${response.status}: ${message}` : `MailerLite campaign read failed with status ${response.status}.`).slice(0, 1000));
  }
  const aggregate = parseMailerLiteCampaignAggregate(payload);
  if (!aggregate || aggregate.providerCampaignId !== campaignId) {
    throw new Error("MailerLite did not return a sent campaign aggregate for that ID.");
  }
  return aggregate;
}

function boundedCount(value: unknown) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : 0;
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function isCount(value: unknown) {
  if (typeof value !== "number" && (typeof value !== "string" || !/^\d+$/.test(value))) return false;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0;
}

function explicitProviderTimestamp(value: unknown) {
  if (typeof value !== "string" || !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}
