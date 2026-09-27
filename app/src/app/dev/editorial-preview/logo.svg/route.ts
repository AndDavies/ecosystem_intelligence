import { readFile } from 'node:fs/promises';
import path from 'node:path';
export async function GET() {
  if(process.env.NODE_ENV !== 'development') return new Response(null,{status:404});
  try { return new Response(await readFile(path.resolve('../research/ingestion/local/editorial-preview/kraken-logo.svg'),'utf8'),{headers:{'Content-Type':'image/svg+xml','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; sandbox"}}); }
  catch {return new Response(null,{status:404});}
}
