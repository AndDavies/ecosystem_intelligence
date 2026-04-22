export type FreshnessTone = "success" | "info" | "muted" | "danger";

export interface FreshnessState {
  label: string;
  tone: FreshnessTone;
  detail: string;
  lastActivityAt: string | null;
  lastUpdatedAt: string | null;
  lastSignalAt: string | null;
  daysSinceActivity: number | null;
  staleCount?: number;
  isStale: boolean;
}

type FreshnessInput = {
  lastUpdatedAt?: string | null;
  lastSignalAt?: string | null;
  staleAfterDays?: number;
};

function parseDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function getDaysSince(date: Date | null) {
  if (!date) {
    return null;
  }

  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function describeActivity(daysSinceActivity: number | null) {
  if (daysSinceActivity === null) {
    return "No dated activity";
  }

  if (daysSinceActivity === 0) {
    return "Updated today";
  }

  if (daysSinceActivity === 1) {
    return "Updated 1 day ago";
  }

  return `Updated ${daysSinceActivity} days ago`;
}

function buildDetail({
  daysSinceActivity,
  staleAfterDays,
  updatedAt,
  signalAt
}: {
  daysSinceActivity: number | null;
  staleAfterDays: number;
  updatedAt: Date | null;
  signalAt: Date | null;
}) {
  const parts: string[] = [];

  if (signalAt) {
    parts.push(`Last signal ${describeActivity(daysSinceActivity)}`);
  } else if (updatedAt) {
    parts.push(`Record ${describeActivity(daysSinceActivity)}`);
  }

  if (updatedAt) {
    const updatedDays = getDaysSince(updatedAt);
    if (updatedDays !== null) {
      parts.push(`reviewed ${updatedDays === daysSinceActivity ? "at the same time" : `${updatedDays} days ago`}`);
    }
  }

  parts.push(`review threshold ${staleAfterDays} days`);

  return parts.join(" · ");
}

export function getFreshnessState(input: FreshnessInput): FreshnessState {
  const staleAfterDays = input.staleAfterDays ?? 180;
  const updatedAt = parseDate(input.lastUpdatedAt ?? null);
  const signalAt = parseDate(input.lastSignalAt ?? null);
  const lastActivity = signalAt ?? updatedAt ?? null;
  const daysSinceActivity = getDaysSince(lastActivity);

  if (!lastActivity) {
    return {
      label: "No recent evidence",
      tone: "danger",
      detail: "No dated update or signal is attached yet.",
      lastActivityAt: null,
      lastUpdatedAt: input.lastUpdatedAt ?? null,
      lastSignalAt: input.lastSignalAt ?? null,
      daysSinceActivity: null,
      isStale: true
    };
  }

  if (daysSinceActivity !== null && daysSinceActivity > staleAfterDays) {
    return {
      label: "Stale",
      tone: "danger",
      detail: buildDetail({
        daysSinceActivity,
        staleAfterDays,
        updatedAt,
        signalAt
      }),
      lastActivityAt: lastActivity.toISOString(),
      lastUpdatedAt: input.lastUpdatedAt ?? null,
      lastSignalAt: input.lastSignalAt ?? null,
      daysSinceActivity,
      isStale: true
    };
  }

  if (daysSinceActivity !== null && daysSinceActivity > Math.floor(staleAfterDays * 0.66)) {
    return {
      label: "Needs review soon",
      tone: "muted",
      detail: buildDetail({
        daysSinceActivity,
        staleAfterDays,
        updatedAt,
        signalAt
      }),
      lastActivityAt: lastActivity.toISOString(),
      lastUpdatedAt: input.lastUpdatedAt ?? null,
      lastSignalAt: input.lastSignalAt ?? null,
      daysSinceActivity,
      isStale: false
    };
  }

  if (daysSinceActivity !== null && daysSinceActivity > 90) {
    return {
      label: "Current",
      tone: "info",
      detail: buildDetail({
        daysSinceActivity,
        staleAfterDays,
        updatedAt,
        signalAt
      }),
      lastActivityAt: lastActivity.toISOString(),
      lastUpdatedAt: input.lastUpdatedAt ?? null,
      lastSignalAt: input.lastSignalAt ?? null,
      daysSinceActivity,
      isStale: false
    };
  }

  return {
    label: "Fresh",
    tone: "success",
    detail: buildDetail({
      daysSinceActivity,
      staleAfterDays,
      updatedAt,
      signalAt
    }),
    lastActivityAt: lastActivity.toISOString(),
    lastUpdatedAt: input.lastUpdatedAt ?? null,
    lastSignalAt: input.lastSignalAt ?? null,
    daysSinceActivity,
    isStale: false
  };
}

export function summarizeFreshness(inputs: FreshnessInput[]) {
  const states = inputs.map((input) => getFreshnessState(input));
  const staleCount = states.filter((state) => state.isStale).length;
  const watchCount = states.filter((state) => state.label === "Needs review soon").length;
  const freshCount = states.filter((state) => state.label === "Fresh").length;
  const lastActivityAt = states
    .map((state) => state.lastActivityAt)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null;

  if (!states.length) {
    return {
      label: "No tracked records",
      tone: "muted" as const,
      detail: "No mapped records are available yet.",
      lastActivityAt: null,
      staleCount: 0,
      watchCount: 0,
      freshCount: 0
    };
  }

  if (staleCount) {
    return {
      label: `${staleCount} stale`,
      tone: "danger" as const,
      detail:
        watchCount > 0
          ? `${staleCount} stale and ${watchCount} nearing review threshold.`
          : `${staleCount} record${staleCount === 1 ? "" : "s"} need review.`,
      lastActivityAt,
      staleCount,
      watchCount,
      freshCount
    };
  }

  if (watchCount) {
    return {
      label: `${watchCount} nearing review`,
      tone: "muted" as const,
      detail: `${freshCount} still look fresh and ${watchCount} should be reviewed soon.`,
      lastActivityAt,
      staleCount,
      watchCount,
      freshCount
    };
  }

  return {
    label: "Fresh set",
    tone: "success" as const,
    detail: `${freshCount} mapped record${freshCount === 1 ? "" : "s"} are within the active review window.`,
    lastActivityAt,
    staleCount,
    watchCount,
    freshCount
  };
}
