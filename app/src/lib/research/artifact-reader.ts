import { readFile } from "node:fs/promises";
import path from "node:path";
import type { z } from "zod";

/** One read-only validation invocation sees one parsed copy of each artifact. */
export function createResearchArtifactReader() {
  const values=new Map<string,Promise<unknown>>();
  const parsed=new Map<z.ZodTypeAny,Map<string,Promise<unknown>>>();
  const read=(filePath:string):Promise<unknown> => {
    const key=path.resolve(filePath);
    if (!values.has(key)) values.set(key,readFile(key,"utf8").then(value=>JSON.parse(value) as unknown));
    return values.get(key)!;
  };
  const parse=<Schema extends z.ZodTypeAny>(filePath:string,schema:Schema):Promise<z.SafeParseReturnType<z.input<Schema>,z.output<Schema>>> => {
    const key=path.resolve(filePath);
    const byPath=parsed.get(schema) ?? new Map<string,Promise<unknown>>();
    parsed.set(schema,byPath);
    if (!byPath.has(key)) byPath.set(key,read(key).then(value=>schema.safeParse(value)));
    return byPath.get(key)! as Promise<z.SafeParseReturnType<z.input<Schema>,z.output<Schema>>>;
  };
  return {read,parse};
}
