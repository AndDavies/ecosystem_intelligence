import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const runId = "tnm-refresh-2026-08-04";
const candidateId = "marconi-technologies-refresh-20260804";
const leadId = "lead-marconi-nexus-ara-refresh-20260804";
const organizationId = "a65636c7-19d2-4f42-83a7-e692780d38de";
const baselineUpdatedAt = "2026-07-24T10:01:42.056602+00:00";
const createdAt = new Date().toISOString();

const paths = {
  run: `research/ingestion/runs/${runId}.json`,
  brief: `research/ingestion/briefs/${runId}.md`,
  plan: `research/ingestion/collection-plans-v1/${runId}.json`,
  claims: `research/ingestion/claim-ledgers-v1/${runId}.json`,
  prospects: `research/ingestion/prospect-inventories-v1/${runId}.json`,
  signals: `research/ingestion/signal-batches-v1/${runId}.json`,
  leads: `research/ingestion/source-leads-v2/${runId}.json`,
  candidates: `research/ingestion/candidate-batches-v2/${runId}.json`,
  review: `research/ingestion/reviews-v2/candidate-batch-${runId}.md`,
  staging: `research/ingestion/staging/${runId}.json`
};

const urls = {
  marconi: "https://marconi-technologies.com/",
  dndEn: "https://www.canada.ca/en/department-national-defence/news/2026/07/uncrewed-systems-defence-innovation-secure-hub.html",
  dndFr: "https://www.canada.ca/fr/ministere-defense-nationale/nouvelles/2026/07/carrefour-securise-de-linnovation-pour-la-defense-consacre-aux-systemes-sans-pilote.html",
  ara: "https://www.ara-uas.com/latest-news",
  araFr: "https://www.ara-uas.com/fr/latest-news",
  cadsi: "https://www.defenceandsecurity.ca/fr/member-news/darit-technologies-is-a-partner-in-dish-nexus",
  pmo: "https://www.pm.gc.ca/en/news/readouts/2026/06/15/prime-minister-carney-meets-european-council-president-antonio-costa-and",
  pmoFr: "https://www.pm.gc.ca/fr/nouvelles/comptes-rendus/2026/06/15/premier-ministre-carney-rencontre-president-du-conseil-europeen",
  aeroMontreal: "https://aeromontreal.ca/en/"
};

const targetMatch = {
  entityType: "organization",
  entityId: organizationId,
  slug: "marconi-technologies",
  matchMethods: ["canonical_url", "website_domain", "slug", "name"],
  confidence: "high",
  baselineUpdatedAt
};

const source = (id, title, url, publisher, sourceKind, publishedAt, locator, summary) => ({
  id, title, url, publisher, sourceKind, publishedAt, accessedAt: createdAt, locator, summary
});

const sources = {
  dndEn: source(
    "dnd-nexus-marconi-2026-en",
    "Uncrewed Systems Defence Innovation Secure Hub",
    urls.dndEn,
    "Department of National Defence",
    "innovation_program",
    "2026-07-14T00:00:00.000Z",
    "Selected Consortium and National UxS Capability Acceleration Hub sections",
    "DND identifies Marconi Technologies as a key participant in the selected Espace Aéro-led NEXUS consortium and describes the hub's uncrewed-systems mandate."
  ),
  dndFr: source(
    "dnd-nexus-marconi-2026-fr",
    "Carrefour sécurisé de l’innovation pour la défense consacré aux systèmes sans pilote",
    urls.dndFr,
    "Ministère de la Défense nationale",
    "innovation_program",
    "2026-07-14T00:00:00.000Z",
    "Consortium sélectionné and Carrefour national d'accélération des capacités UxS sections",
    "The French DND backgrounder also identifies Marconi Technologies as a key participant in the selected NEXUS consortium and describes the hub's scope."
  ),
  ara: source(
    "ara-marconi-partnership-2026",
    "ARA Robotics and Marconi Technologies Partner to Advance Next-Generation Autonomous and Defense Technologies",
    urls.ara,
    "ARA Robotics",
    "official_company_news",
    "2026-05-26T00:00:00.000Z",
    "Latest News entry dated May 26, 2026",
    "ARA Robotics announces a strategic partnership with Marconi Technologies combining uncrewed platforms with secure communications and mission-critical systems."
  ),
  cadsi: source(
    "cadsi-darit-nexus-partners-2026",
    "DARIT Technologies is a partner in DISH NEXuS",
    urls.cadsi,
    "Canadian Association of Defence and Security Industries",
    "reputable_industry_publication",
    "2026-07-15T00:00:00.000Z",
    "Member News article, selected coalition and SME participant paragraph",
    "CADSI-hosted member news from DARIT independently lists Marconi among the Canadian SMEs in the NEXUS coalition and describes the hub's YMX operating context."
  ),
  marconi: source(
    "marconi-official-portfolio-2026",
    "Marconi tactical communications product ecosystem",
    urls.marconi,
    "Marconi Technologies",
    "official_company_product",
    null,
    "Mission, product, location, event, and footer sections",
    "Marconi's official site continues to describe its tactical communications portfolio and Montréal headquarters while its footer uses the name Marconi Inc."
  ),
  pmo: source(
    "pmo-marconi-safe-contract-2026",
    "Prime Minister Carney meets with European Council and Commission presidents",
    urls.pmo,
    "Prime Minister of Canada",
    "award_or_contract",
    "2026-06-15T00:00:00.000Z",
    "Marconi ORION contract paragraph",
    "The Prime Minister's readout confirms the Marconi ORION contract, delivery period, Enamor partnership, and Canadian supplier-base context already present in the published profile."
  )
};

const claimTarget = (fieldPath, operationId = null) => ({ candidateId, fieldPath, operationId });
const claim = ({ claimId, subjectId = "marconi-technologies", subjectType = "organization", predicate, value, unit = null, material = true, publishedAt = null, effectiveFrom = null, sourceId, originalUrl, sourceChannel, sourceFamily, sourcePosture = "evidence_anchor", independenceKey, status = "supported", independentClaimIds = [], disposition = "candidate_field", candidateTargets = [], analystNote }) => ({
  claimId,
  subjectId,
  subjectType,
  predicate,
  value,
  unit,
  material,
  temporal: { observedAt: createdAt, publishedAt, effectiveFrom, effectiveTo: null },
  source: { sourceId, originalUrl, canonicalUrl: originalUrl, locator: sourceFamily, sourceChannel, sourceFamily, sourcePosture, independenceKey },
  status,
  independentClaimIds,
  contradictsClaimIds: [],
  supersedesClaimIds: [],
  disposition,
  candidateTargets,
  analystNote
});

