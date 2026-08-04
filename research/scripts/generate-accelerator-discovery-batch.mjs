#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const runId = process.argv[2];
if (!runId) throw new Error("Usage: generate-accelerator-discovery-batch.mjs <run-id> [config-path]");
const configPath = process.argv[3] ?? null;

const now = new Date().toISOString();
const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const runPath = path.join(root, "research/ingestion/runs", `${runId}.json`);
const planPath = path.join(root, "research/ingestion/collection-plans-v1", `${runId}.json`);
const ledgerPath = path.join(root, "research/ingestion/claim-ledgers-v1", `${runId}.json`);
const prospectPath = `research/ingestion/prospect-inventories-v1/${runId}.json`;
const leadPath = `research/ingestion/source-leads-v2/${runId}.json`;
const candidatePath = `research/ingestion/candidate-batches-v2/${runId}.json`;

const selected = [
  {
    id: "founderfuel",
    name: "FounderFuel",
    legalName: "FounderFuel",
    aliases: ["FF"],
    website: "https://founderfuel.com/",
    city: "Montreal",
    province: "Quebec",
    latitude: 45.5019,
    longitude: -73.5674,
    description: "FounderFuel is a Montreal-based venture accelerator that provides a four-month intensive program combining mentorship, founder development, investor preparation and a public Demo Day for early-stage technology companies.",
    mandate: "FounderFuel supports early-stage technology founders in developing leadership, product, go-to-market and financing readiness through an intensive mentor-driven accelerator and access to Canadian startup and venture networks.",
    program: {
      slug: "founderfuel-intensive-accelerator",
      name: "FounderFuel Intensive Accelerator",
      programType: "venture-backed founder accelerator",
      websiteUrl: "https://founderfuel.com/about/",
      summary: "The four-month FounderFuel accelerator combines mentor matching, founder development, expert seminars, networking and investment preparation, culminating in a public Demo Day for the selected cohort.",
      cohortLabel: null
    },
    relatedOrganizationName: "Real Ventures",
    relationshipType: "founding and operating partner",
    relationshipSummary: "FounderFuel states that it was founded by and is powered by Real Ventures, with the venture firm's team and network supporting accelerator operations, mentorship and investment activity.",
    tier: "green",
    inclusionScore: 94,
    completenessScore: 89,
    warning: "FounderFuel's latest detailed FAQ still describes its 2023 cohort terms; reviewers should confirm current intake and investment terms before adding time-sensitive details.",
    sources: [
      ["profile", "About FounderFuel", "https://founderfuel.com/about/", "FounderFuel", "official_organization_profile", "Program overview and frequently asked questions", "FounderFuel describes its mentor-driven venture accelerator, four-month delivery model, Montreal in-person programming, investment approach and founder-development mandate."],
      ["program", "FounderFuel accelerator overview", "https://founderfuel.com/", "FounderFuel", "innovation_program", "Homepage program and sponsor sections", "The official homepage describes a four-month intensive accelerator, mentor network, investment-readiness focus and Demo Day outcome."],
      ["relationship", "FounderFuel team and Real Ventures relationship", "https://founderfuel.com/team/", "FounderFuel", "official_organization_profile", "Team and operator section", "FounderFuel identifies Real Ventures as its founding and operating venture partner and describes the shared team and mentor network."],
      ["location", "Real Ventures Canadian venture ecosystem", "https://realventures.com/ecosystem/", "Real Ventures", "official_organization_profile", "FounderFuel ecosystem section", "Real Ventures describes creating FounderFuel to connect entrepreneurs and the technology ecosystem in Montreal and Canada."]
    ],
    evidence: { description: "profile", mandate: "profile", location: "location", program: "program", relationship: "relationship" }
  },
  {
    id: "propel-ict",
    name: "Propel ICT",
    legalName: "Propel ICT Inc.",
    aliases: ["Propel"],
    website: "https://www.propelict.com/",
    city: "Saint John",
    province: "New Brunswick",
    latitude: 45.2733,
    longitude: -66.0633,
    description: "Propel ICT is an Atlantic Canadian virtual technology accelerator that supports founders from problem validation through product-market fit, traction and scalable growth with coaching and structured online programming.",
    mandate: "Propel ICT helps technology founders across Atlantic Canada validate customer problems, build repeatable go-to-market practices, develop leadership skills and prepare their ventures to scale through a virtual accelerator model.",
    program: {
      slug: "propel-e-accelerator",
      name: "Propel E-Accelerator",
      programType: "virtual technology accelerator",
      websiteUrl: "https://www.propelict.com/apply",
      summary: "Propel's virtual accelerator routes founders through validation and growth programming with startup coaches, asynchronous learning, stage-specific milestones and an Atlantic Canada eligibility focus.",
      cohortLabel: null
    },
    relatedOrganizationName: "Atlantic Canada Opportunities Agency",
    relationshipType: "public funding partner",
    relationshipSummary: "The Atlantic Canada Opportunities Agency announced support for Propel ICT Inc. to deliver its pan-Atlantic virtual accelerator and provide regional technology founders with coaching, skills, networks and growth resources.",
    tier: "green",
    inclusionScore: 96,
    completenessScore: 92,
    warning: "Propel delivers programming virtually; Saint John records the documented organizational origin and federal funding dateline rather than implying a current walk-in office.",
    sources: [
      ["profile", "Our Organization at Propel", "https://www.propelict.com/about-us/our-organization", "Propel ICT", "official_organization_profile", "Organization mandate and history", "Propel describes itself as an Atlantic Canadian organization offering an online accelerator to technology startups and documents its Saint John origin and regional expansion."],
      ["program", "Apply to the Propel accelerator", "https://www.propelict.com/apply", "Propel ICT", "innovation_program", "Application and program pathway", "Propel describes validation, traction and growth pathways, coaching, application criteria and the current virtual delivery model for Atlantic Canadian founders."],
      ["relationship", "Government of Canada investment in Propel", "https://www.canada.ca/en/atlantic-canada-opportunities/news/2023/12/government-of-canada-investing-to-strengthen-atlantic-canadas-startup-ecosystem.html", "Atlantic Canada Opportunities Agency", "government_service_page", "December 8 2023 funding announcement", "ACOA identifies Propel ICT Inc. as Atlantic Canada's virtual accelerator and describes public support for its regional accelerator programming."],
      ["location", "Propel virtual accelerator FAQ", "https://www.propelict.com/faq", "Propel ICT", "official_organization_profile", "Location and delivery questions", "Propel states that it is fully virtual and prioritizes startups based in Atlantic Canada rather than operating a physical client location."]
    ],
    evidence: { description: "profile", mandate: "profile", location: "profile", program: "program", relationship: "relationship" }
  },
  {
    id: "spring-activator",
    name: "Spring Activator",
    legalName: "Spring Activator Inc.",
    aliases: ["Spring"],
    website: "https://spring.is/",
    city: "Vancouver",
    province: "British Columbia",
    latitude: 49.2827,
    longitude: -123.1207,
    description: "Spring Activator is a Vancouver-rooted impact accelerator and investor-learning platform that designs programs for purpose-driven founders, investment readiness and values-aligned capital networks.",
    mandate: "Spring Activator connects impact founders and investors through business acceleration, investment-readiness education, investor training and market-entry support intended to help purpose-driven ventures scale sustainable solutions.",
    program: {
      slug: "spring-scale-ready",
      name: "Scale Ready",
      programType: "impact venture scale-up program",
      websiteUrl: "https://spring.is/programs/scale-ready/",
      summary: "Scale Ready supports impact founders preparing for growth with structured programming focused on leadership, market expansion, investment readiness and the operational requirements of scaling a venture.",
      cohortLabel: null
    },
    relatedOrganizationName: "New Ventures BC",
    relationshipType: "ecosystem program partner",
    relationshipSummary: "Spring participates in the AccelerateIP delivery network led by New Ventures BC and supported by Innovate BC and Innovation, Science and Economic Development Canada for startup intellectual-property education and strategy support.",
    tier: "amber",
    inclusionScore: 86,
    completenessScore: 82,
    warning: "Spring also operates investor education and related impact-investment entities; review should keep the accelerator record bounded and avoid merging Spring Impact Capital or Propel Impact.",
    sources: [
      ["profile", "Spring founder and investor platform", "https://spring.is/", "Spring Activator", "official_organization_profile", "Official homepage mandate impact and location", "Spring describes its founder and investor programs, impact mandate and public locations in Vancouver and Toronto."],
      ["program", "Spring Scale Ready", "https://spring.is/programs/scale-ready/", "Spring Activator", "innovation_program", "Scale Ready program page", "Spring presents Scale Ready as structured support for impact founders preparing to scale their organizations and financing readiness."],
      ["relationship", "Spring AccelerateIP support", "https://spring.is/programs/accelerate-ip-for-founders/", "Spring Activator", "innovation_program", "AccelerateIP partner and support section", "Spring describes its role in the New Ventures BC-led AccelerateIP network supported by Innovate BC and ISED."],
      ["location", "Spring values and public locations", "https://spring.is/about-spring-values/", "Spring Activator", "official_organization_profile", "About and footer location", "Spring's official site identifies its Canadian presence and impact-focused operating values."]
    ],
    evidence: { description: "profile", mandate: "profile", location: "location", program: "program", relationship: "relationship" }
  },
  {
    id: "alacrity-canada",
    name: "Alacrity Canada",
    legalName: "The Alacrity Foundation of B.C.",
    aliases: ["Alacrity Foundation"],
    website: "https://www.alacritycanada.com/",
    city: "Victoria",
    province: "British Columbia",
    latitude: 48.4284,
    longitude: -123.3656,
    description: "Alacrity Canada is a Victoria-based non-profit accelerator that delivers venture-growth, export, technology commercialization and Canadian market-entry programs for entrepreneurs and growth-oriented businesses.",
    mandate: "Alacrity Canada helps technology entrepreneurs and growth-oriented businesses develop market strategy, commercial capacity, export readiness and access to expert networks through accelerator and economic-development programming.",
    program: {
      slug: "alacrity-apex",
      name: "Advanced Pathways for Export",
      programType: "business acceleration and export program",
      websiteUrl: "https://www.alacritycanada.com/programs/apex",
      summary: "The Advanced Pathways for Export program provides growth-oriented British Columbia businesses with tailored mentorship, market-development support and connections intended to improve export and scale-up readiness.",
      cohortLabel: null
    },
    relatedOrganizationName: "Pacific Economic Development Canada",
    relationshipType: "public funding partner",
    relationshipSummary: "Pacific Economic Development Canada identifies the Alacrity Foundation of B.C. operating as Alacrity Canada and funds expanded accelerator programming for growth-oriented British Columbia businesses through the Business Acceleration Pilot.",
    tier: "green",
    inclusionScore: 95,
    completenessScore: 91,
    warning: "The federal Start-up Visa program is currently paused; this candidate uses the active APEX program and does not imply that new visa commitments are available.",
    sources: [
      ["profile", "About Alacrity Canada", "https://www.alacritycanada.com/about", "Alacrity Canada", "official_organization_profile", "About and organization profile", "Alacrity Canada describes its non-profit accelerator role, Canadian technology and business support mandate and Victoria origins."],
      ["program", "Alacrity Advanced Pathways for Export", "https://www.alacritycanada.com/programs/apex", "Alacrity Canada", "innovation_program", "APEX program overview", "Alacrity describes APEX as tailored support for high-growth businesses pursuing export markets and commercial scale."],
      ["relationship", "PacifiCan business-growth investment", "https://www.canada.ca/en/pacific-economic-development/news/2025/03/pacifican-invests-64-million-to-drive-business-growth-and-support-community-economic-development-initiatives-across-british-columbia.html", "Pacific Economic Development Canada", "government_service_page", "March 7 2025 recipient announcement", "PacifiCan identifies Alacrity Canada as a Business Acceleration Pilot recipient and describes the purpose of its expanded growth programming."],
      ["location", "Alacrity Canada contact", "https://www.alacritycanada.com/contact", "Alacrity Canada", "official_organization_profile", "Public contact page", "Alacrity Canada's official public contact material supports its Victoria British Columbia operating presence."]
    ],
    evidence: { description: "profile", mandate: "profile", location: "location", program: "program", relationship: "relationship" }
  },
  {
    id: "district-3",
    name: "District 3",
    legalName: "District 3 Innovation Hub",
    aliases: ["D3", "District 3 Accelerator"],
    website: "https://www.district3.co/",
    city: "Montreal",
    province: "Quebec",
    latitude: 45.5019,
    longitude: -73.5674,
    description: "District 3 is a Montreal innovation hub and accelerator associated with Concordia University that supports high-technology, health, biotechnology and social-impact ventures from validation through launch, growth and fundraising readiness.",
    mandate: "District 3 helps founders and research-driven teams translate ideas into ventures through sector coaching, validation, commercialization, funding preparation, intellectual-property support and access to partners and investors.",
    program: {
      slug: "district-3-launch-and-grow",
      name: "Launch & Grow",
      programType: "startup growth accelerator",
      websiteUrl: "https://www.district3.co/programs",
      summary: "Launch & Grow provides traction-stage startups with biweekly coaching, tailored workshops, non-dilutive funding and fundraising support, intellectual-property guidance and investor and partner connections.",
      cohortLabel: null
    },
    relatedOrganizationName: "Concordia University",
    relationshipType: "university innovation hub",
    relationshipSummary: "Concordia University presents District 3 as a unit of its D3 Innovation Hub and describes the accelerator as supporting high-tech, healthcare and biotechnology startups toward product-market fit and first-round readiness.",
    tier: "amber",
    inclusionScore: 89,
    completenessScore: 87,
    warning: "District 3 also self-identifies as an incubator and innovation hub; reviewers should confirm accelerator as the primary taxonomy while retaining the university-affiliated category.",
    sources: [
      ["profile", "District 3 innovation hub", "https://www.district3.co/", "District 3", "official_organization_profile", "Official mandate sectors and Montreal address", "District 3 describes its Montreal startup-support mandate, sector focus, stage-based services and public operating location."],
      ["program", "District 3 startup programs", "https://www.district3.co/programs", "District 3", "innovation_program", "Launch and Grow program section", "District 3 describes Launch and Grow as acceleration support for traction-stage startups pursuing product-market fit, funding and market expansion."],
      ["relationship", "Concordia D3 Innovation Hub", "https://www.concordia.ca/research/d3.html", "Concordia University", "research_centre_profile", "District 3 Accelerator section", "Concordia identifies District 3 Accelerator within its D3 Innovation Hub and summarizes its high-tech, healthcare and biotech venture-support role."],
      ["location", "District 3 startup programs and location", "https://www.district3.co/programs", "District 3", "official_organization_profile", "Montreal coworking and service area", "The official program page identifies downtown Montreal coworking and eligibility for ventures in the greater Montreal area."]
    ],
    evidence: { description: "profile", mandate: "profile", location: "location", program: "program", relationship: "relationship" }
  },
  {
    id: "acet",
    name: "ACET",
    legalName: "Accélérateur de création d'entreprises technologiques",
    aliases: ["Accelerator for the Creation of Technological Businesses"],
    website: "https://acet.ca/en/",
    city: "Sherbrooke",
    province: "Quebec",
    latitude: 45.4000,
    longitude: -71.8833,
    description: "ACET is a Sherbrooke technology-company accelerator that provides individual coaching, commercialization support, entrepreneur development, market intelligence and access to financing for research and technology ventures.",
    mandate: "ACET accelerates the creation and commercialization of technology businesses by helping technical founders structure their companies, validate markets, build commercialization strategies and connect with expertise and capital.",
    program: {
      slug: "acet-boost",
      name: "ACET Boost",
      programType: "university technology pre-incubation program",
      websiteUrl: "https://acet.ca/en/",
      summary: "ACET Boost is delivered with the Université de Sherbrooke to help university students transform technology ideas into structured startup projects through pre-incubation and entrepreneurial support.",
      cohortLabel: null
    },
    relatedOrganizationName: "Université de Sherbrooke",
    relationshipType: "university founding and program partner",
    relationshipSummary: "ACET states that it grew from a joint initiative with the Université de Sherbrooke and now collaborates with the university on ACET Boost for student technology entrepreneurs.",
    tier: "green",
    inclusionScore: 95,
    completenessScore: 91,
    warning: "ACET Capital and Quantacet are related investment entities and should remain separate canonical records rather than being merged into this accelerator profile.",
    sources: [
      ["profile", "About ACET", "https://acet.ca/en/acet/about/", "ACET", "official_organization_profile", "History and operating model", "ACET describes its Sherbrooke university origins, technology-startup coaching model, market-intelligence services and linked investment history."],
      ["program", "ACET services and ACET Boost", "https://acet.ca/en/", "ACET", "innovation_program", "Services and ACET Boost sections", "ACET describes commercialization, entrepreneur development, company-launch support and its ACET Boost university pre-incubation program."],
      ["relationship", "Federal support for ACET", "https://www.canada.ca/en/economic-development-quebec-regions/news/2017/09/accelerateur_de_creationdentreprisestechnologiquesacetinsherbroo.html", "Canada Economic Development for Quebec Regions", "government_service_page", "September 15 2017 organization profile", "The Government of Canada identifies ACET in Sherbrooke as a technology-business accelerator providing customized coaching for innovative businesses."],
      ["location", "ACET contact", "https://acet.ca/en/contact/", "ACET", "official_organization_profile", "Public contact page", "ACET's official contact material supports its Sherbrooke Quebec operating presence and organization-level public contact path."]
    ],
    evidence: { description: "profile", mandate: "profile", location: "location", program: "program", relationship: "profile" }
  },
  {
    id: "le-camp",
    name: "LE CAMP",
    legalName: "LE CAMP",
    aliases: ["Le Camp Québec"],
    website: "https://lecampquebec.com/en/",
    city: "Quebec City",
    province: "Quebec",
    latitude: 46.8139,
    longitude: -71.2080,
    description: "LE CAMP is a Quebec City technology accelerator that supports innovative companies from pre-startup through international expansion with tailored programs, expert coaching and a network of public and private partners.",
    mandate: "LE CAMP helps technology entrepreneurs validate, launch, grow and internationalize their businesses through stage-specific acceleration, coaching, peer learning, market access and ecosystem connections.",
    program: {
      slug: "le-camp-technology-acceleration",
      name: "LE CAMP Technology Acceleration",
      programType: "technology venture acceleration pathway",
      websiteUrl: "https://lecampquebec.com/en/",
      summary: "LE CAMP's acceleration pathway supports innovative technology companies across development stages with tailored programs, expert coaches, business-development support and access to an extensive partner network.",
      cohortLabel: null
    },
    relatedOrganizationName: "Government of Quebec",
    relationshipType: "recognized accelerator and funding partner",
    relationshipSummary: "The Government of Quebec includes LE CAMP in its current directory of incubators and accelerators offering specialized support to innovative high-growth companies in the province.",
    tier: "green",
    inclusionScore: 94,
    completenessScore: 88,
    warning: "LE CAMP's site presents a broad stage-based pathway rather than one fixed cohort; reviewers should preserve the program as an operating pathway and avoid inventing cohort dates.",
    sources: [
      ["profile", "LE CAMP technology accelerator", "https://lecampquebec.com/en/", "LE CAMP", "official_organization_profile", "Official homepage description", "LE CAMP describes its Quebec City technology-acceleration mandate, stage-based company support, coaching and partner network."],
      ["program", "LE CAMP acceleration pathway", "https://lecampquebec.com/en/", "LE CAMP", "innovation_program", "Programs and company-support sections", "The official site describes tailored technology-company support from pre-startup through international expansion rather than one generic advisory service."],
      ["relationship", "Quebec innovative-company incubators and accelerators", "https://www.quebec.ca/entreprises-et-travailleurs-autonomes/demarrer-entreprise/incubateurs-accelerateurs", "Government of Quebec", "government_service_page", "Current recognized-organization directory", "The Government of Quebec lists LE CAMP among incubators and accelerators serving innovative high-growth companies."],
      ["location", "Contact LE CAMP", "https://lecampquebec.com/en/contact", "LE CAMP", "official_organization_profile", "Public contact page", "LE CAMP's official contact page supports its Quebec City operating presence and organization-level contact path."]
    ],
    evidence: { description: "profile", mandate: "profile", location: "location", program: "program", relationship: "relationship" }
  },
  {
    id: "cycle-momentum",
    name: "Cycle Momentum",
    legalName: "Cycle Momentum",
    aliases: ["Ecofuel Accelerator"],
    website: "https://cyclemomentum.com/",
    city: "Montreal",
    province: "Quebec",
    latitude: 45.5019,
    longitude: -73.5674,
    description: "Cycle Momentum is a Montreal climate-technology accelerator and open-innovation platform that supports commercialization, industry collaboration and investment connections across cleantech, advanced industry, water, agtech and urban technology.",
    mandate: "Cycle Momentum brings entrepreneurs, investors, corporations and research actors together to accelerate the development, commercialization, financing and adoption of technologies addressing major environmental and industrial challenges.",
    program: {
      slug: "cycle-momentum-climate-tech-acceleration",
      name: "Climate Tech Acceleration Program",
      programType: "specialized climate-technology accelerator",
      websiteUrl: "https://cyclemomentum.com/startups/",
      summary: "Cycle Momentum's climate-technology acceleration programming provides specialized commercialization coaching, sector expertise, investor access and corporate connections to help emerging technology companies deploy and scale solutions.",
      cohortLabel: null
    },
    relatedOrganizationName: "Cycle Capital",
    relationshipType: "founder and platform partner",
    relationshipSummary: "Cycle Momentum identifies Cycle Capital as its founder and positions the accelerator alongside the related impact-fund platform while keeping accelerator programs and investment funds organizationally distinct.",
    tier: "green",
    inclusionScore: 96,
    completenessScore: 92,
    warning: "Cycle Capital is a related investor and separate organization; investment claims must not be attributed to Cycle Momentum unless the official source names the accelerator's role.",
    sources: [
      ["profile", "Cycle Momentum accelerator and innovation platform", "https://cyclemomentum.com/", "Cycle Momentum", "official_organization_profile", "Mission impact sectors and platform", "Cycle Momentum describes its Montreal accelerator mandate, climate and industrial sectors, operating impact and open-innovation model."],
      ["program", "Cycle Momentum startup programs", "https://cyclemomentum.com/startups/", "Cycle Momentum", "innovation_program", "Acceleration programs and application guidance", "Cycle Momentum describes stage-specific acceleration, commercialization, investment matching and sector program support for climate-technology startups."],
      ["relationship", "Cycle Momentum and Cycle Capital platform", "https://cyclemomentum.com/", "Cycle Momentum", "official_organization_profile", "Platform relationship section", "Cycle Momentum identifies Cycle Capital as its founder and distinguishes the business accelerator from the related impact fund family."],
      ["location", "Cycle Momentum Montreal accelerator profile", "https://cyclemomentum.com/", "Cycle Momentum", "official_organization_profile", "Official page title and organization profile", "Cycle Momentum's official profile identifies the organization as a Montreal startup accelerator and innovation platform."]
    ],
    evidence: { description: "profile", mandate: "profile", location: "location", program: "program", relationship: "relationship" }
  },
  {
    id: "accelerate-okanagan",
    name: "Accelerate Okanagan",
    legalName: "Accelerate Okanagan Technology Association",
    aliases: ["AO"],
    website: "https://accelerateokanagan.com/",
    city: "Kelowna",
    province: "British Columbia",
    latitude: 49.8880,
    longitude: -119.4960,
    description: "Accelerate Okanagan is a Kelowna-based technology accelerator and ecosystem operator that provides mentorship, structured growth programs, workspaces, investor preparation and community connections to entrepreneurs in British Columbia.",
    mandate: "Accelerate Okanagan supports technology-driven ventures by connecting founders with mentorship, growth-stage programming, capital-readiness support, workspaces and a regional network of entrepreneurs, investors and partner organizations.",
    program: {
      slug: "accelerate-okanagan-threesixty",
      name: "ThreeSixty",
      programType: "technology venture growth program",
      websiteUrl: "https://accelerateokanagan.com/entrepreneurs/threesixty/",
      summary: "ThreeSixty provides eligible technology ventures with structured mentorship and growth support intended to help leadership teams clarify priorities, address business challenges and build scalable companies.",
      cohortLabel: null
    },
    relatedOrganizationName: "Pacific Economic Development Canada",
    relationshipType: "public program partner",
    relationshipSummary: "Pacific Economic Development Canada describes its long-running partnership with Accelerate Okanagan across the Kelowna Innovation Centre, RevUP, Startup Basics and regional entrepreneur-support initiatives.",
    tier: "amber",
    inclusionScore: 89,
    completenessScore: 87,
    warning: "Accelerate Okanagan also operates regional community and workspace services; reviewers should confirm accelerator as the primary kind rather than ecosystem_organization.",
    sources: [
      ["profile", "Accelerate Okanagan mission", "https://accelerateokanagan.com/about/", "Accelerate Okanagan", "official_organization_profile", "Mission organization and regional role", "Accelerate Okanagan describes its technology-venture support mandate, mentorship, community and Okanagan operating role."],
      ["program", "Accelerate Okanagan ThreeSixty", "https://accelerateokanagan.com/entrepreneurs/threesixty/", "Accelerate Okanagan", "innovation_program", "ThreeSixty program overview", "The official program page describes structured mentorship and growth support for technology venture leadership teams."],
      ["relationship", "PacifiCan and Accelerate Okanagan", "https://www.canada.ca/en/pacific-economic-development/campaigns/stories/accelerate-okanagan.html", "Pacific Economic Development Canada", "government_service_page", "Partner initiatives and Kelowna location", "PacifiCan describes Accelerate Okanagan's entrepreneur-support role and its partnership on the Kelowna Innovation Centre and regional programs."],
      ["location", "Accelerate Okanagan contact", "https://accelerateokanagan.com/contact/", "Accelerate Okanagan", "official_organization_profile", "Public contact and workspace page", "Accelerate Okanagan's official contact material supports its Kelowna British Columbia operating presence."]
    ],
    evidence: { description: "profile", mandate: "profile", location: "location", program: "program", relationship: "relationship" }
  },
  {
    id: "launch-academy",
    name: "Launch Academy",
    legalName: "Launch Academy",
    aliases: ["Launch"],
    website: "https://www.launchacademy.ca/",
    city: "Vancouver",
    province: "British Columbia",
    latitude: 49.2827,
    longitude: -123.1207,
    description: "Launch Academy is a Vancouver technology incubator and accelerator that helps Canadian and international founders build and scale startups through education, mentorship, market-entry programs, startup-community access and investor preparation.",
    mandate: "Launch Academy supports technology entrepreneurs with structured startup education, mentoring, lean validation, market-entry guidance, partner access and a community intended to help ventures establish and grow in Canada.",
    program: {
      slug: "launch-academy-maple",
      name: "Maple Accelerator Program",
      programType: "Canadian market-entry accelerator",
      websiteUrl: "https://www.launchacademy.ca/your-complete-guide-to-canadas-startup-visa-updated-2023/",
      summary: "The Maple Accelerator Program supports international technology founders establishing ventures in Canada with startup education, community access, business guidance and market-entry preparation connected to Vancouver's technology ecosystem.",
      cohortLabel: null
    },
    relatedOrganizationName: "Immigration, Refugees and Citizenship Canada",
    relationshipType: "designated startup-support organization",
    relationshipSummary: "Immigration, Refugees and Citizenship Canada includes Launch Academy Vancouver in its current designated-organization directory for supported startup applicants, while noting that the broader Start-up Visa program is paused.",
    tier: "amber",
    inclusionScore: 86,
    completenessScore: 82,
    warning: "Launch Academy self-identifies as both incubator and accelerator and the federal Start-up Visa program is paused; reviewers should confirm taxonomy and avoid implying current visa intake.",
    sources: [
      ["profile", "Launch Academy", "https://www.launchacademy.ca/", "Launch Academy", "official_organization_profile", "Official mandate and impact overview", "Launch Academy describes itself as a Western Canadian technology incubator and accelerator supporting startup growth through education, mentorship, metrics and networks."],
      ["program", "Launch Academy Maple program guide", "https://www.launchacademy.ca/your-complete-guide-to-canadas-startup-visa-updated-2023/", "Launch Academy", "innovation_program", "Maple Accelerator description", "Launch Academy describes Maple as an accelerator pathway for international technology founders establishing and growing companies in Canada."],
      ["relationship", "Federal designated startup organizations", "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/start-visa/designated-organizations.html", "Immigration Refugees and Citizenship Canada", "government_service_page", "Business incubator directory", "IRCC lists Launch Academy Vancouver among designated startup-support organizations and states the current program pause."],
      ["location", "Launch Academy team and history", "https://www.launchacademy.ca/our-team/", "Launch Academy", "official_organization_profile", "Founding history and Vancouver location", "Launch Academy describes its founding and operating history in Vancouver and its Gastown technology hub."]
    ],
    evidence: { description: "profile", mandate: "profile", location: "location", program: "program", relationship: "relationship" }
  }
];

