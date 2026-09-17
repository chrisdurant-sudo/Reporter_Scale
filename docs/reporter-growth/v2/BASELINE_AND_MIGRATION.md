# Baseline, governance, and migration

## What was actually inspected

Source: uploaded `STENO_REVIEW.zip`, not the user's live checkout. This packet was prepared by reading source files and the supplied rendered views. No claim is made here that the current application was run, built, or tested during packet preparation.

[baseline_manifest.json](baseline_manifest.json) records hashes of the reviewed archive and selected source files. The coordinator must inspect current HEAD and dirty paths; changes since the upload are not a reason to overwrite them with the archive.

## Concrete source-to-target changes

| Reviewed source | What it currently contains | v2 treatment |
|---|---|---|
| `src/contracts/models.ts:5` | Three-value AppTab | Expand to five only after source-contract authorization |
| `src/contracts/models.ts:19–28` | Market includes observedIssue and nextAction strings | Compute signals from records; keep any manual note clearly labeled |
| `src/contracts/models.ts:31–46` | Availability/travel prose and source label | Add explicit availability windows, verified capability records, and source IDs |
| `src/contracts/models.ts:49–65` | Stage/events omit explicit contact, response and qualification stages | Complete event history; do not infer missing historical times |
| `src/contracts/models.ts:90–100` | Job requires reporterId | Add unassigned DemandRequest; separate assignment and completion records |
| `src/contracts/models.ts:112–137` | Follow-ups and coaching notes | Evolve to owned work, role-specific targets, inspected quality, coaching reviews |
| `src/contracts/models.ts:139–161` | Improvement samples store reporter/completion counts | Add explicit enrollment and source events; compute group counts |
| `src/contracts/models.ts:181–190` | Draft process structure exists | Reuse concept; add version/evidence/limited-pilot state |
| `src/contracts/models.ts:207–224` | schemaVersion 1 snapshot | Separate validated v2 schema; preserve old snapshot rather than inventing missing facts |
| `src/logic/index.ts:123–129` | Market rows use seeded issue/action and completed-job references | Replace with requirement-specific gap evidence and exact affected records |
| `src/logic/index.ts:153` | Program results are mapped from sample counts | Derive from enrollments, entry windows, and completed-job events |
| `src/data/index.ts:12–16` | Mostly repeated 12-person market patterns; two-event histories; same sample totals | New differentiated fixture scenarios with complete histories |
| `src/data/index.ts:25–32` | v1 validation, including limits on future scheduled job records | Define demand creation time separately from future service time; validate v2 at ingestion |
| `src/data/index.ts:36` | In-memory repository with revision checks | Preserve concurrency protections; inspect whether live code has added persistence |
| `src/integration/App.tsx` | Central orchestration and existing actions | Retain as coordinator-owned composition seam, split source modules where needed |
| `src/ui/`, `src/shell/`, `src/styles/` | Existing shared interface | Reuse shell, panels, buttons, and visual tokens before adding dependencies |
| `src/features/reporters/` | Combined recruiting/network/team work | Split responsibilities gradually; do not delete the existing screen before replacement works |
| `src/features/improvements/` | Existing decisions and process-draft workflow | Reuse behavior in Programs; old path retirement is coordinator-owned |
| `package.json` | React/Vite and existing lint, typecheck, test, build, browser-test scripts | Retain stack/toolchain; no packages installed in the first phase |
| Root `AGENTS.md`, README and product/build docs | Several still describe a planning-only, three-tab repo | Correct governance/documentation, not the source, in the first phase |

The table is an inspection of the uploaded baseline. Recheck line locations and semantics in the current checkout. It is not a patch instruction to replace entire files.

## Requirements precedence for this task

The user approved the five-workspace direction after v1. That supersedes v1's “three screens only/no fourth tab” product constraint, but does not cancel its safety, cost, preservation, or ownership rules.

A copied subfolder cannot safely be assumed to override root instructions. In the initial prompt the user explicitly authorizes a narrow documentation amendment: add a v2 planning-phase pointer to root AGENTS.md; mark the old PRODUCT/BUILD_PLAN/CODEX_START scope as v1. Retain original content/history where useful. Do not execute v1's fresh-app scaffolding instructions.

Suggested root addition:

> Current task: Reporter Growth v2 foundation review, governed by `docs/reporter-growth/v2/START_HERE.md`. The former three-tab scope is v1. This phase is documentation-only; do not run the legacy build prompt. Preserve all existing safety, no-Fast, cost, and user-work protections. Future source implementation needs explicit authorization and the new frozen lane registry.

Do not globally weaken parent instructions or change `.codex/` settings. If a live root/parent policy conflicts with this narrowly authorized planning work beyond the old scope language, report the conflict.

## Phase gates

### P0 — Foundation review (the only currently requested Codex task)

Inspect current Git state and relevant source. Reconcile this packet, resolve planning contradictions, and record missing decisions. Allowed writes: this v2 documentation folder, plus narrow v1/root documentation pointers described above. No src changes, package changes, runtime settings, deployment, or implementation workers.

Output: `FOUNDATION_REVIEW.md` with status FOUNDATION_REVIEWED or FOUNDATION_BLOCKED. It must include actual HEAD, dirty paths, agreed schema and metric decisions, source mapping, config-role constraints observed without edits, and the subsequent implementation gates. Do not label the app complete. Stop here.

### P1 — Source contracts and migration (future, separately authorized)

Create a compiling v2 shared-contract baseline in an isolated branch/worktree. Set up entity contracts, evidence shape, commands, prepared view interfaces, clocks, and migration boundaries. Keep the v1 app working through coordinator-owned compatibility exports/adapters as necessary.

Decide actual storage preservation from the live code. If persistent snapshots exist, retain/export v1 and introduce a separate versioned v2 key or explicit migration. If still in-memory, explicitly seed v2; do not pretend old aggregate samples can be expanded into factual memberships.

Freeze common contracts and minimal test fixtures before lane fan-out. Reusable shared date/window, identity, and evidence utilities remain coordinator-owned. Record a real compile/typecheck result; placeholders are a temporary foundation, not completed features.

### P2 — Records and calculations before chart claims

Use the exclusive lanes below. Data builds complete synthetic evidence. Domain owners build and test calculations against controlled fixtures and exact scenario expectations. Screen work may proceed against frozen view interfaces, but no computed headline is accepted until it reconciles to source rows.

Keep the existing project ceiling of seven simultaneous writing workers and one optional read-only reviewer; obey lower actual runtime limits. Eight total lane definitions do not mean eight simultaneous writers. Quality can wait until a slot/candidate is available. Do not increase concurrency merely to match the number of folders.

No implementation subagents are launched in P0. Before future fan-out, verify actual available role names, permissions, model/effort routing and Standard/no-Fast behavior without claiming configuration text proves execution. A role with hard-coded v1 task instructions cannot be silently reused for a broader v2 lane. If role-definition edits are needed, propose them separately without changing economics or guessing configuration syntax.

### P3 — Integrate one vertical story, then broaden

Integrate record model and calculations, then make the LAX story work across the views. Test exact before/after counts and explanation links. Add other markets, sources, team evidence, and programs using the same contracts. Do not polish five disconnected screens first.

### P4 — Independent verification

Run actual unit, integration, browser, typecheck, lint, and build checks available in the checkout. Validate narrow widths and the primary walkthrough. Review a fixed commit and record real outputs, failures, and omissions. Public deployment remains outside scope unless separately authorized.

## Safe source segmentation

The existing large `src/logic/index.ts` should become a compatibility/composition entry point, not a shared editing arena. Domain files go into capacity, recruiting, network, team, and programs subdirectories. Existing barrel exports and legacy tests are coordinator-owned until migration is complete.

Split functions by behavior with characterization tests; do not perform a blind formatting-plus-rewrite that makes behavior changes unreviewable. Preserve idempotency, revision rejection, time boundaries, and reset behavior. No worker edits another domain to make its tests pass.

## First-review deliverable checklist

- Current repository identity and whether the supplied source mapping still applies.
- Single agreed main story and corrected numerical contradictions, if any.
- Entity grains, source ownership, future-demand versus future-outcome policy.
- Metric denominators, windows, duplicate/unknown handling, and goal revision behavior.
- v1 preservation decision, not an assumed storage mechanism.
- Frozen proposed contracts and expected scenarios; no production implementation yet.
- Future lane path map, handoffs, and incompatible legacy role instructions.
- Material unresolved decisions only; sensible bounded implementation details need not become new features.
