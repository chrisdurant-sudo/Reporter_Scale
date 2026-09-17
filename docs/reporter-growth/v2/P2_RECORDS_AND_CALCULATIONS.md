# P2 records, calculations, and shared-evidence closeout

Status: **P2_COMPLETE_READY_FOR_SEPARATELY_AUTHORIZED_VERTICAL**

Source-contract authority: `19f7df98000e346a5b4ff32e00b699276c3f62fb`

P2 dispatch base: `e81aa54d0e61a007af33b2781b1de9c78ec497ed`

Final integrated source commit: `2844a4bb578515d1c9a5f14357cae0c66be67763`

Routing status retained: **ROUTING_VERIFIED_WITH_TIER_OBSERVABILITY_LIMITATION**

P2 is complete and inactive. This closeout does not launch Quality or Reviewer, authorize P3, wire
the V2 vertical into the running application, change dependencies, deploy, or write to an external
system.

## Closeout decision

The integrated source supports the P2 chain required by the frozen contract:

**synthetic source records → domain calculation → EvidenceBundle → exact contributing records and
navigation filters**

The frozen LAX checkpoints, checklist-program cohorts, differentiated supporting markets, repository
invariants, and M01–M13 calculation paths are reconstructable from source records. Expected scenario
facts remain test oracles and are not imported as runtime calculation results.

During closeout verification, the coordinator found one concrete source defect: weekly open-work,
unknown-work, and decision evidence was structurally valid but inherited a program's primary metric
instead of the frozen M13 definition. Commit `2844a4bb578515d1c9a5f14357cae0c66be67763`
made the smallest correction and added unit/integration assertions. No other product source changed
during closeout.

## Participating roles and integration record

The seven routed implementation roles used the committed V2 role catalog. The model and reasoning
columns are the resolved project configuration. Every role and the coordinator requested
`service_tier = "default"`. The runtime did not expose a resolved child service-tier field, so this
is configured Standard/default evidence, not direct tier observation.

All 18 accepted candidate-to-integration mappings below were rechecked with stable Git patch IDs;
each accepted candidate patch matched its integrated patch exactly.

| Lane | Resolved configured role | Branch and worktree | Candidate commit(s) | Integrated commit(s) |
|---|---|---|---|---|
| Experience | `experience` — `gpt-5.6-terra`, medium | `codex/p2-experience`; `/private/tmp/steno-p2-e81aa54-experience` | `cfdde87` | `e9abf76` |
| Data | `data` — `gpt-5.6-luna`, medium | `codex/p2-data`; `/private/tmp/steno-p2-e81aa54-data` | None accepted; the routed worker left an incomplete, uncommitted candidate at base `e81aa54` | Coordinator remediation `f1fa1fe` |
| Capacity | `capacity` — `gpt-5.6-terra`, high | `codex/p2-capacity`; `/private/tmp/steno-p2-e81aa54-capacity` | `9eaa80f`, `fb0b94e` | `422aaf8`, `558acd5` |
| Recruiting | `recruiting` — `gpt-5.6-terra`, medium | `codex/p2-recruiting`; `/private/tmp/steno-p2-e81aa54-recruiting` | `9b59dd4`, `9d1476a`, `03118bc` | `acdbe0a`, `8f3846f`, `54536ab` |
| Network | `network` — `gpt-5.6-terra`, medium | `codex/p2-network`; `/private/tmp/steno-p2-e81aa54-network` | `44d4a89`, `f261df8`, `81e2073` | `8c703cb`, `a3626c3`, `7f16cc2` |
| Team | `team` — `gpt-5.6-terra`, medium | `codex/p2-team`; `/private/tmp/steno-p2-e81aa54-team` | `e533394`, `a320898`, `f0f37a1` | `f2dec56`, `63ab698`, `7c54140` |
| Programs | `programs` — `gpt-5.6-terra`, medium | `codex/p2-programs`; `/private/tmp/steno-p2-e81aa54-programs` | `30f06ef`, `826f3d7`, `bb2f1c7`, `cc252dc`, `3030af0`, `827aa6c` | `c823661`, `3780cdf`, `ba6348e`, `b0ed1c6`, `28bc920`, `5c011fd` |

No implementation agent, Quality agent, or Reviewer agent was launched during this closeout turn.

## Files changed by lane

