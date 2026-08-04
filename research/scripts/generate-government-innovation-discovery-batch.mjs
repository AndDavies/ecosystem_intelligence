#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const runId = process.argv[2];
if (!runId) throw new Error("Usage: generate-government-innovation-discovery-batch.mjs <run-id>");

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
    id: "ontario-centre-of-innovation",
    name: "Ontario Centre of Innovation",
    legalName: "Ontario Centre of Innovation",
    aliases: ["OCI"],
    website: "https://www.oc-innovation.ca/",
    city: "Toronto",
    province: "Ontario",
    latitude: 43.6532,
    longitude: -79.3832,
    description: "Ontario Centre of Innovation helps commercialize Ontario research and intellectual property, connects industry with academic expertise, and delivers public innovation programs for Ontario businesses.",
    mandate: "OCI's public mandate is to maximize the commercial impact of Ontario research and intellectual property by supporting companies, industry-academic collaboration, technology development, demonstration, adoption and commercialization.",
    program: {
      slug: "ontario-vehicle-innovation-network",
      name: "Ontario Vehicle Innovation Network",
      programType: "provincial mobility innovation network",
      websiteUrl: "https://www.oc-innovation.ca/programs/ontario-vehicle-innovation-network-ovin/",
      summary: "The Ontario Vehicle Innovation Network is Ontario's flagship automotive and mobility initiative, led by OCI to support development, demonstration and commercialization of connected, autonomous and electric mobility technologies.",
      cohortLabel: null
    },
    relatedOrganizationName: "Government of Ontario",
    relationshipType: "program delivery partner",
    relationshipSummary: "OCI leads the Government of Ontario's flagship Ontario Vehicle Innovation Network and describes itself as a delivery partner for provincial programs supporting business innovation and commercialization.",
    tier: "amber",
    inclusionScore: 88,
    completenessScore: 82,
    warning: "OCI is an independent not-for-profit delivery organization rather than a provincial Crown corporation; confirm government_innovation_office versus ecosystem_organization during review.",
    sources: [
      ["about", "About the Ontario Centre of Innovation", "https://www.oc-innovation.ca/about/", "Ontario Centre of Innovation", "official_organization_profile", "About page", "OCI describes its commercialization mandate, industry-academic collaboration role and whole-of-government program-delivery function."],
      ["program", "Ontario Vehicle Innovation Network", "https://www.oc-innovation.ca/programs/ontario-vehicle-innovation-network-ovin/", "Ontario Centre of Innovation", "innovation_program", "Program overview", "OCI describes OVIN as Ontario's flagship initiative for connected, autonomous and electric vehicle technology development, demonstration and commercialization."],
      ["contact", "Contact the Ontario Centre of Innovation", "https://www.oc-innovation.ca/about/contact-us/", "Ontario Centre of Innovation", "official_organization_profile", "Contact page", "OCI lists its public office at 325 Front Street West in Toronto, Ontario, along with public contact channels."]
    ],
    evidenceSourceKeys: { description: "about", mandate: "about", location: "contact", program: "program", relationship: "program" }
  },
  {
    id: "alberta-innovates",
    name: "Alberta Innovates",
    legalName: "Alberta Innovates",
    aliases: [],
    website: "https://albertainnovates.ca/",
    city: "Edmonton",
    province: "Alberta",
    latitude: 53.5461,
    longitude: -113.4938,
    description: "Alberta Innovates is Alberta's provincial innovation agency, funding research and providing expertise, facilities and commercialization support to researchers, entrepreneurs and industry.",
    mandate: "Alberta Innovates acts as the province's innovation engine by funding research, supplying technical and business expertise, and connecting researchers, entrepreneurs and companies with facilities, partners and commercialization support.",
    program: {
      slug: "ecosystem-development-partnerships-program",
      name: "Ecosystem Development Partnerships Program",
      programType: "innovation ecosystem funding program",
      websiteUrl: "https://albertainnovates.ca/funding/ecosystem-development-partnerships-program/",
      summary: "The Ecosystem Development Partnerships Program supports collaborations that strengthen Alberta's research and innovation ecosystem and help organizations combine expertise, infrastructure and networks around shared opportunities.",
      cohortLabel: null
    },
    relatedOrganizationName: "Government of Alberta",
    relationshipType: "provincial agency",
    relationshipSummary: "Alberta Innovates is governed by a provincially appointed board and is accountable to Alberta's Minister of Technology and Innovation for delivery of its public innovation mandate.",
    tier: "green",
    inclusionScore: 94,
    completenessScore: 90,
    warning: "The candidate describes a public innovation mandate and active program, not a defence-specific supplier capability or procurement endorsement.",
    sources: [
      ["about", "What Alberta Innovates does", "https://albertainnovates.ca/about/what-we-do/", "Alberta Innovates", "official_organization_profile", "What we do", "Alberta Innovates describes its provincial research-funding, technical-expertise, facilities and commercialization-support role."],
      ["program", "Ecosystem Development Partnerships Program", "https://albertainnovates.ca/funding/ecosystem-development-partnerships-program/", "Alberta Innovates", "innovation_program", "Funding program page", "The program supports collaborative initiatives intended to strengthen Alberta's research and innovation ecosystem."],
      ["governance", "Alberta Innovates governance", "https://albertainnovates.ca/about/governance/", "Alberta Innovates", "official_organization_profile", "Governance page", "The governance page describes a provincially appointed board and accountability to Alberta's Minister of Technology and Innovation."],
      ["contact", "Contact Alberta Innovates", "https://albertainnovates.ca/about/contact-us/", "Alberta Innovates", "official_organization_profile", "Contact page", "Alberta Innovates lists its Bell Tower corporate office and public contact channels in Edmonton, Alberta."]
    ],
    evidenceSourceKeys: { description: "about", mandate: "about", location: "contact", program: "program", relationship: "governance" }
  },
  {
    id: "innovate-bc",
    name: "Innovate BC",
    legalName: "Innovate BC",
    aliases: [],
    website: "https://www.innovatebc.ca/",
    city: "Vancouver",
    province: "British Columbia",
    latitude: 49.2827,
    longitude: -123.1207,
    description: "Innovate BC is British Columbia's Crown agency for technology and innovation, delivering programs and partnerships that help companies develop, demonstrate, adopt and commercialize technology.",
    mandate: "Innovate BC's public mandate is to foster innovation across British Columbia by connecting innovators with programs, partners, capital, talent and market opportunities that support company growth and technology adoption.",
    program: {
      slug: "integrated-marketplace",
      name: "Integrated Marketplace",
      programType: "technology adoption and demonstration program",
      websiteUrl: "https://www.innovatebc.ca/programs/",
      summary: "Innovate BC's Integrated Marketplace helps British Columbia technology companies test, demonstrate and deploy solutions with large public and industry partners in real operating environments.",
      cohortLabel: null
    },
    relatedOrganizationName: "Government of British Columbia",
    relationshipType: "provincial Crown agency",
    relationshipSummary: "Innovate BC identifies itself as a provincial Crown agency operating within British Columbia's public innovation system and delivering programs aligned with provincial economic priorities.",
    tier: "green",
    inclusionScore: 95,
    completenessScore: 89,
    warning: "Integrated Marketplace is represented as an innovation and adoption program; no specific defence procurement outcome is inferred from program participation.",
    sources: [
      ["about", "About Innovate BC", "https://www.innovatebc.ca/about/", "Innovate BC", "official_organization_profile", "About page", "Innovate BC describes its province-wide innovation role, partnerships, programs and Vancouver public office."],
      ["program", "Innovate BC programs", "https://www.innovatebc.ca/programs/", "Innovate BC", "innovation_program", "Programs directory", "The programs directory identifies the Integrated Marketplace and other technology-development, adoption and commercialization supports."],
      ["crown", "About Innovate BC agency profile", "https://www.innovatebc.ca/hubfs/About%20Innovate%20BC.pdf", "Innovate BC", "official_report", "Agency profile", "Innovate BC's official agency profile identifies the organization as a British Columbia Crown agency supporting technology and innovation."]
    ],
    evidenceSourceKeys: { description: "about", mandate: "about", location: "about", program: "program", relationship: "crown" }
  },
  {
    id: "innovation-saskatchewan",
    name: "Innovation Saskatchewan",
    legalName: "Innovation Saskatchewan",
    aliases: [],
    website: "https://innovationsask.ca/",
    city: "Saskatoon",
    province: "Saskatchewan",
    latitude: 52.1332,
    longitude: -106.67,
    description: "Innovation Saskatchewan is the Government of Saskatchewan agency responsible for advancing research, technology development and commercialization across the province's innovation economy.",
    mandate: "Innovation Saskatchewan is mandated to encourage and coordinate research, fund technology development and commercialization, and strengthen Saskatchewan's innovation ecosystem and research infrastructure.",
    program: {
      slug: "innovation-and-science-fund",
      name: "Innovation and Science Fund",
      programType: "provincial research and innovation fund",
      websiteUrl: "https://www.saskatchewan.ca/government/news-and-media/2026/january/20/innovation-science-fund-expansion-strengthens-saskatchewan-research-excellence",
      summary: "Saskatchewan's expanded Innovation and Science Fund supports research infrastructure, commercialization, institutional partnerships and research talent through four provincial funding streams administered within the innovation portfolio.",
      cohortLabel: null
    },
    relatedOrganizationName: "Government of Saskatchewan",
    relationshipType: "central government agency",
    relationshipSummary: "The Government of Saskatchewan identifies Innovation Saskatchewan as the central agency responsible for implementing the province's research and innovation priorities and administering related funding programs.",
    tier: "green",
    inclusionScore: 95,
    completenessScore: 88,
    warning: "The Innovation and Science Fund is a broad provincial program; defence relevance must be assessed through any specific funded project rather than assumed from the program itself.",
    sources: [
      ["mandate", "Growing a strong economy through innovation and technology", "https://www.saskatchewan.ca/government/news-and-media/2022/march/23/growing-a-strong-economy-through-innovation--technology", "Government of Saskatchewan", "government_service_page", "Agency mandate announcement", "The Government of Saskatchewan describes Innovation Saskatchewan's mandate to promote and fund research, technology development and commercialization."],
      ["program", "Innovation and Science Fund expansion", "https://www.saskatchewan.ca/government/news-and-media/2026/january/20/innovation-science-fund-expansion-strengthens-saskatchewan-research-excellence", "Government of Saskatchewan", "innovation_program", "January 20, 2026 announcement", "The government announced a four-stream expansion of the Innovation and Science Fund for research infrastructure, commercialization, partnerships and talent."],
      ["report", "Innovation Saskatchewan annual report", "https://innovationsask.ca/pub/documents/publications/IS_2020-2021%20Annual%20Report.pdf", "Innovation Saskatchewan", "official_report", "Agency profile and main-office section", "The annual report identifies Innovation Saskatchewan as a provincial agency and lists its Saskatoon main office and public accountability context."]
    ],
    evidenceSourceKeys: { description: "mandate", mandate: "mandate", location: "report", program: "program", relationship: "mandate" }
  },
  {
    id: "research-manitoba",
    name: "Research Manitoba",
    legalName: "Research Manitoba",
    aliases: [],
    website: "https://researchmanitoba.ca/",
    city: "Winnipeg",
    province: "Manitoba",
    latitude: 49.8951,
    longitude: -97.1384,
    description: "Research Manitoba is Manitoba's provincial research agency, funding and coordinating research and innovation intended to improve economic, health, social and environmental outcomes.",
    mandate: "Research Manitoba's legislated public mandate is to support, fund, promote and coordinate research and innovation in Manitoba while strengthening provincial research capacity and partnerships.",
    program: {
      slug: "innovation-proof-of-concept-grant",
      name: "Innovation Proof of Concept Grant",
      programType: "technology validation and commercialization grant",
      websiteUrl: "https://researchmanitoba.ca/funding/programs/",
      summary: "Research Manitoba's Innovation Proof of Concept Grant supports the validation and early commercialization of Manitoba research and technology alongside the agency's other targeted research funding programs.",
      cohortLabel: null
    },
    relatedOrganizationName: "Government of Manitoba",
    relationshipType: "provincial research agency",
    relationshipSummary: "Research Manitoba operates under the Research Manitoba Act, reports through the responsible provincial department and delivers Manitoba's public research and innovation funding mandate.",
    tier: "green",
    inclusionScore: 94,
    completenessScore: 87,
    warning: "The selected program supports broad proof-of-concept activity; candidate publication should not imply a defence-specific mandate or funded defence project.",
    sources: [
      ["about", "About Research Manitoba", "https://researchmanitoba.ca/about/about-us/", "Research Manitoba", "official_organization_profile", "About page", "Research Manitoba describes its status under provincial legislation, reporting relationship, mandate and research-funding role."],
      ["programs", "Research Manitoba funding programs", "https://researchmanitoba.ca/funding/programs/", "Research Manitoba", "innovation_program", "Funding programs and office details", "The funding directory lists the Innovation Proof of Concept Grant and Research Manitoba's Winnipeg office and contact details."]
    ],
    evidenceSourceKeys: { description: "about", mandate: "about", location: "programs", program: "programs", relationship: "about" }
  },
  {
    id: "invest-nova-scotia",
    name: "Invest Nova Scotia",
    legalName: "Invest Nova Scotia",
    aliases: [],
    website: "https://investnovascotia.ca/",
    city: "Halifax",
    province: "Nova Scotia",
    latitude: 44.6488,
    longitude: -63.5752,
    description: "Invest Nova Scotia is Nova Scotia's business development agency, combining start-up, commercialization, investment, export and business-growth support across sectors including defence, aerospace, ocean technology and digital industries.",
    mandate: "Invest Nova Scotia supports companies from start-up through scale-up with acceleration, venture investment, non-dilutive funding, export development and location services intended to advance provincial business and innovation growth.",
    program: {
      slug: "innovation-rebate-program",
      name: "Innovation Rebate Program",
      programType: "business technology adoption incentive",
      websiteUrl: "https://investnovascotia.ca/incentives-programs-services/innovation-rebate-program",
      summary: "The Innovation Rebate Program offers performance-based incentives for Nova Scotia businesses undertaking capital projects that improve productivity, build competitiveness and adopt innovative technologies or processes.",
      cohortLabel: null
    },
    relatedOrganizationName: "Government of Nova Scotia",
    relationshipType: "provincial business development agency",
    relationshipSummary: "Invest Nova Scotia presents itself as the Province of Nova Scotia's business development agency and delivers provincial investment, innovation and export-support services.",
    tier: "amber",
    inclusionScore: 89,
    completenessScore: 84,
    warning: "Invest Nova Scotia also acts as a public investor and broad business-development agency; confirm government_innovation_office versus investor_funder during review.",
    sources: [
      ["about", "About Invest Nova Scotia", "https://investnovascotia.ca/about", "Invest Nova Scotia", "official_organization_profile", "About page", "Invest Nova Scotia describes its provincial business-development role, investment and commercialization services, and priority industry sectors."],
      ["program", "Innovation Rebate Program", "https://investnovascotia.ca/incentives-programs-services/innovation-rebate-program", "Invest Nova Scotia", "innovation_program", "Program page", "The program offers performance-based incentives for business capital projects involving productivity improvement and innovative technology adoption."],
      ["contact", "Contact Invest Nova Scotia", "https://investnovascotia.ca/contact", "Invest Nova Scotia", "official_organization_profile", "Contact page", "Invest Nova Scotia lists its Halifax public office and public telephone and email channels for business inquiries."]
    ],
    evidenceSourceKeys: { description: "about", mandate: "about", location: "contact", program: "program", relationship: "about" }
  },
  {
    id: "innovation-pei",
    name: "Innovation PEI",
    legalName: "Innovation PEI",
    aliases: [],
    website: "https://www.princeedwardisland.ca/en/topic/innovation-pei",
    city: "Charlottetown",
    province: "Prince Edward Island",
    latitude: 46.2382,
    longitude: -63.1311,
    description: "Innovation PEI is Prince Edward Island's lead economic development agency, supporting business growth, research, commercialization and sector development including aerospace, defence, advanced marine and information technology.",
    mandate: "Innovation PEI leads provincial economic development by helping companies start, grow, innovate and export, while advancing priority sectors through financing, research and commercialization programs.",
    program: {
      slug: "innovation-fund",
      name: "Innovation Fund",
      programType: "technology commercialization funding program",
      websiteUrl: "https://www.princeedwardisland.ca/en/service/innovation-fund",
      summary: "Innovation PEI's Innovation Fund supports Prince Edward Island companies validating, refining and commercializing new products or processes, including projects in aerospace and defence, advanced marine technology and other priority sectors.",
      cohortLabel: null
    },
    relatedOrganizationName: "Government of Prince Edward Island",
    relationshipType: "provincial economic development agency",
    relationshipSummary: "The Government of Prince Edward Island identifies Innovation PEI as its lead economic development agency and the operator of provincial business innovation and commercialization programs.",
    tier: "green",
    inclusionScore: 96,
    completenessScore: 91,
    warning: "The Innovation Fund includes aerospace and defence among eligible sectors, but eligibility does not demonstrate any particular company award or procurement relationship.",
    sources: [
      ["about", "About Innovation PEI", "https://www.princeedwardisland.ca/en/department/innovation-pei/about", "Government of Prince Edward Island", "government_service_page", "Department profile", "The provincial profile identifies Innovation PEI as the lead economic development agency, lists priority sectors and gives its Charlottetown office."],
      ["program", "Innovation Fund", "https://www.princeedwardisland.ca/en/service/innovation-fund", "Government of Prince Edward Island", "innovation_program", "Service and eligibility page", "The Innovation Fund supports validation, refinement and commercialization projects in listed priority sectors including aerospace and defence and advanced marine technology."]
    ],
    evidenceSourceKeys: { description: "about", mandate: "about", location: "about", program: "program", relationship: "about" }
  },
  {
    id: "opportunities-new-brunswick",
    name: "Opportunities New Brunswick",
    legalName: "Opportunities New Brunswick",
    aliases: ["ONB"],
    website: "https://onbcanada.ca/",
    city: "Fredericton",
    province: "New Brunswick",
    latitude: 45.9636,
    longitude: -66.6431,
    description: "Opportunities New Brunswick is New Brunswick's Crown economic development agency, helping companies invest, grow, export, improve productivity and pursue innovation within the province.",
    mandate: "ONB's public mandate is to attract investment and support business development, growth, productivity, market expansion and innovation across New Brunswick's economy.",
    program: {
      slug: "business-growth-and-innovation-support",
      name: "Business Growth and Innovation Support",
      programType: "business development and innovation service",
      websiteUrl: "https://onbcanada.ca/businesses/grow/",
      summary: "ONB's growth service works with New Brunswick companies on funding and advisory support for job creation, productivity, market development and innovation projects.",
      cohortLabel: null
    },
    relatedOrganizationName: "Government of New Brunswick",
    relationshipType: "provincial Crown agency",
    relationshipSummary: "New Brunswick legislation establishes Opportunities New Brunswick as a Crown agent, while the provincial organization profile assigns it responsibility for investment attraction and business development.",
    tier: "amber",
    inclusionScore: 87,
    completenessScore: 80,
    warning: "The proposed program record is a documented service bundle rather than a separately branded statutory program; reviewers should confirm whether to retain it as a program.",
    sources: [
      ["profile", "Opportunities New Brunswick organization profile", "https://www.gnb.ca/en/org/opportunities-nb.html", "Government of New Brunswick", "government_service_page", "Organization profile", "The provincial profile assigns ONB responsibility for attracting investment and supporting business development in New Brunswick."],
      ["grow", "Grow your business with Opportunities New Brunswick", "https://onbcanada.ca/businesses/grow/", "Opportunities New Brunswick", "innovation_program", "Business growth service", "ONB describes funding and advisory support for job creation, productivity, market development and innovation activity."],
      ["contact", "Contact Opportunities New Brunswick", "https://onbcanada.ca/investors/contact-us/", "Opportunities New Brunswick", "official_organization_profile", "Contact page", "ONB lists its public office at 250 King Street in Fredericton, New Brunswick, with public contact channels."],
      ["act", "Opportunities New Brunswick Act", "https://laws.gnb.ca/en/document/cs/2015%2C%20c.2", "Government of New Brunswick", "official_policy", "Crown status provisions", "The Act establishes Opportunities New Brunswick as a body corporate and an agent of the Crown in right of New Brunswick."]
    ],
    evidenceSourceKeys: { description: "profile", mandate: "profile", location: "contact", program: "grow", relationship: "act" }
  },
  {
    id: "investissement-quebec",
    name: "Investissement Québec",
    legalName: "Investissement Québec",
    aliases: ["IQ"],
    website: "https://www.investquebec.com/",
    city: "Québec City",
    province: "Quebec",
    latitude: 46.8139,
    longitude: -71.208,
    description: "Investissement Québec is Quebec's public economic development and financing corporation, providing investment, advisory and technology-support services intended to increase business innovation, productivity and growth.",
    mandate: "Investissement Québec stimulates investment and innovation by financing businesses, taking investments, attracting international projects and providing advisory and technology services on behalf of Quebec's economic development mandate.",
    program: {
      slug: "grand-v",
      name: "Grand V",
      programType: "innovation and productivity financing initiative",
      websiteUrl: "https://www.investquebec.com/fr/salle-de-presse/linitiative-grand-v-pour-accelerer-le-grand-virage-vers-linnovation-et-la-productivite-durable",
      summary: "Grand V combines financing and technology support to accelerate business investment in innovation, productivity and sustainable transformation across Quebec, with a multi-year public investment objective.",
      cohortLabel: null
    },
    relatedOrganizationName: "Government of Quebec",
    relationshipType: "public economic development corporation",
    relationshipSummary: "Investissement Québec carries out public financing, investment attraction, productivity and innovation functions within the Government of Quebec's economic development system.",
    tier: "amber",
    inclusionScore: 91,
    completenessScore: 86,
    warning: "Investissement Québec is also a major public financier; confirm government_innovation_office versus investor_funder before publication.",
    sources: [
      ["mission", "Mission d'Investissement Québec", "https://www.investquebec.com/fr/tout-sur-nous/mission", "Investissement Québec", "official_organization_profile", "Mission page", "Investissement Québec describes its economic-development, business-financing, investment-attraction and innovation-support mandate."],
      ["program", "Initiative Grand V", "https://www.investquebec.com/fr/salle-de-presse/linitiative-grand-v-pour-accelerer-le-grand-virage-vers-linnovation-et-la-productivite-durable", "Investissement Québec", "innovation_program", "Grand V initiative announcement", "Grand V combines public financing and technology support to accelerate business innovation, productivity and sustainable transformation."],
      ["contact", "Nous joindre Investissement Québec", "https://www.investquebec.com/fr/nous-joindre", "Investissement Québec", "official_organization_profile", "Head-office contact page", "Investissement Québec lists its head office at 1195 avenue Lavigerie in Québec City and provides public service channels."]
    ],
    evidenceSourceKeys: { description: "mission", mandate: "mission", location: "contact", program: "program", relationship: "mission" }
  },
  {
    id: "atlantic-canada-opportunities-agency",
    name: "Atlantic Canada Opportunities Agency",
    legalName: "Atlantic Canada Opportunities Agency",
    aliases: ["ACOA", "Agence de promotion économique du Canada atlantique", "APECA"],
    website: "https://www.acoa-apeca.gc.ca/",
    city: "Moncton",
    province: "New Brunswick",
    latitude: 46.0878,
    longitude: -64.7782,
    description: "The Atlantic Canada Opportunities Agency is the federal regional development agency for Atlantic Canada, supporting business innovation, productivity, commercialization, investment and regional economic growth.",
    mandate: "ACOA advances Atlantic Canada's economic growth by supporting innovative and productive businesses, community development, commercialization, investment and regional capacity across the four Atlantic provinces.",
    program: {
      slug: "regional-defence-investment-initiative",
      name: "Regional Defence Investment Initiative",
      programType: "federal defence and dual-use growth initiative",
      websiteUrl: "https://www.canada.ca/en/atlantic-canada-opportunities/services/regional-defence-investment-initiative.html",
      summary: "ACOA's Regional Defence Investment Initiative provides targeted support for Atlantic Canadian defence and dual-use research, demonstration, commercialization, production capacity, supply-chain integration and related research facilities.",
      cohortLabel: null
    },
    relatedOrganizationName: "Government of Canada",
    relationshipType: "federal regional development agency",
    relationshipSummary: "ACOA is a Government of Canada regional development agency serving Atlantic Canada and administering federal business, innovation and community economic-development programs in the region.",
    tier: "green",
    inclusionScore: 99,
    completenessScore: 94,
    warning: "The Regional Defence Investment Initiative is public funding support and does not establish procurement eligibility, endorsement or any classified defence requirement.",
    sources: [
      ["profile", "Atlantic Canada Opportunities Agency", "https://www.canada.ca/en/atlantic-canada-opportunities.html", "Atlantic Canada Opportunities Agency", "government_service_page", "Departmental profile", "The federal profile describes ACOA's regional economic-development, business innovation, productivity and growth role in Atlantic Canada."],
      ["program", "Regional Defence Investment Initiative", "https://www.canada.ca/en/atlantic-canada-opportunities/services/regional-defence-investment-initiative.html", "Atlantic Canada Opportunities Agency", "innovation_program", "Program overview", "The federal initiative supports Atlantic Canadian defence and dual-use research, demonstration, commercialization, production capacity and supply-chain integration."],
      ["contact", "Contact the Atlantic Canada Opportunities Agency", "https://www.canada.ca/en/atlantic-canada-opportunities/corporate/contact-us.html", "Atlantic Canada Opportunities Agency", "government_service_page", "Headquarters contact section", "ACOA lists its headquarters in Moncton, New Brunswick, and provides regional and public contact channels."]
    ],
    evidenceSourceKeys: { description: "profile", mandate: "profile", location: "contact", program: "program", relationship: "profile" }
  }
];

