# Improvements screen — improvements

> **V1 legacy task — INACTIVE.** The `improvements` role is retired; use the V2 `programs` brief. Legacy source retirement remains coordinator-owned.

## Claim
Write only: `src/features/improvements/`.
Acceptance: IMP-01, IMP-02. Shared instruction files are never lane-owned.
Start only after SETUP_FROZEN, in the absolute worktree supplied by the coordinator. Verify cwd, Git root and base commit.

## Assignment
Build concise change/result cards with owner, partner deliverable, review window, incomplete observations and limitations.
Support Continue/Change/Stop with rationale. Save as process creates an editable draft through the agreed action,
not a rollout. Show the record-backed weekly summary supplied through the view model.
Treat sample result differences as descriptive. No automatic causal winner or fabricated ROI.
Do not create your own analytics, persistence, global styles, or a fourth main tab.

## Read
`../PRODUCT.md`, `../CONTRACTS.md`, `../ACCEPTANCE.md`, your section of `../LANES.md`,
and `../DESIGN.md` for UI work. These paths are relative to this task file. Also read the frozen source contracts in your worktree.

## Handoff
Commit authorized files only, stop editing, and return REVIEW_READY with base/candidate commits, changed paths,
acceptance coverage, actual check commands/exit codes and known gaps. Ask for missing interfaces rather than crossing lanes.
No child agents, shared log writes, dependency edits, other-lane repairs, merges, deployment or self-approval.
