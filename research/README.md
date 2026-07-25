# Research

This area contains the evidence pipeline and research context, separate from application source code.

- `source-book/` contains reusable sources, newsletter tracking, and search guidance.
- `ingestion/` contains atomic signal batches, source leads, candidate batches, schemas, review packets, reports, and promotion logs.
- `analysis/` contains longer-form market and competitive research.

Research remains review-first. New-record and existing-record refresh candidates are validated here before explicit human promotion into canonical production tables. The clean `app/supabase/seed.sql` snapshot is a test fixture, not a promotion target. Agents never publish autonomously.

The Monday discovery run expands the corpus. The weekday signal-refresh run monitors published organizations and public demand for technology, product, contract, procurement, program, financing, and relationship changes. Both routes use the same private Admin Review and Publish workflow.

The current operator guide is available as [PDF](../output/doc/true-north-map-research-pipeline-skills-operator-guide.pdf), [DOCX](../output/doc/true-north-map-research-pipeline-skills-operator-guide.docx), and [Mermaid-enabled Markdown](../output/doc/true-north-map-research-pipeline-skills-operator-guide.md). Regenerate the document from Markdown with `research/scripts/build_operator_guide.py`.

Run research workflow commands from the project root or from `app/`; the root commands forward to the application package.
