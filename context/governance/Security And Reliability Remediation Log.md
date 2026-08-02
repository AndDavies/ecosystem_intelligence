# Security And Reliability Remediation Log

Status: active operating register

Owner: Andrew Davies

Last reviewed: 2026-08-01

This register records security, privacy, resilience, dependency, and operational findings that require either a verified repair or an explicit disposition. It complements the release runbook and access matrix. It must not contain credentials, private evidence, raw provider payloads, personal data, or exploit details that would increase public risk.

## Severity and release rule

- **Blocker**: repair and regression-test before broader promotion.
- **High**: schedule immediately; do not defer if the condition is externally exploitable or repeatedly harms a primary journey.
- **Medium**: tracked hardening with a named verification trigger.
- **Low**: defence-in-depth or operational polish.
- **Accepted**: deliberately retained with a documented boundary and re-review trigger.

Resolved means the source repair and its regression evidence are complete. Deployed means the repaired commit has also passed the production deployment and smoke checks.

## Launch-blocking findings

| ID | Finding | Root cause | Repair | Verification | Status |
| --- | --- | --- | --- | --- | --- |
| SEC-2026-001 | Production dependency audit reported 24 high, 31 moderate, and five low findings | Next.js 15.5.15, a nested Sharp 0.34.3 copy, vulnerable transitive PostCSS and WebSocket versions, and the `shadcn` CLI in runtime dependencies | Updated Next.js and its ESLint contract to 15.5.22, Sharp to 0.35.3, moved `shadcn` to development-only, and pinned patched Sharp, PostCSS, WebSocket, and Babel transitive versions | `pnpm security:validate` reported no known production vulnerability on July 31; repaired dependencies are deployed behind the current production commit | Deployed and verified |
| REL-2026-001 | A capability route produced a transient production 500 while loading public citations | Every dossier originally loaded all public citations. Production verification then showed the citation RLS policy could still time out while checking scoped IDs. | Build citation targets only from published organizations, technologies, reviewed matches, funding events, and public needs. Hydrate those exact IDs through the server-only database client, require public-approved evidence and sources, and process bounded batches sequentially. The service credential never leaves the server. | Targeted loader tests, repeated public profile requests, canonical launch crawl, and current production health and route smoke | Deployed and verified |
| PRIV-2026-001 | Public organization responses exposed internal demand-match reviewer rationale | The public `AtlasDemandMatch` model reused the database editorial field and Ask True North included it in its catalogue and search text | Removed rationale from the public database projection, public TypeScript contract, deterministic search corpus, AI catalogue, and every public serializer that derives from the shared contract; retained private admin/candidate rationale separately | Contract tests, public API inspection, Ask catalogue test, exports and route regression, and public response scan | Deployed and verified |
| REL-2026-005 | Approved refresh candidates could not be published | The precision guard called a deliberately private helper while executing as the authenticated reviewer, so PostgreSQL denied the helper before the atomic publication began | Inlined the immutable before-record timestamp extraction inside the guarded public publication function without granting access to the private helper or changing publication authority | Versioned migration is applied in production; full release validation and human publication previously confirmed the repaired permission boundary | Deployed and verified |
| REL-2026-007 | Validated refresh candidates could not enter private Admin Review | The trusted service-role staging RPC inserted through a precision trigger that invoked the private immutable baseline parser, but `service_role` lacked execute permission on that parser; the transaction rolled back before creating a candidate | Granted only `service_role` execute on the private parser while keeping `public`, `anon`, and `authenticated` denied; no writer or publication authority changed | Live privilege matrix, guarded RPC result `staged_count=1`, pending North Vector refresh row, `pnpm research:validate`, migration tests, and the complete `pnpm release:validate` gate | Deployed and verified |

## Open hardening register

