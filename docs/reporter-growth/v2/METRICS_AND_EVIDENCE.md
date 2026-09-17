# Metrics and evidence

All operational thresholds and dates here are sample definitions for this demo. None is a Steno benchmark. A metric without the necessary source records is unavailable, not zero.

## Shared measurement context

Every result declares its unit, population, time window, as-of timestamp, metric version, and snapshot revision. Report dates use America/Los_Angeles for comparable nationwide weekly reporting in this demo; request schedules display in their own market time zone. UTC storage and zone-aware reporting boundaries must agree.

Use explicit modes rather than a misleading universal date filter:
- **Upcoming work:** request schedule window, plus the selected current as-of time.
- **Current work/network:** state as of the selected time.
- **Activity:** events that occurred in a displayed reporting week.
- **Cohort outcomes:** cases that entered in a displayed entry window, with a fixed follow-up horizon.
- **Plan review:** the request/member IDs frozen in the original plan, including later cancellations or completions.

A future request created before the as-of time belongs in upcoming demand. A future readiness/completion event does not belong in current results. Record both occurredAt and recordedAt when the distinction matters; no future knowledge may improve a baseline signal.

## Capacity and market goals

### M01 — Requests needing a reporter

Count distinct non-canceled DemandRequest IDs with startAt in the selected schedule window and recordedAt <= asOfAt. The live “upcoming” view also excludes already elapsed work; the original-plan review deliberately retains its frozen request set and shows outcomes.

One request is one reporter slot in this MVP. Do not mix this count with hours, people, or total network size. Requests with incomplete requirements remain visible as “requirements need confirmation,” not silently eligible.

### M02 — Confirmed coverage

Numerator: request IDs with one valid accepted assignment at asOfAt. Denominator: M01's same request IDs. Offered/proposed, canceled, conflicting, or ineligible assignments do not count. Return reason records for excluded commitments.

Report `6 of 10 confirmed`, not “6 reporters available.” A previously accepted assignment whose credential/availability evidence becomes invalid is flagged for review rather than confidently labeled valid coverage.

### M03 — Possible matches and no verified ready match

For each unconfirmed request, apply the declared sample requirement checks, current verification/readiness, explicit availability for the whole interval, service scope, and existing commitments.

Classify it as `possible-match` when at least one candidate passes, otherwise `no-verified-ready-match`. Unknown evidence is reported as a reason, not converted to a known refusal or lack of skill. A supporting request with missing requirements gets its own `requirements-unknown` classification rather than a false match result.

These are mutually exclusive request categories, not guaranteed simultaneously fillable capacity. Surface shared-candidate conflicts. Candidate headcounts are distinct and cannot be multiplied by the number of matching requests.

For the complete-requirements main scenario: confirmed + possible-match + no-ready-match = 10. With unknown requirements elsewhere, the fourth category must be included in the total.

### M04 — New realtime-ready additions against the main goal

Count unique first-ever readiness events occurring after the baseline and by the goal deadline for LAX-owned first-time cases that have verified realtime capability at readiness. Exclude people already ready at baseline and returning people. Qualifying rows include their verification evidence, readiness timestamp, and goal scope.

The baseline is 0 and target is 2. This measures readiness additions, not accepted work or perpetual availability. Show actual availability/coverage next to it as separate outcomes. A person who later becomes unavailable does not erase the historic readiness event, but current capacity must reflect the new unavailability.

### M05 — Completed work and first jobs

Completed work counts distinct completed JobOutcome/request pairs. A first job is the earliest valid completed job for each reporter across all markets. First jobs in a period count only those earliest completions in that period. Multiple jobs and cross-market service do not create multiple first jobs.

Use the actual job market for fulfillment reports. Use the recruiting market fixed at cohort entry for recruiting outcomes. Label the basis; the two market totals need not match. Main-story first jobs are filtered to Avery and Rowan, not confused with all historical pilot jobs.

## Recruiting and sources

### M06 — Current stage and waiting work

Project each case's stage from valid events known by asOfAt; derive first-job completion from jobs. Current-stage counts are a stock, not conversion. Stage-age uses the most recent entry into the current stage, with pause/resume history retained. Do not label a completed person's age as “waiting.”

Default the action queue to unmet required steps, overdue open work, stale required information, or unowned needed actions. Closed/complete cases are not actionable without a specific new open work item. “Routine demo progression” is never a blocker.

Thresholds live in versioned sample policy, for example five elapsed days in screening. Expose the threshold and cases; do not call them external industry standards. Unknown information is a separate flag from known negative outcomes.

### M07 — Funnel progression

