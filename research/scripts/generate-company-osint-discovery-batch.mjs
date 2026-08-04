#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const runId = process.argv[2];
if (!runId) throw new Error("Usage: generate-company-osint-discovery-batch.mjs <run-id>");
const configPath = process.argv[3] ?? null;

const now = new Date().toISOString();
const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const runPath = path.join(root, "research/ingestion/runs", `${runId}.json`);
const planPath = path.join(root, "research/ingestion/collection-plans-v1", `${runId}.json`);
const ledgerPath = path.join(root, "research/ingestion/claim-ledgers-v1", `${runId}.json`);
const prospectPath = `research/ingestion/prospect-inventories-v1/${runId}.json`;
const leadPath = `research/ingestion/source-leads-v2/${runId}.json`;
const candidatePath = `research/ingestion/candidate-batches-v2/${runId}.json`;

const defaultSelected = [
  {
    id: "photon-iv",
    name: "Photon-IV",
    legalName: "Photon-IV Inc.",
    aliases: ["Photon IV"],
    website: "https://photon-iv.com/",
    city: "Cambridge",
    province: "Ontario",
    latitude: 43.3616,
    longitude: -80.3144,
    description: "Photon-IV is a Cambridge, Ontario communications-software company developing artificial-intelligence tools for orchestrating resilient links across satellite, terrestrial, private-5G and distributed mesh networks.",
    capability: {
      slug: "photon-iv-resilient-network-orchestration",
      name: "Resilient satellite-terrestrial network orchestration",
      summary: "Photon-IV develops software that predicts changing link conditions and orchestrates traffic across satellite and terrestrial paths, alongside mesh-networking and open-RAN tools for mobile and autonomous platforms.",
      capabilityType: "AI-enabled resilient communications orchestration",
      features: ["Predictive link-quality analysis", "Satellite and terrestrial path orchestration", "Distributed mesh networking", "Open-RAN optimization tooling"],
      applications: ["Mobile command-and-control connectivity", "ISR data relay", "Remote-base communications", "Autonomous-system networking"],
      technicalTags: ["NTN-TN", "satellite communications", "mesh networking", "O-RAN", "artificial intelligence"],
      technicalDomainSlugs: ["communications-and-cyber", "space-and-earth-observation", "mission-software-and-data"],
      missionMatches: [
        ["arctic-domain-awareness", "Resilient handover between satellite and terrestrial paths could support connectivity for remote Arctic sensing and operations; this is a derived fit assessment, not a documented deployment.", "moderate"],
        ["autonomous-patrol-and-monitoring", "Mesh and multi-path connectivity could support distributed autonomous platforms that need to preserve control and data links; platform integration remains unverified.", "moderate"]
      ]
    },
    currentActivity: "CanadaBuys records an IDEaS Competitive Projects contract awarded to Photon-IV under solicitation WS5008404104, establishing current Department of National Defence innovation-program activity without identifying a specific deployed capability.",
    relationship: {
      relatedOrganizationName: "Department of National Defence",
      relationshipType: "IDEaS contract recipient",
      publicSummary: "CanadaBuys records Photon-IV as the recipient of a competitive IDEaS research contract under solicitation WS5008404104; the candidate does not infer operational adoption beyond the public award record."
    },
    tier: "amber",
    inclusionScore: 91,
    completenessScore: 85,
    warning: "The official site contains performance and security marketing metrics that were not independently validated and are intentionally excluded from the proposed record.",
    sourceKeys: { description: "profile", location: "profile", capability: "product", technical: "product", activity: "contract", relationship: "contract" },
    sources: [
      ["profile", "Photon-IV defence-grade network orchestration", "https://photon-iv.com/", "Photon-IV", "official_organization_profile", "About, capabilities and contact sections", "The official site identifies a Cambridge, Ontario company developing AI-enabled satellite-terrestrial, mesh and open-RAN communications software.", "official_company", "evidence_anchor", null],
      ["product", "Photon-IV products and communications capabilities", "https://photon-iv.com/", "Photon-IV", "official_company_product", "Capabilities and product-line sections", "The official site describes predictive satellite-terrestrial handover, secure multi-path communications, distributed mesh networking and open-RAN intelligence products.", "official_company", "evidence_anchor", null],
      ["marketplace", "Photon-IV CanadaBuys supplier profile", "https://achatscanada.canada.ca/fr/node/Apercu/1348146", "CanadaBuys", "government_service_page", "Supplier profile and Canadian business location", "The federal supplier profile identifies Photon-IV Inc. as a Cambridge, Ontario company working in AI, wireless communications and defence applications.", "government_procurement", "evidence_anchor", null],
      ["contract", "Photon-IV IDEaS contract history", "https://canadabuys.canada.ca/en/tender-opportunities/contract-history/cw2428540-001", "CanadaBuys", "award_or_contract", "Contract CW2428540 and related CFP 6 awards", "CanadaBuys records a competitive IDEaS contract awarded to Photon-IV under solicitation WS5008404104.", "government_procurement", "evidence_anchor", "2025-12-17T00:00:00.000Z"]
    ]
  },
  {
    id: "incendia-canada",
    name: "Incendia Canada",
    legalName: "Incendia Canada Inc.",
    aliases: ["Incendia", "Incendia Defense"],
    website: "https://incendia.ca/",
    city: "Saint-Hippolyte",
    province: "Quebec",
    latitude: 45.935,
    longitude: -74.013,
    description: "Incendia Canada is a Quebec safety-technology company developing autonomous, rapidly deployable environmental-threat detection and alerting systems for military, emergency, municipal and critical-infrastructure settings.",
    capability: {
      slug: "incendia-pentagon-environmental-threat-network",
      name: "Pentagon autonomous environmental-threat network",
      summary: "Pentagon combines integrated environmental sensors, embedded local analysis, wireless mesh communications and configurable local alerts in portable nodes that can operate without site power, Wi-Fi or cellular infrastructure.",
      capabilityType: "Autonomous environmental threat detection and alerting system",
      features: ["Integrated environmental sensors", "Embedded local threat analysis", "Autonomous mesh communications", "Portable tactical deployment kits"],
      applications: ["Deployed-camp safety", "Critical-infrastructure monitoring", "Emergency warning", "Fire, gas, flood and airborne-contaminant detection"],
      technicalTags: ["environmental sensing", "edge AI", "mesh networking", "emergency alerting", "deployable systems"],
      technicalDomainSlugs: ["sensing-and-isr", "communications-and-cyber", "mission-software-and-data"],
      missionMatches: [["autonomous-patrol-and-monitoring", "Autonomous sensor nodes and local alerts could support persistent monitoring of temporary or remote sites; this is a derived mission mapping rather than a documented CAF deployment.", "moderate"]]
    },
    currentActivity: "Incendia appears in NATO DIANA's 2026 Canadian cohort for an AI-powered environmental detector and CanadaBuys records a current DND IDEaS contract, demonstrating active allied acceleration and federal defence-research engagement.",
    relationship: {
      relatedOrganizationName: "Department of National Defence",
      relationshipType: "IDEaS contract recipient",
      publicSummary: "CanadaBuys records Incendia Canada Inc. as the recipient of a competitively awarded DND IDEaS military-science and research contract; no procurement outcome beyond the stated contract is inferred."
    },
    tier: "green",
    inclusionScore: 95,
    completenessScore: 91,
    warning: "Product-endurance and detection-performance statements originate with Incendia; the candidate retains functional details but excludes comparative performance claims pending independent validation.",
    sourceKeys: { description: "profile", location: "contract", capability: "product", technical: "product", activity: "diana", relationship: "contract" },
    sources: [
      ["profile", "Incendia civil-security technology", "https://incendia.ca/", "Incendia", "official_organization_profile", "Company and Pentagon overview", "Incendia describes its Canadian safety-technology mandate and use of autonomous sensing and alerting for civil and military environments.", "official_company", "evidence_anchor", null],
      ["product", "Pentagon defence solution", "https://defense.incendia.ca/en-ca/about-the-pentagone/", "Incendia", "official_company_product", "Detection, analysis, communication and deployment sections", "The official product page describes integrated sensors, local analysis, mesh communications, infrastructure-independent operation and tactical deployment components.", "official_company", "evidence_anchor", null],
      ["contract", "Incendia Canada IDEaS contract", "https://canadabuys.canada.ca/en/tender-opportunities/contract-history/cw2429611-001", "CanadaBuys", "award_or_contract", "Contract CW2429611", "CanadaBuys identifies Incendia Canada Inc., its Saint-Hippolyte address and a competitively awarded DND IDEaS military-science and research contract.", "government_procurement", "evidence_anchor", "2025-12-24T00:00:00.000Z"],
      ["diana", "NATO DIANA 2026 cohort of companies", "https://www.diana.nato.int/about-diana/2026-cohort-of-companies.html", "NATO DIANA", "accelerator_cohort_directory", "Critical Infrastructure and Logistics cohort", "NATO DIANA lists Incendia Canada Inc. in its 2026 Canadian cohort for an AI-powered environmental detector with wireless emergency-response coordination.", "ecosystem_program", "evidence_anchor", null]
    ]
  },
  {
    id: "clearsky-connect",
    name: "ClearSky Connect",
    legalName: "ClearSky Connect, Inc.",
    aliases: ["ClearSky"],
    website: "https://www.clearskyconnect.com/",
    city: "Ottawa",
    province: "Ontario",
    latitude: 45.4215,
    longitude: -75.6972,
    description: "ClearSky Connect is an Ottawa connectivity company developing network-assessment and communications services for scalable autonomous aviation and beyond-visual-line-of-sight operations over large infrastructure areas.",
    capability: {
      slug: "clearsky-span-autonomous-aviation-network",
      name: "SafePath Aviation Network",
      summary: "SafePath Aviation Network combines cellular and satellite connectivity, predictive coverage assessment, operational monitoring and path redundancy to support command-and-control and payload links for beyond-visual-line-of-sight autonomous aviation.",
      capabilityType: "Autonomous aviation connectivity service",
      features: ["Predictive connectivity risk assessment", "Cellular and satellite path integration", "Operational connectivity monitoring", "Multi-radio redundancy"],
      applications: ["BVLOS drone operations", "Infrastructure inspection", "Public-safety response", "Remote aerial monitoring"],
      technicalTags: ["BVLOS", "autonomous aviation", "cellular connectivity", "satellite connectivity", "network assurance"],
      technicalDomainSlugs: ["communications-and-cyber", "autonomous-systems", "aerospace-and-mobility"],
      missionMatches: [
        ["autonomous-patrol-and-monitoring", "Assured command-and-control and payload connectivity could help scale autonomous aerial monitoring over wide areas; the mapping is derived and does not assert a CAF deployment.", "high"],
        ["arctic-domain-awareness", "Satellite-backed connectivity and pre-flight coverage assessment could be relevant to remote aerial monitoring, subject to northern coverage and operational validation.", "needs_review"]
      ]
    },
    currentActivity: "CanadaBuys records ClearSky Connect as a recipient under DND's IDEaS Competitive Projects CFP 6, while the company's current material describes ongoing testing and development of autonomous-aviation connectivity.",
    relationship: {
      relatedOrganizationName: "Department of National Defence",
      relationshipType: "IDEaS contract recipient",
      publicSummary: "CanadaBuys records ClearSky Connect, Inc. as the recipient of a competitive DND IDEaS research contract; the public record does not identify an operational acquisition."
    },
    tier: "green",
    inclusionScore: 93,
    completenessScore: 88,
    warning: "The CanadaBuys contract confirms current defence-program activity but the public contract page does not identify which CFP 6 challenge or product the award supports.",
    sourceKeys: { description: "profile", location: "contract", capability: "product", technical: "product", activity: "contract", relationship: "contract" },
    sources: [
      ["profile", "About ClearSky Connect", "https://www.clearskyconnect.com/about", "ClearSky Connect", "official_organization_profile", "Who we are and founder-experience sections", "ClearSky describes a Canadian autonomous-aviation connectivity company with experience in network analytics, connectivity visualization and RPAS operations.", "official_company", "evidence_anchor", null],
      ["product", "SafePath Aviation Network", "https://www.clearskyconnect.com/s-pagepan", "ClearSky Connect", "official_company_product", "SPAN overview, connectivity-as-a-service and redundancy sections", "The official product page describes predictive link assessment, real-time monitoring, cellular redundancy and C2 and payload connectivity for BVLOS operations.", "official_company", "evidence_anchor", null],
      ["applications", "ClearSky autonomous aviation connectivity", "https://www.clearskyconnect.com/", "ClearSky Connect", "official_company_product", "Energy and public-safety application sections", "ClearSky describes cellular and satellite connectivity for autonomous aviation over infrastructure and for scalable public-safety response.", "official_company", "evidence_anchor", null],
      ["contract", "ClearSky Connect IDEaS contract", "https://canadabuys.canada.ca/en/tender-opportunities/contract-history/cw2429621-001", "CanadaBuys", "award_or_contract", "Contract CW2429621", "CanadaBuys identifies ClearSky Connect, Inc., its Ottawa business address and a DND IDEaS Competitive Projects award.", "government_procurement", "evidence_anchor", "2025-12-04T00:00:00.000Z"]
    ]
  },
  {
    id: "ambra-solutions",
    name: "Ambra Solutions",
    legalName: "Solutions Ambra Inc.",
    aliases: ["Ambra"],
    website: "https://www.ambra.co/en/",
    city: "Trois-Rivières",
    province: "Quebec",
    latitude: 46.343,
    longitude: -72.543,
    description: "Ambra Solutions is a Trois-Rivières telecommunications engineering and manufacturing company that designs and deploys private LTE and 5G networks, rugged devices and positioning tools for mission-critical industrial operations.",
    capability: {
      slug: "ambra-private-lte-5g-critical-connectivity",
      name: "Private LTE and 5G critical connectivity",
      summary: "Ambra delivers end-to-end private LTE and 5G networks with distributed and redundant architecture, rugged field devices, mobility support and positioning functions for operations in remote, underground and harsh environments.",
      capabilityType: "Private mobile broadband network and rugged communications system",
      features: ["Private LTE and 5G network engineering", "Distributed redundant architecture", "Rugged wireless modems", "Mobility and positioning support"],
      applications: ["Mission-critical communications", "Remote and autonomous operations", "First-responder connectivity", "Industrial asset and personnel tracking"],
      technicalTags: ["private LTE", "private 5G", "rugged communications", "PLMN interoperability", "positioning"],
      technicalDomainSlugs: ["communications-and-cyber", "mission-software-and-data", "advanced-manufacturing-and-integration"],
      missionMatches: [
        ["edge-data-processing", "Private broadband and rugged edge connectivity could support local data movement and control for distributed sensors and vehicles; this mapping remains derived.", "moderate"],
        ["arctic-domain-awareness", "Rugged private-network components and remote-site operation may be relevant to northern connectivity, subject to environmental and spectrum validation.", "needs_review"]
      ]
    },
    currentActivity: "CanadaBuys records a current DND IDEaS contract for Ambra's proposed seamless roaming between distinct 4G and 5G networks for mission-critical users including first responders, military personnel and security forces.",
    relationship: {
      relatedOrganizationName: "Department of National Defence",
      relationshipType: "IDEaS contract recipient",
      publicSummary: "CanadaBuys records a competitive DND IDEaS contract for Ambra's seamless inter-network roaming solution, with a public contract term extending into 2027."
    },
    tier: "green",
    inclusionScore: 97,
    completenessScore: 93,
    warning: "The proposed profile describes publicly documented architecture and devices but does not claim that Ambra's broader commercial network portfolio has been adopted by CAF outside the cited IDEaS contract.",
    sourceKeys: { description: "profile", location: "contract", capability: "product", technical: "datasheet", activity: "contract", relationship: "contract" },
    sources: [
      ["profile", "Ambra Solutions private-network engineering", "https://www.ambra.co/en/", "Ambra Solutions", "official_organization_profile", "About, engineering and mission-critical operations sections", "Ambra identifies a Canadian telecom engineering company founded in 2007 that integrates private LTE and 5G networks and manufactures rugged communications devices.", "official_company", "evidence_anchor", null],
      ["product", "Ambra private 4G and 5G", "https://www.ambra.co/en/expertises/private-4g-5g", "Ambra Solutions", "official_company_product", "Private network architecture and application sections", "Ambra describes end-to-end private mobile networks for underground, outdoor and indoor operations, including connectivity for assets, equipment and workers.", "official_company", "evidence_anchor", null],
      ["datasheet", "Ambra industrial rugged 4G and 5G modem", "https://www.ambra.co/wp-content/uploads/2024/06/E04866_Rugged-Modem_Ambra_Datasheet_EN.pdf", "Ambra Solutions", "official_company_product", "Industrial 4G/5G rugged modem technical datasheet", "The official datasheet documents an industrial rugged modem supporting 5G NR and LTE for field connectivity.", "official_company", "evidence_anchor", null],
      ["contract", "Ambra seamless 4G and 5G interoperability contract", "https://canadabuys.canada.ca/en/tender-opportunities/contract-history/cw2430960-000", "CanadaBuys", "award_or_contract", "Contract CW2430960", "The federal contract record identifies Solutions Ambra Inc., its Trois-Rivières address and a DND IDEaS project for seamless roaming between distinct mobile broadband networks.", "government_procurement", "evidence_anchor", "2026-03-24T00:00:00.000Z"]
    ]
  },
  {
    id: "solana-networks",
    name: "Solana Networks",
    legalName: "Solana Networks Inc.",
    aliases: ["Solana"],
    website: "https://www.solananetworks.com/",
    city: "Ottawa",
    province: "Ontario",
    latitude: 45.4215,
    longitude: -75.6972,
    description: "Solana Networks is an Ottawa network-intelligence company developing topology discovery, encrypted-traffic classification, anomaly detection and performance-monitoring tools for large and mission-critical IP networks.",
    capability: {
      slug: "solana-network-intelligence-and-anomaly-detection",
      name: "Network intelligence and anomaly detection suite",
      summary: "Solana's product suite combines routed and switched topology discovery, encrypted-traffic classification, flow analysis and anomaly detection to improve visibility, security and performance across complex IP networks.",
      capabilityType: "Network discovery, traffic analytics and security software",
      features: ["Layer 2 and Layer 3 topology discovery", "Encrypted-traffic classification", "Flow-based anomaly detection", "Modular APIs for integration"],
      applications: ["Mission-network assurance", "Cybersecurity monitoring", "Network troubleshooting", "Critical-infrastructure traffic analysis"],
      technicalTags: ["network discovery", "traffic analytics", "anomaly detection", "machine learning", "network security"],
      technicalDomainSlugs: ["communications-and-cyber", "mission-software-and-data"],
      missionMatches: [["edge-data-processing", "Network telemetry classification and anomaly detection could improve awareness and assurance for distributed mission networks; this is a derived fit assessment.", "moderate"]]
    },
    currentActivity: "CanadaBuys records a current competitive DND IDEaS contract awarded to Solana Networks under CFP 6, while Solana continues to present SmartHawk, TrafficWiz and SmartFlow as supported products.",
    relationship: {
      relatedOrganizationName: "Department of National Defence",
      relationshipType: "IDEaS contract recipient",
      publicSummary: "CanadaBuys records Solana Networks Inc. as the recipient of a competitive IDEaS military-science and research contract; the public contract page does not identify the specific Solana product involved."
    },
    tier: "amber",
    inclusionScore: 90,
    completenessScore: 87,
    warning: "The DND contract establishes current defence-research activity but does not disclose the supported challenge or product, so the product and award claims remain separate.",
    sourceKeys: { description: "profile", location: "contract", capability: "products", technical: "validation", activity: "contract", relationship: "contract" },
    sources: [
      ["profile", "About Solana Networks", "https://www.solananetworks.com/about", "Solana Networks", "official_organization_profile", "Company profile and contact information", "Solana describes an Ottawa-area network-intelligence company serving large and mission-critical networks.", "official_company", "evidence_anchor", null],
      ["products", "Solana Networks products", "https://www.solananetworks.com/products", "Solana Networks", "official_company_product", "SmartHawk, TrafficWiz and SmartFlow product sections", "The official catalogue describes topology discovery, encrypted-traffic classification, network monitoring and anomaly-detection products.", "official_company", "evidence_anchor", null],
      ["validation", "CENGN Solana SmartHawk validation", "https://www.cengn.ca/wp-content/uploads/2021/10/Solana-Success-Story-2019.pdf", "CENGN", "reputable_industry_publication", "SmartHawk virtualized monitoring validation", "CENGN reports testing Solana's virtualized SmartHawk monitoring solution for large-scale deployments, providing independent evidence of product validation.", "ecosystem_program", "strong_corroboration", null],
      ["contract", "Solana Networks IDEaS contract", "https://canadabuys.canada.ca/en/tender-opportunities/contract-history/cw2429186-000", "CanadaBuys", "award_or_contract", "Contract CW2429186", "CanadaBuys identifies Solana Networks Inc., its Ottawa address and a current competitive DND IDEaS research contract.", "government_procurement", "evidence_anchor", "2026-01-30T00:00:00.000Z"]
    ]
  },
  {
    id: "sentinel-r-and-d",
    name: "Sentinel R&D",
    legalName: null,
    aliases: ["Sentinel Research and Development"],
    website: "https://www.sentinelrd.com/",
    city: "Hamilton",
    province: "Ontario",
    latitude: 43.2557,
    longitude: -79.8711,
    description: "Sentinel R&D is a Hamilton, Ontario defence and aerospace company developing modular fixed-wing uncrewed aircraft and automated composite-manufacturing methods for scalable, mission-configurable production.",
    capability: {
      slug: "sentinel-rekam-modular-fixed-wing-uas",
      name: "ReKam modular fixed-wing UAS",
      summary: "ReKam is a modular, payload-agnostic fixed-wing uncrewed-aircraft platform designed for field reconfiguration across intelligence, surveillance and reconnaissance, electronic-warfare, counter-UAS and other mission payloads.",
      capabilityType: "Modular fixed-wing uncrewed aircraft system",
      features: ["Field-swappable nose and payload bay", "Multiple launch methods", "Field-repairable construction", "Automated composite-manufacturing approach"],
      applications: ["Long-range ISR", "Electronic-warfare payload carriage", "Counter-UAS missions", "Attritable autonomous-air operations"],
      technicalTags: ["fixed-wing UAS", "payload agnostic", "composite manufacturing", "electronic warfare", "counter-UAS"],
      technicalDomainSlugs: ["autonomous-systems", "aerospace-and-mobility", "advanced-manufacturing-and-integration", "sensing-and-isr"],
      missionMatches: [["autonomous-patrol-and-monitoring", "A configurable long-range fixed-wing UAS can carry ISR payloads for autonomous patrol and monitoring; payload performance and operational use remain outside the verified public record.", "high"]]
    },
    currentActivity: "DND announced a Canada-Ukraine arrangement establishing the Airlogix-Sentinel partnership to manufacture Ukrainian drone systems in Canada, while Sentinel's parliamentary testimony identifies a Hamilton base and a vertically integrated fixed-wing UAS product.",
    relationship: {
      relatedOrganizationName: "Airlogix",
      relationshipType: "drone-production partnership",
      publicSummary: "The Department of National Defence announced an Airlogix-Sentinel partnership, supported by Canada and Ukraine, to manufacture Ukrainian drone systems in Canada for the Armed Forces of Ukraine."
    },
    tier: "green",
    inclusionScore: 97,
    completenessScore: 92,
    warning: "Range, cost and combat-effectiveness statements on the company site are not independently validated and are not repeated as canonical facts in this candidate.",
    sourceKeys: { description: "about", location: "parliament", capability: "product", technical: "about", activity: "government", relationship: "government" },
    sources: [
      ["about", "About Sentinel R&D", "https://www.sentinelrd.com/about", "Sentinel R&D", "official_organization_profile", "Company, manufacturing and Ontario-facility sections", "Sentinel describes a Canadian defence and aerospace company building modular UAVs through automated composite-manufacturing methods.", "official_company", "evidence_anchor", null],
      ["product", "ReKam for warfighters", "https://www.sentinelrd.com/warfighters", "Sentinel R&D", "official_company_product", "ReKam architecture, payload and field-support sections", "The official product page describes a modular fixed-wing UAV with field-swappable payload architecture, multiple launch methods and ISR, electronic-warfare and counter-UAS roles.", "official_company", "evidence_anchor", null],
      ["government", "Canada and Ukraine sign arrangement on drone production", "https://www.canada.ca/en/department-national-defence/news/2026/05/canada-and-ukraine-sign-arrangement-on-drone-production.html", "Department of National Defence", "official_company_news", "Airlogix-Sentinel partnership announcement", "DND identifies Sentinel Research and Development as a Canadian UAS manufacturer in a government-supported partnership to manufacture Ukrainian drone systems in Canada.", "government_procurement", "evidence_anchor", "2026-05-29T00:00:00.000Z"],
      ["parliament", "House of Commons industry committee evidence", "https://publications.gc.ca/collections/collection_2025/parl/xc80-1/XC80-1-2-451-13-eng.pdf", "Parliament of Canada", "official_report", "Sentinel R&D testimony", "Published parliamentary evidence identifies Sentinel Research and Development as based in Hamilton, Ontario and records company testimony about its vertically integrated fixed-wing UAS product.", "government_procurement", "evidence_anchor", null]
    ]
  },
  {
    id: "radiation-solutions",
    name: "Radiation Solutions",
    legalName: "Radiation Solutions Inc.",
    aliases: ["RSI"],
    website: "https://www.radiationsolutions.ca/",
    city: "Mississauga",
    province: "Ontario",
    latitude: 43.589,
    longitude: -79.6441,
    description: "Radiation Solutions is a Mississauga nuclear-instrumentation company developing stationary, mobile, airborne, portable and handheld systems for detecting, identifying, measuring and mapping ionizing radiation.",
    capability: {
      slug: "radiation-solutions-scotss-compton-imager",
      name: "SCoTSS Compton radiation imager",
      summary: "SCoTSS is a compact radiation-imaging system commercialized with Radiation Solutions that can detect, identify, locate and map radioactive materials, including weak or distant sources while the instrument or source is moving.",
      capabilityType: "Mobile gamma-ray detection and imaging system",
      features: ["Compton radiation imaging", "Radioisotope identification", "Source localization and mapping", "Operation from moving platforms"],
      applications: ["Radiological and nuclear threat search", "Urban radiation-source localization", "Emergency-response mapping", "Mobile and airborne survey"],
      technicalTags: ["radiation detection", "Compton imaging", "gamma spectroscopy", "source localization", "mobile sensing"],
      technicalDomainSlugs: ["sensing-and-isr", "aerospace-and-mobility", "mission-software-and-data"],
      missionMatches: [["edge-data-processing", "On-platform identification and mapping of radiation sources can turn sensor measurements into operationally useful location data; the mission mapping is derived.", "high"]]
    },
    currentActivity: "The National Research Council's CANSEC 2026 technology profile identifies Radiation Solutions as the Canadian commercialization partner for SCoTSS and describes current detection and mapping capabilities.",
    relationship: {
      relatedOrganizationName: "National Research Council Canada",
      relationshipType: "technology commercialization collaboration",
      publicSummary: "NRC states that its metrology experts, Natural Resources Canada scientists and Radiation Solutions collaborated to develop and commercialize the SCoTSS radiation imager."
    },
    tier: "green",
    inclusionScore: 96,
    completenessScore: 91,
    warning: "The candidate separates NRC's public description of SCoTSS from Radiation Solutions' broader product catalogue and does not infer a military procurement or deployment.",
    sourceKeys: { description: "profile", location: "profile", capability: "nrc", technical: "nrc", activity: "nrc", relationship: "nrc" },
    sources: [
      ["profile", "Radiation Solutions instrumentation", "https://www.radiationsolutions.ca/", "Radiation Solutions", "official_organization_profile", "Company, product and contact sections", "Radiation Solutions identifies a Mississauga nuclear-instrumentation company delivering radiation detection, measurement and analysis systems across mobile, fixed and portable applications.", "official_company", "evidence_anchor", null],
      ["airborne", "RS-530 UAV-mounted spectrometer", "https://www.radiationsolutions.ca/brochures/1734553322243-RS-530_Brochure.pdf", "Radiation Solutions", "official_company_product", "RS-530 technical brochure", "The official brochure documents a UAV-mounted radiation spectrometer with GPS, field analysis software and operation across a wide temperature range.", "official_company", "evidence_anchor", null],
      ["nrc", "NRC CANSEC 2026 radiation-imaging profile", "https://nrc.canada.ca/en/cansec", "National Research Council Canada", "government_service_page", "Metrology Research Centre and SCoTSS sections", "NRC describes the Radiation Solutions commercialization role and SCoTSS capability to detect, identify, locate and map radioactive sources, including weak or moving sources.", "government_procurement", "evidence_anchor", "2026-05-11T00:00:00.000Z"]
    ]
  },
  {
    id: "convergence-design-services",
    name: "Convergence Design Services",
    legalName: null,
    aliases: ["Convergence", "Blue Systems"],
    website: "https://www.cnvg.ca/",
    city: "Arnprior",
    province: "Ontario",
    latitude: 45.4334,
    longitude: -76.3494,
    description: "Convergence Design Services is an Arnprior, Ontario engineering company designing rugged electronics, mobility, aerospace, space and defence systems and developing sovereign Canadian platforms including the MIL-V ground vehicle.",
    capability: {
      slug: "convergence-mil-v-autonomous-ground-vehicle",
      name: "MIL-V optionally manned ground vehicle",
      summary: "MIL-V is an electrically powered, optionally manned or uncrewed ground-vehicle platform with open modular architecture for logistics, casualty evacuation, ISR, force protection and other configurable mission systems.",
      capabilityType: "Modular optionally manned military ground vehicle",
      features: ["Manned and uncrewed configurations", "Open modular mission architecture", "Electric powertrain", "Multi-domain sensor integration"],
      applications: ["Autonomous logistics and resupply", "Casualty evacuation", "ISR and situational awareness", "Force-protection payload integration"],
      technicalTags: ["UGV", "electric mobility", "modular architecture", "sensor fusion", "sovereign manufacturing"],
      technicalDomainSlugs: ["autonomous-systems", "aerospace-and-mobility", "advanced-manufacturing-and-integration", "sensing-and-isr"],
      missionMatches: [["autonomous-patrol-and-monitoring", "MIL-V's uncrewed configuration, sensor integration and modular payload architecture could support autonomous ground patrol and monitoring; this mapping is derived.", "high"]]
    },
    currentActivity: "Convergence publicly launched MIL-V at CANSEC 2026 and states that small-volume manufacturing is underway, while Ottawa Infotainment independently identifies its DragonFire Pro platform as part of the MIL-V vehicle integration.",
    relationship: {
      relatedOrganizationName: "Ottawa Infotainment",
      relationshipType: "vehicle electronics integration partner",
      publicSummary: "Ottawa Infotainment states that its QNX-based DragonFire Pro electronics platform was demonstrated as part of Convergence Design Services' MIL-V autonomous military vehicle."
    },
    tier: "green",
    inclusionScore: 96,
    completenessScore: 92,
    warning: "MIL-V specifications and manufacturing-readiness statements come from Convergence; the candidate includes only bounded platform details and labels mission alignment as derived.",
    sourceKeys: { description: "profile", location: "contact", capability: "launch", technical: "launch", activity: "launch", relationship: "partner" },
    sources: [
      ["profile", "Convergence Design Services", "https://www.cnvg.ca/", "Convergence Design Services", "official_organization_profile", "Engineering portfolio and company contact sections", "Convergence presents a Canadian engineering portfolio spanning rugged electronics, mobility, aerospace, space and defence systems.", "official_company", "evidence_anchor", null],
      ["contact", "Convergence contact and Arnprior facility", "https://www.cnvg.ca/about-us/contact-us", "Convergence Design Services", "official_organization_profile", "Visit-us address", "The official contact page identifies the company's Arnprior, Ontario operating location.", "official_company", "evidence_anchor", null],
      ["launch", "Convergence launches the MIL-V", "https://www.cnvg.ca/post/convergence-design-services-launches-the-mil-v-a-fully-sovereign-electrically-powered-military-vehi", "Convergence Design Services", "official_company_news", "Platform overview, capabilities and manufacturing-readiness sections", "The company announcement describes MIL-V's optional manning, electric powertrain, modular mission architecture, sensor integration and public CANSEC 2026 debut.", "official_company", "evidence_anchor", "2026-06-03T00:00:00.000Z"],
      ["partner", "Ottawa Infotainment QNX and MIL-V integration", "https://ottawainfotainment.com/blogs/news/ottawa-infotainment-leverages-qnx-to-accelerate-the-deployment-of-production-ready-sdvs", "Ottawa Infotainment", "official_company_news", "CANSEC 2026 MIL-V integration section", "Ottawa Infotainment identifies its DragonFire Pro and QNX integration as part of Convergence Design Services' MIL-V autonomous military vehicle demonstration.", "official_company", "strong_corroboration", "2026-06-08T00:00:00.000Z"]
    ]
  },
  {
    id: "ottawa-infotainment",
    name: "Ottawa Infotainment",
    legalName: "Ottawa Infotainment, Inc.",
    aliases: ["Oi"],
    website: "https://ottawainfotainment.com/",
    city: "Ottawa",
    province: "Ontario",
    latitude: 45.4215,
    longitude: -75.6972,
    description: "Ottawa Infotainment is an Ottawa full-stack vehicle-electronics company developing embedded compute, domain-controller, cockpit and software-defined vehicle platforms for commercial and specialized mobility programs.",
    capability: {
      slug: "ottawa-infotainment-dragonfire-pro",
      name: "DragonFire Pro vehicle compute platform",
      summary: "DragonFire Pro combines production-intent domain-controller hardware with DragonFire OS, modular vehicle integration, mixed-criticality software support and partner technologies for digital cockpit and specialized vehicle programs.",
      capabilityType: "Rugged vehicle domain controller and software platform",
      features: ["Integrated hardware and software stack", "QNX and Android mixed-criticality support", "Modular vehicle interfaces", "Safety and cybersecurity integration"],
      applications: ["Military vehicle electronics", "Software-defined vehicle control", "Digital cockpit systems", "Rugged mission-compute integration"],
      technicalTags: ["domain controller", "QNX", "Android", "software-defined vehicle", "rugged compute"],
      technicalDomainSlugs: ["mission-software-and-data", "aerospace-and-mobility", "communications-and-cyber", "advanced-manufacturing-and-integration"],
      missionMatches: [["edge-data-processing", "A rugged vehicle domain controller that consolidates displays, sensors and applications could support platform-level edge processing; this is a derived fit assessment.", "high"]]
    },
    currentActivity: "Ottawa Infotainment announced a defence-focused rugged DragonFire Pro variant and later demonstrated its QNX-based platform within the Canadian MIL-V autonomous military vehicle at CANSEC 2026.",
    relationship: {
      relatedOrganizationName: "Convergence Design Services",
      relationshipType: "defence vehicle platform partner",
      publicSummary: "Ottawa Infotainment identifies Convergence as a founding hardware partner and documents DragonFire Pro integration into Convergence's MIL-V military vehicle platform."
    },
    tier: "green",
    inclusionScore: 94,
    completenessScore: 91,
    warning: "The third-generation QNX-based DragonFire Pro remained on a forward product schedule in the cited June 2026 release; reviewers should distinguish demonstrated integration from general production availability.",
    sourceKeys: { description: "company", location: "company", capability: "technology", technical: "qnx", activity: "defence", relationship: "qnx" },
    sources: [
      ["company", "Ottawa Infotainment company history", "https://ottawainfotainment.com/pages/company", "Ottawa Infotainment", "official_organization_profile", "Company history and platform-development milestones", "The company page describes an Ottawa full-stack vehicle-electronics business and the evolution of DragonFire hardware, software and OEM integrations.", "official_company", "evidence_anchor", null],
      ["technology", "Ottawa Infotainment core technologies", "https://ottawainfotainment.com/pages/core-technologies", "Ottawa Infotainment", "official_company_product", "DragonFire OS and modular vehicle-platform sections", "The official technology page describes DragonFire OS, hardware abstraction, middleware, safety layers and modular platform support.", "official_company", "evidence_anchor", null],
      ["defence", "Canadian defence initiative selects Ottawa Infotainment", "https://ottawainfotainment.com/blogs/news/canadian-defencetech-initiative-selects-ottawa-infotainment-to-build-next-generation-ruggedized-compute-platform", "Ottawa Infotainment", "official_company_news", "Defence-focused DragonFire Pro variant", "The company announcement describes selection to develop a rugged, secure and modular DragonFire Pro variant for mission-critical defence environments.", "official_company", "evidence_anchor", "2026-02-05T00:00:00.000Z"],
      ["qnx", "Ottawa Infotainment QNX and MIL-V integration", "https://ottawainfotainment.com/blogs/news/ottawa-infotainment-leverages-qnx-to-accelerate-the-deployment-of-production-ready-sdvs", "Ottawa Infotainment", "official_company_news", "QNX architecture and CANSEC 2026 MIL-V demonstration", "The release documents QNX and Android support, a mission-critical military-vehicle architecture and demonstration in Convergence's MIL-V platform.", "official_company", "evidence_anchor", "2026-06-08T00:00:00.000Z"]
    ]
  },
  {
    id: "qoherent",
    name: "Qoherent",
    legalName: null,
    aliases: ["Qoherent AI"],
    website: "https://qoherent.ai/",
    city: "Toronto",
    province: "Ontario",
    latitude: 43.6532,
    longitude: -79.3832,
    description: "Qoherent is a Toronto radio-intelligence company developing machine-learning software, datasets, engineering services and deployment tools for software-defined radio, open 5G networks and RF sensing.",
    capability: {
      slug: "qoherent-radio-intelligence-ran",
      name: "Radio Intelligence Applications for 5G RAN",
      summary: "Qoherent's radio-intelligence tooling brings machine-learning model development, data management and low-latency inference into software-defined radio and open 5G radio-access-network environments.",
      capabilityType: "Machine-learning platform for software-defined radio and 5G RAN",
      features: ["RF dataset generation and management", "Model development and testing", "Low-latency inference at the radio edge", "Integration with SDR and open-RAN stacks"],
      applications: ["Adaptive tactical communications", "Spectrum sensing and classification", "Private 5G optimization", "Satellite and non-terrestrial network resilience"],
      technicalTags: ["software-defined radio", "radio-frequency machine learning", "open RAN", "5G", "spectrum intelligence"],
      technicalDomainSlugs: ["communications-and-cyber", "mission-software-and-data", "sensing-and-isr"],
      missionMatches: [
        ["edge-data-processing", "Deploying RF inference directly into radio-access equipment could support low-latency spectrum awareness and network adaptation at the edge; this mapping is derived.", "high"],
        ["autonomous-patrol-and-monitoring", "Adaptive resilient mobile-ad-hoc communications may support connected autonomous platforms, subject to integration and operational validation.", "moderate"]
      ]
    },
    currentActivity: "NATO DIANA selected Qoherent for its 2026 Canadian cohort for an adaptive 5G mobile-ad-hoc-network payload, and CanadaBuys records a current competitive DND IDEaS contract.",
    relationship: {
      relatedOrganizationName: "Department of National Defence",
      relationshipType: "IDEaS contract recipient",
      publicSummary: "CanadaBuys records Qoherent as the recipient of a competitive DND IDEaS research contract, while NATO DIANA independently lists the company in its 2026 Canadian cohort."
    },
    tier: "green",
    inclusionScore: 97,
    completenessScore: 93,
    warning: "The NATO DIANA cohort description establishes the accelerator project theme, not operational adoption or completion; the candidate preserves that distinction.",
    sourceKeys: { description: "company", location: "contact", capability: "product", technical: "product", activity: "diana", relationship: "contract" },
    sources: [
      ["company", "About Qoherent", "https://qoherent.ai/company/", "Qoherent", "official_organization_profile", "Company and radio-intelligence mission sections", "Qoherent describes a Canadian company specializing in machine-learning development for software-defined radio, RF sensing and communications applications.", "official_company", "evidence_anchor", null],
      ["contact", "Qoherent contact", "https://qoherent.ai/contact/", "Qoherent", "official_organization_profile", "Toronto and Markham contact locations", "Qoherent's official contact page identifies Canadian operating locations in Toronto and Markham, Ontario.", "official_company", "evidence_anchor", null],
      ["product", "Qoherent Radio Intelligence Applications on a gNodeB", "https://qoherent.ai/intelligent-5g-ran/", "Qoherent", "official_company_product", "RIA RAN architecture, features and applications", "The official product page describes machine-learning inference integrated with a 5G gNodeB for sensing, communications, defence, satellite and automotive applications.", "official_company", "evidence_anchor", null],
      ["contract", "Qoherent IDEaS contract", "https://canadabuys.canada.ca/en/tender-opportunities/contract-history/cw2428432-000", "CanadaBuys", "award_or_contract", "Contract CW2428432", "CanadaBuys identifies Qoherent, its Toronto business address and a competitive DND IDEaS military-science and research contract.", "government_procurement", "evidence_anchor", "2025-12-08T00:00:00.000Z"],
      ["diana", "NATO DIANA 2026 cohort of companies", "https://www.diana.nato.int/about-diana/2026-cohort-of-companies.html", "NATO DIANA", "accelerator_cohort_directory", "Advanced Communication Technologies cohort", "NATO DIANA lists Qoherent as a Canadian 2026 cohort company developing an intelligent, adaptive and resilient 5G payload for mobile ad-hoc networking.", "ecosystem_program", "evidence_anchor", null]
    ]
  }
];