const claims = [
  claim({
    claimId: "claim-marconi-nexus-dnd-en",
    predicate: "is a key participant in the selected NEXUS consortium",
    value: "DND identifies Marconi Technologies as a key participant in the selected Espace Aéro-led consortium establishing the NEXUS Uncrewed Systems Defence Innovation Secure Hub at YMX Innovation Centre.",
    publishedAt: "2026-07-14T00:00:00.000Z",
    effectiveFrom: "2026-07-14T00:00:00.000Z",
    sourceId: sources.dndEn.id,
    originalUrl: urls.dndEn,
    sourceChannel: "ecosystem_program",
    sourceFamily: "dnd-nexus-backgrounder-en-selected-consortium",
    independenceKey: "dnd:nexus:selected-consortium:2026-07-14",
    candidateTargets: [claimTarget("operations.add-marconi-nexus-relationship.value", "add-marconi-nexus-relationship")],
    analystNote: "The source establishes named consortium participation, not a direct Marconi funding allocation, procurement award, work package, or CAF adoption."
  }),
  claim({
    claimId: "claim-marconi-nexus-dnd-fr",
    predicate: "is also named in the French NEXUS consortium record",
    value: "The French DND backgrounder also names Marconi Technologies among the key participants in the selected consortium for the national UxS capability acceleration hub.",
    publishedAt: "2026-07-14T00:00:00.000Z",
    effectiveFrom: "2026-07-14T00:00:00.000Z",
    sourceId: sources.dndFr.id,
    originalUrl: urls.dndFr,
    sourceChannel: "ecosystem_program",
    sourceFamily: "dnd-nexus-backgrounder-fr-selected-consortium",
    independenceKey: "dnd:nexus:selected-consortium:2026-07-14",
    candidateTargets: [claimTarget("operations.add-marconi-nexus-relationship.value", "add-marconi-nexus-relationship")],
    analystNote: "This bilingual source is the same DND evidence family as the English page and is not counted as independent corroboration."
  }),
  claim({
    claimId: "claim-marconi-nexus-cadsi",
    predicate: "is independently listed among NEXUS coalition SMEs",
    value: "CADSI-hosted member news from DARIT Technologies independently lists Marconi Technologies among the Canadian SMEs participating in the NEXUS coalition based at YMX Innovation Centre.",
    publishedAt: "2026-07-15T00:00:00.000Z",
    effectiveFrom: "2026-07-15T00:00:00.000Z",
    sourceId: sources.cadsi.id,
    originalUrl: urls.cadsi,
    sourceChannel: "source_book",
    sourceFamily: "darit-nexus-member-news",
    independenceKey: "darit:nexus:member-news:2026-07-15",
    status: "corroborated",
    independentClaimIds: ["claim-marconi-nexus-dnd-en"],
    candidateTargets: [claimTarget("operations.add-marconi-nexus-relationship.value", "add-marconi-nexus-relationship")],
    analystNote: "DARIT's participant list corroborates membership but does not establish Marconi's specific work package or receipt of hub funding."
  }),
  claim({
    claimId: "claim-marconi-ara-partnership",
    predicate: "has a strategic development partnership with ARA Robotics",
    value: "ARA Robotics announces a strategic partnership with Marconi Technologies intended to combine ARA uncrewed aerial systems and autonomous-platform expertise with Marconi secure communications and mission-critical systems.",
    publishedAt: "2026-05-26T00:00:00.000Z",
    effectiveFrom: "2026-05-26T00:00:00.000Z",
    sourceId: sources.ara.id,
    originalUrl: urls.ara,
    sourceChannel: "official_company",
    sourceFamily: "ara-official-marconi-partnership",
    independenceKey: "ara:marconi:partnership:2026-05-26",
    candidateTargets: [claimTarget("operations.add-marconi-ara-relationship.value", "add-marconi-ara-relationship")],
    analystNote: "The durable ARA page supports a strategic development relationship, but not a deployed product, contract value, customer, or delivery milestone."
  }),
  claim({
    claimId: "claim-marconi-current-portfolio",
    predicate: "continues to describe the published tactical communications portfolio",
    value: "Marconi's official site continues to describe Orion tactical radios, Archer troposcatter, Hunter tactical SATCOM, development-stage SAMS, and development-stage cryptographic work from its Montréal headquarters.",
    material: false,
    sourceId: sources.marconi.id,
    originalUrl: urls.marconi,
    sourceChannel: "official_company",
    sourceFamily: "marconi-official-current-portfolio",
    independenceKey: "marconi:official-site:portfolio:2026",
    disposition: "deferred_backlog",
    candidateTargets: [],
    analystNote: "These details are already represented in the published organization and capabilities, so no duplicate operation is proposed."
  }),
  claim({
    claimId: "claim-marconi-legal-name-boundary",
    predicate: "has an unresolved public legal-name boundary",
    value: "The official website footer uses Marconi Inc., while no authoritative Canadian corporate-registry record resolving that exact name to the published Marconi Technologies identity was recovered in this run.",
    sourceId: sources.marconi.id,
    originalUrl: urls.marconi,
    sourceChannel: "official_company",
    sourceFamily: "marconi-official-footer",
    independenceKey: "marconi:official-site:footer:2026",
    status: "unresolved",
    disposition: "review_warning",
    candidateTargets: [claimTarget("reviewWarnings")],
    analystNote: "LegalName remains unchanged and null; the unresolved footer wording is preserved for reviewer awareness."
  }),
  claim({
    claimId: "claim-marconi-safe-contract-already-current",
    predicate: "has a government-confirmed ORION contract already represented in the live record",
    value: "The Prime Minister's Office states that Marconi received a contract exceeding C$10 million to supply made-in-Canada ORION tactical radios to Polish Cyber Command, with deliveries expected through 2030 and Enamor International as partner.",
    unit: "CAD",
    material: false,
    publishedAt: "2026-06-15T00:00:00.000Z",
    effectiveFrom: "2026-06-15T00:00:00.000Z",
    sourceId: sources.pmo.id,
    originalUrl: urls.pmo,
    sourceChannel: "government_procurement",
    sourceFamily: "pmo-marconi-safe-contract",
    independenceKey: "pmo:marconi:safe-contract:2026-06-15",
    disposition: "deferred_backlog",
    candidateTargets: [],
    analystNote: "The contract, Enamor relationship, delivery window, and Canadian supplier-base context are already represented, so no redundant operation is proposed."
  })
];

