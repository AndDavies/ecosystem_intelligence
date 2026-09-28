import source from "./specimens.json";
import { previewOrganization } from "@/lib/atlas/dossier-preview-fixtures";
import type { AtlasCapability, AtlasCitation, AtlasOrganization } from "@/types/atlas";
import type { SnapshotObservation } from "@/lib/atlas/company-snapshot";

export const fixtureKeys = ["kraken", "airbus", "subsea", "long", "sparse", "centre", "connections"] as const;
export type FixtureKey = typeof fixtureKeys[number];

const logos: Record<string, string> = {
  airbus: "https://facoactpdckkhciamflk.supabase.co/storage/v1/object/public/atlas-public-media/candidate-logos/81940662496c98d85af2ce94a947ec2475b2c6aa50bc7de9a83db71f84dd12f8.webp",
  subsea: "https://facoactpdckkhciamflk.supabase.co/storage/v1/object/public/atlas-public-media/candidate-logos/18bb051fc5300e810887568cb79ae6a781108b3c1fa138783379bd9b57082abd.webp",
  kraken: "https://facoactpdckkhciamflk.supabase.co/storage/v1/object/public/atlas-public-media/organizations/10000000-0000-4000-8000-000000000001/logos/fb8119d9ea6a63d0cc28c301a8d62e5d872c4f3ec1e9d8ebf5f3c30313148830.webp"
};
const noRelated = { briefs: [], signals: [], organizations: [] };
export const fixtureRelated = noRelated;

