# Interview improvement implementation plan

Date: September 18, 2026
Status: **IMPLEMENTATION AUTHORIZED — IP1 SERIAL DATA/LOGIC**

September 18 start: the user explicitly said “please start” after the readiness review. The new phase and prerequisites are recorded in `P4_EXECUTION_STATE.json` and `P4_INTERVIEW_CONTRACT_DELTAS.md`. Earlier planning-only statements below describe the prior handoff; no second start approval is required.

The user requested this proposal be incorporated into the plan and requested the model upgrades.
This amendment supersedes conflicting presentation requirements in the September 17 design lock,
acceptance packet and task briefs only where stated below. It does not declare the prior candidate
accepted, authorize deployment, or start a new implementation wave. Existing P4 history is retained.
Read `ASTRA_COORDINATOR_HANDOFF.md` first for the correct checkout and current evidence state.
The detailed audit is `INTERVIEW_PRODUCT_REVIEW_2026-09-18.md`; this document makes it actionable.

## Product outcome and boundaries

Keep All / LAX / SFO / DFW / ORD / ATL and all five workspaces. All is the nationwide default.
Keep the selected market when moving between workspaces. LAX is the primary interview narrative,
not a restriction on filtering: capacity need → funnel bottleneck → assigned team action → reporter
readiness → acceptance → first completed job → program decision. Other markets must retain meaningful,
independent records and interactions. DFW supplies the example of stopping a weak sourcing channel.

Use synthetic data only and label it plainly. Preserve canonical facts, metric definitions and
command safety. Readiness, availability, acceptance and completed work are distinct. New prepared
views or commands require a bounded contract-change request and coordinator-owned contract updates.
Never manufacture a trend, claim causality from a small pilot, or imply simulated results are business
achievements. No dependencies, deployment, external messages or integrations are authorized here.

## Priority 1: make the current product trustworthy and usable

### Shared charts and filters — Experience Lead; domain support only when needed

Replace the square SVG plot squeezed into a wide container with a plot that uses its available width
and height. Align data, axes, grid and labels in the same coordinates; allow a useful 280–340px plot
height on desktop where appropriate. Provide hover, keyboard focus and touch inspection of date,
series, exact value, units and historical/forecast status. Keep historical and forecast styling and
boundary distinct. Resize must preserve readable labels and hit targets. A cohort comparison is a
cohort comparison, not an invented time series.

Use one Fleet-inspired filter and KPI system across Funnel, Reporters and Programs: compact counted
status buttons, search, useful filters, sort, visible result count and clear-all. A normal status click
focuses that status; clicking it again restores All. If multi-select is needed, expose it explicitly.
Use stable IDs, never display labels, for filtering. Explain whether a filter affects records only or
the whole workspace; no silently unrelated chart or attention state. Filter state must survive a
record drawer round trip. Counts and active state must agree with displayed records.

### Overview — Experience Lead + capacity support

Replace market-count KPI with operational capacity information for one clearly labeled schedule
window: requested slots, confirmed covered slots, unresolved slots, newly ready reporters versus
the growth goal. Market count becomes context. Reconcile requested = confirmed + unresolved under
the agreed slot definition; show possible, unverified and unknown coverage separately without double
counting. Do not compare current availability to future demand without displaying both scopes.

The market grid shows demand, confirmed/possible coverage, unverified/unknown need, growth and a
specific next action. Person counts and job-slot counts stay distinct. Derive connected summaries
from selected-market data. Attention rows identify market and person/program as applicable and route
to that exact record, not the first evidence item. Forecasts show assumptions and uncertainty.

### Funnel — Experience Lead + recruiting support

Fix Waiting on filtering: the observed “Assigned to Maya Chen (9)” selection returned zero records.
Separate Owner from Waiting on (the next actor/blocker). Include stage, owner, SLA state and source
filters where useful. Fix normal stage click behavior: selecting Applicant must show Applicants,
not exclude them. Preserve SLA editing, notes and elapsed-time behavior.

Distinguish People inventory from defined-cohort conversion/source performance. Every percentage
must expose numerator, denominator and observation horizon; make the existing 42% interpretable.
Show drop-off, median wait and concrete next actions tied to real canonical records.

### Reporters — Reporters Experience + network support

