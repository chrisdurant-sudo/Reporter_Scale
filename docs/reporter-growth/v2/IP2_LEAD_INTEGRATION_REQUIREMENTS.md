# Coordinator integration requirements for the revised Experience proof

> September 19 viewport amendment: the user does not need phone optimization. `P4_INTERVIEW_VIEWPORT_SCOPE.md` governs the current interview proof: desktop/tablet (1440×900, 1024×768, 768×1024), basic narrow-screen usability retained, no required 390px visual proof. Historical requirements below remain evidence of their original scope.

This supplements `tasks/experience-redesign.md` for the authorized interview amendment. It does not open IP2 until the serial data/logic and full baseline gates pass. The Lead owns the shared UI/shell/styles and Overview/Funnel only. Coordinator owns contracts, integration, reference versioning and governance; specialists remain blocked until the new exact-commit proof is accepted.

## Reference and source baseline

Read `design-lock/reference-manifest.md` and inspect its actual interactive HTML and fixed screenshots. Preserve its files and hashes. The approved `P4_INTERVIEW_IMPROVEMENT_PLAN.md` authorizes the stated changes to charts, filters, capacity/cohort semantics and management workflows. Retain the existing visual system and density where that amendment does not change them.

Before implementation, propose the separately versioned amended interactive reference and state captures in a coordinator-designated scratch output directory. Do not edit the repository's design-lock package. Coordinator reviews the proposal against the approved amendment, commits the new reference package and returns its exact path/commit. The proposal should establish shared controls, charts, drawer/forms and changed workspace compositions for the later specialists, without implementing their feature paths. No second implementation-start approval is required.

## Overview and evidence ports

Use `PreparedMarketsView.schedule`, `growthGoal`, `originalPlan` and the richer prepared market/attention fields. Requested slots reconcile with confirmed plus unresolved slots. Possible/unverified/unknown are separately labeled subsets, not extra slots. Availability is not readiness, a saved goal is not progress, and readiness is not acceptance or a completed job. The original fixed LAX plan remains its own ten-slot story even if current demand includes additional requests.

The coordinator now passes IC09 `weeklyReview` to MarketsV2Screen, plus `onInspectEvidence(bundle)` and `onNavigateTarget(target)`. These direct callbacks work for cross-domain weekly evidence; do not look up another domain's bundle in Overview's evidence array. Existing `onOpenEvidence(target)` remains compatible for an actual Overview evidence target. Each attention row must use its own supplied evidence/target; never replace it with `view.evidence[0]`.

The weekly review will state its reporting window, source observation scopes, compatible targets, available comparisons, constraints, recorded accountable actions and actual review dates. Render prepared values and reasons; do not recalculate business facts in JSX. Program cohort comparisons are not prior-week changes. Unknown targets/review dates stay explicit. Task due dates and goal deadlines are not review dates.

This is an explicit market-wide review at the current snapshot time, independent of workspace-local owner/status/search/source and demand capability/mode filters. It follows the selected global market and selected entry cohort, with a separately stated Team reporting week. Display its scope and the supplied limitations. When Overview is opened from historical evidence, distinguish that historical detail from the current weekly review. Eight focused composition tests reconcile All and LAX, compatible target revisions, DFW qualification, observing referral cost, actual March checklist next review, unique Team period evidence and unavailable comparisons.

## Funnel controlled state

Read `IP1_RECRUITING_HANDOFF.md`. V2App now passes the complete control port:

- `onChangeRecordFilters(RecruitingRecordFilters)`; current selection is `view.recordFilters`.
- `entryCohortOptions`, `selectedEntryCohortId`, `onChangeEntryCohort(id)`; January/February 2026 options are explicit half-open windows.
- `sourceOptions`, `selectedSourceIds`, `onChangeSourceIds(ids)`.
- `onInspectEvidence(bundle)`, `onNavigateTarget(target)`, `preservedEvidenceContext`.

Declare these props in the owned feature interface and render them. Send stable owner IDs and Waiting-on keys to the callback; labels are not filter keys. A status click focuses that status, and the second click clears it. Use the domain-prepared rows/counts/attention, not a parallel feature-local filtering calculation. Source scope also affects cohorts; operational status/owner/wait/SLA/search filters do not. Show that distinction concisely.

January is the default entry cohort. At the fixed baseline, All M08 is 17/51 and LAX 9/22 over 14 days; February LAX has no mature denominator and two observing cases. Use actual prepared facts, horizon and exclusions, not hardcoded percentages. The people inventory does not become an entry-cohort table simply because a cohort selector changes.

Exact external record navigation temporarily sets aside retained local filters so the target is visible. Clearing the root drill-down restores them. A local detail drawer must preserve the selections and return focus. Manual filter changes intentionally clear the exact drill-down. SLA edits retain immediate recomputation, local notes preserve whitespace, and neither changes source lifecycle facts.

Root renders a compact `.v2-linked-selection` section only in the target workspace: linked-record label, selected market, evidence date and `Clear drill-down`. Metric IDs/version/revision remain in the internal navigation context. Shared styles may make this section match the reference, but do not replace it with a second technical context block.

## Shared presentation and proof

Charts use coherent coordinates, the available container width, readable axes and useful desktop height. Pointer, keyboard and touch expose date/category, exact value, unit and historical/forecast status. Forecast assumptions and boundaries remain distinct. Cohort comparisons use categorical labels. Shared controls and drawers must remain operable at narrower widths; prioritize the required desktop/tablet proof and avoid hover-only interaction. Phone-specific optimization is outside the current acceptance scope.

Return the exact clean source commit, ownership audit, actual checks and all Overview/Funnel states at 1440×900, 1024×768 and 768×1024 plus the SLA editor. Capture route/state/commit/checksum for each artifact and actual pointer/keyboard/touch, market, navigation, filter, capacity reconciliation and attention-target interactions. Historical screenshots and DOM existence checks do not satisfy this proof. Coordinator integrates sequentially and records independent comparison; only then can the three specialists begin.

The existing independent acceptance/browser suites contain historical presentation assertions. Report concrete conflicts after the candidate exists; do not edit Quality-owned tests or preserve incorrect product behavior merely to satisfy an obsolete assertion. The later independent Quality gate remains mandatory.
