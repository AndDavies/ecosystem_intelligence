import savedExpectations from "./fixtures/editorial-kraken-expectations.json";
import { krakenSavedDossier } from "@/lib/atlas/editorial-kraken-saved";
import { editorialSpecimens } from "@/lib/atlas/editorial-specimens";
import { editorialMediaContextSchema } from "@/lib/atlas/editorial-media";
import { describe, it, expect } from 'vitest';
import { snapshotObservationSchema, parseSnapshotObservations, formatSnapshotDate, formatSnapshotValue } from '@/lib/atlas/company-snapshot';
import { reportedRevenue } from '@/lib/atlas/editorial-specimens';
import { organizationBundleV3Schema, researchCandidateQualityIssues } from '@/lib/research/pipeline-schema';
import { researchCandidateContractIssues, researchReviewContract } from '@/lib/research/deployment-contract';
import { buildMinimalOrganizationV3Candidate } from './fixtures/organization-dossier-candidates';
import { createAtlasTestDatabase } from './helpers/atlas-database';

describe('reviewed snapshot observations', () => {
  it('preserves reporting scope and separates forecast from actual', () => {
    expect(snapshotObservationSchema.parse(reportedRevenue).reportingScope).toContain('excludes Covelya');
    expect(formatSnapshotValue(reportedRevenue)).toBe('CAD 27,300,000');
    expect(formatSnapshotValue(reportedRevenue, 'readable')).toBe('CAD 27.3 million');
    expect(formatSnapshotValue({...reportedRevenue, amountHigh: 29300000}, 'readable')).toBe('CAD 27.3 million–29.3 million');
    expect(formatSnapshotDate(reportedRevenue.asOf)).toBe('June 30, 2026');
    expect(snapshotObservationSchema.parse({...reportedRevenue,basis:'forecast'}).basis).toBe('forecast');
  });
  it('rejects missing currency, inverted ranges and fabricated market cap', () => {
    for (const change of [{currency:null},{amountHigh:1},{metric:'market_cap',basis:'forecast'},{asOf:'2026-02-31'}]) expect(snapshotObservationSchema.safeParse({...reportedRevenue,...change}).success).toBe(false);
  });
  it('allows absent finance and a separately scoped parent, never relabels it', () => {
    expect(parseSnapshotObservations(undefined)).toEqual([]);
    expect(snapshotObservationSchema.parse({...reportedRevenue,scopeRelation:'parent',subjectName:'Parent plc'}).scopeRelation).toBe('parent');
    expect(snapshotObservationSchema.safeParse({...reportedRevenue,metric:'access',unit:'text',amount:null,currency:null,textValue:'Project enquiry required'}).success).toBe(true);
  });
  it('keeps old candidates and rejects new observations without public leaf evidence or correct entity', () => {
    const old=buildMinimalOrganizationV3Candidate();
    expect(organizationBundleV3Schema.safeParse(old).success).toBe(true);
    expect(organizationBundleV3Schema.safeParse({...old,editorialStandard:'reader_usefulness_v1',organization:{...old.organization,snapshotObservations:[reportedRevenue]}}).success).toBe(false);
  });
  it('does not require labelled prose in new output, but cannot stage it on 1.8', () => {
    const old=organizationBundleV3Schema.parse(buildMinimalOrganizationV3Candidate());
    const modern={...old,editorialStandard:'reader_usefulness_v1' as const,reviewerRationale:'The cited record supports this bounded change. Check its reporting scope and period before deciding whether to accept it; no publication has occurred.'};
    expect(researchCandidateQualityIssues(modern)).toEqual([]);
    expect(researchCandidateContractIssues([{candidate_kind:modern.candidateKind,schema_version:modern.schemaVersion,proposed_record:modern}],{...researchReviewContract,pipelineVersion:"tnm-research-pipeline/1.8.0"})).not.toEqual([]);
  });
  it('requires reuse evidence for approved explanatory media',()=>{
    expect(editorialMediaContextSchema.safeParse({subject:'Synthetic test vehicle',contextDate:null,context:'Configuration illustration only',caption:'Synthetic fixture, not deployment evidence',reuseBasis:'permission',reuseEvidenceUrl:null}).success).toBe(false);
  });
  it('executes the additive migration locally and checks scope at the database boundary', async () => {
    const db=await createAtlasTestDatabase();
    try {
      for(const [item,name,valid] of [[reportedRevenue,'Kraken Robotics',true],[reportedRevenue,'Subsidiary',false],[{...reportedRevenue,currency:null},'Kraken Robotics',false]] as const){
        const result=await db.query<{valid:boolean}>('select private.valid_company_snapshot($1::jsonb,$2,null) valid',[JSON.stringify([item]),name]);
        expect(result.rows[0].valid).toBe(valid);
      }
      const columns=await db.query<{column_name:string}>("select column_name from information_schema.columns where table_name='organization_dossiers' and column_name='snapshot_observations'");
      expect(columns.rows).toHaveLength(1);
    } finally {await db.close();}
  },20000);
});

// Regression: the enhanced specimen previously cleared the saved capabilities and profile fields.
it('retains the saved dossier while isolating enhanced evidence from the writing-only comparison', () => {
  expect(krakenSavedDossier.capabilities.map(capability => ({id:capability.id, summary:capability.summary, core_features:capability.coreFeatures, defence_applications:capability.defenceApplications}))).toEqual(savedExpectations.capabilities);
  const editorial = krakenSavedDossier.editorialProfile as unknown as Record<string,unknown>;
  const publicRecord = krakenSavedDossier as unknown as Record<string,unknown>;
  for (const [field, expected] of Object.entries(savedExpectations.editorial)) expect(editorial[field]).toEqual(expected);
  for (const [field, expected] of Object.entries(savedExpectations.organization)) expect(publicRecord[field]).toEqual(expected);
  for (const [field, expected] of Object.entries(savedExpectations.profileData)) expect(krakenSavedDossier.profileData[field]).toEqual(expected);
  expect(editorialSpecimens.enhanced.capabilities).toEqual(krakenSavedDossier.capabilities);
  expect(editorialSpecimens.saved.editorialProfile.snapshotObservations).toBeUndefined();
  expect(editorialSpecimens.saved.description).not.toContain("27.3");
  expect(editorialSpecimens.enhanced.editorialProfile.operatingContext).not.toContain("quarter");
  expect(editorialSpecimens.enhanced.disclosedFinancingSummary).toContain("excludes Covelya");
});