Select unique acquisition cases whose first outbound contact is within the entry window. Use complete stage events to show whether and when those same cases reached each later stage. For finalized 30-day conversion, include only cases with a full 30 elapsed days of observation and count stage reaches within that horizon.

Show recently contacted cases separately as “still being observed.” A current-work strip and a historical cohort funnel can share a page but cannot share mislabeled counts. Missing stage history, withdrawal, not-qualified, paused, and no-response have explicit categories/reasons.

Every bar opens the exact members. Its comparison uses the same horizon, filters, and entry basis; no averages of source percentages.

### M08 — First job within 14 days of onboarding

Use first onboarding entry per first-time case. Mature when asOfAt >= entryAt + 14*24 hours. Numerator: mature entrants whose earliest completed job is at or after entry and at or before that deadline. Denominator: all mature eligible entrants in the fixed entry cohort, including unsuccessful and paused entrants. Observing entrants are shown separately.

A timely completion by an immature entrant can be displayed in “so far” records, but do not insert it into the finalized rate while excluding that entrant from the denominator. Rate is null when denominator is zero.

A late job changes completed-to-date totals, never the within-14-days classification. A frozen report retains its original member set/as-of; a later report may contain more mature entrants and must disclose the change.

### M09 — Source contribution and direct spend per first job

Use the primary source fixed at acquisition entry. Show contacted, qualified, ready, and first-job member counts from the same selected cohort and clear observation windows. Separate re-engagement from first-time acquisition. Multiple assisting programs do not each get exclusive causal credit for the same person.

Direct sourcing spend per first job = attributable source spend for the selected fully observed cohort / its first-job completions within the defined horizon. Identify excluded labor/overhead if not modeled. With zero completions, display “No first jobs yet; $X spent,” not $0 per first job. With missing spend, display “Spend not recorded.”

## Network and team

### M10 — Recently working, new, and returning

“Recently working” means a completed job in the trailing 28 elapsed days at the selected as-of. It is not a claim of availability. For a weekly network-change chart, compare distinct active-person sets at the two week boundaries. New to the active set can be classified as first-time or returning based on earlier global completed-job history. Departures from the trailing window are “no recent work,” not attrition or unwillingness.

All-market counts are a union of person IDs. Market views use actual work market for recent work and clearly labeled service-market coverage for capability browsing; these are separate filter bases. A cross-market person can appear in several market views but once nationwide.

### M11 — Team execution, quality, and development

Open workload: distinct open tasks currently assigned to the person. Overdue: open tasks with dueAt < asOfAt. Unknown due dates remain unknown. Completed work: qualifying completion events within the reporting window, attributed to the completion actor; reassignment must not transfer historical credit.

Compare output only against the corresponding role/work-unit target. Quality: passed required checks / inspected work items, with the sample visible. Do not imply uninspected work was checked. Cycle time must show the observed completed cases and still-waiting ages, not hide unfinished cases.

Coaching progress is an explicit review/action record, not an automatic performance score. Repeated processing does not earn duplicate completed-work credit.

## Programs and formalization

### M12 — Program results

Compute program groups by joining explicit enrollments to lifecycle/job outcomes using the frozen measurement plan. Apply the same horizon to the baseline and test group. Honor the market-at-entry filter; explain when a selected market is a subset of the whole program.

For the completed checklist pilot: earlier 6/20=30%; pilot 11/20=55%; target 50%. LAX subset 3/10 versus 6/10; SFO 3/10 versus 5/10. Zero entrants in a selected market is “No participants in this market,” not a 0% failure.

The observed result supports “target met in this sample.” It does not prove causal impact. A running referral program can be promising and still lack a final outcome window. A stopped program must retain its original target, membership, spending, and reason.

### M13 — Goal and weekly review integrity

A saved goal refers to a specific metric version, baseline, scope, target, deadline, and owner. Store revisions; preserve the originally evaluated target. Goal changes cannot mutate observed data or silently relabel historic success.

Weekly summaries consist of actual results, still-open work, unknowns, and explicit decisions. Each claim links to its evidence bundle; no independent summary number or record-ID paragraph. Partial weeks are marked partial. Net changes reconcile to entering/leaving records, not a subtraction of unrelated metrics.

## How evidence is presented

Default view: short finding, count, next step. `Why this?` opens:

1. What is being counted and when.
2. The calculation and sample rule.
3. Human-readable included records and relevant exclusion reasons.
4. Unknown information and limits on the conclusion.
5. `Open the work` with exactly those IDs and the same context.

For counts, shown member count must match the value. For ratios, numerator IDs are a subset of denominator IDs. For comparisons, both sides disclose their windows. For cost metrics, source amounts reconcile without join multiplication. No prewritten signal with unrelated supporting records is acceptable.
