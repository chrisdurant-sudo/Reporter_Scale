# Markets screen — markets

> **V1 legacy task — INACTIVE.** The `markets` role is retired; use the V2 `capacity` brief.

## Claim
Write only: `src/features/markets/`.
Acceptance: MKT-01, MKT-02. Shared instruction files are never lane-owned.
Start only after SETUP_FROZEN, in the absolute worktree supplied by the coordinator. Verify cwd, Git root and base commit.

## Assignment
Build the Markets screen from frozen view props/actions. Compare five markets, then open a selected-market plan.
Show completed first jobs, goal, gap, supported issue and next step. Provide editable goal/rates/lead time with a visible
preview and save/cancel. Keep draft form values local; request canonical previews through the agreed callback.
Do not calculate another version of metrics in JSX or import seeds/logic. Use private example view props for development
until the real integration lands. No map, dispatch board, or KPI-card wall.

## Read
`../PRODUCT.md`, `../CONTRACTS.md`, `../ACCEPTANCE.md`, your section of `../LANES.md`,
and `../DESIGN.md` for UI work. These paths are relative to this task file. Also read the frozen source contracts in your worktree.

## Handoff
Commit authorized files only, stop editing, and return REVIEW_READY with base/candidate commits, changed paths,
acceptance coverage, actual check commands/exit codes and known gaps. Ask for missing interfaces rather than crossing lanes.
No child agents, shared log writes, dependency edits, other-lane repairs, merges, deployment or self-approval.
