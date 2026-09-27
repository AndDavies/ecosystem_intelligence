// Public-field specimen extracted from research/ingestion/candidate-batches-v2/tnm-manual-20260906074301.json.
// Saved organization plus its proposed field operations; not current production proof.
// Location coordinates and linked records absent from this packet are not fabricated.
import type { AtlasOrganization } from "@/types/atlas";
export const krakenSavedDossier: AtlasOrganization = {
  "id": "10000000-0000-4000-8000-000000000001",
  "slug": "kraken-robotics",
  "name": "Kraken Robotics",
  "legalName": null,
  "description": "Kraken Robotics supplies seabed imaging and subsea power systems to naval, uncrewed-vehicle and offshore users. Its Canadian operating business develops KATFISH towed synthetic-aperture sonar, vehicle-integrated SAS and SeaPower pressure-tolerant batteries, alongside subsea survey services. The July 2026 Covelya acquisition expanded the group; individual subsidiary products and delivery responsibilities remain distinct.",
  "websiteUrl": "https://www.krakenrobotics.com/",
  "entityKind": "company",
  "foundedYear": null,
  "employeeRange": null,
  "companyStage": null,
  "ownership": null,
  "commercialStatus": null,
  "disclosedFinancingSummary": "Note 22 of Kraken's June 2026 statements records approximately C$615 million consideration for Covelya: C$355 million cash on hand, C$125 million term debt and C$135 million shares, subject to closing adjustments. Separately, the Q2 MD&A records a C$6.911 million provision for probable costs in a supplier arbitration relating to a 2017 contract. These are acquisition financing and an estimated obligation, not new sales.",
  "defencePosture": null,
  "dualUsePosture": null,
  "sourceConfidence": "moderate",
  "freshnessStatus": "current",
  "lastReviewedAt": "2026-08-12T10:53:54.093745+00:00",
  "categories": [
    "commercial_company",
    "defence_supplier",
    "dual_use"
  ],
  "primaryLocation": null,
  "locations": [],
  "profileData": {
    "publicContact": {
      "contactPageUrl": "https://www.krakenrobotics.com/contact/",
      "publicEmail": "sales@krakenrobotics.com",
      "publicPhone": "+1 709 757 5757",
      "linkedInUrl": null
    },
    "portfolioSummary": "KATFISH's published operating envelope is 4–10 knots, 5–30 m survey altitude and a 300 m maximum depth rating. Its fact sheet separates 3 cm real-time SAS from 2 cm post-processed imagery, lists GeoTIFF/XTF and other outputs, and specifies a topside processing rack, 28 TB storage and gigabit Ethernet. SeaPower's brochure describes a 6000 m rating, per-cell temperature/voltage monitoring and software-controlled power; it says designed for compliance with named standards, not that every supplied configuration holds certification."
  },
  "logo": null,
  "mediaAssets": [],
  "programs": [],
  "fundingEvents": [],
  "relationships": [],
  "editorialProfile": {
    "currentActivity": "On August 27, 2026, Kraken reported Q2 revenue of C$27.3 million, excluding Covelya because that acquisition closed after the quarter. It also announced a long-term subsea-battery supply agreement with an unnamed XL-UUV developer. The release reported a C$1.5 million reversal of previously recognized integration-project revenue following a scope reduction.",
    "currentActivityAsOf": "2026-08-27",
    "operatingContext": "KATFISH addresses towed seabed survey; Kraken SAS is a vehicle payload, while SeaPower supplies energy to underwater platforms. Integrators must distinguish the sonar's real-time and post-processed outputs and provide the required towing, launch/recovery, processing and storage arrangement. DND's RMDS award establishes a separate Canadian prime-integration role; it should not be read as proof that every product has the same qualification or delivery stage.",
    "canadianFootprint": "Kraken lists its headquarters at 189 Glencoe Drive, Mount Pearl, Newfoundland and Labrador, and a Nova Scotia location at 464 Cutler Avenue, Dartmouth. Its April 2026 results announcement reported completion of a new Nova Scotia battery manufacturing facility. The facility announcement supports a Canadian production footprint, but does not quantify current qualified output or available delivery slots.",
    "reviewedQuestions": [
      {
        "id": "kraken-rmds-scope",
        "question": "Which RMDS deliverables and support obligations remain after the June 2026 amendment, and does that amendment relate to the Q2 integration-project revenue reversal?",
        "context": "CanadaBuys records a C$12,154,000.20 reduction on W8472-105270/001/QF with a 2028 expiry. Kraken separately reports a C$1.5 million revenue reversal on an unnamed integration project; the reviewed documents do not explicitly connect them.",
        "confidence": "moderate"
      },
      {
        "id": "kraken-katfish-data-path",
        "question": "For the proposed vessel and survey speed, what real-time imagery, post-processing latency, storage and launch/recovery configuration will the supplied KATFISH system deliver?",
        "context": "The fact sheet separates 3 cm real-time imagery from 2 cm post-processed imagery and specifies 330 GB/hr dual-sided data, a topside processing rack and optional launch/recovery equipment. These distinctions affect vessel and data-system integration.",
        "confidence": "moderate"
      }
    ],
    "executiveRelevanceSummary": "Kraken offers a Canadian route to subsea imaging, battery integration and naval-system delivery, with DND buyer evidence for RMDS. The useful next conversation is configuration-specific: distinguish KATFISH real-time outputs from processed imagery, and verify power and launch/recovery interfaces. Its expanded group scope and Q2 financial obligations also make delivery responsibility and current contract scope worth checking before a supplier decision.",
    "version": "organization_editorial_profile_v1"
  },
  "citations": [
    {
      "id": "kraken-robotics-description-kraken-katfish",
      "fieldName": "description",
      "sourceTitle": "KATFISH manufacturer technical specification",
      "sourceUrl": "https://www.krakenrobotics.com/wp-content/uploads/2026/01/KATFISH_Kraken_Flyer_Letter.pdf",
      "publisher": "Kraken Robotics",
      "sourceType": "official_company_product",
      "excerpt": "KATFISH is a stabilized towed synthetic-aperture sonar with real-time and post-processed seabed imaging.",
      "publishedAt": null
    },
    {
      "id": "kraken-robotics-description-kraken-seapower",
      "fieldName": "description",
      "sourceTitle": "SeaPower manufacturer product and integration specifications",
      "sourceUrl": "https://www.krakenrobotics.com/wp-content/uploads/2025/05/SeaPower_Kraken_Flyer_A4.pdf",
      "publisher": "Kraken Robotics",
      "sourceType": "official_company_product",
      "excerpt": "SeaPower uses encapsulated lithium-ion cells and battery-management electronics for pressure-tolerant subsea power.",
      "publishedAt": null
    },
    {
      "id": "kraken-robotics-description-kraken-statements",
      "fieldName": "description",
      "sourceTitle": "Kraken Robotics June 2026 interim financial statements",
      "sourceUrl": "https://www.krakenrobotics.com/wp-content/uploads/2026/08/Kraken-Robotics-Inc.-Q2-26-Financial-Statements-FINAL.pdf",
      "publisher": "Kraken Robotics",
      "sourceType": "official_report",
      "excerpt": "Kraken acquired all Covelya shares on July 2, 2026, as disclosed in subsequent events.",
      "publishedAt": null
    },
    {
      "id": "kraken-robotics-current-activity-kraken-q2",
      "fieldName": "current_activity",
      "sourceTitle": "Kraken Robotics reports Q2 2026 financial results",
      "sourceUrl": "https://www.krakenrobotics.com/news-releases/kraken-robotics-reports-q2-2026-financial-results/",
      "publisher": "Kraken Robotics",
      "sourceType": "official_company_news",
      "excerpt": "The August 27, 2026 results report C$27.3 million standalone Q2 revenue, a new XL-UUV battery agreement and a C$1.5 million integration-project revenue reversal.",
      "publishedAt": null
    },
    {
      "id": "kraken-robotics-current-activity-as-of-kraken-q2",
      "fieldName": "current_activity_as_of",
      "sourceTitle": "Kraken Robotics reports Q2 2026 financial results",
      "sourceUrl": "https://www.krakenrobotics.com/news-releases/kraken-robotics-reports-q2-2026-financial-results/",
      "publisher": "Kraken Robotics",
      "sourceType": "official_company_news",
      "excerpt": "The Q2 results and XL-UUV agreement announcement is dated August 27, 2026.",
      "publishedAt": null
    },
    {
      "id": "kraken-robotics-operating-context-kraken-katfish",
      "fieldName": "operating_context",
      "sourceTitle": "KATFISH manufacturer technical specification",
      "sourceUrl": "https://www.krakenrobotics.com/wp-content/uploads/2026/01/KATFISH_Kraken_Flyer_Letter.pdf",
      "publisher": "Kraken Robotics",
      "sourceType": "official_company_product",
      "excerpt": "KATFISH pairs a towed sonar with topside processing, tow cable and winch; ISO20 and USV launch/recovery systems are optional equipment.",
      "publishedAt": null
    },
    {
      "id": "kraken-robotics-operating-context-dnd-rmds",
      "fieldName": "operating_context",
      "sourceTitle": "DND Remote Mine-hunting and Disposal System contract award",
      "sourceUrl": "https://www.canada.ca/en/department-national-defence/news/2022/12/minister-anand-announces-remote-mine-hunting-and-disposal-system-contract-award-to-increase-safety-for-royal-canadian-navy-ships-and-crews.html",
      "publisher": "Department of National Defence",
      "sourceType": "government_service_page",
      "excerpt": "DND awarded Kraken Robotic Systems acquisition and in-service support contracts for two Remote Mine-hunting and Disposal Systems.",
      "publishedAt": null
    },
    {
      "id": "kraken-robotics-canadian-footprint-kraken-contact",
      "fieldName": "canadian_footprint",
      "sourceTitle": "Kraken Robotics Canadian locations and sales contact",
      "sourceUrl": "https://www.krakenrobotics.com/contact/",
      "publisher": "Kraken Robotics",
      "sourceType": "official_organization_profile",
      "excerpt": "Kraken lists Mount Pearl headquarters at 189 Glencoe Drive and a Dartmouth location at 464 Cutler Avenue.",
      "publishedAt": null
    },
    {
      "id": "kraken-robotics-canadian-footprint-kraken-facility",
      "fieldName": "canadian_footprint",
      "sourceTitle": "Kraken Robotics 2025 financial results and Nova Scotia capacity",
      "sourceUrl": "https://www.krakenrobotics.com/news-releases/kraken-robotics-reports-2025-financial-results/",
      "publisher": "Kraken Robotics",
      "sourceType": "official_company_news",
      "excerpt": "Kraken reported completion of a new Nova Scotia battery manufacturing facility in its April 16, 2026 results announcement.",
      "publishedAt": null
    },
    {
      "id": "kraken-robotics-disclosed-financing-summary-kraken-statements",
      "fieldName": "disclosed_financing_summary",
      "sourceTitle": "Kraken Robotics June 2026 interim financial statements",
      "sourceUrl": "https://www.krakenrobotics.com/wp-content/uploads/2026/08/Kraken-Robotics-Inc.-Q2-26-Financial-Statements-FINAL.pdf",
      "publisher": "Kraken Robotics",
      "sourceType": "official_report",
      "excerpt": "The Covelya consideration comprised C$355 million cash on hand, C$125 million term debt and C$135 million shares, subject to adjustments.",
      "publishedAt": null
    },
    {
      "id": "kraken-robotics-disclosed-financing-summary-kraken-mda",
      "fieldName": "disclosed_financing_summary",
      "sourceTitle": "Kraken Robotics Q2 2026 management discussion and analysis",
      "sourceUrl": "https://www.krakenrobotics.com/wp-content/uploads/2026/08/Kraken-MDA-Q2-2026-FINAL.pdf",
      "publisher": "Kraken Robotics",
      "sourceType": "official_report",
      "excerpt": "Kraken recognized C$6.911 million estimated royalty, interest and legal/arbitration costs connected to a 2017 supplier contract.",
      "publishedAt": null
    },
    {
      "id": "kraken-robotics-public-contact-kraken-contact",
      "fieldName": "public_contact",
      "sourceTitle": "Kraken Robotics Canadian locations and sales contact",
      "sourceUrl": "https://www.krakenrobotics.com/contact/",
      "publisher": "Kraken Robotics",
      "sourceType": "official_organization_profile",
      "excerpt": "Kraken directs sales inquiries to the form on https://www.krakenrobotics.com/contact/. The Mount Pearl headquarters phone is +1 709 757 5757. The official enquiry route is retained; no additional public value is asserted for this optional contact leaf.",
      "publishedAt": null
    },
    {
      "id": "kraken-robotics-public-contact-kraken-katfish",
      "fieldName": "public_contact",
      "sourceTitle": "KATFISH manufacturer technical specification",
      "sourceUrl": "https://www.krakenrobotics.com/wp-content/uploads/2026/01/KATFISH_Kraken_Flyer_Letter.pdf",
      "publisher": "Kraken Robotics",
      "sourceType": "official_company_product",
      "excerpt": "The KATFISH fact sheet publishes sales@krakenrobotics.com for sales inquiries.",
      "publishedAt": null
    },
    {
      "id": "kraken-robotics-portfoliosummary-kraken-katfish",
      "fieldName": "portfolioSummary",
      "sourceTitle": "KATFISH manufacturer technical specification",
      "sourceUrl": "https://www.krakenrobotics.com/wp-content/uploads/2026/01/KATFISH_Kraken_Flyer_Letter.pdf",
      "publisher": "Kraken Robotics",
      "sourceType": "official_company_product",
      "excerpt": "KATFISH specifies 4–10 knots, 300 m depth, 3 cm real-time and 2 cm processed imagery, GeoTIFF/XTF output and topside processing/storage interfaces.",
      "publishedAt": null
    },
    {
      "id": "kraken-robotics-portfoliosummary-kraken-seapower",
      "fieldName": "portfolioSummary",
      "sourceTitle": "SeaPower manufacturer product and integration specifications",
      "sourceUrl": "https://www.krakenrobotics.com/wp-content/uploads/2025/05/SeaPower_Kraken_Flyer_A4.pdf",
      "publisher": "Kraken Robotics",
      "sourceType": "official_company_product",
      "excerpt": "SeaPower specifies a 6000 m rating, per-cell BMS monitoring and software power control; standards wording is designed for compliance.",
      "publishedAt": null
    },
    {
      "id": "kraken-robotics-reviewed-questions-kraken-amendment",
      "fieldName": "reviewed_questions",
      "sourceTitle": "CanadaBuys RMDS amendment W8472-105270/001/QF",
      "sourceUrl": "https://canadabuys.canada.ca/en/tender-opportunities/contract-history/w8472-105270/001/qf-003",
      "publisher": "Public Services and Procurement Canada",
      "sourceType": "award_or_contract",
      "excerpt": "The June 11, 2026 buyer amendment reduces W8472-105270/001/QF by C$12,154,000.20 and lists expiry on December 29, 2028.",
      "publishedAt": null
    },
    {
      "id": "kraken-robotics-reviewed-questions-kraken-q2",
      "fieldName": "reviewed_questions",
      "sourceTitle": "Kraken Robotics reports Q2 2026 financial results",
      "sourceUrl": "https://www.krakenrobotics.com/news-releases/kraken-robotics-reports-q2-2026-financial-results/",
      "publisher": "Kraken Robotics",
      "sourceType": "official_company_news",
      "excerpt": "The Q2 release separately reports a C$1.5 million revenue reversal on an unnamed integration project.",
      "publishedAt": null
    },
    {
      "id": "kraken-robotics-reviewed-questions-kraken-katfish",
      "fieldName": "reviewed_questions",
      "sourceTitle": "KATFISH manufacturer technical specification",
      "sourceUrl": "https://www.krakenrobotics.com/wp-content/uploads/2026/01/KATFISH_Kraken_Flyer_Letter.pdf",
      "publisher": "Kraken Robotics",
      "sourceType": "official_company_product",
      "excerpt": "The KATFISH sheet distinguishes real-time and post-processed resolutions and specifies topside storage and launch/recovery options.",
      "publishedAt": null
    },
    {
      "id": "kraken-robotics-executive-relevance-summary-kraken-katfish",
      "fieldName": "executive_relevance_summary",
      "sourceTitle": "KATFISH manufacturer technical specification",
      "sourceUrl": "https://www.krakenrobotics.com/wp-content/uploads/2026/01/KATFISH_Kraken_Flyer_Letter.pdf",
      "publisher": "Kraken Robotics",
      "sourceType": "official_company_product",
      "excerpt": "KATFISH documented integration requirements make a configuration-specific supplier discussion useful; performance needs the offered-system context.",
      "publishedAt": null
    },
    {
      "id": "kraken-robotics-executive-relevance-summary-dnd-rmds",
      "fieldName": "executive_relevance_summary",
      "sourceTitle": "DND Remote Mine-hunting and Disposal System contract award",
      "sourceUrl": "https://www.canada.ca/en/department-national-defence/news/2022/12/minister-anand-announces-remote-mine-hunting-and-disposal-system-contract-award-to-increase-safety-for-royal-canadian-navy-ships-and-crews.html",
      "publisher": "Department of National Defence",
      "sourceType": "government_service_page",
      "excerpt": "DND RMDS award gives Canadian buyer evidence for Kraken's integration role; current acceptance is a separate question.",
      "publishedAt": null
    }
  ],
  "capabilities": [
    {
      "id": "20000000-0000-4000-8000-000000000001",
      "organizationId": "10000000-0000-4000-8000-000000000001",
      "slug": "kraken-katfish-sas",
      "name": "KATFISH Towed Synthetic Aperture Sonar",
      "summary": "Tow a stabilized synthetic-aperture sonar to produce high-resolution seabed imagery and find subsea objects across wide survey areas.",
      "capabilityType": "Towed Synthetic Aperture Sonar",
      "coreFeatures": [
        "High-resolution underwater survey",
        "Seabed imaging",
        "Subsea object detection"
      ],
      "technologyReadinessLevel": null,
      "maturity": null,
      "commercialAvailability": null,
      "defenceApplications": [
        "Underwater ISR",
        "Route survey",
        "Subsea infrastructure awareness"
      ],
      "novelty": [],
      "technicalTags": [
        "hardware",
        "underwater_sensing",
        "synthetic_aperture_sonar",
        "maritime"
      ],
      "sourceConfidence": "high",
      "lastReviewedAt": "2026-07-19T20:10:32.645435+00:00",
      "technicalDomains": [],
      "missionMatches": [],
      "demandMatches": [],
      "citations": []
    },
    {
      "id": "57c7f489-be0b-4d17-bd87-df1ac02755b4",
      "organizationId": "10000000-0000-4000-8000-000000000001",
      "slug": "kraken-seapower-subsea-batteries",
      "name": "SeaPower Subsea Batteries",
      "summary": "Power long-endurance underwater vehicles with modular, pressure-tolerant lithium-ion battery systems designed for deep and complex subsea missions.",
      "capabilityType": "Pressure-tolerant subsea battery system",
      "coreFeatures": [
        "Pressure-tolerant polymer encapsulation",
        "Integrated battery management system",
        "Modular and scalable architecture",
        "Systems scalable from 1.8 kWh to 5 MWh"
      ],
      "technologyReadinessLevel": null,
      "maturity": null,
      "commercialAvailability": null,
      "defenceApplications": [
        "Long-endurance uncrewed underwater vehicles",
        "Extra-large uncrewed underwater vehicles",
        "Subsea energy storage and underwater missions"
      ],
      "novelty": [],
      "technicalTags": [
        "subsea batteries",
        "underwater power",
        "pressure tolerant",
        "UUV endurance"
      ],
      "sourceConfidence": "high",
      "lastReviewedAt": "2026-07-23T21:01:14.928169+00:00",
      "technicalDomains": [],
      "missionMatches": [],
      "demandMatches": [],
      "citations": []
    },
    {
      "id": "c0be4ba2-fe8f-4239-a7d9-8e14aad054c3",
      "organizationId": "10000000-0000-4000-8000-000000000001",
      "slug": "kraken-synthetic-aperture-sonar",
      "name": "Kraken Synthetic Aperture Sonar",
      "summary": "Integrate modular synthetic-aperture sonar payloads that combine high-resolution underwater imaging, bathymetric mapping and real-time processing across vehicle sizes.",
      "capabilityType": "Modular synthetic aperture sonar payload",
      "coreFeatures": [
        "Simultaneous imaging and bathymetric mapping",
        "Modular 60 cm, 120 cm and 180 cm arrays",
        "Real-time full-swath processing",
        "Constant resolution across the survey swath"
      ],
      "technologyReadinessLevel": null,
      "maturity": null,
      "commercialAvailability": null,
      "defenceApplications": [
        "Mine countermeasure operations",
        "Critical underwater infrastructure inspection",
        "Port and harbour security",
        "Route survey and seabed mapping"
      ],
      "novelty": [],
      "technicalTags": [
        "synthetic aperture sonar",
        "bathymetry",
        "underwater sensing",
        "mine countermeasures"
      ],
      "sourceConfidence": "high",
      "lastReviewedAt": "2026-07-23T21:01:14.928169+00:00",
      "technicalDomains": [],
      "missionMatches": [],
      "demandMatches": [],
      "citations": []
    },
    {
      "id": "9521989c-d5b3-49a1-a9ce-2763c197489b",
      "organizationId": "10000000-0000-4000-8000-000000000001",
      "slug": "kraken-remote-minehunting-disposal-system",
      "name": "Remote Minehunting and Disposal System integration",
      "summary": "Kraken is the Canadian prime integrator for two RCN Remote Minehunting and Disposal System payloads combining REMUS AUVs, AquaPix synthetic-aperture sonar, SEAFOX mine-disposal vehicles and a containerized command centre.",
      "capabilityType": "Naval mine-countermeasure system or subsystem",
      "coreFeatures": [
        "Two classes of autonomous underwater vehicles",
        "AquaPix synthetic-aperture sonar",
        "Mine-disposal vehicles",
        "Containerized command, launch and recovery centre"
      ],
      "technologyReadinessLevel": null,
      "maturity": null,
      "commercialAvailability": null,
      "defenceApplications": [
        "Sea-mine detection and classification",
        "Mine identification and neutralization",
        "Standoff route clearance",
        "Underwater domain awareness"
      ],
      "novelty": [],
      "technicalTags": [
        "mine countermeasures",
        "naval mine warfare",
        "underwater systems",
        "MCM"
      ],
      "sourceConfidence": "high",
      "lastReviewedAt": "2026-07-29T19:02:16.726688+00:00",
      "technicalDomains": [],
      "missionMatches": [],
      "demandMatches": [],
      "citations": []
    }
  ]
};
