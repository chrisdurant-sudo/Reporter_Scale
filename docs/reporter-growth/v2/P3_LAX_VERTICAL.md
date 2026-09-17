# P3 LAX vertical integration

Status: **P3_COMPLETE_READY_FOR_SEPARATELY_AUTHORIZED_QUALITY**

Authorized integration baseline: `97f3ed4606f62dddcf86d5ad261b77dcf1f17ed5`

Frozen source authority: `19f7df98000e346a5b4ff32e00b699276c3f62fb`

Final integrated P2 source: `2844a4bb578515d1c9a5f14357cae0c66be67763`

Routing status retained: **ROUTING_VERIFIED_WITH_TIER_OBSERVABILITY_LIMITATION**

P3 was explicitly authorized for the LAX vertical only and is now complete and inactive. Quality
and Reviewer remain unlaunched and require a separate user gate. This document is the serial
integration contract and exact closeout record.

## Exact P3 scope

P3 replaces the live V1 three-tab composition with the existing V2 repository, fixed clock,
five-workspace shell, prepared domain views, shared EvidenceBundle presentation, exact navigation
context, dated LAX checkpoint progression, and deterministic reset. The working story is:

**specific capacity need → record-level evidence → dated goal and work → readiness → acceptance →
completed work → program review**

The live path must preserve one market selector across Markets, Recruiting, Reporters, Team, and
Programs. Runtime values derive from V2 source records and calculations. The expected facts in
`scenario_contract.json` remain test oracles only.

P3 keeps the five differentiated market situations but intentionally gives only LAX the complete
cross-workspace walkthrough. Legacy V1 source remains available until the V2 replacement path is
verified; destructive deletion is out of scope.

## Integration baseline

- Branch `main` was clean at the expected authorized HEAD
  `97f3ed4606f62dddcf86d5ad261b77dcf1f17ed5`.
- `npm run typecheck -- --pretty false` exited 0 before P3 edits.
- The live entry point still rendered `src/integration/App.tsx`, which composed the V1 `AppShell`,
  `MarketsScreen`, `ReportersScreen`, and `ImprovementsScreen`.
- V2 already supplied a validated in-memory repository, isolated future scenario feed, fixed clock,
  cumulative checkpoints, five prepared domain views, a controlled five-workspace shell, and shared
  evidence contracts.
- Inspection identified coordinator-owned integration work, not a concrete defect inside a lane's
  exclusive paths. No lane worker is dispatched for the serial baseline.

## Write ownership

The coordinator owns this phase's integration composition, shared filter/navigation/evidence state,
scenario application, reset orchestration, source entry/barrels, coordinator integration/component
tests, governance, and this closeout record.

Exclusive lane paths remain unchanged:

| Lane | Exclusive paths |
|---|---|
| experience | `src/ui/`, `src/shell/`, `src/styles/` |
| data | `src/data/` |
| capacity | `src/logic/capacity/`, `src/features/markets/` |
| recruiting | `src/logic/recruiting/`, `src/features/recruiting/` |
| network | `src/logic/network/`, `src/features/reporters/` |
| team | `src/logic/team/`, `src/features/team/` |
| programs | `src/logic/programs/`, `src/features/programs/` |

A named V2 role may be dispatched only if implementation exposes a concrete repair inside that
role's exclusive paths. Any such dispatch must use its configured role, `fork_turns="none"`, a
verified isolated branch/worktree, the frozen contracts, exact acceptance IDs, and Standard/default
processing. Workers may not spawn children. Quality and Reviewer are explicitly excluded from P3.

## Acceptance mapping

| P3 behavior | Acceptance IDs |
|---|---|
| Five connected tabs, persistent selector, shared context and readable evidence | U01, U02, U03, U05 |
| Baseline 10 / 6 / 2 / 2 with exact records | S01, M01, M02 |
| Goal and work saves do not manufacture outcomes | S02, W02, M07 |
| Existing acceptances, readiness, new acceptances, and delivery remain distinct | S03, S04, S05, S06, M03 |
| Mature pair is 1/2 timely and 2 completed-to-date | S07, M05 |
| Checklist results reconcile overall and by LAX/SFO | W05, W06, M02 |
| Future events remain isolated; reset restores seed, clock, decisions, goal, and replay state | D02, D06 |
| Unknown and shared-candidate limitations remain explicit | D04, M01 |
| Concise Changed / Not changed feedback after actions and advances | U05 |
| Browser keyboard, focus, narrow-screen and wide-table smoke | U04, partial coordinator evidence for U06 |

P3 integration tests are coordinator-owned and do not substitute for the later independent Quality
acceptance/browser suites.

## Verification plan

The closeout candidate must pass, at minimum:

- `npm run typecheck -- --pretty false`
- `npm run lint -- --quiet`
- `npm test -- --run`
- `npm run build`
- `git diff --check`

Focused coordinator tests will exercise the live V2 composition, five tabs, persistent market
context, exact LAX checkpoint progression, shared EvidenceBundle navigation, unchanged-outcome action
feedback, mature-pair and checklist results, and deterministic reset. A local browser smoke will
check navigation, selector persistence, scenario progression, evidence, reset, keyboard focus, and a
narrow viewport if the environment supports it. Any browser check that cannot run will be disclosed.

