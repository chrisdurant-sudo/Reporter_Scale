# V2 shared interface — experience

## Purpose

Build the shared five-workspace shell and reusable evidence/filter interaction surfaces after P2 is
explicitly authorized. This brief is routing authority, not present authorization to implement.

## Write boundary

- Allowed: `src/ui/`, `src/shell/`, `src/styles/`, including colocated tests.
- Forbidden: every feature directory, `src/data/`, all `src/logic/`, `src/contracts/`,
  `src/integration/`, source barrels, root tooling/dependencies, `.codex/`, instructions, and all
  other lane paths.

## Required reading

Read `AGENTS.md`, `../P1_SOURCE_CONTRACT.md`, `../PRODUCT_BRIEF.md`, `../SCREEN_CONTRACTS.md`,
`../METRICS_AND_EVIDENCE.md`, `../ACCEPTANCE.md`, `../LANES.md`, `../lanes.v2.json`, and the frozen
contracts under `src/contracts/v2/`, especially evidence, workspace, common, and references.

## Deliverables and checks

- Five controlled tabs, one persistent market selector, shared filters, fixed demo date, and concise
  independent/synthetic disclosure.
- Reusable accessible `Why this?` and `Open the work` presentation that consumes `EvidenceBundle`
  without calculating or rewriting evidence.
- Keyboard/focus return, responsive tables/panels, loading/empty/error states, and status text beyond
  color. Preserve existing V1 behavior until coordinator integration changes the entry point.
- Cover U01-U05 with focused component tests and run the lane-relevant typecheck/lint/test commands.

## Non-negotiable product rules

Conclusions come from prepared source-backed views. Unknown stays unknown; readiness, acceptance,
and completion stay distinct; demand is request-slot based; scenario expected values are never
runtime data; no Steno API/policy is invented; no real message is sent.

## Escalation and handoff

If a shared prop, callback, filter, evidence, or navigation contract is missing, stop and return a
contract-change request. Do not edit shared contracts or work around them locally. Do not spawn
children. Commit only allowed files, stop editing, and report REVIEW_READY with base/candidate SHA,
changed files, tests/commands and exit codes, acceptance coverage, and gaps.
