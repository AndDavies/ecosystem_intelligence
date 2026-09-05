import { z } from "zod";
import {
  signalEditionEditorialSchemaLegacy,
  signalEditionEditorialSchemaV3,
  signalItemEditorialSchemaLegacy,
  signalItemEditorialSchemaV3
} from "@/lib/signals/contract";

const editionIdentity = { editionId: z.string().uuid(), publicationStatus: z.enum(["published", "archived"]) };

export function signalEditionEditorSchema(version: unknown) {
  if (version === "daily_signals_packet_v3") {
    return signalEditionEditorialSchemaV3.extend(editionIdentity).transform(({ summary, ...fields }) => ({
      ...fields,
      executiveSummary: [summary.opening, summary.takeaway, summary.limitation].filter(Boolean).join("\n\n"),
      summarySections: summary
    }));
  }
  return signalEditionEditorialSchemaLegacy.extend(editionIdentity).transform((fields) => ({ ...fields, summarySections: null }));
}

export function signalItemEditorSchema(version: unknown) {
  return (version === "daily_signals_packet_v3" ? signalItemEditorialSchemaV3 : signalItemEditorialSchemaLegacy)
    .extend({ itemId: z.string().uuid() });
}

export function signalEditorFormInput(formData: FormData) {
  const fields = Object.fromEntries(formData);
  const nullable = (name: string) => typeof fields[name] === "string" && fields[name].trim() ? fields[name] : null;
  return {
    ...fields,
    tags: formData.getAll("tags"),
    automatedRead: nullable("automatedRead"),
    unknowns: nullable("unknowns"),
    nextStep: nullable("nextStep"),
    summary: { opening: fields.opening, takeaway: fields.takeaway, limitation: nullable("limitation") }
  };
}
