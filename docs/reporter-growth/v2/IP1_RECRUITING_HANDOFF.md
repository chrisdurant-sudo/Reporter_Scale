# Recruiting logic handoff for the revised Funnel

Lane base: `4e54406da9674cdb62cfa270d53bc135d75c2a0b`. Reviewed lane candidate: `912ea2f19af2f54416fd41883da0d9c38898719d`. Integrated source: `91cd6663fd56c1fa90b430772cdcfaf351978752`. Logic evidence is in the colocated Recruiting tests and coordinator full-suite evidence; this does not establish presentation acceptance.

## Use the prepared interface

`prepareRecruitingWorkspace(snapshot, context, { slaInput, filters })` accepts operational status/stage, stable owner member ID (or `unassigned`), Waiting-on key, SLA state, search and sort. `ownerFilterOptions` and `waitingOnFilterOptions` contain exact case/action membership. Owner is responsibility on canonical open actions, not an invented unique case owner; ambiguous/unassigned responsibility is explicit on each case.

Pass user selections through `options.filters` so rows, counts, current wait summaries, operational KPIs and attention use the same filtered population. The exported `filterRecruitingCases` is also pure. Counts and option membership must not be reconstructed from labels. Select a counted status on the first click and clear it on the next; the Lead owns that presentation state.

Render the declared `filterScope`: cohort outcomes and dated wait trends exclude operational status/owner/SLA/search filters; they retain market and exact record/source scope. Demand request, capability and attendance filters do not define acquisition cohorts and are explicitly listed as ignored demand filters. Keep their scope visible rather than suggesting every chart uses every local selection.

Use `attentionItems[].evidence` and `.navigationTarget` directly. Each names its own market, case, reporter and canonical action. A linked work item targets Team; a screening/onboarding action targets Funnel. Do not redirect every item through the first general evidence bundle.

`waitByStatus` exposes median and mean separately, with exact waiting case IDs. These are current-stage elapsed waits, not completed-stage processing durations. `kpis.percentStartedWork` is now the M08 first-onboarding cohort's mature 14-day rate. Label its entry window, horizon, numerator/denominator and still-observing count. M07 uses the first outbound contact and a 30-day horizon. M09 source outcomes use that same contact cohort, fixed source-at-entry and explicit spend attribution; a conversion ratio is not a currency cost rate.

`projectWorkItemAt` from shared logic reconstructs editable action fields for historical queries. Same-time append order determines the latest owner/status. Historical wait populations stop counting a person after their valid first completion.

## Fixed baseline cohort diagnostics

At the seed time, February 16, 2026, these are distinct entry windows, not alternative calculations of the same denominator. The app still supplies its original February-entry default pending the Lead's explicit cohort controls/labels. A prior-calendar-month view supplies observed outcomes without pretending recent entrants have failed.

| Entry window | Scope | M07 mature / observing | M08 timely / mature / observing |
|---|---|---|---|
| Jan 1–Feb 1, half-open | All | 31 / 4 | 17 / 51 / 0 |
| Jan 1–Feb 1, half-open | LAX | 7 / 0 | 9 / 22 / 0 |
| Jan 1–Feb 1, half-open | DFW | 3 / 4 | 0 / 2 / 0 |
| Feb 1–Mar 1, half-open | All | 0 / 3 | 0 / 1 / 10 |
| Feb 1–Mar 1, half-open | LAX | 0 / 3 | 0 / 0 / 2 |
| Feb 1–Mar 1, half-open | DFW | 0 / 0 | 0 / 0 / 1 |

Every typed cohort member exposes case/reporter ID, canonical entry event, entry time, deadline, observed end and maturity. Counts, member-set reconciliation and boundary invariants are asserted in `src/logic/recruiting/recruiting.seed.test.ts` and `recruiting.test.ts`. A zero mature denominator is unavailable, never 0% conversion. No source spend is allocated to a selected subset unless the source records actually support that allocation.

Remaining: Lead controls/charts and exact evidence links, full revised visual/interaction proof, then independent Quality IP03/IP05/IP06 and cross-workspace acceptance. The malformed stored edit-history validation repair is separately tracked under IC07 and remains Data-owned.
