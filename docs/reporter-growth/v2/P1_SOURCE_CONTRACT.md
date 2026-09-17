# P1 source-contract freeze

Status: **CONTRACTS_FROZEN**

Source-freeze candidate: `19f7df98000e346a5b4ff32e00b699276c3f62fb`

Approved foundation baseline: `31fb1f440eaf2d77f2649e7b4e6f603acb6ea9bf`

This report is a documentation attestation written after the candidate commit so it can name that
immutable commit. The candidate contains the complete P1 source boundary as one commit. This report
does not authorize lane fan-out or feature implementation.

## Freeze decision

P1 is safe to freeze. The repository now has a separate, compiling V2 contract namespace, explicit
V1/V2 compatibility handling, common time/evidence/revision invariants, and reserved domain seams.
The current V1 application remains the running application. No feature page, complete V2 fixture,
chart, full metric implementation, database, server, external integration, dependency, or agent/model
configuration was added.

No blocker prevents later lanes from building against this boundary. Any later change to a shared
type, invariant, barrel, compatibility seam, or integration contract requires a coordinator-owned
contract-change review rather than a lane-local duplicate.

## Actual repository state at freeze

- Branch: `main`.
- The approved P0 documentation is commit `31fb1f440eaf2d77f2649e7b4e6f603acb6ea9bf`.
- The P1 source candidate is commit `19f7df98000e346a5b4ff32e00b699276c3f62fb`.
- V1 remains `DemoSnapshot` schema version 1 and remains wired to the existing Markets, Reporters,
  and Improvements application. Its feature directories were not changed.
- V2 is additive under `src/contracts/v2/`, `src/logic/shared/`, the five reserved domain directories,
  and one coordinator-owned compatibility module.
- `src/contracts/index.ts` exposes V2 only through the `v2` namespace, avoiding V1/V2 name collisions.
- The repository remains in-memory. P1 did not introduce durable storage or a migration path that
  could overwrite user data.
- `package.json`, `package-lock.json`, `.codex/`, model settings, and service-tier settings are
  unchanged. No dependency installation was needed.
- No implementation worker or lane was launched.

## Frozen operating and data decisions

| Boundary | Frozen P1 decision |
|---|---|
| Versioning | `DemoSnapshotV2` is a distinct schema-version-2 aggregate. V1 is not mutated or inferred into V2. |
| Identity | A `Reporter` is one fictional network person across markets; a `TeamMember` is a separate identity. Branded IDs prevent accidental cross-entity assignment. |
| Acquisition and lifecycle | First-time acquisition cases are separate from reporters. Lifecycle facts are dated, append-only events with occurrence and recording time; first job is not a lifecycle assertion. |
| Verification and readiness | Credentials, capability verification, screening, onboarding, and readiness are separate records. Unknown/needs-information, verified, and not-demonstrated remain distinct. |
| Availability | Availability is an explicit bounded record with status, markets, attendance modes, recording time, confirmation expiry, actor, and provenance. Absence is not converted into availability or refusal. |
| Demand and assignment | Each demand request is one reporter slot and can exist without a reporter. Assignment history distinguishes proposed, offered, accepted, declined, and canceled. |
| Outcomes | A completed job is a separate outcome tied to the accepted assignment, request, and reporter. First-job status remains a global derivation over valid completed outcomes. |
| Work | `WorkItem` is the canonical internal task, with owner/status history and evidence references. Recruiting and Programs must not create private task stores. |
| Programs and goals | Enrollment is explicit and frozen at entry. Goal revisions retain metric version, scope, baseline evidence snapshot, target, deadline, owner, and supersession. |
| Process | Process versions distinguish draft, review-ready, and approved-for-limited-pilot states. Saving a process does not enroll people or roll it out. |
| Money | Source spend uses branded minor-currency units rather than display-formatted amounts; repository validation must reject non-integer values. |
| Commands | Commands carry stable branded IDs, expected revision, actor, and UTC occurrence time. Replay is checked before stale revision; a new stale command is rejected. |
| Scenario | Future scenario events remain outside operational snapshot collections until applied. Feed order, checkpoint, recorded time, apply time, operation, applied-event IDs, and test-only expected facts are explicit. |
| Provenance | Operational demo records identify `synthetic-demo` or `demo-simulation` provenance. No field claims an external Steno system or policy. |

## Time, metric, and evidence contract

