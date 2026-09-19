# P4 experience redesign plan

> **September 18 interview amendment:** Read [P4_INTERVIEW_IMPROVEMENT_PLAN.md](P4_INTERVIEW_IMPROVEMENT_PLAN.md) and [ASTRA_COORDINATOR_HANDOFF.md](ASTRA_COORDINATOR_HANDOFF.md) first. The amendment supersedes conflicting presentation requirements below (including Overview KPIs, filter behavior, Team management and pilot details) and adds blocking IP01–IP12 acceptance. This update authorizes planning/model configuration only; new implementation and revised visual proof remain pending. Earlier proof and status statements describe historical scope.

Status: **DESIGN LOCKED — IMPLEMENTATION NOT AUTHORIZED**

Prepared: September 17, 2026

Production baseline: `3c37fefa2c7b8c9e7a4dd5a0013e2251cd53a66d`

Current repository HEAD at planning time: `669e929` (`add v2 quality acceptance and browser coverage`)

## Locked design authority

[`P4_DESIGN_LOCK.md`](P4_DESIGN_LOCK.md) is the authoritative presentation contract for P4. It
captures the user-approved five-tab canvas after iterative review. When this older planning document,
the original screen contracts, or the earlier P4 acceptance language conflicts with the design lock,
the design lock governs presentation and interaction. Source-record, metric, evidence, safety, and
no-external-write contracts remain unchanged.

The literal interactive reference and fixed comparison images are indexed by
[`design-lock/reference-manifest.md`](design-lock/reference-manifest.md). They are part of the design
lock and must be used by implementation, Quality, and Reviewer.

The approved sample-size addendum is
[`P4_SYNTHETIC_SAMPLE_EXPANSION.md`](P4_SYNTHETIC_SAMPLE_EXPANSION.md). It adds one serial Data step
before Experience. Presentation work then uses a gated hub-and-spoke model: the Experience Lead
freezes the shared system and Overview/Funnel proof before three bounded workspace specialists start.

The sections below from **Historical reference direction** through **Historical responsive behavior**
are retained only to explain how the redesign evolved. They must not be implemented where they differ
from the locked contract. Minor visual changes require an explicit amendment to `P4_DESIGN_LOCK.md` and
the matching acceptance row; they do not broaden any lane's assigned path.

## Outcome

Turn the record-correct V2 implementation into a concise operating dashboard that helps a provider
operations manager answer three questions quickly:

1. What needs attention now?
2. What action should I take?
3. What changed after the work?

This phase is a presentation and workflow redesign over the existing V2 records, calculations,
commands, and safety boundaries. It does not replace the source-backed metrics, create production
integrations, invent Steno policy, or authorize deployment.

Implementation requires a separate explicit user authorization. This planning change does not permit
source edits, dependency changes, implementation workers, deployment, or external writes.

## Why the previous implementation fragmented

The failure was in the implementation structure, not only the CSS.

| Cause | Effect | P4 correction |
|---|---|---|
| Seven lanes built in parallel, while five domain lanes each owned logic and their feature JSX/CSS | Five locally reasonable but visually unrelated screens | The Experience Lead freezes one shared system and proof before three presentation-only specialists receive non-overlapping paths |
| Experience owned `src/ui/`, `src/shell/`, and `src/styles/` but could not edit feature screens | Shared primitives could not enforce page composition or text hierarchy | The Lead owns shared UI plus Overview/Funnel; specialists must reuse that system and the Lead alone changes it |
| U01–U05 were assigned to Experience even though most violations lived in domain-owned feature files | Acceptance responsibility did not match write authority | Each presentation acceptance area now has an explicit presentation owner, with the Lead responsible for cross-workspace fidelity |
| Lane briefs emphasized calculation integrity and callbacks more than finished workflows | Screens exposed data and callback plumbing instead of usable work | Every workspace now has a required decision, chart/table composition, detail flow, and working action |
| P3 was scoped as integration and explicitly excluded a full redesign | Wiring the five tabs was treated as completion | P4 has an explicit visual proof gate before the remaining screens are built |
| Quality could only add tests and could not repair production code | Functional tests passed while visible defects remained | Quality reports defects; the owning implementation lane repairs them; Quality reruns before Reviewer |
| The visual reference was absent from the packet and tests | No one was accountable for matching the intended information hierarchy | The reference principles below become acceptance criteria and screenshot checks |
| Evidence was implemented both locally and globally | Repeated `Why this?` controls and technical text dominated the workflow | One contextual evidence drawer replaces evidence walls and duplicate launchers |

