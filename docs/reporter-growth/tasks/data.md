# Demo data — data

> **V1 legacy task — INACTIVE.** Do not dispatch. Use `../v2/tasks/data.md`.

## Claim
Write only: `src/data/`.
Acceptance: DATA-01, DATA-02. Shared instruction files are never lane-owned.
Start only after SETUP_FROZEN, in the absolute worktree supplied by the coordinator. Verify cwd, Git root and base commit.

## Assignment
Create roughly 60 fictional reporters and coherent market/source/team/job/lifecycle/improvement records.
Give each market a different illustrative constraint. Include stable anchors agreed with quality in setup, one late-completion
simulation target, and a fixed as-of timestamp. Implement the repository interface with cloned state and deterministic reset;
versioned local storage is optional, not mandatory. Validate record shape and handle a failed save/reset without silent success.
Do not compute funnel/goal metrics or import logic. Keep test fixtures for duplicates/cancellations separate from visible demo clutter.

## Read
`../PRODUCT.md`, `../CONTRACTS.md`, `../ACCEPTANCE.md`, your section of `../LANES.md`,
and `../DESIGN.md` for UI work. These paths are relative to this task file. Also read the frozen source contracts in your worktree.

## Handoff
Commit authorized files only, stop editing, and return REVIEW_READY with base/candidate commits, changed paths,
acceptance coverage, actual check commands/exit codes and known gaps. Ask for missing interfaces rather than crossing lanes.
No child agents, shared log writes, dependency edits, other-lane repairs, merges, deployment or self-approval.