| ID | Priority | Finding and impact | Recommended repair | Verification trigger | Status |
| --- | --- | --- | --- | --- | --- |
| SEC-2026-002 | Medium | The CSP still requires `unsafe-inline` for scripts and styles, reducing protection against a future injection defect | Adopt nonce- or hash-based script policy incrementally, validate Next.js and approved providers, then remove the unsafe directive where compatible | CSP report-only trial followed by browser regression | Planned |
| SEC-2026-003 | Low | Dormant Microsoft Clarity hosts remain in the CSP even though Clarity is intentionally not part of the launch stack | Remove Clarity hosts from the active allowlist; add them back only with a reviewed consent-bound activation | Header snapshot and consent regression | Planned |
| SEC-2026-004 | Low | Responses disclose `X-Powered-By: Next.js`, providing unnecessary framework fingerprinting | Set `poweredByHeader: false` | Production-header check | Planned |
| SEC-2026-005 | Medium | `public.upsert_defence_brief` is a security-definer RPC executable by authenticated users; internal staff and reviewer checks currently fail closed | Move the operation behind a server-only admin path or revoke broad authenticated execute while preserving the exact administrator workflow | Anonymous/member/admin matrix plus brief save/publish regression | Planned |
| SEC-2026-006 | Accepted | Supabase leaked-password protection is disabled | Public login uses Google OAuth and passwordless email, so no user password is currently accepted. Enable before any password workflow, or earlier if Supabase supports it without changing the public flow | Authentication-provider change | Accepted with trigger |
| SEC-2026-007 | Medium | Authenticated submissions accept a flexible record payload and connection/submission endpoints need explicit per-account quotas | Add allowlisted fields, maximum serialized size and nesting depth, and daily per-user limits in addition to platform body limits | Malformed, oversized, repeated-request, and valid-flow tests | Planned |
| REL-2026-002 | Medium | Multiple open tabs can race refresh-token rotation and create expected `refresh_token_already_used` telemetry noise | Deduplicate the client auth-state check or add a cookie-presence fast path while keeping server authorization on `getUser` | Multi-tab sign-in/sign-out test and clean runtime logs | Planned |
| REL-2026-003 | Medium | The anonymous homepage returns private no-store HTML, limiting CDN resilience during a traffic spike | Separate the cacheable public shell/data from the client auth-state request without changing signed-in navigation | Cache-header, auth-state, personalization, and performance regression | Planned |
| REL-2026-004 | Medium | The launch crawler retried one server failure but its final summary could hide the recovered failure | The current release candidate preserves the first status or network error as a visible warning, records attempt count and recovery, and enforces a configurable recovered-failure threshold | Controlled transient fixture passes locally; production canonical crawl and release report remain required | Implemented locally; production verification pending |
| REL-2026-006 | High | A genuine stale refresh currently raises PostgreSQL `40001`, a retry-class serialization error. The July 29 failed publication produced a rapid repeated-error burst immediately before the Supabase high-CPU warning. | Change stale review-state failures to a non-retryable application validation SQLSTATE, retain the reviewer-facing stale-record message, and add a regression that proves the publication client does not retry this condition. | Controlled stale candidate, single RPC attempt, bounded rollback count, clean Vercel and PostgreSQL logs | Planned for the next hardening pass |
| OPS-2026-001 | Medium | The primary worktree is production-aligned but contains intentional uncommitted research, visibility, source-book, logo and lineage work, creating accidental mixed-commit risk | Keep releases on `main`, review exact paths before staging, commit validated research lineage separately from application/governance work, and never use `git add .` across the mixed worktree | Worktree and diff review before every release | Active control |
| OPS-2026-002 | Low | July 19 test submissions, connection, and contact records pollute administrator launch metrics | Close or label the known fixtures through the ordinary admin workflow; preserve audit history | Live queue review | Planned before outreach |
| OPS-2026-003 | Low | Legacy screenshots and demo media remain tracked near the approved Phase 2 kit | Move historical assets to a clearly marked archive or remove them in a dedicated collateral cleanup | Launch-package link review | Planned |
| OPS-2026-004 | Low | The broader-release checklist had not been reconciled with completed Phase 2 work | Keep gate state current and link every checked item to dated validation evidence | Release-owner review | Reconciled 2026-07-31; repeat before campaign |
| ACC-2026-001 | Low | Mobile navigation does not expose the active route with `aria-current` | Match the desktop navigation state contract | Mobile keyboard and screen-reader smoke | Planned |
| COPY-2026-001 | Low | “Source-backed fact” and “Public-source fact” both appear in the public evidence language | Select one canonical public label and update the presentation dictionary and legend only | `publicLanguage` dictionary, public-copy test, local route scan, and post-deployment launch crawl | Resolved locally; production verification pending |
| COPY-2026-002 | Low | The homepage public-evidence eyebrow can render without a visible word space in the accessibility tree | Correct the presentation markup without changing the section content | Desktop/mobile snapshot and public-copy test | Planned |
| ASSURANCE-2026-001 | Medium | Current assurance is strong application testing and configuration review, not an independent penetration test, complete SAST/DAST program, SBOM, or supply-chain attestation | Add automated code/dependency scanning and an SBOM first; commission an independent assessment when audience, sensitivity, or organizational adoption warrants it | Broader institutional adoption or material architecture change | Planned |
| PERF-2026-001 | Medium | Supabase reports overlapping permissive RLS policies for 32 role/action combinations. The policies are not a data-exposure finding, but each applicable policy is evaluated and the overlap can add unnecessary database work as traffic and corpus size grow. | Consolidate public-read and staff-manage policies by table without weakening row predicates. Start with organizations, capabilities, mission mappings, sources, submissions, and Defence Brief relations; verify the anonymous/member/admin matrix after each bounded migration. | Supabase performance advisor, RLS regression suite, and production query latency | Planned for the next database hardening pass |
| PERF-2026-002 | Low | Supabase reports 15 unused indexes. Young or low-volume indexes can be correct even when the advisor has not observed a scan, so deleting them now could harm future workflows. | Observe index usage across a representative launch window, classify each index by required workflow, and remove only redundant indexes through a reviewed migration. | Thirty days of production use or a sustained CPU/query-latency issue | Monitor; no deletion authorized |
| PERF-2026-003 | Low | Supabase Auth uses an absolute database-connection allocation. Increasing the compute tier alone would not proportionally expand Auth connections. | Change to percentage allocation only when an instance-size or authentication-volume change is planned, then rerun sign-in and account regression. | Compute-tier change or sustained authentication pressure | Accepted with trigger |
| PERF-2026-004 | High | A single unpaged Data API discovery read can stop at the server row limit and silently omit organizations as the corpus grows; the legacy Leaflet fallback also grouped nearby markers with quadratic scans | Page every discovery relation in deterministic 1,000-row ranges, derive collection counts from that same compact snapshot, group fallback markers by a linear-time grid, and require a 5,000-marker scale gate before release | Local paging, count-integrity, clustering, scale, build, and browser regression; production summary/atlas/marker consistency check still required | Implemented locally; production verification pending |

