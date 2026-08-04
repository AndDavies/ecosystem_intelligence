import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const runId = "tnm-manual-20260804184703";
const candidateId = "oceanworks-international-refresh-20260804";
const leadId = "lead-oceanworks-contract-and-identity-refresh-20260804";
const organizationId = "02d7d445-5130-4c32-afbb-dae53d0019a6";
const baselineUpdatedAt = "2026-07-24T14:06:58.932707+00:00";
const createdAt = new Date().toISOString();

const paths = {
  run: `research/ingestion/runs/${runId}.json`,
  claims: `research/ingestion/claim-ledgers-v1/${runId}.json`,
  signals: `research/ingestion/signal-batches-v1/${runId}.json`,
  leads: `research/ingestion/source-leads-v2/${runId}.json`,
  candidates: `research/ingestion/candidate-batches-v2/${runId}.json`,
  review: `research/ingestion/reviews-v2/candidate-batch-${runId}.md`,
  staging: `research/ingestion/staging/${runId}.json`
};

const urls = {
  official: "https://oceanworks.com/",
  contact: "https://oceanworks.com/contact/",
  militaryProjects: "https://oceanworks.com/our-business/military/military-project-samples/",
  userContract: "https://canadabuys.canada.ca/en/tender-opportunities/contract-history/5fb0a-11j265/001/pr-003",
  canadaBuys: "https://canadabuys.canada.ca/en/tender-opportunities?current_tab=c&items_per_page=50&order=field_term_label_1_1&sort=asc&words=OceanWorks+International+Corporation",
  dndSow: "https://buyandsell.gc.ca/cds/public/2013/05/29/e339a926e5fcd7c1c0e0990a98b284f5/ABES.PROD.BK__ML.B002.E23588.EBSU000.PDF",
  cccReport: "https://publications.gc.ca/collections/collection_2017/ccc/CC131-2016-eng.pdf",
  smtContract: "https://oceanworks.com/admin/news/182.pdf",
  isedAcquisition: "https://ised-isde.canada.ca/site/loi-investissement-canada/fr/recherche/indexe-decisions-avis-investissement/tous?page=182&wbdisable=true",
  bcRegistry: "https://free.bcpublications.ca/civix/document/id/corpreg/corpreg/crpn0112fin0323",
  openCanadaContracts: "https://open.canada.ca/data/en/dataset/4fe645a1-ffcd-40c1-9385-2c771be956a4?res_page=1"
};

const targetMatch = {
  entityType: "organization",
  entityId: organizationId,
  slug: "oceanworks-international",
  matchMethods: ["canonical_url", "website_domain", "slug", "legal_name", "name"],
  confidence: "high",
  baselineUpdatedAt
};

const source = (id, title, url, publisher, sourceKind, publishedAt, locator, summary) => ({
  id, title, url, publisher, sourceKind, publishedAt, accessedAt: createdAt, locator, summary
});

const sources = {
  contact: source("oceanworks-contact", "OceanWorks International contact", urls.contact, "OceanWorks International", "official_organization_profile", null, "Contact page and public email", "OceanWorks maintains a live official contact page and public information email under the OceanWorks International operating brand."),
  userContract: source("canadabuys-oceanworks-5fb0a-11j265", "Contract history 5FB0A-11J265/001/PR", urls.userContract, "CanadaBuys", "award_or_contract", "2011-01-14T00:00:00.000Z", "Award and amendment history", "CanadaBuys records the user-supplied Canadian Commercial Corporation contract, including its 2010 award and January 2011 amendment to a total value of CAD 128,018."),
  canadaBuys: source("canadabuys-oceanworks-w8483-137107", "OceanWorks International Corporation contract history", urls.canadaBuys, "CanadaBuys", "award_or_contract", "2014-06-10T00:00:00.000Z", "Supplier search result W8483-137107/001/ML", "CanadaBuys records DND contract W8483-137107/001/ML, initially awarded in July 2013 and amended in June 2014, with a reported value of CAD 526,391."),
  dndSow: source("dnd-oceanworks-elss-sow", "Emergency Life Support Stores pod assemblies statement of work", urls.dndSow, "Department of National Defence", "procurement_notice", "2013-05-29T00:00:00.000Z", "Solicitation W8483-137107, Annex A", "The DND statement of work specifies ELSS pod assemblies for Victoria-class submarine escape towers and torpedo tubes, including pressure, size, weight, and carousel-compatibility requirements."),
  cccReport: source("ccc-oceanworks-us-navy-contract", "OceanWorks International Corporation and the sale of specialized equipment to the U.S. Navy", urls.cccReport, "Canadian Commercial Corporation", "official_report", "2016-03-31T00:00:00.000Z", "2015-16 annual report OceanWorks case study", "CCC reports that during 2015 OceanWorks successfully completed a U.S. Navy contract for specialized submarine-rescue and breathing equipment as a CCC subcontractor."),
  smtContract: source("oceanworks-safe-marine-transfer-contract", "OceanWorks awarded contract to study subsea chemical injection unit", urls.smtContract, "OceanWorks International", "official_company_news", "2015-08-10T00:00:00.000Z", "Official company release dated August 10, 2015", "OceanWorks reports that Safe Marine Transfer awarded it an engineering study for a subsea chemical injection unit involving storage, pumps, controls, sensors, electrical systems, and batteries."),
  isedAcquisition: source("ised-oceanworks-phoenix-acquisition", "Investment Canada acquisition index entry for OceanWorks", urls.isedAcquisition, "Innovation, Science and Economic Development Canada", "government_service_page", "2018-03-01T00:00:00.000Z", "March 2018 Phoenix International Holdings entry", "Investment Canada's official index records Phoenix International Holdings' acquisition of OceanWorks Holding Co. Ltd. and the submarine-rescue business of OceanWorks International Corporation in Burnaby."),
  bcRegistry: source("bc-registry-oceanworks-amalgamation", "BC corporate registry amalgamation notice for OceanWorks", urls.bcRegistry, "British Columbia Corporate Registry", "government_service_page", "2023-01-12T00:00:00.000Z", "Amalgamation entry for companies 1087916 and C1092915", "The BC registry records OceanWorks Holding Co. Ltd. and OceanWorks International Corporation as amalgamating into company 1394079 under the name OceanWorks Holding Co. Ltd."),
  militaryProjects: source("oceanworks-military-project-samples", "OceanWorks military project samples", urls.militaryProjects, "OceanWorks International", "official_company_product", null, "Turkish Navy and U.S. Navy project sections", "OceanWorks describes submarine-rescue, intervention, diving, launch-and-recovery, controls, and acceptance-testing work for named military customers and primes."),
  openCanada: source("open-canada-contract-history-dataset", "CanadaBuys contract history dataset", urls.openCanadaContracts, "Government of Canada Open Data", "government_service_page", null, "Current contract-history dataset description", "The federal open-data catalogue provides the current CanadaBuys contract-history dataset used as an additional search lane for supplier records."),
  official: source("oceanworks-official-site", "OceanWorks International official site", urls.official, "OceanWorks International", "official_organization_profile", null, "Current operating site and navigation", "The official site remains live under the OceanWorks International operating brand and continues to present military, scientific, and commercial subsea systems." )
};

