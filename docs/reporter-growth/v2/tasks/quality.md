# V2 integrated quality — quality

## Purpose

Author and run independent cross-workspace acceptance/browser tests only after the coordinator has
assembled one fixed integrated candidate. Quality is not part of the initial seven-worker wave.

## Write boundary

- Allowed: `tests/acceptance/`, `tests/e2e/`.
- Forbidden: every production path, colocated domain tests, `src/contracts/`, `src/integration/`,
  configuration, source barrels, root tooling/dependencies, `.codex/`, and instructions.

## Required reading

Read `AGENTS.md`, `../P1_SOURCE_CONTRACT.md`, every V2 product/data/metrics/screen/scenario contract,
`../ACCEPTANCE.md`, `../LANES.md`, `../lanes.v2.json`, the frozen source contracts, and the exact
integrated candidate diff. Treat expected scenario facts as independent test oracles only.

## Deliverables and checks

- Cross-workspace tests for S01-S08, M02, and U06 plus the mandatory reconciliation examples.
- Browser checks for keyboard/focus return, exact evidence drill-down, persistent filters, narrow and
  wide layouts, action feedback, disclosure, reset/replay, and prohibited real calls/messages.
- Derive assertions from altered source records and meaningful negative cases; do not assert the same
  hard-coded totals used to render a page or skip failures to create a false green result.
- Record exact candidate SHA, commands, exit codes, environment limits, failures, and evidence.

## Non-negotiable product rules

Unknown remains unknown; readiness is not acceptance or completion; demand is request-slot based;
`Why this?` and `Open the work` share `EvidenceBundle`; no runtime scenario-oracle injection, invented
Steno system/policy, real message, or external write.

## Escalation and handoff

Report every production defect to the coordinator and owning lane. Do not repair production code,
change shared contracts/configuration, weaken assertions, or spawn children. Commit only allowed test
files, stop editing, and report REVIEW_READY/BLOCKED with base/candidate SHA, changed files, exact
tests/commands and exit codes, acceptance coverage, defects, and gaps.
