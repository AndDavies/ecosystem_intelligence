import { EventEmitter } from "node:events";
import { Readable } from "node:stream";
import { describe, expect, it, vi } from "vitest";
const transport = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("node:https", () => ({ request: transport.request }));
import { assertPublicUrl, boundedBody, fetchPublicBytes, pinnedPublicRequest, publicIp } from "@/lib/security/public-outbound";

const resolver = vi.fn(async () => [{address:"8.8.8.8",family:4}]);
const options = { maxBytes:32,allowedTypes:["image/png"],userAgent:"test",resolver };
const response = (body="valid",headers:Record<string,string>={})=>new Response(body,{headers:{"content-type":"image/png",...headers}});
describe("public source transport", () => {
  it.each(["127.0.0.1","10.0.0.1","169.254.169.254","100.64.1.2","192.88.99.1","::1","::ffff:127.0.0.1","64:ff9b::7f00:1","2002:7f00:1::","2001::1","2001:db8::1","3fff::1","fe80::1","not-an-address"])("rejects private, translated or reserved address %s",(address)=>{
    expect(publicIp(address)).toBe(false);
  });
  it.each(["https://127.1/image","https://2130706433/image","https://[::ffff:127.0.0.1]/image","http://example.com/image","https://name:password@example.com/image","https://example.com:8443/image"])("rejects unsafe URL before transport: %s", async (url)=>{
    const request=vi.fn();await expect(fetchPublicBytes(url,{...options,request})).rejects.toThrow();expect(request).not.toHaveBeenCalled();
  });
  it("rejects a mixed public/private DNS set without selecting its public member",async()=>{
    const request=vi.fn();await expect(fetchPublicBytes("https://example.com/image",{...options,request,resolver:async()=>[{address:"8.8.8.8"},{address:"10.0.0.1"}]})).rejects.toThrow(/private\/reserved/);expect(request).not.toHaveBeenCalled();
  });
  it("checks each redirect before sending it and preserves legitimate CDN redirects",async()=>{
    const request=vi.fn().mockResolvedValueOnce(new Response(null,{status:302,headers:{location:"https://cdn.example.com/image"}})).mockResolvedValueOnce(response());
    const result=await fetchPublicBytes("https://example.com/image",{...options,request});
    expect(result.body.toString()).toBe("valid");expect(result.finalUrl).toBe("https://cdn.example.com/image");expect(request).toHaveBeenCalledTimes(2);
    request.mockReset().mockResolvedValue(new Response(null,{status:302,headers:{location:"https://127.0.0.1/private"}}));
    await expect(fetchPublicBytes("https://example.com/image",{...options,request})).rejects.toThrow(/Private/);expect(request).toHaveBeenCalledOnce();
  });
  it("stops redirect loops",async()=>{
    const request=vi.fn(async()=>new Response(null,{status:302,headers:{location:"/again"}}));
    await expect(fetchPublicBytes("https://example.com/image",{...options,request})).rejects.toThrow(/excessive/);expect(request).toHaveBeenCalledTimes(6);
  });
  it.each<Record<string,string>>([{}, {"content-length":"1"}])("enforces streamed bytes despite missing or false declared length: %j",async(headers)=>{
    const cancel=vi.fn();let reads=0;
    const body=new ReadableStream({pull(controller){reads++;controller.enqueue(new Uint8Array(20));},cancel});
    await expect(boundedBody(new Response(body,{headers}),32)).rejects.toThrow(/byte limit/);expect(cancel).toHaveBeenCalledOnce();expect(reads).toBeLessThanOrEqual(3);
  });
  it("cancels an oversized declared response before reading it",async()=>{
    const cancel=vi.fn();const body=new ReadableStream({cancel});
    await expect(boundedBody(new Response(body,{headers:{"content-length":"999"}}),32)).rejects.toThrow(/byte limit/);expect(cancel).toHaveBeenCalledOnce();
  });
  it("bounds DNS resolution and rejects empty answers",async()=>{
    await expect(assertPublicUrl("https://example.com",async()=>[],10)).rejects.toThrow(/private\/reserved/);
    await expect(assertPublicUrl("https://example.com",()=>new Promise(()=>{}),10)).rejects.toThrow(/timed out/);
  });
  it("turns malformed publisher status into a rejected request instead of an uncaught callback exception",async()=>{
    transport.request.mockImplementation((_url,_config,callback)=>{
      const request=new EventEmitter() as EventEmitter & {end:()=>void};
      request.end=()=>{setImmediate(()=>callback(Object.assign(Readable.from([]),{statusCode:600,headers:{}})));};
      return request;
    });
    await expect(pinnedPublicRequest("https://example.com",{headers:{},signal:AbortSignal.timeout(1000),resolvedAddresses:[{address:"8.8.8.8"}]})).rejects.toThrow(/status/);
  });
  it("retains address-family fallback across every validated public DNS answer",async()=>{
    transport.request.mockImplementation((_url,config,callback)=>{
      const answers=vi.fn();config.lookup("example.com",{all:true},answers);
      expect(answers).toHaveBeenCalledWith(null,[{address:"2606:4700:4700::1111",family:6},{address:"8.8.8.8",family:4}]);
      const request=new EventEmitter() as EventEmitter & {end:()=>void};
      request.end=()=>callback(Object.assign(Readable.from([]),{statusCode:200,headers:{}}));return request;
    });
    await pinnedPublicRequest("https://example.com",{headers:{},signal:AbortSignal.timeout(1000),resolvedAddresses:[{address:"2606:4700:4700::1111"},{address:"8.8.8.8"}]});
  });
  it("passes the original TLS hostname with a pinned lookup and an abort deadline",async()=>{
    transport.request.mockImplementation((url,config,callback)=>{
      expect(url).toBe("https://source.example.com/image");
      const callbackSingle=vi.fn();config.lookup("source.example.com",{},callbackSingle);
      expect(callbackSingle).toHaveBeenCalledWith(null,"8.8.8.8",4);
      const callbackAll=vi.fn();config.lookup("source.example.com",{all:true},callbackAll);
      expect(callbackAll).toHaveBeenCalledWith(null,[{address:"8.8.8.8",family:4}]);
      expect(config.signal).toBeInstanceOf(AbortSignal);
      expect(config.rejectUnauthorized).not.toBe(false);
      const request=new EventEmitter() as EventEmitter & {end:()=>void};
      request.end=()=>{const incoming=Object.assign(Readable.from([Buffer.from("valid")]),{statusCode:200,headers:{"content-type":"image/png"}});callback(incoming);};
      return request;
    });
    const result=await pinnedPublicRequest("https://source.example.com/image",{headers:{},signal:AbortSignal.timeout(1000),resolvedAddresses:[{address:"8.8.8.8",family:4}]});
    expect((await boundedBody(result,32)).toString()).toBe("valid");
  });
});
