# Parallel build plan

> **Version 1 legacy build plan — INACTIVE.** It documents the implemented three-tab application
> and remains historical context. It is not the V2 implementation plan, its roles must not be
> dispatched, and it does not authorize source changes.

## 0. SETUP — coordinator, serial
Inspect actual repository structure, instructions, dirty files, installed tools, and Codex's available delegation controls.
Preserve user work. Do not overwrite package files, AGENTS instructions, or existing application code just to fit the plan.
Keep React/TypeScript/Vite. Choose compatible dependencies once and generate the real lockfile in the build environment.
If an existing app is being extended, map these planned lane paths to a self-contained project area and record the mapping.

Create the minimal compiling foundation: frozen interfaces, public exports, basic UI tokens/props, temporary typed boundary stubs,
composition entry, and test/build commands. Agree on records, view models, commands, scenario anchors and validation result shapes.
A brief read-only architect check may help catch missing interfaces. Do not create an orchestration framework or implement the screens in setup.

Run baseline type/build/smoke checks and record their real outcomes. Commit a clean project-specific base without sweeping in unrelated user work.
SETUP_FROZEN requires a named base commit, agreed interfaces, disjoint ownership, and buildable entry points.
Baseline smoke checks are not the full acceptance suite: the unfinished feature behavior is not expected to pass yet.

Before BUILD fan-out, run the one-worker routing probe defined in `AGENT_ROUTING.md`. Do not launch the full wave until the configured child model/reasoning policy is verified where the runtime exposes that evidence. A routing failure is a setup blocker, not permission to let all workers inherit the coordinator tier.

## 1. BUILD — parallel lanes
Launch ready workers using the actual supported delegation tools and the named roles from `.codex/config.toml`. Project ceiling: seven lane workers plus one optional
read-only reviewer, at most eight simultaneous spawned agents excluding the coordinator. Never treat this ceiling as
proof that the installed client or account supports that many. Do not raise limits or weaken protections to fill slots.

Use one separate Git worktree/branch per worker, all from the frozen baseline. Give each the absolute path, lane ID,
base commit, exact write scope, task packet, interface revision and acceptance IDs. Require the worker to verify
its working directory, worktree identity and HEAD before editing. A child thread is not automatically a separate checkout.
If separate permitted working areas cannot be established, use serial writes and disclose the limitation.
Worktree separation and scope rules are workflow controls, not a security sandbox.

All seven lanes can start once setup is frozen. When slots are scarce, prioritize data and logic, then experience and markets,
then reporters/improvements, and quality as capacity permits. Adapt to actual blockers; no idle agent merely to occupy a slot.
Limit simultaneous heavy test/build/browser processes to two; run targeted lane checks rather than seven full browser suites.
The coordinator handles dispatch, blockers and review during the wave and does not edit frozen shared interfaces concurrently.

Workers may read other domains but write only their own allowed paths. No cross-lane imports, dependency edits, global styles,
shared log appends, or worker-launched children. Unit tests and small private examples stay within the owner lane.
Quality can author cross-feature tests in parallel; temporary failures against stubs are explicit pending acceptance, not skipped tests.

## 2. HANDOFF — stop writing and identify the candidate
Each worker commits only its authorized changes locally, stops edits, and returns:
- Lane, base commit, candidate commit and actual worktree path.
- Changed files and acceptance IDs covered.
- Commands actually run, exit codes, and specific known gaps.
- Status REVIEW_READY, BLOCKED, or NEEDS_CONTRACT. Never self-approved DONE.

Use the agent response or a unique per-lane report file, not a shared writable log.
Coordinator alone keeps a small run record with claims, commits, checks, reviews and blockers; no transcript dumping.
On restart, reconcile the record with actual Git state before resuming.

## 3. INTEGRATE — coordinator, sequential
Check each handoff's actual diff, scope, public API compatibility and test evidence. Reviewers inspect fixed commits
without source edits and cannot approve their own authored work. One coherent review batch is fine; avoid ceremonial reviews of trivial edits.

Integrate accepted commits one at a time: data → logic → experience → markets → reporters → improvements → quality.
Wire the app only in the coordinator-owned integration area. Return domain defects to their owners with fresh narrow assignments.
No worker merges another lane or rebases someone else's work. Recheck scope and compatibility after a contract revision.
Run focused checks as domains land; run the full suite on the assembled application.
A scope/import check is useful if small; do not spend the build on constructing a custom agent harness.

## 4. VERIFY — exact assembled candidate
Stop source writers and record the candidate commit. Run real type checks, domain/acceptance tests, production build,
browser tests, and visual/keyboard inspection at the required mobile/desktop widths.
Check all acceptance IDs, remove temporary stubs, and inspect for dead controls, data leakage and misleading outcomes.
Have a fresh read-only reviewer inspect that same candidate and the actual evidence.

MVP_DONE requires all required checks and review approval for the same final commit.
After source fixes, rerun affected checks, rerun the full final verification, and review the new final candidate.
Unavailable tools, blocked installs, failed checks or untested behaviors stay visible; report partial completion honestly.
Finish with startup instructions, source commit, check results and remaining limitations. No push or deployment is authorized.

## Short dispatch message
"You own LANE at ABSOLUTE_WORKTREE, based on BASE_SHA. Read TASK_FILE and frozen contracts.
Edit only ALLOWED_PATHS; do not spawn children or change shared dependencies/interfaces. First verify cwd, worktree and HEAD.
Implement ACCEPTANCE_IDS, run targeted checks, commit authorized work, stop edits, and return REVIEW_READY with candidate SHA,
changed paths, actual commands/results, and gaps. Request missing contracts instead of crossing ownership boundaries."