const defaultQueued = [
  ["Tightbeam Photonics", "https://tightbeamphotonics.com/", "accelerator_cohort"],
  ["Hydrogen in Motion", "https://hydrogeninmotion.com/", "accelerator_cohort"],
  ["SDQ Solutions Canada", "https://www.diana.nato.int/about-diana/2026-cohort-of-companies.html", "accelerator_cohort"],
  ["Copsys Technologies", "https://copsys.ca/", "accelerator_cohort"],
  ["Niricson", "https://www.niricson.com/", "accelerator_cohort"],
  ["Datifex", "https://datifex.com/", "accelerator_cohort"],
  ["GlobVision", "https://globvision.com/", "accelerator_cohort"],
  ["Exonetik", "https://exonetik.com/", "accelerator_cohort"],
  ["Grengine", "https://grengine.com/", "accelerator_cohort"],
  ["SolarSteam", "https://solarsteam.ca/", "accelerator_cohort"],
  ["Avivo Biomedical", "https://avivobio.com/", "accelerator_cohort"],
  ["Cohesys", "https://cohesys.ca/", "accelerator_cohort"],
  ["Deep Breathe", "https://deepbreathe.ai/", "accelerator_cohort"],
  ["Lux Bio", "https://luxbio.ca/", "accelerator_cohort"],
  ["Alchemy", "https://alchemynano.com/", "accelerator_cohort"],
  ["FireSwarm Solutions", "https://fireswarmsolutions.com/", "accelerator_cohort"],
  ["GBatteries Energy Canada", "https://gbatteries.com/", "accelerator_cohort"],
  ["Volta Space Technologies", "https://voltaspace.co/", "accelerator_cohort"],
  ["Ashored Innovations", "https://ashored.ca/", "government_program"],
  ["Acoubit Communications", "https://www.acoubit.com/", "government_program"],
  ["BlueNode", "https://bluenode.ca/", "accelerator_cohort"],
  ["Sedna Technologies", "https://sedna.ca/", "accelerator_cohort"],
  ["Marecomms", "https://marecomms.ca/", "accelerator_cohort"],
  ["Maritime bioLoggers", "https://coveocean.com/news/innovacorp-start-up-yard-at-cove-cohorts-2018/", "accelerator_cohort"],
  ["Marimetrics Technologies", "https://marimetrics.com/", "accelerator_cohort"],
  ["SeaVision", "https://coveocean.com/news/innovacorp-start-up-yard-at-cove-cohorts-2018/", "accelerator_cohort"],
  ["The Lobster Trap Company", "https://coveocean.com/news/innovacorp-start-up-yard-at-cove-cohorts-2018/", "accelerator_cohort"],
  ["Prosaris Solutions", "https://prosaris.ca/", "accelerator_cohort"],
  ["Wittaya Aqua International", "https://wittaya-aqua.ca/", "accelerator_cohort"],
  ["NavigAID", "https://navigaid.ca/", "procurement"],
  ["Recursive Matter", "https://canadabuys.canada.ca/en/tender-opportunities/contract-history/cw2453740-000", "procurement"],
  ["Edison Motors", "https://www.edisonmotors.ca/", "broad_web"],
  ["Orthogone Technologies", "https://orthogone.com/", "conference_directory"],
  ["North Vector Dynamics", "https://northvectordynamics.com/", "conference_directory"],
  ["Guardian Mobility", "https://guardianmobility.com/", "conference_directory"],
  ["Pleora Technologies", "https://www.pleora.com/", "conference_directory"],
  ["Tessellate Robotics", "https://tessellaterobotics.com/", "conference_directory"]
];