Use the shared filters and separate readiness, current availability, recent work and credentials.
Show actual verified skills and useful job preferences; do not label availability as preferences.
Needs confirmation must count the corresponding condition, not license-check records. Follow-up
creates or opens a linked canonical Team item and must not duplicate it on repeated clicks.
28-day inactivity is not automatically churn. Record details connect readiness to first-job progress.

### Programs — Programs Experience + programs support

Make filter scope explicit for the table, chart and attention panel. Bind each program to its own
metric, units, target and outcome: qualification targets cannot display a generic “% start work”.
Support Running, Completed and Stopped cases with source-backed comparisons and honest denominators.

## Priority 2: demonstrate management and process ownership

### Team — Team Experience + serial Data / team support

Retain the completed 50-person expansion; do not add another 50. Propose approximately 20–30 varied,
linked work items if needed to demonstrate manager workflows; the final count is governed by useful
scenario coverage, not a quota. Use natural names and coherent dates, owners, markets, blockers,
priorities, entity/program links and completion history. Avoid evenly distributed toy examples.
New seed work is a bounded serial amendment to the Data brief before presentation work.

Add All members / individual member / Unassigned filtering plus useful domain, program and blocked
filters. Cards show specific action, owner, market, related record, due date and blocker. Support
assign/reassign, status, due date, priority and notes through canonical commands; refresh must retain
edits, reset must restore the seed. Completing work records evidence and obeys lifecycle rules.
Keep three workflow columns and expose Blocked as a visible condition rather than another lifecycle.

Give each member role-appropriate goals with units and time windows, workload, overdue work and
quality samples. A manager can inspect a case, leave a coaching note and set the next review/action.
Use progress bars, completed checklist milestones and team outcomes as light positive reinforcement;
no arbitrary points, public ranking or streak pressure. Optional drag-and-drop follows reliable
keyboard/button controls and is outside the initial required pass.

### Programs: complete the readiness checklist pilot

Provide inspectable problem, hypothesis, owner, cohort eligibility, target, observation window and
actual process steps. Each checklist step has an accountable owner, SLA, required evidence and an
exception path. Surface incomplete steps and next action. Link Marketing, Product/Ops and Data work
to Team items; keep acquisition channel tests distinct from onboarding/process interventions.

For the existing example, verify the canonical facts before presenting 6/20 (30%) versus 11/20 (55%),
50% target and +25 percentage points under the same 14-day observation window. These are descriptive
synthetic cohort results, not causal proof. If the records do not support those values, repair the
prepared view/data contract or display the actual facts; never hardcode the proposal's numbers.
Persist editable decision rationale, bounded rollout/stop/iterate choice, owner and next review date.
Include a completed pilot, an ongoing test and the DFW stopped-channel decision with distinct metrics.

## Priority 3: weekly operating review and interview walkthrough

Add a concise weekly review with target versus actual, supported change versus prior comparable
period, diagnosed constraint, accountable action and next review date. It must drill into the same
records and preserve market context, not become a second dashboard with conflicting calculations.
Prepare a five-minute LAX walkthrough and a short All-market/DFW branch demonstrating judgment.

| JD requirement | Evidence the product should demonstrate |
|---|---|
| Nationwide supply and provider growth | All-market capacity, comparable windows, LAX drilldown and concrete coverage action |
| Instrument recruiting through activation | Cohort conversion, stage waits, source outcomes, readiness-to-first-job milestones |
| Manage and develop people | Member-filtered assignments, realistic load, clear weekly goals, quality sample and coaching action |
| Test channels and decide investments | Metric-specific pilots, denominators, keep/iterate/stop rationale and next review |
| Turn manual fixes into scalable systems | Inspectable checklist, exceptions, linked recurring process work and partner ownership |
| Report honestly every week | Targets, comparable change, uncertainty, evidence links and accountable next steps |

A stronger model alone cannot establish these outcomes. Visible behavior and evidence are the gate.

## Delivery sequence after a separate implementation start

1. New coordinator reads the handoff, checks the active candidate and records the user's implementation
   start for this amendment. Preserve historical P4 gate results as historical, with Quality still
   unclosed; the old screenshots do not satisfy these new requirements.
