# Security And Reliability Remediation Log

Status: active operating register

Owner: Andrew Davies

Last reviewed: 2026-07-26

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
| SEC-2026-001 | Production dependency audit reported 24 high, 31 moderate, and five low findings | Next.js 15.5.15, a nested Sharp 0.34.3 copy, vulnerable transitive PostCSS and WebSocket versions, and the `shadcn` CLI in runtime dependencies | Updated Next.js and its ESLint contract to 15.5.22, Sharp to 0.35.3, moved `shadcn` to development-only, and pinned patched Sharp, PostCSS, WebSocket, and Babel transitive versions | `pnpm audit --prod` must report zero known production vulnerabilities; tests, lint, clean build, launch crawl, and deployment smoke must pass | Resolved in source; production verification pending |
| REL-2026-001 | A capability route produced a transient production 500 while loading public citations | Every dossier originally loaded all public citations. Production verification then showed the citation RLS policy could still time out while checking scoped IDs. | Build citation targets only from published organizations, technologies, reviewed matches, funding events, and public needs. Hydrate those exact IDs through the server-only database client, require public-approved evidence and sources, and process bounded batches sequentially. The service credential never leaves the server. | Targeted loader tests, repeated affected-route requests, full canonical crawl, clean build, and production-log review with no citation statement timeout | Repair refined after production verification; final deployment verification pending |
| PRIV-2026-001 | Public organization responses exposed internal demand-match reviewer rationale | The public `AtlasDemandMatch` model reused the database editorial field and Ask True North included it in its catalogue and search text | Removed rationale from the public database projection, public TypeScript contract, deterministic search corpus, AI catalogue, and every public serializer that derives from the shared contract; retained private admin/candidate rationale separately | Contract tests, public API inspection, Ask catalogue test, exports/route regression, and production response scan for private reviewer phrases | Resolved in source; production verification pending |

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
| REL-2026-004 | Medium | The launch crawler retries one server failure but its final summary can hide the recovered failure | Record retries as warnings with first status/error, include them in the report, and fail or require review above a defined threshold | Controlled transient fixture and production crawl | Planned |
| OPS-2026-001 | Medium | The older primary worktree is behind production and contains intentional uncommitted research and visibility work, creating accidental-release risk | Continue release work only from a clean production-aligned worktree; reconcile the research stream deliberately after launch without using `git add .` | Worktree and diff review before every release | Active control |
| OPS-2026-002 | Low | July 19 test submissions, connection, and contact records pollute administrator launch metrics | Close or label the known fixtures through the ordinary admin workflow; preserve audit history | Live queue review | Planned before outreach |
| OPS-2026-003 | Low | Legacy screenshots and demo media remain tracked near the approved Phase 2 kit | Move historical assets to a clearly marked archive or remove them in a dedicated collateral cleanup | Launch-package link review | Planned |
| OPS-2026-004 | Low | The broader-release checklist had not been reconciled with completed Phase 2 work | Keep gate state current and link every checked item to dated validation evidence | Release-owner review | In progress |
| ACC-2026-001 | Low | Mobile navigation does not expose the active route with `aria-current` | Match the desktop navigation state contract | Mobile keyboard and screen-reader smoke | Planned |
| COPY-2026-001 | Low | “Source-backed fact” and “Public-source fact” both appear in the public evidence language | Select one canonical public label and update the presentation dictionary and legend only | Public-copy test and route scan | Planned |
| COPY-2026-002 | Low | The homepage public-evidence eyebrow can render without a visible word space in the accessibility tree | Correct the presentation markup without changing the section content | Desktop/mobile snapshot and public-copy test | Planned |
| ASSURANCE-2026-001 | Medium | Current assurance is strong application testing and configuration review, not an independent penetration test, complete SAST/DAST program, SBOM, or supply-chain attestation | Add automated code/dependency scanning and an SBOM first; commission an independent assessment when audience, sensitivity, or organizational adoption warrants it | Broader institutional adoption or material architecture change | Planned |

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

## Audit history

- **2026-07-26 pre-launch audit:** no evidence of compromise or private personal-data exposure was found. RLS was enabled on all exposed public-schema tables, anonymous access to private candidate and telemetry tables was denied, Storage boundaries and security headers were present, public invalid requests failed safely, and retention cleanup was active. The audit identified SEC-2026-001, REL-2026-001, and PRIV-2026-001 as launch blockers and recorded the remaining items above for deliberate follow-up.