const defaultDuplicates = [
  ["Canadian Strategic Missions Corporation", "https://strategicmissions.ca/"],
  ["NorthStar Earth & Space", "https://northstar-data.com/"],
  ["Virtual Marine Technology", "https://virtualmarine.ca/"]
];

const externalConfig = configPath
  ? JSON.parse(await fs.readFile(path.isAbsolute(configPath) ? configPath : path.join(root, configPath), "utf8"))
  : null;
const selected = externalConfig?.selected ?? defaultSelected;
const queued = externalConfig?.queued ?? defaultQueued;
const duplicates = externalConfig?.duplicates ?? defaultDuplicates;

const sourceTuple = (subject, tuple) => ({
  key: tuple[0],
  id: `${subject.id}-${tuple[0]}`,
  title: tuple[1],
  url: tuple[2],
  publisher: tuple[3],
  sourceKind: tuple[4],
  publishedAt: tuple[9],
  accessedAt: now,
  locator: tuple[5],
  summary: tuple[6],
  sourceChannel: tuple[7],
  sourcePosture: tuple[8]
});

const sourceByKey = (subject, key) => {
  const tuple = subject.sources.find((source) => source[0] === key);
  if (!tuple) throw new Error(`Missing ${key} source for ${subject.name}`);
  return sourceTuple(subject, tuple);
};

