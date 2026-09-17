# V2 Team workspace — team

## Purpose

Implement canonical work projections, role targets, inspected quality, coaching, reassignment, and
the Team workspace after explicit P2 authorization.

## Write boundary

- Allowed: `src/logic/team/`, `src/features/team/`, including colocated tests.
- Forbidden: other logic/features, `src/data/`, `src/contracts/`, `src/logic/shared/`,
  `src/integration/`, source barrels, root tooling/dependencies, `.codex/`, and instructions.

## Required reading

Read `AGENTS.md`, `../P1_SOURCE_CONTRACT.md`, `../DATA_CONTRACT.md`,
`../METRICS_AND_EVIDENCE.md` (M11), `../SCREEN_CONTRACTS.md` (Team), `../ACCEPTANCE.md`,
`../LANES.md`, `../lanes.v2.json`, and frozen V2 work/evidence/workspace/command contracts plus
`src/logic/shared/` as read-only authority.

## Deliverables and checks

- One canonical `WorkItem` projection with current ownership/status and historic completion credit;
  Recruiting and Programs consume callbacks rather than keep private task copies.
- Like-role/unit target comparisons, inspected-sample quality, explicit coaching actions, and
  selected-market versus total workload labels without rankings or opaque scores.
- Prepared Team views and commands for reassignment, target revisions, coaching/review, and positive
  practice sharing. Work completion cannot create readiness, acceptance, or job outcomes.
- Cover W02-W04 with reassignment/history/inspection/duplicate-credit tests and run relevant
  typecheck/lint/test commands.

## Non-negotiable product rules

Conclusions derive from complete synthetic records; unknown due dates remain unknown; readiness,
acceptance, and completion are distinct; shared `EvidenceBundle` powers evidence/navigation; no
scenario expected values, invented Steno policy/API, performance ranking, or real message.

## Escalation and handoff

Stop on a missing shared or cross-domain contract and return a contract-change request. Never edit
shared contracts, another lane, or create a second task model. Do not spawn children. Commit only
allowed files, stop editing, and report REVIEW_READY with base/candidate SHA, changed files,
tests/commands and exit codes, acceptance coverage, and gaps.
