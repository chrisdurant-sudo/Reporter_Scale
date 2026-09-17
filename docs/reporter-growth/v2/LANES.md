# V2 lane ownership and sequencing

This is the active V2 routing authority together with [lanes.v2.json](lanes.v2.json). It defines
roles and ownership but does **not** authorize implementation by itself. P2 requires a separate
explicit user gate after `ROUTING_VERIFIED`. The V1 registry and task files are inactive history.
The first P1.5 probe verified the `data` role identity and instructions but could not observe its
actual model, reasoning effort, or service tier. No implementation dispatch is authorized until a
fresh session reloads the role catalog and completes that verification.

## Ownership pattern

Each product-domain lane owns its calculation module, prepared-view builder, feature page, and local tests. Shared UI/data are separate lanes. This avoids one giant logic lane bottleneck without permitting several workers to edit the same source file.

A feature receives prepared values and callbacks from integration. Even when its owner also implements the domain logic, the React feature must not import storage or sibling-domain private functions. Cross-domain composition belongs to the coordinator through frozen contracts.

| Lane | Exclusive directory prefixes | Deliverable |
|---|---|---|
| experience | `src/ui/`, `src/shell/`, `src/styles/` | Five-tab shell, filters, shared evidence panel, tables/chart framing, responsive interaction |
| data | `src/data/` | Complete synthetic histories, source records, scenario feed, validated repository and reset |
| capacity | `src/logic/capacity/`, `src/features/markets/` | Demand/coverage, sample eligibility checks, goal view and market evidence |
| recruiting | `src/logic/recruiting/`, `src/features/recruiting/` | Stage projections, cohort/source metrics, screening and onboarding work |
| network | `src/logic/network/`, `src/features/reporters/` | Existing network, explicit availability, engagement and job-history views |
| team | `src/logic/team/`, `src/features/team/` | Workload, role targets, quality evidence, coaching and reassignment |
| programs | `src/logic/programs/`, `src/features/programs/` | Program grid, cohort results, decisions, process drafts and partner work |
| quality | `tests/acceptance/`, `tests/e2e/` | Independent cross-domain reconciliation and browser acceptance; no production repairs |

Co-locate unit tests within the owner's directory. Quality does not own every test. The coordinator alone edits shared contracts, integration, shared calculation primitives, root tooling/dependencies, source entry/barrel files, docs, migration adapters, and legacy `src/features/improvements/` until retired.

## Runtime roles

| Role | Model | Reasoning | Schedule |
|---|---|---|---|
| experience | GPT-5.6 Terra | medium | Initial seven-worker implementation wave |
| data | GPT-5.6 Luna | medium | Initial seven-worker implementation wave |
| capacity | GPT-5.6 Terra | high | Initial seven-worker implementation wave |
| recruiting | GPT-5.6 Terra | medium | Initial seven-worker implementation wave |
| network | GPT-5.6 Terra | medium | Initial seven-worker implementation wave |
| team | GPT-5.6 Terra | medium | Initial seven-worker implementation wave |
| programs | GPT-5.6 Terra | medium | Initial seven-worker implementation wave |
| quality | GPT-5.6 Luna | medium | Only after one integrated candidate exists |
| reviewer | GPT-5.6 Terra | high | Read-only, only after Quality on a fixed candidate |

All roles use `service_tier = "default"`. The coordinator is selected interactively and is not
pinned by project configuration. Every routed spawn uses `fork_turns="none"`; no inherited parent
history may replace the configured child role.

## Shared interfaces to freeze before work splits

- Entity/event definitions and identity/attribution rules.
- Metric/evidence bundle, resolved record references, and human-readable evidence rows.
- View props and action results for all five screens.
- Filter/navigation context and preserving exact affected-record IDs.
- Command context, expected revision, idempotency, and common goal revision behavior.
- Repository load/save/reset and snapshot schema version.
- Scenario feed application, dates, expected checkpoint outputs.

No independent custom `Reporter`, `Metric`, or `Evidence` types inside a feature to bypass a missing shared contract.

## Semantic write boundaries

Capacity validates accepted assignments and classifies requests. Recruiting writes stage, screening, onboarding and readiness events. Network writes availability/preferences. Team writes work items, coaching and quality checks. Programs writes programs/enrollment/decisions/process drafts. Shared goal revisions and simulated outcome application are coordinator-owned. Data persists the composed snapshot; it does not invent business outcomes.

Example: an “Assign follow-up” button in Recruiting calls the shared task action routed through integration to Team's canonical command. Recruiting does not maintain a second private task list. Programs uses the same partner-task mechanism.

## Prerequisites and scheduling

The frozen source authority is commit `19f7df98000e346a5b4ff32e00b699276c3f62fb`.
No lane starts until a later prompt explicitly authorizes P2 and supplies the exact integration base.
Domain work can then start with controlled local fixtures; it need not wait for the full data seed or
shared UI polish. No page may embed scenario expected values to avoid a data dependency.

The initial wave is exactly seven implementation roles: experience, data, capacity, recruiting,
network, team, and programs. The project/runtime ceiling remains seven spawned-agent threads,
excluding the coordinator; use fewer if the runtime or work readiness requires it. Quality is not in
that wave. It runs after the coordinator has assembled one integrated candidate. Reviewer runs
read-only after Quality against a fixed commit. Do not increase the project ceiling to overlap these
phases.

Role/model choice is fixed by `.codex/config.toml` and the role layers in `.codex/agents/`. Workers
do not substitute a model, raise reasoning, change service tier, or edit routing configuration.

## Worker handoff

One worker, one lane, one isolated verified worktree/branch. A separate chat alone is not isolation.
Every spawn uses the exact named role with `fork_turns="none"`. No worker spawns more workers or
changes its own cost/routing settings.

Handoff contains lane ID, baseline SHA, candidate SHA, changed paths, actual checks/exit statuses, evidence/acceptance IDs covered, and unresolved issues. Stop edits at handoff. Coordinator reviews and integrates exact commits sequentially; worker does not self-merge or self-approve.

A contract-change request names the missing field/action, producer and consumers, compatibility impact, and test change. Coordinator settles it, pauses affected work if required, updates the baseline, and communicates the new version. Do not let three workers patch the same shared file.

## Boundary enforcement

Path ownership in JSON is an agreement, not a sandbox. During the later build, check candidate diffs against the allowlist before integration; reject out-of-scope changes and fix them in the owning lane. Respect runtime sandbox/approval limits. Do not claim the registry itself prevents writes.

The V1 registry is explicitly inactive. The old all-of-`src/logic/` `logic` writer and the old
`markets`, `reporters`, and `improvements` writer meanings are retired. Their source remains intact;
only routing authority changed.
