/** Public, editorially approved text only. Never load an operator issue packet here. */
export type PublicNorthSignalSample = {
  title: string;
  issueDate: string;
  sections: Array<{ heading: string; paragraphs: string[] }>;
  links: Array<{ label: string; href: string }>;
};

// Andrew's approval of the current private candidate is the publication gate.
export function getApprovedNorthSignalSample(): PublicNorthSignalSample | null {
  return null;
}
