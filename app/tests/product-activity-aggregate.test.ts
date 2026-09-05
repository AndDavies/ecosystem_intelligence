import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { expect,it } from "vitest";
it("preserves idempotent anonymous aggregates while excluding non-production and private events",async()=>{
  const db=new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema private;
      create table public.pilot_events(created_at timestamptz,event_name text,context_path text,entry_channel text,traffic_class text,utm_source text,utm_campaign text,session_id uuid);
      insert into public.pilot_events values
      (now()-interval '2 days','dossier_open','/organizations/example','organic_google','production',null,null,'11111111-1111-4111-8111-111111111111'),
      (now()-interval '2 days','dossier_open','/organizations/example','organic_google','production','linkedin','pilot','11111111-1111-4111-8111-111111111111'),
      (now()-interval '2 days','dossier_open','/organizations/example','direct','staff',null,null,null),
      (now()-interval '2 days','dossier_open','/account','direct','production',null,null,null),
      (now()-interval '2 days','save','/organizations/example','internal','production',null,null,null);
    `);
    await db.exec(await readFile(new URL("../supabase/migrations/20260905120323_visibility_product_daily_aggregates.sql",import.meta.url),"utf8"));
    await db.query("select private.refresh_product_activity_daily()");
    const rows=await db.query<{events:number;observed_sessions:number;tagged_events:number}>("select events::int,observed_sessions::int,tagged_events::int from public.product_activity_daily where event_name='dossier_open'");
    expect(rows.rows).toEqual([{events:2,observed_sessions:1,tagged_events:1}]);
    const privileges=await db.query<{allowed:boolean}>("select has_function_privilege('anon','public.get_product_activity_summary(date,date)','execute') as allowed");
    expect(privileges.rows[0].allowed).toBe(false);
    const summary=await db.query<{summary:{rows:unknown[]}}>("select public.get_product_activity_summary(current_date-28,current_date-1) as summary");
    expect(summary.rows[0].summary.rows).toHaveLength(2);
    expect(JSON.stringify(summary.rows)).not.toContain("11111111");
  } finally {await db.close();}
},20000);