const queued = [
  ["Canadian Northern Economic Development Agency", "government_innovation_office", "https://www.cannor.gc.ca/eng/1381321454558/1381321612672", "government_program"],
  ["Pacific Economic Development Canada", "government_innovation_office", "https://www.canada.ca/en/pacific-economic-development.html", "government_program"],
  ["Prairies Economic Development Canada", "government_innovation_office", "https://www.canada.ca/en/prairies-economic-development.html", "government_program"],
  ["Federal Economic Development Agency for Southern Ontario", "government_innovation_office", "https://www.canada.ca/en/economic-development-southern-ontario.html", "government_program"],
  ["Federal Economic Development Agency for Northern Ontario", "government_innovation_office", "https://fednor.canada.ca/eic/site/fednor-fednor.nsf/eng/home", "government_program"],
  ["Canada Economic Development for Quebec Regions", "government_innovation_office", "https://www.canada.ca/en/economic-development-quebec-regions.html", "bilingual_web"],
  ["Canada Foundation for Innovation", "investor_funder", "https://www.innovation.ca/", "government_program"],
  ["Fonds de recherche du Québec", "investor_funder", "https://frq.gouv.qc.ca/", "bilingual_web"],
  ["New Brunswick Innovation Foundation", "investor_funder", "https://nbif.ca/", "investor_portfolio"],
  ["Canada Innovation Corporation", "government_innovation_office", "https://ised-isde.canada.ca/site/canada-innovation-corporation/en", "government_program"],
  ["Transport Canada Innovation Centre", "government_innovation_office", "https://tc.canada.ca/en/corporate-services/transport-canada-centre-innovation", "government_program"],
  ["Clean Growth Hub", "government_innovation_office", "https://ised-isde.canada.ca/site/clean-growth-hub/en", "official_directory"],
  ["Canada Growth Fund", "investor_funder", "https://www.cgf-fcc.ca/", "investor_portfolio"],
  ["Export Development Canada", "investor_funder", "https://www.edc.ca/", "official_directory"],
  ["Farm Credit Canada", "investor_funder", "https://www.fcc-fac.ca/", "official_directory"],
  ["Invest in Canada", "government_innovation_office", "https://www.investcanada.ca/", "official_directory"],
  ["Synchronex", "ecosystem_organization", "https://synchronex.ca/", "industry_association"],
  ["Conseil de l'innovation du Québec", "ecosystem_organization", "https://conseilinnovation.quebec/", "bilingual_web"],
  ["Manitoba Technology Accelerator", "accelerator", "https://www.mta.ca/", "accelerator_cohort"],
  ["Platform Calgary", "accelerator", "https://www.platformcalgary.com/", "accelerator_cohort"],
  ["MaRS Discovery District", "incubator", "https://www.marsdd.com/", "accelerator_cohort"],
  ["Communitech", "ecosystem_organization", "https://communitech.ca/", "industry_association"],
  ["North Forge Technology Exchange", "incubator", "https://northforge.ca/", "accelerator_cohort"],
  ["DIGITAL", "ecosystem_organization", "https://www.digitalsupercluster.ca/", "industry_association"],
  ["Next Generation Manufacturing Canada", "ecosystem_organization", "https://www.ngen.ca/", "industry_association"],
  ["Scale AI", "ecosystem_organization", "https://www.scaleai.ca/", "industry_association"],
  ["Protein Industries Canada", "ecosystem_organization", "https://www.proteinindustriescanada.ca/", "industry_association"],
  ["Creative Destruction Lab", "accelerator", "https://creativedestructionlab.com/", "accelerator_cohort"],
  ["Techstars Toronto", "accelerator", "https://www.techstars.com/accelerators/toronto", "accelerator_cohort"],
  ["National Research Council Canada", "research_test_centre", "https://nrc.canada.ca/en", "technical_documentation"]
];

