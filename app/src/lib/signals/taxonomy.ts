export const signalTagDefinitions = [
  { id: "air", label: "Air", group: "environment" },
  { id: "land", label: "Land", group: "environment" },
  { id: "maritime", label: "Maritime", group: "environment" },
  { id: "space", label: "Space", group: "environment" },
  { id: "cyber", label: "Cyber", group: "environment" },
  { id: "arctic", label: "Arctic", group: "environment" },
  { id: "public_need", label: "Defence need", group: "activity" },
  { id: "procurement", label: "Procurement", group: "activity" },
  { id: "funding", label: "Funding", group: "activity" },
  { id: "testing", label: "Testing", group: "activity" },
  { id: "production", label: "Production", group: "activity" },
  { id: "partnership", label: "Partnership", group: "activity" },
  { id: "policy", label: "Policy", group: "activity" },
  { id: "allied", label: "Allied", group: "activity" },
  { id: "autonomy", label: "Autonomy", group: "technology" },
  { id: "artificial_intelligence", label: "AI", group: "technology" },
  { id: "sensors", label: "Sensors", group: "technology" },
  { id: "communications", label: "Communications", group: "technology" },
  { id: "undersea", label: "Undersea", group: "technology" }
] as const;

export type SignalTag = (typeof signalTagDefinitions)[number]["id"];
export type SignalTagGroup = (typeof signalTagDefinitions)[number]["group"];

export const signalTagIds = signalTagDefinitions.map((tag) => tag.id) as [SignalTag, ...SignalTag[]];

const definitionsById = new Map<SignalTag, (typeof signalTagDefinitions)[number]>(
  signalTagDefinitions.map((tag) => [tag.id, tag])
);

export function getSignalTagDefinition(tag: SignalTag) {
  return definitionsById.get(tag) ?? null;
}

export function getSignalTagLabel(tag: SignalTag) {
  return getSignalTagDefinition(tag)?.label ?? tag;
}

export function getSignalTagTone(tag: SignalTag, surface: "paper" | "signal" = "paper") {
  const group = getSignalTagDefinition(tag)?.group;
  if (surface === "signal") {
    if (group === "environment") return "atlas-pill-paper";
    if (group === "activity") return "atlas-pill-signal";
    return "atlas-pill-blue";
  }
  if (group === "environment") return "atlas-pill-blue";
  if (group === "activity") return "atlas-pill-signal-soft";
  return "atlas-pill-evidence";
}

export function collectSignalTags(items: Array<{ tags: SignalTag[] }>) {
  const present = new Set(items.flatMap((item) => item.tags));
  return signalTagDefinitions.filter((tag) => present.has(tag.id)).map((tag) => tag.id);
}