P4 must not repeat the original seven-lane UI fan-out. Domain roles may run only when the Experience
Lead identifies a concrete prepared-view or command gap, and those roles may not edit presentation
files. Workspace specialists start only after the visual proof, own one feature path each, and remain
inside the Lead's frozen component and screenshot-review loop.

## Historical reference direction — superseded where different

Reference inspected: <https://lax-market.vercel.app/> and its Trends view on September 17, 2026.

Use its interaction and hierarchy principles, not its brand, language, business rules, or data:

- a strong market/date/status header;
- compact, clickable KPI strip;
- a short priority brief and action queue;
- bordered, collapsible working sections;
- clear status labels and restrained warning emphasis;
- searchable, filterable, sortable working tables;
- a separate, dominant chart with a readable legend and time window;
- progressive disclosure for supporting detail;
- dense operational information with short sentences and visible ownership.

Do not copy the reference's fleet/driver concepts, colors, names, or claims. Reporter Growth retains
its own five workspaces, synthetic disclosure, record meanings, and evidence rules.

## Historical guided operating experience — superseded

The desired quality is not entertainment or employee scoring. It is the reference application's clear
sense of state, progress, priority, and response. P4 should make the work feel like a guided operating
loop:

**Find the gap → Build supply → Confirm capacity → Execute the work → Learn and scale**

Map that loop visibly to the five workspaces:

| Step | Workspace | User-visible progress |
|---|---|---|
| 1. Find the gap | Markets | Coverage, unresolved requests, and the selected growth mission |
| 2. Build supply | Recruiting | People moving through verified stages and concrete blockers cleared |
| 3. Confirm capacity | Reporters | Readiness, explicit availability, and suitable request options |
| 4. Execute the work | Team | Owned actions, overdue work resolved, and coaching follow-through |
| 5. Learn and scale | Programs | Test result, decision, and next process version |

Use the following game-like elements carefully:

- **Mission card:** the selected market goal, deadline, current progress, next milestone, and one next
  action. The main LAX mission is two newly realtime-ready reporters by February 23.
- **Operating-loop ribbon:** the five steps above, with the active workspace highlighted and exact
  cross-workspace transitions available from priority actions.
- **Progress without false causality:** show readiness goal progress, request coverage, stage movement,
  and program results separately. Never roll them into one score.
- **Prioritized missions:** number only the current action queue, using concrete urgency and ownership;
  do not rank people.
- **Milestone feedback:** after a real demo command or dated scenario event, briefly show the milestone
  reached and the next available action. Presentation-only clicks do not award progress.
- **Checkpoint timeline:** make the synthetic scenario's dated sequence understandable as Plan saved →
  existing candidates accepted → new reporters ready → accepted → work completed → program review.
- **Completion states:** resolved actions visibly leave the current queue or change state because the
  canonical records changed, not because a card was dismissed.
- **Progressive challenge:** default to the three most important issues; allow the user to expand the
  full queue, supporting records, and definitions.

Do not add points, streaks, trophies, arbitrary levels, employee leaderboards, reporter rankings,
opaque health scores, or celebratory states unsupported by actual records. A readiness milestone is
not an acceptance, and an acceptance is not completed work.

## Historical shared information architecture — superseded

Every workspace uses the same sequence:

1. **Context header** — workspace question, selected market, time window, and one status sentence.
2. **Operating-loop ribbon and mission** — current step, selected goal, progress, next milestone, and
   the cross-workspace path forward.
3. **KPI strip** — no more than four source-backed measures. Selecting one focuses the relevant chart
   mark or table records.
4. **Priority brief** — at most three concrete issues, each with finding, next action, owner, and due
   context. No generic risk score.
5. **Primary visual** — one dominant chart or, only for the all-market comparison, the approved table.
6. **Working table** — searchable/filterable records with a clear default sort and row selection.
7. **Context drawer** — selected record details, one primary action, related history, and optional
   evidence.

The scenario advance/reset controls move into a compact **Demo controls** disclosure. They must not
occupy the main decision area.

## Historical content rules — superseded where different

- One sentence under the workspace heading.
- No raw record IDs, metric IDs, versions, revisions, join paths, exclusions, or limitations on the
  default screen.
