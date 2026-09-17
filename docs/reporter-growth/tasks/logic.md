# Rules and calculations — logic

> **V1 legacy task — INACTIVE.** The `logic` writer role is retired; V2 domain logic has separate owners.

## Claim
Write only: `src/logic/`.
Acceptance: RULE-01, RULE-02, RULE-03, RULE-04. Shared instruction files are never lane-owned.
Start only after SETUP_FROZEN, in the absolute worktree supplied by the coordinator. Verify cwd, Git root and base commit.

## Assignment
Implement all canonical metrics, market plan previews, per-screen view models, validation and command transitions.
Follow CONTRACTS.md for unique first jobs, attribution, cohort maturity, planning rounding/lead time, reasoned screening,
follow-ups, coaching, decisions and editable process drafts. Summaries must trace to demo records.
Prevent duplicate simulation outcomes; preserve fixed-window history. No React, storage, network or feature imports.
Use pure functions and focused independent unit examples. Do not build a distributed system or a generic rule engine.

## Read
`../PRODUCT.md`, `../CONTRACTS.md`, `../ACCEPTANCE.md`, your section of `../LANES.md`,
and `../DESIGN.md` for UI work. These paths are relative to this task file. Also read the frozen source contracts in your worktree.

## Handoff
Commit authorized files only, stop editing, and return REVIEW_READY with base/candidate commits, changed paths,
acceptance coverage, actual check commands/exit codes and known gaps. Ask for missing interfaces rather than crossing lanes.
No child agents, shared log writes, dependency edits, other-lane repairs, merges, deployment or self-approval.