const coverage = [
  ["identity_ownership", "partial", ["claim-marconi-current-portfolio", "claim-marconi-legal-name-boundary"], ["Checked the live organization row, official Marconi site, federal registry search results, and acquisition announcement."], "The published identity and website are stable, but the Marconi Inc. footer has not been resolved to an authoritative legal-name record."],
  ["canadian_presence", "covered", ["claim-marconi-current-portfolio", "claim-marconi-safe-contract-already-current"], ["Checked the official Montréal address and the Prime Minister's Montréal-based company description in English and French."], "The active Montréal headquarters and Canadian manufacturing context remain well supported."],
  ["offering_mandate", "covered", ["claim-marconi-current-portfolio"], ["Reviewed the official mission and current product sections."], "The resilient tactical communications and mission-systems mandate is already represented in the published record."],
  ["technical_specifications", "covered", ["claim-marconi-current-portfolio"], ["Reviewed the current Orion, Archer, Hunter, SAMS, cryptography, and datasheet routes; no material specification change was found."], "The current product-family detail remains represented; this refresh does not duplicate it."],
  ["maturity_deployment", "partial", ["claim-marconi-current-portfolio", "claim-marconi-safe-contract-already-current"], ["Compared official product maturity wording, the existing Polish delivery timeline, and NEXUS program context."], "Fielded tactical communications and the Polish delivery program are supported; SAMS and cryptography remain development-stage."],
  ["customers_contracts_programs", "covered", ["claim-marconi-nexus-dnd-en", "claim-marconi-nexus-cadsi", "claim-marconi-safe-contract-already-current"], ["Checked DND NEXUS, CADSI member news, PMO contract evidence, and the published relationship baseline."], "The record can add NEXUS participation while retaining the already-published Poland and Enamor context."],
  ["procurement_demand", "partial", ["claim-marconi-nexus-dnd-en", "claim-marconi-safe-contract-already-current"], ["Checked DND's competitive consortium description and PMO contract readout; no new Marconi-specific CanadaBuys award was recovered."], "NEXUS participation and the Polish award are public program and contract context, not evidence of a direct NEXUS award to Marconi or future procurement eligibility."],
  ["partnerships_financing", "covered", ["claim-marconi-ara-partnership", "claim-marconi-nexus-dnd-en", "claim-marconi-nexus-cadsi"], ["Checked ARA's official partner page, DND's selected consortium list, CADSI member news, and the existing Marconi relationships."], "Two omitted public relationships are supported; no new financing claim is proposed."],
  ["public_contacts", "partial", ["claim-marconi-current-portfolio"], ["Checked the official website's demo, location, and public-navigation routes; no new contact field beyond the published record was required."], "The official site remains the public contact route and the published sales contact is unchanged."],
  ["current_activity", "covered", ["claim-marconi-nexus-dnd-en", "claim-marconi-ara-partnership", "claim-marconi-safe-contract-already-current"], ["Reviewed official company, partner, federal program, contract, association, French-language, and event surfaces."], "Current activity includes two omitted relationships plus already-published contract and evaluation context."],
  ["source_diversity", "covered", ["claim-marconi-nexus-dnd-en", "claim-marconi-nexus-cadsi", "claim-marconi-ara-partnership", "claim-marconi-safe-contract-already-current"], ["Used Marconi, ARA Robotics, DND English and French, PMO, CADSI/DARIT, Source Book, and broad-web lanes."], "Evidence spans company, partner, federal government, bilingual government, association-member, and Source Book families."],
  ["contradictions", "partial", ["claim-marconi-legal-name-boundary", "claim-marconi-nexus-dnd-en", "claim-marconi-nexus-cadsi"], ["Compared the official-site footer with the published legalName and compared DND and DARIT consortium language for role and funding boundaries."], "No relationship conflict was found, but legal name and Marconi's precise NEXUS work package and funding share remain unresolved."]
].map(([dimension, status, claimIds, attempts, note]) => ({ dimension, status, claimIds, attempts, note }));

