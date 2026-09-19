# P4 synthetic sample expansion — data

> September 18 amendment: read `../P4_INTERVIEW_IMPROVEMENT_PLAN.md` and `../ASTRA_COORDINATOR_HANDOFF.md` before dispatch. IP01–IP12 supplement acceptance; changed presentation requirements supersede older instructions here. The completed 50-person expansion is not repeated. The new pass requires its own recorded implementation start and revised visual proof. Model routing comes from the current registry.

## Purpose

The original 50-person expansion and SD01–SD07 are complete. Preserve the people, IDs, market distribution, scenario anchors, cohorts and source-derived histories. Do not add another 50 people.

The authorized interview pass uses this same single brief for the approved IC07/IC08 requests in `P4_INTERVIEW_CONTRACT_DELTAS.md`: realistic linked Team work and safe versioned browser-local persistence. Start only from the coordinator's exact frozen contract commit after runtime routing and dispatch checks pass. Data runs alone before presentation.

## Required reading

Read `AGENTS.md`, `docs/reporter-growth/v2/P4_SYNTHETIC_SAMPLE_EXPANSION.md`,
`docs/reporter-growth/v2/P4_DESIGN_LOCK.md`, `docs/reporter-growth/v2/P4_ACCEPTANCE.md`,
`docs/reporter-growth/v2/DATA_CONTRACT.md`, `docs/reporter-growth/v2/METRICS_AND_EVIDENCE.md`,
`docs/reporter-growth/v2/DEMO_STORY.md`, the frozen V2 contracts, and the exact dispatch baseline.

## Write boundary

Allowed: `src/data/` and colocated data tests only.

Forbidden: `src/features/`, `src/ui/`, `src/shell/`, `src/styles/`, `src/logic/`, `src/contracts/`,
`src/integration/`, dependencies, configuration, instructions, scenario contracts, and every other
path. Do not spawn children.

## Required result

- Preserve every existing reporter/case identity and SD01–SD07; no repeated population expansion.
- Supply approximately 20–30 useful total linked work items, governed by scenario coverage: assigned/unassigned, blocked, overdue, completed, multiple markets, inspected quality, coaching follow-through and specific partner deliverables. Never store computed workload, SLA, performance or chart conclusions.
- Populate the approved optional work priority/history/notes and process step owner/SLA/exception fields with source-backed synthetic facts. Existing process/enrollment versions remain historically accurate; preserve cohort membership and outcome counts.
- Implement the injected storage adapter in the existing V2 repository, preserving its current default memory behavior and method contracts. Use the coordinator's versioned envelope/key, validate before use, preserve invalid/incompatible saved bytes until explicit recovery, and retain current state if a storage write fails.
- Persist snapshot revision, scenario clock, replay IDs and all canonical edits; deterministic explicit reset replaces only the V2 interview namespace. Do not access v1 storage or change lifecycle/outcome facts through repository operations.
- Validate optional fields and append-only histories, completion evidence references, timestamps, unique command-linked note/edit IDs and process-step constraints. Unknown remains unknown.
- Add focused data tests for persistence across repository reconstruction, storage read/write failure, incompatible/invalid data preservation, stale revisions, reset/replay, record integrity and all protected SD01–SD07 properties. Do not claim UI refresh behavior from repository tests alone.

No presentation, domain calculations, contract, integration or configuration edits. Return a bounded request if the frozen schema is insufficient.

## Handoff

Run focused data tests plus typecheck, lint, the full unit suite, build, and `git diff --check`.
Commit only allowed paths, stop editing, and return `REVIEW_READY` with base/candidate SHA, changed
files, commands and exit codes, SD coverage, exact added counts, and remaining gaps. Do not self-merge.
