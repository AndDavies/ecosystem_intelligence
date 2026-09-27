import { z } from 'zod';
export const editorialMediaContextSchema = z.object({
  subject: z.string().trim().min(2).max(240),
  contextDate: z.string().date().nullable(),
  context: z.string().trim().min(10).max(800),
  caption: z.string().trim().min(10).max(1000),
  reuseBasis: z.enum(['permission','licensed','public_domain','unknown']),
  reuseEvidenceUrl: z.string().url().nullable()
}).strict().refine(value => value.reuseBasis === 'unknown' || Boolean(value.reuseEvidenceUrl), 'Approved reuse requires an evidence URL');
export type EditorialMediaContext = z.infer<typeof editorialMediaContextSchema>;
export function parseEditorialMediaContext(value: unknown) {
  const parsed=editorialMediaContextSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
