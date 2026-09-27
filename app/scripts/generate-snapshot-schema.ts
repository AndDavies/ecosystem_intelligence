import { readFile, writeFile } from 'node:fs/promises';
import { zodToJsonSchema } from '../node_modules/openai/_vendor/zod-to-json-schema/index.js';
import { snapshotObservationsSchema } from '../src/lib/atlas/company-snapshot';
// The existing portable contract is maintained alongside Zod. Generate only this additive definition.
async function main() {
const target='../research/ingestion/schema/research-candidate-batch-v2.schema.json';
let text=await readFile(target,'utf8');
const generated=zodToJsonSchema(snapshotObservationsSchema,{$refStrategy:'none'});
const schema=JSON.parse(text);
schema.$defs.snapshotObservations=generated;
schema.$defs.candidateCommon.properties.editorialStandard={const:'reader_usefulness_v1'};
schema.$defs.organizationBundleV3.allOf[1].properties.organization.properties.snapshotObservations={$ref:'#/$defs/snapshotObservations'};
const fields=schema.$defs.refreshOperationV2.properties.field.enum;
if(!fields.includes('snapshot_observations')) fields.push('snapshot_observations');
// Retain the compact source formatting of unaffected definitions.
for(const key of ['candidateCommon','organizationBundleV3','refreshOperationV2', ...(text.includes('    "snapshotObservations":') ? ['snapshotObservations'] : [])]) {
 const start=text.indexOf(`    "${key}": {`);
 const next=text.indexOf('\n    "',start+5);
 const end=next<0?text.lastIndexOf('\n  }'):next;
 text=text.slice(0,start)+`    "${key}": ${JSON.stringify(schema.$defs[key])},`+text.slice(end);
}
if(!text.includes('    "snapshotObservations":')) text=text.replace('  "$defs": {','  "$defs": {\n    "snapshotObservations": '+JSON.stringify(generated)+',');
JSON.parse(text);
await writeFile(target,text);

}
void main();
