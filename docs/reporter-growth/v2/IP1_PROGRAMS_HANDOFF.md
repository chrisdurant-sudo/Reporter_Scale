# IP1 Programs integration and presentation handoff

Worker base `40c3cfe2c8ac87806c333348e981a6ddd4b2f0a4`, candidate `fe25433912f5b380eacf958c776e1f2095dafcc6`, integrated at `5484a9a`. The coordinator independently passed the five-file boundary audit and governance. Worker final checks passed typecheck, lint, build and all 296 unit/integration tests with two workers. Earlier concurrency timeouts were rerun without assertion/time-limit changes. The active ledger records combined verification. This handoff describes the IC05/IC06 interface; it is not visual or independent Quality acceptance.

## Prepared outcomes and scope

`prepareProgramsView` returns rows, `groups`, `cohortComparisons`, exact evidence and navigation targets, source-backed owner options and declared filter scope. `resultOverTime` is retained only for historical compile compatibility: its points are categorical cohort comparisons. Replace the old connected time-series plot. A selected `result` is one cohort identified by retained evaluation evidence, never an average or alphabetically last aggregate; use `resultSelectionReason` and inspect all groups.

M07 measures qualification lifecycle events within the declared horizon. M12 measures globally first valid completed jobs within the enrollment horizon. M09's primary unit is currency minor units per timely first job, with separate supporting stage/first-job conversion memberships. Use `outcomeLabel`, `unit`, `currency`, `followUpDays`, mature/observing counts and the evidence computation; never format every result as percent starting work.

The checklist's earlier/pilot results are All 6/20 and 11/20, LAX 3/10 and 6/10, and SFO 3/10 and 5/10. Its declared whole-program threshold is 50%. Market subsets may show that threshold as a benchmark, but cannot claim a compatible per-market target was met. The DFW broad-outreach result is qualification 1/6 against 40%, with its original stop decision and 360000 USD minor units of recorded direct spend retained. The current referral cohort has two observing entrants; cost remains unavailable while whole-cohort spend cannot be allocated to mature outcomes.

`targetDetails` retains the originally declared revision, revision evaluated at the latest decision, latest current revision, all revisions, group applicability, compatible value, benchmark and reason. New targets do not retroactively change a retained decision's evaluation. Do not copy a target to another cohort or market subset. Source contributions retain allocation, currency, direct-spend records and excluded labor/overhead; mixed currency, zero-job and partial-population costs remain unavailable with reasons.

Program administrative stage is distinct from completed cohort observation. The checklist remains in its canonical review stage with a retained bounded-expansion proposal. Use observation labels for mature cohorts without inventing a completed/rolled-out program lifecycle. Exact filters and source scopes affect prepared results; demand capability/mode filters are explicitly unsupported enrollment attributes.

## Canonical decisions, text and process versions

`prepareProgramsCommand(snapshot, ProgramsCommandEnvelope)` returns a pure `ProgramsCommandMutation`. Root composes `requestedWork` through Team and saves the parent command once with `composeProgramsCommand` and `commitV2Command`. A failed task or repository write abandons the whole mutation. No private task construction belongs in Programs.

Text commands preserve entered whitespace and allow explicit empty text to clear a note or next step. Decision commands require entered rationale, active accountable owner and explicit future review date; Programs attaches current source evidence itself. Expansion requests a bounded review task without altering enrollment, readiness, assignment or job outcomes. Process drafts require a selected canonical source version, owner and review date; they copy its actual steps/trigger/exceptions and append a new version/history. Saving is not rollout.

Each row supplies `processVersions`, `processGaps`, the original `workaround`, participant onboarding records, linked Team work and exact targets. Preserve responsible role, SLA, evidence requirement and exception route. Show absent historical fields as missing; never invent industry policy. Current owner/stage/review fields lack complete historical edit history, so `historyLimitations` must remain visible in historical details.

The specialist will receive `commandContext: DemoActionContext` and exact navigation ports from V2App. Show the active synthetic actor and use current command time, not the viewed historical evidence time. Declare the coordinator's typed command ports, await every save, retain inputs on failure and report acknowledged storage success. Replace historical one-click decisions and generic process/task factories when these forms are integrated.

V2App now passes top-level `onSaveDecision(ProgramDecisionSavePayload)`, `onSaveDraft(ProcessDraftSavePayload)` and `onCreateLinkedWork(WorkCreatePayload)`; existing `actions.onSaveProgramText` also uses the canonical Programs transaction. Decision/draft compose requested Team work before one parent save. Linked work uses Team directly with the active synthetic program actor. Every new port rejects errors. The old `actions.onRecordDecision`/`onSaveProcessDraft`/`onCreatePartnerTask` remain temporary legacy compatibility callbacks until the specialist forms replace them; coordinator must then remove those factories, not leave a second write path.

## Weekly review

`prepareWeeklyProgramsReview` retains frozen program cohorts independent of the reporting week, current canonical work, decisions in the stated week and source-backed accountable actions. `actions` already carry exact targets, owner, real next review date, source and limitations; root forwards these without inventing dates from task due dates. Decision rationale is evidence, not an entered next step. A stopped program with no next action/review does not become an overdue review solely from its completed historical review date.

IC09 root composition maps each group to its metric/unit/target/evidence and keeps cohort comparison separate from prior-week change. The Lead renders this prepared market-wide review and source limitations. IP10/IP11/IP12, all required desktop/mobile states and independent Quality remain pending until their actual gates pass.
