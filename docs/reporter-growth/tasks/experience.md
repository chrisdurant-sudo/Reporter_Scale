# Shared interface — experience

## Claim
Write only: `src/ui/`, `src/shell/`, `src/styles/`.
Acceptance: UI-01, UI-02, UI-03. Shared instruction files are never lane-owned.
Start only after SETUP_FROZEN, in the absolute worktree supplied by the coordinator. Verify cwd, Git root and base commit.

## Assignment
Implement the controlled shell, shared UI exports, responsive market-selector presentation, detail-panel behavior,
and design tokens. Freeze the initial API in setup; improve implementations behind it. The selected market itself is
integration-owned. Keep UI generic; do not add market metrics, storage, or feature-specific business state.
Private unit/component tests belong inside the owned directories. Validate keyboard/focus and narrow-screen behavior.
Deliver consistent primitives that every screen can use, not an independent component framework.

## Read
`../PRODUCT.md`, `../CONTRACTS.md`, `../ACCEPTANCE.md`, your section of `../LANES.md`,
and `../DESIGN.md` for UI work. These paths are relative to this task file. Also read the frozen source contracts in your worktree.

## Handoff
Commit authorized files only, stop editing, and return REVIEW_READY with base/candidate commits, changed paths,
acceptance coverage, actual check commands/exit codes and known gaps. Ask for missing interfaces rather than crossing lanes.
No child agents, shared log writes, dependency edits, other-lane repairs, merges, deployment or self-approval.