2. Run static governance; verify fresh Astra runtime role/model/reasoning metadata with zero-inheritance
   probes. Current loaded roles may still describe Terra/Luna. Do not dispatch using stale metadata or
   silently substitute models. All configured processing remains Standard/default.
3. Coordinator records the bounded capacity/cohort/filter/Team/Programs contract deltas and augments
   the one relevant brief per worker with this plan and assigned IP acceptance IDs. Run needed Data
   and logic repairs serially, in owned paths, integrate exact commits and freeze a compiling baseline.
   Do not repeat the already completed 50-person expansion.
4. Lead revises the shared visual reference for changed states, then implements Overview/Funnel and
   shared charts/filters. Preserve the historical reference package; create a separately versioned
   amendment reference, state manifest and checksums. Stop for coordinator visual/behavioral proof.
5. Only after the new proof is accepted, freeze shared components and dispatch the three Experience
   specialists in the established bounded wave. Lead stays sole shared writer, answers contract
   questions, reviews screenshots; coordinator integrates exact commits sequentially.
6. Quality independently verifies IP01–IP12 plus unaffected XR/SD/original acceptance against one
   integrated commit. Include genuine pointer/keyboard/touch controls and 390px states, not only DOM
   existence assertions. Owners repair defects; any production repair invalidates prior Quality pass.
7. Reviewer inspects the exact Quality-passed commit. Produce the walkthrough and evidence register.
   Deployment remains a separate authorization; no claim of interview certainty or real outcomes.

Every dispatch uses a verified separate worktree/branch, exact base and frozen contract commit,
exclusive allowed paths, one brief, this amendment, the sample addendum and reference manifest,
acceptance IDs and an exact-commit handoff. Workers do not spawn children. Data and visual proof
are serial; maximum four workers only for the Lead-plus-specialists wave. No domain-owned UI fan-out.

## New blocking acceptance requirements

| ID | Required observable result | Owner / independent verification |
|---|---|---|
| IP01 | All plus five markets work across all five tabs; selection persists; LAX story and a distinct DFW stop case reconcile | Lead, specialists / Quality |
| IP02 | Charts fill available plot space at desktop and 390px; hover/focus/tap gives exact source-backed numbers and units; forecast is distinguishable | Lead / Quality |
| IP03 | Counted status click focuses selection, second click clears; combined filters/search/sort/clear agree with records and declared chart scope | Lead, specialists / Quality |
| IP04 | Overview capacity KPIs and market rows reconcile for one explicit window; unknown/possible and people/slots remain distinct | Capacity + Lead / Quality |
| IP05 | Waiting on and Owner return expected fixtures; Applicant includes Applicants; conversion exposes cohort and horizon | Recruiting + Lead / Quality |
| IP06 | Each attention link opens the correct record/market; summaries change with underlying facts | Lead, specialists / Quality |
| IP07 | Reporter skills/preferences/availability/credentials have correct sources; repeat follow-up opens one linked Team item | Network + Reporters / Quality |
| IP08 | Realistic Team seed covers assigned/unassigned, blocked/overdue/completed and multiple markets; no repeated 50-person expansion | Data / Quality |
| IP09 | Member filtering and assignment/status/due/priority/notes edits persist and reset; completion evidence and coaching/goal units are inspectable | Team support + Team Experience / Quality |
| IP10 | Program filters have explicit scope; each case uses its own metric/target; numerators, denominators and windows reconstruct | Programs support + Experience / Quality |
| IP11 | Pilot checklist has steps/owner/SLA/evidence/exceptions; decision rationale and next review persist; cohort result avoids causal claims | Programs support + Experience / Quality |
| IP12 | Weekly review and five-minute walkthrough traverse canonical linked evidence; revised references, desktop/mobile behavior and exact-commit Quality/Reviewer gates pass without waivers | Coordinator, Lead / Quality + Reviewer |

## Models for the next session

| Role | Model | Reasoning |
|---|---|---|
| Coordinator (select in new task) | gpt-6-astra | xhigh |
| Experience Lead and three specialists | gpt-6-astra | high |
| Data and all domain logic support | gpt-6-astra | high |
| Quality and Reviewer | gpt-6-astra | xhigh |

Every role keeps `service_tier = "default"`. Model changes are configuration, not evidence of new
runtime sessions or successful visual review. Record fresh runtime verification before implementation.
