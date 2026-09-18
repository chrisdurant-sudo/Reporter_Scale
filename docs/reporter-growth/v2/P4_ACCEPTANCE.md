# P4 experience redesign acceptance

Status: **DESIGN LOCKED — NOT YET TEST RESULTS**

These criteria supplement the original V2 acceptance contract. They do not relax source-record,
metric, evidence, safety, or no-external-write requirements.

[`P4_DESIGN_LOCK.md`](P4_DESIGN_LOCK.md) is authoritative. These rows have been reconciled to the
approved canvas; older screen-contract expectations do not revive removed headings, mission cards,
step labels, repeated evidence, or the canvas feedback box.

The fixed comparison package is
[`design-lock/reference-manifest.md`](design-lock/reference-manifest.md). It must be used for visual
proof, Quality, and Reviewer; passing structural tests without matching the locked composition is a
failure.

[`P4_SYNTHETIC_SAMPLE_EXPANSION.md`](P4_SYNTHETIC_SAMPLE_EXPANSION.md) is the authoritative P4
sample-depth addendum.

## Product comprehension

| ID | Observable requirement |
|---|---|
| XR01 | In each workspace, a first-time reviewer can identify the selected market, current focus, primary measure, and available work without opening technical evidence. |
| XR02 | Each workspace starts with no more than four compact KPIs and then follows the exact tab-specific composition in `P4_DESIGN_LOCK.md`; no removed introduction or mission block returns. |
| XR03 | Default pages show no metric IDs, definition versions, snapshot revisions, join paths, raw record-ID paragraphs, or repeated limitation text. |
| XR04 | Synthetic/demo disclosure, when required by the retained safety contract, appears once outside the main decision hierarchy. Ordinary cards do not repeat it. |

## Visual hierarchy and reference principles

| ID | Observable requirement |
|---|---|
| XR05 | The shell shows the single `Provider growth command center` heading, compact Focus state, All-first market switcher, and label-only Overview / Funnel / Reporters / Team / Programs navigation. It does not show the removed market/date/demo metadata line. |
| XR06 | KPI cells are compact, use plain labels, and do not become a second navigation or explanation layer. |
| XR07 | Attention items, where the locked tab includes them, show a short finding and next action; Team has no attention box and no unsupported score. |
| XR08 | Panels, status tags, tables, and charts form one consistent system across all five workspaces. Feature-specific default browser styling is a failure. |

## Charts

| ID | Observable requirement |
|---|---|
| XR09 | Overview shows responsive available-supply, demand, and needed-supply lines with a visible history/forecast boundary and projection toggle. |
| XR10 | Funnel shows R7/R28 wait-time trends by selected status against the applicable default or market-specific SLA. |
| XR11 | Reporters shows a concise readiness/activity visual and a table-level 28-day last-active counter without equating inactivity to churn. |
| XR12 | Team shows the To do / In progress / Done work board with ownership domain and optional linked program/campaign; it does not rank people. |
| XR13 | Programs shows result over time against the declared target and visibly marks when the target is met. |
| XR14 | Every chart has a title, value scale, readable legend, time/window label, accessible text equivalent, keyboard-focusable marks or controls, and a contextual evidence path. Chart totals derive from prepared source-backed values. |

## Working interactions

| ID | Observable requirement |
|---|---|
| XR15 | Market, local-view, projection, funnel range/status, funnel status filters, Program Type/Status, and search controls update their exact chart or grid scope and remain keyboard operable. |
| XR16 | Inline edits and any optional detail surface preserve market, filters, local view, search, sort, table scroll, and current selection. |
| XR17 | Funnel edits per-market SLAs and candidate notes; Reporters exposes all three retained follow-ups; Team adds owned work; Programs edits notes and next step. Existing safe commands remain the production write path. |
| XR18 | A local interaction gives concise confirmation without adding a permanent canvas-feedback panel or manufacturing an operational outcome. |
| XR37 | Funnel has one overall and five status SLAs per market/default set; total and in-status elapsed days display `Under`, `At`, or `Over` with matching green/amber/red styling and immediately reflect SLA edits. |
| XR38 | Reporters shows applicable state/national certifications, last-active days, and clear/expiring/missing compliance evidence in separate columns. |
| XR39 | Team has no Late KPI/column and no attention box; Add work captures title, owner, status, domain, and optional linked program/campaign. |
| XR40 | Programs provides the locked Type categories, market-aware filtering, brief, implementation/review dates, goal, outcome, editable notes/next step, and workflow source. |

## Evidence

| ID | Observable requirement |
|---|---|
| XR19 | The page-level evidence list and duplicated local evidence blocks are absent. `Why this?` appears only for the currently selected context inside the shared drawer. |
| XR20 | Expanding `Why this?` shows the calculation, date/window, human-readable records, exclusions, unknowns, and limitations from the same EvidenceBundle. |
| XR21 | `Open the work` applies exact record filters without presenting metric IDs or filter-count prose as the primary user experience. |

## Responsive and accessible behavior

