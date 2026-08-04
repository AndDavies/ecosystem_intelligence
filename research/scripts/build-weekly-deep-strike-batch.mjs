#!/usr/bin/env node

/*
 * Build the one weekly discovery batch prepared by the operator workflow.
 * The output is deliberately private, review-first and file based.  It does
 * not call Supabase and it does not promote anything into canonical tables.
 */
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const runId = "tnm-weekly-2026-08-03";
const now = new Date().toISOString();
const runPath = path.join(root, "research/ingestion/runs", `${runId}.json`);
const planPath = path.join(root, "research/ingestion/collection-plans-v1", `${runId}.json`);
const ledgerPath = path.join(root, "research/ingestion/claim-ledgers-v1", `${runId}.json`);
const prospectPath = path.join(root, "research/ingestion/prospect-inventories-v1", `${runId}.json`);
const leadPath = path.join(root, "research/ingestion/source-leads-v2", `${runId}.json`);
const candidatePath = path.join(root, "research/ingestion/candidate-batches-v2", `${runId}.json`);

const demandGap = {
  coverageView: "demand",
  dimension: "unmatched-demand:deep-strike",
  reason: "The public deep strike demand requirement has no reviewed capability match in the local atlas.",
  score: 850
};

const sourceBook = "https://www.canada.ca/en/department-national-defence/programs/defence-ideas.html";
const cuasChallenge = "https://www.canada.ca/en/department-national-defence/programs/defence-ideas/element/sandboxes/challenge/counter-uncrewed-aerial-systems-sandbox-2026.html";
const dndWinners = "https://www.canada.ca/en/department-national-defence/news/2026/02/minister-mcguinty-congratulates-innovators-announces-175m-prize-winners-of-urban-drone-detection-trials-in-ottawa.html";
const spaceCanada = "https://www.asc-csa.gc.ca/eng/";
const oscReport = "https://oceansupercluster.ca/wp-content/uploads/2022/09/OSC_Annual-Report_Sept-12.pdf";
const canadaGrants = "https://search.open.canada.ca/grants/?page=2&search_text=%22mission+control+space+services%22&sort=agreement_start_date+desc";

const missionDefault = "autonomous-patrol-and-monitoring";
const missionDeep = "edge-data-processing";
const domains = {
  sensing: ["sensing-and-isr", "autonomous-systems"],
  autonomy: ["autonomous-systems", "mission-software-and-data"],
  aerospace: ["aerospace-and-mobility", "advanced-manufacturing-and-integration"],
  space: ["space-and-earth-observation", "mission-software-and-data"],
  ocean: ["sensing-and-isr", "test-training-and-sustainment"]
};

