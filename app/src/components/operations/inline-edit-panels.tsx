import { Save, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  saveCapabilityDetails,
  saveCompanyDetails,
  submitCapabilityMappingEdit
} from "@/lib/actions/review";
import type { CapabilityProfileView, CompanyProfileView } from "@/types/view-models";
import { formatFieldLabel, toTitleCase } from "@/lib/utils";

const suggestedActionOptions = [
  "connect_to_end_user_validation",
  "explore_testbed_inclusion",
  "assess_funding_fit",
  "introduce_to_integrator",
  "monitor_for_later_stage_engagement",
  "assess_procurement_relevance"
] as const;

const pathwayOptions = ["build", "validate", "scale"] as const;
const relevanceOptions = ["low", "medium", "high"] as const;

function SelectField({
  name,
  defaultValue,
  options
}: {
  name: string;
  defaultValue: string;
  options: readonly string[];
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="h-11 w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 text-sm outline-none transition focus:border-[var(--primary)] focus:shadow-[0_0_0_4px_rgba(31,80,51,0.08)]"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {toTitleCase(option)}
        </option>
      ))}
    </select>
  );
}

export function CapabilityInlineEditPanel({
  view,
  canEdit
}: {
  view: CapabilityProfileView;
  canEdit: boolean;
}) {
  if (!canEdit) {
    return null;
  }

  return (
    <Card className="rounded-[32px] border-[var(--primary)]/14 bg-[linear-gradient(180deg,rgba(31,80,51,0.06),rgba(255,255,255,0.96))]">
      <CardHeader className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
          Inline editing
        </div>
        <CardTitle>Edit capability details</CardTitle>
        <p className="text-sm text-[var(--muted-foreground)]">
          Summary and company context save live with audit history.
        </p>
      </CardHeader>
      <CardContent>
        <form action={saveCapabilityDetails} className="space-y-4">
          <input type="hidden" name="entityId" value={view.capability.id} />
          <input type="hidden" name="pagePath" value={`/capabilities/${view.capability.id}`} />
          <input type="hidden" name="current_summary" value={view.capability.summary} />
          <input
            type="hidden"
            name="current_company_facing_context"
            value={view.capability.companyFacingContext ?? ""}
          />
          <div className="space-y-2">
            <label htmlFor="capability-summary" className="text-sm font-medium">
              Summary
            </label>
            <Textarea
              id="capability-summary"
              name="summary"
              defaultValue={view.capability.summary}
              className="min-h-28"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="capability-company-context" className="text-sm font-medium">
              Company context
            </label>
            <Textarea
              id="capability-company-context"
              name="company_facing_context"
              defaultValue={view.capability.companyFacingContext ?? ""}
            />
          </div>
          <Button type="submit">
            <Save className="mr-2 size-4" />
            Save live changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function CompanyInlineEditPanel({
  view,
  canEdit
}: {
  view: CompanyProfileView;
  canEdit: boolean;
}) {
  if (!canEdit) {
    return null;
  }

  return (
    <Card className="rounded-[32px] border-[var(--primary)]/14 bg-[linear-gradient(180deg,rgba(31,80,51,0.06),rgba(255,255,255,0.96))]">
      <CardHeader className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
          Inline editing
        </div>
        <CardTitle>Edit company details</CardTitle>
        <p className="text-sm text-[var(--muted-foreground)]">
          Company narrative and public contact details save live with audit history.
        </p>
      </CardHeader>
      <CardContent>
        <form action={saveCompanyDetails} className="space-y-4">
          <input type="hidden" name="entityId" value={view.company.id} />
          <input type="hidden" name="pagePath" value={`/companies/${view.company.id}`} />
          <input type="hidden" name="current_overview" value={view.company.overview} />
          <input type="hidden" name="current_market_context" value={view.company.marketContext ?? ""} />
          <input type="hidden" name="current_website_url" value={view.company.websiteUrl ?? ""} />
          <input
            type="hidden"
            name="current_public_contact_email"
            value={view.company.publicContactEmail ?? ""}
          />
          <input
            type="hidden"
            name="current_public_contact_phone"
            value={view.company.publicContactPhone ?? ""}
          />
          <div className="space-y-2">
            <label htmlFor="company-overview" className="text-sm font-medium">
              Overview
            </label>
            <Textarea id="company-overview" name="overview" defaultValue={view.company.overview} />
          </div>
          <div className="space-y-2">
            <label htmlFor="company-market-context" className="text-sm font-medium">
              Market context
            </label>
            <Textarea
              id="company-market-context"
              name="market_context"
              defaultValue={view.company.marketContext ?? ""}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="company-website-url" className="text-sm font-medium">
                Website URL
              </label>
              <Input id="company-website-url" name="website_url" defaultValue={view.company.websiteUrl ?? ""} />
            </div>
            <div className="space-y-2">
              <label htmlFor="company-contact-email" className="text-sm font-medium">
                Public contact email
              </label>
              <Input
                id="company-contact-email"
                name="public_contact_email"
                defaultValue={view.company.publicContactEmail ?? ""}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="company-contact-phone" className="text-sm font-medium">
              Public contact phone
            </label>
            <Input
              id="company-contact-phone"
              name="public_contact_phone"
              defaultValue={view.company.publicContactPhone ?? ""}
            />
          </div>
          <Button type="submit">
            <Save className="mr-2 size-4" />
            Save live changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function MappingInlineEditPanel({
  mapping,
  capabilityId,
  canEdit
}: {
  mapping: CapabilityProfileView["mappings"][number];
  capabilityId: string;
  canEdit: boolean;
}) {
  if (!canEdit) {
    return null;
  }

  return (
    <Card className="rounded-[28px] border-[var(--primary)]/10 bg-[var(--card)]/70">
      <CardHeader className="space-y-2 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-semibold">Edit mapping</div>
          <Badge tone="secondary">High-impact fields route to review</Badge>
        </div>
        <p className="text-sm text-[var(--muted-foreground)]">
          {formatFieldLabel("pathway")}, {formatFieldLabel("relevance_band")},{" "}
          {formatFieldLabel("defence_relevance")}, and {formatFieldLabel("suggested_action_type")} create
          review requests. Narrative fields save live.
        </p>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <form action={submitCapabilityMappingEdit} className="space-y-4">
          <input type="hidden" name="entityId" value={mapping.id} />
          <input type="hidden" name="capabilityId" value={capabilityId} />
          <input type="hidden" name="pagePath" value={`/capabilities/${capabilityId}`} />
          <input type="hidden" name="current_pathway" value={mapping.pathway} />
          <input type="hidden" name="current_relevance_band" value={mapping.relevanceBand} />
          <input type="hidden" name="current_defence_relevance" value={mapping.defenceRelevance} />
          <input
            type="hidden"
            name="current_suggested_action_type"
            value={mapping.suggestedActionType}
          />
          <input type="hidden" name="current_why_it_matters" value={mapping.whyItMatters} />
          <input type="hidden" name="current_action_note" value={mapping.actionNote ?? ""} />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pathway</label>
              <SelectField name="pathway" defaultValue={mapping.pathway} options={pathwayOptions} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Use Case relevance</label>
              <SelectField
                name="relevance_band"
                defaultValue={mapping.relevanceBand}
                options={relevanceOptions}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Defence relevance</label>
              <SelectField
                name="defence_relevance"
                defaultValue={mapping.defenceRelevance}
                options={relevanceOptions}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Suggested action</label>
              <SelectField
                name="suggested_action_type"
                defaultValue={mapping.suggestedActionType}
                options={suggestedActionOptions}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Why it matters</label>
            <Textarea name="why_it_matters" defaultValue={mapping.whyItMatters} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Action note</label>
            <Textarea name="action_note" defaultValue={mapping.actionNote ?? ""} className="min-h-24" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit">
              <ShieldAlert className="mr-2 size-4" />
              Save or send to review
            </Button>
            <div className="text-xs text-[var(--muted-foreground)]">
              Live edits are audited immediately. Review-triggering edits appear in the queue with a field diff.
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