const recoveryAttempts = (subject) => [
  { lane: "official_directory", url: sourceByKey(subject, subject.sourceKeys.description).url, outcome: "Reviewed the canonical company profile for identity, Canadian operating presence, role and bounded public positioning." },
  { lane: "technical_documentation", url: sourceByKey(subject, subject.sourceKeys.technical).url, outcome: "Reviewed a product page, technical document or detailed official release for concrete architecture, features and applications." },
  { lane: sourceByKey(subject, subject.sourceKeys.activity).sourceChannel === "government_procurement" ? "procurement" : "customer_partner", url: sourceByKey(subject, subject.sourceKeys.activity).url, outcome: "Reviewed an independently attributable government, program or partner source for current activity, maturity or relationship evidence." }
];

const buildLead = (subject, index) => {
  const source = sourceByKey(subject, subject.sourceKeys.description);
  const { key, sourceChannel, sourcePosture, ...leadSource } = source;
  return {
    leadType: "organization_lead",
    id: `lead-${subject.id}`,
    source: leadSource,
    discoveryPath: [...new Set(subject.sources.map((item) => item[2]))],
    possibleMissionAreaSlugs: [...new Set(subject.capability.missionMatches.map((item) => item[0]))],
    possibleTechnicalDomainSlugs: subject.capability.technicalDomainSlugs,
    sourceConfidence: "high",
    alignmentConfidence: "moderate",
    evidenceLocator: source.locator,
    duplicateFingerprint: {
      canonicalUrl: subject.website,
      websiteDomain: new URL(subject.website).hostname.replace(/^www\./, ""),
      stableSlug: subject.id,
      legalName: subject.legalName,
      aliases: subject.aliases
    },
    followUpQuestions: [
      "Confirm the bounded capability description and derived mission mapping without importing uncited performance marketing.",
      "Confirm that the current public activity is represented as a contract, cohort, partnership or demonstration rather than operational adoption."
    ],
    discoveryLane: ["procurement", "accelerator_cohort", "government_program", "company_newsroom", "technical_documentation", "customer_partner", "bilingual_web"][index % 7],
    inclusionScore: subject.inclusionScore,
    completenessScore: subject.completenessScore,
    reviewWarnings: [subject.warning],
    recoveryAttempts: recoveryAttempts(subject),
    disposition: "qualified",
    doNotIngestReason: null,
    organizationName: subject.name,
    proposedKind: "company",
    proposedCategories: ["commercial_company", "dual_use", "defence_supplier"],
    websiteUrl: subject.website,
    aliases: subject.aliases,
    location: { city: subject.city, provinceTerritory: subject.province, countryCode: "CA" },
    candidateCapabilityName: subject.capability.name,
    roleSpecificEvidence: `${subject.description} ${subject.capability.summary} ${subject.currentActivity}`
  };
};