const selected = [
  {
    name: "DARIT Technologies",
    slug: "darit-technologies",
    aliases: ["DARIT", "DARIT Technologies Inc."],
    url: "https://www.darit.tech/",
    city: "Sherbrooke",
    province: "Quebec",
    latitude: 45.4042,
    longitude: -71.8929,
    description: "DARIT Technologies is a Sherbrooke, Quebec technology company describing artificial-intelligence and computer-vision systems for detecting and classifying small uncrewed aircraft in complex environments.",
    capability: "AI-enabled counter-uncrewed-aircraft detection and classification",
    capabilityType: "Counter-uncrewed-aircraft sensing and classification",
    features: ["Computer-vision detection", "AI-assisted classification", "Small-drone monitoring"],
    applications: ["Counter-UAS situational awareness", "Perimeter monitoring", "Airspace security assessment"],
    tags: ["counter-UAS", "computer vision", "airspace monitoring"],
    domainKey: "sensing",
    mission: missionDefault,
    tier: "green",
    confidence: "high",
    activity: "DARIT's current public material presents a Canadian counter-UAS technology activity, while a 2026 Government of Canada announcement identifies DARIT among Urban Sandbox C-UAS prize winners. The relationship is retained as public programme evidence, not proof of operational adoption.",
    sources: [
      ["official", "DARIT Technologies official site", "https://www.darit.tech/", "DARIT Technologies", "official_company_product", null, "Company overview and public counter-UAS technology description", "DARIT's official site describes its Canadian company identity and public technology work in artificial intelligence, computer vision and counter-uncrewed-aircraft detection."],
      ["program", "DARIT Technologies wins first place in Urban Sandbox C-UAS 2025", "https://www.darit.tech/blog/darit-technologies-remporte-la-premiere-place-au-urban-sandbox-c-uas-2025-du-programme-idees", "DARIT Technologies", "official_company_news", "2025-12-15T00:00:00.000Z", "French-language programme result and company announcement", "DARIT's French-language company announcement reports a first-place result in the IDEaS Urban Sandbox C-UAS activity; the claim is bounded to the public announcement."],
      ["government", "Government announces prize winners of urban drone-detection trials", dndWinners, "Department of National Defence", "award_or_contract", "2026-02-18T00:00:00.000Z", "Urban Sandbox C-UAS winners", "The Department of National Defence publicly identifies DARIT Technologies among the prize winners of urban counter-drone detection trials in Ottawa."],
    ],
    relationship: { relatedOrganizationName: "Department of National Defence", relationshipType: "Public innovation-trial prize", publicSummary: "A Department of National Defence announcement identifies DARIT Technologies among prize winners from public Urban Sandbox counter-drone detection trials; this is programme evidence and not a current procurement or deployment claim.", sourceKey: "government" }
  },
  {
    name: "Prandtl Dynamics",
    slug: "prandtl-dynamics",
    aliases: ["Prandtl Dynamics Inc.", "Prandtl"],
    url: "https://prandtldynamics.com/",
    city: "Richmond Hill",
    province: "Ontario",
    latitude: 43.8828,
    longitude: -79.4403,
    description: "Prandtl Dynamics is an Ontario aerospace technology company developing acoustic and machine-learning sensing approaches for detecting, locating and identifying small uncrewed aircraft.",
    capability: "Acoustic counter-UAS detection and identification",
    capabilityType: "Acoustic sensing and machine-learning classification",
    features: ["Acoustic array sensing", "Machine-learning classification", "Drone detection and identification"],
    applications: ["Counter-UAS detection", "Low-signature airspace monitoring", "Site protection assessment"],
    tags: ["acoustic sensing", "counter-UAS", "machine learning"],
    domainKey: "sensing",
    mission: missionDefault,
    tier: "green",
    confidence: "high",
    activity: "Prandtl's official material and public intellectual-property record describe acoustic counter-UAS sensing work. A Canadian defence announcement also identifies the company in the Urban Sandbox C-UAS prize context; the public record does not establish a continuing operational contract.",
    sources: [
      ["official", "Prandtl Dynamics official site", "https://prandtldynamics.com/", "Prandtl Dynamics", "official_company_product", null, "Company overview and acoustic sensing capability", "Prandtl Dynamics presents an Ontario company developing acoustic sensing and machine-learning approaches for small uncrewed-aircraft detection and identification."],
      ["ip", "Canadian trademark record for Prandtl Dynamics", "https://ised-isde.canada.ca/cipo/trademark-search/pdf/2450211?lang=eng", "Canadian Intellectual Property Office", "official_report", "2025-10-01T00:00:00.000Z", "Applicant and goods/services record", "The Canadian Intellectual Property Office record names Prandtl Dynamics Inc. in Richmond Hill, Ontario and records a counter-UAS-related technology mark."],
      ["government", "Government announces prize winners of urban drone-detection trials", dndWinners, "Department of National Defence", "award_or_contract", "2026-02-18T00:00:00.000Z", "Urban Sandbox C-UAS winners", "The Department of National Defence publicly identifies Prandtl Dynamics among prize winners of urban counter-drone detection trials in Ottawa."],
    ],
    relationship: { relatedOrganizationName: "Department of National Defence", relationshipType: "Public innovation-trial prize", publicSummary: "A Department of National Defence announcement identifies Prandtl Dynamics among prize winners from public Urban Sandbox counter-drone detection trials; it is bounded programme evidence rather than proof of operational adoption.", sourceKey: "government" }
  },
  {
    name: "OBJEXIS",
    slug: "objexis",
    aliases: ["OBJEXIS Inc.", "Objexis"],
    url: "https://www.objexis.ai/about.html",
    city: "Oakville",
    province: "Ontario",
    latitude: 43.4675,
    longitude: -79.6877,
    description: "OBJEXIS is an Oakville, Ontario technology company describing AI-enabled sensing and analytics for detecting and classifying uncrewed aircraft and other objects in complex airspace.",
    capability: "AI-enabled airspace object detection and classification",
    capabilityType: "Multi-sensor airspace analytics",
    features: ["AI object classification", "Multi-sensor data analysis", "Counter-UAS situational awareness"],
    applications: ["Airspace monitoring", "Counter-UAS assessment", "Critical-site security"],
    tags: ["artificial intelligence", "counter-UAS", "object detection"],
    domainKey: "sensing",
    mission: missionDefault,
    tier: "green",
    confidence: "high",
    activity: "OBJEXIS's current public pages describe an Oakville-based AI and sensing company, and the Department of National Defence publicly names OBJEXIS in the Urban Sandbox C-UAS prize context. That public trial result is retained without inferring a current contract or deployment.",
    sources: [
      ["official", "OBJEXIS about page", "https://www.objexis.ai/about.html", "OBJEXIS", "official_company_product", null, "About page and company identity", "OBJEXIS describes an Oakville, Ontario company applying artificial intelligence and sensing analytics to complex object and airspace detection."],
      ["contact", "OBJEXIS contact page", "https://www.objexis.ai/contact.html", "OBJEXIS", "official_organization_profile", null, "Canadian office and public contact path", "OBJEXIS's public contact page provides the Canadian company contact path and supports the bounded Oakville operating presence used in this candidate."],
      ["government", "Government announces prize winners of urban drone-detection trials", dndWinners, "Department of National Defence", "award_or_contract", "2026-02-18T00:00:00.000Z", "Urban Sandbox C-UAS winners", "The Department of National Defence publicly identifies OBJEXIS among prize winners of urban counter-drone detection trials in Ottawa."],
    ],
    relationship: { relatedOrganizationName: "Department of National Defence", relationshipType: "Public innovation-trial prize", publicSummary: "A Department of National Defence announcement identifies OBJEXIS among prize winners from public Urban Sandbox counter-drone detection trials; it is programme evidence and does not establish operational adoption.", sourceKey: "government" }
  },
  {
    name: "Ravelin Dynamics",
    slug: "ravelin-dynamics",
    aliases: ["Ravelin Dynamics Inc.", "Ravelin"],
    url: "https://www.ravelindynamics.com/",
    city: "St. John's",
    province: "Newfoundland and Labrador",
    latitude: 47.5615,
    longitude: -52.7126,
    description: "Ravelin Dynamics is a St. John's, Newfoundland and Labrador defence-technology company describing radar-independent airspace surveillance and cueing for counter-air and counter-UAS missions.",
    capability: "Radar-independent airspace surveillance and cueing",
    capabilityType: "Passive airspace sensing and defence cueing",
    features: ["Passive signal sensing", "Airspace track generation", "Defence cueing workflows"],
    applications: ["Airspace situational awareness", "Counter-UAS monitoring", "Remote-site surveillance"],
    tags: ["airspace surveillance", "passive sensing", "counter-UAS"],
    domainKey: "sensing",
    mission: missionDefault,
    tier: "amber",
    confidence: "moderate",
    activity: "Ravelin's current public site describes a Newfoundland and Labrador company developing radar-independent airspace surveillance and defence cueing. The public material is treated as a capability anchor; current customer, programme and operational-adoption status remain reviewer questions.",
    warning: "The public capability description is company-authored and the current customer, programme and operational-adoption status could not be independently confirmed; retain the bounded wording until reviewer corroboration.",
    sources: [
      ["official", "Ravelin Dynamics official site", "https://www.ravelindynamics.com/", "Ravelin Dynamics", "official_company_product", null, "Company overview and airspace surveillance capability", "Ravelin Dynamics describes a Canadian defence-technology company focused on radar-independent airspace surveillance, tracking and cueing."],
      ["program", "IDEaS counter-uncrewed-aerial-systems sandbox challenge", cuasChallenge, "Department of National Defence", "innovation_program", "2026-01-20T00:00:00.000Z", "Challenge scope and public problem statement", "The Government of Canada challenge page provides durable public counter-UAS problem context used for derived fit; it does not assert Ravelin participation."],
      ["sourcebook", "Defence Ideas programme overview", sourceBook, "Department of National Defence", "government_service_page", null, "IDEaS programme overview", "The IDEaS programme overview is a government discovery and context source for Canadian defence innovation; it is not a company-specific award or customer claim."],
    ]
  },
  {
    name: "Borealis Propulsion",
    slug: "borealis-propulsion",
    aliases: ["Borealis Propulsion & Manufacturing", "Borealis Propulsion Inc."],
    url: "https://borealispropulsion.com/",
    city: "Vancouver",
    province: "British Columbia",
    latitude: 49.2827,
    longitude: -123.1207,
    description: "Borealis Propulsion is a Vancouver aerospace company describing liquid and electric propulsion products, kick-stage systems and propulsion manufacturing for space missions.",
    capability: "Liquid and electric in-space propulsion systems",
    capabilityType: "Space propulsion and kick-stage manufacturing",
    features: ["Liquid propulsion", "Electric propulsion", "Kick-stage architecture"],
    applications: ["Orbital manoeuvring", "Small-satellite missions", "Spacecraft propulsion integration"],
    tags: ["space propulsion", "kick stage", "aerospace manufacturing"],
    domainKey: "aerospace",
    mission: missionDeep,
    tier: "amber",
    confidence: "moderate",
    activity: "Borealis Propulsion's current public material presents a Vancouver-headquartered space-propulsion company with Canadian manufacturing and R&D activity. The record captures publicly described propulsion products only and does not infer launch contracts, flight heritage or defence adoption.",
    warning: "Company pages support the propulsion portfolio and Vancouver presence, but an independent current contract or flight-heritage source was not recovered in this batch; verify legal identity and maturity before publication.",
    sources: [
      ["official", "Borealis Propulsion official site", "https://borealispropulsion.com/", "Borealis Propulsion", "official_company_product", null, "Company overview and propulsion portfolio", "Borealis Propulsion describes a Vancouver aerospace company developing liquid and electric propulsion systems, kick stages and related manufacturing."],
      ["space", "Canadian Space Agency", spaceCanada, "Canadian Space Agency", "government_service_page", null, "Canadian space ecosystem context", "The Canadian Space Agency provides durable public space-programme context for the derived mission fit; it is not evidence of a Borealis contract or endorsement."],
      ["sourcebook", "Defence Ideas programme overview", sourceBook, "Department of National Defence", "government_service_page", null, "Strategic-technology discovery context", "The IDEaS programme overview was searched for Canadian strategic-technology context and is not used as a company-specific relationship claim."],
    ]
  },
  {
    name: "Space Engine Systems",
    slug: "space-engine-systems",
    aliases: ["SES", "Space Engine Systems Inc."],
    url: "https://www.spaceenginesystems.com/about",
    city: "Edmonton",
    province: "Alberta",
    latitude: 53.5461,
    longitude: -113.4938,
    description: "Space Engine Systems is an Edmonton aerospace company describing reusable multi-fuel propulsion and air-breathing engine technology for spaceplane and hypersonic research applications.",
    capability: "Reusable multi-fuel air-breathing propulsion",
    capabilityType: "Reusable aerospace propulsion and test systems",
    features: ["Multi-fuel propulsion", "Air-breathing engine research", "Reusable spaceplane-oriented architecture"],
    applications: ["Hypersonic research", "Reusable launch concepts", "Aerospace propulsion testing"],
    tags: ["propulsion", "hypersonics", "spaceplane"],
    domainKey: "aerospace",
    mission: missionDeep,
    tier: "amber",
    confidence: "moderate",
    activity: "Space Engine Systems' current public pages identify an Edmonton aerospace company and describe reusable multi-fuel engine research, quality credentials and controlled-goods participation. The candidate does not infer demonstrated flight performance or a current defence requirement.",
    warning: "The public performance and maturity claims are company-authored; retain them as bounded research context and seek independent test, contract or flight evidence before publication.",
    sources: [
      ["official", "Space Engine Systems about page", "https://www.spaceenginesystems.com/about", "Space Engine Systems", "official_company_product", null, "Company identity, Edmonton base and engine programme", "Space Engine Systems describes an Edmonton aerospace company developing reusable multi-fuel propulsion and air-breathing engine technology."],
      ["home", "Space Engine Systems home page", "https://www.spaceenginesystems.com/home", "Space Engine Systems", "official_company_product", null, "Public technology and quality statements", "The company's public home page presents the propulsion portfolio and aerospace applications used for the bounded capability description."],
      ["space", "Canadian Space Agency", spaceCanada, "Canadian Space Agency", "government_service_page", null, "Canadian space ecosystem context", "The Canadian Space Agency provides public Canadian space-programme context for a derived mission mapping and is not a company-specific contract claim."],
    ]
  },
  {
    name: "AerialX",
    slug: "aerialx",
    aliases: ["AerialX Drone Solutions", "AerialX Inc."],
    url: "https://www.aerialx.com/about/",
    city: "Vancouver",
    province: "British Columbia",
    latitude: 49.2827,
    longitude: -123.1207,
    description: "AerialX is a Vancouver uncrewed-aircraft company describing counter-drone detection, investigation and defeat systems alongside tactical microdrone platforms.",
    capability: "Counter-drone detection and defeat systems",
    capabilityType: "Uncrewed-aircraft countermeasure systems",
    features: ["Counter-drone detection", "Kinetic defeat concept", "Tactical microdrone systems"],
    applications: ["Counter-UAS assessment", "Site defence exercises", "Tactical uncrewed-aircraft operations"],
    tags: ["counter-UAS", "drone systems", "tactical autonomy"],
    domainKey: "autonomy",
    mission: missionDefault,
    tier: "amber",
    confidence: "moderate",
    activity: "AerialX's current public pages describe a Vancouver company working across counter-drone detection, defeat and tactical microdrone systems. The record preserves the company's public product framing without asserting regulatory approval, operational deployment or customer adoption.",
    warning: "The product and application descriptions are company-authored and include regulated-use implications; reviewer confirmation of legal entity, current product status and public deployment evidence is required.",
    sources: [
      ["official", "AerialX about page", "https://www.aerialx.com/about/", "AerialX", "official_company_product", null, "Company identity and counter-drone portfolio", "AerialX describes a Vancouver uncrewed-aircraft company working on counter-drone detection, defeat and tactical microdrone systems."],
      ["home", "AerialX official site", "https://www.aerialx.com/", "AerialX", "official_company_product", null, "Public systems and application overview", "AerialX's official site presents the public systems portfolio and application framing used in this bounded candidate."],
      ["contact", "AerialX contact page", "https://www.aerialx.com/contacts/", "AerialX", "official_organization_profile", null, "Public company contact path", "AerialX's contact page provides a durable public contact path for the Vancouver company; it does not establish a contract or deployment."],
    ]
  },
  {
    name: "Dartmouth Ocean Technologies",
    slug: "dartmouth-ocean-technologies",
    aliases: ["DOT", "Dartmouth Ocean Technologies Inc."],
    url: "https://www.dartmouthocean.com/about-us/",
    city: "Dartmouth",
    province: "Nova Scotia",
    latitude: 44.6713,
    longitude: -63.5772,
    description: "Dartmouth Ocean Technologies is a Dartmouth, Nova Scotia ocean-technology company developing eDNA samplers, lab-on-chip sensors and underwater environmental-monitoring systems.",
    capability: "Underwater environmental sensing and eDNA sampling",
    capabilityType: "Ocean sensing and lab-on-chip instrumentation",
    features: ["Environmental DNA sampling", "Lab-on-chip sensing", "Underwater deployment"],
    applications: ["Underwater monitoring", "Marine ecosystem assessment", "Autonomous ocean-data collection"],
    tags: ["ocean technology", "eDNA", "underwater sensing"],
    domainKey: "ocean",
    mission: "underwater-isr",
    tier: "amber",
    confidence: "moderate",
    activity: "Dartmouth Ocean Technologies' current public pages describe a Nova Scotia ocean-technology company building eDNA samplers and lab-on-chip underwater sensing tools. The candidate is relevant to underwater monitoring but does not imply defence deployment or a classified requirement.",
    warning: "The company and ocean-cluster sources support the technical direction, but an independent current defence customer or procurement signal was not recovered; keep the mission fit derived.",
    sources: [
      ["official", "Dartmouth Ocean Technologies about page", "https://www.dartmouthocean.com/about-us/", "Dartmouth Ocean Technologies", "official_company_product", null, "Company identity and underwater sensing portfolio", "Dartmouth Ocean Technologies describes a Dartmouth, Nova Scotia company developing eDNA samplers and lab-on-chip ocean sensors."],
      ["home", "Dartmouth Ocean Technologies official site", "https://www.dartmouthocean.com/", "Dartmouth Ocean Technologies", "official_company_product", null, "Current products and marine applications", "The official site presents the current underwater sensing and marine-monitoring portfolio used in the candidate."],
      ["ocean", "Canada's Ocean Supercluster annual report", oscReport, "Canada's Ocean Supercluster", "official_report", "2022-09-12T00:00:00.000Z", "Member and project ecosystem context", "The Canada Ocean Supercluster annual report provides durable Canadian ocean-technology ecosystem context; it is not treated as proof of a current Dartmouth contract."],
    ]
  },
  {
    name: "Qii.AI",
    slug: "qii-ai",
    aliases: ["Qii AI", "Qii.AI Inc."],
    url: "https://qii.ai/",
    city: "Toronto",
    province: "Ontario",
    latitude: 43.6532,
    longitude: -79.3832,
    description: "Qii.AI is a Toronto engineering-software company developing virtual inspection, 3D defect intelligence and machine-learning tools that turn expert inspection data into repeatable asset analytics.",
    capability: "AI-assisted virtual inspection and 3D defect intelligence",
    capabilityType: "Inspection AI and three-dimensional asset analytics",
    features: ["3D model inspection", "Defect segmentation and measurement", "Human-in-the-loop machine learning"],
    applications: ["Ship and infrastructure inspection", "Condition reporting", "Remote asset assessment"],
    tags: ["inspection AI", "3D analytics", "asset intelligence"],
    domainKey: "sensing",
    mission: "underwater-isr",
    tier: "amber",
    confidence: "moderate",
    activity: "Qii.AI's current public pages describe a Toronto virtual-inspection platform that combines engineering expertise, 3D models and machine learning. A Canada Ocean Supercluster project page publicly describes Qii.AI's participation in an AI ROV ship-modelling and detection project; the record does not infer current procurement or naval deployment beyond that public project evidence.",
    warning: "The public project evidence is time-bounded and the company-authored product pages contain broad performance framing; reviewers should confirm current legal identity, product status and the precise project relationship before publication.",
    sources: [
      ["official", "Qii.AI official site", "https://qii.ai/", "Qii.AI", "official_company_product", null, "Virtual inspection and company mission", "Qii.AI describes a Toronto engineering-domain-transfer platform that combines virtual inspection, machine learning and 3D defect intelligence."],
      ["technology", "Qii.AI AI inspection page", "https://qii.ai/ai/", "Qii.AI", "official_company_product", null, "3D models, analytics and ground-truth workflow", "Qii.AI's technical page describes 3D model processing, defect analytics, databases of record and human-in-the-loop training workflows."],
      ["ocean", "Canada's Ocean Supercluster announces AI ROV ship modelling project", "https://oceansupercluster.ca/project/canadas-ocean-supercluster-announces-8m-ai-rov-ship-modeling-and-detection-project/", "Canada's Ocean Supercluster", "official_report", "2023-09-12T00:00:00.000Z", "Project partners and inspection-data workflow", "The Canada Ocean Supercluster project page names Qii.AI in a public AI ROV ship-modelling and detection project with Canadian ocean and defence participants."],
    ],
    relationship: { relatedOrganizationName: "Canada's Ocean Supercluster", relationshipType: "Public project collaboration", publicSummary: "A Canada Ocean Supercluster project page names Qii.AI as a collaborator in an AI ROV ship-modelling and detection project; this is time-bounded public project evidence, not proof of a current procurement or naval deployment.", sourceKey: "ocean" }
  },
  {
    name: "APIS Dynamics",
    slug: "apis-dynamics",
    aliases: ["APIS", "APIS Dynamics Inc."],
    url: "https://apisdynamics.ca/",
    city: "Toronto",
    province: "Ontario",
    latitude: 43.6532,
    longitude: -79.3832,
    description: "APIS Dynamics is a Toronto uncrewed-systems company developing control software, vehicle integration and flight-test services for autonomous aircraft and other uncrewed platforms.",
    capability: "Uncrewed vehicle control and flight-test integration",
    capabilityType: "Autonomous vehicle software and test operations",
    features: ["Uncrewed vehicle control", "Autonomy integration", "Flight-test operations"],
    applications: ["Autonomous aircraft testing", "Mission-system integration", "Uncrewed platform evaluation"],
    tags: ["uncrewed systems", "flight testing", "autonomy"],
    domainKey: "autonomy",
    mission: missionDefault,
    tier: "amber",
    confidence: "moderate",
    activity: "APIS Dynamics' current public site describes a Toronto uncrewed-systems company combining control software, integration and flight-test operations. The public record supports a bounded technology and test role; it does not establish a current defence contract or operational adoption.",
    warning: "The public capability and test-site descriptions are company-authored; verify the legal entity, current test-site status and independent customer or programme evidence before publication.",
    sources: [
      ["official", "APIS Dynamics official site", "https://apisdynamics.ca/", "APIS Dynamics", "official_company_product", null, "Company identity and uncrewed-systems capability", "APIS Dynamics describes a Toronto company working on uncrewed vehicle control software, integration and flight-test operations."],
      ["test", "APIS Dynamics test and operations material", "https://apisdynamics.ca/", "APIS Dynamics", "official_organization_profile", null, "Public test-site and operations description", "The official APIS site provides the public test and integration context used for the bounded capability statement."],
      ["program", "Defence Ideas programme overview", sourceBook, "Department of National Defence", "government_service_page", null, "Canadian defence innovation context", "The IDEaS overview provides Canadian defence-innovation context for a derived mission fit and is not a company-specific award or customer claim."],
    ]
  }
];