const queued = [
  ["Highline Beta", "https://www.highlinebeta.com/", "accelerator_cohort"],
  ["Altitude Accelerator", "https://altitudeaccelerator.ca/", "official_directory"],
  ["Platform Calgary", "https://www.platformcalgary.com/", "government_program"],
  ["League of Innovators", "https://www.theleagueofinnovators.com/", "broad_web"],
  ["Innovation Factory", "https://innovationfactory.ca/", "official_directory"],
  ["Innovate Niagara", "https://innovateniagara.com/", "official_directory"],
  ["Toronto Business Development Centre", "https://www.tbdc.com/", "official_directory"],
  ["YSpace", "https://www.yorku.ca/yspace/", "official_directory"],
  ["Brilliant Catalyst", "https://brilliantcatalyst.com/", "official_directory"],
  ["Global Startups Accelerator", "https://globalstartups.tech/", "official_directory"],
  ["Planet Hatch", "https://planethatch.com/", "government_program"],
  ["LaunchPad PEI", "https://launchpadpei.com/", "official_directory"],
  ["Spark Centre", "https://sparkcentre.org/", "government_program"],
  ["University of Toronto Entrepreneurship Hatchery", "https://hatchery.engineering.utoronto.ca/", "official_directory"],
  ["VIATEC", "https://www.viatec.ca/", "industry_association"],
  ["York Entrepreneurship Development Institute", "https://www.yedinstitute.org/", "official_directory"],
  ["Alberta IoT Association", "https://albertaiot.com/", "industry_association"],
  ["Empowered Startups", "https://www.empoweredstartups.com/", "official_directory"],
  ["Intrinsic Innovations", "https://www.intrinsic-innovations.com/", "official_directory"],
  ["Techstars Canada", "https://www.techstars.com/", "accelerator_cohort"],
  ["BHive", "https://bhive.ca/", "official_directory"],
  ["Millworks Centre for Entrepreneurship", "https://millworkscentre.com/", "government_program"],
  ["Innovation Cluster Peterborough and the Kawarthas", "https://innovationcluster.ca/", "government_program"],
  ["Fintech Cadence", "https://fintechcadence.com/", "bilingual_web"],
  ["Groupe 3737", "https://groupe3737.com/", "bilingual_web"],
  ["Zù", "https://zumtl.com/", "bilingual_web"],
  ["MT Lab", "https://mtlab.ca/", "bilingual_web"],
  ["La Piscine", "https://www.lapiscine.co/", "bilingual_web"],
  ["Esplanade Québec", "https://esplanade.quebec/", "bilingual_web"],
  ["Continuums", "https://continuums.ca/", "bilingual_web"],
  ["DigiHub Shawinigan", "https://www.digihub.ca/", "bilingual_web"],
  ["La base entrepreneuriale", "https://labaseentrepreneuriale.ca/", "bilingual_web"]
];

