import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { publishSignalsV3, recordSignalsOutcome, signalsRunStartValues, startSignalsRun, type SignalsPublisherServices } from "../src/lib/signals/publisher";
import { signalsV3Fixture } from "./fixtures/daily-signals-v3";
type Row = Record<string, unknown>;
type Result = { data: Row | Row[] | null; error: { message: string; code?: string } | null };
class FakeQuery implements PromiseLike<Result> {
  operation = "select"; columns = ""; values: Row[] = []; filters: Array<(row: Row) => boolean> = []; maximum = Infinity; one = false; ignoreDuplicates = false;
  constructor(readonly database: FakeDatabase, readonly table: string) {}
  select(columns = "*") { this.columns = columns; return this; }
  insert(value: Row | Row[]) { this.operation = "insert"; this.values = Array.isArray(value) ? value : [value]; return this; }
  upsert(value: Row, options: { ignoreDuplicates?: boolean }) { this.operation = "upsert"; this.values = [value]; this.ignoreDuplicates = options.ignoreDuplicates ?? false; return this; }
  update(value: Row) { this.operation = "update"; this.values = [value]; return this; }
  delete() { this.operation = "delete"; return this; }
  eq(key: string, value: unknown) { this.filters.push((row) => row[key] === value); return this; }
  is(key: string, value: unknown) { this.filters.push((row) => (row[key] ?? null) === value); return this; }
  in(key: string, value: unknown[]) { this.filters.push((row) => value.includes(row[key])); return this; }
  gte(key: string, value: string) { this.filters.push((row) => String(row[key] ?? new Date().toISOString()) >= value); return this; }
  limit(count: number) { this.maximum = count; return this; }
  single() { this.one = true; return this; } maybeSingle() { this.one = true; return this; }
  then<TResult1 = Result, TResult2 = never>(onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve().then(() => this.execute()).then(onfulfilled,onrejected);
  }
  execute(): Result {
    this.database.calls.push({ table: this.table, operation: this.operation, columns: this.columns });
    if (this.database.fail?.(this)) return { data: null, error: { message: `injected ${this.table} ${this.operation} failure` } };
    const rows = this.database.rows(this.table);
    let selected = rows.filter((row) => this.filters.every((filter) => filter(row))).slice(0,this.maximum);
    if (this.operation === "insert" || this.operation === "upsert") {
      selected = [];
      for (const value of this.values) {
        if (this.operation === "upsert" && this.ignoreDuplicates && rows.some((row) => row.canonical_url === value.canonical_url)) continue;
        const row = { id: randomUUID(), edition_id: null, publication_status: "published", created_at: new Date().toISOString(), ...structuredClone(value) }; rows.push(row); selected.push(row);
      }
    } else if (this.operation === "update") { for (const row of selected) Object.assign(row,structuredClone(this.values[0])); }
    else if (this.operation === "delete") this.database.tables.set(this.table,rows.filter((row) => !selected.includes(row)));
    return { data: this.one ? structuredClone(selected[0] ?? null) : structuredClone(selected), error: null };
  }
}
class FakeDatabase {
  tables = new Map<string, Row[]>(); calls: Array<{table:string;operation:string;columns:string}> = [];
  fail?: (query: FakeQuery) => boolean; rpcFailure: "before" | "after" | null = null; archiveAfterCommit = false; cleanupRacePublish = false;
  rows(table: string) { if (!this.tables.has(table)) this.tables.set(table,[]); return this.tables.get(table)!; }
  from(table: string) { return new FakeQuery(this,table); }
  async rpc(name: string, args: {p_run_id:string;p_edition_id?:string;p_writer_token?:string;p_resume_token?:string;p_resume_report?:Row}) {
    const run = this.rows('signal_runs').find((row) => row.run_id === args.p_run_id)!;
    const edition = this.rows('signal_editions').find((row) => row.run_id === args.p_run_id);
    if(name==='cleanup_signal_edition_run') {
      if(this.cleanupRacePublish && edition) {run.status='published'; run.edition_id=edition.id; edition.publication_status='published';}
      if(run.status==='published') return {data:{outcome:'already_published'},error:null};
      if(run.writer_token!==args.p_writer_token) return {data:null,error:{message:'writer changed'}};
      if(edition) {
        const itemIds=this.rows('signal_items').filter((item)=>item.edition_id===edition.id).map((item)=>item.id);
        this.tables.set('signal_items',this.rows('signal_items').filter((item)=>!itemIds.includes(item.id)));
        this.tables.set('signal_item_sources',this.rows('signal_item_sources').filter((link)=>!itemIds.includes(link.item_id)));
        this.tables.set('signal_editions',this.rows('signal_editions').filter((row)=>row.id!==edition.id));
      }
      const ids=Object.values(((run.report as Row).planned_source_ids ?? {}) as Row);
      this.tables.set('signal_sources',this.rows('signal_sources').filter((row)=>!ids.includes(row.id) || this.rows('signal_item_sources').some((link)=>link.source_id===row.id)));
      if(args.p_resume_token) {run.writer_token=args.p_resume_token; run.report=args.p_resume_report;}
      else run.status='failed';
      return {data:{outcome:'cleaned'},error:null};
    }
    if (this.rpcFailure === "before") return { data:null,error:{message:"injected RPC rejection"} };
    edition!.publication_status=this.archiveAfterCommit?'archived':'published'; run.status='published'; run.edition_id=edition!.id;
    return this.rpcFailure === "after" ? {data:null,error:{message:"lost RPC response"}} : {data:{publicationStatus:'published'},error:null};
  }
  storage = { from: () => ({ remove: vi.fn(async () => ({error:null})) }) };
  client() { return this as unknown as SupabaseClient; }
}
function services(): SignalsPublisherServices {
  return { storeHero: vi.fn(async () => ({storagePath:'signals/test/image.webp',publicUrl:'https://example.ca/image.webp',created:true})), ensureSocialDrafts: vi.fn(async () => ({count:2,platforms:['linkedin','x'],inserted:2})) };
}

