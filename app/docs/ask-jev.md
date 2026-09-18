# Ask True North: Jev selection

Status: owner pilot; disabled by default. Owner-authorized production baseline testing; semantic quality and public activation remain unverified.

## Boundaries and configuration

The existing `/api/discover` quota reservation precedes `runAtlasAssistant`. Ordinary map search and autocomplete remain deterministic. The separate, explicitly requested “Find by meaning” action uses Jev under the same owner/public activation mode. The answering model and its 20-second timeout are unchanged. The standard Jev selection stage has a five-second total deadline and US$0.05 input budget. For the server-authenticated owner in `owner-pilot`, both application cutoffs are removed to measure full-pass latency and actual input cost. The route permits up to 300 seconds at Vercel; provider context/rate limits and transport failures still apply. This exception does not change the existing Ask daily request allowance, public `enabled` limits, or the OpenAI timeout. Whole-stage failure returns the old lexical selection, not a partially scored subset. Final answer validation is restricted to the actual supplied organization/capability catalogue.

Set secrets only in ignored `app/.env.local` for local use and Vercel server environment variables for a separately approved release. Never use a `NEXT_PUBLIC_` prefix or put a key in a command, fixture, log or chat.

| Variable | Values / behaviour |
| --- | --- |
| `TYPESAFE_API_KEY` | Server-side TypeSafe key; separate local evaluation and production keys recommended. |
| `ASK_JEV_MODE` | Unset/`disabled`: no TypeSafe calls. `owner-pilot`: existing server-verified admin owner only, with no Jev cost/deadline cutoff for baseline testing. `enabled`: quota-authorized Ask users. Unknown values fail disabled. |

The model is pinned to `jev-1.13.0` and rubric `tnm-relevance-v2`; owner-selected Codex and OpenAI answering models are not changed. Price assumption: US$0.042 per million input tokens, outputs free, checked September 18, 2026. Reconfirm pricing/limits before activation or model upgrades. No database migration, vector extension, new service or schedule is required.

## Selection and budget

`src/lib/atlas/assistant-jev.ts` explicitly projects public identity, role, location and offering fields from the already loaded snapshot. Each capability stays a separate complete record, with organization context repeated. Sparse organizations still receive an identity/description record. No private profile blob, finance or editorial narrative is sent. Qualifications are not truncated: an indivisible record exceeding context limits causes complete fallback.

Score evaluates every record with four descriptive levels, then keeps the best offering per organization. Batch size is at most 24, concurrency four, with adaptive byte-bounded packing below the 32k state/longest-question and 64k total context limits. Stable record IDs are explicitly named in question instructions; response key order does not matter.

The best 32 organizations receive separate Choice checks for location, role, connectivity, remote operation and availability/maturity, using only the winning variant plus its public evidence. The outcomes are supported, contradicted, not established and not requested. This bounded dimension set is not exhaustive requirement verification. Raw Jev confidence is neither a publication gate nor an evidence rating.

Final ordering uses descending integer relevance band (`floor(score)`), fewer contradictions, more supported dimensions, descending score, then lexical baseline rank. Exact full organization/legal names and the latest valid IDs in referential follow-ups are pinned, within the total 16 slots. Other requested conditions and original qualifications remain for the answering model to assess. Unknown or low-confidence constraints do not cause rejection. Jev judgments are not included as factual evidence in its prompt.

