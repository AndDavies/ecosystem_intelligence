# Ask True North: Jev selection

Status: release candidate; disabled by default. Owner-authorized production baseline testing; semantic quality and public activation remain unverified.

## Boundaries and configuration

The existing `/api/discover` quota reservation precedes `runAtlasAssistant`. Ordinary map search never calls Jev. The answering model and its 20-second timeout are unchanged. The Jev selection stage has its own five-second total deadline and US$0.05 input budget. Whole-stage failure returns the old lexical selection, not a partially scored subset. Final answer validation is restricted to the actual supplied organization/capability catalogue.

Set secrets only in ignored `app/.env.local` for local use and Vercel server environment variables for a separately approved release. Never use a `NEXT_PUBLIC_` prefix or put a key in a command, fixture, log or chat.

| Variable | Values / behaviour |
| --- | --- |
| `TYPESAFE_API_KEY` | Server-side TypeSafe key; separate local evaluation and production keys recommended. |
| `ASK_JEV_MODE` | Unset/`disabled`: no TypeSafe calls. `owner-pilot`: existing server-verified admin owner only. `enabled`: quota-authorized Ask users. Unknown values fail disabled. |

The model is pinned to `jev-1.13.0` and rubric `tnm-relevance-v1`; owner-selected Codex and OpenAI answering models are not changed. Price assumption: US$0.042 per million input tokens, outputs free, checked September 18, 2026. Reconfirm pricing/limits before activation or model upgrades. No database migration, vector extension, new service or schedule is required.

## Selection and budget

`src/lib/atlas/assistant-jev.ts` explicitly projects public identity, role, location and offering fields from the already loaded snapshot. Each capability stays a separate complete record, with organization context repeated. Sparse organizations still receive an identity/description record. No private profile blob, finance or editorial narrative is sent. Qualifications are not truncated: an indivisible record exceeding context limits causes complete fallback.

Score evaluates every record with four descriptive levels, then keeps the best offering per organization. Batch size is at most 24, concurrency four, with adaptive byte-bounded packing below the 32k state/longest-question and 64k total context limits. Stable record IDs are explicitly named in question instructions; response key order does not matter.

The best 32 organizations receive separate Choice checks for location, role, connectivity, remote operation and availability/maturity, using only the winning variant plus its public evidence. The outcomes are supported, contradicted, not established and not requested. This bounded dimension set is not exhaustive requirement verification. Raw Jev confidence is neither a publication gate nor an evidence rating.

Final ordering uses descending integer relevance band (`floor(score)`), fewer contradictions, more supported dimensions, descending score, then lexical baseline rank. Exact full organization/legal names and the latest valid IDs in referential follow-ups are pinned, within the total 16 slots. Other requested conditions and original qualifications remain for the answering model to assess. Unknown or low-confidence constraints do not cause rejection. Jev judgments are not included as factual evidence in its prompt.

Before each phase, reserve its complete estimated request cost, including all concurrent batches. The conservative estimate uses UTF-8 serialized bytes plus framing/question allowance as an input-token upper bound, rather than characters divided by four. This is an application dispatch safeguard, not a provider billing guarantee: record actual reported usage, fail if it exceeds the allowance, and investigate any mismatch before activation. Dispatched/cancelled requests retain their reservations; incomplete usage is explicitly marked. No interactive retries. Timeouts, bad credentials, rate limits, invalid/incomplete responses and insufficient budgets all fall back. Response bodies are bounded to 256 KB. Requests cannot follow redirects with the key.

Only compact usage and fallback diagnostics go into the existing private `pilot_searches.resolved_filters.__assistant.selection` JSON. Responses, questions and scores are not duplicated there. Telemetry failure cannot authorize provider calls or invalidate a finished answer. This diagnostic field needs no schema change.

## Offline evaluation

From `app/`, using Node 24:

```
pnpm assistant:eval --offline --out=/tmp/tnm-ask-baseline.json
```

Default evaluation is offline and does not load credentials, Supabase or OpenAI. `tests/fixtures/assistant-eval/` freezes 56 public baseline projections from saved research packets and 40 questions (20 development / 20 held-out). Saved source URLs and packet hashes establish provenance, not current production verification. Missing locations and citation bindings stay missing. Synthetic transport/adversarial tests are in `tests/assistant-jev.test.ts`, separate from real-organization material.

Seed relevance labels are drafts, not human judgments. Before acceptance evaluation, have a human review relevance across the frozen corpus and supply a JSON file:

```
{
  "fixtureDigest": "digest printed by offline evaluation",
  "reviewer": "reviewer name",
  "reviewedAt": "YYYY-MM-DD",
  "completeCorpusJudgments": true,
  "grades": { "q01": { "published-organization-id": 3 } }
}
```

Include every question ID; grades range from 0 (irrelevant) to 3 (highly useful). Omitted organization IDs mean judged irrelevant, not unreviewed. `--judgments=/absolute/path.json` loads these labels. Do not tune on held-out questions.

After separate approval of the paid run, use the saved corpus (not live production):

```
pnpm assistant:eval --provider=typesafe --allow-paid --max-cost-usd=2 --out=/tmp/tnm-ask-jev.json
```

The runner reserves the full US$0.05 ceiling per question without recycling unused or uncertain billing. Forty questions require at most US$2 in reserved input cost at the pinned price. The runner refuses budgets above US$5. It calls no answering model. Add `--judgments` when human grading is ready. Reuse the saved result without further charges:

```
pnpm assistant:eval --offline --replay=/tmp/tnm-ask-jev.json --out=/tmp/tnm-ask-replay.json
```

Four comparisons use the same frozen corpus: lexical 16; reranking only those 16; lexical 32 followed by reranking; full catalogue. Counterfactual rerank arms reuse broad-pass Score judgments without Choice, explicitly isolating pool breadth rather than claiming independent narrow-context inference trials. Actual post-constraint selection is reported separately. Recall before/after the 16 cutoff and nDCG@5 are diagnostic until human labels are supplied.

The former live end-to-end evaluator remains available only with **all** `--live --allow-paid --allow-production-read` flags. It is a separate, explicitly authorized production-read/OpenAI smoke, not the development default or a substitute for the frozen relevance evaluation. Never run it as an automatic follow-up to a failed local test.

## Activation sequence and outstanding evidence

1. Keep `ASK_JEV_MODE=disabled`; run mocked local tests, typecheck and lint, preserving unrelated checkout work.
2. Obtain human relevance judgments and approval for one capped saved-corpus TypeSafe run. Reuse responses to analyze the four selection arms. Inspect disagreements and source qualifications, not model self-ratings.
3. Require held-out terminology-mismatch recall@16 improvement of at least 15 percentage points and non-decreasing overall nDCG@5. Exact name, follow-up, entity, citation, quota, privacy and deterministic-search regressions must pass.
4. Confirm account terms/retention and updated provider disclosure. TypeSafe says inputs are not used for training, but standard retention is not a fixed short window and enterprise zero retention is not assumed. Do not send public visitor queries before this is resolved.
5. After separate release authorization and normal release gates, deploy disabled and enable `owner-pilot` only. Check complete catalogue coverage and at least 95% completed semantic passes within five seconds; the small saved corpus is not proof of full-catalogue latency. Have Andrew assess actual top-five answer usefulness, false constraint suppression and whether any unsupported claim resulted. No automated numerical confidence score substitutes for that review.
6. Enable public traffic only after those gates pass. Disabling the mode restores lexical selection immediately without a migration. Monitor Jev usage/fallback separately from OpenAI; frequent budget/context fallbacks indicate that a future hybrid retriever needs its own decision, not a silent corpus cap.

No quality uplift, actual latency, billed cost, answer-quality acceptance or live deployment is claimed by the mocked/offline checks.

Sources: [TypeSafe API](https://docs.typesafe.ai/api), [models](https://docs.typesafe.ai/models), [reranking](https://docs.typesafe.ai/cookbooks/rerank_typesafe), [limitations](https://docs.typesafe.ai/model-jaggedness/jev-1.13), [privacy](https://typesafe.ai/legal/privacy-policy), [data processing](https://typesafe.ai/legal/data-processing).

## Comparing owner test rounds

Use `OPENAI_MODEL=gpt-5.6-luna` with the existing low reasoning setting, `ASK_JEV_MODE=disabled` for baseline, then `owner-pilot` for the authenticated owner round. Production environment changes require a new deployment. Keep the answering model and questions unchanged between rounds.

Vercel runtime logs emit `ask_true_north_completed` with a search ID, total server handler time (excluding platform startup/network), assistant-stage time (including selection), Jev selection time/fallback, token counts and returned public organization/capability IDs. They deliberately exclude question/answer text and account identity. Save the displayed answers separately for qualitative review; Vercel logs are not a full answer archive. Quota-rejected requests do not invoke the model and must not count as successful trials. A missing `searchId` means optional private telemetry did not persist; the compact log still records the completed request. Compare successful semantic passes separately from fallback. Jev can improve relevance while adding latency.
