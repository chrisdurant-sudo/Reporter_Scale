# V2 Reporters network workspace — network

## Purpose

Implement the ready reporter-network view, explicit availability/preferences, capability and recent
work projections, re-engagement actions, and Reporters workspace after P2 authorization.

## Write boundary

- Allowed: `src/logic/network/`, `src/features/reporters/`, including colocated tests.
- Forbidden: other logic/features, `src/data/`, `src/contracts/`, `src/logic/shared/`,
  `src/integration/`, source barrels, root tooling/dependencies, `.codex/`, and instructions.

## Required reading

Read `AGENTS.md`, `../P1_SOURCE_CONTRACT.md`, `../DATA_CONTRACT.md`,
`../METRICS_AND_EVIDENCE.md` (M03, M05, M08, M10), `../SCREEN_CONTRACTS.md` (Reporters),
`../DEMO_STORY.md`, `../ACCEPTANCE.md`, `../LANES.md`, `../lanes.v2.json`, and frozen V2
people/demand/work/evidence/workspace/command contracts plus `src/logic/shared/` as read-only.

## Deliverables and checks

- Separate readiness, verified capability, bounded availability, commitments, recent work, and
  service-market scope; all-market people counts deduplicate by reporter ID.
- Unknown/expired/unavailable/mismatch states remain distinct. No notes parsing, inferred travel,
  attrition label, or universal Active badge.
- Prepared Reporters views, exact evidence navigation, availability confirmation, and canonical
  re-engagement task callbacks without private task storage.
- Cover D04, D05, M03, M08, and W01 with overlap/boundary/negative tests and run relevant
  typecheck/lint/test commands.

## Non-negotiable product rules

Unknown stays unknown; readiness, acceptance, completion, and recent work are distinct; matching
options are not guaranteed capacity; shared `EvidenceBundle` powers evidence/navigation; no scenario
expected values, invented Steno policy/API, quality score, or real message.

## Escalation and handoff

Stop on a missing shared or cross-domain contract and return a contract-change request. Never edit
shared contracts, Capacity rules, Team work, or another lane. Do not spawn children. Commit only
allowed files, stop editing, and report REVIEW_READY with base/candidate SHA, changed files,
tests/commands and exit codes, acceptance coverage, and gaps.