| Owner | Integrated files |
|---|---|
| Experience | `src/shell/V2AppShell.tsx`, `src/shell/V2AppShell.test.tsx`, `src/shell/index.ts`, `src/ui/v2.tsx`, `src/ui/v2.test.tsx`, `src/ui/index.tsx`, `src/styles/tokens.css` |
| Data responsibility, completed by coordinator | `src/data/index.ts`, `src/data/v2.ts`, `src/data/v2.test.ts`, `src/integration/p2RecordsAndCalculations.test.ts` |
| Capacity | `src/logic/capacity/index.ts`, `src/logic/capacity/index.test.ts`, `src/features/markets/MarketsV2Screen.tsx` |
| Recruiting | `src/logic/recruiting/index.ts`, `src/logic/recruiting/recruiting.ts`, `src/logic/recruiting/recruiting.test.ts`, `src/features/recruiting/index.tsx` |
| Network | `src/logic/network/index.ts`, `src/logic/network/index.test.ts`, `src/features/reporters/network.tsx`, `src/features/reporters/network.css` |
| Team | `src/logic/team/index.ts`, `src/logic/team/index.test.ts`, `src/features/team/index.tsx` |
| Programs | `src/logic/programs/index.ts`, `src/logic/programs/index.test.ts`, `src/features/programs/index.tsx`, `src/features/programs/programs.css` |
| Coordinator contract change | `AGENTS.md`, `src/contracts/v2/commands.ts`, `src/contracts/v2/contracts.test.ts`, `src/contracts/v2/work.ts` |
| Coordinator closeout correction | `src/logic/programs/index.ts`, `src/logic/programs/index.test.ts`, `src/integration/p2RecordsAndCalculations.test.ts` |

## Synthetic record foundation

The baseline seed is schema version 2 at `2026-02-16T17:00:00Z`. The final delivery checkpoint is a
cumulative application of 33 ordered scenario events. Major baseline-to-final populations are:

| Record population | Baseline | Original-plan-delivered checkpoint |
|---|---:|---:|
| Markets / metric definitions / frozen evidence snapshots | 5 / 13 / 2 | 5 / 13 / 2 |
| Reporters / acquisition cases | 63 / 63 | 64 / 64 |
| Lifecycle events | 332 | 340 |
| Capability verifications / screening reviews | 51 / 1 | 53 / 1 |
| Onboarding steps / readiness events | 55 / 51 | 57 / 53 |
| Bounded availability windows | 11 | 12 |
| Demand requests / assignment events / job outcomes | 38 / 33 / 27 | 38 / 37 / 37 |
| Team members / canonical work / targets | 3 / 7 / 2 | 3 / 7 / 2 |
| Quality checks / coaching actions | 1 / 1 | 1 / 1 |
| Sources / exact spend records | 3 / 2 | 3 / 2 |
| Programs / enrollments / notes / decisions | 3 / 48 / 2 / 2 | 3 / 49 / 2 / 2 |
| Goal revisions / workaround examples / process versions | 2 / 1 / 1 | 3 / 1 / 1 |

The seed includes 40 explicit readiness-checklist participant histories, six frozen DFW outreach
members, two baseline LAX referral participants, the ten LAX main-plan requests, and the cumulative
Rowan/Avery scenario records. All facts use `synthetic-demo` or `demo-simulation` provenance.

Repository validation covers canonical identity, record references, time order, availability and
request intervals, one accepted reporter per slot, no overlapping accepted work, accepted-assignment
links for completed jobs, exact minor-currency spend, readiness prerequisites, program membership,
and team/governance references. The cloned in-memory repository preserves optimistic revision checks,
idempotent scenario replay, mutation isolation, and deterministic reset.

## M01–M13 ownership and implementation

