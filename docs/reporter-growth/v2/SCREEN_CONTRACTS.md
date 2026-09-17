# Screen contracts

The interface should be concise, visually guided, and useful at a glance. Make the next decision clear. Keep technical detail one click away rather than removing evidence.

## Shared shell and context

Main tabs: **Markets / Recruiting / Reporters / Team / Programs**. One market selector. A small fixed demo-date indicator and persistent independent/synthetic disclosure. Do not repeat multiple disclaimer paragraphs in every card.

Each view has a short question-led heading, no more than four primary measures, at most one dominant chart, and a working table. Secondary charts live in a local view switch or detail panel. The five-market comparison may use no chart when the table communicates better.

Global market and supported capability/attendance filters persist across navigation. Time context remains view-specific and visible: “Upcoming work,” “This week,” or “Entered onboarding...” Do not imply a scope applied when it cannot be resolved. Team may filter linked cases by market while showing a clearly labeled total workload for context; company-wide targets must not masquerade as market-specific targets.

A signal link carries exact affected IDs and its as-of/definition scope. Returning from the detail panel preserves scroll, sort, search, and selection. Clearing a drill-down changes only that drill-down, not all global filters.

## Markets — “Where do we need more capacity?”

All markets: one row per market with requested jobs, confirmed count/rate, unresolved work, a specific evidence-derived issue, and next action. No unsupported composite “health score.” Health is the visible combination of coverage, unresolved requirements, readiness work, and growth progress.

Selected market: upcoming-demand versus coverage chart; requirements breakdown by proceeding, attendance, capability, and week; growth goal with original baseline and current result; linked programs/work.

The chart separates confirmed assignments from possible matches. A candidate-options segment is labeled unconfirmed and not guaranteed simultaneously fillable. Unknown requirements have their own label. After request dates pass, switch to an explicit original-plan results view rather than keeping old work under “upcoming.”

Actions: inspect a gap; open affected reporters/cases; preview/save/revise a goal. Demand is seeded/read-only for v2; acceptance changes arrive through a bounded simulated response, not a production dispatch interface.

## Recruiting — “Where are new reporters getting stuck?”

Two local views: **Current work** and **Progress over time**. Current work uses stage counts and an actionable queue. Progress uses a real cohort funnel and source comparisons, not today's unrelated stage inventory.

Default work columns: Person, Stage, What's needed, Waiting, Assigned to, Due. Completed/closed cases stay in an “All cases” view unless they have a concrete open task. Filters include source, service need, stage, and entry period; selecting a bar filters the exact cohort members.

Detail: event timeline, verified/missing checks, onboarding steps, preferences/availability, source/program, owned work, and outreach preview. A readable reason accompanies every pause/closure. No automatic rejection or opaque suitability score.

Actions: assign/reassign follow-up; complete an evidenced step; record a screening result with required evidence; preview a message. Saving a task changes task status only. Confirming an actual availability window changes that evidence, not a job outcome.

## Reporters — “What can our network support?”

Scope: people with a valid readiness history, including ready people awaiting a first job and previously working people who need re-engagement. Pre-readiness cases belong in Recruiting, with a clear link when relevant to a capacity gap.

Separate readiness, availability, capabilities, and recent-work status; do not squeeze them into a single “Active” badge. Grid: Reporter, Services, Availability, Last job, Recent jobs, Follow-up.

Detail: sample credential evidence, capabilities, dated availability/commitments, preferences, job/delivery records, and engagement notes. Service evidence can show completed assignments or delivery against agreed dates only when the source records exist. No invented quality rating.

Actions: confirm availability, create a re-engagement task, inspect suitable request options, open the recruiting checklist where needed. A declined unsuitable opportunity is not labeled poor performance.

## Team — “What is holding up the team's work?”

Compact roster with role-specific output/goal, assigned work, overdue work, and quality sample. One shared workload chart is optional; the work grid and drill-down are primary.

Open a person to see cases, role expectations, inspected work, coaching actions, and review dates. Separately label total and selected-market workload. A mixed-role table is not a ranked leaderboard.

Actions: reassign an owned task, set/revise a measurable role target with reason, record coaching, record a follow-up review, and share a successful practice. Required workload evidence distinguishes unowned work, unresolved information, and genuine throughput problems.

## Programs — “Which growth efforts should we keep?”

Required default: editable grid. Columns: Program, Market need, Stage, Owner, Target, Result, Review date, Next step. Inline editing for low-risk fields; decisions and target revisions require a reason and evidence. Row selection opens details.

Details: origin problem, linked requests/cases, how the change works, participant/source evidence, before/test result, limits, notes, partner tasks, and decision history. Translate SIPOC-style process thinking into **Who helps / What we need / What changes / What it produces / Who benefits**. These are process details, not board stages.

Required decisions: Continue / Change / Stop / Expand. Expansion creates a proposal or limited-rollout record; it does not silently change other markets. `Save as process` creates a versioned draft from actual defined steps. A stopped program remains inspectable.

Optional board: Ideas / Trying / Reviewing / Rolling out / Closed, derived from the same rows. Program status changes never manufacture outcomes. Local notes/activity history demonstrate collaboration structure, not live multi-user editing.

## Chart and evidence interactions

Markets: demand and confirmed/possible/unknown coverage by week.
Recruiting: stage progression for one cohort; separate source-outcome comparison.
Reporters: working network trend with first-time/returning and no-recent-work distinctions.
Team: workload by role/person, with case drill-down rather than an opaque score.
Programs: result versus the predeclared target over eligible periods; baseline/test member tables.

Every mark has a readable value, date/window, and evidence action. No hand-entered arrays of chart totals independent of source events. No extra charts solely to fill whitespace.

## Visual rules

One restrained accent for selection and primary actions; warning emphasis for a concrete issue, never color alone. Specific labels such as “2 requests have no ready match,” not “Risk: high.” One main action per detail context. Compact spacing with readable text; remove repetition before shrinking type.

Use real data tables and human labels. IDs remain available in deeper detail, not long default paragraphs. Preserve keyboard navigation, visible focus, meaningful labels, and narrow-screen behavior. PDF exports from v1 show clipping, but print output alone does not establish live responsive behavior; later browser checks must confirm it.

## Result feedback

After an action, show a concise result with affected records and what did not change:
“Follow-up assigned to Maya. Coverage is unchanged until a reporter accepts.”
“Availability confirmed. This request now has a possible match; it is not confirmed.”
“Process draft saved. No other markets have been changed.”

The dated scenario provides an explicit before/after view and an accessible reset. Reset must not leave a new clock, stale evidence cache, or previous rollout decision behind.