- One persistent synthetic-demo disclosure in the shell; do not repeat it inside ordinary cards.
- Default findings use plain language: specific count, time window, and next action.
- Caveats appear only when they alter the decision. Technical definitions and full limitations live
  in the evidence drawer.
- Replace the permanent Changed / Not changed essay with a one-sentence result notice. An expandable
  detail may state what did not change when that distinction matters.
- `Why this?` remains available for the currently selected metric or chart mark inside the contextual
  drawer. Do not render a page-level list of evidence launchers.
- One primary action per detail context. Secondary actions use quiet styling.

## Historical shared component proposal — superseded where different

Experience should provide and use a single set of presentation primitives:

- `WorkspaceHeader`
- `OperatingLoop` and `MissionCard`
- `KpiStrip` and selectable `KpiCard`
- `PriorityBrief`
- `SectionPanel`
- `ChartFrame`, accessible legend, tooltip/focus summary, empty state, and evidence hook
- `FilterBar`, search, active-filter chips, sort, and pagination
- `DataTable` with sticky headers and row selection
- `ContextDrawer` with focus return
- `StatusTag`
- `ActionResult`
- `CheckpointTimeline` and `DemoControls`
- one contextual `EvidenceDrawer`

Prepared domain values remain inputs. Presentation components must not calculate business metrics or
write directly to storage.

## Historical workspace redesign — superseded

### Markets — decide where capacity is missing

- KPI strip: requested, confirmed, possible but unconfirmed, no verified match/unknown.
- Mission card: two newly realtime-ready LAX reporters by the dated deadline, with readiness progress
  kept visibly separate from accepted and completed work.
- All-markets mode: five-row comparison table with a specific issue and next action.
- Selected-market mode: weekly stacked coverage chart separating confirmed, possible, no verified
  match, and unknown requirements.
- Priority brief: no more than three request groups requiring confirmation, readiness work, or
  sourcing/re-engagement.
- Working table: requests with date, requirement, status, candidate contention, and next action.
- Drawer: request facts, possible reporters, exact evidence, and link to the relevant Recruiting or
  Reporters work.
- Growth goal editor uses explicit fields and preview; goal results remain separate from coverage and
  completed work.

### Recruiting — decide where relevant supply stalls

- Required local switch: **Current work / Progress over time**.
- The operating-loop transition from a market gap lands on the exact recruiting mission and affected
  cases rather than on a generic tab.
- Current work: stage KPI strip, priority queue, source/service/stage/entry filters, and candidate table.
- Progress over time: real cohort funnel plus a separate source-outcome comparison using the same
  declared cohort and horizon.
- Selecting a funnel stage or source filters the member table to exact people.
- Drawer: lifecycle timeline, missing/verified checks, onboarding checklist, availability/preferences,
  source/program, owned work, and outreach preview.
- Working actions: assign/reassign follow-up, complete an evidenced step, record a screening result,
  and preview a message without sending it.

### Reporters — decide what the ready network can support

- KPI strip: ready network, explicitly available, no recent work, and availability needing confirmation.
- Mission context explains whether the next move is confirm existing supply, complete readiness work,
  or re-engage supply without treating the choice as an automatic algorithm.
- Dominant chart: working-network trend with first-time, returning, and no-recent-work distinctions.
- Working table: reporter, services, readiness, availability, last job, recent jobs, and follow-up.
- Drawer: credential/capability evidence, bounded availability and commitments, preferences, completed
  work, engagement notes, and suitable request options.
- Working actions: confirm availability, create re-engagement work, inspect request options, and open
  the Recruiting checklist when appropriate.

### Team — decide what is holding up execution

- KPI strip: open work, overdue work, unowned work, and inspected sample result.
- Priority missions show owned work and the next support action; people are never ranked or awarded
  points.
- Dominant chart: total and selected-market workload by person, grouped by comparable role.
- Working table: role-specific completed/target, total/selected-market open work, overdue work, and
  inspected quality.
- Drawer: cases, role expectations, inspected samples, cycle-time records, coaching actions, and review
  dates.
- Working actions: reassign work, revise a role target with reason, record coaching, review coaching,
  and share a successful practice. Existing callbacks must be connected to visible controls.

### Programs — decide what to continue, change, stop, or expand