## Explicit P3 exclusions

- No full equal-depth redesign of all five markets.
- No P4 independent Quality or Reviewer launch.
- No dependency, model, reasoning, service-tier, routing-ceiling, or concurrency change.
- No production backend, persistence migration, authentication, deployment, connector, API, or
  external write.
- No real message, personal data, Steno policy, legal eligibility rule, or production-system claim.
- No scenario expected fact imported as a production value.
- No autonomous readiness, acceptance, assignment, job, rollout, or causal-program conclusion from
  saving a goal, task, preview, coaching action, decision, or process draft.

## Closeout evidence

### Integrated commits

- Serial compiling P3 baseline: `6e2f6d2390a1a394d1826710612189d8a5bee257`
  (`activate P3 LAX vertical integration`).
- Capacity candidate: `fb2a47174e38929c27d8991cfb7e9b52ca41a4e0` from the isolated
  `codex/p3-capacity-goal` worktree. It was integrated on `main` as
  `f424037818728b3c74aa3848b4fb34bf153124f8`; both patches have stable patch ID
  `f4e768ebf6d61a18343580b244b72064a011b9dd`.
- Coordinator live integration: `3c37fefa2c7b8c9e7a4dd5a0013e2251cd53a66d`
  (`build P3 live LAX vertical`).

The Capacity worker was dispatched only after the serial baseline exposed one concrete lane defect:
the baseline LAX market had no saved goal, but the Markets screen hid goal actions when the goal was
absent. The worker changed only `src/features/markets/` and `src/logic/capacity/index.test.ts`, made
the unsaved state actionable, and added focused regression coverage. Its isolated worktree had no
installed `node_modules`, so the worker could only run diff checks there; the coordinator reviewed
the exact candidate, verified the patch identity, integrated it, and ran all checks below.

### Live vertical delivered

- `src/integration/App.tsx` now selects the V2 composition in `V2App.tsx`; legacy V1 source remains
  present and was not destructively removed.
- Markets, Recruiting, Reporters, Team, and Programs share persistent market, capability, and
  attendance filters, default to LAX, and consume prepared V2 views from the canonical repository.
- The fixed scenario feed advances only through its seven dated checkpoints. Goal preview/save,
  availability, re-engagement, team, program-decision, process-draft, and partner-task actions write
  canonical synthetic records without manufacturing readiness, coverage, acceptance, delivery,
  rollout, or job outcomes.
- Shared EvidenceBundle presentation exposes the metric version, as-of time, snapshot revision,
  exact source records, limitations, and a navigation target. `Open the work` carries that exact
  evidence context and its record filters to the destination workspace.
- Deterministic reset restores the seed, fixed clock, LAX filters, active workspace, saved goal and
  decision state, and scenario replay state.

The implementation changed only coordinator-owned integration/root-tooling paths plus the reviewed
Capacity repair and its tests. No dependency, lockfile, deployment, connector, API, production
backend, or external-write change was made.

### Verification results

All required P3 commands passed on the integrated implementation:

- `npm run typecheck -- --pretty false` — exit 0.
- `npm run lint -- --quiet` — exit 0.
- `npm test -- --run` — 21 files passed, 100 tests passed.
- Focused integrated suite for `App.test.tsx`, `MarketsV2Screen.test.tsx`, and capacity logic —
  3 files passed, 16 tests passed.
- `npm run build` — exit 0; 72 modules transformed and the production bundle emitted.
- `git diff --check` — exit 0.

The default source/unit configuration now covers `src/**/*.{test,spec}.{ts,tsx}`. The untouched V1
cross-feature suite remains in Quality-owned `tests/acceptance/` behind its explicit
`npm run test:acceptance` configuration; it targets the retired three-tab composition and is not
claimed as a P3 pass. Updating or replacing that independent suite is work for a separately
authorized Quality phase, not coordinator-owned P3 production repair.

### Local browser smoke

The local Vite application was exercised in the Codex in-app browser at
`http://127.0.0.1:4173/`:

- all five workspace headings rendered and navigation succeeded;
- changing the market to SFO persisted across Recruiting, Reporters, Team, and Programs;
- Tab moved focus from Markets to Recruiting, and Enter activated Recruiting;
- at a 390 × 844 viewport, the document width remained 390 pixels with no page-level horizontal
  overflow; workspace navigation remains horizontally reachable within its responsive control;
- the browser console reported no warnings or errors; and
- the temporary viewport override was reset and the local server was stopped.

This coordinator smoke is supporting P3 evidence, not independent Quality/browser acceptance.

### Remaining gates and limitations

- Quality and Reviewer were not launched. Independent V2 acceptance/browser ownership remains a
  separately authorized next phase.
- The configured worker service tier is still not exposed in resolved child-session metadata;
  configured `service_tier = "default"` and the Standard processing policy remain the strongest
  available routing evidence.
- P3 remains deliberately LAX-deep; equal-depth flows for the other four markets, real systems,
  real messages, persistence migration, deployment, and production claims remain out of scope.

P3 is inactive and ready for a separately authorized Quality phase.
