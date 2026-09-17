# Future implementation lanes

This is a future allocation, not permission to start workers during the foundation-review phase. [lanes.v2.json](lanes.v2.json) is the machine-readable registry.

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

P0 is documentation-only. In the later authorized build, all lanes require a real CONTRACTS_FROZEN commit. Domain work can start with controlled local test fixtures after that gate; it need not wait for the full data seed or shared UI polish. Do not embed fake headline totals in a page to avoid the data dependency.

At most seven lane writers and one separate optional read-only reviewer concurrently. There are eight lane definitions, so dispatch ready work into available slots. Quality can write tests against frozen contracts before all features finish, but can only pass integrated checks against a real assembled candidate.

Role/model choice is independent of lane ownership. Use the locally verified cost policy and compatible named roles. Do not infer a new model ID from a lane name; do not change TOML as part of this packet. Legacy role prompts may contain v1-only scopes and need a separate approved reconciliation before fan-out.

## Worker handoff

One worker, one lane, one isolated verified worktree/branch. A separate chat alone is not isolation. No worker spawns more workers or changes its own cost/routing settings.

Handoff contains lane ID, baseline SHA, candidate SHA, changed paths, actual checks/exit statuses, evidence/acceptance IDs covered, and unresolved issues. Stop edits at handoff. Coordinator reviews and integrates exact commits sequentially; worker does not self-merge or self-approve.

A contract-change request names the missing field/action, producer and consumers, compatibility impact, and test change. Coordinator settles it, pauses affected work if required, updates the baseline, and communicates the new version. Do not let three workers patch the same shared file.

## Boundary enforcement

Path ownership in JSON is an agreement, not a sandbox. During the later build, check candidate diffs against the allowlist before integration; reject out-of-scope changes and fix them in the owning lane. Respect runtime sandbox/approval limits. Do not claim the registry itself prevents writes.

Do not run v1 and v2 registries concurrently: the old all-of-`src/logic/` lane would overlap the new domains. The coordinator must explicitly mark it inactive when the new source-contract baseline is authorized.
