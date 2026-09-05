import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAtlasTestDatabase } from "./helpers/atlas-database";
let db: PGlite;
beforeAll(async () => { db = await createAtlasTestDatabase(); }, 30_000);
afterAll(async () => { await db?.close(); });
const reserve = (subject: string, limit=3) => db.query<{allowed:boolean;used:number}>("select * from public.reserve_assistant_request($1,$2)",[subject,limit]);
describe("atomic paid-request reservations", () => {
  it("admits exactly the allowed count from concurrent arrivals independently of search telemetry", async () => {
    await db.exec("set role service_role");
    const results = await Promise.all(Array.from({length:12},()=>reserve("a".repeat(64))));
    expect(results.filter(result=>result.rows[0].allowed)).toHaveLength(3);
    expect(results.at(-1)?.rows[0]).toEqual({allowed:false,used:3});
    await db.exec("reset role; delete from public.pilot_searches");
    expect((await reserve("a".repeat(64))).rows[0]).toEqual({allowed:false,used:3});
  });
  it("expires individual reservations using database time and isolates subjects", async () => {
    await db.query("insert into private.assistant_request_reservations(subject_hash,reserved_at) values ($1,array[now()-interval '25 hours',now(),now()])",["b".repeat(64)]);
    expect((await reserve("b".repeat(64))).rows[0]).toEqual({allowed:true,used:3});
    expect((await reserve("c".repeat(64))).rows[0]).toEqual({allowed:true,used:1});
  });
  it.each(["anon","authenticated"])("denies direct %s RPC and ledger access", async (role) => {
    await db.exec(`set role ${role}`);
    try {
      await expect(reserve("d".repeat(64))).rejects.toThrow(/permission denied/);
      await expect(db.exec("select * from private.assistant_request_reservations")).rejects.toThrow(/permission denied/);
    } finally { await db.exec("reset role"); }
  });
  it("rejects invalid policies and retains the existing retention-job result shape", async () => {
    await expect(reserve("x",3)).rejects.toThrow(/Invalid assistant/);
    await expect(reserve("e".repeat(64),0)).rejects.toThrow(/Invalid assistant/);
    await db.query("insert into private.assistant_request_reservations(subject_hash,updated_at) values ($1,now()-interval '25 hours')",["f".repeat(64)]);
    await db.exec("set role service_role");
    try {
      expect((await db.query("select * from private.purge_expired_product_telemetry()")).rows[0]).toHaveProperty("deleted_searches");
      expect((await db.query("select subject_hash from private.assistant_request_reservations where subject_hash=$1",["f".repeat(64)])).rows).toHaveLength(0);
    } finally { await db.exec("reset role"); }
  });
});