const claimTarget = (fieldPath, operationId = null) => ({ candidateId, fieldPath, operationId });
const claim = ({ claimId, subjectId = "oceanworks-international", subjectType = "organization", predicate, value, unit = null, material = true, publishedAt = null, effectiveFrom = null, sourceId, url, sourceChannel, sourceFamily, sourcePosture = "evidence_anchor", independenceKey, status = "supported", independentClaimIds = [], contradictsClaimIds = [], supersedesClaimIds = [], disposition = "candidate_field", candidateTargets = [], analystNote }) => ({
  claimId, subjectId, subjectType, predicate, value, unit, material,
  temporal: { observedAt: createdAt, publishedAt, effectiveFrom, effectiveTo: null },
  source: { sourceId, originalUrl: url, canonicalUrl: url, locator: sourceFamily, sourceChannel, sourceFamily, sourcePosture, independenceKey },
  status, independentClaimIds, contradictsClaimIds, supersedesClaimIds, disposition, candidateTargets, analystNote
});

const claims = [
  claim({ claimId: "claim-oceanworks-live-operating-brand", predicate: "continues to operate publicly under the OceanWorks International brand", value: "OceanWorks maintains a live official site and contact page under the OceanWorks International operating brand.", material: false, sourceId: sources.contact.id, url: urls.contact, sourceChannel: "official_company", sourceFamily: "oceanworks-official-contact", independenceKey: "oceanworks:official-contact:2026-08-04", disposition: "deferred_backlog", analystNote: "This confirms continuing public operation but does not independently resolve the current legal entity name." }),
  claim({ claimId: "claim-oceanworks-published-legal-name", predicate: "is published in True North Map with the legal name OceanWorks International Corporation", value: "The live production organization row uses OceanWorks International Corporation as legal_name.", material: true, sourceId: sources.official.id, url: urls.official, sourceChannel: "source_book", sourceFamily: "tnm-live-oceanworks-baseline", independenceKey: "tnm:organization:02d7d445-5130-4c32-afbb-dae53d0019a6:2026-07-24", status: "superseded", supersedesClaimIds: ["claim-oceanworks-bc-amalgamation-2023"], disposition: "review_warning", candidateTargets: [claimTarget("reviewWarnings")], analystNote: "The operating brand remains current, but the legal-name field appears superseded by the official 2023 amalgamation notice." }),
  claim({ claimId: "claim-oceanworks-user-contract-baseline", subjectType: "relationship", predicate: "held Canadian Commercial Corporation contract 5FB0A-11J265/001/PR", value: "CanadaBuys records a 2010 award and January 2011 amendment for contract 5FB0A-11J265/001/PR, with a total value of CAD 128,018.", unit: "CAD", material: false, publishedAt: "2011-01-14T00:00:00.000Z", effectiveFrom: "2010-08-09T00:00:00.000Z", sourceId: sources.userContract.id, url: urls.userContract, sourceChannel: "source_book", sourceFamily: "canadabuys-contract-5fb0a-11j265", independenceKey: "canadabuys:5fb0a-11j265-001-pr", disposition: "deferred_backlog", analystNote: "This is the user-supplied comparison point; it is not added as a new relationship because the requested focus is later history." }),
  claim({ claimId: "claim-oceanworks-dnd-elss-contract", subjectType: "relationship", predicate: "received DND contract W8483-137107/001/ML", value: "CanadaBuys records DND contract W8483-137107/001/ML, initially awarded on 2013-07-12 and amended on 2014-06-10, with a reported value of CAD 526,391.", unit: "CAD", publishedAt: "2014-06-10T00:00:00.000Z", effectiveFrom: "2013-07-12T00:00:00.000Z", sourceId: sources.canadaBuys.id, url: urls.canadaBuys, sourceChannel: "government_procurement", sourceFamily: "canadabuys-oceanworks-contract-history", independenceKey: "canadabuys:w8483-137107-001-ml", candidateTargets: [claimTarget("operations.add-oceanworks-dnd-elss-relationship.value", "add-oceanworks-dnd-elss-relationship")], analystNote: "This is newer than the user's 2011 contract baseline and is represented with its award and amendment dates." }),
  claim({ claimId: "claim-oceanworks-dnd-elss-scope", subjectType: "technology", predicate: "was contracted for Emergency Life Support Stores pod assemblies", value: "DND's statement of work identifies ELSS pod assemblies for Victoria-class submarine escape towers and torpedo tubes, including compatibility with the Royal Canadian Navy ELSS Pod Carousel.", publishedAt: "2013-05-29T00:00:00.000Z", effectiveFrom: "2013-05-29T00:00:00.000Z", sourceId: sources.dndSow.id, url: urls.dndSow, sourceChannel: "government_procurement", sourceFamily: "dnd-elss-sow-w8483-137107", independenceKey: "dnd:w8483-137107:sow", status: "corroborated", independentClaimIds: ["claim-oceanworks-dnd-elss-contract"], candidateTargets: [claimTarget("operations.add-oceanworks-dnd-elss-relationship.value", "add-oceanworks-dnd-elss-relationship")], analystNote: "The SOW supplies the technical scope but does not itself establish final delivery performance." }),
  claim({ claimId: "claim-oceanworks-us-navy-contract-completed", subjectType: "relationship", predicate: "completed a U.S. Navy submarine-rescue equipment contract through CCC", value: "CCC reports that during 2015 OceanWorks successfully completed a U.S. Navy contract for specialized submarine-rescue and breathing equipment as a CCC subcontractor.", publishedAt: "2016-03-31T00:00:00.000Z", effectiveFrom: "2015-01-01T00:00:00.000Z", sourceId: sources.cccReport.id, url: urls.cccReport, sourceChannel: "government_procurement", sourceFamily: "ccc-annual-report-oceanworks-case-study", independenceKey: "ccc:oceanworks:us-navy:2015", candidateTargets: [claimTarget("operations.add-oceanworks-ccc-us-navy-relationship.value", "add-oceanworks-ccc-us-navy-relationship")], analystNote: "The official report does not publish a contract identifier or value, so neither is inferred." }),
  claim({ claimId: "claim-oceanworks-smt-study-contract", subjectType: "relationship", predicate: "received a subsea chemical-injection engineering-study contract", value: "OceanWorks reports that Safe Marine Transfer awarded it an engineering study for a subsea chemical injection unit covering storage, pumps, controls, sensors, electrical systems, and batteries.", publishedAt: "2015-08-10T00:00:00.000Z", effectiveFrom: "2015-08-10T00:00:00.000Z", sourceId: sources.smtContract.id, url: urls.smtContract, sourceChannel: "official_company", sourceFamily: "oceanworks-safe-marine-transfer-release", independenceKey: "oceanworks:smt:study-contract:2015-08-10", candidateTargets: [claimTarget("operations.add-oceanworks-smt-relationship.value", "add-oceanworks-smt-relationship")], analystNote: "The official release describes the award and technical scope but provides no contract value or completion evidence." }),
  claim({ claimId: "claim-oceanworks-phoenix-acquisition-2018", predicate: "was acquired by Phoenix International Holdings", value: "Investment Canada's index records Phoenix International Holdings' March 2018 acquisition of OceanWorks Holding Co. Ltd. and OceanWorks International Corporation's submarine-rescue business in Burnaby.", publishedAt: "2018-03-01T00:00:00.000Z", effectiveFrom: "2018-03-01T00:00:00.000Z", sourceId: sources.isedAcquisition.id, url: urls.isedAcquisition, sourceChannel: "other_discovery", sourceFamily: "ised-investment-canada-oceanworks-acquisition", independenceKey: "ised:phoenix:oceanworks:2018-03", candidateTargets: [claimTarget("operations.set-oceanworks-profile-data.after", "set-oceanworks-profile-data")], analystNote: "This is an ownership-history fact; it does not establish the current parent after later corporate changes." }),
  claim({ claimId: "claim-oceanworks-bc-amalgamation-2023", predicate: "amalgamated under the legal name OceanWorks Holding Co Ltd", value: "The BC registry records OceanWorks Holding Co. Ltd. and OceanWorks International Corporation as amalgamating into company 1394079 under the name OceanWorks Holding Co. Ltd.", publishedAt: "2023-01-12T00:00:00.000Z", effectiveFrom: "2023-01-01T00:01:00.000Z", sourceId: sources.bcRegistry.id, url: urls.bcRegistry, sourceChannel: "other_discovery", sourceFamily: "bc-registry-oceanworks-amalgamation", independenceKey: "bc-registry:1394079:oceanworks-holding", supersedesClaimIds: ["claim-oceanworks-published-legal-name"], candidateTargets: [claimTarget("operations.set-oceanworks-legal-name.after", "set-oceanworks-legal-name"), claimTarget("operations.set-oceanworks-profile-data.after", "set-oceanworks-profile-data")], analystNote: "The registry supports the legal successor; the official site still uses OceanWorks International as the public operating brand, so the change remains amber for review." }),
  claim({ claimId: "claim-oceanworks-military-project-portfolio", predicate: "documents submarine-rescue and intervention work for named military customers", value: "OceanWorks' official military project page describes submarine-rescue, intervention, diving, launch-and-recovery, control, installation, and acceptance-testing work for U.S. and Turkish naval programs.", material: false, sourceId: sources.militaryProjects.id, url: urls.militaryProjects, sourceChannel: "official_company", sourceFamily: "oceanworks-military-project-samples", independenceKey: "oceanworks:military-projects:current", disposition: "deferred_backlog", analystNote: "These portfolio claims are consistent with the published capability; no duplicate capability operation is proposed." }),
  claim({ claimId: "claim-oceanworks-newer-public-award-search", subjectType: "signal", predicate: "has no newer recovered official public award after the 2015 records in this dossier", value: "CanadaBuys supplier history, the federal contract-history dataset, official company releases, customer and CCC sources, bilingual search, and industry search did not yield a later OceanWorks-specific public award in this run.", material: true, sourceId: sources.openCanada.id, url: urls.openCanadaContracts, sourceChannel: "other_discovery", sourceFamily: "open-canada-contract-history-search", independenceKey: "search:oceanworks:contracts:2026-08-04", status: "unresolved", disposition: "review_warning", candidateTargets: [claimTarget("reviewWarnings")], analystNote: "This is a bounded search result, not proof that no later private, foreign, unindexed, or differently named contract exists." })
];

