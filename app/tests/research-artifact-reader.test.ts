import {mkdtemp,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {afterEach,describe,expect,it} from "vitest";
import {z} from "zod";
import {createResearchArtifactReader} from "@/lib/research/artifact-reader";
let directory:string;
afterEach(async()=>{if(directory)await rm(directory,{recursive:true,force:true});});
describe("one validation artifact snapshot",()=>{
  it("shares concurrent reads and schema parses while a later validation observes changed files",async()=>{
    directory=await mkdtemp(path.join(tmpdir(),"tnm-artifact-reader-"));const file=path.join(directory,"run.json");
    await writeFile(file,JSON.stringify({runId:"first"}));const schema=z.object({runId:z.string()});const reader=createResearchArtifactReader();
    const [first,same]=await Promise.all([reader.parse(file,schema),reader.parse(file,schema)]);expect(first).toBe(same);expect(first).toMatchObject({success:true,data:{runId:"first"}});
    await writeFile(file,JSON.stringify({runId:"second"}));expect(await reader.read(file)).toEqual({runId:"first"});
    expect(await createResearchArtifactReader().parse(file,schema)).toMatchObject({success:true,data:{runId:"second"}});
  });
  it("keeps validation results separate for different schemas and preserves invalid data failures",async()=>{
    directory=await mkdtemp(path.join(tmpdir(),"tnm-artifact-reader-"));const file=path.join(directory,"invalid.json");await writeFile(file,JSON.stringify({runId:42}));
    const reader=createResearchArtifactReader();expect((await reader.parse(file,z.object({runId:z.string()}))).success).toBe(false);
    expect((await reader.parse(file,z.object({runId:z.number()}))).success).toBe(true);
  });
});
