import {afterEach,describe,expect,it,vi} from "vitest";
vi.mock("server-only",()=>({}));
import {createPublicReadFallback} from "@/lib/supabase/public-read";
afterEach(()=>vi.useRealTimers());
describe("last known public data",()=>{
  it("reuses a recent success only for a transient error and expires without extending on failures",async()=>{
    vi.useFakeTimers();const load=createPublicReadFallback<number>(300_000);
    const unavailable=async()=>{throw new Error("network timeout");};
    await expect(load(unavailable)).rejects.toThrow("network timeout");
    expect(await load(async()=>42)).toBe(42);
    vi.advanceTimersByTime(299_000);expect(await load(unavailable)).toBe(42);
    vi.advanceTimersByTime(1_000);await expect(load(unavailable)).rejects.toThrow("network timeout");
    expect(await load(async()=>43)).toBe(43);
  });

  it("serves the last successful public value during a bounded Supabase 522 window", async () => {
    vi.useFakeTimers();
    const load = createPublicReadFallback<{ version: number }>(300_000);
    await expect(load(async () => ({ version: 1 }))).resolves.toEqual({ version: 1 });
    await expect(load(async () => { throw new Error("Supabase upstream returned Cloudflare 522"); })).resolves.toEqual({ version: 1 });
    vi.advanceTimersByTime(300_001);
    await expect(load(async () => { throw new Error("Supabase upstream returned Cloudflare 522"); })).rejects.toThrow("522");
    vi.useRealTimers();
  });
  it.each(["permission denied","column missing from schema","invalid public projection"])("clears old data on permanent failure: %s",async(message)=>{
    const load=createPublicReadFallback<number>();await load(async()=>42);
    await expect(load(async()=>{throw new Error(message);})).rejects.toThrow(message);
    await expect(load(async()=>{throw new Error("network timeout");})).rejects.toThrow("network timeout");
  });
});