const coverage = [
  ["identity_ownership", "partial", ["claim-oceanworks-live-operating-brand", "claim-oceanworks-phoenix-acquisition-2018", "claim-oceanworks-bc-amalgamation-2023", "claim-oceanworks-published-legal-name"], ["Compared the live row, official site, Investment Canada entry, and BC corporate-registry notice."], "The operating brand is current, while the legal-name field appears superseded by the 2023 amalgamation and requires reviewer confirmation."],
  ["canadian_presence", "covered", ["claim-oceanworks-live-operating-brand", "claim-oceanworks-phoenix-acquisition-2018"], ["Checked the official contact surface and the federal acquisition entry's Burnaby location."], "Burnaby, British Columbia remains the supported Canadian operating location."],
  ["offering_mandate", "covered", ["claim-oceanworks-military-project-portfolio", "claim-oceanworks-dnd-elss-scope"], ["Reviewed official military project material and the DND ELSS statement of work."], "Submarine rescue, intervention, life-support stores, and subsea engineering remain supported offerings."],
  ["technical_specifications", "covered", ["claim-oceanworks-dnd-elss-scope", "claim-oceanworks-smt-study-contract"], ["Reviewed the DND ELSS specifications and the OceanWorks subsea injection study scope."], "The dossier adds bounded contract-specific technical scope without rewriting the existing capability."],
  ["maturity_deployment", "partial", ["claim-oceanworks-us-navy-contract-completed", "claim-oceanworks-dnd-elss-contract", "claim-oceanworks-military-project-portfolio"], ["Separated award, amendment, completion, project, and ongoing-support language across official sources."], "The U.S. Navy contract is explicitly completed, while the DND record is an award/amendment and the broader project page does not date every delivery."],
  ["customers_contracts_programs", "covered", ["claim-oceanworks-user-contract-baseline", "claim-oceanworks-dnd-elss-contract", "claim-oceanworks-us-navy-contract-completed", "claim-oceanworks-smt-study-contract"], ["Enumerated CanadaBuys, DND, CCC, and official company contract sources after the user's 2011 baseline."], "Three later official contract records are captured with identifiers, lifecycle boundaries, values only where published, and customer context."],
  ["procurement_demand", "partial", ["claim-oceanworks-dnd-elss-contract", "claim-oceanworks-dnd-elss-scope", "claim-oceanworks-newer-public-award-search"], ["Searched CanadaBuys supplier history, the open contract-history dataset, DND documents, and bilingual procurement terms."], "The 2013-14 DND record is official procurement history; the search did not recover a later public award and does not imply future demand or eligibility."],
  ["partnerships_financing", "covered", ["claim-oceanworks-phoenix-acquisition-2018", "claim-oceanworks-smt-study-contract"], ["Checked Investment Canada, the BC registry, and official company contract releases."], "Phoenix acquisition history and the Safe Marine Transfer customer relationship are supported; no financing amount is inferred."],
  ["public_contacts", "covered", ["claim-oceanworks-live-operating-brand"], ["Rechecked the user-supplied contact page and current official-site navigation."], "The live public contact path remains available under the OceanWorks International brand."],
  ["current_activity", "partial", ["claim-oceanworks-live-operating-brand", "claim-oceanworks-bc-amalgamation-2023", "claim-oceanworks-newer-public-award-search"], ["Checked the live site, current contract datasets, company archive, registries, customer sources, and 2018-2026 industry results."], "The site and 2023 registry event support continuity, but no official contract event later than the 2015 records was recovered."],
  ["source_diversity", "covered", ["claim-oceanworks-dnd-elss-contract", "claim-oceanworks-us-navy-contract-completed", "claim-oceanworks-smt-study-contract", "claim-oceanworks-phoenix-acquisition-2018", "claim-oceanworks-bc-amalgamation-2023"], ["Used official company, CanadaBuys, DND, CCC, ISED, BC registry, Open Canada, technical-document, customer, bilingual, and industry lanes."], "Material claims span company, federal procurement, federal commercial contracting, federal investment review, and provincial registry families."],
  ["contradictions", "partial", ["claim-oceanworks-published-legal-name", "claim-oceanworks-bc-amalgamation-2023", "claim-oceanworks-live-operating-brand", "claim-oceanworks-newer-public-award-search"], ["Compared the live legal name with the registry successor and separated operating brand, legal entity, contract event date, and search-limit wording."], "The legal-name baseline is superseded by registry evidence while the operating brand remains active; no later-award absence is asserted beyond the searched public surfaces."]
].map(([dimension, status, claimIds, attempts, note]) => ({ dimension, status, claimIds, attempts, note }));

