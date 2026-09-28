import {readFile,writeFile} from 'node:fs/promises';
import {zodToJsonSchema} from '../node_modules/openai/_vendor/zod-to-json-schema/index.js';
import {organizationPresentationCopySchema,capabilityPresentationCopySchema} from '../src/lib/atlas/dossier-presentation-copy';
async function main(){
 const file='../research/ingestion/schema/research-candidate-batch-v2.schema.json';
 let text=await readFile(file,'utf8'); const schema=JSON.parse(text);
 schema.$defs.organizationBundleV3.allOf[1].properties.organization.properties.presentationCopy=zodToJsonSchema(organizationPresentationCopySchema,{$refStrategy:'none'});
 schema.$defs.capabilityV3.properties.presentationCopy=zodToJsonSchema(capabilityPresentationCopySchema,{$refStrategy:'none'});
 for(const field of ['display_lead','role_descriptor']) if(!schema.$defs.refreshOperationV2.properties.field.enum.includes(field)) schema.$defs.refreshOperationV2.properties.field.enum.push(field);
 for(const key of ['organizationBundleV3','capabilityV3','refreshOperationV2']){
  const start=text.indexOf(`    "${key}": {`), next=text.indexOf('\n    "',start+5), end=next<0?text.lastIndexOf('\n  }'):next;
  text=text.slice(0,start)+`    "${key}": ${JSON.stringify(schema.$defs[key])},`+text.slice(end);
 }
 JSON.parse(text); await writeFile(file,text);
}
void main();
