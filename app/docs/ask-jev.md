# Ask True North — lexical production baseline

Status: Jev experiment retired by Andrew on September 19, 2026. No further comparison campaign is queued.

## Production behavior

Ask uses deterministic lexical selection of up to 16 published organizations, followed by the existing `OPENAI_MODEL` (`gpt-5.6-luna`, low reasoning) answering call. Ordinary directory/map search remains deterministic. Existing quota reservation, privacy, public admission, same-entity citation checks and the answering timeout remain in force.

Retained shared improvements: cached discovery/qualification projections, fail-closed catalogue consistency, batched final evidence admission, relevant citation-field hydration with complete passages, deduplicated prompt passages, bounded database reads, and timing/token diagnostics. Missing evidence stays missing; fit and source confidence remain separate.

The answering prompt and structured schema use short request-scoped organization, capability and citation references. Code maps these exactly to admitted database IDs and validates capability/citation ownership. Unknown references or inconsistent ownership reject the answer rather than silently remove its best match or fuzzy-match an identifier. Negative conclusions concern supplied records, not the entire market. The response summary must agree with its retained matches and qualifications.

## Configuration and retired surfaces

Only the existing server-side `OPENAI_API_KEY` and `OPENAI_MODEL` are required for model inference. Supabase and quota configuration are unchanged. `ASK_JEV_MODE` and `TYPESAFE_API_KEY` are no longer read by application code. The TypeSafe adapter/cache, semantic directory action, owner comparison UI/API and paid Jev evaluator have been removed. Existing browser test exports and historical telemetry are retained; no database deletion or migration is needed.

`pnpm assistant:eval --offline` remains a local, network-free lexical diagnostic against frozen fixtures. Old paid/replay flags fail closed. No further owner comparison runs are required for this production decision.

## Decision evidence

September 19's ten-run comparison used the same 595-organization catalogue and Luna model. The shared changes reduced mean lexical server time from 9.45 to 6.04 seconds. Jev improved remote-maintenance discovery but added about 3.88 seconds per question without a clear overall delivered-answer advantage. COVE was ranked first by Jev but removed after the answer model mistyped its UUID; bounded references address that shared answer-output defect. These small trials do not establish population-wide quality or repeatability.

This file retains its historical path so dated development entries remain resolvable. Prior experiment details remain in Git history and saved evidence, not active operating instructions.