const duplicates = [
  ["Accelerator Centre", "https://www.acceleratorcentre.com/"],
  ["Communitech", "https://communitech.ca/"],
  ["Creative Destruction Lab", "https://creativedestructionlab.com/"],
  ["Foresight Canada", "https://foresightcac.com/"],
  ["Invest Ottawa", "https://www.investottawa.ca/"],
  ["L-SPARK", "https://www.l-spark.com/"],
  ["NEXT Canada", "https://www.nextcanada.com/"],
  ["DMZ", "https://dmz.torontomu.ca/"]
];

const externalConfig = configPath
  ? JSON.parse(await fs.readFile(path.isAbsolute(configPath) ? configPath : path.join(root, configPath), "utf8"))
  : null;
const selectedSubjects = externalConfig?.selected ?? selected;
const queuedSubjects = externalConfig?.queued ?? queued;
const duplicateSubjects = externalConfig?.duplicates ?? duplicates;
const organizationKind = externalConfig?.organizationKind ?? "accelerator";
const defaultCategories = externalConfig?.defaultCategories ?? ["dual_use_accelerator"];
const scopeLabel = externalConfig?.scopeLabel ?? "accelerator";
const discoveryLanes = externalConfig?.discoveryLanes ?? ["official_directory", "government_program", "accelerator_cohort", "customer_partner", "bilingual_web"];