const ledger = {
  schemaVersion: "research_claim_ledger_v1",
  ledgerId: `${runId}-claim-ledger`,
  runId,
  createdAt,
  completedAt: createdAt,
  status: "complete",
  claims,
  subjects: [{
    subjectId: "oceanworks-international",
    subjectType: "organization",
    name: "OceanWorks International",
    candidateIds: [candidateId],
    coverage,
    saturation: {
      additionalSearchYield: "zero",
      newClaimsFromLastTwoLanes: 0,
      stopReason: "After eight complementary lanes, the final proactive-disclosure and 2018-2026 industry-publication searches produced no additional material OceanWorks contract claims; all recovered contract, ownership, and identity conflicts were dispositioned."
    }
  }],
  warnings: [
    "The absence of a later recovered official public award is a bounded search result, not proof that no private, foreign, unindexed, or differently named contract exists.",
    "The official site continues to use OceanWorks International while the BC registry names OceanWorks Holding Co. Ltd. as the 2023 amalgamated legal entity; reviewer confirmation is required before applying the legal-name change.",
    "Contract values are included only when stated by CanadaBuys; the 2015 U.S. Navy completion and Safe Marine Transfer study have no public values in the reviewed sources."
  ]
};

const fingerprint = (value) => createHash("sha256").update(value).digest("hex");
const signal = ({ signalId, channel, family, url, organization = "OceanWorks International", technology = null, program = null, issuer = null, eventDate, amount = null, details, actors, procurement, signalType, warning, disposition = "qualified" }) => ({
  signalId,
  fingerprint: fingerprint(`${signalId}|${eventDate}|${url}`),
  sourceChannel: channel,
  sourceFamily: family,
  discoveryOrigin: { url, gmailMessageId: null, gmailThreadId: null, linkedinUrl: null },
  extracted: { organization, technology, program, issuer, eventDate, amount, details, observedAt: createdAt, effectiveDate: eventDate, actors, ...(procurement ? { procurement } : {}), changeSummary: details },
  redirectUrls: [],
  canonicalUrls: [url],
  signalType,
  sourceClusterId: signalId,
  supersedesSignalIds: [],
  canonicalEvidenceStatus: "resolved",
  liveEntityMatches: [targetMatch],
  intendedOutcomes: [disposition === "already_current" ? "deferred" : "organization_refresh"],
  recoveryAttempts: [{ channel, url, outcome: `Resolved the OceanWorks signal to durable canonical evidence at ${url}.` }],
  warnings: [warning],
  disposition,
  deferralRationale: null
});

