# Shared interfaces to freeze before dispatch

This is a design specification, not implementation code. During serial setup, the coordinator turns it into
small compiling TypeScript interfaces in `src/contracts/`. Freeze exact names, field types, callback signatures,
and public exports before workers begin. Do not build business behavior in setup.

## Records
| Record | Required information |
|---|---|
| Market | Stable ID/code, full name, planning period, first-job goal, explicit conversion and lead-time assumptions |
| Reporter | Stable ID, fictional name, one recruiting-market owner, service-market IDs, source, preferences |
| Lifecycle event | Stable ID, reporter, timestamp, stage/event, reason, author, market ownership at entry where needed |
| Screening review | Reporter, sample checklist results, unresolved information, review reason, reviewer and timestamp |
| Job | Stable ID, reporter, job market, scheduled/completed/canceled state and timestamps |
| Follow-up | Stable ID, reporter, next step, assigned team member, due date, state and history |
| Team/coaching | Team member ID; reporter-linked workload; coaching or process-clarification note with next action/date |
| Improvement | Stable ID, market(s), change type, hypothesis, owner, partner deliverable, dates, observation window and sample results |
| Decision / process draft | Improvement ID, Continue/Change/Stop, rationale, timestamp; separate editable draft steps/owner/trigger |
| Demo snapshot | Schema version, revision, fixed as-of time, records above and simulation replay markers |

Use consistent UTC timestamps and clearly scoped date windows. One person can serve several markets without being counted several times.
No certification field or eligibility rule should imply actual Steno policy; sample verification is labeled illustrative.

## Module boundaries
| Module | Public responsibility |
|---|---|
| Data repository | Load, save a validated snapshot, reset. In-memory is sufficient; versioned local storage is optional. No business calculations. |
| Rules | Pure selectors, planning previews, command validation, state transitions, view-model builders and record-backed review summaries. |
| Integration | Single canonical snapshot, global market selection, selected tab, mutation status, repository use and callbacks to screens. |
| Screen | Typed view model + typed actions. Local form drafts, search, sort and open-panel state only. |
| UI / shell | Frozen component props, style tokens and controlled navigation/market-selector props. No business state. |

Freeze at least one named public screen export per feature, and load/save/reset plus metric/command entry points for data and logic.
Avoid a general framework: each callback must correspond to an actual required interaction.

## View and action checklist
Markets view: market rows, period labels, actual counts, goal/gap, observed reason and supporting records, current assumptions,
preview requirements/lead time and validation errors. Actions: select market, preview a plan, save a plan, cancel a draft, open relevant reporter work.
Reporters view: stage counts, rows, detail/history, screening state, choices for owner, blocker, preferences, workload and coaching notes.
Actions: select reporter, save screening review, update follow-up, preview outreach locally, record coaching/clarification.
Improvements view: change cards, dated descriptive results, incomplete observations, partner work, current decision, process draft and weekly review.
Actions: decide with rationale, create draft process, edit draft. No auto-rollout or automatic causal verdict.
Shell: current market/tab and callbacks, disclosure, demo date, reset and explicit scenario simulation.
All saves return a consistent success/error result so views do not invent different failure handling.
Freeze stable scenario IDs and accessible test anchors for quality, not the entire visual seed dataset.

## Rules that must have one owner
- First job = earliest completed job for a unique reporter, no later than as-of time. Ignore cancellations, future completions, and duplicates.
- Pipeline/cohort views use recruiting-market ownership; completed-first-job goal progress uses the first job's actual market and plan period.
  Explain these different populations when shown together. A repeat job is not another first job.
- Historical 14-day rate uses onboarding entrants with a full observation window. First completion must occur within that reporter's 14 days.
  Recent entrants are still observing; empty denominators produce null and a readable explanation, not a false 0%.
- A late first completion never retroactively makes that person's 14-day outcome successful. Hold the historical cohort fixed when
  demonstrating an unchanged rate; a moving population may otherwise change the aggregate legitimately.
- Current-stage headcount is a snapshot, not a conversion rate. Wait age uses the fixed demo date.
- Plan requirements are synthetic scenarios. Validate rates in (0,1], nonnegative integer goals and feasible date windows; round required volumes up.
  For the MVP use a fresh-recruiting scenario without crediting an existing pipeline; label this limitation and show lead time.
- Saving a plan, screening action, follow-up or message preview never fabricates a completed job.
- Record screening prerequisites and reasons; incomplete required sample checks cannot silently become verified.
- Process drafts require a recorded decision and rationale. Save as process is available for Continue, creates a draft, and is editable; it is not a rollout.
- Synthetic experiment differences are descriptive, not causal proof. Incomplete windows remain visible.
- Replaying the same demo simulation cannot duplicate jobs/events. Reset clears operational changes, time advance and replay markers.

## Practical state discipline
Use one serialized mutation path in integration; features never write storage. Give commands stable IDs and, where persistence
is used, an expected revision. Handle repeated clicks and stale results explicitly. This is small demo consistency logic,
not a requirement to build distributed concurrency infrastructure or a production event platform.

## Future connection boundary
The adapter can later accept an approved export or authorized server response. Keep source IDs and record provenance separable.
Actual Steno schemas, API access, field ownership, authentication and write permission are unknown.
Do not add a live adapter, privileged browser token, or Connect to Steno button to the MVP.

## Interface changes during a build wave
Worker requests the exact missing field/callback, why, and affected modules. Coordinator pauses affected lanes,
updates the seam and compiling baseline, then reissues their work. Unaffected lanes may finish against the previous contract
if compatible. Any handoff spanning a contract revision must identify the revision and be retested after integration.
No unilateral API renames, duplicate shared types, hidden global stores, or copying canonical calculations into a screen.
