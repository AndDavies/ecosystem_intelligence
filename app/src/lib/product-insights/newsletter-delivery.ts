export type NewsletterCampaignMetricSnapshot = {
  provider_campaign_id: string;
  observed_at: string;
  sent: number;
  delivered: number;
  estimated_unique_opens: number;
  unique_clicks: number;
  bounces: number;
  unsubscribes: number;
};

export type NewsletterDeliveryRunAnchor = {
  provider_campaign_id?: string | null;
  completed_at?: string | null;
};

export type NewsletterDeliveryWindow = {
  windowDays: number;
  campaigns: number;
  sent: number;
  delivered: number;
  estimatedUniqueOpens: number;
  uniqueClicks: number;
  bounces: number;
  unsubscribes: number;
};

export function buildNewsletterDeliveryWindows(
  snapshots: NewsletterCampaignMetricSnapshot[],
  deliveryRuns: NewsletterDeliveryRunAnchor[],
  now = new Date(),
  windows: readonly number[] = [7, 14, 28]
) {
  const completedAt = new Map(deliveryRuns
    .filter((run): run is NewsletterDeliveryRunAnchor & { provider_campaign_id: string } => Boolean(run.provider_campaign_id))
    .map((run) => [run.provider_campaign_id, run.completed_at ?? null]));
  const latest = new Map<string, NewsletterCampaignMetricSnapshot>();
  for (const snapshot of [...snapshots].sort((left, right) => Date.parse(right.observed_at) - Date.parse(left.observed_at))) {
    if (!latest.has(snapshot.provider_campaign_id)) latest.set(snapshot.provider_campaign_id, snapshot);
  }
  return windows.map((windowDays) => {
    const since = now.getTime() - windowDays * 24 * 60 * 60 * 1000;
    const rows = Array.from(latest.values()).filter((snapshot) => {
      const anchor = completedAt.get(snapshot.provider_campaign_id);
      const timestamp = anchor ? Date.parse(anchor) : NaN;
      return Number.isFinite(timestamp) && timestamp >= since && timestamp <= now.getTime() + 5 * 60 * 1000;
    });
    return rows.reduce<NewsletterDeliveryWindow>((summary, row) => ({
      windowDays,
      campaigns: summary.campaigns + 1,
      sent: summary.sent + row.sent,
      delivered: summary.delivered + row.delivered,
      estimatedUniqueOpens: summary.estimatedUniqueOpens + row.estimated_unique_opens,
      uniqueClicks: summary.uniqueClicks + row.unique_clicks,
      bounces: summary.bounces + row.bounces,
      unsubscribes: summary.unsubscribes + row.unsubscribes
    }), { windowDays, campaigns: 0, sent: 0, delivered: 0, estimatedUniqueOpens: 0, uniqueClicks: 0, bounces: 0, unsubscribes: 0 });
  });
}