const signals = {
  schemaVersion: "research_signal_batch_v1",
  signalBatchId: runId,
  runId,
  createdAt,
  watermarkStart: "2010-08-09T00:00:00.000Z",
  watermarkEnd: createdAt,
  sourceFamilyCounters: { official_company: 3, government_procurement: 4, source_book: 2, ecosystem_program: 0, industry_publication: 1, gmail_newsletter: 0, linkedin_chrome: 0, other_discovery: 3 },
  warnings: ledger.warnings,
  signals: [
    signal({ signalId: "oceanworks-user-contract-baseline-2011", channel: "source_book", family: "CanadaBuys user baseline", url: urls.userContract, issuer: "Canadian Commercial Corporation", eventDate: "2011-01-14", amount: "CAD 128,018 total", details: "CanadaBuys records the user-supplied contract as a 2010 award amended in January 2011 to a total value of CAD 128,018.", actors: [{ name: "Canadian Commercial Corporation", role: "buyer" }, { name: "OceanWorks International Corporation", role: "supplier" }], procurement: { noticeId: null, contractId: "5FB0A-11J265/001/PR", stage: "amended", amendmentNumber: "003", buyer: "Canadian Commercial Corporation", supplier: "OceanWorks International Corporation", value: "128018", currency: "CAD", closingAt: null }, signalType: "contract_or_award", warning: "This is the comparison baseline supplied by the user and is already historical context, not a new candidate relationship.", disposition: "already_current" }),
    signal({ signalId: "oceanworks-dnd-elss-contract-2014", channel: "government_procurement", family: "CanadaBuys OceanWorks contract history", url: urls.canadaBuys, issuer: "Department of National Defence", eventDate: "2014-06-10", amount: "CAD 526,391", details: "CanadaBuys records DND contract W8483-137107/001/ML, awarded in July 2013 and amended in June 2014, for Emergency Life Support Stores pod assemblies.", actors: [{ name: "Department of National Defence", role: "buyer" }, { name: "OceanWorks International Corporation", role: "supplier" }], procurement: { noticeId: "W8483-137107", contractId: "W8483-137107/001/ML", stage: "amended", amendmentNumber: null, buyer: "Department of National Defence", supplier: "OceanWorks International Corporation", value: "526391", currency: "CAD", closingAt: null }, signalType: "contract_or_award", warning: "The public result reports the contract value and amendment date; the DND SOW supplies scope but not final delivery performance." }),
    signal({ signalId: "oceanworks-us-navy-contract-completed-2015", channel: "government_procurement", family: "CCC annual report case study", url: urls.cccReport, issuer: "Canadian Commercial Corporation", eventDate: "2015-12-31", details: "CCC reports that during 2015 OceanWorks successfully completed a U.S. Navy contract for specialized submarine-rescue and breathing equipment.", actors: [{ name: "Canadian Commercial Corporation", role: "buyer" }, { name: "OceanWorks International Corporation", role: "supplier" }, { name: "U.S. Navy", role: "other" }], procurement: { noticeId: null, contractId: null, stage: "closed", amendmentNumber: null, buyer: "Canadian Commercial Corporation", supplier: "OceanWorks International Corporation", value: null, currency: null, closingAt: null }, signalType: "contract_or_award", warning: "The official report does not publish a contract identifier, award date, or value." }),
    signal({ signalId: "oceanworks-smt-study-contract-2015", channel: "official_company", family: "OceanWorks official contract release", url: urls.smtContract, issuer: "Safe Marine Transfer LLC", technology: "Subsea chemical injection unit", eventDate: "2015-08-10", details: "OceanWorks reports an engineering-study contract from Safe Marine Transfer for a subsea chemical injection unit involving storage, pumps, controls, sensors, electrical systems, and batteries.", actors: [{ name: "Safe Marine Transfer LLC", role: "buyer" }, { name: "OceanWorks International", role: "supplier" }], procurement: { noticeId: null, contractId: null, stage: "awarded", amendmentNumber: null, buyer: "Safe Marine Transfer LLC", supplier: "OceanWorks International", value: null, currency: null, closingAt: null }, signalType: "contract_or_award", warning: "The company release does not publish a contract value or completion milestone." }),
    signal({ signalId: "oceanworks-phoenix-acquisition-2018", channel: "other_discovery", family: "Investment Canada acquisition index", url: urls.isedAcquisition, issuer: "Phoenix International Holdings, Inc.", eventDate: "2018-03-01", details: "Investment Canada records Phoenix International Holdings' acquisition of OceanWorks Holding Co. Ltd. and OceanWorks International Corporation's submarine-rescue business in Burnaby.", actors: [{ name: "Phoenix International Holdings, Inc.", role: "buyer" }, { name: "OceanWorks Holding Co. Ltd.", role: "other" }, { name: "OceanWorks International Corporation", role: "other" }], signalType: "financing_or_ownership_event", warning: "The 2018 acquisition is ownership history and does not alone establish the present legal entity after the 2023 amalgamation." }),
    signal({ signalId: "oceanworks-bc-amalgamation-2023", channel: "other_discovery", family: "BC Corporate Registry notice", url: urls.bcRegistry, issuer: "British Columbia Corporate Registry", eventDate: "2023-01-01", details: "The BC registry records OceanWorks Holding Co. Ltd. and OceanWorks International Corporation as amalgamating under the name OceanWorks Holding Co. Ltd., company 1394079.", actors: [{ name: "OceanWorks Holding Co. Ltd.", role: "other" }, { name: "OceanWorks International Corporation", role: "other" }], signalType: "financing_or_ownership_event", warning: "The official operating site continues to use OceanWorks International, so legal entity and operating brand must remain distinct." })
  ]
};

const recoveryAttempts = [
  ["company_newsroom", urls.smtContract, "Recovered the official 2015 Safe Marine Transfer engineering-study contract and its bounded technical scope."],
  ["technical_documentation", urls.dndSow, "Recovered the official DND ELSS pod-assembly statement of work for contract W8483-137107."],
  ["corporate_registry", urls.bcRegistry, "Recovered the official 2023 amalgamation and legal-successor entry."],
  ["procurement", urls.canadaBuys, "Recovered the newer 2013 award and 2014 amendment for DND contract W8483-137107/001/ML."],
  ["proactive_disclosure", urls.openCanadaContracts, "Checked the federal contract-history dataset and did not recover an OceanWorks-specific award later than the 2015 official records."],
  ["customer_partner", urls.cccReport, "Recovered CCC's official record that OceanWorks completed a U.S. Navy submarine-rescue equipment contract during 2015."],
  ["broad_web", urls.militaryProjects, "Checked official military project material and 2018-2026 industry results; no additional later contract award was resolved to durable evidence."],
  ["bilingual_web", urls.isedAcquisition, "French-language Investment Canada search recovered the 2018 Phoenix acquisition and helped resolve ownership history." ]
].map(([lane, url, outcome]) => ({ lane, url, outcome }));

