import { readFile, writeFile } from "node:fs/promises";
import { toJSONSchema } from "zod";
import { organizationLeadCountrySchema, organizationPrimaryLocationSchema } from "../src/lib/research/organization-geography";

async function main() {
  const file = "../research/ingestion/schema/research-candidate-batch-v2.schema.json";
  let text = await readFile(file, "utf8");
  const schema = JSON.parse(text);
  const body = schema.$defs.organizationBundleV3.allOf[1];
  delete body.properties.internationalEligibility;
  const location = toJSONSchema(organizationPrimaryLocationSchema, { target: "draft-7", io: "input" });
  body.properties.organization.properties.primaryLocation = {
    ...location,
    allOf: [{ if: { type: "object", required: ["countryCode"], properties: { countryCode: { not: { const: "CA" } } } }, then: { type: "object", required: ["locationRole"] } }, { if: { type: "object", properties: { countryCode: { const: "CA" } } }, then: { type: "object", properties: { latitude: { type: "number", minimum: 40, maximum: 84 }, longitude: { type: "number", minimum: -142, maximum: -52 } } } }]
  };
  delete body.allOf;
  const start = text.indexOf('    "organizationBundleV3": {');
  const next = text.indexOf('\n    "', start + 5);
  if (start < 0 || next < 0) throw new Error("Portable organization-v3 schema layout changed; no schema was written.");
  text = text.slice(0, start) + `    "organizationBundleV3": ${JSON.stringify(schema.$defs.organizationBundleV3)},` + text.slice(next);
  JSON.parse(text);
  await writeFile(file, text);
  const leadFile = "../research/ingestion/schema/source-leads-v2.schema.json";
  let leadText = await readFile(leadFile, "utf8");
  const leadSchema = JSON.parse(leadText);
  const oldCountry = leadSchema.$defs.organizationLead.allOf[1].properties.location.properties.countryCode;
  const oldText = JSON.stringify(oldCountry).replaceAll(":", ": ").replaceAll(",", ", ");
  const generated = toJSONSchema(organizationLeadCountrySchema, { target: "draft-7", io: "input" });
  delete (generated as Record<string, unknown>).$schema;
  if (JSON.stringify(oldCountry) === JSON.stringify(generated)) return;
  const countryStart = leadText.indexOf('"countryCode": {');
  const countryEnd = leadText.indexOf(' }', countryStart) + 2;
  if (countryStart < 0 || countryEnd <= countryStart || !oldText) throw new Error("Portable lead-country layout changed; no lead schema written.");
  leadText = leadText.slice(0, countryStart) + '"countryCode": ' + JSON.stringify(generated) + leadText.slice(countryEnd);
  JSON.parse(leadText);
  await writeFile(leadFile, leadText);
}
void main();