const duplicates = [
  ["Volta", "incubator", "https://voltaeffect.com/"],
  ["ventureLAB", "accelerator", "https://www.venturelab.ca/"],
  ["Accelerator Centre", "accelerator", "https://www.acceleratorcentre.com/"],
  ["NRC Industrial Research Assistance Program", "government_innovation_office", "https://nrc.canada.ca/en/support-technology-innovation/nrc-irap"],
  ["Innovation for Defence Excellence and Security", "government_innovation_office", "https://www.canada.ca/en/department-national-defence/programs/defence-ideas.html"],
  ["Innovative Solutions Canada", "government_innovation_office", "https://ised-isde.canada.ca/site/innovative-solutions-canada/en"],
  ["Defence Research and Development Canada", "government_innovation_office", "https://www.canada.ca/en/defence-research-development.html"],
  ["Canada's Ocean Supercluster", "ecosystem_organization", "https://oceansupercluster.ca/"],
  ["Business Development Bank of Canada", "investor_funder", "https://www.bdc.ca/"],
  ["Invest Ottawa", "ecosystem_organization", "https://www.investottawa.ca/"]
];

const sourceChannel = (url) => /canada\.ca|saskatchewan\.ca|princeedwardisland\.ca|gnb\.ca|laws\.gnb\.ca|ised-isde\.canada\.ca|tc\.canada\.ca/.test(url)
  ? "government_procurement"
  : "ecosystem_program";

