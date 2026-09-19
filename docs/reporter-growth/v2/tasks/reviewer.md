# V2 fixed-candidate review — reviewer

> September 18 amendment: read `../P4_INTERVIEW_IMPROVEMENT_PLAN.md` and `../ASTRA_COORDINATOR_HANDOFF.md` before dispatch. IP01–IP12 supplement acceptance; changed presentation requirements supersede older instructions here. The completed 50-person expansion is not repeated. The new pass requires its own recorded implementation start and revised visual proof. Model routing comes from the current registry.

## Purpose and boundary

Perform one independent read-only review after Quality against the exact fixed integrated candidate.
There are no allowed write paths. Do not edit, format, install, commit, merge, or repair any file.

## Required reading

Read `AGENTS.md`, `../FOUNDATION_REVIEW.md`, `../P1_SOURCE_CONTRACT.md`, all V2 product/data/metrics/
screen/scenario/acceptance documents, `../LANES.md`, `../lanes.v2.json`, frozen source contracts,
Quality's exact results, and the candidate diff.

For P4, also read `../P4_DESIGN_LOCK.md`, `../P4_SYNTHETIC_SAMPLE_EXPANSION.md`,
`../design-lock/reference-manifest.md`, open its interactive reference and fixed screenshots, and
read `../P4_EXPERIENCE_REDESIGN.md` plus `../P4_ACCEPTANCE.md`. The versioned visual package governs
the presentation comparison.

## Review deliverables and checks

- Verify source-backed evidence reconciliation, identity/time boundaries, request-slot demand,
  readiness/acceptance/completion separation, migration safety, V1 preservation, and path ownership.
- Check that unknowns remain unknown, expected scenario values are not runtime data, and no real
  Steno API/policy/message or unauthorized external write was introduced.
- For P4, compare every workspace and the fixed open-control states directly with the locked visual
  package. Report unexplained composition, hierarchy, component, density, copy, or responsive
  deviations even when automated tests pass.
- Verify the gated hub-and-spoke implementation record: Overview/Funnel proof preceded specialist
  work, shared-component edits remained Lead-only, specialist paths did not overlap, and every
  specialist received Lead review against its candidate/reference screenshots before integration.
- Verify SD01–SD07 from source records and confirm the expanded population did not alter named
  scenario facts or create duplicate candidate/reporter identities.
- Report prioritized findings with exact files/lines and acceptance IDs; distinguish blockers from
  non-blocking limits. Do not redesign or expand scope.
- Report the reviewed commit, read-only commands actually run, exit codes, unavailable checks, and
  final REVIEW_READY or BLOCKED assessment.

## Escalation

Any defect goes to the coordinator and owning lane. Never modify shared contracts or production code,
and do not spawn child agents. A changed candidate invalidates this review and requires a new review.