| Metric | Implementation owner and source-backed behavior |
|---|---|
| M01 | Capacity: distinct recorded, non-canceled upcoming request slots in the selected half-open schedule window; frozen-plan review is separate from live upcoming work. |
| M02 | Capacity: valid accepted coverage over the same M01 denominator; proposed/offered, conflicting, ineligible, or invalid commitments are excluded. |
| M03 | Capacity: mutually exclusive possible-match, no-verified-ready-match, and requirements-unknown classifications from current readiness, verification, full-interval availability, scope, and commitments; shared-candidate contention is retained. |
| M04 | Capacity with Recruiting source facts: unique first-ever, first-time-case readiness additions after the saved baseline and at/before the deadline, with the required verified capability. |
| M05 | Capacity and Recruiting: valid completed original-plan outcomes and each reporter's globally earliest valid completed job; Network reuses the accepted-outcome validity rule for person history. |
| M06 | Recruiting: current stage from known lifecycle history plus concrete open actions; completed/closed cases are not actionable without open work. |
| M07 | Recruiting: 30-day fully observed contact cohorts and stage reach; recent members remain observing. Programs retains the stopped DFW cohort against its predeclared M07 target. |
| M08 | Recruiting: first onboarding entry, mature 14-day denominator, inclusive deadline, timely first job, late completion, and observing populations. |
| M09 | Recruiting and Programs: source fixed at case/enrollment entry, same-cohort outcomes, attributable recorded spend, missing-spend handling, and no false zero-cost rate. |
| M10 | Network: distinct reporters with valid completed work in the trailing 28 elapsed days, actual job-market attribution, first-time/returning set changes, and no-recent-work without an attrition claim. |
| M11 | Team: current canonical workload, overdue/unknown due dates, first completion credit by actor, like-role/unit targets, inspected-only quality, cycle-time samples, and explicit coaching. |
| M12 | Programs: frozen enrollments joined to globally valid first jobs on one horizon, weighted market subsets, descriptive limitations, decisions, and versioned process progression. |
| M13 | Programs: goal-revision integrity plus partial/complete weekly actuals, still-open work, unknowns, and dated decisions. Closeout commit `2844a4b` ensures weekly EvidenceBundles use the frozen M13 definition. |

All M01–M13 metric IDs were observed across 36 prepared EvidenceBundles in a read-only closeout audit;
`validateEvidenceBundle` returned zero issues. The durable integration and lane tests cover the same
count/ratio reconciliation, navigation context, negative cases, and as-of boundaries.

## Frozen LAX checkpoint reconciliation

| Checkpoint | Requested or plan population | Confirmed | Possible | No verified ready match | Goal additions | Avery/Rowan first jobs |
|---|---:|---:|---:|---:|---:|---:|
| Baseline | 10 upcoming | 6 | 2 | 2 | 0 | 0 |
| Plan saved | 10 upcoming | 6 | 2 | 2 | 0 | 0 |
| Existing acceptances | 10 upcoming | 8 | 0 | 2 | 0 | 0 |
| Two new ready | 10 upcoming | 8 | 2 | 0 | 2 | 0 |
| New acceptances | 10 upcoming | 10 | 0 | 0 | 2 | 0 |
| Original plan delivered | 0 still upcoming; 10 frozen-plan requests completed | — | — | — | 2 | 2 |
| Pair cohort mature | 2 mature onboarding entrants | — | — | — | 2 | 1 of 2 timely; 2 of 2 completed to date |

The test calculates every checkpoint from cumulative records. Saving the plan changes no coverage,
readiness, or completion fact. The delivery view retains the original ten request IDs while the live
upcoming count becomes zero.

## EvidenceBundle and program reconciliation

- Every frozen LAX capacity checkpoint validates its prepared evidence with zero contract issues.
- Original-plan evidence resolves ten completed request outcomes and identifies only
  `outcome-req-lax-109` and `outcome-req-lax-110` as Avery/Rowan first jobs.
- The mature pair derives `case-lax-010` as timely, both cases as completed-to-date, and a 0.5 mature
  rate without relabeling Avery's late job.
- Checklist results derive from 40 explicit enrollments and histories: earlier `6/20`, pilot `11/20`,
  LAX `3/10` versus `6/10`, and SFO `3/10` versus `5/10`. Percentages are not averaged.
- Ratio numerator members are subsets of denominator members; count evidence reconciles to distinct
  contributing records; Open-the-work filters, as-of time, revision, and metric version match the
  EvidenceBundle.
- Unknown availability, expired confirmation, explicit unavailability, unverified capability,
  invalid assignment/outcome joins, immature cohorts, zero outcomes with spend, missing spend, and
  future-record leakage have focused negative tests.

## Five-market differentiation

