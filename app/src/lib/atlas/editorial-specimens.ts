import { krakenSavedDossier } from "@/lib/atlas/editorial-kraken-saved";
import { previewOrganization } from "@/lib/atlas/dossier-preview-fixtures";
import type { AtlasOrganization } from "@/types/atlas";
import type { SnapshotObservation } from "@/lib/atlas/company-snapshot";

const q2 = "https://www.krakenrobotics.com/news-releases/kraken-robotics-reports-q2-2026-financial-results/";
export const reportedRevenue: SnapshotObservation = {
  id: "q2-revenue", metric: "revenue", subjectName: "Kraken Robotics", scopeRelation: "organization",
  reportingScope: "Standalone Kraken; excludes Covelya", amount: 27300000, amountHigh: null, unit: "currency", currency: "CAD", textValue: null,
  basis: "reported_actual", period: "Quarter ended June 30, 2026", asOf: "2026-06-30",
  qualification: "The acquisition closed after this reporting period, on July 2. This is not revenue for the enlarged group or full-year guidance.",
  sourceId: "kraken-q2", sourceUrl: q2, sourceLocator: "Q2 2026 financial highlights and scope note"
};
function specimen(name: string, slug: string, description: string, sourceUrl: string, operatingContext: string): AtlasOrganization {
  return {...previewOrganization, name, legalName: null, slug, lastReviewedAt: null, description, websiteUrl: sourceUrl, primaryLocation: null,
    categories: [], sourceConfidence: "needs_review", freshnessStatus: "review_due", locations: [], logo: null, mediaAssets: [],
    foundedYear: null, employeeRange: null, companyStage: null, ownership: null, commercialStatus: null, disclosedFinancingSummary: null,
    defencePosture: null, dualUsePosture: null, capabilities: [], programs: [], fundingEvents: [], relationships: [], profileData: {},
    editorialProfile: {version:"organization_editorial_profile_v1",currentActivity:null,currentActivityAsOf:null,operatingContext,canadianFootprint:null,reviewedQuestions:[]},
    citations:[{id:slug,fieldName:"description",sourceTitle:`${name} source`,sourceUrl,publisher:name,sourceType:"official",excerpt:"Source-linked editorial paraphrase; consult the linked original.",publishedAt:null}]
  };
}
export const editorialSpecimens = {
  saved: specimen("Kraken Robotics", "kraken-editorial-only", "Kraken Robotics develops underwater sensing and power systems. Its towed synthetic-aperture sonar produces seabed imagery; its pressure-tolerant batteries serve a different integration need: supplying subsea power.", "https://www.krakenrobotics.com/products/katfish/", "Examine the sonar and battery offerings separately. The retained evidence describes KATFISH as a stabilized towed imaging system and SeaPower as encapsulated lithium-ion cells with battery-management electronics. Those descriptions establish the offerings; they do not establish suitability for a particular platform."),
  enhanced: structuredClone(krakenSavedDossier),
  private: specimen("Cellula Robotics", "cellula-specimen", "Cellula Robotics develops autonomous underwater vehicles. Its Envoy product page describes a family of vehicles; a buyer should identify the configuration before interpreting endurance, payload or depth figures.", "https://cellula.com/envoy-auv/", "Cellula lists battery and hydrogen fuel-cell configurations separately: up to 168 hours and 930 km for the battery version, versus 370 hours and 2,000 km for the fuel-cell version. These are company-reported specifications, not independent trial results. The same page contains differing general and tabulated depth/weight figures. Ask for a dated configuration sheet and test conditions before comparing a particular vehicle. Delivery may require an export licence; some options are limited by customer type."),
  centre: specimen("COVE", "cove-specimen", "COVE's Stella Maris testing service provides a route to investigate a marine technology in a dockside and subsea setting.", "https://covesolutions.com/programs-services/stella-maris-testing-solution/", "An enquiry should describe the test objective, interfaces and deployment requirements. Access and any programme support are conditional on the particular project; the existence of the facility does not establish that a technology has passed a test or qualifies for funding.")
};
editorialSpecimens.enhanced.editorialProfile.snapshotObservations = [reportedRevenue];
// Added reporting clarification belongs beside the retained acquisition narrative.
editorialSpecimens.enhanced.disclosedFinancingSummary += " The reported CAD 27.3 million quarter ended June 30 excludes Covelya, acquired July 2. Enlarged-group annual guidance covers a different scope and remains a forecast, not achieved quarterly revenue.";
editorialSpecimens.centre.entityKind = "ecosystem_organization";
export const savedComparison = {
  packet: "research/ingestion/candidate-batches-v2/tnm-manual-20260906074301.json",
  before: "See the seabed and underwater objects in high resolution from a towable survey system. Kraken Robotics develops synthetic-aperture sonar, subsea imaging, power, and robotic technology from Canada.",
  evidence: [
    {url:"https://www.krakenrobotics.com/products/katfish/", note:"Saved KATFISH evidence: stabilized towed sonar and seabed imaging."},
    {url:"https://www.krakenrobotics.com/products/seapower/", note:"Saved SeaPower evidence: encapsulated lithium-ion cells and battery-management electronics."}
  ]
};

export const analyticalSpecimen = {
 title: "Kraken's acquisition changes the reporting comparison",
 paragraphs: ["Kraken reported Q2 revenue before Covelya joined the group. The transaction closed on July 2, after the June 30 quarter-end. Readers comparing quarterly performance with annual guidance therefore face two differences: achieved results versus forecast, and standalone operations versus an enlarged group.", "That matters for a supplier or investor assessing scale: a larger annual number alone cannot establish like-for-like growth. The practical next step is to inspect the acquisition scope and subsequent reporting before comparing margins or delivery capacity. This is a bounded interpretation of the reporting chronology, not a company rating."],
 sourceUrl: q2,
 email: "Kraken's reported quarter and enlarged-group guidance cover different scopes. Before comparing the numbers, check what the July acquisition adds. Open the original results and reporting-scope note."
};

editorialSpecimens.enhanced.logo={id:"private-preview-logo",publicUrl:"/dev/editorial-preview/logo.svg",storagePath:"private-preview-only",sourceUrl:"https://www.krakenrobotics.com/wp-content/uploads/2025/03/logo.svg",attributionText:"Kraken Robotics official mark; local inspection only"};

editorialSpecimens.centre.editorialProfile.snapshotObservations = [{
  id: "stella-maris-access", metric: "access", subjectName: "COVE", scopeRelation: "organization",
  reportingScope: "Stella Maris testing service", amount: null, amountHigh: null, unit: "text", currency: null,
  textValue: "Project enquiry", basis: "conditional", period: "Service information reviewed September 12, 2026", asOf: "2026-09-12",
  qualification: "Describe the test objective, interfaces and deployment requirements. Access and any programme support depend on the project; this is not a confirmed booking or funding award.",
  sourceId: "cove-specimen", sourceUrl: "https://covesolutions.com/programs-services/stella-maris-testing-solution/", sourceLocator: "Stella Maris testing service and enquiry"
}];
