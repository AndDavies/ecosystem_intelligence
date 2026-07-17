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
});

export const contactMessageSchema = z.object({
  category: z.enum(["general", "privacy", "media", "partnership"]),
  senderName: z.string().trim().min(2).max(120),
  senderEmail: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  organizationName: z.union([z.literal(""), z.string().trim().max(180)]).optional().transform((value) => value || null),
  message: z.string().trim().min(20).max(4000),
  website: z.string().max(200).optional().default("")
});
