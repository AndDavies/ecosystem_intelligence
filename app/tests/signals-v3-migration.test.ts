import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signalEvidenceSnapshot } from "../src/lib/signals/publisher";
import { signalsV3Fixture } from "./fixtures/daily-signals-v3";
let db: PGlite;
let counter = 0;
async function seed(count = 1) {
  counter += 1;
  const runId = `signals-v3-sql-${counter}`;
  const packet = signalsV3Fixture(count);
  const edition = randomUUID(); const writerToken = randomUUID();
  await db.query(`insert into public.signal_runs(run_id,status,selected_count,writer_token,report) values ($1,'started',$2,$3,$4)`, [runId,count,writerToken,JSON.stringify({ payload_hash: "test-payload-hash-1234", assembly_edition_id:edition, edition_date:`2026-10-${String(counter).padStart(2, '0')}`, edition_slug:`industrial-capacity-changes-canadian-delivery-${counter}`, planned_source_ids:{} })]);
  await db.query(`insert into public.signal_editions(id,slug,edition_date,title,executive_summary,summary_sections,packet_schema_version,run_id,publication_status) values ($1,$2,$3,$4,$5,$6,'daily_signals_packet_v3',$7,'archived')`, [edition,`industrial-capacity-changes-canadian-delivery-${counter}`,`2026-10-${String(counter).padStart(2, '0')}`,packet.title,packet.summary.opening,JSON.stringify(packet.summary),runId]);
  const ids: string[] = [];
  for (const item of packet.items) {
    const itemId = (await db.query<{ id: string }>(`insert into public.signal_items(edition_id,slug,position,title,lane,tags,bottom_line,executive_summary,source_fact,automated_read,unknowns,next_step,confidence,event_fingerprint,content_hash) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,null,null,null,$10,$11,$12) returning id`, [edition,item.slug,item.storyPosition,item.title,item.lane,item.tags,item.bottomLine,item.executiveSummary,item.sourceFact,item.confidence,item.eventFingerprint,item.contentHash])).rows[0].id;
    ids.push(itemId);
    const source = item.sources[0];
    const sourceId = (await db.query<{ id: string }>(`insert into public.signal_sources(canonical_url,title,publisher,source_family,authority,evidence_locator,evidence_excerpt,content_hash) values ($1,$2,$3,$4,$5,$6,$7,$8) on conflict(canonical_url) do update set canonical_url=excluded.canonical_url returning id`, [source.canonicalUrl,source.title,source.publisher,source.sourceFamily,source.authority,source.evidenceLocator,source.evidenceExcerpt,source.contentHash])).rows[0].id;
    await db.query(`insert into public.signal_item_sources(item_id,source_id,is_primary,evidence_snapshot) values ($1,$2,true,$3)`, [itemId,sourceId,JSON.stringify(signalEvidenceSnapshot(source))]);
  }
  return { runId, edition, itemIds: ids, writerToken };
}
async function finalize(fixture: Awaited<ReturnType<typeof seed>>, hash: string | null = "test-payload-hash-1234") {
  await db.exec('set role service_role');
  try { return await db.query<{ result: Record<string, unknown> }>('select public.finalize_signal_edition($1,$2,$3,$4) result',[fixture.runId,fixture.edition,hash,fixture.writerToken]); }
  finally { await db.exec('reset role'); }
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key); create schema private; create function private.is_atlas_staff() returns boolean language sql as $$select false$$; grant usage on schema public, private to service_role, authenticated, anon;`);
  for (const file of ['20260803140603_add_daily_signals.sql','20260803141858_fix_daily_signal_public_rls.sql','20260803142218_reconcile_daily_signal_read_policies.sql','20260905121239_signals_v3_editorial_and_publication.sql']) await db.exec(await readFile(`supabase/migrations/${file}`,'utf8'));
}, 30000);
afterAll(async () => { await db?.close(); });

describe('Signals v3 SQL boundary', () => {
  it('publishes more than eight items and the run in one service-only transaction', async () => {
    const fixture = await seed(9);
    expect((await finalize(fixture)).rows[0].result.publicationStatus).toBe('published');
    const state = await db.query<{ status: string; publication_status: string; source_family_count: number }>('select run.status,edition.publication_status,run.source_family_count from public.signal_runs run join public.signal_editions edition on edition.id=run.edition_id where run.run_id=$1',[fixture.runId]);
    expect(state.rows[0]).toEqual({status:'published',publication_status:'published',source_family_count:1});
    const publishedAt = (await db.query<{ published_at: string }>('select published_at from public.signal_editions where id=$1',[fixture.edition])).rows[0].published_at;
    await finalize(fixture);
    expect((await db.query<{ published_at: string }>('select published_at from public.signal_editions where id=$1',[fixture.edition])).rows[0].published_at).toEqual(publishedAt);
  });
  it('denies anonymous and authenticated finalization', async () => {
    const fixture = await seed();
    for (const role of ['anon','authenticated']) {
      await db.exec(`set role ${role}`);
      try { await expect(db.query('select public.finalize_signal_edition($1,$2,$3,$4)',[fixture.runId,fixture.edition,'test-payload-hash-1234',fixture.writerToken])).rejects.toThrow(/permission denied/); }
      finally { await db.exec('reset role'); }
    }
  });
  it('rejects malformed summaries and evidence snapshots rather than allowing SQL NULL checks through', async () => {
    const fixture = await seed();
    for (const value of [{}, {opening:'OK',takeaway:null,limitation:null},{opening:'OK',takeaway:'OK'}]) await expect(db.query('update public.signal_editions set summary_sections=$1 where id=$2',[JSON.stringify(value),fixture.edition])).rejects.toThrow(/check constraint/);
    await db.query('delete from public.signal_item_sources where item_id=$1',[fixture.itemIds[0]]);
    const sourceId = (await db.query<{id:string}>('select id from public.signal_sources limit 1')).rows[0].id;
    const valid = signalEvidenceSnapshot(signalsV3Fixture().items[0].sources[0]);
    for (const value of [{}, {...valid,supportType:null},{...valid,contentHash:null},{...valid,accessedAt:'2026-99-55T00:00:00Z'},{...valid,title:12345}]) await expect(db.query('insert into public.signal_item_sources(item_id,source_id,is_primary,evidence_snapshot) values ($1,$2,true,$3)',[fixture.itemIds[0],sourceId,JSON.stringify(value)])).rejects.toThrow(/check constraint/);
  });
  it('freezes evidence while later source metadata changes independently', async () => {
    const fixture = await seed();
    await finalize(fixture);
    const old = (await db.query<{evidence_snapshot:unknown}>('select evidence_snapshot from public.signal_item_sources where item_id=$1',[fixture.itemIds[0]])).rows[0].evidence_snapshot;
    await expect(db.query("update public.signal_item_sources set evidence_snapshot = evidence_snapshot || '{\"evidenceLocator\":\"rewritten history\"}'::jsonb where item_id=$1",[fixture.itemIds[0]])).rejects.toThrow(/immutable/);
    await db.exec("update public.signal_sources set evidence_locator='A later page locator'");
    expect((await db.query<{evidence_snapshot:unknown}>('select evidence_snapshot from public.signal_item_sources where item_id=$1',[fixture.itemIds[0]])).rows[0].evidence_snapshot).toEqual(old);
  });
  it('requires a real payload hash, unique events, exactly one primary, and complete item preparation', async () => {
    const fixture = await seed(2);
    await expect(finalize(fixture,null)).rejects.toThrow(/identity or payload/);
    await db.query('update public.signal_items set event_fingerprint=$1 where edition_id=$2',['duplicate-event',fixture.edition]);
    await expect(finalize(fixture)).rejects.toThrow(/nonempty, contiguous/);
    await db.query('update public.signal_items set event_fingerprint=id::text where edition_id=$1',[fixture.edition]);
    await db.query('update public.signal_item_sources set is_primary=false where item_id=$1',[fixture.itemIds[0]]);
    await expect(finalize(fixture)).rejects.toThrow(/nonempty, contiguous/);
    await db.query('update public.signal_item_sources set is_primary=true where item_id=$1',[fixture.itemIds[0]]);
    await db.query('delete from public.signal_items where id=$1',[fixture.itemIds[1]]);
    await expect(finalize(fixture)).rejects.toThrow(/nonempty, contiguous/);
  });
  it('rolls back edition visibility if the run update fails inside finalization', async () => {
    const fixture = await seed();
    await db.exec(`create function private.reject_signal_run_update() returns trigger language plpgsql as $$begin raise exception 'injected run failure'; end$$; create trigger fail_signal_run before update on public.signal_runs for each row execute function private.reject_signal_run_update();`);
    await expect(finalize(fixture)).rejects.toThrow(/injected run failure/);
    await db.exec('drop trigger fail_signal_run on public.signal_runs; drop function private.reject_signal_run_update();');
    expect((await db.query<{publication_status:string}>('select publication_status from public.signal_editions where id=$1',[fixture.edition])).rows[0].publication_status).toBe('archived');
    expect((await db.query<{status:string}>('select status from public.signal_runs where run_id=$1',[fixture.runId])).rows[0].status).toBe('started');
  });
  it('keeps private assembled editions and run reports out of anonymous reads', async () => {
    const fixture = await seed();
    await db.exec('set role anon');
    try { expect((await db.query('select id from public.signal_editions where id=$1',[fixture.edition])).rows).toEqual([]); await expect(db.query('select * from public.signal_runs')).rejects.toThrow(/permission denied/); }
    finally { await db.exec('reset role'); }
  });
  it('never cleans a committed run, including an edition archived after publication', async () => {
    const fixture=await seed(); await finalize(fixture);
    await db.query("update public.signal_editions set publication_status='archived' where id=$1",[fixture.edition]);
    await db.exec('set role service_role');
    try { const result=await db.query<{result:{outcome:string}}>('select public.cleanup_signal_edition_run($1,$2,$3,$4) result',[fixture.runId,'test-payload-hash-1234',fixture.writerToken,'late error']); expect(result.rows[0].result.outcome).toBe('already_published'); }
    finally { await db.exec('reset role'); }
    expect((await db.query('select id from public.signal_editions where id=$1',[fixture.edition])).rows).toHaveLength(1);
  });
  it('recovers only an exact uncommitted attempt and rejects its stale writer afterward', async () => {
    const fixture=await seed(); const token=randomUUID(); const newEdition=randomUUID();
    const priorOutcomes=[{status:'blocked',report:{reason:'Annex access interrupted',coverage_complete:false}}];
    await db.query("update public.signal_runs set report=report || jsonb_build_object('previous_outcomes',$1::jsonb,'source_gap','annex access') where run_id=$2",[JSON.stringify(priorOutcomes),fixture.runId]);
    const previous=(await db.query<{report:Record<string,unknown>}>('select report from public.signal_runs where run_id=$1',[fixture.runId])).rows[0].report;
    // Recovery supplies a fresh report, not a copy of the previous stored lineage.
    const report={payload_hash:previous.payload_hash,edition_date:previous.edition_date,edition_slug:previous.edition_slug,planned_source_ids:{},assembly_edition_id:newEdition};
    await db.exec('set role service_role');
    try { expect((await db.query<{result:{outcome:string}}>('select public.cleanup_signal_edition_run($1,$2,$3,$4,$5,$6) result',[fixture.runId,'test-payload-hash-1234',fixture.writerToken,'explicit recovery',token,JSON.stringify(report)])).rows[0].result.outcome).toBe('cleaned'); }
    finally { await db.exec('reset role'); }
    const recovered=(await db.query<{report:Record<string,unknown>}>('select report from public.signal_runs where run_id=$1',[fixture.runId])).rows[0].report;
    expect(recovered.previous_outcomes).toEqual(priorOutcomes);
    expect(recovered.previous_attempts).toEqual([expect.objectContaining({report:expect.objectContaining({source_gap:'annex access'})})]);
    expect((recovered.previous_attempts as {report:Record<string,unknown>}[])[0].report).not.toHaveProperty('previous_outcomes');
    expect((await db.query('select id from public.signal_editions where id=$1',[fixture.edition])).rows).toHaveLength(0);
    await expect(finalize(fixture)).rejects.toThrow(/identity or payload/);
    await expect(db.query('select public.cleanup_signal_edition_run($1,$2,$3,$4)',[fixture.runId,'test-payload-hash-1234',fixture.writerToken,'stale cleanup'])).rejects.toThrow(/writer changed/);
    const guard=(await db.query<{definition:string}>("select pg_get_functiondef('private.guard_signal_assembly_insert()'::regprocedure) definition")).rows[0].definition;
    expect(guard).toMatch(/from public\.signal_runs[\s\S]*for share/i);
  });

});
