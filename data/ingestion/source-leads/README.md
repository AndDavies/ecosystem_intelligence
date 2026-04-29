# Source Lead Batches

Place research-agent source lead batches here before converting them into candidate records.

Rules:

- Use `data/ingestion/schema/source-leads.schema.json`.
- Use canonical `https` source URLs only.
- Do not include browser citation tokens, copied report markers, or private/contact scraping.
- Run `pnpm leads:validate` before converting leads into a candidate batch.
- Approved leads can then be converted into `data/ingestion/candidate-batches/*.json`.

