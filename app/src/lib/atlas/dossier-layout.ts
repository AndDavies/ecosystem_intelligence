import type { AtlasCapability } from "@/types/atlas";
import { dossierParagraphs } from "./dossier-presentation-copy";

// Conservative server-side reading-density estimate, not measured positioning.
// It only chooses normal document flow; it never truncates or sizes content.
function lines(text: string | null | undefined, measure: number) {
  return dossierParagraphs(text).reduce((total, paragraph) => total + Math.ceil(paragraph.length / measure) + 1, 0);
}
export function catalogueSupportsAside(capabilities: AtlasCapability[], assessment: string | null | undefined, contactItems: number) {
  const catalogue = capabilities.reduce((total, item) => total + 5 + lines(item.name, 42) + lines(item.presentationCopy?.catalogueTeaser, 75), 0);
  const support = (assessment ? 7 + lines(assessment, 32) : 0) + (contactItems ? 4 + contactItems * 2 : 0);
  return capabilities.length > 0 && support > 0 && catalogue >= support;
}
export function featuresSupportAside(features: string[], applications: string[]) {
  const primary = features.reduce((total, text) => total + lines(text, 75) + 1, 0);
  const support = 5 + applications.reduce((total, text) => total + lines(text, 32) + 1, 0);
  // Allow the small heading/caveat difference of a normal applications panel.
  // Substantially uneven prose still enters normal flow.
  return features.length > 0 && applications.length > 0 && primary + 6 >= support;
}