describe('Signals publisher adapter', () => {
  it('reuses canonical source IDs once per packet and preserves item-specific immutable support', async () => {
    const db = new FakeDatabase(); const packet = signalsV3Fixture(9);
    const result = await publishSignalsV3(packet,db.client(),services());
    expect(result).toMatchObject({mode:'published',publicationVerified:true});
    expect(db.calls.filter((call) => call.table==='signal_sources' && call.operation==='upsert')).toHaveLength(1);
    expect(db.rows('signal_item_sources')).toHaveLength(9);
    expect((db.rows('signal_item_sources')[0].evidence_snapshot as Row).evidenceExcerpt).not.toBe((db.rows('signal_item_sources')[1].evidence_snapshot as Row).evidenceExcerpt);
    expect(db.rows('signal_editions')[0]).toMatchObject({hero_image_path:null,packet_schema_version:'daily_signals_packet_v3'});
  });
  it('cleans an owned new orphan source on a failed snapshot write', async () => {
    const db = new FakeDatabase(); db.fail=(query)=>query.table==='signal_item_sources' && query.operation==='insert';
    await expect(publishSignalsV3(signalsV3Fixture(),db.client(),services())).rejects.toThrow(/snapshot|signal_item_sources/);
    expect(db.rows('signal_editions')).toHaveLength(0); expect(db.rows('signal_sources')).toHaveLength(0); expect(db.rows('signal_runs')[0].status).toBe('failed');
  });
  it('never overwrites or deletes a reused source during failed preparation', async () => {
    const db = new FakeDatabase(); db.rows('signal_sources').push({id:'existing-source',canonical_url:'https://example.ca/industrial-developments',evidence_excerpt:'Original preserved support'});
    db.fail=(query)=>query.table==='signal_item_sources' && query.operation==='insert';
    await expect(publishSignalsV3(signalsV3Fixture(),db.client(),services())).rejects.toThrow();
    expect(db.rows('signal_sources')).toEqual([{id:'existing-source',canonical_url:'https://example.ca/industrial-developments',evidence_excerpt:'Original preserved support'}]);
  });
  it('falls back to text-led publication when a selected image fails', async () => {
    const db=new FakeDatabase(); const api=services(); vi.mocked(api.storeHero).mockRejectedValue(new Error('image unavailable'));
    const packet=signalsV3Fixture(); packet.heroImage={imageUrl:'https://example.ca/image.jpg',sourcePageUrl:packet.items[0].sources[0].canonicalUrl,alt:'An industrial production line',attribution:'Example Company'};
    expect(await publishSignalsV3(packet,db.client(),api)).toMatchObject({publicationStatus:'published',hero:{status:'text_led'}});
  });
  it.each(['before','after'] as const)('reconciles %s-commit finalizer failure', async (failure) => {
    const db=new FakeDatabase(); db.rpcFailure=failure;
    if(failure==='before') { await expect(publishSignalsV3(signalsV3Fixture(),db.client(),services())).rejects.toThrow(/RPC/); expect(db.rows('signal_editions')).toHaveLength(0); }
    else { expect(await publishSignalsV3(signalsV3Fixture(),db.client(),services())).toMatchObject({publicationVerified:true}); expect(db.rows('signal_editions')).toHaveLength(1); }
  });
  it('preserves publication when socials, verification, or report saving fail', async () => {
    for(const stage of ['socials','verification','report']) {
      const db=new FakeDatabase(); const api=services();
      if(stage==='socials') vi.mocked(api.ensureSocialDrafts).mockRejectedValue(new Error('social storage failure'));
      if(stage==='verification') db.fail=(query)=>query.table==='signal_editions' && query.columns==='id,publication_status,slug,edition_date';
      if(stage==='report') db.fail=(query)=>query.table==='signal_runs' && query.operation==='update';
      const result=await publishSignalsV3(signalsV3Fixture(),db.client(),api);
      expect(result.publicationStatus).toBe('published'); expect(db.rows('signal_editions')[0].publication_status).toBe('published'); expect(db.rows('signal_runs')[0].status).toBe('published');
      expect(db.calls.some((call)=>call.operation==='delete')).toBe(false);
    }
  });
  it('reconciles a published rerun without a second edition and repairs packaging independently', async () => {
    const db=new FakeDatabase(); const api=services(); const packet=signalsV3Fixture();
    await publishSignalsV3(packet,db.client(),api);
    expect(await publishSignalsV3(packet,db.client(),api)).toMatchObject({mode:'idempotent',publicationVerified:true});
    expect(db.rows('signal_editions')).toHaveLength(1);
    await expect(publishSignalsV3({...packet,title:'A materially different editorial conclusion'},db.client(),api)).rejects.toThrow(/content differs/);
  });
  it('resumes only an explicit resumable blocked outcome on the same date, preserving prior evidence', async () => {
    const db=new FakeDatabase(); const packet=signalsV3Fixture();
    const outcome={schemaVersion:'daily_signals_run_outcome_v2' as const,runId:packet.runId,editionDate:packet.editionDate,outcome:'blocked' as const,inspectedCount:1,qualifiedCount:0,sourceFamilyCount:1,coverageComplete:false,reason:'An intended source stream was temporarily unavailable.',resumable:true};
    await recordSignalsOutcome(outcome,db.client());
    await publishSignalsV3(packet,db.client(),services());
    expect((db.rows('signal_runs')[0].report as Row).previous_outcomes).toEqual(expect.arrayContaining([expect.objectContaining({status:'blocked'})]));
    const blocked={status:'blocked',edition_id:null,report:{schema_version:outcome.schemaVersion,edition_date:packet.editionDate,resumable:true}};
    expect(()=>signalsRunStartValues(packet,blocked)).not.toThrow();
    expect(()=>signalsRunStartValues(packet,{...blocked,report:{...blocked.report,edition_date:'2026-09-04'}})).toThrow();
    expect(()=>signalsRunStartValues(packet,{...blocked,status:'no_publish'})).toThrow();
  });
  it('uses compare-and-swap so a second worker cannot resume an already-started blocked run', async () => {
    const db=new FakeDatabase(); const packet=signalsV3Fixture();
    db.rows('signal_runs').push({run_id:packet.runId,status:'started',edition_id:null});
    await expect(startSignalsRun(db.client(),packet,{status:'blocked',edition_id:null,report:{schema_version:'daily_signals_run_outcome_v2',edition_date:packet.editionDate,resumable:true}})).rejects.toThrow(/another worker/);
  });
  it('records idempotent nonpublishing outcomes with zero public or packaging writes', async () => {
    const db=new FakeDatabase(); const record={schemaVersion:'daily_signals_run_outcome_v2' as const,runId:'signals-private-outcome',editionDate:'2026-09-05',outcome:'no_publish' as const,inspectedCount:20,qualifiedCount:12,sourceFamilyCount:1,coverageComplete:true,reason:'The inspected material repeats already published developments.',resumable:false};
    await recordSignalsOutcome(record,db.client()); expect(await recordSignalsOutcome(record,db.client())).toMatchObject({mode:'idempotent-outcome'});
    expect(db.rows('signal_runs')).toHaveLength(1); expect(db.calls.filter((call)=>call.operation!=='select').every((call)=>call.table==='signal_runs')).toBe(true);
    await expect(recordSignalsOutcome({...record,reason:'Different outcome content'},db.client())).rejects.toThrow(/different outcome/);
  });
  it('recovers started attempts with or without partial assembly only on explicit --recover', async () => {
    for(const withEdition of [false,true]) {
      const db=new FakeDatabase(); const packet=signalsV3Fixture(); const values=signalsRunStartValues(packet,null);
      db.rows('signal_runs').push({id:randomUUID(),edition_id:null,...values});
      if(withEdition) db.rows('signal_editions').push({id:values.report.assembly_edition_id,run_id:packet.runId,slug:packet.slug,edition_date:packet.editionDate,packet_schema_version:packet.schemaVersion,publication_status:'archived'});
      await expect(publishSignalsV3(packet,db.client(),services())).rejects.toThrow(/--recover/);
      expect(await publishSignalsV3(packet,db.client(),services(),false,true)).toMatchObject({publicationVerified:true});
      expect(db.rows('signal_editions')).toHaveLength(1); expect(db.rows('signal_runs')[0].writer_token).not.toBe(values.writer_token);
    }
  });
  it('never retracts a committed edition archived before reconciliation or committed during cleanup', async () => {
    for(const race of ['archive','cleanup']) {
      const db=new FakeDatabase(); db.rpcFailure=race==='archive'?'after':'before'; db.archiveAfterCommit=race==='archive'; db.cleanupRacePublish=race==='cleanup';
      const result=await publishSignalsV3(signalsV3Fixture(),db.client(),services());
      expect(result.publicationStatus).toBe('published'); expect(db.rows('signal_editions')).toHaveLength(1); expect(db.rows('signal_runs')[0].status).toBe('published');
    }
  });
  it('can close resumed blocked work as no_publish or failed without losing its earlier report', async () => {
    for(const outcome of ['no_publish','failed'] as const) {
      const db=new FakeDatabase(); const base={schemaVersion:'daily_signals_run_outcome_v2' as const,runId:'signals-resumed-outcome',editionDate:'2026-09-05',outcome:'blocked' as const,inspectedCount:0,qualifiedCount:0,sourceFamilyCount:0,coverageComplete:false,reason:'Source access unavailable',resumable:true};
      await recordSignalsOutcome(base,db.client()); await recordSignalsOutcome({...base,outcome,coverageComplete:true,reason:'Completed resumed inspection',resumable:false},db.client());
      expect(db.rows('signal_runs')[0].status).toBe(outcome); expect((db.rows('signal_runs')[0].report as Row).previous_outcomes).toHaveLength(1);
    }
  });

});