export function profileFixture(key: FixtureKey): AtlasOrganization {
  if (key === "connections" || key === "centre" || key === "long" || key === "sparse") {
    const org = structuredClone(previewOrganization);
    org.presentationCopy = { displayLead: "Synthetic layout specimen for maritime sensing and systems integration. This introduction is disposable presentation copy, distinct from the complete narrative and its qualifications below.", roleDescriptor: "Maritime sensing and systems integration" };
    if (key === "centre") {
      org.entityKind = "research_test_centre";
      org.name = "Synthetic Coastal Research and Test Centre";
      org.presentationCopy.roleDescriptor = "Research, testing and shared technical infrastructure";
      org.description = "Synthetic research-centre fixture: shared facilities for maritime sensing and systems integration trials. The complete narrative explains the test environment, interfaces and access arrangements rather than a company sales offer.";
      org.editorialProfile.operatingContext = "The synthetic centre provides a controlled environment for integration trials. Visiting teams bring the selected equipment and agree the instrumentation, operator roles, data handling and recovery arrangements before testing. Facility access does not establish acceptance or qualification of a visiting team's system.";
      org.editorialProfile.snapshotObservations = [];
      org.editorialProfile.currentActivity = null;
      org.editorialProfile.currentActivityAsOf = null;
      org.commercialStatus = "Access is project-based in this synthetic specimen. Booking, technical support, data handling and the test configuration require agreement with the centre.";
      org.disclosedFinancingSummary = null;
      org.ownership = null;
      org.companyStage = null;
      org.employeeRange = null;
      org.programs = []; org.relationships = []; org.fundingEvents = [];
      org.capabilities.forEach(capability => { capability.missionMatches = []; capability.demandMatches = []; });
    }
    if (key === "long") {
      org.name = "Synthetic Canadian Underwater Systems Integration, Research and Sustainment Organization";
      org.capabilities = Array.from({ length: 8 }, (_, i) => ({ ...structuredClone(org.capabilities[0]), id: `synthetic-capability-${i}`, missionMatches: [], demandMatches: [], slug: `synthetic-capability-${i}`, name: `Capability ${i + 1}: long-name integration and sustainment configuration`, summary: `${org.capabilities[0].summary}\r\n\r\n${org.editorialProfile.operatingContext}\n\nThe limitations remain attached to this synthetic configuration and do not establish any real deployment.`, presentationCopy: { catalogueTeaser: "Synthetic long-content fixture. All eight records must remain reachable, including complete qualifications in the expanded summary." } }));
    }
    if (key === "sparse") {
      org.name = "Synthetic Sparse Company"; org.description = "A synthetic sparse profile with a retained full narrative and no reviewed compact copy.";
      delete org.presentationCopy; org.logo = null; org.primaryLocation = null; org.locations = []; org.websiteUrl = null; org.programs = []; org.relationships = []; org.fundingEvents = []; org.citations = []; org.mediaAssets = []; org.foundedYear = null; org.employeeRange = null; org.companyStage = null; org.ownership = null; org.commercialStatus = null; org.disclosedFinancingSummary = null;
      org.editorialProfile = {version:null,currentActivity:null,currentActivityAsOf:null,operatingContext:null,canadianFootprint:null,reviewedQuestions:[]};
      org.capabilities = [{ ...org.capabilities[1], presentationCopy: undefined, citations: [], coreFeatures: [], novelty: [], technicalTags: [], missionMatches: [], demandMatches: [], commercialAvailability:null, maturity:null, defenceApplications:[] }];
    }
    return org;
  }
  const data = source[key];
  const referenceCitation = (record: { title: string; url: string; publisher: string }, id: string, fieldName = "reference_source_record"): AtlasCitation => ({ id, fieldName, sourceTitle: record.title, sourceUrl: record.url, publisher: record.publisher, sourceType: "reference_bundle", excerpt: "", publishedAt: null });
  const capabilities: AtlasCapability[] = data.capabilities.map((cap, i) => ({
    id: `${data.id}-fixture-capability-${i + 1}`, organizationId: data.id, slug: cap.slug, name: cap.name,
    summary: cap.summary, capabilityType: cap.type, coreFeatures: cap.features, maturity: cap.maturity, commercialAvailability: cap.availability,
    presentationCopy: { displayLead: cap.teaser, catalogueTeaser: cap.teaser }, technologyReadinessLevel: null,
    defenceApplications: cap.uses, novelty: [], technicalTags: [], technicalDomains: [], missionMatches: [], demandMatches: [], sourceConfidence: "moderate", lastReviewedAt: "2026-09-27",
    citations: cap.sources.map((record, index) => referenceCitation(record, `${cap.slug}-source-${index}`))
  }));
  const observations: SnapshotObservation[] = key === "kraken" ? data.figures.map((figure, i) => ({
    id: i === 0 ? "q2-revenue" : "q2-cash", metric: i === 0 ? "revenue" : "cash", subjectName: "Kraken Robotics Inc.", scopeRelation: "organization", reportingScope: figure.scope,
    amount: i === 0 ? 27320000 : 91266000, amountHigh: null, unit: "currency", currency: "CAD", textValue: null, basis: "reported_actual", period: figure.period, asOf: "2026-06-30",
    qualification: figure.qualification, sourceId: "reference-financial-statements", sourceUrl: figure.url, sourceLocator: "Reference bundle: interim financial statements; exact passage locator not supplied."
  })) : [];
  const citations = data.sources.map((record, i) => referenceCitation(record, `${key}-source-${i}`));
  if (data.currentSource) citations.push(referenceCitation(data.currentSource, `${key}-activity`, "current_activity"));
  return {
    id: data.id, slug: data.slug, name: data.name, legalName:key === "kraken" ? "Kraken Robotics Inc." : null, description:data.description, websiteUrl:data.website, entityKind:"company", categories:[], sourceConfidence:"moderate", freshnessStatus:"current", lastReviewedAt:"2026-09-27",
    primaryLocation: {id:`${key}-location`,name:data.listedLocation,city:data.listedLocation.split(",")[0],provinceTerritory:data.region,countryCode:"CA",latitude:null,longitude:null,geographicConfidence:"city_centroid",regionSlug:""},
    locations:[],foundedYear:null,employeeRange:null,companyStage:null,ownership:data.ownership,commercialStatus:data.commercial,disclosedFinancingSummary:data.finance,defencePosture:null,dualUsePosture:null,
    profileData:{publicContact:{contactPageUrl:data.contact}}, presentationCopy:{displayLead:data.lead,roleDescriptor:data.role},
    editorialProfile:{version:"organization_editorial_profile_v1",currentActivity:data.current,currentActivityAsOf:{kraken:"2026-08-27",airbus:"2026-06-17",subsea:"2026-06-19"}[key],operatingContext:data.operating,canadianFootprint:data.footprint,executiveRelevanceSummary:data.assessment,snapshotObservations:observations,reviewedQuestions:data.questions.map((q,i)=>({id:`${key}-question-${i}`,question:q.question,context:q.context,confidence:"moderate"}))},
    logo:logos[key] ? {id:`${key}-published-logo`, publicUrl:logos[key], storagePath:"published-logo", attributionText:null, sourceUrl:data.logo} : null,
    mediaAssets:[],capabilities,programs:[],fundingEvents:[],relationships:[],citations
  };
}
