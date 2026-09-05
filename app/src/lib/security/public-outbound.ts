import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import { request as httpsRequest } from "node:https";
import { Readable } from "node:stream";
import { createBrotliDecompress, createGunzip, createInflate } from "node:zlib";

const reserved = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0",8],["10.0.0.0",8],["100.64.0.0",10],["127.0.0.0",8],
  ["169.254.0.0",16],["172.16.0.0",12],["192.0.0.0",24],["192.0.2.0",24],
  ["192.88.99.0",24],["192.168.0.0",16],["198.18.0.0",15],["198.51.100.0",24],
  ["203.0.113.0",24],["224.0.0.0",3]
] as const) reserved.addSubnet(address, prefix, "ipv4");
for (const [address, prefix] of [["2001::",23],["2001:db8::",32],["2002::",16],["3fff::",20]] as const) {
  reserved.addSubnet(address, prefix, "ipv6");
}
const globalV6 = new BlockList();
globalV6.addSubnet("2000::", 3, "ipv6");

export function publicIp(address: string) {
  const family = isIP(address);
  if (family === 4) return !reserved.check(address, "ipv4");
  return family === 6 && !address.includes("%") && globalV6.check(address, "ipv6") && !reserved.check(address, "ipv6");
}

/** Every DNS answer must be public; a caller must also pin its connection. */
export function publicOutboundUrlIssue(value: string, resolvedAddresses: string[] = []) {
  let url: URL;
  try { url = new URL(value); } catch { return "Invalid outbound URL"; }
  if (!["http:", "https:"].includes(url.protocol)) return "Outbound URL must use HTTP or HTTPS";
  if (url.username || url.password) return "Outbound URL must not contain credentials";
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (!hostname.includes(".") && !isIP(hostname) || /(?:^|\.)(?:localhost|local|internal|lan|home|test|invalid|example)$/.test(hostname)) {
    return "Private or reserved hostname";
  }
  if (isIP(hostname) && !publicIp(hostname)) return "Private or reserved address";
  if (resolvedAddresses.some((address) => !publicIp(address))) return "DNS resolved to a private or reserved address";
  return undefined;
}

export type ResolvedPublicAddress = { address: string; family?: number };
export type PublicResolver = (host: string, options: { all: true; verbatim: true }) => Promise<ResolvedPublicAddress[]>;
export type CheckedPublicUrl = URL & { resolvedAddresses: ResolvedPublicAddress[] };

export async function assertPublicUrl(input: string, resolver: PublicResolver = lookup, timeoutMs = 15_000): Promise<CheckedPublicUrl> {
  const issue = publicOutboundUrlIssue(input);
  if (issue) throw new Error(issue);
  const url = new URL(input) as CheckedPublicUrl;
  if (url.protocol !== "https:" || url.port && url.port !== "443") throw new Error("Only public HTTPS on its default port is supported.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const addresses = isIP(host) ? [{ address: host, family: isIP(host) }] : await Promise.race([
      resolver(host, { all: true, verbatim: true }),
      new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error("Public source DNS resolution timed out.")), timeoutMs); })
    ]);
    if (!addresses.length || publicOutboundUrlIssue(input, addresses.map(({address}) => address))) throw new Error("Source resolves to a private/reserved network; use a public source.");
    url.resolvedAddresses = addresses;
    return url;
  } finally { if (timeout) clearTimeout(timeout); }
}

export function pinnedPublicRequest(url: string, options: { headers: Record<string,string>; signal: AbortSignal; resolvedAddresses: ResolvedPublicAddress[] }) {
  const chosen = options.resolvedAddresses[0];
  if (!chosen || options.resolvedAddresses.some(({address}) => !publicIp(address))) throw new Error("A checked public address is required.");
  return new Promise<Response>((resolve, reject) => {
    const request = httpsRequest(url, {
      method: "GET", headers: { ...options.headers, "Accept-Encoding": "identity" }, signal: options.signal,
      // Preserve the original hostname for Host, SNI and certificate validation.
      // The transport never performs a second DNS resolution.
      lookup: (_hostname, lookupOptions, callback) => {
        const entry = {address: chosen.address, family:isIP(chosen.address)};
        if (lookupOptions.all) callback(null,options.resolvedAddresses.map(({address}) => ({address,family:isIP(address)})));
        else callback(null,entry.address,entry.family);
      }
    }, response => {
      try {
        const headers = new Headers();
        for (const [key,value] of Object.entries(response.headers)) if (value !== undefined) headers.set(key,Array.isArray(value)?value.join(", "):value);
        const status = response.statusCode ?? 502;
        const encoding = headers.get("content-encoding")?.trim().toLowerCase();
        const decoder = encoding === "gzip" ? createGunzip() : encoding === "deflate" ? createInflate() : encoding === "br" ? createBrotliDecompress() : null;
        if (encoding && encoding !== "identity" && !decoder) { response.destroy(); reject(new Error("Unsupported source content encoding.")); return; }
        const stream = decoder ? response.pipe(decoder) : response;
        if (decoder) {
          response.once("error", error => decoder.destroy(error));
          decoder.once("close", () => response.destroy());
          headers.delete("content-length"); headers.delete("content-encoding");
        }
        if ([204,205,304].includes(status)) response.destroy();
        resolve(new Response([204,205,304].includes(status)?null:Readable.toWeb(stream) as ReadableStream<Uint8Array>,{status,headers}));
      } catch (error) {
        response.destroy();
        reject(error);
      }
    });
    request.once("error",reject);
    request.end();
  });
}

export async function boundedBody(response: Response, maxBytes: number) {
  if (Number(response.headers.get("content-length") ?? 0) > maxBytes) {
    await response.body?.cancel().catch(() => {});
    throw new Error("Response exceeds the byte limit.");
  }
  if (!response.body) return Buffer.alloc(0);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error("Response exceeds the byte limit.");
      chunks.push(value);
    }
    return Buffer.concat(chunks,size);
  } catch (error) { await reader.cancel().catch(() => {}); throw error; }
  finally { reader.releaseLock(); }
}

export async function fetchPublicBytes(input: string, options: {
  maxBytes: number; allowedTypes: string[]; userAgent: string; timeoutMs?: number;
  resolver?: PublicResolver; request?: typeof pinnedPublicRequest;
}) {
  const timeoutMs=options.timeoutMs ?? 15_000;
  let current=input;
  const signal=AbortSignal.timeout(timeoutMs);
  for (let hop=0;hop<=5;hop++) {
    signal.throwIfAborted();
    const checked=await assertPublicUrl(current,options.resolver,timeoutMs);
    const response=await (options.request ?? pinnedPublicRequest)(checked.href,{
      headers:{"User-Agent":options.userAgent,Accept:options.allowedTypes.join(", ")},signal,resolvedAddresses:checked.resolvedAddresses
    });
    if ([301,302,303,307,308].includes(response.status)) {
      const location=response.headers.get("location"); await response.body?.cancel().catch(()=>{});
      if (!location || hop===5) throw new Error("Invalid or excessive source redirects.");
      current=new URL(location,checked).href;continue;
    }
    const contentType=(response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!response.ok || !options.allowedTypes.includes(contentType)) {
      await response.body?.cancel().catch(()=>{});
      throw new Error(`Unsupported public source response: HTTP ${response.status}, ${contentType || "missing content type"}.`);
    }
    return {body:await boundedBody(response,options.maxBytes),contentType,finalUrl:checked.href};
  }
  throw new Error("No public source response.");
}