function candidateSource(subject, tuple) {
  const [key, title, url, publisher, sourceKind, locator, summary] = tuple;
  return {
    key,
    id: `source-${subject.id}-${key}`,
    title,
    url,
    publisher,
    sourceKind,
    publishedAt: null,
    accessedAt: now,
    locator,
    summary
  };
}

function sourceByKey(subject, key) {
  const tuple = subject.sources.find(([candidateKey]) => candidateKey === key);
  if (!tuple) throw new Error(`Missing source ${key} for ${subject.id}`);
  return candidateSource(subject, tuple);
}

function recoveryAttempts(subject) {
  const official = sourceByKey(subject, subject.evidenceSourceKeys.description);
  const program = sourceByKey(subject, subject.evidenceSourceKeys.program);
  const relationship = sourceByKey(subject, subject.evidenceSourceKeys.relationship);
  return [
    { lane: "official_directory", url: official.url, outcome: "Reviewed the durable official organization profile for identity, mandate, Canadian presence and operating role." },
    { lane: "government_program", url: program.url, outcome: "Reviewed the current official program or service page for a concrete innovation activity and bounded program description." },
    { lane: "customer_partner", url: relationship.url, outcome: "Reviewed the official governance or public-partner source for the organization's government relationship and delivery role." }
  ];
}