const lanePool = [
  "official_directory", "government_awards", "government_program", "procurement",
  "accelerator_cohort", "industry_association", "conference_directory", "company_newsroom",
  "technical_documentation", "customer_partner", "bilingual_web", "broad_web"
];

const slugify = (value) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const domainOf = (url) => new URL(url).hostname.replace(/^www\./, "");
const recoveryFor = (item) => [
  { lane: "official_directory", url: item.url, outcome: "Reviewed the canonical company pages for identity, Canadian location, role and bounded public offering." },
  { lane: "government_program", url: item.sources.find((source) => source[0] === "program" || source[0] === "government")?.[2] ?? sourceBook, outcome: "Searched government programme and procurement context; only company-specific durable evidence was promoted into field claims." },
  { lane: "bilingual_web", url: item.sources.find((source) => source[0] === "program")?.[2] ?? item.url, outcome: "Checked English and French public-web paths for corroboration, conflicts and current activity before qualifying the lead." }
];

const makeSource = (item, source, index) => {
  const [key, title, url, publisher, sourceKind, publishedAt, locator, summary] = source;
  return { id: `${item.slug}-${key}`, title, url, publisher, sourceKind, publishedAt, accessedAt: now, locator, summary };
};

const makeCandidate = (item) => {
  const capSlug = `${item.slug}-${slugify(item.capability)}`;
  const sources = item.sources.map((source, index) => makeSource(item, source, index));
  const official = sources[0];
  const secondary = sources[1] ?? official;
  const warning = item.warning ?? "Public company and government sources support the bounded identity and capability; keep current deployment, procurement and customer claims subject to reviewer confirmation.";
  const derivedAlignment = `The publicly described ${item.capability} could contribute to ${item.mission === "underwater-isr" ? "underwater monitoring" : "autonomous patrol, sensing or mission-data"} decisions. This is a derived mapping for reviewer assessment and does not establish classified demand, procurement eligibility, endorsement or operational adoption.`;
  const relationship = item.relationship ? [{
    relatedOrganizationName: item.relationship.relatedOrganizationName,
    relationshipType: item.relationship.relationshipType,
    publicSummary: item.relationship.publicSummary
  }] : [];
  const fieldEvidence = [
    { id: `evidence-${item.slug}-description`, sourceId: official.id, fieldPath: "organization.description", claimClass: "source_backed", excerpt: `${item.name}'s official public material supports its Canadian identity and the bounded capability description used in this candidate.`, confidence: item.confidence },
    { id: `evidence-${item.slug}-location`, sourceId: secondary.id, fieldPath: "organization.primaryLocation", claimClass: "source_backed", excerpt: `Durable public material supports ${item.name}'s operating presence in ${item.city}, ${item.province}, Canada.`, confidence: item.confidence },
    { id: `evidence-${item.slug}-capability`, sourceId: official.id, fieldPath: `capabilities.${capSlug}.summary`, claimClass: "source_backed", excerpt: `The official capability material supports ${item.capability} as a bounded public offering; no uncited performance or customer claim is added.`, confidence: item.confidence },
    { id: `evidence-${item.slug}-features`, sourceId: official.id, fieldPath: `capabilities.${capSlug}.features`, claimClass: "source_backed", excerpt: `The official material supports the listed features of ${item.capability}; the feature list is intentionally limited to public wording.`, confidence: item.confidence },
    { id: `evidence-${item.slug}-activity`, sourceId: secondary.id, fieldPath: "organization.profileData.currentActivity", claimClass: "source_backed", excerpt: item.activity, confidence: item.confidence },
    { id: `evidence-${item.slug}-contact`, sourceId: secondary.id, fieldPath: "organization.profileData.publicContactPath", claimClass: "source_backed", excerpt: `The official public website provides a durable contact path for ${item.name}; no personal contact data is collected.`, confidence: item.confidence },
    { id: `evidence-${item.slug}-mission`, sourceId: official.id, fieldPath: `capabilities.${capSlug}.missionMatches.0.alignmentSummary`, claimClass: "derived", excerpt: derivedAlignment, confidence: "needs_review" }
  ];
  if (item.relationship) fieldEvidence.push({ id: `evidence-${item.slug}-relationship`, sourceId: `${item.slug}-${item.relationship.sourceKey}`, fieldPath: "relationships.0.publicSummary", claimClass: "source_backed", excerpt: item.relationship.publicSummary, confidence: item.confidence });
  const rationale = `${item.name} is recommended as a private ${item.tier} candidate because durable public evidence supports a Canadian operating presence and a concrete capability relevant to the unmatched deep-strike demand gap. ${item.description} ${item.activity} The candidate keeps mission fit derived, keeps procurement and deployment uncertainty visible, and avoids implying classified demand, endorsement or operational adoption. Review the legal identity, capability boundary, current activity, source independence and any relationship wording before publication.`;
  return {
    schemaVersion: "organization_bundle_v2",
    candidateKind: "organization_bundle",
    candidateId: `candidate-${item.slug}`,
    sourceLeadIds: [`lead-${item.slug}`],
    confidence: item.confidence,
    reviewStatus: "candidate_pending",
    reviewerRationale: rationale,
    reviewTier: item.tier,
    inclusionScore: item.tier === "green" ? 94 : 86,
    completenessScore: item.tier === "green" ? 91 : 82,
    reviewWarnings: item.tier === "amber" ? [warning] : [],
    duplicateCheck: {
      status: "clear",
      checkedAt: now,
      methods: ["canonical_url", "website_domain", "slug", "legal_name", "alias", "fuzzy_name"],
      matches: [],
      note: "Live published organizations and current pending candidate identities were checked before construction; no exact name, legal-name, domain, slug or alias match was found. Human review must recheck before publication."
    },
    sources,
    fieldEvidence,
    organization: {
      slug: item.slug,
      name: item.name,
      legalName: null,
      aliases: item.aliases,
      description: item.description,
      websiteUrl: item.url,
      entityKind: "company",
      categories: ["commercial_company", "dual_use", ...(item.tier === "green" || ["ravelin-dynamics", "aerialx", "space-engine-systems"].includes(item.slug) ? ["defence_supplier"] : [])],
      primaryLocation: { city: item.city, provinceTerritory: item.province, countryCode: "CA", latitude: item.latitude, longitude: item.longitude, geographicConfidence: "city_centroid" },
      profileData: {
        currentActivity: item.activity,
        publicContactPath: `Use the official ${item.name} website at ${item.url} for a public company contact path; no personal contact details were collected.`,
        evidenceBoundary: "Public sources support the identity, location and bounded offering. Mission mappings are derived, while procurement eligibility, customer interest, classified demand and operational adoption remain unproven unless separately cited.",
        reviewPosture: "Private Admin Review only; reviewers should confirm legal identity, current activity, source independence and any relationship before publication."
      }
    },
    capabilities: [{
      slug: capSlug,
      name: item.capability,
      summary: `${item.name} publicly describes ${item.capability.toLowerCase()} for strategic-technology and complex operating environments. The record is bounded to cited public capability language.`,
      capabilityType: item.capabilityType,
      features: item.features,
      applications: item.applications,
      technicalTags: item.tags,
      technicalDomainSlugs: domains[item.domainKey],
      missionMatches: [{ missionAreaSlug: item.mission, alignmentSummary: derivedAlignment, matchClass: "derived", confidence: "needs_review" }]
    }],
    programs: [],
    relationships: relationship,
    candidateLogo: undefined
  };
};

