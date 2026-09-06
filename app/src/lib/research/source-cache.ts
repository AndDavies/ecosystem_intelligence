import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fetchPublicBytes } from '../security/public-outbound';

export async function cacheResearchSource(directory: string, url: string, refresh = false) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('Use a public HTTPS source without credentials.');
  parsed.hash = '';
  const key = createHash('sha256').update(parsed.href).digest('hex');
  const index = path.join(directory, `${key}.json`);
  if (!refresh) {
    try {
      const cached = JSON.parse(await readFile(index,'utf8'));
      if (cached.url !== parsed.href || typeof cached.bodyFile !== 'string' || !/^[a-f0-9]{64}\.(pdf|source)$/.test(cached.bodyFile)) throw new Error('Invalid source cache metadata.');
      const bytes = await readFile(path.join(directory,cached.bodyFile));
      if (createHash('sha256').update(bytes).digest('hex') !== cached.sha256) throw new Error('Source cache content mismatch.');
      return {...cached,cached:true};
    } catch(error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  const source = await fetchPublicBytes(parsed.href,{maxBytes:20*1024*1024,allowedTypes:['text/html','text/plain','application/pdf','application/json','text/markdown'],userAgent:'TrueNorthMap-Research/1.0',timeoutMs:20000});
  const sha256 = createHash('sha256').update(source.body).digest('hex');
  const bodyFile = `${sha256}.${source.contentType === 'application/pdf' ? 'pdf' : 'source'}`;
  await mkdir(directory,{recursive:true});
  try {await writeFile(path.join(directory,bodyFile),source.body,{flag:'wx',mode:0o600});} catch(error) {if((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;}
  const metadata = {url:parsed.href,finalUrl:source.finalUrl,fetchedAt:new Date().toISOString(),contentType:source.contentType,sha256,bodyFile};
  await writeFile(index,JSON.stringify(metadata,null,2)+'\n',{mode:0o600});
  return {...metadata,cached:false};
}