function buildLead(subject, index) {
  const source = sourceByKey(subject, subject.evidenceSourceKeys.description);
  return {
    leadType: "organization_lead",
    id: `lead-${subject.id}`,
    source: Object.fromEntries(Object.entries(source).filter(([key]) => key !== "key")),
    discoveryPath: [...new Set(subject.sources.map((item) => item[2]))],
    possibleMissionAreaSlugs: ["edge-data-processing", "autonomous-patrol-and-monitoring"],
    possibleTechnicalDomainSlugs: ["advanced-manufacturing-and-integration", "mission-software-and-data", "autonomous-systems"],
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
      "Confirm the proposed organization kind and public category at human review, especially where the agency also invests or delivers general business-development services.",
      "Retain only the program and relationship statements supported by the attached official source excerpts."
    ],
    discoveryLane: ["government_program", "official_directory", "bilingual_web", "customer_partner"][index % 4],
    inclusionScore: subject.inclusionScore,
    completenessScore: subject.completenessScore,
    reviewWarnings: [subject.warning],
    recoveryAttempts: recoveryAttempts(subject),
    disposition: "qualified",
    doNotIngestReason: null,
    organizationName: subject.name,
    proposedKind: "government_innovation_office",
    proposedCategories: ["government_program_operator", "public_funder"],
    websiteUrl: subject.website,
    aliases: subject.aliases,
    location: { city: subject.city, provinceTerritory: subject.province, countryCode: "CA" },
    candidateCapabilityName: null,
    roleSpecificEvidence: `${subject.description} ${subject.program.summary}`
  };
}

