import { z } from "zod";

// Reviewed observations, not live quotes or values extracted from prose.
export const snapshotObservationSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/).max(80),
  metric: z.enum(["listing", "revenue", "cash", "debt", "backlog", "market_cap", "employees", "access"]),
  subjectName: z.string().trim().min(2).max(240),
  scopeRelation: z.enum(["organization", "parent"]),
  reportingScope: z.string().trim().min(2).max(500),
  amount: z.number().finite().nonnegative().nullable(),
  amountHigh: z.number().finite().nonnegative().nullable(),
  unit: z.enum(["currency", "people", "text"]),
  currency: z.string().regex(/^[A-Z]{3}$/).nullable(),
  textValue: z.string().trim().min(1).max(300).nullable(),
  basis: z.enum(["reported_actual", "forecast", "conditional", "available"]),
  period: z.string().trim().min(2).max(120),
  asOf: z.string().date(),
  qualification: z.string().trim().min(2).max(1000),
  sourceId: z.string().trim().min(1).max(160),
  sourceUrl: z.string().url().refine(value => value.startsWith("https://"), "Public HTTPS source required"),
  sourceLocator: z.string().trim().min(2).max(500)
}).strict().superRefine((value, context) => {
  const financial = ["revenue", "cash", "debt", "backlog", "market_cap"].includes(value.metric);
  if (financial && (value.unit !== "currency" || !value.currency || value.amount === null || value.textValue !== null)) {
    context.addIssue({ code: "custom", message: "Financial observations require a reported numeric amount and currency, not prose.", path: ["amount"] });
  }
  if (value.amountHigh !== null && (value.amount === null || value.amountHigh < value.amount)) {
    context.addIssue({ code: "custom", message: "Range upper bound must be at least its reported lower bound.", path: ["amountHigh"] });
  }
  if (["listing", "access"].includes(value.metric) && (value.unit !== "text" || !value.textValue || value.amount !== null || value.amountHigh !== null || value.currency !== null)) {
    context.addIssue({ code: "custom", message: "Listing/access observations require text only.", path: ["textValue"] });
  }
  if (value.metric === "employees" && (value.unit !== "people" || value.amount === null || value.currency !== null || value.textValue !== null)) {
    context.addIssue({ code: "custom", message: "Employee observations require a scoped reported headcount.", path: ["amount"] });
  }
  if (value.metric === "market_cap" && value.basis !== "reported_actual") {
    context.addIssue({ code: "custom", message: "Market cap is a dated reported observation, never an estimate or live quote.", path: ["basis"] });
  }
});
export const snapshotObservationsSchema = z.array(snapshotObservationSchema).max(12).superRefine((items, ctx) => {
  if (new Set(items.map(item => item.id)).size !== items.length) ctx.addIssue({code: "custom", message: "Observation IDs must be unique"});
});
export type SnapshotObservation = z.infer<typeof snapshotObservationSchema>;
export const snapshotLabels: Record<SnapshotObservation["metric"], string> = {
  listing: "Listing", revenue: "Reported revenue", cash: "Reported cash", debt: "Reported debt", backlog: "Reported backlog", market_cap: "Market capitalization", employees: "Reported employees", access: "Access"
};
export function formatSnapshotValue(item: SnapshotObservation, presentation: "exact" | "readable" = "exact") {
  if (item.unit === "text") return item.textValue ?? "";
  const number = (value: number) => new Intl.NumberFormat("en-CA", presentation === "readable" && item.unit === "currency"
    ? {notation: "compact", compactDisplay: "long", maximumSignificantDigits: 15}
    : {maximumFractionDigits: 2}).format(value);
  return `${item.currency ? `${item.currency} ` : ""}${item.amount === null ? "" : number(item.amount)}${item.amountHigh === null ? "" : `–${number(item.amountHigh)}`}${item.unit === "people" ? " people" : ""}`;
}
export function formatSnapshotDate(asOf: string) {
  return new Intl.DateTimeFormat("en-CA", {year: "numeric", month: "long", day: "numeric", timeZone: "UTC"}).format(new Date(`${asOf}T00:00:00Z`));
}
export function parseSnapshotObservations(value: unknown): SnapshotObservation[] {
  const result = snapshotObservationsSchema.safeParse(value ?? []);
  return result.success ? result.data : [];
}