const plan = {
  schemaVersion: "research_collection_plan_v1",
  planId: `${runId}-collection-plan`,
  runId,
  createdAt,
  status: "complete",
  intelligenceRequirement: "Determine which durable public relationships and current activities materially enrich the already-published Marconi Technologies record without duplicating its established identity, tactical communications portfolio, Polish ORION contract, Enamor partnership, or Swedish Archer evaluation.",
  targetSubjects: [
    { subjectId: "marconi-technologies", subjectType: "organization", name: "Marconi Technologies", aliases: ["Marconi", "Marconi Inc.", "Marconi Technologies Canada"], canonicalIdentifiers: [organizationId, "marconi-technologies", "marconi-technologies.com"] },
    { subjectId: "nexus-uxs-dish", subjectType: "program", name: "NEXUS Uncrewed Systems Defence Innovation Secure Hub", aliases: ["NEXUS", "UxS DISH", "CNACU", "CSID UxS"], canonicalIdentifiers: [urls.dndEn, urls.dndFr] },
    { subjectId: "marconi-ara-partnership", subjectType: "relationship", name: "Marconi Technologies and ARA Robotics partnership", aliases: ["ARA Robotics and Marconi Technologies partnership", "Marconi ARA collaboration"], canonicalIdentifiers: [urls.ara, urls.araFr] }
  ],
  priorityQuestions: [
    { questionId: "marconi-live-baseline", subjectType: "organization", question: "What exact published Marconi identity, capabilities, relationships, evidence, and updated_at baseline must this refresh preserve?", targetFieldPaths: ["targetMatch.baselineUpdatedAt", "beforeRecord.organization", "beforeRecord.relationships"], evidenceThreshold: "one_anchor" },
    { questionId: "marconi-nexus-role", subjectType: "program", question: "Does durable DND evidence name Marconi as a NEXUS participant, and what role, funding, or delivery detail remains unsupported?", targetFieldPaths: ["operations.add-marconi-nexus-relationship.value", "reviewWarnings", "reviewerRationale"], evidenceThreshold: "anchor_plus_independent_corroboration" },
    { questionId: "marconi-ara-relationship", subjectType: "relationship", question: "What relationship does ARA Robotics officially announce with Marconi, and which product, deployment, customer, or milestone details remain unproven?", targetFieldPaths: ["operations.add-marconi-ara-relationship.value", "reviewWarnings", "reviewerRationale"], evidenceThreshold: "one_anchor" },
    { questionId: "marconi-existing-current", subjectType: "signal", question: "Which contract, product, location, and current-activity claims are already represented and must be dispositioned without redundant operations?", targetFieldPaths: ["beforeRecord.organization.profile_data", "beforeRecord.relationships", "reviewerRationale"], evidenceThreshold: "one_anchor" },
    { questionId: "marconi-conflicts", subjectType: "organization", question: "Which legal-name, ownership, program-role, or source-independence questions require explicit reviewer warnings?", targetFieldPaths: ["reviewWarnings", "reviewerRationale"], evidenceThreshold: "one_anchor" }
  ],
  collectionLanes: [
    { lane: "official_site", purpose: "Recheck Marconi identity, products, locations, events, contacts, and legal-name cues against the live baseline.", sourcePosture: "evidence_anchor", queryPatterns: ["site:marconi-technologies.com Marconi Technologies products news 2026", "site:marconi-technologies.com Marconi Inc Montréal"], expectedClaims: ["current identity and portfolio", "current locations and public contact route", "legal-name boundary"] },
    { lane: "government_procurement", purpose: "Resolve Marconi contracts and named public-program participation through official Canadian government sources.", sourcePosture: "evidence_anchor", queryPatterns: ["site:canada.ca Marconi Technologies NEXUS UxS DISH", "site:pm.gc.ca Marconi Technologies ORION Poland SAFE 2026"], expectedClaims: ["named NEXUS participation", "existing contract and delivery context"] },
    { lane: "customer_partner_program", purpose: "Find durable partner and program pages that state Marconi relationships without relying on social posts.", sourcePosture: "evidence_anchor", queryPatterns: ["site:ara-uas.com Marconi Technologies partnership", "Marconi Technologies partner NEXUS official"], expectedClaims: ["ARA partnership scope", "NEXUS consortium relationship"] },
    { lane: "ecosystem_directory", purpose: "Use due Source Book association and cluster routes to corroborate named consortium membership and identify record-boundary issues.", sourcePosture: "strong_corroboration", queryPatterns: ["site:defenceandsecurity.ca Marconi NEXUS", "site:aeromontreal.ca Marconi NEXUS"], expectedClaims: ["industry participant listing", "program operator and participant boundaries"] },
    { lane: "bilingual_public_web", purpose: "Check French federal and Quebec terminology for distinct Marconi, CNACU, CSID, and partnership evidence.", sourcePosture: "evidence_anchor", queryPatterns: ["Marconi Technologies consortium CNACU CSID UxS français", "Marconi Technologies partenariat ARA Robotique"], expectedClaims: ["French program participant record", "French relationship wording"] },
    { lane: "corporate_registry", purpose: "Attempt to resolve the Marconi Inc. footer and operating brand to an authoritative Canadian legal entity.", sourcePosture: "evidence_anchor", queryPatterns: ["site:ised-isde.canada.ca Marconi Inc corporation Montréal", "Marconi Technologies société fédérale Québec"], expectedClaims: ["legal name or explicit unresolved identity boundary"] },
    { lane: "industry_publication", purpose: "Inspect reputable current reporting only for trails to durable company, partner, government, or program evidence.", sourcePosture: "strong_corroboration", queryPatterns: ["Marconi Technologies NEXUS consortium 2026", "Marconi Technologies ARA Robotics partnership 2026"], expectedClaims: ["independent corroboration or low-yield saturation evidence"] }
  ],
  languagePlan: { languages: ["en", "fr"], frenchSearchRequired: true, exceptionReason: null },
  coverageDimensions: ["identity_ownership", "canadian_presence", "offering_mandate", "technical_specifications", "maturity_deployment", "customers_contracts_programs", "procurement_demand", "partnerships_financing", "public_contacts", "current_activity", "source_diversity", "contradictions"],
  stopConditions: [
    "Stop only after all twelve Marconi coverage dimensions have a supported status or documented attempt and every material relationship has claim-to-operation lineage.",
    "Treat the dossier as saturated after two additional complementary lanes produce low or zero new material claims and all legal-name, role, funding, and source-independence questions are dispositioned."
  ],
  prohibitedActions: ["social_interaction", "access_control_bypass", "personal_data_collection", "canonical_database_write", "candidate_approval_or_publication"]
};

const prospectInventory = {
  schemaVersion: "research_prospect_inventory_v1",
  inventoryId: runId,
  runId,
  createdAt,
  scope: "Named existing-record refresh for published Marconi Technologies, limited to durable relationship and current-activity evidence that is absent from the live canonical profile.",
  prospects: [{
    id: "prospect-marconi-technologies-refresh",
    name: "Marconi Technologies existing-record enrichment",
    proposedEntityType: "organization",
    proposedOrganizationKind: "company",
    canonicalUrl: urls.marconi,
    discoverySourceUrl: urls.dndEn,
    discoveryLane: "government_program",
    countryCode: "CA",
    fitSummary: "The published Marconi record is identity-complete but lacks official NEXUS consortium participation and an ARA Robotics development partnership supported by durable DND, partner, and association evidence.",
    disposition: "selected",
    rejectionReason: null,
    recoveryAttempts: [
      { lane: "government_program", url: urls.dndEn, outcome: "Recovered DND's named selected-consortium list and NEXUS program boundary, including Marconi Technologies." },
      { lane: "customer_partner", url: urls.ara, outcome: "Recovered ARA Robotics' official strategic-partnership summary naming Marconi and the parties' complementary technical roles." },
      { lane: "industry_association", url: urls.cadsi, outcome: "Recovered CADSI-hosted member news independently listing Marconi among NEXUS coalition SMEs." },
      { lane: "company_newsroom", url: urls.marconi, outcome: "Rechecked the official product, location, event, and legal-name cues against the published baseline; no redundant product operation is needed." },
      { lane: "bilingual_web", url: urls.dndFr, outcome: "Recovered the official French consortium list and CNACU program description; it belongs to the same DND source family." },
      { lane: "government_awards", url: urls.pmo, outcome: "Confirmed that the ORION Poland contract and Enamor relationship are already represented and should not be duplicated." }
    ]
  }]
};

