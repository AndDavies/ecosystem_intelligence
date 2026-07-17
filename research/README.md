# Research

This area contains the evidence pipeline and research context, separate from application source code.

- `source-book/` contains reusable sources, newsletter tracking, and search guidance.
- `ingestion/` contains source leads, candidate batches, schemas, review packets, reports, and promotion logs.
- `analysis/` contains longer-form market and competitive research.

Research remains review-first. Candidate records are validated here before explicit promotion into canonical production tables or the clean `app/supabase/seed.sql` snapshot. Agents never publish autonomously.

Run research workflow commands from the project root or from `app/`; the root commands forward to the application package.