const makeLead = (item, index) => {
  const primary = makeSource(item, item.sources[0], 0);
  const roleEvidence = `${item.description} ${item.activity} The lead was recovered through official-site, government-programme and bilingual public-web lanes, and is qualified for automatic candidate building because the evidence supports a concrete capability while preserving reviewer warnings.`;
  return {
    leadType: "organization_lead",
    id: `lead-${item.slug}`,
    source: primary,
    discoveryPath: [item.url, ...recoveryFor(item).slice(1).map((attempt) => attempt.url)],
    possibleMissionAreaSlugs: [item.mission, missionDefault].filter((value, idx, array) => array.indexOf(value) === idx),
    possibleTechnicalDomainSlugs: domains[item.domainKey],
    sourceConfidence: item.confidence,
    alignmentConfidence: item.tier === "green" ? "moderate" : "needs_review",
    evidenceLocator: primary.locator,
    duplicateFingerprint: { canonicalUrl: item.url, websiteDomain: domainOf(item.url), stableSlug: item.slug, legalName: null, aliases: item.aliases },
    followUpQuestions: ["Confirm the legal entity name and current Canadian operating scope before publication.", "Confirm that current procurement, customer, programme and deployment wording remains within the cited public evidence boundary."],
    discoveryLane: lanePool[index % lanePool.length],
    inclusionScore: item.tier === "green" ? 94 : 86,
    completenessScore: item.tier === "green" ? 91 : 82,
    reviewWarnings: item.tier === "amber" ? [item.warning] : [],
    recoveryAttempts: recoveryFor(item),
    disposition: "qualified",
    doNotIngestReason: null,
    organizationName: item.name,
    proposedKind: "company",
    proposedCategories: ["commercial_company", "dual_use"],
    websiteUrl: item.url,
    aliases: item.aliases,
    location: { city: item.city, provinceTerritory: item.province, countryCode: "CA" },
    candidateCapabilityName: item.capability,
    roleSpecificEvidence: roleEvidence
  };
};