- Stored timestamps use explicit UTC values. Request records retain an IANA market time zone for
  display. Reporting context carries the fixed `America/Los_Angeles` reporting time zone.
- Shared windows are half-open `[startAt, endAt)`. Named metric exceptions such as inclusive goal or
  follow-up deadlines remain part of their metric definitions, not a silent change to window behavior.
- Every workspace calculation receives explicit `asOfAt`, snapshot revision, definition version,
  filter scope, and market basis. Nationwide people remain distinct by reporter ID; demand remains
  distinct reporter-slot request IDs.
- P1 does not implement M01-M13. Their frozen calculations remain in `FOUNDATION_REVIEW.md` and
  `METRICS_AND_EVIDENCE.md`. Domain lanes must derive values from source records and may not import
  expected scenario numbers as runtime output.
- The common `EvidenceBundle` carries the metric definition/version, time and revision, unit, scope,
  exact filters, reporting window, available-or-unavailable computation, numerator/denominator,
  resolved contributing records and join paths, ratio members, exclusions, unknown count,
  limitations, explanation, and an allowed navigation target.
- The shared validator enforces valid revisions/windows, count-to-record reconciliation, ratio member
  counts and subset rules, distinct record members, scope/filter agreement, and exact `Open the work`
  filters plus evidence context. `Why this?` and `Open the work` therefore share one evidence source.
- Evidence snapshots are part of `DemoSnapshotV2` so goals, program decisions, and process versions
  can retain the exact evidence used at decision time instead of pointing at a recomputed conclusion.

## Compatibility and migration seam

`preserveSnapshotBoundary` returns a tagged envelope:

- schema 1 becomes `v1-preserved` with the identical V1 object and `automaticMigration: false`;
- schema 2 becomes `v2-native` with the identical V2 object and `automaticMigration: false`.

This is intentionally not a transformer. It does not fabricate lifecycle history, structured
availability, credential evidence, program membership, unassigned demand, or person-level outcomes
from V1 aggregates. If persistence is introduced later, it must use a separate versioned namespace
and an explicit user-safe start/reset/export decision. The P0 storage inspection remains the evidence
for the current in-memory conclusion.

## Contract-to-file map and future owner

| Source contract or seam | Candidate path | Future semantic owner |
|---|---|---|
| IDs, markets, workspace IDs, time, provenance, evaluation context | `src/contracts/v2/ids.ts`, `common.ts` | Coordinator |
| Human-readable evidence record references | `src/contracts/v2/references.ts` | Coordinator |
| Reporter, acquisition, lifecycle, credential/capability, screening, onboarding, readiness | `src/contracts/v2/people.ts` | Recruiting/Network through shared contracts |
| Availability, demand, assignment history, job outcomes | `src/contracts/v2/demand.ts` | Network/Capacity through shared contracts |
| Canonical work, targets, quality, coaching | `src/contracts/v2/work.ts` | Team through shared contracts |
| Sources, spend, programs, enrollment, decisions, goals, workarounds, processes | `src/contracts/v2/programs.ts` | Programs; coordinator retains shared goal revision behavior |
| Metric/market definitions and manual notes | `src/contracts/v2/referenceData.ts` | Coordinator/Data |
| Evidence, exact filters, navigation payloads | `src/contracts/v2/evidence.ts` | Coordinator |
| Command envelope/result/record and command gate | `src/contracts/v2/commands.ts`, `src/logic/shared/revision.ts` | Coordinator |
| Repository load/save/reset boundary | `src/contracts/v2/repository.ts` | Coordinator contract; Data implementation |
| Workspace query/prepared-view port | `src/contracts/v2/workspace.ts` | Coordinator contract; domain implementations |
| Scenario feed/checkpoint operations | `src/contracts/v2/scenario.ts` | Coordinator contract/application; Data fixtures |
| Aggregate schema | `src/contracts/v2/snapshot.ts` | Coordinator |
| Contract barrel | `src/contracts/v2/index.ts`, `src/contracts/index.ts` | Coordinator |
| Shared time and evidence invariants | `src/logic/shared/time.ts`, `evidence.ts`, `index.ts` | Coordinator |
| V1/V2 compatibility | `src/integration/v2Compatibility.ts` | Coordinator |
| Domain seams | `src/logic/capacity/`, `recruiting/`, `network/`, `team/`, `programs/` | Respective future lane |

The domain seams expose only workspace identity and a typed `WorkspaceLogicPort`. Capacity maps to the
Markets workspace; Network maps to Reporters. They contain no metric calculations or feature code.