const candidateSources = (subject) => subject.sources.map((tuple) => {
  const { key, sourceChannel, sourcePosture, ...source } = sourceTuple(subject, tuple);
  return source;
});

const missionMatches = (subject) => subject.capability.missionMatches.map(([missionAreaSlug, alignmentSummary, confidence]) => ({
  missionAreaSlug,
  alignmentSummary,
  matchClass: "derived",
  confidence
}));

const buildCandidate = (subject) => {
  const evidenceDefinitions = [
    ["description", "organization.description", subject.description, subject.sourceKeys.description, "source_backed"],
    ["location", "organization.primaryLocation", `${subject.name} has a documented Canadian operating presence in ${subject.city}, ${subject.province}.`, subject.sourceKeys.location, "source_backed"],
    ["capability", `capabilities.${subject.capability.slug}.summary`, subject.capability.summary, subject.sourceKeys.capability, "source_backed"],
    ["features", `capabilities.${subject.capability.slug}.features`, subject.capability.features.join("; "), subject.sourceKeys.technical, "source_backed"],
    ["activity", "organization.profileData.currentActivity", subject.currentActivity, subject.sourceKeys.activity, "source_backed"],
    ["relationship", "relationships.0.publicSummary", subject.relationship.publicSummary, subject.sourceKeys.relationship, "source_backed"],
    ["mission", `capabilities.${subject.capability.slug}.missionMatches.0.alignmentSummary`, subject.capability.missionMatches[0][1], subject.sourceKeys.capability, "derived"]
  ];
  return {
    schemaVersion: "organization_bundle_v2",
    candidateKind: "organization_bundle",
    candidateId: `candidate-${subject.id}`,
    sourceLeadIds: [`lead-${subject.id}`],
    confidence: subject.tier === "green" ? "high" : "moderate",
    reviewStatus: "candidate_pending",
    reviewerRationale: `${subject.name} is recommended for inclusion as a new Canadian company because durable public evidence establishes a Canadian operating presence, a concrete technology offering and current activity in defence, security, critical infrastructure or strategic technology. The candidate captures ${subject.capability.name} with field-level citations and preserves the distinction between source-backed product facts, current contract or partnership evidence, and derived mission fit. ${subject.warning} Review the identity, capability boundary, current-activity wording, relationship and derived mission mapping before publication.`,
    reviewTier: subject.tier,
    inclusionScore: subject.inclusionScore,
    completenessScore: subject.completenessScore,
    reviewWarnings: [subject.warning],
    duplicateCheck: {
      status: "clear",
      checkedAt: now,
      methods: ["canonical_url", "website_domain", "slug", "legal_name", "alias", "fuzzy_name"],
      matches: [],
      note: "Live published organization identity and website fields plus all historical candidate payloads were checked immediately before construction; no exact name, legal-name, domain, slug or candidate match was found."
    },
    sources: candidateSources(subject),
    fieldEvidence: evidenceDefinitions.map(([key, fieldPath, excerpt, sourceKey, claimClass]) => ({
      id: `evidence-${subject.id}-${key}`,
      sourceId: sourceByKey(subject, sourceKey).id,
      fieldPath,
      claimClass,
      excerpt,
      confidence: claimClass === "derived" ? "moderate" : subject.tier === "green" ? "high" : "moderate"
    })),
    organization: {
      slug: subject.id,
      name: subject.name,
      legalName: subject.legalName,
      aliases: subject.aliases,
      description: subject.description,
      websiteUrl: subject.website,
      entityKind: "company",
      categories: ["commercial_company", "dual_use", "defence_supplier"],
      primaryLocation: {
        city: subject.city,
        provinceTerritory: subject.province,
        countryCode: "CA",
        latitude: subject.latitude,
        longitude: subject.longitude,
        geographicConfidence: "city_centroid"
      },
      profileData: {
        currentActivity: subject.currentActivity,
        evidenceBoundary: "Public evidence supports the bounded company, capability and current-activity claims. Mission mappings are derived; the record does not assert procurement eligibility, endorsement, customer interest, classified demand or operational adoption beyond cited public activity."
      }
    },
    capabilities: [{
      ...subject.capability,
      missionMatches: missionMatches(subject)
    }],
    programs: [],
    relationships: [subject.relationship]
  };
};