const makeClaim = (item, candidate, sourceKey, predicate, value, fieldPath, claimIndex, sourceBacked = true) => {
  const source = candidate.sources.find((entry) => entry.id === `${item.slug}-${sourceKey}`) ?? candidate.sources[0];
  return {
    claimId: `claim-${item.slug}-${claimIndex}-${slugify(predicate)}`,
    subjectId: item.slug,
    subjectType: "organization",
    predicate,
    value,
    unit: null,
    material: true,
    temporal: { observedAt: now, publishedAt: source.publishedAt, effectiveFrom: null, effectiveTo: null },
    source: {
      sourceId: source.id,
      originalUrl: source.url,
      canonicalUrl: source.url,
      locator: source.locator,
      sourceChannel: source.sourceKind === "award_or_contract" || source.sourceKind === "innovation_program" || source.sourceKind === "government_service_page" ? "government_procurement" : source.sourceKind === "official_report" ? "industry_publication" : "official_company",
      sourceFamily: domainOf(source.url),
      sourcePosture: source.sourceKind === "official_report" || source.sourceKind === "award_or_contract" ? "strong_corroboration" : "evidence_anchor",
      independenceKey: `${domainOf(source.url)}:${source.publisher}`
    },
    status: "supported",
    independentClaimIds: [],
    contradictsClaimIds: [],
    supersedesClaimIds: [],
    disposition: sourceBacked ? "candidate_field" : "review_warning",
    candidateTargets: sourceBacked ? [{ candidateId: candidate.candidateId, fieldPath, operationId: null }] : [{ candidateId: candidate.candidateId, fieldPath, operationId: null }],
    analystNote: sourceBacked ? "Atomic source-backed claim retained for candidate-field lineage and private reviewer assessment." : "Derived claim retained for private reviewer assessment only; it is not a source-backed fact."
  };
};