const lead = {
  leadType: "record_refresh_lead",
  id: leadId,
  source: sources.canadaBuys,
  discoveryPath: [urls.contact, urls.userContract, urls.canadaBuys, urls.dndSow, urls.cccReport, urls.smtContract, urls.isedAcquisition, urls.bcRegistry, urls.openCanadaContracts, urls.militaryProjects],
  possibleMissionAreaSlugs: ["underwater-isr", "autonomous-patrol-and-monitoring"],
  possibleTechnicalDomainSlugs: ["sensing-and-isr", "autonomous-systems", "advanced-manufacturing-and-integration", "test-training-and-sustainment"],
  sourceConfidence: "high",
  alignmentConfidence: "high",
  evidenceLocator: "CanadaBuys W8483-137107 record, DND ELSS SOW, CCC 2015 completion case study, OceanWorks 2015 contract release, Investment Canada acquisition entry, and BC amalgamation notice",
  duplicateFingerprint: { canonicalUrl: urls.official, websiteDomain: "oceanworks.com", stableSlug: "oceanworks-international", legalName: "OceanWorks Holding Co. Ltd.", aliases: ["OceanWorks International", "OceanWorks International Corporation", "OceanWorks International Corp.", "OceanWorks Holding Co. Ltd."] },
  followUpQuestions: [
    "Confirm the 2023 amalgamated legal name before applying it while retaining OceanWorks International as the operating brand.",
    "Confirm whether the three contract records should all publish as relationships or whether older history should remain only in reviewer context.",
    "Recheck future CanadaBuys and foreign procurement searches using both the operating brand and legal-successor name."
  ],
  discoveryLane: "procurement",
  inclusionScore: 98,
  completenessScore: 94,
  reviewWarnings: ledger.warnings,
  recoveryAttempts,
  disposition: "qualified",
  doNotIngestReason: null,
  targetMatch,
  signalIds: signals.signals.map((item) => item.signalId),
  refreshSummary: "Update the published OceanWorks record with its 2023 legal successor and 2018 ownership history, then add three official post-2011 contract relationships: a 2013-14 DND ELSS award, a 2015 U.S. Navy contract completion through CCC, and a 2015 Safe Marine Transfer engineering study.",
  intendedChanges: [
    "Set the legal name to OceanWorks Holding Co. Ltd. subject to reviewer confirmation of the operating-brand boundary.",
    "Preserve the current profile and add bounded ownership and legal-identity history.",
    "Add the DND ELSS contract relationship with identifier, award/amendment dates, published value, and technical scope.",
    "Add the completed U.S. Navy submarine-rescue equipment relationship through CCC without inventing an identifier or value.",
    "Add the Safe Marine Transfer subsea engineering-study relationship without inventing a value or completion status."
  ]
};

const leadBatch = {
  schemaVersion: "source_lead_batch_v2",
  leadBatchId: `source-leads-${runId}`,
  runId,
  createdAt,
  scope: { description: "Named-organization deep dossier on the published OceanWorks International record, prioritizing post-2011 contract history, current legal and ownership identity, and bounded current-operation evidence.", targetMissionAreaSlugs: ["underwater-isr", "autonomous-patrol-and-monitoring"], targetTechnicalDomainSlugs: ["sensing-and-isr", "autonomous-systems", "advanced-manufacturing-and-integration", "test-training-and-sustainment"], targetOrganizationKinds: ["company"], targetDemandIssuerTypes: [] },
  leads: [lead]
};

const beforeOrganization = {
  id: organizationId,
  slug: "oceanworks-international",
  name: "OceanWorks International",
  legal_name: "OceanWorks International Corporation",
  description: "OceanWorks International is a British Columbia subsea-engineering company that designs and manufactures manned and unmanned underwater work systems, submarine rescue equipment, launch-and-recovery systems and seafloor network infrastructure.",
  website_url: urls.official,
  entity_kind: "company",
  organization_categories: ["commercial_company", "defence_supplier", "dual_use", "ocean_technology"],
  profile_data: {
    reviewed_by: "b443c433-2a78-4ca7-8a19-a8f40b140049",
    publicContact: "OceanWorks publishes its Burnaby, British Columbia operating identity and a public sales contact across its official company and product material.",
    portfolioScope: "Engineer, manufacture, test and support modular subsea systems, transportable launch-and-recovery equipment, control systems and underwater intervention technology for military, scientific and commercial missions.",
    currentActivity: "OceanWorks documents modular, air-transportable and container-compatible launch-and-recovery configurations alongside military submarine-rescue and subsea intervention systems.",
    evidenceBoundary: "Organization identity, capability, location, contact and activity are source-backed. Containerized ASW and mission alignment are derived assessments and do not imply procurement eligibility, endorsement, customer interest or classified demand.",
    reviewed_candidate_id: "0ce2b4a1-f7f6-4903-9c75-88a913396d1a",
    research_schema_version: "organization_bundle_v2"
  },
  publication_status: "published",
  updated_at: baselineUpdatedAt
};

const afterProfileData = {
  ...beforeOrganization.profile_data,
  ownershipAndLegalIdentity: "Investment Canada records Phoenix International Holdings' March 2018 acquisition of OceanWorks Holding Co. Ltd. and OceanWorks International Corporation's submarine-rescue business. The BC registry later records OceanWorks Holding Co. Ltd. and OceanWorks International Corporation as amalgamating into company 1394079 under the legal name OceanWorks Holding Co. Ltd.; OceanWorks International remains the public operating brand on the current official site."
};

