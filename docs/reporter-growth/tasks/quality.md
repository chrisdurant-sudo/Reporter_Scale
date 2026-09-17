# Independent checks — quality

> **V1 legacy task — INACTIVE.** Do not dispatch. Use `../v2/tasks/quality.md` after a V2 integrated candidate exists.

## Claim
Write only: `tests/acceptance/`, `tests/e2e/`.
Acceptance: INT-01, INT-02, SAFE-01. Shared instruction files are never lane-owned.
Start only after SETUP_FROZEN, in the absolute worktree supplied by the coordinator. Verify cwd, Git root and base commit.

## Assignment
Author acceptance and browser tests from the frozen interfaces and ACCEPTANCE.md. You may read public modules and source,
but write only tests/acceptance and tests/e2e. Test the complete LAX flow, filter persistence, honest plan/follow-up behavior,
late completion/reset, responsive layout, keyboard panel use and prohibited real calls.
Use stable accessible labels/anchors rather than fragile generated classes. Write your own small expected-value fixtures.
Unfinished behavior may initially fail; report that clearly and do not skip assertions to make a false green baseline.
Report production defects to the coordinator and owner. Do not repair production files, change root test configuration,
or self-approve the final application. A separate reviewer signs off the assembled candidate.

## Read
`../PRODUCT.md`, `../CONTRACTS.md`, `../ACCEPTANCE.md`, your section of `../LANES.md`,
and `../DESIGN.md` for UI work. These paths are relative to this task file. Also read the frozen source contracts in your worktree.

## Handoff
Commit authorized files only, stop editing, and return REVIEW_READY with base/candidate commits, changed paths,
acceptance coverage, actual check commands/exit codes and known gaps. Ask for missing interfaces rather than crossing lanes.
No child agents, shared log writes, dependency edits, other-lane repairs, merges, deployment or self-approval.