In standard mode, reserve each request before dispatch. Keep actual known cost plus uncertain and in-flight reservations within US$0.05. When a completed response reports usage, release only the unused part of its reservation. This replaces the overly conservative whole-catalogue preflight. `budgetPeakUsd` is the peak committed allowance; cumulative `reservedCostUsd` can exceed US$0.05 because it records every dispatched allowance before releases. Owner-pilot records those same estimates without using them to stop dispatch; actual provider tokens and estimated actual cost remain separately reported. Telemetry labels the exception `limitPolicy: owner_baseline`, while other modes report `standard`. The byte upper bound remains a conservative context-packing check in both modes. The conservative estimate uses UTF-8 serialized bytes plus framing/question allowance as an input-token upper bound, rather than characters divided by four. This is an application dispatch safeguard, not a provider billing guarantee: record actual reported usage, fail if it exceeds the allowance, and investigate any mismatch before activation. Dispatched/cancelled requests retain their reservations; incomplete usage is explicitly marked. No interactive retries. Timeouts, bad credentials, rate limits, invalid/incomplete responses and insufficient budgets all fall back. Response bodies are bounded to 256 KB. Requests cannot follow redirects with the key.

Compact usage and selection diagnostics go into the existing private `pilot_searches.resolved_filters.__assistant.selection` JSON. These include a diagnostic version, keyed query/conversation fingerprint, public catalogue and selected-catalogue fingerprints, selected public IDs, partial coverage, a bounded provider-request-ID sample and a specific failure check. No raw questions, answers, keys or provider text are copied. Invalid numeric fields and score/mean discrepancies may be logged without source text. Fingerprints compare equality only; changing the TypeSafe key changes the keyed query fingerprint. Valid provider usage is counted even when the corresponding answers are rejected; cancellation may still leave unreported billable work. Telemetry failure cannot authorize provider calls or invalidate a finished answer. This diagnostic field needs no schema change.

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

The existing offline evaluator has four comparisons using the same frozen corpus: lexical 16; reranking only those 16; lexical 32 followed by reranking; full catalogue. Counterfactual rerank arms reuse broad-pass Score judgments without Choice, explicitly isolating pool breadth rather than claiming independent narrow-context inference trials. Actual post-constraint selection is reported separately. Recall before/after the 16 cutoff and nDCG@5 are diagnostic until human labels are supplied.

The former live end-to-end evaluator remains available only with **all** `--live --allow-paid --allow-production-read` flags. It is a separate, explicitly authorized production-read/OpenAI smoke, not the development default or a substitute for the frozen relevance evaluation. Never run it as an automatic follow-up to a failed local test.

## Activation sequence and outstanding evidence

1. Keep `ASK_JEV_MODE=disabled`; run mocked local tests, typecheck and lint, preserving unrelated checkout work.
2. Obtain human relevance judgments and approval for one capped saved-corpus TypeSafe run. Reuse responses to analyze the four selection arms. Inspect disagreements and source qualifications, not model self-ratings.
3. Require held-out terminology-mismatch recall@16 improvement of at least 15 percentage points and non-decreasing overall nDCG@5. Exact name, follow-up, entity, citation, quota, privacy and deterministic-search regressions must pass.
4. Confirm account terms/retention and updated provider disclosure. TypeSafe says inputs are not used for training, but standard retention is not a fixed short window and enterprise zero retention is not assumed. Do not send public visitor queries before this is resolved.
5. After separate release authorization and normal release gates, deploy disabled and enable `owner-pilot` only. Use uncapped owner-baseline runs to measure complete coverage, latency and cost first; those runs do not satisfy the public five-second/$0.05 acceptance gate by themselves. For public activation, require at least 95% completed semantic passes within the standard limits; the small saved corpus is not proof of full-catalogue latency. Have Andrew assess actual top-five answer usefulness, false constraint suppression and whether any unsupported claim resulted. No automated numerical confidence score substitutes for that review.
6. Enable public traffic only after those gates pass. Disabling the mode restores lexical selection immediately without a migration. Monitor Jev usage/fallback separately from OpenAI; frequent budget/context fallbacks indicate that a future hybrid retriever needs its own decision, not a silent corpus cap.

No quality uplift, actual latency, billed cost, answer-quality acceptance or live deployment is claimed by the mocked/offline checks.

