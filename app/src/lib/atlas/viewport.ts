import type { AtlasBounds } from "@/types/atlas";

type MappableOrganization = {
  id: string;
  primaryLocation: {
    latitude: number | null;
    longitude: number | null;
  } | null;
};

export function isUsableAtlasBounds(bounds: AtlasBounds) {
  const values = [bounds.west, bounds.south, bounds.east, bounds.north];
  return values.every(Number.isFinite) && bounds.east - bounds.west > 0.001 && bounds.north - bounds.south > 0.001;
}

export function organizationIdsInBounds(organizations: MappableOrganization[], bounds: AtlasBounds) {
  if (!isUsableAtlasBounds(bounds)) return [];
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
