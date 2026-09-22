import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { createAtlasTestDatabase } from "./helpers/atlas-database";
let db: PGlite;
beforeAll(async () => { db = await createAtlasTestDatabase(); }, 30_000);
afterAll(async () => { await db?.close(); });
const reserve = (subject: string) => db.query<{ allowed: boolean; retry_after: number }>("select * from public.reserve_export_request($1)", [subject]);
describe("atomic export allowance", () => {
  it("admits ten concurrent attempts and isolates accounts", async () => {
    await db.exec("set role service_role");
    try {
      const results = await Promise.all(Array.from({ length: 14 }, () => reserve("a".repeat(64))));
      expect(results.filter(r => r.rows[0].allowed)).toHaveLength(10);
      expect(results.at(-1)?.rows[0].retry_after).toBeGreaterThan(0);
      expect((await reserve("b".repeat(64))).rows[0].allowed).toBe(true);
    } finally { await db.exec("reset role"); }
  });
  it("enforces daily limits, expires individual entries and supports retention", async () => {
    await db.query("insert into private.export_request_reservations(subject_hash,reserved_at) values ($1,array(select now()-interval '1 hour' from generate_series(1,100)))", ["c".repeat(64)]);
    expect((await reserve("c".repeat(64))).rows[0]).toMatchObject({ allowed: false });
    await db.query("update private.export_request_reservations set reserved_at=array[now()-interval '25 hours'], updated_at=now()-interval '25 hours' where subject_hash=$1", ["c".repeat(64)]);
    expect((await reserve("c".repeat(64))).rows[0].allowed).toBe(true);
    await db.exec("update private.export_request_reservations set updated_at=now()-interval '25 hours'; set role service_role");
    try { await db.exec("select * from private.purge_expired_product_telemetry()"); expect((await db.query("select * from private.export_request_reservations")).rows).toHaveLength(0); }
    finally { await db.exec("reset role"); }
  });
  it.each(["anon", "authenticated"])("denies direct %s quota access", async role => {
    await db.exec(`set role ${role}`);
    try {
      await expect(reserve("d".repeat(64))).rejects.toThrow(/permission denied/);
      await expect(db.exec("select * from private.export_request_reservations")).rejects.toThrow(/permission denied/);
    } finally { await db.exec("reset role"); }
  });
});