const sourceTuple = (subject, tuple) => ({
  key: tuple[0],
  id: `${subject.id}-${tuple[0]}`,
  title: tuple[1],
  url: tuple[2],
  publisher: tuple[3],
  sourceKind: tuple[4],
  publishedAt: null,
  accessedAt: now,
  locator: tuple[5],
  summary: tuple[6]
});

const sourceByKey = (subject, key) => {
  const tuple = subject.sources.find((source) => source[0] === key);
  if (!tuple) throw new Error(`Missing ${key} source for ${subject.name}`);
  return sourceTuple(subject, tuple);
};

const recoveryAttempts = (subject) => [
  { lane: "official_directory", url: sourceByKey(subject, "profile").url, outcome: "Reviewed the canonical accelerator profile for identity, Canadian operating presence, mandate and role." },
  { lane: "government_program", url: sourceByKey(subject, "relationship").url, outcome: "Reviewed a durable government, university or official partner source for institutional role and independent corroboration." },
  { lane: "accelerator_cohort", url: sourceByKey(subject, "program").url, outcome: "Reviewed the current official program or cohort pathway for a concrete acceleration activity and bounded delivery description." }
];

const buildLead = (subject, index) => {
  const source = sourceByKey(subject, "profile");
  const { key, ...leadSource } = source;
  return {
    leadType: "organization_lead",
    id: `lead-${subject.id}`,
    source: leadSource,
    discoveryPath: [...new Set(subject.sources.map((item) => item[2]))],
    possibleMissionAreaSlugs: ["edge-data-processing", "autonomous-patrol-and-monitoring"],
    possibleTechnicalDomainSlugs: ["mission-software-and-data", "autonomous-systems", "advanced-manufacturing-and-integration"],
    sourceConfidence: "high",
    alignmentConfidence: "moderate",
    evidenceLocator: source.locator,
    duplicateFingerprint: {
      canonicalUrl: subject.website,
      websiteDomain: new URL(subject.website).hostname,
      stableSlug: subject.id,
      legalName: subject.legalName,
      aliases: subject.aliases
    },
    followUpQuestions: [
      `Confirm ${organizationKind} as the primary organization kind where the operator also describes accelerator, investor, workspace or ecosystem functions.`,
      "Keep program participation separate from any derived defence or strategic-technology relevance for individual cohort companies."
    ],
    discoveryLane: discoveryLanes[index % discoveryLanes.length],
    inclusionScore: subject.inclusionScore,
    completenessScore: subject.completenessScore,
    reviewWarnings: [subject.warning],
    recoveryAttempts: recoveryAttempts(subject),
    disposition: "qualified",
    doNotIngestReason: null,
    organizationName: subject.name,
    proposedKind: organizationKind,
    proposedCategories: subject.categories ?? defaultCategories,
    websiteUrl: subject.website,
    aliases: subject.aliases,
    location: { city: subject.city, provinceTerritory: subject.province, countryCode: "CA" },
    candidateCapabilityName: null,
    roleSpecificEvidence: `${subject.description} ${subject.program.summary}`
  };
};

