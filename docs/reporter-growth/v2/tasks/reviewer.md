# V2 fixed-candidate review — reviewer

## Purpose and boundary

Perform one independent read-only review after Quality against the exact fixed integrated candidate.
There are no allowed write paths. Do not edit, format, install, commit, merge, or repair any file.

## Required reading

Read `AGENTS.md`, `../FOUNDATION_REVIEW.md`, `../P1_SOURCE_CONTRACT.md`, all V2 product/data/metrics/
screen/scenario/acceptance documents, `../LANES.md`, `../lanes.v2.json`, frozen source contracts,
Quality's exact results, and the candidate diff.

## Review deliverables and checks

- Verify source-backed evidence reconciliation, identity/time boundaries, request-slot demand,
  readiness/acceptance/completion separation, migration safety, V1 preservation, and path ownership.
- Check that unknowns remain unknown, expected scenario values are not runtime data, and no real
  Steno API/policy/message or unauthorized external write was introduced.
- Report prioritized findings with exact files/lines and acceptance IDs; distinguish blockers from
  non-blocking limits. Do not redesign or expand scope.
- Report the reviewed commit, read-only commands actually run, exit codes, unavailable checks, and
  final REVIEW_READY or BLOCKED assessment.

## Escalation

Any defect goes to the coordinator and owning lane. Never modify shared contracts or production code,
and do not spawn child agents. A changed candidate invalidates this review and requires a new review.
