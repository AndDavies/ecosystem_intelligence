# AGENTS

Status: canonical project entry point
Owner: Andrew Davies
Last reviewed: 2026-09-12

True North Map is the production Canadian defence capability-discovery service at https://truenorthmap.ca. Production Supabase `facoactpdckkhciamflk` owns runtime records, taxonomy, review and publication. Local artifacts, screenshots and historical documents are not current production proof.

Use the [Codex Workflow Contract](context/governance/Codex%20Workflow%20Contract.md) once per material task for execution, workspace safety, checks and maintenance. Reuse it across skills. Read only the affected references below; there is no mandatory product/status/security reading stack.

## Task routing

| Task | Read when needed |
| --- | --- |
| Product intent, vocabulary or scope | [Overview](context/governance/True%20North%20Map%20Project%20Overview.md); [PRD](context/governance/PRD.md) for acceptance requirements |
| Current priorities or operational claims | [Status](context/governance/Project%20Status.md); verify live state only when the authorized task depends on it |
| Research | Installed `.agents/skills/tnm-autonomous-research/SKILL.md`; [Research interface](context/governance/Research%20Agent%20Schema%20And%20Source%20Contract.md) for application compatibility |
| Checks or shared-system changes | [Cross-System Contract](context/governance/Cross-System%20Change%20And%20Regression%20Contract.md) |
| Review, Publish, access or privacy | [Admin contract](context/governance/Admin%20Workflow%20And%20Data%20Contract.md), [Access matrix](context/governance/Access%20And%20Privacy%20Matrix.md) |
| Release or migration | [Release Runbook](context/governance/Production%20Release%20Runbook.md) |
| UI, public copy or assets | [Brand System](content/brand/True%20North%20Map%20Brand%20System.md), including component grids and grouping |
| Other workflow, provider or specialist reference | [Workflow directory](context/governance/Skills%20And%20Automation%20Map.md) or [Governance index](context/governance/INDEX.md) |

## Essential boundaries

- Preserve Andrew's selected model and effort. Do not introduce a research API executor, agents, plugins or configuration to enforce a model choice.
- Genuine research ends with guarded private Admin Review intake, not a local file. Continue authorized assembly and intake without another approval; human acceptance and separate Publish remain mandatory. Canonical repairs require individual review/publication.
- Signals has its own narrowly isolated editorial publication authority. North Signal preparation and visibility do not acquire campaign, outreach or core-record publication authority.
- Keep secrets, installed private skills, raw provider/source material and ignored working evidence out of Git. Preserve unrelated work and research recovery artifacts. Create collateral only when requested.
- A proposal is not an adopted requirement; historical approval is not current authorization. Use the [existing plans mechanism](context/governance/plans/README.md) for multi-session work.