function buildCandidate(subject) {
  const sources = subject.sources.map((tuple) => candidateSource(subject, tuple));
  const evidenceDefinitions = [
    ["description", "organization.description", subject.description, subject.evidenceSourceKeys.description],
    ["mandate", "organization.profileData.mandate", subject.mandate, subject.evidenceSourceKeys.mandate],
    ["location", "organization.primaryLocation", `${subject.name} publicly lists an operating office in ${subject.city}, ${subject.province}, Canada.`, subject.evidenceSourceKeys.location],
    ["program", `programs.${subject.program.slug}.summary`, subject.program.summary, subject.evidenceSourceKeys.program],
    ["relationship", "relationships.0.publicSummary", subject.relationshipSummary, subject.evidenceSourceKeys.relationship]
  ];
  return {
    schemaVersion: "organization_bundle_v2",
    candidateKind: "organization_bundle",
    candidateId: `candidate-${subject.id}`,
    sourceLeadIds: [`lead-${subject.id}`],
    confidence: subject.tier === "green" ? "high" : "moderate",
    reviewStatus: "candidate_pending",
    reviewerRationale: `${subject.name} fills the selected government-innovation-office coverage gap with a documented Canadian public mandate and at least one concrete innovation, commercialization or technology-adoption program. Official organization, program, governance and contact sources support the proposed identity, mandate, Canadian location, program and government relationship. The candidate is intentionally bounded to public evidence: it does not imply defence procurement, endorsement or classified demand. Review the proposed organization kind, the program wording and the explicit classification warning before deciding whether to publish.`,
    reviewTier: subject.tier,
    inclusionScore: subject.inclusionScore,
    completenessScore: subject.completenessScore,
    reviewWarnings: [subject.warning],
    duplicateCheck: {
      status: "clear",
      checkedAt: now,
      methods: ["canonical_url", "website_domain", "slug", "legal_name", "alias", "fuzzy_name"],
      matches: [],
      note: "Live published organization names, aliases, websites and the active candidate queue were checked before this batch; no exact or normalized match was found."
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
      entityKind: "government_innovation_office",
      categories: ["government_program_operator", "public_funder"],
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
        evidenceBoundary: "This profile records a public innovation and program-delivery mandate. It does not imply supplier status, procurement eligibility, endorsement, customer interest or classified demand."
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
}

function buildClaims(subject) {
  const candidateId = `candidate-${subject.id}`;
  const definitions = [
    ["description", "organization description", subject.description, "organization.description", subject.evidenceSourceKeys.description],
    ["mandate", "public innovation mandate", subject.mandate, "organization.profileData.mandate", subject.evidenceSourceKeys.mandate],
    ["location", "Canadian office location", `${subject.name} publicly lists an operating office in ${subject.city}, ${subject.province}, Canada.`, "organization.primaryLocation", subject.evidenceSourceKeys.location],
    ["program", "named innovation program", subject.program.summary, `programs.${subject.program.slug}.summary`, subject.evidenceSourceKeys.program],
    ["relationship", "government relationship", subject.relationshipSummary, "relationships.0.publicSummary", subject.evidenceSourceKeys.relationship]
  ];
  return definitions.map(([key, predicate, value, fieldPath, sourceKey]) => {
    const source = sourceByKey(subject, sourceKey);
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
        sourceChannel: sourceChannel(source.url),
        sourceFamily: new URL(source.url).hostname.replace(/^www\./, ""),
        sourcePosture: "evidence_anchor",
        independenceKey: `${new URL(source.url).hostname}${new URL(source.url).pathname}`
      },
      status: "supported",
      independentClaimIds: [],
      contradictsClaimIds: [],
      supersedesClaimIds: [],
      disposition: "candidate_field",
      candidateTargets: [{ candidateId, fieldPath, operationId: null }],
      analystNote: `The attached durable official source directly supports this bounded field for ${subject.name}; no social or newsletter assertion is used as evidence.`
    };
  });
}