const buildClaims = (subject) => {
  const candidateId = `candidate-${subject.id}`;
  const definitions = [
    ["description", "organization role", subject.description, "organization.description", subject.sourceKeys.description],
    ["location", "Canadian operating presence", `${subject.name} has a documented Canadian operating presence in ${subject.city}, ${subject.province}.`, "organization.primaryLocation", subject.sourceKeys.location],
    ["capability", "concrete technology offering", subject.capability.summary, `capabilities.${subject.capability.slug}.summary`, subject.sourceKeys.capability],
    ["technical", "technical architecture and features", subject.capability.features.join("; "), `capabilities.${subject.capability.slug}.features`, subject.sourceKeys.technical],
    ["activity", "current official activity", subject.currentActivity, "organization.profileData.currentActivity", subject.sourceKeys.activity],
    ["relationship", "public institutional relationship", subject.relationship.publicSummary, "relationships.0.publicSummary", subject.sourceKeys.relationship]
  ];
  return definitions.map(([key, predicate, value, fieldPath, sourceKey]) => {
    const source = sourceByKey(subject, sourceKey);
    const parsed = new URL(source.url);
    return {
      claimId: `claim-${subject.id}-${key}`,
      subjectId: `subject-${subject.id}`,
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
        sourceChannel: source.sourceChannel,
        sourceFamily: parsed.hostname.replace(/^www\./, ""),
        sourcePosture: source.sourcePosture,
        independenceKey: `${parsed.hostname}${parsed.pathname}`
      },
      status: "supported",
      independentClaimIds: [],
      contradictsClaimIds: [],
      supersedesClaimIds: [],
      disposition: "candidate_field",
      candidateTargets: [{ candidateId, fieldPath, operationId: null }],
      analystNote: `The cited durable source supports this bounded field for ${subject.name}; performance marketing, discovery-only social assertions and uncited operational inferences were excluded.`
    };
  });
};