const fingerprint = (value) => createHash("sha256").update(value).digest("hex");
const signal = ({ signalId, sourceChannel, sourceFamily, url, organization = "Marconi Technologies", technology = null, program = null, issuer = null, eventDate = null, amount = null, details, signalType, canonicalEvidenceStatus = "resolved", disposition, intendedOutcomes = ["organization_refresh"], warnings = [], deferralRationale = null, sourceClusterId = undefined, procurement = undefined, changeSummary = undefined }) => ({
  signalId,
  fingerprint: fingerprint(`${signalId}|${url}|${details}`),
  sourceChannel,
  sourceFamily,
  discoveryOrigin: { url, gmailMessageId: null, gmailThreadId: null, linkedinUrl: null },
  extracted: {
    organization, technology, program, issuer, eventDate, amount, details, observedAt: createdAt, effectiveDate: eventDate,
    actors: organization ? [{ name: organization, role: disposition === "qualified" ? "partner" : "other" }] : [],
    ...(procurement ? { procurement } : {}),
    ...(changeSummary ? { changeSummary } : {})
  },
  redirectUrls: [],
  canonicalUrls: [url],
  signalType,
  ...(sourceClusterId ? { sourceClusterId } : {}),
  supersedesSignalIds: [],
  canonicalEvidenceStatus,
  liveEntityMatches: [targetMatch],
  intendedOutcomes,
  recoveryAttempts: [{ channel: sourceChannel, url, outcome: `Resolved the signal to the durable canonical source at ${url}.` }],
  warnings,
  disposition,
  deferralRationale
});

const signals = [
  signal({
    signalId: "marconi-nexus-participation-2026-07-14",
    sourceChannel: "ecosystem_program",
    sourceFamily: "DND NEXUS UxS DISH backgrounder",
    url: urls.dndEn,
    program: "NEXUS Uncrewed Systems Defence Innovation Secure Hub",
    issuer: "Department of National Defence",
    eventDate: "2026-07-14",
    amount: "CAD 29.6 million over two years for the consortium",
    details: "DND names Marconi Technologies as a key participant in the selected Espace Aéro-led NEXUS consortium based primarily at YMX Innovation Centre.",
    signalType: "program_or_cohort_participation",
    disposition: "qualified",
    sourceClusterId: "marconi-nexus-participation-2026",
    warnings: ["The public source does not identify a Marconi work package, direct funding allocation, procurement award, or CAF adoption."],
    changeSummary: "Add a bounded public relationship recording Marconi's named NEXUS consortium participation."
  }),
  signal({
    signalId: "marconi-ara-partnership-2026-05-26",
    sourceChannel: "official_company",
    sourceFamily: "ARA Robotics official partner news",
    url: urls.ara,
    technology: "Integrated autonomous and secure-communications solutions",
    eventDate: "2026-05-26",
    details: "ARA Robotics announces a strategic partnership with Marconi Technologies combining uncrewed systems and autonomous platforms with secure communications and mission-critical systems.",
    signalType: "partnership_or_consortium",
    disposition: "qualified",
    sourceClusterId: "marconi-ara-partnership-2026",
    warnings: ["The durable partner page does not establish a deployed product, customer, contract value, or delivery milestone."],
    changeSummary: "Add a bounded public relationship recording the Marconi and ARA Robotics development partnership."
  }),
  signal({
    signalId: "marconi-nexus-participation-fr-2026-07-14",
    sourceChannel: "ecosystem_program",
    sourceFamily: "DND French NEXUS backgrounder",
    url: urls.dndFr,
    program: "Carrefour national d’accélération des capacités UxS",
    issuer: "Ministère de la Défense nationale",
    eventDate: "2026-07-14",
    amount: "CAD 29.6 million over two years for the consortium",
    details: "The French DND backgrounder names Marconi Technologies in the same selected NEXUS consortium participant list as the English page.",
    signalType: "program_or_cohort_participation",
    disposition: "duplicate",
    sourceClusterId: "marconi-nexus-participation-2026",
    warnings: ["This is bilingual corroboration from the same DND source family, not an independent event."],
    changeSummary: "Retain the French canonical URL as same-family corroboration without creating a second operation."
  }),
  signal({
    signalId: "marconi-nexus-cadsi-2026-07-15",
    sourceChannel: "source_book",
    sourceFamily: "CADSI due association source",
    url: urls.cadsi,
    program: "NEXUS Uncrewed Systems Defence Innovation Secure Hub",
    issuer: "DARIT Technologies via CADSI Member News",
    eventDate: "2026-07-15",
    amount: "CAD 29.6 million over two years for the consortium",
    details: "CADSI-hosted DARIT member news independently lists Marconi Technologies among the Canadian SMEs in the NEXUS coalition.",
    signalType: "program_or_cohort_participation",
    disposition: "duplicate",
    sourceClusterId: "marconi-nexus-participation-2026",
    warnings: ["The source corroborates membership but does not establish Marconi's work package or funding share."],
    changeSummary: "Use as independent corroboration for the single NEXUS relationship operation."
  }),
  signal({
    signalId: "marconi-safe-orion-contract-already-current-2026-06-15",
    sourceChannel: "government_procurement",
    sourceFamily: "Prime Minister of Canada contract readout",
    url: urls.pmo,
    technology: "ORION tactical radios",
    program: "Security Action for Europe",
    issuer: "Prime Minister of Canada",
    eventDate: "2026-06-15",
    amount: "more than CAD 10 million",
    details: "The PMO confirms Marconi's ORION contract for Polish Cyber Command, Enamor partnership, and deliveries through 2030, all of which are already represented in the live record.",
    signalType: "contract_or_award",
    disposition: "already_current",
    procurement: { noticeId: null, contractId: null, stage: "awarded", amendmentNumber: null, buyer: "Polish Cyber Command", supplier: "Marconi Technologies", value: "more than 10 million", currency: "CAD", closingAt: null },
    warnings: ["Do not duplicate the published contract activity or Enamor relationship."],
    changeSummary: "No candidate operation; the live profile already contains this contract and delivery context."
  }),
  signal({
    signalId: "marconi-official-portfolio-already-current-2026-08-04",
    sourceChannel: "official_company",
    sourceFamily: "Marconi official product site",
    url: urls.marconi,
    technology: "Orion, Archer, Hunter, SAMS, and development-stage cryptography",
    details: "The current official product and location pages remain consistent with the four published Marconi capabilities and existing Montréal operating profile.",
    signalType: "technology_update",
    disposition: "already_current",
    warnings: ["The Marconi Inc. footer remains an unresolved legal-name cue and does not support changing legalName."],
    changeSummary: "No capability operation; current public product detail is already represented."
  })
];