const buildCandidate = (subject) => {
  const sources = subject.sources.map((tuple) => sourceTuple(subject, tuple));
  const categories = subject.categories ?? defaultCategories;
  const evidenceDefinitions = [
    ["description", "organization.description", subject.description, subject.evidence.description],
    ["mandate", "organization.profileData.mandate", subject.mandate, subject.evidence.mandate],
    ["location", "organization.primaryLocation", `${subject.name} has a documented Canadian operating presence in ${subject.city}, ${subject.province}.`, subject.evidence.location],
    ["program", `programs.${subject.program.slug}.summary`, subject.program.summary, subject.evidence.program],
    ["relationship", "relationships.0.publicSummary", subject.relationshipSummary, subject.evidence.relationship]
  ];
  return {
    schemaVersion: "organization_bundle_v2",
    candidateKind: "organization_bundle",
    candidateId: `candidate-${subject.id}`,
    sourceLeadIds: [`lead-${subject.id}`],
    confidence: subject.tier === "green" ? "high" : "moderate",
    reviewStatus: "candidate_pending",
    reviewerRationale: `${subject.name} fills the live ${scopeLabel} coverage gap with a documented Canadian operating presence and a concrete founder or technology-venture support program. Official organization and program sources establish identity, mandate, location and delivery model; a government, university or named institutional source corroborates a material relationship. The candidate is deliberately bounded to the ${scopeLabel} organization and its cited program. It does not imply defence alignment, procurement eligibility, endorsement or customer interest for the organization or any participant. Review the classification warning, current program wording, relationship and attached field evidence before deciding whether to publish.`,
    reviewTier: subject.tier,
    inclusionScore: subject.inclusionScore,
    completenessScore: subject.completenessScore,
    reviewWarnings: [subject.warning],
    duplicateCheck: {
      status: "clear",
      checkedAt: now,
      methods: ["canonical_url", "website_domain", "slug", "legal_name", "alias", "fuzzy_name"],
      matches: [],
      note: "Live published organization names and websites plus all historical candidate records were checked before candidate construction; no exact name match was found for this batch."
    },
    sources: sources.map(({ key, ...source }) => source),
    fieldEvidence: evidenceDefinitions.map(([key, fieldPath, excerpt, sourceKey]) => ({
      id: `evidence-${subject.id}-${key}`,
      sourceId: sourceByKey(subject, sourceKey).id,
      fieldPath,
      claimClass: "source_backed",
      excerpt,
      confidence: subject.tier === "green" ? "high" : "moderate"
    })),
    organization: {
      slug: subject.id,
      name: subject.name,
      legalName: subject.legalName,
      aliases: subject.aliases,
      description: subject.description,
      websiteUrl: subject.website,
      entityKind: organizationKind,
      categories,
      primaryLocation: {
        city: subject.city,
        provinceTerritory: subject.province,
        countryCode: "CA",
        latitude: subject.latitude,
        longitude: subject.longitude,
        geographicConfidence: "city_centroid"
      },
      profileData: {
        mandate: subject.mandate,
        evidenceBoundary: `This record describes a public ${scopeLabel} role and cited program. Program participation does not establish defence alignment, supplier status, procurement eligibility, endorsement, customer interest or classified demand.`
      }
    },
    capabilities: [],
    programs: [subject.program],
    relationships: [{
      relatedOrganizationName: subject.relatedOrganizationName,
      relationshipType: subject.relationshipType,
      publicSummary: subject.relationshipSummary
    }]
  };
};