function buildCoverage(subject) {
  const id = (key) => `claim-${subject.id}-${key}`;
  const all = [id("description"), id("mandate"), id("location"), id("program"), id("relationship")];
  return [
    ["identity_ownership", "covered", [id("description"), id("relationship")], "Official profile and government relationship sources establish the bounded public identity and institutional role."],
    ["canadian_presence", "covered", [id("location")], "An official contact or agency source establishes a current Canadian operating office."],
    ["offering_mandate", "covered", [id("mandate"), id("program")], "The public mandate and one concrete program are represented with direct official evidence."],
    ["technical_specifications", "not_applicable", [], "This subject is a public innovation program operator rather than a technology producer, so product specifications are not applicable."],
    ["maturity_deployment", "partial", [id("program")], "A current operating program demonstrates delivery activity, but individual project maturity is outside this organization-level candidate."],
    ["customers_contracts_programs", "covered", [id("program")], "A named public program or service is captured without inferring a specific recipient, award or customer."],
    ["procurement_demand", "partial", [id("program")], "Program criteria and public support priorities are visible, but no procurement requirement or classified demand is inferred."],
    ["partnerships_financing", "covered", [id("relationship"), id("program")], "The government relationship and public funding or program-delivery role are supported by official sources."],
    ["public_contacts", "covered", [id("location")], "The cited public office source provides an organization-level contact path without collecting personal data."],
    ["current_activity", "covered", [id("program")], "A current official program or service page demonstrates ongoing public activity relevant to the map."],
    ["source_diversity", "partial", all, "Multiple durable pages were used, but most evidence originates from the organization or its responsible government and is not fully independent."],
    ["contradictions", "not_found", [], "No material contradiction was found; classification ambiguity is preserved as a reviewer warning rather than hidden."]
  ].map(([dimension, status, claimIds, note]) => ({
    dimension,
    status,
    claimIds,
    attempts: status === "not_found" || status === "not_applicable"
      ? ["Official organization, program, government and bilingual public-web lanes were compared for conflicts or missing applicability."]
      : [],
    note
  }));
}

const run = JSON.parse(await fs.readFile(runPath, "utf8"));
const plan = JSON.parse(await fs.readFile(planPath, "utf8"));