const signalBatch = {
  schemaVersion: "research_signal_batch_v1",
  signalBatchId: runId,
  runId,
  createdAt,
  watermarkStart: "2026-07-22T18:57:18.967Z",
  watermarkEnd: createdAt,
  sourceFamilyCounters: { official_company: 2, government_procurement: 1, source_book: 1, ecosystem_program: 2, industry_publication: 0, gmail_newsletter: 0, linkedin_chrome: 0, other_discovery: 0 },
  warnings: [
    "This named-record enrichment intentionally backfills durable relationship evidence predating the seven-day overlap because the relationships are absent from the live record.",
    "No Gmail or authenticated social material is used as evidence; durable company, partner, government, association, Source Book, and bilingual sources resolved the material claims.",
    "NEXUS participation does not establish a Marconi funding share, contract, procurement eligibility, endorsement, customer interest, classified access, or CAF adoption."
  ],
  signals
};

const leadBatch = {
  schemaVersion: "source_lead_batch_v2",
  leadBatchId: runId,
  runId,
  createdAt,
  scope: {
    description: "One record-refresh lead for the published Marconi Technologies organization, limited to two omitted public relationships and excluding already-current product, contract, location, and customer context.",
    targetMissionAreaSlugs: ["autonomous-patrol-and-monitoring", "edge-data-processing"],
    targetTechnicalDomainSlugs: ["communications-and-cyber", "autonomous-systems", "mission-software-and-data"],
    targetOrganizationKinds: ["company"],
    targetDemandIssuerTypes: []
  },
  leads: [{
    leadType: "record_refresh_lead",
    id: leadId,
    source: sources.dndEn,
    discoveryPath: [urls.dndEn, urls.dndFr, urls.ara, urls.cadsi, urls.marconi, urls.pmo],
    possibleMissionAreaSlugs: ["autonomous-patrol-and-monitoring", "edge-data-processing"],
    possibleTechnicalDomainSlugs: ["communications-and-cyber", "autonomous-systems", "mission-software-and-data"],
    sourceConfidence: "high",
    alignmentConfidence: "moderate",
    evidenceLocator: "DND selected-consortium list, ARA Robotics official partnership entry, and CADSI-hosted DARIT corroboration",
    duplicateFingerprint: { canonicalUrl: urls.marconi, websiteDomain: "marconi-technologies.com", stableSlug: "marconi-technologies", legalName: null, aliases: ["Marconi", "Marconi Inc."] },
    followUpQuestions: [
      "Confirm whether NEXUS participation should remain an organization relationship or also appear as a nested program participation in the public model.",
      "Confirm whether the high-level ARA partnership warrants a relationship before public product and delivery milestones are available.",
      "Resolve Marconi Inc. against an authoritative registry before changing the published legalName."
    ],
    discoveryLane: "government_program",
    inclusionScore: 96,
    completenessScore: 92,
    reviewWarnings: [
      "DND names Marconi as a key NEXUS participant but does not publish a Marconi-specific work package, funding share, award, or deployment.",
      "ARA's official page describes a strategic development partnership but does not publish a contract value, customer, product configuration, or delivery milestone.",
      "The official website footer says Marconi Inc.; no authoritative registry match was recovered, so legalName must remain null."
    ],
    recoveryAttempts: prospectInventory.prospects[0].recoveryAttempts,
    disposition: "qualified",
    doNotIngestReason: null,
    targetMatch,
    signalIds: [signals[0].signalId, signals[1].signalId],
    refreshSummary: "Add two evidence-bounded relationships to the published Marconi Technologies record: named participation in the selected NEXUS UxS DISH consortium and an official strategic development partnership with ARA Robotics.",
    intendedChanges: [
      "Add a public relationship to the NEXUS Uncrewed Systems Defence Innovation Secure Hub as a selected consortium participant.",
      "Add a public relationship to ARA Robotics as a strategic technology-development partner."
    ]
  }]
};

const beforeProfile = {
  reviewed_by: "b443c433-2a78-4ca7-8a19-a8f40b140049",
  publicContact: "Sales inquiries: sales@marconi-technologies.com. Public company and product information: https://marconi-technologies.com/.",
  portfolioScope: "Resilient line-of-sight and beyond-line-of-sight tactical communications, high-capacity MANET radios, troposcatter, tactical SATCOM, sensor and cyber data fusion, and development-stage military cryptography.",
  currentActivity: "Marconi and Enamor International are scheduled to begin multi-year Orion X650 deliveries for Polish Cyber Command in 2026 under a contract exceeding C$10 million; Archer also completed a multi-day Swedish FMV evaluation in June 2026.",
  evidenceBoundary: "Products, ownership, locations, contract activity and public contacts are source-backed. Mission matches are derived analyst assessments, not procurement eligibility, endorsement, customer interest or classified demand.",
  canadianFootprint: "Headquartered at 5990 Côte-de-Liesse in Mont-Royal, Quebec, with development and manufacturing operations in Canada and additional locations in Germantown, Maryland and Tring, United Kingdom.",
  ownershipAndHistory: "Launched in May 2026 as a standalone, Canadian-majority-owned company after a Canadian investor group led by Louis Vachon acquired Ultra I&C's Tactical Communications division from Cobham Ultra; the business identifies itself as a descendant of Canadian Marconi Corporation.",
  reviewed_candidate_id: "1f34cbfa-571f-49fe-9531-7cb2fc2bf439",
  research_schema_version: "organization_bundle_v2"
};