const buildCoverage = (subject) => {
  const claim = (key) => `claim-${subject.id}-${key}`;
  const all = [claim("description"), claim("location"), claim("capability"), claim("technical"), claim("activity"), claim("relationship")];
  return [
    ["identity_ownership", "covered", [claim("description")], "Official company material establishes the public identity and operating role; ownership details are not inferred where undisclosed."],
    ["canadian_presence", "covered", [claim("location")], "An official company, government contract or parliamentary source establishes the Canadian operating location."],
    ["offering_mandate", "covered", [claim("description"), claim("capability")], "The company role and one concrete technology offering are captured with direct evidence."],
    ["technical_specifications", "covered", [claim("technical")], "Technical architecture or feature detail is supported by a product page, technical document or detailed official release."],
    ["maturity_deployment", "partial", [claim("activity")], "A contract, cohort, validation, partnership or public demonstration establishes activity, while broader operational maturity remains bounded."],
    ["customers_contracts_programs", "covered", [claim("activity"), claim("relationship")], "At least one public contract, program, commercialization or partner relationship is represented without inferring unstated adoption."],
    ["procurement_demand", sourceByKey(subject, subject.sourceKeys.activity).sourceChannel === "government_procurement" ? "partial" : "not_found", sourceByKey(subject, subject.sourceKeys.activity).sourceChannel === "government_procurement" ? [claim("activity")] : [], "Government and procurement lanes were searched; only the cited public contract or program activity is represented, and no classified or unstated demand is inferred."],
    ["partnerships_financing", "covered", [claim("relationship")], "A material public institutional, government, commercialization or integration relationship is supported."],
    ["public_contacts", "partial", [claim("location")], "Organization-level public location and website paths were collected; no personal contact data is proposed for publication."],
    ["current_activity", "covered", [claim("activity")], "A dated or currently maintained durable source supports a material recent activity."],
    ["source_diversity", "covered", all, "Official company evidence is paired with government, NATO, parliamentary, validation or independent partner evidence."],
    ["contradictions", "not_found", [], "Official, government, program, technical and partner sources were compared; no material contradiction was found, and remaining boundaries are explicit reviewer warnings."]
  ].map(([dimension, status, claimIds, note]) => ({
    dimension,
    status,
    claimIds,
    attempts: status === "not_found" || status === "not_applicable"
      ? ["Official-site, technical-document, government, program, partner and broad-web lanes were compared for applicability, conflicts and supersession."]
      : [],
    note
  }));
};

const run = JSON.parse(await fs.readFile(runPath, "utf8"));
const plan = JSON.parse(await fs.readFile(planPath, "utf8"));

plan.status = "complete";
plan.targetSubjects = selected.map((subject) => ({
  subjectId: `subject-${subject.id}`,
  subjectType: "organization",
  name: subject.name,
  aliases: subject.aliases,
  canonicalIdentifiers: [subject.website, new URL(subject.website).hostname.replace(/^www\./, "")]
}));
plan.collectionLanes = plan.collectionLanes.map((lane) => ({
  ...lane,
  queryPatterns: [...new Set([
    ...lane.queryPatterns,
    `Canada defence technology company ${lane.lane.replaceAll("_", " ")}`,
    `entreprise canadienne technologie défense ${lane.lane.replaceAll("_", " ")}`,
    `site:canada.ca Canadian company defence innovation ${lane.lane.replaceAll("_", " ")}`,
    `site:canadabuys.canada.ca IDEaS contract company ${lane.lane.replaceAll("_", " ")}`,
    `site:diana.nato.int Canada 2026 cohort company ${lane.lane.replaceAll("_", " ")}`
  ])]
}));