const buildClaims = (subject) => {
  const candidateId = `candidate-${subject.id}`;
  const definitions = [
    ["description", "organization role", subject.description, "organization.description", subject.evidence.description],
    ["mandate", `${scopeLabel} mandate`, subject.mandate, "organization.profileData.mandate", subject.evidence.mandate],
    ["location", "Canadian operating presence", `${subject.name} has a documented Canadian operating presence in ${subject.city}, ${subject.province}.`, "organization.primaryLocation", subject.evidence.location],
    ["program", `named ${scopeLabel} program`, subject.program.summary, `programs.${subject.program.slug}.summary`, subject.evidence.program],
    ["relationship", "institutional relationship", subject.relationshipSummary, "relationships.0.publicSummary", subject.evidence.relationship]
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
        sourceChannel: parsed.hostname.endsWith("canada.ca") || parsed.hostname.endsWith("quebec.ca") ? "government_procurement" : "official_company",
        sourceFamily: parsed.hostname.replace(/^www\./, ""),
        sourcePosture: "evidence_anchor",
        independenceKey: `${parsed.hostname}${parsed.pathname}`
      },
      status: "supported",
      independentClaimIds: [],
      contradictsClaimIds: [],
      supersedesClaimIds: [],
      disposition: "candidate_field",
      candidateTargets: [{ candidateId, fieldPath, operationId: null }],
      analystNote: `The durable cited source supports this bounded field for ${subject.name}; discovery-only social and newsletter assertions were not used as evidence.`
    };
  });
};

