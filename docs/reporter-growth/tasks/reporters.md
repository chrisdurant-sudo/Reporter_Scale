# Reporters screen — reporters

> **V1 legacy task — INACTIVE.** The combined `reporters` role is retired; use the V2 `recruiting`, `network`, and `team` briefs.

## Claim
Write only: `src/features/reporters/`.
Acceptance: REP-01, REP-02, REP-03. Shared instruction files are never lane-owned.
Start only after SETUP_FROZEN, in the absolute worktree supplied by the coordinator. Verify cwd, Git root and base commit.

## Assignment
Build the stage strip and concise working list with search/filter and a shared detail panel.
Show current counts as a snapshot, not conversion. Include screening checks/reasons, preferences, blocker, assigned person,
due date, next step, message preview and history. Include a small workload/coaching section on this screen.
Call typed actions for saves; never write storage, complete a job, send a message or compute canonical conversion yourself.
Use shared UI and local scoped styles. No candidate scores, automatic rejection, extra team tab, or recruiter leaderboard.

## Read
`../PRODUCT.md`, `../CONTRACTS.md`, `../ACCEPTANCE.md`, your section of `../LANES.md`,
and `../DESIGN.md` for UI work. These paths are relative to this task file. Also read the frozen source contracts in your worktree.

## Handoff
Commit authorized files only, stop editing, and return REVIEW_READY with base/candidate commits, changed paths,
acceptance coverage, actual check commands/exit codes and known gaps. Ask for missing interfaces rather than crossing lanes.
No child agents, shared log writes, dependency edits, other-lane repairs, merges, deployment or self-approval.