| Market | Implemented record evidence | Derived operating situation |
|---|---|---|
| LAX | Ten main remote realtime requests, baseline acceptance/availability/verification records, Avery and Rowan histories, two referral members, and ordered future events | Mixed confirmed, possible, and no-ready-match capacity; onboarding and targeted referral responses stay distinct from acceptance and delivery. |
| SFO | One explicit in-person request with a ready reporter whose availability is recorded as unknown, plus 20 checklist histories | Availability must be confirmed before claiming a match or recommending more sourcing spend. |
| DFW | Six broad-outreach enrollments, one relevant qualification in the completed cohort, `360000` USD minor units of attributable spend, and an explicit stop decision | Broad sourcing produced weak relevant qualification against its predeclared target; the evidence is retained without generalizing causality. |
| ORD | Three acquisition cases, three onboarding records with `same-required-step-missing`, and three canonical owned work items | Repeated onboarding work is blocked on the same required step, supporting handoff/workload inspection. |
| ATL | Two previously working ready reporters, historical accepted jobs, one expired availability record and one absent/currently unknown availability state, plus two re-engagement work items | Stale/unknown availability supports re-engagement and confirmation, not inferred refusal, attrition, or poor performance. |

## Coordinator-owned changes

Before lane integration, commit `5d906d624621eb8c427eceeb71483ad35ca1f6c3` added the missing
Team command/actor contract: `TeamMember.actorId`, typed work assignment, target, quality, coaching,
review, and practice-sharing command envelopes, plus contract tests. It also recorded the authorized
nondestructive execution policy in `AGENTS.md`. No dependency, routing-model, reasoning, service-tier,
repository schema-version, or external integration change was made.

Because the Data worker did not produce an acceptable commit, the coordinator implemented and
integrated the data foundation and reconciliation tests as
`f1fa1fe1695a850566d464a7157c5967699d5e2e`. The rejected worker candidate is not represented as
integrated work.

Closeout commit `2844a4bb578515d1c9a5f14357cae0c66be67763` corrected only M13 evidence
identity and its tests.

## Verification

No dependency installation was run. Final closeout commands and exact results:

| Exact command | Result |
|---|---|
| `npm run typecheck -- --pretty false` | Exit 0. `tsc -b --pretty false --pretty false` completed without diagnostics. |
| `npm run lint -- --quiet` | Exit 0. `eslint . --max-warnings=0 --quiet` completed with no warnings or errors. |
| `npm test -- --run` | Exit 0. 21 test files and 95 tests passed, including 7 Data tests, 37 domain-logic tests, and 6 P2 reconciliation tests. |
| `npm run build` | Exit 0. TypeScript build and Vite production build completed; Vite transformed 66 modules. |
| `git diff --check` | Exit 0. No whitespace errors. |

Additional focused verification before the final run:

- `npm test -- --run src/logic/programs/index.test.ts src/integration/p2RecordsAndCalculations.test.ts`
  exited 0: 2 files and 15 tests passed after the M13 correction.
- A temporary read-only Vite-node audit prepared 36 bundles across the five domain workspaces,
  observed every metric ID M01–M13, and returned zero `validateEvidenceBundle` issues. The temporary
  audit file was removed; durable coverage remains in the committed unit/integration tests.
- Stable Git patch-ID comparison returned exact matches for all 18 accepted candidate/integration
  pairs.

## Deferred P3 and known limitations

- P3 is unstarted and unauthorized. `src/main.tsx` and `src/integration/App.tsx` still compose the
  preserved V1 three-tab application. The V2 shell, domain views, scenario application, cross-tab
  actions, reset feedback, and complete LAX walkthrough are not wired into the running browser app.
- Quality and Reviewer were not launched. No independent acceptance/e2e/browser, responsive,
  keyboard, focus-return, or fixed-candidate review result is claimed.
- The baseline contains 63 reporters and the dated scenario grows to 64, below the planning brief's
  approximate 80–100-person suggestion. The required anchor cohorts and five differentiated markets
  are complete, but P3 must not imply broader statistical representativeness.
- The seed has capability-verification records but no standalone credential records. No sample
  credential is claimed as legal eligibility, and P3 must keep missing credential evidence unknown.
- The routed Data worker left an incomplete, uncommitted candidate in its isolated worktree. It was
  rejected, not integrated, and the coordinator remediation is explicitly identified above. The
  preserved worktree also remains outside `main`; no destructive cleanup was performed.
- Resolved child service tier remains unobservable. Root and all role layers request
  `service_tier = "default"`, and Standard/no-Fast governance remains in force.
- Storage remains cloned in-memory synthetic demo state. There is no production backend, live
  connector, real message, authentication, deployment, or real Steno data/policy claim.

These limitations do not block P2 records/calculation closeout. They constrain the scope and evidence
required by the next separately authorized phase.
