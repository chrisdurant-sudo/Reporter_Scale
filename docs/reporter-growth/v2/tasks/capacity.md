# V2 capacity and Markets workspace — capacity

## Purpose

Implement request-slot demand, coverage/matching rules, acceptance validation, goal evidence, and the
Markets workspace after P2 authorization. Do not start from this routing brief alone.

## Write boundary

- Allowed: `src/logic/capacity/`, `src/features/markets/`, including colocated tests.
- Forbidden: other logic/features, `src/data/`, `src/contracts/`, `src/logic/shared/`,
  `src/integration/`, source barrels, legacy Improvements, root tooling/dependencies, `.codex/`, and
  instructions.

## Required reading

Read `AGENTS.md`, `../P1_SOURCE_CONTRACT.md`, `../DATA_CONTRACT.md`,
`../METRICS_AND_EVIDENCE.md` (M01-M05 and M13), `../SCREEN_CONTRACTS.md` (Markets),
`../DEMO_STORY.md`, `../scenario_contract.json`, `../ACCEPTANCE.md`, `../LANES.md`,
`../lanes.v2.json`, and frozen V2 demand/evidence/workspace/command contracts plus
`src/logic/shared/` as read-only authority.

## Deliverables and checks

- Pure request classification for confirmed, possible-match, no-verified-ready-match, and
  requirements-unknown, with shared-candidate contention and exact evidence/navigation filters.
- Acceptance validation preserves availability, verification, scope, overlap, and one accepted
  reporter per slot. Offered/proposed is not accepted.
- Markets prepared views and interactions derive from source records; saved goals cannot change
  coverage, readiness, or outcomes.
- Cover S01-S06, M01, M02, M07, and M09 with altered-record/negative tests and run relevant
  typecheck/lint/test commands.

## Non-negotiable product rules

Demand is distinct request slots, not people/hours/options. Unknown remains unknown; readiness,
acceptance, and completion are separate; all `Why this?`/`Open the work` paths use the shared
`EvidenceBundle`; no scenario-oracle totals, invented Steno rules, real APIs, or real messages.

## Escalation and handoff

Stop on a missing shared contract and return a contract-change request naming producer, consumers,
compatibility impact, and needed test. Never edit shared contracts or another lane. Do not spawn
children. Commit only allowed files, stop editing, and report REVIEW_READY with base/candidate SHA,
changed files, tests/commands and exit codes, acceptance coverage, and gaps.