## Candidate file inventory

The candidate changed exactly these 30 files:

- `AGENTS.md`
- `src/contracts/index.ts`
- `src/contracts/v2/commands.ts`
- `src/contracts/v2/common.ts`
- `src/contracts/v2/contracts.test.ts`
- `src/contracts/v2/demand.ts`
- `src/contracts/v2/evidence.ts`
- `src/contracts/v2/ids.ts`
- `src/contracts/v2/index.ts`
- `src/contracts/v2/people.ts`
- `src/contracts/v2/programs.ts`
- `src/contracts/v2/referenceData.ts`
- `src/contracts/v2/references.ts`
- `src/contracts/v2/repository.ts`
- `src/contracts/v2/scenario.ts`
- `src/contracts/v2/snapshot.ts`
- `src/contracts/v2/work.ts`
- `src/contracts/v2/workspace.ts`
- `src/integration/v2Compatibility.test.ts`
- `src/integration/v2Compatibility.ts`
- `src/logic/capacity/index.ts`
- `src/logic/network/index.ts`
- `src/logic/programs/index.ts`
- `src/logic/recruiting/index.ts`
- `src/logic/shared/evidence.ts`
- `src/logic/shared/index.ts`
- `src/logic/shared/invariants.test.ts`
- `src/logic/shared/revision.ts`
- `src/logic/shared/time.ts`
- `src/logic/team/index.ts`

`AGENTS.md` now identifies the current work as the approved P1 source-contract freeze and keeps all
existing Standard/no-Fast, cost, user-work, safety, synthetic-data, ownership, and no-deployment
protections in force.

## Verification record

No installation command was run; the existing lockfile and installed dependencies were sufficient.

| Exact command | Result |
|---|---|
| `npm run typecheck` | Exit 0. `tsc -b --pretty false` completed without diagnostics. |
| `npm run lint` | Exit 0. `eslint . --max-warnings=0` completed with zero warnings. |
| `npm run test -- --run` (first P1 run) | Exit 1. Three new suites lacked explicit Vitest runtime imports; all 31 pre-existing tests passed. The imports were corrected without changing product behavior. |
| `npm run build` (same intermediate state) | Exit 0. The production build completed, confirming the failure was test-module setup rather than application compilation. |
| `npm run test -- --run` (corrected run) | Exit 0. 12 files and 40 tests passed. |
| `npm run typecheck` (final candidate) | Exit 0. |
| `npm run lint` (final candidate) | Exit 0. |
| `npm run test -- --run` (final candidate) | Exit 0. 12 files and 40 tests passed, including existing V1 integration/three-tab assertions and new contract/invariant/compatibility tests. |
| `npm run build` (final candidate) | Exit 0. Vite transformed 63 modules and produced the production bundle. |
| `git diff --cached --check` | Exit 0 before candidate commit. |

Focused P1 tests cover the five workspace/five market identifiers, unassigned demand, UTC and
half-open windows, replay-before-stale command handling, evidence reconciliation/navigation, ratio
member subsets, and non-mutating V1/V2 compatibility. No browser/runtime validation is claimed for
V2 functionality because P1 implements no V2 screens or end-to-end workflow.

## Deferred, non-blocking contract questions

- Screen-specific prepared-view fields and action input types remain implementation details for the
  future domain and experience lanes. They must extend the frozen workspace/evidence/command
  boundary; any cross-domain shape is coordinator-owned, and no lane may create competing entity,
  metric, task, or evidence models.
- The full validated V2 seed, differentiated five-market records, and exact scenario-event payloads
  remain Data-lane work. Test-oracle values stay outside runtime collections.
- M01-M13 algorithms, comparison evidence for both windows, acceptance validation, and first-job
  derivation remain their named domain lanes' work under the frozen definitions.
- Any later durable-storage choice requires a new migration decision and a fresh user-data safety
  review. Automatic V1-to-V2 conversion remains prohibited.
- Runtime role mapping remains a separate routing prerequisite. P1 did not inspect or change model or
  service-tier configuration, and lanes remain inactive.
- Detailed credential policies, jurisdiction rules, travel logic, and real-system integrations remain
  intentionally unspecified. Synthetic sample requirements cannot be promoted into Steno policy.

These are planned implementation details, not blockers to the shared source boundary. P1 stops here;
no role routing or feature implementation follows from this report.
