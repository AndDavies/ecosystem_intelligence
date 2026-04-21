import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}

export function toTitleCase(value: string) {
  return value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function formatFieldLabel(value: string) {
  const labels: Record<string, string> = {
    company_facing_context: "Company context",
    market_context: "Market context",
    website_url: "Website URL",
    public_contact_email: "Public contact email",
    public_contact_phone: "Public contact phone",
    why_it_matters: "Why it matters",
    action_note: "Action note",
    suggested_action_type: "Suggested action",
    relevance_band: "Use Case relevance",
    defence_relevance: "Defence relevance",
    reviewer_override_delta: "Reviewer override",
    refresh_requested: "Manual refresh request"
  };

  return labels[value] ?? toTitleCase(value);
}

export function formatValueForDisplay(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "None";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatValueForDisplay(item)).join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}