const fieldEvidence = [
  { id: "evidence-oceanworks-legal-name", sourceId: sources.bcRegistry.id, fieldPath: "operations.set-oceanworks-legal-name.after", claimClass: "source_backed", excerpt: "The BC registry records OceanWorks Holding Co. Ltd. and OceanWorks International Corporation as amalgamating into company 1394079 under the name OceanWorks Holding Co. Ltd.", confidence: "high" },
  { id: "evidence-oceanworks-profile-acquisition", sourceId: sources.isedAcquisition.id, fieldPath: "operations.set-oceanworks-profile-data.after", claimClass: "source_backed", excerpt: "Investment Canada's index records Phoenix International Holdings' March 2018 acquisition of OceanWorks Holding Co. Ltd. and the OceanWorks International Corporation submarine-rescue business in Burnaby.", confidence: "high" },
  { id: "evidence-oceanworks-profile-amalgamation", sourceId: sources.bcRegistry.id, fieldPath: "operations.set-oceanworks-profile-data.after", claimClass: "source_backed", excerpt: "The provincial registry establishes the 2023 amalgamated entity and legal name while the current official site establishes the continuing OceanWorks International operating brand.", confidence: "high" },
  { id: "evidence-oceanworks-dnd-contract", sourceId: sources.canadaBuys.id, fieldPath: "operations.add-oceanworks-dnd-elss-relationship.value", claimClass: "source_backed", excerpt: "CanadaBuys records DND contract W8483-137107/001/ML, awarded in July 2013 and amended in June 2014, at a reported value of CAD 526,391.", confidence: "high" },
  { id: "evidence-oceanworks-dnd-scope", sourceId: sources.dndSow.id, fieldPath: "operations.add-oceanworks-dnd-elss-relationship.value", claimClass: "source_backed", excerpt: "DND's statement of work identifies Emergency Life Support Stores pod assemblies for Victoria-class submarine escape towers and torpedo tubes and compatibility with the Royal Canadian Navy ELSS Pod Carousel.", confidence: "high" },
  { id: "evidence-oceanworks-ccc-contract", sourceId: sources.cccReport.id, fieldPath: "operations.add-oceanworks-ccc-us-navy-relationship.value", claimClass: "source_backed", excerpt: "CCC reports that during 2015 OceanWorks successfully completed a U.S. Navy contract for specialized submarine-rescue and breathing equipment as a CCC subcontractor.", confidence: "high" },
  { id: "evidence-oceanworks-smt-contract", sourceId: sources.smtContract.id, fieldPath: "operations.add-oceanworks-smt-relationship.value", claimClass: "source_backed", excerpt: "OceanWorks reports that Safe Marine Transfer awarded it an engineering study for a subsea chemical injection unit involving storage, pumps, controls, sensors, electrical systems, and batteries.", confidence: "high" },
  { id: "evidence-oceanworks-award-search-boundary", sourceId: sources.openCanada.id, fieldPath: "reviewWarnings", claimClass: "source_backed", excerpt: "The current federal contract-history dataset was searched alongside CanadaBuys, company, CCC, customer, bilingual, and industry sources without recovering a later official public OceanWorks-specific award.", confidence: "moderate" }
];

const operations = [
  { operationId: "set-oceanworks-legal-name", operation: "set_field", entityType: "organization", targetId: organizationId, field: "legal_name", before: beforeOrganization.legal_name, after: "OceanWorks Holding Co. Ltd.", evidenceIds: ["evidence-oceanworks-legal-name"], reviewerExplanation: "Update the legal-name field to the official 2023 amalgamated successor while retaining OceanWorks International as the public operating name." },
  { operationId: "set-oceanworks-profile-data", operation: "set_field", entityType: "organization", targetId: organizationId, field: "profile_data", before: beforeOrganization.profile_data, after: afterProfileData, evidenceIds: ["evidence-oceanworks-profile-acquisition", "evidence-oceanworks-profile-amalgamation"], reviewerExplanation: "Preserve every published profile key and add bounded ownership and legal-identity history from official federal and provincial sources." },
  { operationId: "add-oceanworks-dnd-elss-relationship", operation: "add_child", entityType: "relationship", parentId: organizationId, value: { relatedOrganizationName: "Department of National Defence", relationshipType: "Emergency Life Support Stores contract supplier", publicSummary: "CanadaBuys records OceanWorks International Corporation as supplier on DND contract W8483-137107/001/ML, initially awarded on July 12, 2013 and amended on June 10, 2014, with a reported value of CAD 526,391. DND's statement of work covers Emergency Life Support Stores pod assemblies for Victoria-class submarine escape towers and torpedo tubes." }, evidenceIds: ["evidence-oceanworks-dnd-contract", "evidence-oceanworks-dnd-scope"], reviewerExplanation: "Add the newer CanadaBuys contract with exact identifier, dates, published value, and DND technical scope without inferring delivery performance." },
  { operationId: "add-oceanworks-ccc-us-navy-relationship", operation: "add_child", entityType: "relationship", parentId: organizationId, value: { relatedOrganizationName: "Canadian Commercial Corporation and U.S. Navy", relationshipType: "completed submarine-rescue equipment contract", publicSummary: "The Canadian Commercial Corporation reports that during 2015 OceanWorks successfully completed a U.S. Navy contract for specialized submarine-rescue and breathing equipment as a CCC subcontractor. The reviewed official report does not publish a contract identifier or value." }, evidenceIds: ["evidence-oceanworks-ccc-contract"], reviewerExplanation: "Add the official completed-contract relationship while preserving the absence of a public identifier, award date, and value." },
  { operationId: "add-oceanworks-smt-relationship", operation: "add_child", entityType: "relationship", parentId: organizationId, value: { relatedOrganizationName: "Safe Marine Transfer LLC", relationshipType: "subsea engineering-study contractor", publicSummary: "OceanWorks announced on August 10, 2015 that Safe Marine Transfer awarded it an engineering study for a subsea chemical injection unit involving subsea storage, pumps, controls, sensors, electrical systems, and batteries. The release does not publish a contract value or completion milestone." }, evidenceIds: ["evidence-oceanworks-smt-contract"], reviewerExplanation: "Add the official commercial study award with its technical scope while leaving value and completion status explicitly unknown." }
];

const reviewerRationale = "OceanWorks International is already published, so this dossier proposes one evidence-backed refresh rather than a duplicate organization. It captures contract history later than the user's January 2011 baseline: CanadaBuys records DND contract W8483-137107/001/ML, awarded in July 2013 and amended in June 2014 at CAD 526,391; DND's SOW ties it to ELSS pod assemblies for Victoria-class submarines. CCC separately reports successful completion during 2015 of a U.S. Navy submarine-rescue and breathing-equipment contract, and OceanWorks announced an August 2015 Safe Marine Transfer subsea engineering-study award. The refresh also records Phoenix International Holdings' 2018 acquisition and the 2023 BC amalgamation under OceanWorks Holding Co. Ltd. It is amber because the current site still uses OceanWorks International, the 2015 contracts disclose no public values or identifiers beyond what is stated, and a search across CanadaBuys, federal contract data, company, customer, bilingual, and industry lanes recovered no later official public award. That search result is not proof that no private, foreign, unindexed, or differently named contract exists.";