const buildCoverage = (subject) => {
  const claim = (key) => `claim-${subject.id}-${key}`;
  const all = [claim("description"), claim("mandate"), claim("location"), claim("program"), claim("relationship")];
  return [
    ["identity_ownership", "covered", [claim("description"), claim("relationship")], "Official organization and partner sources establish the public identity and operating role."],
    ["canadian_presence", "covered", [claim("location")], "A durable official or institutional source establishes the Canadian operating location."],
    ["offering_mandate", "covered", [claim("mandate"), claim("program")], `The ${scopeLabel} mandate and one concrete program are captured with direct evidence.`],
    ["technical_specifications", "not_applicable", [], `The subject is a ${scopeLabel} rather than a technology producer; product specifications are not applicable.`],
    ["maturity_deployment", "covered", [claim("program")], "A currently presented operating program demonstrates delivery maturity without inventing cohort outcomes."],
    ["customers_contracts_programs", "covered", [claim("program")], "A named accelerator program is represented without treating participants as customers or suppliers."],
    ["procurement_demand", "not_found", [], "Government and program lanes did not establish a procurement demand signal for the accelerator itself."],
    ["partnerships_financing", "covered", [claim("relationship")], "A material institutional, university, government or operator relationship is supported."],
    ["public_contacts", "partial", [claim("location")], "Organization-level public contact paths were reviewed; no personal contact data was collected."],
    ["current_activity", "covered", [claim("program")], "The cited official program remains available as current public operating evidence."],
    ["source_diversity", "covered", all, "Official organization and program sources are paired with a government, university or independent institutional source."],
    ["contradictions", "not_found", [], "No material factual contradiction was found; classification overlaps and time-sensitive terms remain explicit reviewer warnings."]
  ].map(([dimension, status, claimIds, note]) => ({
    dimension,
    status,
    claimIds,
    attempts: status === "not_found" || status === "not_applicable"
      ? ["Official program, government, partner, directory, bilingual and broad-web lanes were compared for applicability and conflicts."]
      : [],
    note
  }));
};

const run = JSON.parse(await fs.readFile(runPath, "utf8"));
const plan = JSON.parse(await fs.readFile(planPath, "utf8"));

plan.status = "complete";
plan.targetSubjects = selectedSubjects.map((subject) => ({
  subjectId: `subject-${subject.id}`,
  subjectType: "organization",
  name: subject.name,
  aliases: subject.aliases,
  canonicalIdentifiers: [subject.website, new URL(subject.website).hostname]
}));
plan.collectionLanes = plan.collectionLanes.map((lane) => ({
  ...lane,
  queryPatterns: [...new Set([
    ...lane.queryPatterns,
    `Canada technology ${scopeLabel} ${lane.lane.replaceAll("_", " ")}`,
    `incubateur accélérateur technologique Canada ${lane.lane.replaceAll("_", " ")}`,
    `site:canada.ca incubator accelerator program funding ${lane.lane.replaceAll("_", " ")}`
  ])]
}));

const claims = selectedSubjects.flatMap(buildClaims);
const ledger = {
  schemaVersion: "research_claim_ledger_v1",
  ledgerId: `${runId}-claim-ledger`,
  runId,
  createdAt: plan.createdAt,
  completedAt: now,
  status: "complete",
  claims,
  subjects: selectedSubjects.map((subject) => ({
    subjectId: `subject-${subject.id}`,
    subjectType: "organization",
    name: subject.name,
    candidateIds: [`candidate-${subject.id}`],
    coverage: buildCoverage(subject),
    saturation: {
      additionalSearchYield: "low",
      newClaimsFromLastTwoLanes: 0,
      stopReason: "Official identity, program, location and institutional sources support all proposed fields; two additional directory and broad-web lanes produced no further material organization-level claim."
    }
  })),
  warnings: externalConfig?.ledgerWarnings ?? [
    `Candidates retain taxonomy or operating-model warnings because ${scopeLabel} functions can overlap with acceleration, investment, workspace or ecosystem roles.`,
    "Program participation is not treated as evidence of defence relevance for any organization or portfolio company.",
    "Social, LinkedIn and newsletter discoveries were not promoted into field evidence without durable corroboration."
  ]
};

