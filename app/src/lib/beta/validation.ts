import { z } from "zod";

export const connectionIntentValues = [
  "partnership",
  "supplier_customer",
  "pilot_testing",
  "program_support",
  "investment",
  "other"
] as const;

export const connectionRequestSchema = z.object({
  organizationId: z.string().uuid(),
  requesterName: z.string().trim().min(2).max(120),
  requesterOrganization: z.union([z.literal(""), z.string().trim().max(180)]).optional().transform((value) => value || null),
  intent: z.enum(connectionIntentValues),
  message: z.string().trim().min(20).max(2000)
}).strict();

const optionalHttpsUrl = z.union([
  z.literal(""),
  z.string().trim().max(2048).url().refine((value) => value.startsWith("https://"), {
    message: "Use a secure public source URL."
  })
]).nullable().optional().transform((value) => value || null);

export const publicSubmissionSchema = z.object({
  submissionType: z.enum(["profile_claim", "correction", "new_organization"]),
  targetEntityType: z.enum(["organization"]).nullable().optional(),
  targetEntityId: z.string().uuid().nullable().optional(),
  payload: z.object({
    subject: z.string().trim().min(3).max(150),
    details: z.string().trim().min(10).max(4000),
    evidenceUrl: optionalHttpsUrl,
    submitterRole: z.union([z.literal(""), z.string().trim().max(150)]).nullable().optional()
      .transform((value) => value || null)
  }).strict()
}).strict().superRefine((value, context) => {
  if (value.submissionType !== "new_organization" && (!value.targetEntityId || value.targetEntityType !== "organization")) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Claims and corrections require a published organization.",
      path: ["targetEntityId"]
    });
  }
});

export const contactMessageSchema = z.object({
  category: z.enum(["general", "privacy", "media", "partnership"]),
  senderName: z.string().trim().min(2).max(120),
  senderEmail: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  organizationName: z.union([z.literal(""), z.string().trim().max(180)]).optional().transform((value) => value || null),
  message: z.string().trim().min(20).max(4000),
  captchaToken: z.string().trim().max(4096).optional().default(""),
  website: z.string().max(200).optional().default("")
});
