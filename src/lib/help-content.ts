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
      "Use this page when you need a quick definition of how the product thinks about Use Cases, capabilities, pathways, evidence, and review.",
    keyTerms: [
      {
        term: "Use Case",
        definition:
          "A mission area or problem space that acts as the main entry point for discovery."
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
      "Treat derived reads as decision support, not as direct evidence.",
      "Use pathways conservatively; if maturity is uncertain, it should not be treated as Scale."
    ],
    related: ["first-walkthrough", "use-case-discovery", "trust-and-review"]
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
          "Open the app home page and select a Use Case from the curated list.",
          "Start with Recommended Actions and Top Engagement Targets to understand what deserves attention first.",
          "Scan clusters and maturity distribution to understand what exists across the landscape.",
          "Apply filters to narrow by domain, company, pathway, geography, or defence relevance.",
          "Open a capability to inspect its why-it-matters narrative, recent signals, and mapping evidence.",
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
    related: ["concepts", "use-case-discovery", "trust-and-review"],
    diagrams: [
      {
        title: "Primary User Workflow",
        description:
          "The intended discovery path moves from mission context to capability evidence, then to company context and action.",
        steps: [
          "Select Use Case",
          "Review Targets And Clusters",
          "Apply Filters",
          "Open Capability",
          "Check Evidence And Signals",
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
        title: "Why discovery starts with Use Cases",
        body:
          "Use Cases keep the workflow aligned to a mission need or strategic problem space. This is why the product leads with mission areas rather than company search alone."
      },
      {
        title: "How to read the page",
        bullets: [
          "Start with Recommended Actions for a fast directional read.",
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
      }
    ],
    watchFor: [
      "Top targets should guide attention, not replace judgment.",
      "Filters help reduce noise, but over-filtering can hide nearby alternatives worth comparing.",
      "Clusters explain the landscape shape; they are not a substitute for record-level evidence."
    ],
    related: ["first-walkthrough", "concepts", "trust-and-review"],
    diagrams: [
      {
        title: "App Navigation Map",
        description:
          "This is the core route sequence for the current MVP workflow.",
        steps: [
          "Home / App",
          "Use Cases",
          "Use Case Detail",
          "Capability Detail",
          "Company Detail",
          "Review Queue",
          "Admin Enrichment"
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
    related: ["concepts", "first-walkthrough", "use-case-discovery"],
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
