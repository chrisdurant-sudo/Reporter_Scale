# P4 domain support brief

> September 18 amendment: read `../P4_INTERVIEW_IMPROVEMENT_PLAN.md` and `../ASTRA_COORDINATOR_HANDOFF.md` before dispatch. IP01–IP12 supplement acceptance; changed presentation requirements supersede older instructions here. The completed 50-person expansion is not repeated. The new pass requires its own recorded implementation start and revised visual proof. Model routing comes from the current registry.

## Purpose

Provide a bounded prepared-view or command repair only when the P4 Experience owner returns a concrete
contract-change request and the coordinator explicitly dispatches the owning domain role.

Read `docs/reporter-growth/v2/P4_DESIGN_LOCK.md`,
`docs/reporter-growth/v2/design-lock/reference-manifest.md`,
`docs/reporter-growth/v2/P4_EXPERIENCE_REDESIGN.md`, `docs/reporter-growth/v2/P4_ACCEPTANCE.md`, the
request, the relevant original domain contracts, and the active routing registry before editing. The
visual package is context only; this role does not own presentation.

## Write boundary

The active registry assigns exactly one logic directory:

- Capacity: `src/logic/capacity/`
- Recruiting: `src/logic/recruiting/`
- Network: `src/logic/network/`
- Team: `src/logic/team/`
- Programs: `src/logic/programs/`

Do not edit `src/features/`, shared UI, shell, styles, data, contracts, integration, dependencies,
configuration, instructions, or another domain. Do not spawn children.

## Deliverable

Make only the requested source-backed prepared-view or command repair with domain tests. Do not add
presentation state, chart totals, copied business calculations, or shadow data to satisfy a mockup.
Return `REVIEW_READY` with base/candidate SHA, changed files, checks and exit codes, acceptance IDs,
and remaining gaps. Stop editing before handoff and do not merge.