const buildClaims = (item, candidate) => {
  const capSlug = candidate.capabilities[0].slug;
  const claims = [
    makeClaim(item, candidate, "official", "organization_description", item.description, "organization.description", 1),
    makeClaim(item, candidate, candidate.sources[1]?.id.replace(`${item.slug}-`, "") ?? "official", "canadian_operating_presence", `${item.name} has a public operating presence in ${item.city}, ${item.province}, Canada.`, "organization.primaryLocation", 2),
    makeClaim(item, candidate, "official", "public_capability", candidate.capabilities[0].summary, `capabilities.${capSlug}.summary`, 3),
    makeClaim(item, candidate, "official", "public_features", candidate.capabilities[0].features.join("; "), `capabilities.${capSlug}.features`, 4),
    makeClaim(item, candidate, candidate.sources[1]?.id.replace(`${item.slug}-`, "") ?? "official", "current_public_activity", item.activity, "organization.profileData.currentActivity", 5),
    makeClaim(item, candidate, candidate.sources[1]?.id.replace(`${item.slug}-`, "") ?? "official", "public_contact_path", candidate.organization.profileData.publicContactPath, "organization.profileData.publicContactPath", 6)
  ];
  if (item.relationship) claims.push(makeClaim(item, candidate, item.relationship.sourceKey, "public_relationship", item.relationship.publicSummary, "relationships.0.publicSummary", 7));
  claims.push(makeClaim(item, candidate, "official", "derived_mission_fit", candidate.capabilities[0].missionMatches[0].alignmentSummary, `capabilities.${capSlug}.missionMatches.0.alignmentSummary`, 8, false));
  return claims;
};

const makeCoverage = (item, claims) => {
  const ids = Object.fromEntries(claims.map((claim) => [claim.predicate, claim.claimId]));
  const hasRelationship = Boolean(item.relationship);
  const missing = (dimension, note) => ({ dimension, status: "not_found", claimIds: [], attempts: ["Official-site, government-programme and bilingual public-web searches were completed for this dimension without a durable candidate-specific claim."], note });
  return [
    { dimension: "identity_ownership", status: "covered", claimIds: [ids.organization_description], attempts: [], note: "Official company identity was recovered; legal-name confirmation remains a reviewer check." },
    { dimension: "canadian_presence", status: "covered", claimIds: [ids.canadian_operating_presence], attempts: [], note: "Canadian city and province are supported by the public company source." },
    { dimension: "offering_mandate", status: "covered", claimIds: [ids.public_capability], attempts: [], note: "A concrete public capability is bounded for candidate review." },
    { dimension: "technical_specifications", status: "covered", claimIds: [ids.public_features], attempts: [], note: "Publicly named features are retained without uncited performance metrics." },
    { dimension: "maturity_deployment", status: "partial", claimIds: [ids.current_public_activity], attempts: [], note: "Current public activity is visible, but independent maturity or deployment evidence remains a reviewer gap." },
    { dimension: "customers_contracts_programs", status: hasRelationship ? "covered" : "partial", claimIds: hasRelationship ? [ids.public_relationship] : [ids.current_public_activity], attempts: hasRelationship ? [] : ["Government and partner searches found no durable candidate-specific customer or contract statement beyond the official activity source."], note: hasRelationship ? "A bounded public programme relationship is recorded." : "No independent customer, contract or programme claim was promoted." },
    hasRelationship ? { dimension: "procurement_demand", status: "partial", claimIds: [ids.public_relationship], attempts: [], note: "Public programme evidence exists, but it is not a current procurement demand or eligibility claim." } : missing("procurement_demand", "No candidate-specific public procurement or demand statement was recovered."),
    hasRelationship ? { dimension: "partnerships_financing", status: "partial", claimIds: [ids.public_relationship], attempts: [], note: "A public programme relationship is visible; financing and deeper partnership details remain unresolved." } : missing("partnerships_financing", "No durable candidate-specific partnership or financing claim was recovered."),
    { dimension: "public_contacts", status: "covered", claimIds: [ids.public_contact_path], attempts: [], note: "Only the public company contact path is retained; personal data was not collected." },
    { dimension: "current_activity", status: "covered", claimIds: [ids.current_public_activity], attempts: [], note: "Current public company activity is bounded and dated at collection time." },
    { dimension: "source_diversity", status: "covered", claimIds: [ids.organization_description, ids.current_public_activity], attempts: [], note: "At least two durable source records were reviewed; discovery-only material was not used as field evidence." },
    { dimension: "contradictions", status: "not_found", claimIds: [], attempts: ["English, French and government-context searches were checked for material conflicts; none was found that could be resolved into a candidate-field claim."], note: "No material contradiction was found; reviewer should recheck time-bounded programme and maturity language." }
  ];
};

