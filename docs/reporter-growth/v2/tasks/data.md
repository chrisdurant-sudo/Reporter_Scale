# V2 synthetic records and repository — data

## Purpose

Build complete fictional V2 source records, the isolated scenario feed, validation, and deterministic
repository/reset behavior after P2 is explicitly authorized. This brief does not authorize work now.

## Write boundary

- Allowed: `src/data/`, including colocated tests.
- Forbidden: all features, all domain/shared logic, `src/contracts/`, `src/integration/`, source
  barrels, root tooling/dependencies, `.codex/`, instructions, and every other lane path.

## Required reading

Read `AGENTS.md`, `../P1_SOURCE_CONTRACT.md`, `../DATA_CONTRACT.md`, `../DEMO_STORY.md`,
`../scenario_contract.json`, `../METRICS_AND_EVIDENCE.md`, `../ACCEPTANCE.md`, `../LANES.md`,
`../lanes.v2.json`, and all frozen contracts under `src/contracts/v2/`, especially snapshot,
repository, scenario, IDs, references, and provenance.

## Deliverables and checks

- Complete differentiated synthetic histories for five markets, explicit verification/availability,
  unassigned demand, assignment history, outcomes, work, enrollments, goals, and process evidence.
- Future feed records remain outside current collections until applied. Expected checkpoint facts are
  test oracles only, never values copied into runtime records.
- A validated cloned-state repository with revision/idempotency protections and deterministic reset;
  do not fabricate V1 history or overwrite user data.
- Cover D01-D06 with focused tests, including broken references, time/order conflicts, replay, stale
  revision, mutation isolation, and reset; run relevant typecheck/lint/test commands.

## Non-negotiable product rules

Store source facts, not conclusions. Unknown stays unknown; readiness, acceptance, and completion are
separate; one demand record is one reporter slot; no real identities, systems, APIs, policies, or
messages; all facts carry synthetic provenance.

## Escalation and handoff

If a shared schema, repository, scenario, ID, or command contract is missing, stop and return a
contract-change request. Do not edit shared contracts or implement domain calculations. Do not spawn
children. Commit only allowed files, stop editing, and report REVIEW_READY with base/candidate SHA,
changed files, tests/commands and exit codes, acceptance coverage, and gaps.
