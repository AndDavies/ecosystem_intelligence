import { z } from 'zod';
import type { OrganizationRefreshBundleV2 } from './pipeline-schema';

/** Local research scope, never a deployed schema version or evidence exemption. */
export const researchFocusSchema = z.object({
  schemaVersion: z.literal('research_focus_v1'),
  runId: z.string().min(1),
  fields: z.array(z.string().regex(/^(field|profile|child):[a-zA-Z][a-zA-Z0-9_]*$/)).min(1),
  question: z.string().min(20),
  retainedEvidence: z.array(z.object({dimension: z.string().min(1), sourceUrl: z.string().url(), checkedAt: z.string().datetime(), finding: z.string().min(20)}))
});
export function focusedOperationIssues(candidate: OrganizationRefreshBundleV2, fields: string[]) {
  return candidate.operations.flatMap(operation => {
    const key = operation.operation === 'set_field' ? `field:${operation.field}`
      : operation.operation === 'set_profile_field' ? `profile:${operation.profileField}` : `child:${operation.entityType}`;
    return fields.includes(key) ? [] : [`${candidate.candidateId}: ${key} is outside the explicit focus; update the local scope with a reason before assembly.`];
  });
}
