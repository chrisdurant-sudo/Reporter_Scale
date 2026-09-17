# V2 Programs workspace — programs

## Purpose

Implement program cohorts/results, decisions, versioned process drafts/pilots, partner work callbacks,
and the Programs workspace after explicit P2 authorization.

## Write boundary

- Allowed: `src/logic/programs/`, `src/features/programs/`, including colocated tests.
- Forbidden: other logic/features, `src/data/`, `src/contracts/`, `src/logic/shared/`,
  `src/integration/`, source barrels, legacy `src/features/improvements/`, root tooling/dependencies,
  `.codex/`, and instructions.

## Required reading

Read `AGENTS.md`, `../P1_SOURCE_CONTRACT.md`, `../DATA_CONTRACT.md`,
`../METRICS_AND_EVIDENCE.md` (M09, M12, M13), `../SCREEN_CONTRACTS.md` (Programs),
`../DEMO_STORY.md`, `../scenario_contract.json`, `../ACCEPTANCE.md`, `../LANES.md`,
`../lanes.v2.json`, and frozen V2 programs/work/evidence/workspace/command contracts plus
`src/logic/shared/` as read-only authority.

## Deliverables and checks

- Results join explicit frozen enrollments to source/lifecycle/job evidence under one declared
  horizon; weighted counts reconcile for all-market and market subsets.
- Editable program grid, descriptive result/limit evidence, Continue/Change/Stop/Expand decisions,
  and versioned draft/review/limited-pilot processes. No action manufactures outcomes or rollout.
- Partner tasks use Team's canonical work callback; local notes never claim live collaboration.
- Cover W05-W08, M02, and M07 with cohort/filter/zero-denominator/process/no-auto-rollout tests and
  run relevant typecheck/lint/test commands.

## Non-negotiable product rules

Unknown remains unknown; readiness, acceptance, and completion are distinct; conclusions derive from
complete synthetic members; shared `EvidenceBundle` powers evidence/navigation; scenario expected
values are not runtime data; no causal claim, real Steno policy/API, or real message.

## Escalation and handoff

Stop on a missing shared or cross-domain contract and return a contract-change request. Never edit
shared contracts, Team work, legacy Improvements, or another lane. Do not spawn children. Commit only
allowed files, stop editing, and report REVIEW_READY with base/candidate SHA, changed files,
tests/commands and exit codes, acceptance coverage, and gaps.
