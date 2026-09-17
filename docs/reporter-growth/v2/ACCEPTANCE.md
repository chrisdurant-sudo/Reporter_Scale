# Acceptance criteria

These are future tests and review gates, not test results. A checked planning packet is not a checked application.

## Foundation gate

| ID | Observable requirement |
|---|---|
| F01 | P0 changes only v2 planning docs and narrowly authorized governance pointers; source, package files, and .codex remain untouched. |
| F02 | FOUNDATION_REVIEW identifies actual HEAD/dirty paths, source differences, blocked decisions, migration choice, and legacy-role conflicts. It stops before implementation. |
| F03 | A later source-contract freeze compiles, defines a single evidence/command/view boundary, and assigns non-overlapping paths before parallel writers start. |
| F04 | Version 1 is preserved where user data exists. Missing histories, availability, or sample memberships are not fabricated during migration. |

## Records and time

| ID | Observable requirement |
|---|---|
| D01 | Every relevant reference resolves; nationwide people counts deduplicate across markets. Source/program joins do not multiply people, jobs, or spend. |
| D02 | A future request known at baseline is counted as upcoming demand; a future person/readiness/outcome event is not exposed before its recorded scenario checkpoint. |
| D03 | The seed contains complete stage histories for displayed funnels, explicit verification/availability, and actual program members. No chart totals stand alone. |
| D04 | Unknown availability, expired confirmation, confirmed unavailability, unverified skill, and verified mismatch remain distinct. |
| D05 | Job/assignment intervals and time-zone boundaries validate. A person cannot accept overlapping work; one reporter slot cannot have two valid accepted assignments. |
| D06 | Replaying a command or scenario event does not duplicate rows or outcomes. A stale revision fails cleanly. Reset restores seed, clock, targets, decisions, and replay state. |

## Main scenario

| ID | Observable requirement |
|---|---|
| S01 | At baseline the ten specified LAX requests resolve to 6 confirmed, 2 possible, and 2 no-ready-match; every category opens the correct IDs. |
| S02 | Saving a two-addition goal, assigning tasks, previewing outreach, or drafting a process leaves coverage and first-job results unchanged. |
| S03 | Separate accepted responses for existing candidates produce 8/0/2 request categories and zero new readiness additions. |
| S04 | Verified readiness for Avery/Rowan produces 8 confirmed, 2 possible, zero no-ready-match, two additions, zero first jobs for those two. |
| S05 | Separate accepted assignments produce 10 confirmed and zero first jobs for Avery/Rowan before the scheduled work occurs. |
| S06 | Later completed-job events produce 10 completed original-plan requests and two first jobs for the new reporters; no expired request is called “upcoming.” |
| S07 | Once both onboarding windows mature, the two-person example shows 1/2 within 14 days and 2 completed-to-date, with explicit windows. Avery's late first job never becomes an on-time success. |
| S08 | Simulate an alternative decline/cancellation or missing verification: the desired success is not forced, and the unresolved work remains visible. |

## Metric integrity and evidence

| ID | Observable requirement |
|---|---|
| M01 | Shared-candidate contention is visible: two requests having the same possible reporter does not become two guaranteed capacity units. |
| M02 | Each headline, chart point, table, and evidence panel resolves to the same definition, snapshot, window and records. Counts reconcile; ratio numerators are subsets of denominators. |
| M03 | Completed first jobs are unique by reporter globally. Recruiting-market outcomes and actual-work-market fulfillment remain distinguishable. |
| M04 | Current stage snapshots are not presented as conversion; cohort funnel stages use the same members and declared horizon. Missing stage history is not silently filled. |
| M05 | Immature entrants, missing data, zero denominators and late outcomes receive the specified treatment; test exactly at the 14-day boundary. |
| M06 | A source with zero first jobs and recorded spending does not display $0 per first job. Missing spending is not treated as free acquisition. |
| M07 | Main-goal progress follows its original metric/scope/deadline; editing target or assumptions cannot change actuals or silently rewrite old evaluations. |
| M08 | Weekly and trailing-network measures show their periods, preserve partial-week labels, and reconcile entering/leaving identities without calling no-recent-work attrition. |
| M09 | Market signals change when contributing facts change. Removing the relevant missing verification or overdue work changes its signal, not unrelated metrics. |

## Work, programs and people

| ID | Observable requirement |
|---|---|
| W01 | Needs-attention queues exclude completed/closed people without a concrete open action. Blockers and next steps are specific, not “Routine demo progression.” |
| W02 | Completing a task does not write readiness, accepted assignments or job outcomes. Readiness requires defined evidence and prerequisites. |
| W03 | Task reassignment changes current workload but not historic completion credit. Role targets compare the same units. Quality displays only inspected cases. |
| W04 | A coaching action has an observed issue/strength, specific expectation, next review and result; no automatic ranking or score is created. |
| W05 | Pilot group membership derives 6/20 and 11/20 overall, LAX 3/10 and 6/10, SFO 3/10 and 5/10. All windows are complete and filters reconcile. |
| W06 | Pilot target is met descriptively; no automatic causal-winner claim appears. The running program retains immature entrants; the stopped program retains its evidence and reason. |
| W07 | Saving a process creates a versioned draft; approving a limited pilot is separate. Neither changes other markets, frozen cohorts, or outcome records automatically. |
| W08 | Program grid edits persist through the single repository. Grid and optional board share IDs and status. Partner tasks and local notes do not claim a live external integration. |

## Interface and delivery

| ID | Observable requirement |
|---|---|
| U01 | Five tabs are distinct and connected; one market selector persists. Capability and exact-record drill-down context survive relevant navigation. Unsupported filters are not silently ignored. |
| U02 | “Why this?” explains the calculation and shows human-readable source rows; “Open the work” selects the exact affected people/requests. IDs alone are not sufficient. |
| U03 | One primary visual/work surface per screen, readable labels and counts, status text in addition to color; no record-ID walls or cloned market stories. |
| U04 | Keyboard, focus, detail-panel return behavior, empty/error states, narrow screens and wide tables are checked in the actual browser. |
| U05 | After an action the app shows what changed and what did not. Synthetic disclosure, fixed dates, simulated events and no-real-message boundaries remain visible. |
| U06 | Actual typecheck, lint, unit, acceptance, browser and production-build results are reported against a fixed candidate. Missing checks are disclosed, not inferred from planning validation. |

## Mandatory reconciliation examples

Test at least: 6+2+2 demand partition; possible-versus-accepted distinction; unknown requirements; overlap across two markets; readiness without acceptance; late versus timely first jobs; immature source cohort; zero completed outcomes with positive spending; weighted aggregate rates; changed goal revisions; task reassignment credit; one process draft with no automatic rollout; and reset/replay after all scenario steps.

A test that asserts the same hard-coded totals used to render the page is insufficient. Tests must derive outputs from altered source records and exercise meaningful negative cases.
