export const defenceBriefImageBucket = "brief-images";

const storageBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://facoactpdckkhciamflk.supabase.co"}/storage/v1/object/public/${defenceBriefImageBucket}`;

export function defenceBriefImageUrl(objectName: string) {
  return `${storageBase}/${objectName.split("/").map(encodeURIComponent).join("/")}`;
}

export const seededDefenceBriefImages = [
  { objectName: "defence-briefs-home.jpg", label: "Connected Canadian naval ecosystem" },
  { objectName: "arctic-operations.jpg", label: "Arctic operations and communications" },
  { objectName: "submarine-opportunity.jpg", label: "Arctic submarine and undersea network" },
  { objectName: "submarine-opportunity-card.jpg", label: "Blue Arctic submarine and undersea network" },
  { objectName: "defence-demand-and-innovation.jpg", label: "Canadian armoured vehicle and innovation network" },
  { objectName: "sovereign-capability.jpg", label: "Canadian aerospace and connected capability" }
].map((image) => ({ ...image, value: defenceBriefImageUrl(image.objectName) }));