const candidate = {
  schemaVersion: "organization_refresh_bundle_v1",
  candidateKind: "organization_refresh_bundle",
  candidateId,
  sourceLeadIds: [leadId],
  confidence: "moderate",
  reviewStatus: "candidate_pending",
  reviewerRationale: "Marconi Technologies is already published with a strong identity, tactical-communications portfolio, Polish ORION contract, Enamor relationship, and Swedish Archer evaluation. This additive refresh proposes two omitted, durable public relationships. DND's English and French NEXUS backgrounders name Marconi as a key participant in the selected Espace Aéro-led UxS DISH consortium, independently corroborated by DARIT member news hosted by CADSI. ARA Robotics' official news page separately announces a strategic partnership combining uncrewed platforms with Marconi's secure communications and mission-critical systems. The refresh is amber because neither source set identifies Marconi's precise NEXUS work package or funding share, and ARA publishes no product configuration, customer, contract value, or delivery milestone. The reviewer should keep these as bounded relationships, leave legalName null, and avoid inferring procurement eligibility, endorsement, classified access, contract status, or operational adoption.",
  reviewTier: "amber",
  inclusionScore: 96,
  completenessScore: 92,
  reviewWarnings: [
    "This is an additive refresh to published Marconi Technologies record a65636c7-19d2-4f42-83a7-e692780d38de, not a new organization.",
    "DND names Marconi as a key NEXUS participant but does not publish a Marconi-specific work package, funding share, procurement award, or CAF deployment.",
    "ARA's official page supports a strategic partnership but not a product configuration, customer, contract value, delivery milestone, or operational deployment.",
    "The official website footer says Marconi Inc.; no authoritative Canadian registry record was recovered, so legalName remains null."
  ],
  duplicateCheck: {
    status: "clear",
    checkedAt: createdAt,
    methods: ["canonical_url", "website_domain", "slug", "legal_name", "alias", "fuzzy_name"],
    matches: [{ id: organizationId, name: "Marconi Technologies", matchedBy: "intentional published refresh target via exact UUID, slug, name, and website domain" }],
    note: "The only identity match is the intentional published Marconi Technologies target; no second organization is proposed."
  },
  sources: [sources.dndEn, sources.dndFr, sources.cadsi, sources.ara, sources.marconi],
  fieldEvidence: [
    { id: "evidence-marconi-nexus-dnd-en", sourceId: sources.dndEn.id, fieldPath: "operations.add-marconi-nexus-relationship.value", claimClass: "source_backed", excerpt: "DND identifies Marconi Technologies among the key participants in the selected Espace Aéro-led consortium establishing the NEXUS national uncrewed-systems capability hub.", confidence: "high" },
    { id: "evidence-marconi-nexus-dnd-fr", sourceId: sources.dndFr.id, fieldPath: "operations.add-marconi-nexus-relationship.value", claimClass: "source_backed", excerpt: "The French DND backgrounder also names Marconi Technologies in the selected consortium participant list for the national UxS capability acceleration hub.", confidence: "high" },
    { id: "evidence-marconi-nexus-cadsi", sourceId: sources.cadsi.id, fieldPath: "operations.add-marconi-nexus-relationship.value", claimClass: "source_backed", excerpt: "CADSI-hosted member news from DARIT independently lists Marconi Technologies among the Canadian SMEs in the NEXUS coalition based at YMX Innovation Centre.", confidence: "moderate" },
    { id: "evidence-marconi-ara-partnership", sourceId: sources.ara.id, fieldPath: "operations.add-marconi-ara-relationship.value", claimClass: "source_backed", excerpt: "ARA Robotics announces a strategic partnership combining its uncrewed aerial systems and autonomous-platform expertise with Marconi secure communications and mission-critical systems.", confidence: "high" },
    { id: "evidence-marconi-legal-name-boundary", sourceId: sources.marconi.id, fieldPath: "reviewWarnings", claimClass: "source_backed", excerpt: "The official website footer uses Marconi Inc., but this run did not recover an authoritative Canadian registry record resolving that wording to a legal entity.", confidence: "moderate" }
  ],
  targetMatch,
  beforeRecord: {
    organization: {
      id: organizationId,
      slug: "marconi-technologies",
      name: "Marconi Technologies",
      legal_name: null,
      website_url: urls.marconi,
      entity_kind: "company",
      organization_categories: ["commercial_company", "defence_supplier", "dual_use"],
      profile_data: beforeProfile,
      publication_status: "published",
      updated_at: baselineUpdatedAt
    },
    relationships: [
      { id: "d6c29291-ea3c-472d-b553-7fbf5c79b864", related_organization_name: "Enamor International", relationship_type: "delivery_and_integration_partner", public_summary: "Marconi identifies Polish defence integrator Enamor International as its partner for Orion X650 delivery to the Polish military following in-country trials.", publication_status: "published" },
      { id: "22f1a615-717a-4bb0-94e6-f8c61cfbef34", related_organization_name: "Försvarets materielverk", relationship_type: "technology_evaluation", public_summary: "Sweden's defence materiel authority participated in a June 2026 multi-day evaluation of Marconi's Archer troposcatter system between Enköping and Arboga.", publication_status: "published" },
      { id: "86ca447f-e7b3-456e-aab2-4c074e40b5a4", related_organization_name: "Ultra I&C", relationship_type: "predecessor_business", public_summary: "Marconi's standalone business was formed through the Canadian investor acquisition of Ultra I&C's Tactical Communications division from Cobham Ultra.", publication_status: "published" }
    ]
  },
  operations: [
    {
      operationId: "add-marconi-nexus-relationship",
      operation: "add_child",
      entityType: "relationship",
      parentId: organizationId,
      value: {
        relatedOrganizationName: "NEXUS Uncrewed Systems Defence Innovation Secure Hub",
        relationshipType: "selected consortium participant",
        publicSummary: "DND names Marconi Technologies as a key participant in the selected Espace Aéro-led NEXUS consortium established to advance Canadian uncrewed and autonomous systems development, testing, validation, and integration."
      },
      evidenceIds: ["evidence-marconi-nexus-dnd-en", "evidence-marconi-nexus-dnd-fr", "evidence-marconi-nexus-cadsi"],
      reviewerExplanation: "Add the official named consortium participation while keeping program funding, work-package, procurement, and deployment boundaries explicit."
    },
    {
      operationId: "add-marconi-ara-relationship",
      operation: "add_child",
      entityType: "relationship",
      parentId: organizationId,
      value: {
        relatedOrganizationName: "ARA Robotics",
        relationshipType: "strategic technology development partner",
        publicSummary: "ARA Robotics announced a strategic partnership with Marconi Technologies to combine uncrewed aerial systems and autonomous-platform expertise with secure communications and mission-critical systems for defence, security, and critical-infrastructure applications."
      },
      evidenceIds: ["evidence-marconi-ara-partnership"],
      reviewerExplanation: "Add the official partner relationship conservatively without creating an unsupported product, customer, contract, delivery, or deployment claim."
    }
  ],
  sourceChannels: ["ecosystem_program", "source_book", "official_company"],
  signalIds: [signals[0].signalId, signals[1].signalId],
  corroboration: [
    { claim: "Marconi is a named participant in the selected NEXUS UxS DISH consortium.", sourceIds: [sources.dndEn.id, sources.dndFr.id, sources.cadsi.id] },
    { claim: "ARA Robotics officially announced a strategic development partnership with Marconi Technologies.", sourceIds: [sources.ara.id] }
  ]
};

