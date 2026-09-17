# P3 LAX vertical integration

Status: **P3_ACTIVE_SERIAL_BASELINE**

Authorized integration baseline: `97f3ed4606f62dddcf86d5ad261b77dcf1f17ed5`

Frozen source authority: `19f7df98000e346a5b4ff32e00b699276c3f62fb`

Final integrated P2 source: `2844a4bb578515d1c9a5f14357cae0c66be67763`

Routing status retained: **ROUTING_VERIFIED_WITH_TIER_OBSERVABILITY_LIMITATION**

P3 is explicitly authorized for the LAX vertical only. Quality and Reviewer remain unlaunched. This
document begins as the serial integration contract and will be updated with exact implementation,
commit, changed-file, verification, browser-smoke, and unresolved-issue evidence at closeout.

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

Pending implementation. P3 may be marked inactive and ready for separately authorized Quality only
after the live vertical and all required checks pass on an exact committed candidate, with the main
working tree clean.
