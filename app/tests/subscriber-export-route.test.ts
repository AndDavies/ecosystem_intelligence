import {beforeEach,describe,expect,it,vi} from "vitest";
const state=vi.hoisted(()=>({authorized:true,failPreferences:false,failPage:false,signups:[] as Record<string,unknown>[],preferences:[] as Record<string,unknown>[]}));
vi.mock("@/lib/atlas/auth",()=>({requireAdminOwner:async()=>{if(!state.authorized)throw new Error("Forbidden");}}));
vi.mock("@/lib/supabase/admin",()=>({createAdminClient:()=>({from:(table:string)=>{
  const query={select:()=>query,order:()=>query,range:async(from:number,to:number)=>{
    if(table==="newsletter_subscription_preferences" && (state.failPreferences || state.failPage&&from>=1000))return {data:null,error:{message:"unavailable"}};
    const rows=table==="pilot_update_signups"?state.signups:state.preferences;
    return {data:rows.slice(from,to+1),error:null};
  }};return query;
}})}));
import {GET} from "@/app/api/admin/subscribers/route";
beforeEach(()=>{
  state.authorized=true;state.failPreferences=false;state.failPage=false;
  state.signups=Array.from({length:1205},(_,i)=>({id:`subscriber-${i}`,email:`member-${i}@example.ca`,cohort:i===1204?' \t=HYPERLINK("https://example.com")':"regular"}));
  state.preferences=state.signups.flatMap(row=>[{subscriber_id:row.id,stream:"weekly",status:"subscribed",provider_sync_status:"synced"},{subscriber_id:row.id,stream:"signal_alerts",status:"unsubscribed",provider_sync_status:"synced"}]);
});
describe("owner subscriber CSV export",()=>{
  it("exports every subscriber and preference with formula-safe text",async()=>{
    const response=await GET();const csv=await response.text();const rows=csv.split("\n");
    expect(response.status).toBe(200);expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(rows).toHaveLength(1206);expect(rows.at(-1)).toContain('"member-1204@example.ca"');
    expect(rows.at(-1)).toContain('"\' \t=HYPERLINK(""https://example.com"")"');
    expect(rows.at(-1)).toContain('"weekly:synced|signal_alerts:synced"');
  });
  it.each(["first","later"])("fails instead of exporting incomplete consent data on %s preference-page failure",async(page)=>{
    state.failPreferences=page==="first";state.failPage=page==="later";
    expect((await GET()).status).toBe(500);
  });
  it("retains the owner-only boundary",async()=>{state.authorized=false;expect((await GET()).status).toBe(403);});
});