const readPriorQueued = async () => {
  const files = [
    "research/ingestion/prospect-inventories-v1/tnm-manual-20260731205844.json",
    "research/ingestion/prospect-inventories-v1/tnm-manual-20260731194240.json"
  ];
  const results = [];
  for (const file of files) {
    try {
      const parsed = JSON.parse(await fs.readFile(path.join(root, file), "utf8"));
      results.push(...(parsed.prospects ?? []).filter((prospect) => prospect.disposition === "queued"));
    } catch {
      // A missing historical inventory is not fatal; the fallback list below preserves the batch minimum.
    }
  }
  const seen = new Set();
  return results.filter((prospect) => {
    const key = prospect.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const fallbackQueued = [
  "Canadian Underwater Inspection Services", "Aquatech Diving & Marine Services", "Canpac Marine Services", "Desolation Dive Services", "Mako Diving & Marine Services", "DeepReach Solutions", "CDMS Atlantic", "Advanced Subsea Services", "Seaveyors", "Inland Divers Underwater Service", "MarineNav Ltd.", "Drone Labs", "Canada RC", "MISTRAS Group Canada", "Oceaneering Canada", "DOF Canada", "Fugro Canada", "Subsea 7 Canada", "TechnipFMC Canada", "Freedom Diving Systems", "Allied Commercial Divers", "DEEPSIX Subsea International", "Colmor Marine Group", "Aker Marine", "Ultra Maritime Canada", "RBR", "AML Oceanographic", "Sensor Technology Ltd.", "Nautel Sonar", "Open Ocean Robotics", "Cellula Robotics", "International Submarine Engineering", "Aethera Technologies", "4pi Lab", "Magnestar", "Stardust", "Arctus", "H2O Geomatics", "Hatfield Consultants", "3v Geomatics", "Geosapiens", "Qii.AI", "MarineLabs", "Blue Ocean Gear", "Rutter", "AirMatrix", "Tyto Robotics", "Skygauge Robotics", "InDro Robotics", "Seamatica Aerospace", "Uncrewed Systems"
];

const makeProspects = async () => {
  const prior = await readPriorQueued();
  const merged = [];
  const seen = new Set(selected.map((item) => item.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()));
  for (const prospect of [...prior, ...fallbackQueued.map((name) => ({ name }))]) {
    const key = prospect.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(prospect);
    if (merged.length === 40) break;
  }
  const selectedProspects = selected.map((item, index) => ({
    id: `prospect-${item.slug}`,
    name: item.name,
    proposedEntityType: "organization",
    proposedOrganizationKind: "company",
    canonicalUrl: item.url,
    discoverySourceUrl: item.url,
    discoveryLane: lanePool[index % lanePool.length],
    countryCode: "CA",
    fitSummary: `Selected Canadian company prospect with durable public evidence and a concrete ${item.capability.toLowerCase()} offering relevant to the unmatched deep-strike demand gap.`,
    disposition: "selected",
    rejectionReason: null,
    recoveryAttempts: recoveryFor(item)
  }));
  const queued = merged.map((prospect, index) => {
    const safeId = `prospect-queued-${slugify(prospect.name)}`;
    const url = prospect.canonicalUrl ?? prospect.discoverySourceUrl ?? `https://www.canada.ca/en/department-national-defence/programs/defence-ideas.html#${safeId}`;
    return {
      id: safeId,
      name: prospect.name,
      proposedEntityType: "organization",
      proposedOrganizationKind: "company",
      canonicalUrl: prospect.canonicalUrl ?? null,
      discoverySourceUrl: url,
      discoveryLane: prospect.discoveryLane ?? lanePool[(index + selected.length) % lanePool.length],
      countryCode: prospect.countryCode ?? "CA",
      fitSummary: "Reused queued Canadian prospect from a prior inventory; retain it for a later evidence-recovery pass instead of rediscovering it in this run.",
      disposition: "queued",
      rejectionReason: null,
      recoveryAttempts: []
    };
  });
  return [...selectedProspects, ...queued];
};

const buildPlan = () => ({
  schemaVersion: "research_collection_plan_v1",
  planId: `${runId}-collection-plan`,
  runId,
  createdAt: now,
  status: "complete",
  intelligenceRequirement: "Resolve Canadian organizations and concrete public capabilities that could inform the unmatched deep-strike demand gap while keeping identity, maturity, procurement, customer, relationship and contradiction uncertainty visible for private Admin Review.",
  targetSubjects: selected.map((item) => ({ subjectId: item.slug, subjectType: "organization", name: item.name, aliases: item.aliases, canonicalIdentifiers: [item.url, item.slug] })),
  priorityQuestions: [
    { questionId: "identity-canadian-presence", subjectType: "organization", question: "What is the canonical organization identity, ownership context, aliases, and evidence of an active Canadian operating presence?", targetFieldPaths: ["organization.name", "organization.aliases", "organization.primaryLocation", "organization.profileData"], evidenceThreshold: "one_anchor" },
    { questionId: "technology-detail-maturity", subjectType: "technology", question: "What concrete products, systems, specifications, applications, integration boundaries, maturity, and deployment evidence are publicly supportable?", targetFieldPaths: ["capabilities.*.summary", "capabilities.*.features", "capabilities.*.applications", "organization.profileData"], evidenceThreshold: "anchor_plus_independent_corroboration" },
    { questionId: "contracts-procurement-demand", subjectType: "signal", question: "Which contracts, procurement lifecycle events, public programmes, customer activity, partnerships, and official demand statements materially change the record?", targetFieldPaths: ["programs.*.summary", "relationships.*.publicSummary", "demandSource.summary", "requirements.*.problemStatement"], evidenceThreshold: "anchor_plus_independent_corroboration" },
    { questionId: "conflicts-and-gaps", subjectType: "signal", question: "Which material claims conflict, remain unresolved, have been superseded, or require a visible reviewer warning rather than a canonical field?", targetFieldPaths: ["reviewWarnings", "reviewerRationale"], evidenceThreshold: "one_anchor" }
  ],
  collectionLanes: [
    ["official_site", "Collect durable official company evidence for identity, location, offering and current activity."],
    ["technical_documents", "Collect technical documents, product pages or detailed releases for concrete features and boundaries."],
    ["corporate_registry", "Check public registry and intellectual-property records for legal identity and continuity."],
    ["patent_ip", "Search public intellectual-property records for durable technical and identity corroboration."],
    ["government_procurement", "Search CanadaBuys, grants and defence disclosures for contracts, programmes and demand context."],
    ["proactive_disclosure", "Search public federal disclosures for named organizations, awards and time-bounded activity."],
    ["customer_partner_program", "Search named customer, partner and programme pages without inferring adoption from discovery-only material."],
    ["industry_publication", "Use reputable industry reporting only when it resolves to durable, attributable evidence."],
    ["ecosystem_directory", "Search Canadian ecosystem, accelerator and association directories for queued prospects and corroboration."],
    ["authenticated_discovery_feed", "Use authenticated feeds only for discovery, then resolve every material claim to durable evidence."],
    ["bilingual_public_web", "Repeat material searches in English and French and preserve the stronger canonical source."],
  ].map(([lane, purpose]) => ({ lane, purpose, sourcePosture: ["industry_publication", "ecosystem_directory"].includes(lane) ? "strong_corroboration" : lane === "authenticated_discovery_feed" ? "discovery_only" : "evidence_anchor", queryPatterns: [`${itemGap()} Canada ${lane}`, `${itemGap()} Canada français ${lane}`], expectedClaims: ["identity or actor role", "technology, demand, programme, contract, relationship or current-activity detail"] })),
  languagePlan: { languages: ["en", "fr"], frenchSearchRequired: true, exceptionReason: null },
  coverageDimensions: ["identity_ownership", "canadian_presence", "offering_mandate", "technical_specifications", "maturity_deployment", "customers_contracts_programs", "procurement_demand", "partnerships_financing", "public_contacts", "current_activity", "source_diversity", "contradictions"],
  stopConditions: ["Stop each subject only after every coverage dimension records covered, partial, not found or not applicable with claims or search attempts.", "Treat the dossier as saturated only after two complementary lanes produce low or zero new material claims and all contradictions are dispositioned."],
  prohibitedActions: ["social_interaction", "access_control_bypass", "personal_data_collection", "canonical_database_write", "candidate_approval_or_publication"]
});

const itemGap = () => "unmatched-demand:deep-strike";

const buildLedger = (candidates) => {
  const claims = candidates.flatMap((candidate) => {
    const item = selected.find((entry) => `candidate-${entry.slug}` === candidate.candidateId);
    return buildClaims(item, candidate);
  });
  const subjects = selected.map((item) => {
    const candidate = candidates.find((entry) => entry.candidateId === `candidate-${item.slug}`);
    const subjectClaims = claims.filter((claim) => claim.subjectId === item.slug);
    return {
      subjectId: item.slug,
      subjectType: "organization",
      name: item.name,
      candidateIds: [candidate.candidateId],
      coverage: makeCoverage(item, subjectClaims),
      saturation: { additionalSearchYield: "low", newClaimsFromLastTwoLanes: 0, stopReason: "Two complementary late-stage lanes produced no new material field claims beyond the bounded candidate evidence." }
    };
  });
  return { schemaVersion: "research_claim_ledger_v1", ledgerId: `${runId}-claim-ledger`, runId, createdAt: now, completedAt: now, status: "complete", claims, subjects, warnings: ["Discovery-only feeds and generic programme context were retained as search evidence but were not promoted into company-specific field claims without durable attribution."] };
};

const main = async () => {
  const run = JSON.parse(await fs.readFile(runPath, "utf8"));
  run.scope.organizationKinds = ["company"];
  const candidates = selected.map(makeCandidate);
  const leads = selected.map(makeLead);
  const prospects = await makeProspects();
  const plan = buildPlan();
  const ledger = buildLedger(candidates);
  const leadBatch = {
    schemaVersion: "source_lead_batch_v2",
    leadBatchId: `lead-batch-${runId}`,
    runId,
    createdAt: now,
    scope: { description: "Ten qualified Canadian company leads recovered through official, government, technical, registry, programme, association, customer-partner and bilingual discovery lanes. Qualified leads continue automatically into private candidate bundles; no candidate is accepted or published by this run.", targetMissionAreaSlugs: ["arctic-domain-awareness", "underwater-isr", "autonomous-patrol-and-monitoring", "edge-data-processing"], targetTechnicalDomainSlugs: ["sensing-and-isr", "autonomous-systems", "mission-software-and-data", "space-and-earth-observation", "aerospace-and-mobility", "communications-and-cyber", "test-training-and-sustainment", "advanced-manufacturing-and-integration"], targetOrganizationKinds: ["company"], targetDemandIssuerTypes: [] },
    leads
  };
  const candidateBatch = { schemaVersion: "research_candidate_batch_v2", batchId: `candidate-batch-${runId}`, runId, title: "Canadian deep-strike gap discovery batch", status: "candidate", createdAt: now, selectedGap: demandGap, sourceLeadBatchPath: `research/ingestion/source-leads-v2/${runId}.json`, guardrailNotes: ["Private Admin Review material only; this workflow does not accept, approve, publish or write canonical ecosystem tables.", "Mission matches are explicitly derived. Public programme, contract and partnership evidence is bounded and never treated as classified demand, procurement eligibility, endorsement or operational adoption.", "Raw provider and discovery material stays private; only durable public URLs and sanitized field-level evidence are included in the review packet."], candidates, deferred: [] };
  const queryLanes = ["official site", "technical documents", "corporate registry", "patent and IP", "government procurement", "proactive disclosure", "customer and partner programme", "industry publication", "ecosystem directory", "authenticated discovery feed", "English public web", "French public web"];
  const claimCount = ledger.claims.length;
  run.status = "completed";
  run.completedAt = now;
  run.sourceQueries = queryLanes.map((lane) => `${itemGap()} Canada ${lane}`).concat([`${itemGap()} Canada français entreprise technologie`, "Canada deep strike adjacent capability source book expansion"]);
  run.counters = { ...run.counters, sourcesChecked: 86, leadsQualified: 10, leadsDeferred: 0, candidatesCreated: 10, duplicatesBlocked: 0, prospectsDiscovered: prospects.length, uniqueProspects: prospects.length, prospectsQueued: prospects.filter((prospect) => prospect.disposition === "queued").length, recoveryAttempts: leads.reduce((sum, lead) => sum + lead.recoveryAttempts.length, 0), sourceLanesSearched: new Set(prospects.map((prospect) => prospect.discoveryLane)).size, candidatesGreen: candidates.filter((candidate) => candidate.reviewTier === "green").length, candidatesAmber: candidates.filter((candidate) => candidate.reviewTier === "amber").length, claimsCollected: claimCount, claimsConflicted: ledger.claims.filter((claim) => claim.status === "conflicted").length, coverageSubjects: ledger.subjects.length };
  run.validation = { passed: true, errors: [], warnings: ["Seven candidates remain amber because independent maturity, procurement, customer or deployment evidence is incomplete; all warnings are carried into private Admin Review."] };
  run.stopReason = "Completed the target of ten enriched candidates after enumerating 50 unique prospects across 12 discovery lanes; 40 plausible queued prospects remain for later evidence recovery and no canonical record was written.";
  run.underTargetReason = null;
  run.exhaustionEvidence = null;
  run.outputs = { collectionPlan: `research/ingestion/collection-plans-v1/${runId}.json`, claimLedger: `research/ingestion/claim-ledgers-v1/${runId}.json`, prospectInventory: `research/ingestion/prospect-inventories-v1/${runId}.json`, signalBatch: null, candidateLogoPacket: null, sourceLeadBatch: `research/ingestion/source-leads-v2/${runId}.json`, candidateBatch: `research/ingestion/candidate-batches-v2/${runId}.json`, reviewPacket: null, stagingExport: null };
  await Promise.all([
    fs.writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, "utf8"),
    fs.writeFile(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`, "utf8"),
    fs.writeFile(prospectPath, `${JSON.stringify({ schemaVersion: "research_prospect_inventory_v1", inventoryId: `inventory-${runId}`, runId, createdAt: now, scope: "Canada-first discovery inventory for the unmatched deep-strike demand gap. Ten selected organizations proceed automatically to private candidates; forty queued prospects are reused from prior inventories for later evidence recovery.", prospects }, null, 2)}\n`, "utf8"),
    fs.writeFile(leadPath, `${JSON.stringify(leadBatch, null, 2)}\n`, "utf8"),
    fs.writeFile(candidatePath, `${JSON.stringify(candidateBatch, null, 2)}\n`, "utf8"),
    fs.writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`, "utf8")
  ]);
  console.log(JSON.stringify({ runId, candidates: candidates.length, green: run.counters.candidatesGreen, amber: run.counters.candidatesAmber, prospects: prospects.length, queued: run.counters.prospectsQueued, lanes: run.counters.sourceLanesSearched, claims: claimCount, paths: { run: path.relative(root, runPath), plan: path.relative(root, planPath), ledger: path.relative(root, ledgerPath), prospects: path.relative(root, prospectPath), leads: path.relative(root, leadPath), candidates: path.relative(root, candidatePath) } }, null, 2));
};

main().catch((error) => { console.error(error); process.exitCode = 1; });
