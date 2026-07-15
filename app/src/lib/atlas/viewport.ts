import type { AtlasBounds, AtlasOrganization } from "@/types/atlas";

export function organizationIdsInBounds(organizations: AtlasOrganization[], bounds: AtlasBounds) {
  return organizations.flatMap((organization) => {
    const location = organization.primaryLocation;
    if (
      location?.longitude === null ||
      location?.longitude === undefined ||
      location.latitude === null ||
      location.latitude === undefined
    ) {
      return [];
    }

    return location.longitude >= bounds.west &&
      location.longitude <= bounds.east &&
      location.latitude >= bounds.south &&
      location.latitude <= bounds.north
      ? [organization.id]
      : [];
  });
}
