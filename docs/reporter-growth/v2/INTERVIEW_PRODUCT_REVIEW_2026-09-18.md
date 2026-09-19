# Reporter Growth: product critique and interview-focused change proposal

Reviewed September 18, 2026. Analysis and proposed changes only; no application implementation or design-lock amendment is included.

## Review basis

- Supplied job description: `JD.txt`, Senior Operations Manager, Provider Operations.
- Running candidate: `http://127.0.0.1:5174/`, served from `/private/tmp/steno-p4-coordinator`, HEAD `f2b3357` at inspection. This is newer than the source in `/Users/pc/Desktop/STENO`; the running candidate was the product reviewed.
- Direct browser inspection of all five workspaces, Team Goals, the checklist pilot detail, and selected filter interactions.
- Direct browser inspection of the supplied [Fleet reference](https://lax-market.vercel.app/#fleet) and [Capacity Trends reference](https://lax-market.vercel.app/trends?section=capacity&range=R7&status=READY).
- Source inspection of the candidate's feature screens, styles, and relevant prepared-data logic, plus the existing product, data, metric, and P4 design contracts.

This was a desktop product review with focused interaction checks, not a full accessibility, responsive, calculation, or automated acceptance audit. Observations below distinguish reproduced behavior, source findings, and proposals. Browser navigation/filter state was returned to All-market Overview. No operational records were changed.

## Recommendation

Keep the five-workspace structure. Its sequence maps well to the job. Concentrate the next pass on making a manager's reasoning and actions visible:

**Identify a specific supply need → diagnose its cause → assign owned work → observe activation → decide what to repeat, change, or stop.**

The current candidate has the right categories, but several views summarize records without letting the manager complete the decision. Chart polish matters; coherent definitions, useful actions, and a convincing team workflow matter more for this JD.

The best demonstration is one complete operating story, with supporting evidence from the other markets. More tabs, dashboards, or generic AI features would dilute that story.

## Confirmed problems to repair first

| Finding | Evidence from this review | Practical consequence |
|---|---|---|
| Charts occupy only the middle of their panels | Visible in Overview, Funnel, and Programs. These SVGs use a square `viewBox="0 0 100 100"` inside wide, shallow containers, retaining the default aspect ratio. | The plot is tiny, labels are hard to read, and externally positioned date labels do not visually line up with the compressed plot. |
| Charts lack value inspection | Source contains static lines and labels, without pointer/focus interaction for inspecting each observation. | A manager cannot verify a value, compare a date, or drill into the relevant records from a point. |
| Funnel status selection behaves unlike the reference | All five statuses start selected. Clicking Applicant changed 66 shown to 55, excluding the 11 applicants. | A control that looks like a focus filter behaves like an exclusion toggle. |
| Funnel waiting filter is broken | Selecting `Assigned to Maya Chen (9)` produced `0 shown`. Source compares the selected human-readable option label with an action reason instead of matching the prepared option's cases/owner. | A manager cannot reliably find the advertised queue. |
| Overview mixes time scopes without adequate labels | The screen showed 0 available reporters, 11 open jobs, 2 projected additional reporters, and zero gap for every market. Source uses current availability/current instantaneous gap alongside open requests and a future peak. | These figures need not be mathematically contradictory, but the presentation makes them look contradictory and cannot support a clear next-week capacity decision. |
| Overview summaries are partly fixed copy | Source hardcodes `Onboarding is slow`, `Coverage needs attention`, and `Review activity`. | The executive summary can continue saying the same thing after context or underlying conditions change. |
| Attention is insufficiently specific | Funnel repeats two identical 15-day onboarding warnings and a 14-day warning without naming the people or market. Overview routes every attention action through the first evidence target. | The reviewer cannot tell what each issue refers to or trust that its action opens the exact affected work. |
| Team is mostly a static display | Seven cards: two `re engage work`, four `onboard work`, one `partner task work`. No member filter or card management control. Goals show values such as 4 and 1 without a visible unit/time window. | It does not yet demonstrate delegation, workload balancing, coaching, or role-specific expectations. |
| Reporter labels blur different facts | `Preferences` displays availability. Skills display counts such as `1 verified; 0 unknown; 0 not demonstrated`. The activity bar labeled `Needs confirmation` uses the license-check count. | The screen makes the user translate implementation summaries and confuses availability, skills, and credential review. |
| Programs has unclear filter scope | Selecting Stopped correctly leaves DFW broad outreach in the grid, while the chart and attention list continue showing the checklist pilot. | Grid-only filtering is possible, but the retained selection/scope needs to be explicit or change coherently with the visible records. |
| Program metric presentation needs correction | The display labels every target `% start work`, including DFW's qualification-focused goal. Its prepared group result path is based on timely first jobs. | A program decision risks comparing a result with the wrong success criterion. Audit and bind each result/target to that program's declared metric. |
| Checklist pilot detail is incomplete as a management workflow | Detail shows goal, result, review date, and decision buttons, but no inspectable checklist/process sequence. Decision buttons supply fixed rationale text. | The result is visible, but the intervention, reasoning, ownership, and repeatable rollout are not. |

Source locations in the running candidate: `src/features/markets/MarketsV2Screen.tsx`, `src/features/recruiting/index.tsx`, `src/features/reporters/network.tsx`, `src/features/team/index.tsx`, `src/features/programs/index.tsx`, `src/styles/tokens.css`, and their corresponding `src/logic/` modules. These are repair leads, not evidence that fixes have been made.

## Shared charts and filter system

### Charts

Create one shared responsive chart frame that measures its actual container and maps the plot and axes into that space. Simply enlarging the card or stretching all SVG contents can leave tiny/distorted labels; text and marks should retain readable sizes.

- Use approximately 280–340 px of plot height on desktop where it helps readability; adapt to the available mobile space.
- Keep axis labels, plot marks, reference lines, and dates on the same coordinate system.
- Hover/focus/tap a date to show its date, series values, units, and actual/projected status. Funnel also shows average waiting time, sample count, and applicable SLA.
- Provide a crosshair, sufficiently large pointer target, keyboard access, and a readable table of values.
- Clicking a relevant point opens its contributing records without losing filters.
- Add usable date controls: trailing 7/28 days for observation, with a separately labeled upcoming scheduling window for capacity. A future known-schedule projection is not a statistically validated forecast.
- Do not interpolate missing records into invented performance, replace unknowns with zero, or use decorative variations.

For Programs, the checklist's 30% and 55% represent different cohorts. Two labeled cohort bars or a paired comparison make that distinction clearer than a continuous trend line. Retain a time-series view only when successive comparable observations actually exist.

### Filters and KPI cells

Use the reference's interaction order consistently: compact count strip, status/count filters, search and labeled selectors, result count and clear action, table, pagination.

- Default status is All. A normal status click focuses that status; clicking it again clears it. If multi-select is valuable, expose it intentionally rather than starting with everything selected.
- Use stable record IDs/keys for filtering. Human-readable option text is a label, not a join key.
- Combine dimensions predictably: market AND stage/status AND owner AND search. Count behavior must be documented and consistent.
- Show active filters, `Showing X of Y`, and Clear filters. Reset table page when a filter changes.
- Preserve local filters, selection, sorting, and scroll when opening/closing a record or switching workspaces.
- Compact KPI cells should contain a short label, prominent number, and only the time/target context needed to interpret it. Add deltas only when comparable recorded periods exist.
- Operational KPI clicks should open the exact underlying work. A cohort outcome rate should open its cohort evidence instead of pretending it is a current-case filter.
- Keep global context and local grid filtering distinct. Do not silently change a percentage's denominator when someone searches a name.

## Overview proposal

The default should answer: **Where is upcoming capacity insufficient, what is driving it, and what should I direct today?**

Use four primary KPIs for one clearly stated upcoming window: requested slots, confirmed coverage, unresolved slots, and newly ready reporters versus the saved growth target. Move the selected-market count into compact context; knowing there are five markets is less useful than knowing where intervention is needed.

Retain available-supply information, but name its scope precisely. A headcount of available people is not interchangeable with a count of request slots: time conflicts, skills, location, and acceptance matter. Current availability, request-specific possible matches, confirmed assignments, and additional growth targets should stay distinguishable.

The market table should show real quantities:

| Market | Requested slots | Confirmed | Possible matches, unconfirmed | No verified match | Requirements unknown | Growth goal | Next action |
|---|---|---|---|---|---|---|---|
| Selected market | Counts from the same scheduling window | Count/rate | Request count with suitable options; disclose contention | Request count | Request count | Dated readiness progress | Specific action and destination |

Market rows should sort by concrete unmet need and urgency, rather than a invented health score. Totals should reconcile to the four request classifications. Nationwide reporter totals must deduplicate people across markets.

The top three attention items should name the market, affected work, needed response, and owner where known. Examples of the intended wording are `LAX: two realtime requests lack a verified match` or `ORD: three onboarding cases wait on the same evidence`. Generate them from records.

Replace the four generic cross-workspace cards with compact live summaries, such as a named bottleneck, unowned work count, and next program review. Keep the screen concise; the extra information should support a decision, not add another introduction.

## Funnel proposal

Keep the People/Bottlenecks split, but give each view a distinct managerial purpose.

**People:** status/count strip; search; Owner; Waiting on; SLA state; source; sort by longest in stage, due date, or name. Separate the internal owner from the dependency: `Maya Chen` is an owner; `Candidate evidence` or `Ops review` is what the case is waiting on.

Rows should make the next action executable. Show a named person, market, stage, time in stage versus SLA, specific blocker, owner, and next step. Put extended history and notes in a drawer; keep quick notes available without dominating every row.

**Bottlenecks:** distinguish today's stage inventory from conversion through one defined entry cohort. Show stage-to-stage conversion, still-observing cases, wait time, and recorded reasons for drop-off. Add a compact source comparison with qualified/ready/first-job outcomes and recorded spend under consistent horizons.

The four summary measures can remain close to the existing design: active cases, cases needing action, slowest step, and first-job activation. Rename `Started work` to state its population and time horizon; 42% without that context invites misinterpretation.

A KPI/status click should resolve to the relevant work or evidence. Duplicate attention findings should be grouped into a useful issue with a count and exact case drill-down.

## Reporters proposal

Use the shared toolbar and count-filter style, with separate dimensions for availability, recent activity, capability, and credential review.

Useful quick views: All network, Ready but no first job, Needs availability confirmation, No work in 28+ days, Credentials to review. These views overlap; their counts must not imply mutually exclusive populations.

Show actual skill labels such as Realtime or Standard, attendance/travel preferences separately from dated availability, and readable credential evidence. Historic onboarding readiness is not a promise that someone can cover a particular request today. Consider `Readiness completed` or `In network` where that is the actual count.

Make follow-up a workflow: open the person, inspect context, assign or open the existing follow-up, and preserve its link to the Team board. Avoid duplicate re-engagement tasks. Inactivity warrants investigation; it is not proof of churn or disinterest.

The strongest demonstration here is avoiding unnecessary sourcing by finding suitable existing supply and confirming its availability.

## Team proposal

This is the largest interview-value improvement because the JD explicitly calls for managing and developing a team.

Keep To do / In progress / Done. Represent Blocked as an explicit badge with a reason, visible in its existing column, so the three-column structure remains useful.

Add a member selector including All and Unassigned, plus domain, program, and work-state filters. A member chip or roster row should filter the board. Show selected-market workload and total workload separately when both matter.

Each card should have a specific action title, owner, market, linked person/program, due date, and blocker. Illustrative titles for the existing demo story:

- Verify Avery Cole's realtime evidence — Maya — LAX — waiting on evidence.
- Confirm availability for an ATL returning reporter — Sam — linked reporter and requested window.
- Review DFW source qualification results — Eli — linked stopped sourcing program.
- Draft the checklist pilot's limited rollout — named owner — linked process version.

Opening a card should support assign/reassign, change state, edit due date/priority, explain a blocker, add a note, and inspect linked records. Drag-and-drop can supplement these controls but should not be the only way to move work. Completion should record the required evidence and actor; moving a task must not manufacture reporter readiness or a completed job.

The manager view should show role-specific goals with units and dates, inspected quality samples, open work, and coaching follow-through. `3 of 4 onboarding reviews this week; 2 inspected, both passed` is interpretable. A bare `4` or `Clear` is not.

Use realistic synthetic work histories, not only more names. Keep the core team plausible, with enough varied tasks to show an overloaded owner, an unassigned item, blocked dependencies, completed work, a reviewed coaching action, and a positive practice worth sharing. Include cross-functional collaborators with specific deliverables, rather than adding arbitrary headcount. A bounded expansion of roughly 20–30 linked tasks is a proposed demo size, not an observed staffing requirement.

### Productive gamification

Use progress feedback tied to meaningful work: weekly goal bars, checklist completion, blocked-work recovery, recently completed tasks, and a short success state after a real change. Include a practice-sharing action with a concrete example.

Do not rank employees by task count, add points for clicks, or reward rapid completion without quality. Different roles and case complexities make those incentives misleading. The desired feeling is momentum and clear ownership, with the manager helping people succeed.

## Programs and checklist pilot proposal

Keep three coherent program stories: a running test, a completed pilot under review, and a stopped effort. That is enough to demonstrate judgment if each is complete.

Use the shared search/status/count filters, with Type, Owner, Review timing, and the existing market selector. Align stage labels and filter options with actual states, including expansion if shown in the KPI strip. Make selected-program chart scope explicit and resolve a selection coherently when it leaves the filtered list.

Give the checklist pilot a detail drawer with four compact sections:

1. **Problem and hypothesis:** the observed onboarding handoff issue, affected population, and intended change.
2. **Workflow:** requirements review, preferences/availability, orientation, readiness review, and subsequent first-opportunity support. Every step has owner role, required evidence, due/SLA rule, handoff, and exception route. Show the existing process version rather than an unexplained `Save process draft` action.
3. **Results:** earlier 6/20 (30%), pilot 11/20 (55%), target 50%, identical 14-day outcome horizon, participant detail, market subsets, and unresolved/observing records. Describe +25 percentage points as a difference between synthetic cohorts, not proven causal impact.
4. **Decision and rollout:** Continue/Change/Stop/Propose expansion with an editable rationale, named owner, next review, limited scope, and criteria for continuing or stopping. Saving a proposal should create linked review work without silently rolling out a process.

Separate acquisition source, workflow source, and process version; the current source cell mixes them. Tie each program's target, chart, unit, and decision to its declared success metric. A qualification experiment and an activation pilot should not share a hardcoded `% start work` label.

## What demonstrates the JD

| JD requirement | Strong product proof | What the candidate can explain |
|---|---|---|
| Own end-to-end supply growth | Market need linked through case work to readiness and first completed job | Why confirming existing supply, unblocking onboarding, and sourcing are different responses |
| Instrument the recruiting funnel | Defined cohorts, stage waits, actionable blockers, source outcomes | How to locate the constraint before spending more on acquisition |
| Manage and develop a team | Assignment, workload view, role goals, quality samples, coaching review | How to set a bar and coach without micromanaging |
| Build repeatable systems | Inspectable checklist, exception route, process version, linked partner work | When a recurring manual problem deserves a process change or Product/Engineering investment |
| Run tests and make investment decisions | Comparable pilot results, declared target, limited rollout, retained stopped experiment | What to continue, change, stop, or scale, and why |
| Weekly diagnosis and reporting | Concise readout of actuals, target, change, cause to investigate, owner/action | How to report honestly, including small samples and unknowns |

## Recommended order and acceptance

**Pass 1: trust and usability.** Repair chart sizing/value inspection, the broken waiting filter, status-click behavior, scope/metric labels, generic implementation text, and incorrect drill-down targets. Share one toolbar/filter contract across the three grids.

**Pass 2: managerial depth.** Rework Overview into a capacity decision screen; add Team member filtering and work editing; complete the pilot's workflow/results/decision detail; improve linked synthetic work histories.

**Pass 3: interview presentation.** Expose a concise weekly review, validate one complete scenario, and prepare a short case-study explanation and three-minute walkthrough. Add source comparisons and coaching detail before optional drag-and-drop or animation if time is constrained.

Acceptance should demonstrate behavior, not element existence:

- Chart plot spans its available area at desktop/tablet/mobile widths; displayed tooltip values reconcile with source observations and work with keyboard/touch.
- Clicking Applicant from All returns applicants; the named-owner option returns its advertised cases; combined filters, clear, pagination, and return navigation remain coherent.
- Overview's counts share a visible window and reconcile; each attention action opens its own affected records.
- Selecting Maya filters to her actual work. Reassignment changes both board ownership and member workload; completion records evidence/history without changing unrelated outcomes.
- Reporters distinguishes readiness, availability, recent work, and credential review; follow-up links to a single canonical Team item.
- Every program compares the declared metric with its matching target. Pilot detail exposes workflow and participants; a decision saves the manager's rationale and next review.
- Unknowns, incomplete cohorts, multi-market people, and empty filters have clear states.
- Refresh/reset and tab switching behave as stated; saved notes or actions are not implied to be durable unless they are.

## Interview presentation

Aim for a hiring manager to understand the value in 30 seconds, inspect it in three minutes, and probe the reasoning in ten.

The walkthrough should follow one scenario: identify the LAX realtime need; distinguish existing possible matches from not-yet-ready candidates; investigate the onboarding blocker; assign work and inspect workload; advance the explicitly simulated events to readiness, acceptance, and first job; review the checklist pilot and propose a limited next step. The separate DFW example shows willingness to stop a weak effort.

Use a short case-study note alongside the site: the problem interpreted from the JD, operating decisions supported, assumptions, what would be validated with Steno staff/data, and a small first-30-day discovery plan. Keep that explanatory material out of the operational screen's main hierarchy.

Suggested portfolio sentence: “I built a synthetic provider-growth workflow to demonstrate how I would connect market demand, recruiting bottlenecks, team execution, and program decisions.”

The demo demonstrates judgment and systems thinking. Pair it with a real example from the candidate's experience about leading people or improving a process; synthetic outcomes should never be presented as the candidate's achieved business results.