| ID | Observable requirement |
|---|---|
| XR22 | At 1440, 1280, 1024, 768, and 390 pixels there is no page-level horizontal overflow, clipped action, unreachable control, or overlapping content. No viewport is waived. |
| XR23 | At 390 pixels the drawer is full-screen, filters are operable, the primary chart remains understandable, and tables scroll only inside their container. |
| XR24 | Tabs, KPI controls, chart controls, tables, drawers, disclosures, and forms have meaningful names, visible focus, logical keyboard order, Escape/close behavior, and focus return. |
| XR25 | Status is never communicated by color alone, and reduced-motion/high-contrast behavior remains usable. |

## Quality and governance

| ID | Observable requirement |
|---|---|
| XR26 | The Experience Lead alone edits shared UI, shell, styles, Overview, and Funnel. After the proof gate, the Reporters, Team, and Programs Experience specialists each edit only their assigned feature path. Domain workers, when needed, make bounded logic-only repairs with no overlapping paths. |
| XR27 | Overview and Funnel pass screenshot and interaction review, and the shared presentation baseline is frozen, before Reporters, Team, and Programs presentation work begins. |
| XR28 | Quality verifies a fixed commit with browser interaction and screenshots. Defects return to the owning production lane and are rerun; Reviewer is not launched with failures or waivers. |
| XR29 | The original source/metric acceptance suite still passes; redesign actions do not manufacture readiness, acceptance, completion, program results, or rollout. |
| XR30 | Final review compares the live candidate with the JD, original V2 contracts, this P4 plan, and the declared reference principles—not merely with tests written against the implementation. |
| XR41 | Each workspace specialist uses the frozen shared components, sends component-contract questions and candidate/reference screenshot checkpoints to the Experience Lead, and receives Lead fidelity review before integration. The Lead alone changes shared components, and communication never expands a lane's write boundary. |

## Guided progress and responsible gamification

| ID | Observable requirement |
|---|---|
| XR31 | The five-workspace navigation is label-only: Overview → Funnel → Reporters → Team → Programs. There is no `Step X` text or second line inside a tab. |
| XR32 | No workspace renders the removed question/intro/review/mission/progress/next-milestone block. Source-backed readiness, acceptance, coverage, and completed work remain separate in the retained views. |
| XR33 | Tabs that include an attention list show at most three numbered work items. Team replaces that list with its Kanban board. Numbers prioritize work, never people. |
| XR34 | Successful production commands may give concise feedback in context; the canvas-only `What should change on …` form and discussion button are absent. Presentation-only clicks do not change progress. |
| XR35 | Resolved work changes state or leaves the queue only when canonical records change; dismissing or collapsing UI cannot manufacture completion. |
| XR36 | There are no points, streaks, trophies, arbitrary levels, employee/reporter leaderboards, opaque composite scores, or unsupported celebration states. |

## Synthetic sample depth

| ID | Observable requirement |
|---|---|
| SD01 | The P4 seed adds exactly 50 unique canonical fictional people and 50 first-time acquisition cases: ten owned by each of LAX, SFO, DFW, ORD, and ATL, with no duplicate identity across Funnel and Reporters. |
| SD02 | Each market has the exact active-funnel and ready-network composition in `P4_SYNTHETIC_SAMPLE_EXPANSION.md`, including useful Applicant, Screening, Approved, Onboarding, Starting soon, recent-active, and inactive examples. |
| SD03 | Each market's added Funnel rows supply two Under, two At, and two Over SLA-age inputs; its ready rows supply the required state/national credential mix and three Clear, one Expiring, and one Needs check compliance evidence pattern. |
| SD04 | Every added identity has a complete, ordered, referentially valid source graph for its intended state; reset is deterministic, IDs are stable, timestamps respect the frozen as-of time, and all provenance is synthetic. |
| SD05 | Existing named scenario IDs, checkpoint facts, program cohorts, and scenario feed remain unchanged. Aggregate UI counts and trends are derived from the expanded source records; no KPI total, SLA result, churn claim, compliance conclusion, or chart point is stored as a shortcut. |
| SD06 | Every market and All satisfies the noticeable source-derived trend thresholds in `P4_SYNTHETIC_SAMPLE_EXPANSION.md`: Overview supply/demand/need visibly rise and fall, and Funnel R28 contains a lifecycle-driven wait-time reversal, without changing metric definitions or storing chart points. |
| SD07 | The 50 P4 identities have 50 unique, natural-looking invented names with no `Fictional`, market, `Sample`, `Test`, `Person`, or numbered-fixture naming pattern and no copied known-person list. Synthetic provenance and the global disclosure remain intact. |

## Required screenshot matrix

| Surface | 1440 × 900 | 1024 × 768 | 768 × 1024 | 390 × 844 |
|---|---:|---:|---:|---:|
| Overview | Required | Required | Required | Required |
| Funnel — People and SLA grid | Required | Required | Required | Required |
| Funnel — Bottleneck trend | Required | Required | Required | Required |
| Reporters | Required | Optional | Optional | Required |
| Team | Required | Optional | Optional | Required |
| Programs | Required | Optional | Optional | Required |

The matrix is evidence for review. Passing images alone does not satisfy keyboard, action, data, or
record-reconciliation requirements. The package in `design-lock/reference-manifest.md` supplies the
approved 1440 × 900, 390 × 844, full-desktop, Funnel-SLA-open, and Team-Add-work-open comparison
states. The implementation candidate must additionally supply the required 1024 × 768 and 768 × 1024
captures.
