import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { retrieveAssistantPool } from "@/lib/atlas/assistant-retrieval";
import { atlasTestSnapshot } from "./fixtures/atlas-snapshot";
it("uses offering fields and preserves exact names and referential IDs in a bounded pool", () => {
  const snapshot = structuredClone(atlasTestSnapshot);
  const target = snapshot.organizations.at(-1)!;
  expect(retrieveAssistantPool(snapshot, target.name, [], 1)[0].id).toBe(target.id);
  expect(retrieveAssistantPool(snapshot, "Which of those?", [{query:"Earlier",organizationIds:[target.id]}], 1)[0].id).toBe(target.id);
  expect(retrieveAssistantPool(snapshot, "underwater sensing", [], 3)).toHaveLength(3);
  const rows = retrieveAssistantPool(snapshot, "underwater sensing", [], 3);
  expect(rows).toEqual(retrieveAssistantPool(snapshot, "underwater sensing", [], 3));
  expect(new Set(rows.map(o=>o.id)).size).toBe(3);
});