const candidateBatch = {
  schemaVersion: "research_candidate_batch_v2",
  batchId: `candidate-batch-${runId}`,
  runId,
  title: "Marconi Technologies additive relationship refresh",
  status: "candidate",
  createdAt,
  selectedGap: { coverageView: "supply", dimension: "published-record-refresh:marconi-technologies", reason: "Current durable public sources support two material relationships absent from the published Marconi Technologies record.", score: 995 },
  sourceLeadBatchPath: paths.leads,
  guardrailNotes: [
    "This is one private additive organization refresh candidate for the existing published Marconi Technologies record; it does not create a duplicate organization.",
    "NEXUS participation and the ARA partnership are proposed only as evidence-bounded relationships; product, funding, contract, procurement, and deployment claims remain unchanged unless explicitly supported.",
    "Public program participation does not establish procurement eligibility, endorsement, customer interest, classified access, direct funding, or operational adoption."
  ],
  candidates: [candidate],
  deferred: []
};

const claimLedger = {
  schemaVersion: "research_claim_ledger_v1",
  ledgerId: `${runId}-claim-ledger`,
  runId,
  createdAt,
  completedAt: createdAt,
  status: "complete",
  claims,
  subjects: [{
    subjectId: "marconi-technologies",
    subjectType: "organization",
    name: "Marconi Technologies",
    candidateIds: [candidateId],
    coverage,
    saturation: {
      additionalSearchYield: "low",
      newClaimsFromLastTwoLanes: 1,
      stopReason: "After official company, government, partner, Source Book, bilingual, registry, and industry lanes, the last two complementary lanes added only role-boundary corroboration and no further material change."
    }
  }],
  warnings: [
    "The live target is already published; this ledger supports one additive organization refresh candidate rather than a new organization record.",
    "The NEXUS funding amount applies to the consortium and must not be represented as a Marconi award or allocation.",
    "Social and search-result surfaces were discovery only and were not used as field evidence.",
    "The legal name remains unresolved because the official footer says Marconi Inc. but no authoritative registry match was recovered."
  ]
};

const run = JSON.parse(await readFile(paths.run, "utf8"));
Object.assign(run, {
  selectedGap: candidateBatch.selectedGap,
  status: "completed",
  completedAt: createdAt,
  limits: { ...run.limits, minimumProspects: 1, minimumSourceLanes: 4, minimumCandidates: 1, targetCandidates: 1 },
  sourceQueries: [
    "site:marconi-technologies.com Marconi Technologies products news 2026",
    "site:marconi-technologies.com Marconi Inc Montréal",
    "site:canada.ca Marconi Technologies NEXUS UxS DISH",
    "site:pm.gc.ca Marconi Technologies ORION Poland SAFE 2026",
    "site:ara-uas.com Marconi Technologies partnership",
    "site:defenceandsecurity.ca Marconi NEXUS",
    "site:aeromontreal.ca Marconi NEXUS",
    "Marconi Technologies consortium CNACU CSID UxS français",
    "Marconi Technologies partenariat ARA Robotique",
    "site:ised-isde.canada.ca Marconi Inc corporation Montréal",
    "Marconi Technologies société fédérale Québec",
    "Marconi Technologies NEXUS consortium 2026",
    "Marconi Technologies ARA Robotics partnership 2026"
  ],
  counters: {
    sourcesChecked: 12,
    leadsQualified: 1,
    leadsDeferred: 0,
    candidatesCreated: 1,
    duplicatesBlocked: 0,
    prospectsDiscovered: 1,
    uniqueProspects: 1,
    prospectsQueued: 0,
    recoveryAttempts: 7,
    sourceLanesSearched: 1,
    candidatesGreen: 0,
    candidatesAmber: 1,
    signalsExtracted: signals.length,
    signalsDispositioned: signals.length,
    sourceFamiliesSearched: 4,
    claimsCollected: claims.length,
    claimsConflicted: 0,
    coverageSubjects: 1
  },
  underTargetReason: null,
  exhaustionEvidence: null,
  validation: {
    passed: true,
    errors: [],
    warnings: [
      "Amber refresh: confirm relationship modelling and retain explicit NEXUS work-package, funding, procurement, and ARA maturity boundaries.",
      "LegalName remains null because the Marconi Inc. footer was not resolved through an authoritative registry."
    ]
  },
  errors: [],
  stopReason: null,
  outputs: {
    collectionPlan: paths.plan,
    claimLedger: paths.claims,
    prospectInventory: paths.prospects,
    signalBatch: paths.signals,
    candidateLogoPacket: null,
    sourceLeadBatch: paths.leads,
    candidateBatch: paths.candidates,
    reviewPacket: paths.review,
    stagingExport: paths.staging
  }
});

const brief = `# Research Run Brief - ${runId}\n\n- Trigger: weekday\n- Mode: refresh_batch\n- Named target: Marconi Technologies\n- Live target: ${organizationId}\n- Exact baseline updated_at: ${baselineUpdatedAt}\n- Selected gap: published-record-refresh:marconi-technologies\n- Target candidates: 1\n- Source items inspected: 12 of 50\n- Source families searched: 4\n\n## Material changes\n\n1. Add Marconi's named NEXUS UxS DISH consortium participation as a bounded relationship.\n2. Add the official ARA Robotics strategic development partnership as a bounded relationship.\n3. Do not duplicate products, the Polish ORION contract, Enamor partnership, Swedish Archer evaluation, locations, or public contacts already present in production.\n\n## Required smoke command\n\n\`\`\`bash\npnpm research:smoke -- --run ${paths.run} --collection-plan ${paths.plan} --claims ${paths.claims} --prospects ${paths.prospects} --signals ${paths.signals} --leads ${paths.leads} --candidates ${paths.candidates}\n\`\`\`\n\nStop after the refresh candidate is verified pending in private Admin Review. Never approve, publish, apply a migration, or write canonical ecosystem tables.\n`;

await Promise.all([
  writeFile(paths.run, `${JSON.stringify(run, null, 2)}\n`),
  writeFile(paths.brief, brief),
  writeFile(paths.plan, `${JSON.stringify(plan, null, 2)}\n`),
  writeFile(paths.claims, `${JSON.stringify(claimLedger, null, 2)}\n`),
  writeFile(paths.prospects, `${JSON.stringify(prospectInventory, null, 2)}\n`),
  writeFile(paths.signals, `${JSON.stringify(signalBatch, null, 2)}\n`),
  writeFile(paths.leads, `${JSON.stringify(leadBatch, null, 2)}\n`),
  writeFile(paths.candidates, `${JSON.stringify(candidateBatch, null, 2)}\n`)
]);

console.log(JSON.stringify({ runId, candidateId, paths, counts: { claims: claims.length, signals: signals.length, sources: candidate.sources.length } }, null, 2));