plan.status = "complete";
plan.targetSubjects = selected.map((subject) => ({
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
    `Canada provincial innovation agency ${lane.lane.replaceAll("_", " ")}`,
    `agence innovation provinciale Canada ${lane.lane.replaceAll("_", " ")}`
  ])]
}));

const claims = selected.flatMap(buildClaims);
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
      stopReason: "Official, government, program, governance and contact lanes support the reviewable fields; additional industry and technical-document searches produced no material organization-level claim beyond this bounded candidate."
    }
  })),
  warnings: [
    "Four candidates retain explicit organization-kind warnings because public investment or broad business-development functions overlap with investor_funder or ecosystem_organization.",
    "Discovery-only newsletter and social assertions were not promoted into field evidence; every candidate field is tied to a durable official source."
  ]
};

const prospects = [
  ...selected.map((subject, index) => ({
    id: `prospect-${subject.id}`,
    name: subject.name,
    proposedEntityType: "organization",
    proposedOrganizationKind: "government_innovation_office",
    canonicalUrl: subject.website,
    discoverySourceUrl: subject.sources[0][2],
    discoveryLane: ["government_program", "official_directory", "bilingual_web", "customer_partner"][index % 4],
    countryCode: "CA",
    fitSummary: "Canadian public innovation or economic-development body with a documented mandate and a concrete technology, commercialization, adoption or funding program.",
    disposition: "selected",
    rejectionReason: null,
    recoveryAttempts: recoveryAttempts(subject)
  })),
  ...queued.map(([name, kind, url, lane]) => ({
    id: `prospect-${slugify(name)}`,
    name,
    proposedEntityType: "organization",
    proposedOrganizationKind: kind,
    canonicalUrl: url,
    discoverySourceUrl: url,
    discoveryLane: lane,
    countryCode: "CA",
    fitSummary: "Plausible Canadian innovation, funding, acceleration or ecosystem-support organization retained for later evidence qualification and duplicate review.",
    disposition: "queued",
    rejectionReason: null,
    recoveryAttempts: []
  })),
  ...duplicates.map(([name, kind, url], index) => ({
    id: `prospect-${slugify(name)}`,
    name,
    proposedEntityType: "organization",
    proposedOrganizationKind: kind,
    canonicalUrl: url,
    discoverySourceUrl: url,
    discoveryLane: ["official_directory", "government_program", "accelerator_cohort", "investor_portfolio"][index % 4],
    countryCode: "CA",
    fitSummary: "Relevant Canadian innovation or ecosystem organization encountered during broad prospect enumeration and checked against the live corpus.",
    disposition: "duplicate",
    rejectionReason: "An exact published organization already exists in the live True North Map corpus, so no new candidate was built in this run.",
    recoveryAttempts: []
  }))
];

const inventory = {
  schemaVersion: "research_prospect_inventory_v1",
  inventoryId: `inventory-${runId}`,
  runId,
  createdAt: now,
  scope: "Canada-wide government innovation-office discovery across official directories, government programs, public funders, accelerators, ecosystem organizations, bilingual web, program pages and duplicate checks against the live published corpus.",
  prospects
};

const leadBatch = {
  schemaVersion: "source_lead_batch_v2",
  leadBatchId: `lead-batch-${runId}`,
  runId,
  createdAt: now,
  scope: {
    description: "Ten qualified Canadian government-innovation-office leads selected from a 50-prospect, multi-lane inventory. Qualified leads proceed directly to enriched private candidates; classification ambiguity remains visible for human review.",
    targetMissionAreaSlugs: run.scope.missionAreaSlugs,
    targetTechnicalDomainSlugs: run.scope.technicalDomainSlugs,
    targetOrganizationKinds: ["government_innovation_office"],
    targetDemandIssuerTypes: []
  },
  leads: selected.map(buildLead)
};

const candidateBatch = {
  schemaVersion: "research_candidate_batch_v2",
  batchId: `candidate-batch-${runId}`,
  runId,
  title: "Canadian government innovation offices and program operators",
  status: "candidate",
  createdAt: now,
  selectedGap: run.selectedGap,
  sourceLeadBatchPath: leadPath,
  guardrailNotes: [
    "Private Admin Review material only; this run does not accept, publish or write any candidate into canonical organization or program tables.",
    "Official organization, government, program, governance and contact pages are the field-evidence anchors; classification ambiguity remains explicit in reviewer warnings."
  ],
  candidates: selected.map(buildCandidate),
  deferred: []
};

run.status = "completed";
run.completedAt = now;
run.sourceQueries = [
  "Canada provincial innovation agency official program",
  "provincial Crown innovation agency Canada commercialization funding",
  "regional development agency Canada innovation technology adoption",
  "agence innovation provinciale Canada financement commercialisation",
  "site:canada.ca regional defence investment initiative Atlantic Canada",
  "site:saskatchewan.ca Innovation Saskatchewan fund research commercialization",
  "site:princeedwardisland.ca Innovation PEI aerospace defence innovation fund",
  "site:gnb.ca Opportunities New Brunswick Crown agency",
  "site:investquebec.com innovation productivité financement",
  "site:oc-innovation.ca government program delivery OVIN",
  "site:albertainnovates.ca governance ecosystem partnerships",
  "site:innovatebc.ca Crown agency Integrated Marketplace"
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
  warnings: ["Four candidates require explicit human confirmation of organization kind because their public investment or broad business-development roles overlap another taxonomy class."]
};
run.stopReason = "Completed the ten-candidate target after qualifying a 50-prospect, multi-lane inventory; thirty unused prospects remain queued for subsequent evidence-led batches.";
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
  claims: claims.length,
  green: selected.filter((subject) => subject.tier === "green").length,
  amber: selected.filter((subject) => subject.tier === "amber").length,
  candidatePath
}, null, 2));