Sources: [TypeSafe API](https://docs.typesafe.ai/api), [models](https://docs.typesafe.ai/models), [reranking](https://docs.typesafe.ai/cookbooks/rerank_typesafe), [limitations](https://docs.typesafe.ai/model-jaggedness/jev-1.13), [privacy](https://typesafe.ai/legal/privacy-policy), [data processing](https://typesafe.ai/legal/data-processing).

## Comparing owner test rounds

Use `OPENAI_MODEL=gpt-5.6-luna` with the existing low reasoning setting, `ASK_JEV_MODE=disabled` for baseline, then `owner-pilot` for the authenticated owner round. Production environment changes require a new deployment. Keep the answering model and questions unchanged between rounds.

Vercel runtime logs emit `ask_true_north_completed` with a search ID, total server handler time (excluding platform startup/network), assistant-stage time (including selection), Jev selection time/fallback, token counts and returned public organization/capability IDs. They deliberately exclude question/answer text and account identity. Save the displayed answers separately for qualitative review; Vercel logs are not a full answer archive. Quota-rejected requests do not invoke the model and must not count as successful trials. A missing `searchId` means optional private telemetry did not persist; the compact log still records the completed request. Compare successful semantic passes separately from fallback. Jev can improve relevance while adding latency.

### September 18 owner baseline correction

Five disabled and five owner-pilot production questions used the same lexical 16-candidate path: all pilot passes stopped at the conservative budget preflight (595 organizations, 739 offering records, zero TypeSafe requests). The owner authorized removal of Jev cost/deadline cutoffs for testing. This exception is server-gated to the existing authenticated owner plus `owner-pilot`, not a request-body switch or a public-mode expansion. Keep the questions and answering model fixed; compare real `scoredOrganizations`, `batchCount`, `inputTokens`, `estimatedCostUsd`, `usageComplete` and `fallbackReason` before accepting any trial. Do not count an incomplete/fallback pass as semantic success. Provider/host failures can still prevent completion; no unlimited-completion guarantee is implied.

### September 18 response validation and diagnostic correction

The next five-question owner round made real TypeSafe requests: four complete 595-organization passes and one response-validation fallback. A targeted replay of the fifth question reproduced `score_probability_mismatch`. A saved batch replay showed separately rounded two-decimal scores and probabilities. The adapter now allows their bounded combined rounding error (0.035 plus floating-point epsilon), while retaining score/range/shape, exact answer-key, probability-mass and complete-coverage checks. Larger discrepancies still fall back with the numeric mismatch and provider request ID. This does not treat a partial catalogue as complete or imply provider judgments are facts.

A targeted post-fix selection-only check reused the saved public snapshot and completed all 595 organizations / 739 records in 67 requests, 5,426 ms, with 813,079 reported input tokens (estimated US$0.034149318) and no fallback. This is one local transport/selection check using the real provider, not a held-out relevance evaluation or a production answer-quality result. No OpenAI answer or Ask daily quota was consumed by that check. The TypeSafe dashboard had not reconciled with reported API usage; retained request IDs support investigation without assuming a cause.

For the next production round, keep `owner-pilot` and `gpt-5.6-luna` (existing low reasoning) fixed. Start each question with cleared conversation history. Compare query-context, catalogue and selected-catalogue fingerprints plus returned IDs: identical selected catalogues with different final results indicate answering-stage variation, whereas different selected IDs reveal selection variation. No deterministic LLM guarantee is made. Runtime logs additionally separate snapshot loading, authentication, quota reservation, deterministic search and telemetry time; parallel snapshot/auth durations must not be added together. These timings exclude browser/network/platform startup.


## September 18 efficiency candidate and next owner tests

`assistant-catalogue.ts` composes cached public discovery pages with narrow, cached identity/qualification pages. It loads no full national citation graph. Evidence is admitted through public organization/capability/match IDs and hydrated only for the top 32 constraint candidates and final answering set. Approved publication/source changes invalidate these caches via `atlas-public`; the daily expiry is only a recovery backstop. A mismatched publication set fails rather than claiming complete coverage. Cold evidence hydration still costs database time; the next tests must measure cold and warm cases separately.

`assistant.ts` deduplicates identical source passages but retains each field citation and entity binding. It omits unrelated full need dossiers. Semantic answers retain the winning capability and other independently scored offerings at least partially useful and within 0.25 of that winner; variants remain separate. Lexical fallback preserves its existing capability coverage. No material excerpt or qualification is truncated. Public evidence links are assembled from the same hydrated records supplied to the answering model.

Successful selections are cached privately for ten minutes, with a keyed question/conversation, catalogue, mode and rubric fingerprint, publication invalidation and per-instance in-flight coalescing. Failed/partial passes are never cached. Hit/coalesced diagnostics report zero **new** provider usage; scores are reused judgments, not another full inference pass. Fixed record ordering, payload fingerprints, top-32 scores/constraints and cutoff margin help distinguish input changes from provider variation. Caching does not make new model inference deterministic.

The directory’s explicit “Find by meaning · AI” action first applies the existing region/type/taxonomy/map-bounds filters, then unions lexical, offering/application and reviewed taxonomy/relationship ranks into at most 100 candidates. Jev scores that pool without OpenAI. It shows at most five organization links and optional explicit technology-filter buttons, labelled with candidate coverage. It never silently changes filters or calls Jev while typing. Late responses are discarded after query/filter changes. Public enabled traffic has service-backed minute/day limits; authenticated owner-pilot is uncapped. Public activation remains separately gated by evaluation and provider/privacy terms.

### Ready-to-run owner page

Open `/admin/ask-tests` after signing in as Andrew. The page is protected server-side and accepts only five fixed questions, known modes and same-origin POSTs. No work runs on page load. Each Run performs paid inference and emits `owner_ask_test_completed` without account/question/source text. It bypasses the ordinary visitor allowance **only on this owner-only test route** in `owner-pilot`; ordinary Ask quotas are unchanged. No environment changes are required between modes.

1. Run each of the five questions once in **Lexical baseline**. Record whether this was the first catalogue/evidence load after deployment.
2. Run the same five in **Full catalogue · fresh Jev**, then repeat them once to inspect selection overlap and cutoff judgments. This bypasses selection caching; catalogue/evidence caches remain active.
3. For each question run **Full catalogue · allow cache** twice. The first populates that cache; the second should report hit and zero new Jev tokens. OpenAI still runs and may vary.
4. Use **Same evidence · answer replay** on questions whose final answers differ. A signed two-hour receipt pins organization/capability IDs and the complete answering-catalogue fingerprint. Changed evidence rejects replay before OpenAI. This isolates answering variation; it is not a new selection measurement.
5. Compare **Hybrid pool · 50** and **Hybrid pool · 100** only after judging relevant organizations in the full-catalogue results. These are real narrower-context inference trials, not reused broad-pass scores. Check misses before adopting a smaller Ask pool. Ask itself continues full-catalogue selection.
6. Separately try “Find by meaning” in the directory with and without an explicit region/type filter. Confirm that direct search remains unchanged and suggested organizations satisfy the filters.

Export the page’s JSON before leaving the tab. It contains stage timings, input/output/cached tokens, reported Jev cost, coverage, fallback/cache state, selection and answer IDs, corpus/payload fingerprints and answer evidence. Compare medians and individual cold/warm cases; this small manual set does not establish p95 or the held-out recall gates. Grade useful top-five matches, missing relevant organizations, qualifications and source support. Report token counts for the existing answering model; do not estimate its dollar cost using TypeSafe’s rate. Any incomplete provider usage is a lower bound, including cancelled work. No paid evaluation was run during implementation.

Rollback: disable `ASK_JEV_MODE` to remove semantic provider calls and the directory action; Ask continues lexical selection. The cached catalogue and evidence path remain active. Reverting the application release restores the previous data path. No migration or provider configuration change is needed.
