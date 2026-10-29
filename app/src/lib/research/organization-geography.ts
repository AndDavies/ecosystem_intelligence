import { z } from "zod";

/** Geography records facts; it does not determine company inclusion. */
export const organizationPrimaryLocationSchema = z.object({
  city: z.string().trim().min(1).max(160),
  provinceTerritory: z.string().trim().min(1).max(160).nullable(),
  countryCode: z.string().regex(/^[A-Z]{2}$/),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  geographicConfidence: z.enum(["exact", "city_centroid", "regional"]),
  locationRole: z.enum(["headquarters", "facility", "test_site", "regional_role"]).optional()
}).strict().superRefine((location, context) => {
  if (location.countryCode !== "CA" && !location.locationRole) {
    context.addIssue({ code: "custom", path: ["locationRole"], message: "A foreign location needs its evidenced role; country alone does not establish headquarters, a facility or a regional role." });
  }
  if (location.countryCode === "CA" && (location.latitude < 40 || location.latitude > 84 || location.longitude < -142 || location.longitude > -52)) {
    context.addIssue({ code: "custom", message: "Canadian locations must retain Canadian geographic bounds; never relabel foreign coordinates as Canada." });
  }
}).nullable();

export const organizationLeadCountrySchema = z.string().length(2).nullable();