const candidate = {
  schemaVersion: "organization_refresh_bundle_v1",
  candidateKind: "organization_refresh_bundle",
  candidateId,
  sourceLeadIds: [leadId],
  confidence: "moderate",
  reviewStatus: "candidate_pending",
  reviewerRationale,
  reviewTier: "amber",
  inclusionScore: 98,
  completenessScore: 94,
  reviewWarnings: [
    "This is a refresh of published organization 02d7d445-5130-4c32-afbb-dae53d0019a6, not a new organization candidate.",
    ...ledger.warnings
  ],
  duplicateCheck: { status: "clear", checkedAt: createdAt, methods: ["canonical_url", "website_domain", "slug", "legal_name", "alias", "fuzzy_name"], matches: [{ id: organizationId, name: "OceanWorks International", matchedBy: "intentional published refresh target via exact UUID, slug, website domain, operating name, and legal-name history" }], note: "The only exact identity match is the intentional published OceanWorks target; this run creates no second organization." },
  sources: Object.values(sources),
  fieldEvidence,
  targetMatch,
  beforeRecord: { organization: beforeOrganization, relationships: [] },
  operations,
  sourceChannels: ["official_company", "government_procurement", "source_book", "other_discovery"],
  signalIds: signals.signals.map((item) => item.signalId),
  corroboration: [
    { claim: "DND contract W8483-137107/001/ML post-dates the user's 2011 baseline and covers ELSS pod assemblies for Victoria-class submarines.", sourceIds: [sources.canadaBuys.id, sources.dndSow.id] },
    { claim: "CCC records OceanWorks' successful completion during 2015 of specialized U.S. Navy submarine-rescue and breathing-equipment work.", sourceIds: [sources.cccReport.id] },
    { claim: "OceanWorks announced a 2015 subsea chemical-injection engineering-study contract from Safe Marine Transfer.", sourceIds: [sources.smtContract.id] },
    { claim: "Official federal and provincial records support the 2018 acquisition history and 2023 legal successor while the operating brand remains OceanWorks International.", sourceIds: [sources.isedAcquisition.id, sources.bcRegistry.id, sources.contact.id] }
  ]
};

const candidateBatch = {
  schemaVersion: "research_candidate_batch_v2",
  batchId: `candidate-batch-${runId}`,
  runId,
  title: "OceanWorks International contract and legal-identity refresh",
  status: "candidate",
  createdAt,
  selectedGap: { coverageView: "supply", dimension: "published-record-refresh:oceanworks-international", reason: "The published OceanWorks record omits later official contract history and its documented ownership and legal-successor changes.", score: 1000 },
  sourceLeadBatchPath: paths.leads,
  guardrailNotes: [
    "Private Admin Review material only; this run does not approve, publish, migrate, or write canonical organization, capability, relationship, source, or evidence tables.",
    "Contract dates, lifecycle states, identifiers, and values remain bounded to the wording in official CanadaBuys, DND, CCC, and OceanWorks sources.",
    "The failure to recover a later public award is retained as a review warning, not represented as proof that no later contract exists."
  ],
  candidates: [candidate],
  deferred: []
};

const reviewPacket = `# OceanWorks International refresh candidate\n\n- Run: \`${runId}\`\n- Candidate: \`${candidateId}\`\n- Review tier: amber\n- Target: published OceanWorks International organization \`${organizationId}\`\n- Baseline updated_at: \`${baselineUpdatedAt}\`\n\n## Reviewer rationale\n\n${reviewerRationale}\n\n## Proposed operations\n\n1. Set the legal name to **OceanWorks Holding Co. Ltd.** while retaining OceanWorks International as the operating brand.\n2. Preserve all current profile data and add the 2018 Phoenix acquisition and 2023 amalgamation history.\n3. Add DND contract W8483-137107/001/ML: 2013 award, 2014 amendment, CAD 526,391, ELSS pod assemblies for Victoria-class submarines.\n4. Add the official 2015 CCC/U.S. Navy completed submarine-rescue equipment relationship without inventing an identifier or value.\n5. Add the official August 2015 Safe Marine Transfer engineering-study award without inventing a value or completion status.\n\n## Contract recency finding\n\nThe run recovered official contract history more recent than the user-supplied January 2011 amendment. The latest indexed CanadaBuys event recovered is the June 2014 amendment to W8483-137107/001/ML. Two additional official sources document contract activity in 2015. No later official public OceanWorks-specific award was recovered across the searched CanadaBuys, proactive-disclosure, company, customer, bilingual, and industry lanes; this is a bounded search result, not a claim that no later contract exists.\n\n## Guardrails\n\nStop at pending Admin Review. Do not accept, reject, publish, apply migrations, or write canonical ecosystem tables.\n`;

const run = JSON.parse(await readFile(paths.run, "utf8"));
run.status = "completed";
run.completedAt = createdAt;
run.counters = {
  ...run.counters,
  sourcesChecked: 18,
  leadsQualified: 1,
  leadsDeferred: 0,
  candidatesCreated: 1,
  duplicatesBlocked: 0,
  prospectsDiscovered: 1,
  uniqueProspects: 1,
  prospectsQueued: 0,
  recoveryAttempts: recoveryAttempts.length,
  sourceLanesSearched: 8,
  candidatesGreen: 0,
  candidatesAmber: 1,
  signalsExtracted: signals.signals.length,
  signalsDispositioned: signals.signals.length,
  sourceFamiliesSearched: 4,
  claimsCollected: claims.length,
  claimsConflicted: 1,
  coverageSubjects: 1
};
run.underTargetReason = null;
run.exhaustionEvidence = null;
run.validation = { passed: false, errors: [], warnings: ["Node.js 25.8.0 is outside the repository's pinned Node 24.x runtime; validation still runs under the active workspace runtime."] };
run.errors = [];
run.stopReason = "Completed one named-organization deep dossier and prepared one amber OceanWorks refresh candidate for private Admin Review.";
run.outputs = { ...run.outputs, signalBatch: paths.signals, sourceLeadBatch: paths.leads, candidateBatch: paths.candidates, reviewPacket: paths.review, stagingExport: paths.staging };

await Promise.all([
  writeFile(paths.claims, `${JSON.stringify(ledger, null, 2)}\n`),
  writeFile(paths.signals, `${JSON.stringify(signals, null, 2)}\n`),
  writeFile(paths.leads, `${JSON.stringify(leadBatch, null, 2)}\n`),
  writeFile(paths.candidates, `${JSON.stringify(candidateBatch, null, 2)}\n`),
  writeFile(paths.review, reviewPacket),
  writeFile(paths.run, `${JSON.stringify(run, null, 2)}\n`)
]);

console.log(JSON.stringify({ runId, candidateId, createdAt, counts: { claims: claims.length, signals: signals.signals.length, leads: 1, candidates: 1, operations: operations.length }, paths }, null, 2));