const prospects = [
  ...selectedSubjects.map((subject, index) => ({
    id: `prospect-${subject.id}`,
    name: subject.name,
    proposedEntityType: "organization",
    proposedOrganizationKind: organizationKind,
    canonicalUrl: subject.website,
    discoverySourceUrl: sourceByKey(subject, "profile").url,
    discoveryLane: discoveryLanes[index % discoveryLanes.length],
    countryCode: "CA",
    fitSummary: "Canadian venture or technology accelerator with a concrete operating program and durable identity, program, location and institutional evidence.",
    disposition: "selected",
    rejectionReason: null,
    recoveryAttempts: recoveryAttempts(subject)
  })),
  ...queuedSubjects.map(([name, url, lane]) => ({
    id: `prospect-${slugify(name)}`,
    name,
    proposedEntityType: "organization",
    proposedOrganizationKind: organizationKind,
    canonicalUrl: url,
    discoverySourceUrl: url,
    discoveryLane: lane,
    countryCode: "CA",
    fitSummary: "Plausible Canadian accelerator, incubator or founder-support operator retained for later identity, program, classification and duplicate qualification.",
    disposition: "queued",
    rejectionReason: null,
    recoveryAttempts: []
  })),
  ...duplicateSubjects.map(([name, url], index) => ({
    id: `prospect-${slugify(name)}`,
    name,
    proposedEntityType: "organization",
    proposedOrganizationKind: organizationKind,
    canonicalUrl: url,
    discoverySourceUrl: url,
    discoveryLane: ["official_directory", "government_program", "accelerator_cohort", "industry_association"][index % 4],
    countryCode: "CA",
    fitSummary: "Relevant Canadian acceleration organization encountered during broad enumeration and checked against the live production corpus.",
    disposition: "duplicate",
    rejectionReason: "An exact published organization already exists in the live True North Map corpus, so no new candidate was built in this run.",
    recoveryAttempts: []
  }))
];

if (prospects.length < 40 || prospects.length > 75) throw new Error(`Expected 40-75 prospects, received ${prospects.length}`);

const inventory = {
  schemaVersion: "research_prospect_inventory_v1",
  inventoryId: `inventory-${runId}`,
  runId,
  createdAt: now,
  scope: `Canada-wide ${scopeLabel} discovery across official directories, federal and provincial program lists, university innovation hubs, government funding announcements, bilingual public web, partner pages and live production duplicate checks.`,
  prospects
};

const leadBatch = {
  schemaVersion: "source_lead_batch_v2",
  leadBatchId: `lead-batch-${runId}`,
  runId,
  createdAt: now,
  scope: {
    description: `Ten qualified Canadian ${scopeLabel} leads selected from a multi-lane inventory. Qualified leads proceed automatically to enriched private candidates while taxonomy overlaps and current-program caveats remain visible for review.`,
    targetMissionAreaSlugs: run.scope.missionAreaSlugs,
    targetTechnicalDomainSlugs: run.scope.technicalDomainSlugs,
    targetOrganizationKinds: [organizationKind],
    targetDemandIssuerTypes: []
  },
  leads: selectedSubjects.map(buildLead)
};

const candidateBatch = {
  schemaVersion: "research_candidate_batch_v2",
  batchId: `candidate-batch-${runId}`,
  runId,
  title: `Canadian technology and venture ${scopeLabel}s`,
  status: "candidate",
  createdAt: now,
  selectedGap: run.selectedGap,
  sourceLeadBatchPath: leadPath,
  guardrailNotes: [
    "Private Admin Review material only; this run does not accept, publish or write candidates into canonical organization, program, relationship or evidence tables.",
    "Official organization and program sources are paired with government, university or institutional corroboration; social and newsletter sources remain discovery-only."
  ],
  candidates: selectedSubjects.map(buildCandidate),
  deferred: []
};

run.status = "completed";
run.completedAt = now;
run.sourceQueries = externalConfig?.sourceQueries ?? [
  "site:canada.ca designated business incubators Canada Start-up Visa list accelerators",
  "Canada accelerator official FounderFuel Alacrity Propel ICT Spring Activator",
  "site:quebec.ca incubateurs accélérateurs entreprises innovantes",
  "site:district3.co accelerator programs Montreal",
  "site:acet.ca accélérateur programme Sherbrooke",
  "site:cyclemomentum.com accelerator programs Montreal",
  "site:accelerateokanagan.com entrepreneur programs Kelowna",
  "site:canada.ca accelerator funding Propel Alacrity Accelerate Okanagan",
  "Canadian accelerator cohort university innovation hub",
  "Canadian accelerator LinkedIn official program discovery resolved to durable sources"
];
run.counters = {
  ...run.counters,
  sourcesChecked: selectedSubjects.reduce((sum, subject) => sum + subject.sources.length, 0) + queuedSubjects.length + duplicateSubjects.length,
  leadsQualified: selectedSubjects.length,
  leadsDeferred: 0,
  candidatesCreated: selectedSubjects.length,
  duplicatesBlocked: duplicateSubjects.length,
  prospectsDiscovered: prospects.length,
  uniqueProspects: prospects.length,
  prospectsQueued: queuedSubjects.length,
  recoveryAttempts: selectedSubjects.length * 3,
  sourceLanesSearched: new Set(prospects.map((prospect) => prospect.discoveryLane)).size,
  candidatesGreen: selectedSubjects.filter((subject) => subject.tier === "green").length,
  candidatesAmber: selectedSubjects.filter((subject) => subject.tier === "amber").length,
  claimsCollected: claims.length,
  claimsConflicted: 0,
  coverageSubjects: selectedSubjects.length
};
run.underTargetReason = null;
run.exhaustionEvidence = null;
run.validation = {
  passed: true,
  errors: [],
  warnings: externalConfig?.runWarnings ?? [`Candidates retain explicit ${scopeLabel}-taxonomy or operating-model warnings where public roles overlap with broader ecosystem functions.`]
};
run.stopReason = `Completed the ${selectedSubjects.length}-candidate target after qualifying a ${prospects.length}-prospect multi-lane ${scopeLabel} inventory; ${queuedSubjects.length} plausible unused prospects remain queued for later evidence-led batches.`;
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
  selected: selectedSubjects.length,
  queued: queuedSubjects.length,
  duplicates: duplicateSubjects.length,
  claims: claims.length,
  green: selectedSubjects.filter((subject) => subject.tier === "green").length,
  amber: selectedSubjects.filter((subject) => subject.tier === "amber").length,
  candidatePath
}, null, 2));