## Intentional advisor dispositions

- Supabase tables used only through the service role may show `rls_enabled_no_policy`. This is an intentional deny-by-default posture when anonymous and authenticated roles have no grants. Recheck grants whenever a route is added.
- Microsoft Clarity remains deferred. Its absence is not a defect and does not block launch.
- The private retention scheduler is required to honour the published 30-day detailed-event and 90-day raw-search limits. Any rollback must unschedule the job before dropping its private function; this dependency is agent-owned in the versioned rollback contract.

## Required recurring checks

Before a production release or broader promotion:

1. Run `pnpm security:validate`.
2. Run `pnpm release:validate`.
3. Inspect the public organization API for internal reviewer fields.
4. Run the low-rate canonical crawl and review recovered retry warnings as well as final failures.
5. Review Vercel build and runtime logs.
6. Review Supabase security and performance advisors and the anonymous/member/admin access matrix.
7. Record the deployed commit and rollback target in the release runbook.
8. Compare `/api/atlas/summary`, `/api/atlas?page=1&pageSize=18`, and the returned complete marker collection; any count divergence blocks promotion.

## Audit history

- **2026-07-26 pre-launch audit:** no evidence of compromise or private personal-data exposure was found. RLS was enabled on all exposed public-schema tables, anonymous access to private candidate and telemetry tables was denied, Storage boundaries and security headers were present, public invalid requests failed safely, and retention cleanup was active. The audit identified SEC-2026-001, REL-2026-001, and PRIV-2026-001 as launch blockers and recorded the remaining items above for deliberate follow-up.
- **2026-07-31 soft-beta review:** production reported healthy, the public health endpoint and primary routes returned 200, `pnpm security:validate` reported no known production vulnerabilities, and the canonical launch crawl was rerun. Supabase security advisors reported five informational deny-by-default RLS notices and two known warnings already tracked as SEC-2026-005 and SEC-2026-006. Performance advisors added the RLS-policy and index observations recorded as PERF-2026-001 through PERF-2026-003. The live response still confirmed the planned Clarity-host, framework-header, and anonymous-shell caching items.
- **2026-07-31 implementation-sequence update:** the local release candidate added deterministic complete discovery paging, same-snapshot counts, linear fallback grouping, a 5,000-marker scale gate, direct health and launch probes, and retry-warning reporting. These are source-level repairs with local regression evidence; production deployment, count consistency, cache headers, runtime logs, and the canonical crawl must still be verified before `REL-2026-003`, `REL-2026-004`, or `PERF-2026-004` can be marked deployed.
