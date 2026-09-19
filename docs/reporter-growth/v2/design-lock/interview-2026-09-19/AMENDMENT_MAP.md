# Interview reference proposal · September 19, 2026

Status: REFERENCE_PROPOSAL_READY for coordinator review/versioning. This is a separately versionable reference proposal, not application implementation or visual-proof acceptance.

The exact clean worktree base is `8265d59853567b9816c0bc3b7e1625576cb87978`. Values were exported through the integrated prepared APIs whose source baseline is `dfa4b9b921991abd6a40127146520c421204c8cb`; no canonical source was changed. All 113 baseline people, the later 114-person scenario and the 25-task seed remain untouched. No repository file was edited and no production commit was made.

Authority: the September 18 `P4_INTERVIEW_IMPROVEMENT_PLAN.md`, IP01–IP12, and September 19 `P4_INTERVIEW_VIEWPORT_SCOPE.md`. The latter prioritizes desktop/tablet and removes phone optimization/capture as an acceptance requirement. Earlier exploratory phone images in this scratch folder are not in the final manifest and must not be treated as final reference states.

## Preserved literal system

Directly inspected the historical `docs/reporter-growth/v2/design-lock/reference-manifest.md`, opened all five tabs of its interactive HTML in Chromium, and viewed its actual desktop workspace screenshots plus mobile Overview and open SLA/Add Work states. All 20 historical SHA256SUMS entries still match. No historical file or hash is replaced.

Preserved: full-width bordered shell; one product heading; compact amber Focus badge; All-first six-market strip; five equal label-only navy-active workspace tabs; pale neutral workspace canvas; four compact KPI cells; white bordered nine-pixel-radius panels; 0.85/1.35 attention/chart split at desktop; dense Fleet-like table grid; navy/green/amber/red with text labels; contained table overflow; three Team lifecycle columns; one contextual drawer. Tablet stacks the attention/chart panels and board. Drawer uses the same labels, control sizing, borders, focus treatment and typography as the page. No dependencies, external assets, external writes or messages.

## Authorized differences

| Amendment | Reference change | Applicable IDs |
|---|---|---|
| Capacity meaning | KPI row uses requested, confirmed and unresolved request slots in the Feb23–Mar1 window. Possible/unverified/unknown partition unresolved. Fourth cell explicitly says no goal saved at baseline. Market count becomes context; market rows expose each category and the next action. | IP04 |
| Inspectable chart | Actual container-sized 300px plots, aligned axes/grid/data, whole count ticks, series-specific units, solid history/dashed forecast, visible boundary and assumptions. One chart keyboard stop plus arrow/Home/End, nearest-date pointer, tablet touch readout. | IP02 |
| Count-gap caution | Available series is distinct people; demand is scheduled active request slots; positive count gap is their simple positive difference. It is not confirmed scheduling coverage. Future points use known schedule/availability assumptions. | IP02, IP04 |
| Filter model | Counted stage focus/second-click clear, stable owner-ID and waiting-key selectors, search/sort/clear, explicit scope, result count, drawer round-trip preservation. Source is visible and selects exported source-specific prepared facts. SLA and owner/wait are distinct. | IP03, IP05 |
| Cohort composition | Compact January/February cohort panel sits above the People grid, below chart/attention. Rate shows numerator, mature denominator, horizon and observing count; people inventory stays distinct. January All17/51, LAX9/22. February All0/1 plus10 observing; February LAX denominator0 means unavailable. | IP05 |
| Reporters | Separate recorded readiness, current availability, recent work, verified skills, preferences and credentials. Needs-confirmation uses its own prepared membership. Person detail plus explicit availability and linked-follow-up forms. | IP07 |
| Team | Same three columns with richer cards: market, related record, domain, priority, blocker and due date. Member/domain/program/blocked filters. Add/edit work drawer, completion evidence, concise role/window target and inspected-quality table, coaching/next-review form. Blocked is a condition. | IP08, IP09 |
| Programs | Categorical frozen-cohort bars replace invented weekly progression. Cohort labels, denominator and rate occupy separate lines. Metric-specific 14-day first-job checklist, ongoing cost observation and DFW30-day qualification1/6 versus40% are distinct. Status/type/search scope chart, attention and grid. | IP10 |
| Checklist management | Program detail exposes problem, hypothesis, eligibility, completed observation versus administrative Review, original pilot vs proposed v2 owned checklist, role/SLA/evidence/exception fields, decision rationale, review date and process-draft form. Saving remains explicitly preview-only here. | IP11 |
| Weekly review | Current market-wide contextual drawer with actual/target/change, ratio memberships, explicit source windows, accountable next review/action; unavailable explanations and full limitations are disclosed on demand. Independent of local record filters. | IP12 |

## Facts and presentation rules for source implementation

- All baseline schedule is 11 requested / 6 confirmed / 5 unresolved (2 possible,3 no verified match,0 requirements unknown). LAX original plan remains10 slots; no growth goal is saved yet. A later saved goal must render the actual prepared `growthGoal` fields and must not be invented by the empty-state UI.
- Checklist cohorts are6/20 and11/20 at All; whole-program target50%. LAX subset3/10 and6/10 may compare descriptively to a benchmark but cannot claim a compatible subset target met. DFW qualification1/6 has its own40% compatible target and $3,600 recorded direct spend. Two current referral entrants are still observing; cost is unavailable.
- Checklist observation is complete; program administrative stage is reviewing. Proposed v2 draft ownership/SLA additions cannot be attributed to the earlier v1 pilot.
- Production JSX consumes prepared values/callbacks. The reference's local membership selection is a prototype convenience, never permission to duplicate filtering, counts, outcome calculations, storage or commands in source.
- The compact root linked-selection strip is coordinator-owned and should use pale blue, human-readable selected record/market and date plus Clear drill-down. Exact IDs/version/revision remain internal.
- Controls and forms must use actual current actor/time and canonical options in source, await save acknowledgment, preserve input after rejection, and display errors. This static proposal has no command transport and explicitly reports that preview saves do not save records.

## Comparison disposition and limits

The retained shell, typography, hierarchy, density, attention treatment, table controls and Team board compare directly with the historical package. Differences listed above are authorized by the interview amendment. No phone-specific fidelity claim is made.

The proposal establishes composition and interaction affordances, not IP implementation acceptance. Full operational filter recomputation, SLA edit recomputation, exact evidence navigation, field validation, completion lifecycle safeguards, persistence/reset, source callback integration, chart evidence routing and independent Quality/Reviewer remain implementation gates. Reference buttons opening a generic selected-evidence pane and preview forms are intentionally not substitutes for those source-backed ports. There is no new missing-contract request from this reference pass.

Do not copy `prepared-facts.json`, scripts, prototype rows or local state into production. Later specialists consume the frozen shared components and domain-prepared views. Lead remains sole shared writer. Specialists remain blocked until actual Overview/Funnel source proof is accepted.