- KPI strip: running, reviewing, proposed expansion, and stopped programs.
- The final operating-loop step shows what was learned, the recorded decision, and the next review or
  process milestone.
- Dominant chart: baseline/test result against the predeclared target over eligible periods.
- Editable working grid: program, market need, stage, owner, target, result, review date, and next step.
- Drawer: origin problem, linked work, participant/source evidence, before/test members, limits, notes,
  partner tasks, process definition, and decision history.
- Decisions require user-entered rationale and selected evidence. No hard-coded rationale.
- `Save as process` presents and saves actual versioned steps. Expansion remains a limited proposal.

## Historical evidence interaction — superseded where different

Evidence remains reconstructible but stops competing with the work:

1. Select a KPI, chart mark, priority, or row.
2. The context drawer shows the short finding and affected records.
3. `Why this?` expands the calculation, date/window, human-readable included records, exclusions,
   unknowns, and limitations for that selected context.
4. `Open the work` applies the exact record filters without displaying metric IDs as ordinary content.
5. Closing the drawer returns focus and preserves workspace, filters, search, sort, pagination, scroll,
   and selection.

The current global `Evidence from this workspace` list and duplicate local evidence blocks are removed.

## Historical responsive behavior — superseded where different

- **1440px and 1280px:** KPI strip in one row; brief and primary visual may share a balanced grid;
  working table uses available width.
- **1024px and 768px:** panels stack predictably; filters wrap; the drawer remains usable; tables use
  contained horizontal scrolling with sticky identity columns where helpful.
- **390px:** KPI cards become a two-column or horizontal strip; charts retain labels or provide an
  equivalent accessible summary; filters collapse; drawer becomes full-screen; no page-level horizontal
  overflow. No mobile waiver is allowed.

## Corrected implementation sequence

### P4.0a — serial governance and baseline

Coordinator only:

- reconcile the undocumented Quality test commit and freeze the exact candidate;
- update the active routing registry and role instructions before any worker starts;
- capture baseline screenshots of all five workspaces at 1440, 1024, 768, and 390 pixels;
- run typecheck, lint, unit, acceptance, browser, and production build checks;
- choose the chart implementation. Any new dependency requires explicit user authorization. Without
  that authorization, use tested accessible React/SVG/CSS primitives already owned by Experience.

The static routing, write boundaries, task references, locked visual package, and anti-fragmentation
checks are completed in `P4_READINESS.md`. Implementation remains inactive. Immediately before the
first Data worker, the coordinator still performs the mandatory runtime routing probe and freezes the
exact authorized baseline.

### P4.0b — serial synthetic sample expansion

Only after explicit P4 implementation authorization, dispatch one `data` role using
`tasks/data-expansion-p4.md`. It adds exactly 50 canonical fictional people—ten per market—under
`src/data/` and its colocated tests, following `P4_SYNTHETIC_SAMPLE_EXPANSION.md` and SD01–SD07.

This worker runs alone and stops at an exact commit. The coordinator integrates it, verifies the full
suite and record counts, and freezes a new compiling data baseline. Experience must start from that
integrated baseline. Do not run Data and Experience concurrently, and do not let Experience create
fallback rows or presentation-only sample records.

### P4.1 — Lead-owned visual proof

Dispatch only the `experience` Lead role in one verified worktree. It owns shared UI, shell, styles,
Overview, and Funnel.

Build the shared components plus Overview and Funnel first. Wire real prepared V2 data and existing
commands; do not make a disconnected mock. Produce screenshots and interaction evidence at all four
viewports. Stop at a visual proof checkpoint before expanding to the other tabs.

The proof does not pass unless Overview and Funnel satisfy the P4 acceptance criteria and exact
`P4_DESIGN_LOCK.md` composition, including
real charts, compact default copy, working drawers, filter-to-record interactions, and one evidence
path per selected context. Compare the candidate side by side with the matching fixed states in
`design-lock/reference-manifest.md`; unexplained composition, hierarchy, or interaction differences
fail the proof.

### P4.2 — bounded parallel workspace wave

After the proof is accepted and the shared presentation baseline is frozen, dispatch exactly three
presentation specialists: `experience_reporters`, `experience_team`, and `experience_programs`.
Each owns only its named feature path. The Experience Lead remains available as design steward and
sole shared-component writer; the four may run concurrently because their write paths do not overlap.