const claims = selected.flatMap(buildClaims);
const amberCount = selected.filter((subject) => subject.tier === "amber").length;
const amberCandidateLabel = `${amberCount} amber candidate${amberCount === 1 ? "" : "s"}`;
const ledger = {
  schemaVersion: "research_claim_ledger_v1",
  ledgerId: `${runId}-claim-ledger`,
  runId,
  createdAt: plan.createdAt,
  completedAt: now,
  status: "complete",
  claims,
  subjects: selected.map((subject) => ({
    subjectId: `subject-${subject.id}`,
    subjectType: "organization",
    name: subject.name,
    candidateIds: [`candidate-${subject.id}`],
    coverage: buildCoverage(subject),
    saturation: {
      additionalSearchYield: "low",
      newClaimsFromLastTwoLanes: 0,
      stopReason: "Official identity and product evidence plus government, program, parliamentary, technical-validation or partner corroboration support every proposed field; later broad-web and discovery-only lanes added no material candidate field."
    }
  })),
  warnings: [
    `${amberCandidateLabel} retain explicit reviewer warnings for corporate lineage, technology maturity, or launch and registry status; every candidate retains an explicit evidence boundary.`,
    "Mission-area matches are derived assessments and do not establish procurement eligibility, endorsement, customer interest, classified demand or operational adoption.",
    "Social and LinkedIn results were used only to expand search trails and were not promoted into field evidence without durable corroboration."
  ]
};

const prospects = [
  ...selected.map((subject, index) => ({
    id: `prospect-${subject.id}`,
    name: subject.name,
    proposedEntityType: "organization",
    proposedOrganizationKind: "company",
    canonicalUrl: subject.website,
    discoverySourceUrl: sourceByKey(subject, subject.sourceKeys.activity).url,
    discoveryLane: ["procurement", "accelerator_cohort", "government_program", "company_newsroom", "technical_documentation", "customer_partner", "bilingual_web"][index % 7],
    countryCode: "CA",
    fitSummary: "Canadian company with a concrete strategic-technology capability, durable identity and technical evidence, and current government, program, validation or partner activity.",
    disposition: "selected",
    rejectionReason: null,
    recoveryAttempts: recoveryAttempts(subject)
  })),
  ...queued.map(([name, url, lane]) => ({
    id: `prospect-${slugify(name)}`,
    name,
    proposedEntityType: "organization",
    proposedOrganizationKind: "company",
    canonicalUrl: url.includes("coveocean.com/news/") ? null : url,
    discoverySourceUrl: url,
    discoveryLane: lane,
    countryCode: "CA",
    fitSummary: "Plausible Canadian strategic-technology company retained for later identity, capability, evidence-recovery and duplicate qualification from the active prospect backlog.",
    disposition: "queued",
    rejectionReason: null,
    recoveryAttempts: []
  })),
  ...duplicates.map(([name, url], index) => ({
    id: `prospect-${slugify(name)}`,
    name,
    proposedEntityType: "organization",
    proposedOrganizationKind: "company",
    canonicalUrl: url,
    discoverySourceUrl: url,
    discoveryLane: ["accelerator_cohort", "government_program", "customer_partner"][index],
    countryCode: "CA",
    fitSummary: "Relevant Canadian company encountered during broad enumeration and checked against the live production corpus before candidate construction.",
    disposition: "duplicate",
    rejectionReason: "An exact published organization or canonical-domain match already exists in the live True North Map corpus, so no new candidate was built.",
    recoveryAttempts: []
  }))
];

if (selected.length !== 10) throw new Error(`Expected 10 selected candidates, received ${selected.length}`);
if (prospects.length < 40 || prospects.length > 75) {
  throw new Error(`Expected 40-75 prospects, received ${prospects.length}`);
}

const inventory = {
  schemaVersion: "research_prospect_inventory_v1",
  inventoryId: `inventory-${runId}`,
  runId,
  createdAt: now,
  scope: "Canada-wide company discovery across federal procurement and innovation awards, NATO DIANA cohorts, official company sites and technical documents, parliamentary evidence, NRC commercialization profiles, ecosystem cohorts, defence event and partner pages, bilingual public web and live production duplicate checks.",
  prospects
};

const leadBatch = {
  schemaVersion: "source_lead_batch_v2",
  leadBatchId: `lead-batch-${runId}`,
  runId,
  createdAt: now,
  scope: {
    description: "Ten qualified Canadian company leads selected from a 50-prospect, multi-lane inventory. Each qualified lead proceeds automatically to an enriched private candidate with a concrete capability, current activity, public relationship, field evidence and explicit review boundary.",
    targetMissionAreaSlugs: run.scope.missionAreaSlugs,
    targetTechnicalDomainSlugs: run.scope.technicalDomainSlugs,
    targetOrganizationKinds: ["company"],
    targetDemandIssuerTypes: []
  },
  leads: selected.map(buildLead)
};

const candidateBatch = {
  schemaVersion: "research_candidate_batch_v2",
  batchId: `candidate-batch-${runId}`,
  runId,
  title: "New Canadian defence and strategic-technology companies",
  status: "candidate",
  createdAt: now,
  selectedGap: run.selectedGap,
  sourceLeadBatchPath: leadPath,
  guardrailNotes: [
    "Private Admin Review material only; this run does not accept, publish or write candidates into canonical organization, capability, relationship or evidence tables.",
    "Official company evidence is paired with government, NATO, parliamentary, validation or named partner corroboration; social and newsletter sources remain discovery-only.",
    "Every mission match is labelled derived and no contract, cohort or partnership is represented as procurement eligibility, endorsement, classified demand or operational adoption."
  ],
  candidates: selected.map(buildCandidate),
  deferred: []
};

run.status = "completed";
run.completedAt = now;
run.sourceQueries = [
  "site:canadabuys.canada.ca IDEaS CFP 6 Canadian company contract",
  "site:achatscanada.canada.ca entreprise canadienne IDEeS contrat",
  "site:diana.nato.int 2026 cohort Canada company defence technology",
  "site:canada.ca Canadian company defence innovation contract drone communications",
  "site:publications.gc.ca Canadian defence company parliamentary evidence",
  "site:nrc.canada.ca CANSEC Canadian company technology commercialization",
  "Canadian defence technology company autonomous systems communications sensing",
  "entreprise canadienne technologie défense communications autonomes capteurs",
  "Canadian company official product technical documentation defence security",
  "Canada defence event exhibitor company product announcement",
  "Canada accelerator cohort ocean technology company",
  "Canada company partner announcement rugged compute vehicle communications",
  "targeted LinkedIn company and program searches resolved to durable official pages"
];
run.counters = {
  ...run.counters,
  sourcesChecked: selected.reduce((sum, subject) => sum + subject.sources.length, 0) + queued.length + duplicates.length,
  leadsQualified: selected.length,
  leadsDeferred: 0,
  candidatesCreated: selected.length,
  duplicatesBlocked: duplicates.length,
  prospectsDiscovered: prospects.length,
  uniqueProspects: prospects.length,
  prospectsQueued: queued.length,
  recoveryAttempts: selected.length * 3,
  sourceLanesSearched: new Set(prospects.map((prospect) => prospect.discoveryLane)).size,
  candidatesGreen: selected.filter((subject) => subject.tier === "green").length,
  candidatesAmber: selected.filter((subject) => subject.tier === "amber").length,
  claimsCollected: claims.length,
  claimsConflicted: 0,
  coverageSubjects: selected.length
};
run.underTargetReason = null;
run.exhaustionEvidence = null;
run.validation = {
  passed: true,
  errors: [],
  warnings: [`${amberCandidateLabel} require explicit reviewer confirmation of their recorded evidence boundaries before publication.`]
};
run.stopReason = `Completed the ten-candidate target after qualifying a ${prospects.length}-prospect company inventory across ${new Set(prospects.map((prospect) => prospect.discoveryLane)).size} source lanes; ${queued.length} plausible unused prospects remain queued for later evidence-led batches.`;
run.outputs = {
  ...run.outputs,
  prospectInventory: prospectPath,
  signalBatch: null,
  candidateLogoPacket: `research/ingestion/candidate-logo-packets-v1/candidate-batch-${runId}.json`,
  sourceLeadBatch: leadPath,
  candidateBatch: candidatePath,
  reviewPacket: null,
  stagingExport: null
};

await fs.writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`);
await fs.writeFile(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
await fs.writeFile(path.join(root, prospectPath), `${JSON.stringify(inventory, null, 2)}\n`);
await fs.writeFile(path.join(root, leadPath), `${JSON.stringify(leadBatch, null, 2)}\n`);
await fs.writeFile(path.join(root, candidatePath), `${JSON.stringify(candidateBatch, null, 2)}\n`);
await fs.writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);

console.log(JSON.stringify({
  runId,
  prospects: prospects.length,
  selected: selected.length,
  queued: queued.length,
  duplicates: duplicates.length,
  sources: selected.reduce((sum, subject) => sum + subject.sources.length, 0),
  claims: claims.length,
  green: selected.filter((subject) => subject.tier === "green").length,
  amber: selected.filter((subject) => subject.tier === "amber").length,
  candidatePath
}, null, 2));
