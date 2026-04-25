export interface HelpTerm {
  term: string;
  definition: string;
}

export interface HelpSection {
  title: string;
  body?: string;
  bullets?: string[];
}

export interface HelpDiagram {
  title: string;
  description: string;
  steps: string[];
}

export interface HelpPageDefinition {
  slug: string;
  title: string;
  summary: string;
  purpose: string;
  keyTerms: HelpTerm[];
  sections: HelpSection[];
  watchFor: string[];
  related: string[];
  diagrams?: HelpDiagram[];
}

export const helpPages: HelpPageDefinition[] = [
  {
    slug: "concepts",
    title: "Core Concepts And Definitions",
    summary: "Shared vocabulary for the terms that matter most in the app.",
    purpose:
      "Use this page when you need a quick definition of how the product thinks about domains, Use Cases, capabilities, pathways, evidence, and review.",
    keyTerms: [
      {
        term: "Use Case",
        definition:
          "A mission or enabling lane that starts from an operational decision, public policy anchor, partner frame, and intended mission outcome."
      },
      {
        term: "Mission Use Case",
        definition:
          "A use case where the main value is a mission effect such as detecting, deciding, sustaining, protecting, or operating in a defined context."
      },
      {
        term: "Enabling Use Case",
        definition:
          "A use case that matters because it supports mission lanes, such as resilient communications, edge data processing, cyber assurance, or sustainment."
      },
      {
        term: "Policy Anchor",
        definition:
          "An official public source that explains why the use case is strategically relevant, such as a DND/CAF plan, Government of Canada strategy, or NATO text."
      },
      {
        term: "Capability",
        definition:
          "A product, system, or technical solution that can be evaluated or deployed independently."
      },
      {
        term: "Company",
        definition:
          "The organization associated with one or more capabilities and their supporting context."
      },
      {
        term: "Cluster",
        definition:
          "A stable grouping that helps users understand the capability landscape by type."
      },
      {
        term: "Pathway",
        definition:
          "The simplified maturity model used in the MVP: Build, Validate, or Scale."
      },
      {
        term: "Derived read",
        definition:
          "A heuristic or AI-assisted interpretation that helps decision-making but is not the same as a source-backed fact."
      }
    ],
    sections: [
      {
        title: "Capability-first thinking",
        body:
          "The product is designed to help users understand capabilities first, then use the company profile to add market, relationship, and contact context."
      },
      {
        title: "Realism checks",
        bullets: [
          "Every active Use Case should name an operational owner, mission context, required decision, partner frame, outcome, and procurement pathway.",
          "Public policy anchors support priority alignment, but they do not imply classified requirement access.",
          "A policy area should remain a coverage gap when the dataset lacks enough credible companies and capabilities to make it actionable."
        ]
      },
      {
        title: "Pathways in practice",
        bullets: [
          "Build: early-stage capability development or concept work.",
          "Validate: tested or piloted capability that still needs real-world proof.",
          "Scale: advanced capability ready for deployment, procurement-facing engagement, or commercialization."
        ]
      },
      {
        title: "Trust terms",
        bullets: [
          "Provenance and citations show where a fact or assessment comes from.",
          "A refresh request asks for a record to be re-reviewed or re-enriched; it does not change the live record immediately.",
          "An AI suggestion is routed into review before it can become live data."
        ]
      }
    ],
    watchFor: [
      "Do not confuse a company with a capability. A single company may have several capabilities at different maturity levels.",
      "Do not treat policy alignment as proof that a specific buyer has validated the capability.",
      "Treat derived reads as decision support, not as direct evidence.",
      "Use pathways conservatively; if maturity is uncertain, it should not be treated as Scale."
    ],
    related: ["first-walkthrough", "use-case-discovery", "bd-validation-workflow", "trust-and-review"]
  },
  {
    slug: "first-walkthrough",
    title: "10-Minute First Walkthrough",
    summary: "A concrete first path through the app for a new internal user.",
    purpose:
      "Use this page when you want to learn the product by doing one realistic workflow from start to finish.",
    keyTerms: [
      {
        term: "Top Engagement Target",
        definition:
          "A ranked capability that appears especially relevant for near-term action."
      },
      {
        term: "Recommended Action",
        definition:
          "A short directional suggestion that helps the user decide what to do first."
      },
      {
        term: "Evidence panel",
        definition:
          "The part of a record that shows supporting citations and excerpts."
      }
    ],
    sections: [
      {
        title: "Walkthrough steps",
        bullets: [
          "Open the app Dashboard and use the left navigation, persistent search, or mission-control actions based on the question you are trying to answer.",
          "Start with Recommended Actions and Top Engagement Targets when you enter through a Use Case to understand what deserves attention first.",
          "Use the desktop target table for a fast comparison before opening the richer target cards.",
          "Use the Companies table when the question starts from a known organization or market landscape.",
          "Scan clusters and maturity distribution to understand what exists across the landscape.",
          "Apply filters to narrow by domain, company, pathway, geography, or defence relevance.",
          "Open a capability to inspect its why-it-matters narrative, recent signals, and mapping evidence.",
          "Open the briefing view when you need to explain the top targets, tradeoffs, and gaps in a meeting-ready format.",
          "Save the best candidates to a shortlist with status, owner, next step, and rationale.",
          "Open the company profile to understand broader context, contacts, and adjacent capabilities."
        ]
      },
      {
        title: "What success looks like",
        body:
          "By the end of the walkthrough, you should be able to say which capabilities matter most, why they matter now, and what evidence supports that view."
      }
    ],
    watchFor: [
      "Do not treat the first ranked item as automatically correct; inspect the rationale and evidence.",
      "If a record looks wrong or stale, use editing or refresh workflows rather than assuming the issue will resolve itself."
    ],
    related: ["concepts", "use-case-discovery", "bd-validation-workflow", "trust-and-review"],
    diagrams: [
      {
        title: "Primary User Workflow",
        description:
          "The intended discovery path moves from mission context to capability evidence, then to company context and action.",
        steps: [
          "Choose Use Case, Domain, Or Company",
          "Review Targets And Clusters",
          "Apply Filters",
          "Open Capability",
          "Check Evidence And Signals",
          "Open Briefing",
          "Save Shortlist",
          "Open Company For Context",
          "Decide: Engage, Validate, Monitor"
        ]
      }
    ]
  },
  {
    slug: "use-case-discovery",
    title: "Use Case-Led Discovery Guide",
    summary: "How to read the Use Case page and move from landscape awareness to action.",
    purpose:
      "Use this page when you need to understand how the main discovery screen is organized and how to interpret each section quickly.",
    keyTerms: [
      {
        term: "Recommended Actions",
        definition:
          "A directional, derived layer that answers what to do first using current ranking and pathway logic."
      },
      {
        term: "Top Engagement Targets",
        definition:
          "The highest-priority capabilities for the selected Use Case based on current scoring and evidence."
      },
      {
        term: "Maturity distribution",
        definition:
          "The Build / Validate / Scale breakdown across the current Use Case landscape."
      }
    ],
    sections: [
      {
        title: "Why Use Cases remain valuable",
        body:
          "Use Cases keep discovery aligned to a public-priority mission or enabling need, but users can also start from Domains or Companies when the question begins there."
      },
      {
        title: "How to read the page",
        bullets: [
          "Start with Mission Brief to understand the owner, decision, context, outcome, and procurement path.",
          "Check Policy Alignment to see which public sources support the priority claim.",
          "Start with Recommended Actions for a fast directional read.",
          "On desktop, use the target table to compare rank, company, pathway, score, freshness, and why-now context.",
          "Use Top Engagement Targets to identify who deserves immediate attention.",
          "Use clusters to understand what types of capabilities exist.",
          "Use maturity distribution to understand whether the space is mostly early, mid, or late stage.",
          "Use filters to narrow the view without losing the broader mission context."
        ]
      },
      {
        title: "How to handle derived summaries",
        body:
          "Derived sections are useful for orientation and prioritization, but they should be paired with the target cards and evidence panels before a user treats them as decision-ready."
      },
      {
        title: "How to handle coverage gaps",
        body:
          "If an official priority does not yet have enough credible capability and company coverage, the app should name it as a gap rather than creating an empty active Use Case."
      }
    ],
    watchFor: [
      "Use-case realism depends on the mapped evidence base, not just the importance of the policy theme.",
      "Top targets should guide attention, not replace judgment.",
      "Filters help reduce noise, but over-filtering can hide nearby alternatives worth comparing.",
      "Clusters explain the landscape shape; they are not a substitute for record-level evidence."
    ],
    related: ["first-walkthrough", "concepts", "bd-validation-workflow", "trust-and-review"],
    diagrams: [
      {
        title: "App Navigation Map",
        description:
          "This is the core route sequence for the current MVP workflow.",
        steps: [
          "Home / App",
          "Use Cases",
          "Domains",
          "Companies",
          "Use Case Detail",
          "Use Case Briefing",
          "Shortlists",
          "Capability Detail",
          "Company Detail",
          "Review Queue",
          "Admin Enrichment"
        ]
      }
    ]
  },
  {
    slug: "bd-validation-workflow",
    title: "BD Validation Workflow",
    summary: "How to move from a mission question to a defensible target shortlist.",
    purpose:
      "Use this page when you are preparing a BD, engagement, or leadership conversation and need to explain who to engage first, why now, what is uncertain, and what should happen next.",
    keyTerms: [
      {
        term: "Use Case Briefing",
        definition:
          "A meeting-ready page that condenses the mission brief, top targets, why-this reasoning, evidence posture, freshness, and ecosystem gaps."
      },
      {
        term: "Shortlist",
        definition:
          "A shared working list of selected companies or capabilities with lightweight status, owner, next step, due date, and rationale."
      },
      {
        term: "Why this target now",
        definition:
          "Derived decision support that explains why a target deserves near-term attention based on current mappings, evidence, maturity, and mission fit."
      },
      {
        term: "Why not others",
        definition:
          "A comparative read that helps users understand tradeoffs and avoid treating a ranked list as a black box."
      },
      {
        term: "Coverage gap",
        definition:
          "A visible weakness in the current ecosystem picture, such as thin cluster depth, stale evidence, weak Scale-stage coverage, or geography concentration."
      }
    ],
    sections: [
      {
        title: "Recommended live demo path",
        bullets: [
          "Start at the app home page and open Arctic Domain Awareness from the featured demo path.",
          "Use the Use Case detail page to explain the mission brief, policy alignment, top targets, and evidence posture.",
          "Open the Use Case Briefing page to compare the top 3-5 targets without opening every record.",
          "Call out which parts are source-backed fact, derived analysis, and suggested next step.",
          "Save one or more targets to a shortlist and add owner, status, next step, due date, and rationale.",
          "Close by reviewing the gaps so the conversation includes uncertainty, not just recommendation."
        ]
      },
      {
        title: "How to read a briefing target",
        bullets: [
          "Start with why-this and why-now to understand the engagement case.",
          "Use strength and limitation together; a strong target can still be immature, narrow, stale, or under-cited.",
          "Treat suggested next steps as working hypotheses for validation, not as instructions to execute blindly.",
          "Use the evidence posture and freshness labels before taking the recommendation into a leadership conversation."
        ]
      },
      {
        title: "How shortlists should be used",
        bullets: [
          "Use Watch when a target is relevant but not ready for action.",
          "Use Validate when the next step is evidence, fit, or stakeholder confirmation.",
          "Use Engage when the target is strong enough for active follow-up.",
          "Use Hold when the target is not currently a priority but should not be lost.",
          "Keep rationale short and concrete so another user can understand the decision later."
        ]
      },
      {
        title: "What to validate with BD users",
        bullets: [
          "Can they explain the top targets faster than with their current workflow?",
          "Do the why-this and why-not-others reads feel useful or too generic?",
          "Does visible evidence and uncertainty increase trust?",
          "Does the shortlist preserve enough institutional memory to be worth maintaining?",
          "What downstream action should be supported next: outreach prep, challenge design, leadership brief, supplier discovery, or monitoring?"
        ]
      }
    ],
    watchFor: [
      "Do not present derived analysis as source-backed fact.",
      "Do not treat a shortlist as a CRM pipeline; it is a lightweight decision memory layer.",
      "Do not hide weak evidence, stale records, or coverage gaps to make the demo feel cleaner.",
      "Do not broaden to more Use Cases until the first validation path proves that users value the recommendation workflow."
    ],
    related: ["use-case-discovery", "first-walkthrough", "concepts", "trust-and-review"],
    diagrams: [
      {
        title: "BD Validation Path",
        description:
          "The intended validation path closes the loop from mission context to defensible follow-up.",
        steps: [
          "Open Use Case",
          "Read Mission Brief",
          "Open Briefing",
          "Compare Top Targets",
          "Inspect Evidence And Gaps",
          "Save Shortlist",
          "Assign Next Step",
          "Capture Feedback"
        ]
      }
    ]
  },
  {
    slug: "trust-and-review",
    title: "Editing, Review, And Trust Model",
    summary: "How records are edited, reviewed, refreshed, and governed in the MVP.",
    purpose:
      "Use this page when you need to understand what happens after an edit, how AI suggestions work, or how to challenge questionable content.",
    keyTerms: [
      {
        term: "Live edit",
        definition:
          "A lower-impact change that can save immediately while still creating audit history."
      },
      {
        term: "Review-triggering change",
        definition:
          "A higher-impact change that becomes a pending request before it can become live."
      },
      {
        term: "AI suggestion",
        definition:
          "A reviewable suggestion produced by enrichment and never published directly."
      }
    ],
    sections: [
      {
        title: "How governance works",
        bullets: [
          "Low-impact edits may save live with audit logging.",
          "Higher-impact changes create a review request with before and after values.",
          "Reviewers approve or reject those changes before live data is updated."
        ]
      },
      {
        title: "How refresh requests work",
        body:
          "A refresh request signals that a record should be rechecked or re-enriched. It is a governance action, not a direct content change."
      },
      {
        title: "How AI suggestions work",
        bullets: [
          "Admins queue enrichment runs from the enrichment page.",
          "The worker creates reviewable suggestions rather than updating live records directly.",
          "Reviewers can inspect AI origin, worker summary, and supporting evidence before approval."
        ]
      }
    ],
    watchFor: [
      "A suggestion in the review queue is not live data yet.",
      "AI-derived content should always be checked against visible evidence and citations.",
      "If a record is missing citations, treat it as lower-confidence until evidence is attached."
    ],
    related: ["concepts", "first-walkthrough", "use-case-discovery", "bd-validation-workflow"],
    diagrams: [
      {
        title: "Edit And Review Flow",
        description:
          "Higher-impact changes route through review so the live dataset stays defensible.",
        steps: [
          "User edits record",
          "Low impact or high impact?",
          "Save live or create review request",
          "Reviewer inspects diff",
          "Approve or reject",
          "Publish to live data if approved"
        ]
      },
      {
        title: "AI Enrichment Flow",
        description:
          "AI is assistive and reviewable. It does not publish directly into the live dataset.",
        steps: [
          "Admin queues enrichment run",
          "Run enters AI queue",
          "Worker processes run",
          "AI generates suggestion",
          "Suggestion enters review queue",
          "Reviewer approves or rejects",
          "Live record updates only after approval"
        ]
      }
    ]
  }
];

export function getHelpPage(slug: string) {
  return helpPages.find((page) => page.slug === slug) ?? null;
}