Each specialist must use the frozen primitives and composition, send component-contract questions to
the Lead, and provide candidate screenshots beside the locked reference states. The Lead returns
precise fidelity findings and makes any approved shared-component change in the Lead's own path,
then broadcasts that change. A specialist may not copy a primitive, create a local design system, or
interpret communication as expanded write authority. The coordinator integrates exact commits
sequentially after Lead review.

If a prepared view or command is missing, the responsible Experience role returns a concrete
contract-change request through the Lead and coordinator.
Coordinator may then dispatch exactly one owning domain role for a bounded logic-only repair. The
domain role may not edit JSX/CSS presentation paths. Coordinator integrates the repair, reruns checks,
and returns control to the requesting Experience role.

### P4.3 — coordinator integration

Coordinator owns integration state, command construction, routing, result feedback, dependency changes,
and cross-workspace behavior. Integration must replace technical context banners with user-facing
filter/selection state while retaining exact evidence internally.

### P4.4 — independent Quality with repair loop

Quality tests one fixed integrated candidate and may edit only acceptance/e2e tests. It verifies data
integrity, screenshot baselines, real browser interactions, text hierarchy, charts, drawers, actions,
keyboard behavior, and all responsive widths.

Quality does not repair production code. A failed criterion returns to the owning implementation role;
after repair and reintegration, Quality reruns the affected test and full required suite. Reviewer is
not launched while any required criterion is failing or waived.

### P4.5 — fixed-commit Reviewer

Reviewer inspects the exact Quality-passed commit read-only. It compares the live product with this
plan, the original V2 contracts, the supplied JD, and the locked interactive/screenshotted reference
in `design-lock/reference-manifest.md`. No closeout may claim success from tests that only verify that
elements exist.

## Ownership correction

For P4 only:

| Owner | Paths/responsibility |
|---|---|
| Experience Lead | `src/ui/`, `src/shell/`, `src/styles/`, `src/features/markets/`, and `src/features/recruiting/`; shared-system authority and specialist fidelity review |
| Reporters Experience | presentation files under `src/features/reporters/` only, after proof |
| Team Experience | presentation files under `src/features/team/` only, after proof |
| Programs Experience | presentation files under `src/features/programs/` only, after proof |
| Data | `src/data/` only; the serial approved 50-person sample expansion before Experience, then only specifically authorized data repairs |
| Capacity | `src/logic/capacity/` only; prepared-view repairs for Markets |
| Recruiting | `src/logic/recruiting/` only; prepared-view/command repairs for Recruiting |
| Network | `src/logic/network/` only; prepared-view/command repairs for Reporters |
| Team | `src/logic/team/` only; prepared-view/command repairs for Team |
| Programs | `src/logic/programs/` only; prepared-view/command repairs for Programs |
| Coordinator | contracts, integration, dependencies, configuration, governance, integration tests, merges |
| Quality | `tests/acceptance/`, `tests/e2e/`; independent checks only |
| Reviewer | read-only fixed-commit review |

No two active workers may own the same file. P4 uses one serial Data preparation worker, then one
serial Experience Lead proof. Only after that proof may the Lead and three bounded Experience
specialists overlap. This is not the P3 domain-owned seven-lane presentation wave: business logic and
presentation remain separate, shared files have one owner, and integration stays sequential.

## Required verification

The fixed candidate must pass:

- `npm run typecheck -- --pretty false`
- `npm run lint -- --quiet`
- `npm test -- --run`
- `npm run test:acceptance`
- `npm run build`
- `npm run test:e2e`
- `git diff --check`

Quality must also produce browser screenshots for every workspace at 1440 × 900 and 390 × 844, plus
the shared proof screens at 1024 × 768 and 768 × 1024. Screenshots are review evidence, not a substitute
for interaction checks.

## Gates

- This document authorizes planning and governance corrections only.
- P4 production implementation requires a separate explicit user instruction.
- The serial 50-person Data expansion and any user-authorized trend-variation repair must integrate
  and pass SD01–SD07 before Experience starts or resumes.
- Adding a chart or visualization dependency requires explicit dependency authorization.
- The Overview/Funnel visual proof and frozen shared baseline must pass before the bounded specialist
  wave starts.
- Each specialist requires Experience Lead screenshot review before coordinator integration.
- Quality must pass without waivers before Reviewer.
- Reviewer must inspect the fixed Quality-passed commit before P4 closeout.
